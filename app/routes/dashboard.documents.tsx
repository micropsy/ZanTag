import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs, unstable_parseMultipartFormData, type UploadHandler } from "@remix-run/cloudflare";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { getDb } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { FileText, Plus, Trash2, ExternalLink, Upload, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "~/components/dashboard/EmptyState";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);

  const profile = await db.profile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!profile) {
    return redirect("/dashboard");
  }

  const documents = await db.document.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" }
  });

  return json({ documents, profileId: profile.id });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);
  const bucket = context.cloudflare.env.BUCKET;

  // Verify profile ownership
  const profile = await db.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return json({ error: "Profile not found" }, { status: 404 });
  }

  // Handle file upload
  const uploadHandler: UploadHandler = async ({ name, filename, data, contentType }) => {
    if (name !== "file" || !filename) {
      return undefined;
    }
    
    // Create a unique filename
    const key = `${profile.id}/${Date.now()}-${filename}`;
    
    // Convert AsyncIterable<Uint8Array> to ArrayBuffer or stream
    // R2 put accepts ArrayBuffer, ArrayBufferView, ReadableStream, etc.
    // data is AsyncIterable<Uint8Array>
    
    // We can collect the chunks into a single Uint8Array for simplicity
    // This is memory intensive but works for small files
    const chunks = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }
    const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    await bucket.put(key, buffer, {
      httpMetadata: { contentType },
    });

    // Return the public URL (assuming public access is enabled or we proxy)
    // For now, we'll store the key and construct URL later, or if R2 dev URL is enabled
    // Ideally we need a domain for R2 public access
    // Let's assume we can serve it via a resource route if needed, or R2 public bucket URL
    // For this implementation, I'll return the key.
    return key;
  };

  const formData = await unstable_parseMultipartFormData(request, uploadHandler);
  const intent = formData.get("intent");

  if (intent === "upload-document") {
    const title = formData.get("title") as string;
    const fileKey = formData.get("file") as string; // This will be the key returned by uploadHandler

    if (!title || !fileKey) {
      return json({ error: "Title and File are required" }, { status: 400 });
    }

    // Construct a URL. If R2 public access is not set up, we might need a proxy route.
    // For now, let's assume a public R2 bucket URL pattern or a placeholder.
    // If you have a custom domain for R2, use that.
    // Or we can create a proxy route /resources/documents/$key
    // Let's use a proxy route pattern for safety: /resources/file/$key
    const url = `/resources/file/${fileKey}`;

    try {
      await db.document.create({
        data: {
          profileId: profile.id,
          title,
          url, // Storing the proxy URL
        },
      });
      return json({ success: true });
    } catch (error) {
      console.error("Create document error:", error);
      return json({ error: "Failed to create document record" }, { status: 500 });
    }
  }

  if (intent === "delete-document") {
    const documentId = formData.get("documentId") as string;
    
    const doc = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.profileId !== profile.id) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      // Extract key from URL if possible, or just delete the record
      // URL format: /resources/file/profileId/timestamp-filename
      const key = doc.url.replace("/resources/file/", "");
      
      // Delete from R2
      await bucket.delete(key);

      // Delete from DB
      await db.document.delete({
        where: { id: documentId },
      });
      
      return json({ success: true });
    } catch (error) {
      console.error("Delete document error:", error);
      return json({ error: "Failed to delete document" }, { status: 500 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function DocumentsPage() {
  const { documents } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    const data = fetcher.data as { success?: boolean; error?: string } | undefined;
    if (data?.success) {
      toast.success("Operation successful");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else if (data?.error) {
      toast.error(data.error);
    }
  }, [fetcher.data]);

  const handleFileUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    formData.append("intent", "upload-document");
    
    fetcher.submit(formData, { 
      method: "post", 
      encType: "multipart/form-data" 
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    const formData = new FormData();
    formData.append("intent", "delete-document");
    formData.append("documentId", id);
    
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Document Library</h2>
          <p className="text-slate-500 text-sm">Upload and share your PDFs with your contacts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" />
                Upload Document
              </CardTitle>
              <CardDescription>
                Share PDFs, Menus, or Brochures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="e.g. Service Menu" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">PDF File</Label>
                  <Input 
                    id="file" 
                    name="file" 
                    type="file" 
                    accept=".pdf"
                    ref={fileInputRef}
                    required 
                    className="cursor-pointer"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isSubmitting ? "Uploading..." : <><Plus className="w-4 h-4 mr-2" /> Add Document</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Your Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <EmptyState 
                  icon={FolderOpen} 
                  title="No Documents" 
                  description="Upload your first document to share it with your network."
                />
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: { id: string; title: string; url: string }) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 group hover:border-teal-200 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-slate-900 truncate">{doc.title}</h4>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 truncate"
                          >
                            View PDF <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-red-500 flex-shrink-0"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from "~/components/RouteErrorBoundary";
