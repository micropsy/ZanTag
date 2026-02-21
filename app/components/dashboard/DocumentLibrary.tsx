import { useState, useRef } from "react";
import type { Document as PrismaDocument } from "@prisma/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { FileText, Plus, Trash2, ExternalLink, Upload, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, getPublicUrl } from "~/services/storage.service";
import { EmptyState } from "./EmptyState";

interface DocumentLibraryProps {
  initialDocuments: PrismaDocument[];
  profileId: string;
}

export function DocumentLibrary({ initialDocuments, profileId }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<PrismaDocument[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: "", url: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading PDF...");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}/${Math.random()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      await uploadFile('zantag-docs', filePath, file);
      const publicUrl = getPublicUrl('zantag-docs', filePath);

      setNewDoc(prev => ({ ...prev, url: publicUrl, title: prev.title || file.name.replace('.pdf', '') }));
      toast.success("PDF uploaded successfully!", { id: toastId });
    } catch (error) {
      console.error("UPLOAD_ERROR", error);
      toast.error("Failed to upload PDF", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.url) return;

    setLoading(true);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newDoc, profileId }),
      });

      if (response.ok) {
        const doc = await response.json() as PrismaDocument;
        setDocuments([doc, ...documents]);
        setNewDoc({ title: "", url: "" });
        toast.success("Document added");
      }
    } catch (error) {
      console.error("DOC_ADD_ERROR", error);
      toast.error("Failed to add document");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments(documents.filter((doc) => doc.id !== id));
        toast.success("Document deleted");
      }
    } catch (error) {
      console.error("DOC_DELETE_ERROR", error);
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Add Document</CardTitle>
          <CardDescription>Link your company PDFs or presentation slides.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Company Profile" 
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                required
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">PDF URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="url" 
                  placeholder="https://..." 
                  value={newDoc.url}
                  onChange={(e) => setNewDoc({ ...newDoc, url: e.target.value })}
                  required
                  className="h-11 text-base"
                />
                <Input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload PDF"
                >
                  <Upload className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> {loading ? "Adding..." : "Add PDF"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="border-none shadow-sm bg-white/50 backdrop-blur-sm group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{doc.title}</h4>
                  <p className="text-xs text-slate-500">PDF Document</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" asChild>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && (
          <div className="col-span-full">
            <EmptyState 
              icon={FolderOpen} 
              title="Library is Empty" 
              description="Upload your professional PDFs or portfolio items to share with others."
            />
          </div>
        )}
      </div>
    </div>
  );
}
