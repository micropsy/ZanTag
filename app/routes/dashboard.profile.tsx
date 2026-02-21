import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getDb } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save, Link as LinkIcon, Palette, User, Globe } from "lucide-react";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);

  const profile = await db.profile.findUnique({
    where: { userId },
    include: {
      links: true,
    },
  });

  if (!profile) {
    return redirect("/dashboard");
  }

  return json({ profile });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);
  
  // Verify profile ownership
  const existingProfile = await db.profile.findUnique({
    where: { userId },
  });

  if (!existingProfile) {
    return json({ error: "Profile not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update-profile") {
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const username = formData.get("username") as string; // slug
    const primaryColor = formData.get("primaryColor") as string;
    const secondaryColor = formData.get("secondaryColor") as string;
    const linksJson = formData.get("links") as string;

    // Validate slug uniqueness if changed
    if (username && username !== existingProfile.username) {
      const slugExists = await db.profile.findUnique({
        where: { username },
      });
      if (slugExists) {
        return json({ error: "Username/Slug already taken" }, { status: 400 });
      }
    }

    try {
      // Parse links
      const links = JSON.parse(linksJson || "[]");

      // Update profile
      await db.profile.update({
        where: { id: existingProfile.id },
        data: {
          displayName,
          bio,
          username,
          primaryColor,
          secondaryColor,
        },
      });

      // Handle links update
      // Strategy: Delete all existing links and recreate them to ensure sync
      // Ideally we should update existing ones, but this is simpler for now
      // and safe enough for this scale.
      
      // Get current links to minimize churn if needed, but for now full replace
      await db.link.deleteMany({
        where: { profileId: existingProfile.id },
      });

      if (links.length > 0) {
        await db.link.createMany({
          data: links.map((link: { title: string; url: string; type?: string; icon?: string }) => ({
            profileId: existingProfile.id,
            title: link.title,
            url: link.url,
            type: link.type || "SOCIAL",
            icon: link.icon || null,
          })),
        });
      }

      return json({ success: true });
    } catch (error) {
      console.error("Profile update error:", error);
      return json({ error: "Failed to update profile" }, { status: 500 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function ProfilePage() {
  const { profile } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  
  const [formData, setFormData] = useState({
    displayName: profile.displayName || "",
    bio: profile.bio || "",
    username: profile.username || "",
    primaryColor: profile.primaryColor || "#0F172A",
    secondaryColor: profile.secondaryColor || "#06B6D4",
  });

  // Allow links to be partial during editing (optimistic UI)
  type LinkItem = {
    id: string;
    title: string;
    url: string;
    type: string;
    icon?: string | null;
    profileId?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  };

  const [links, setLinks] = useState<LinkItem[]>(profile.links || []);
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    const data = fetcher.data as { success?: boolean; error?: string } | undefined;
    if (data?.success) {
      toast.success("Profile updated successfully");
    } else if (data?.error) {
      toast.error(data.error);
    }
  }, [fetcher.data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addLink = () => {
    setLinks([...links, { id: `temp-${Date.now()}`, title: "", url: "", type: "SOCIAL" }]);
  };

  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const updateLink = (index: number, field: string, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const handleSubmit = () => {
    const submitData = new FormData();
    submitData.append("intent", "update-profile");
    submitData.append("displayName", formData.displayName);
    submitData.append("bio", formData.bio);
    submitData.append("username", formData.username);
    submitData.append("primaryColor", formData.primaryColor);
    submitData.append("secondaryColor", formData.secondaryColor);
    submitData.append("links", JSON.stringify(links));
    
    fetcher.submit(submitData, { method: "post" });
  };

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
          <p className="text-slate-500 text-sm">Customize how others see your digital card.</p>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto"
        >
          {isSubmitting ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName" 
                  name="displayName" 
                  value={formData.displayName} 
                  onChange={handleInputChange} 
                  placeholder="e.g. John Doe" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Title</Label>
                <Textarea 
                  id="bio" 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleInputChange} 
                  placeholder="Tell people about yourself..." 
                  className="resize-none min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Profile URL Slug</Label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-md px-3 py-2 text-slate-500 text-sm">
                    zantag.com/
                  </span>
                  <Input 
                    id="username" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleInputChange} 
                    className="rounded-l-none"
                    placeholder="username" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-teal-600" />
                Links & Socials
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addLink}>
                <Plus className="w-4 h-4 mr-1" /> Add Link
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {links.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No links added yet.</p>
                  <Button variant="link" onClick={addLink} className="text-teal-600">
                    Add your first link
                  </Button>
                </div>
              ) : (
                links.map((link, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 bg-white rounded-lg border border-slate-200 group">
                    <div className="grid gap-3 flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input 
                          placeholder="Link Title (e.g. Website)" 
                          value={link.title}
                          onChange={(e) => updateLink(index, "title", e.target.value)}
                        />
                        <Input 
                          placeholder="URL (https://...)" 
                          value={link.url}
                          onChange={(e) => updateLink(index, "url", e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => removeLink(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Appearance */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-teal-600" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="color" 
                    id="primaryColor" 
                    name="primaryColor" 
                    value={formData.primaryColor} 
                    onChange={handleInputChange} 
                    className="w-12 h-12 p-1 cursor-pointer"
                  />
                  <Input 
                    value={formData.primaryColor} 
                    onChange={handleInputChange} 
                    name="primaryColor"
                    className="flex-1 font-mono"
                  />
                </div>
                <p className="text-xs text-slate-500">Used for buttons and headers.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="color" 
                    id="secondaryColor" 
                    name="secondaryColor" 
                    value={formData.secondaryColor} 
                    onChange={handleInputChange} 
                    className="w-12 h-12 p-1 cursor-pointer"
                  />
                  <Input 
                    value={formData.secondaryColor} 
                    onChange={handleInputChange} 
                    name="secondaryColor"
                    className="flex-1 font-mono"
                  />
                </div>
                <p className="text-xs text-slate-500">Used for accents and highlights.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Globe className="w-5 h-5 text-teal-400" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[9/16] bg-white rounded-3xl overflow-hidden relative shadow-inner">
                {/* Mock Phone Preview */}
                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center pt-8 px-4">
                  <div 
                    className="w-20 h-20 rounded-full mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    {formData.displayName?.[0] || "?"}
                  </div>
                  <h3 className="font-bold text-slate-900 text-center">{formData.displayName || "Your Name"}</h3>
                  <p className="text-xs text-slate-500 text-center mt-1">{formData.bio || "Your Bio"}</p>
                  
                  <div className="w-full mt-6 space-y-2">
                    {links.map((link, i) => (
                      <div 
                        key={i} 
                        className="w-full p-2 rounded-lg text-center text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: formData.secondaryColor }}
                      >
                        {link.title || "Link Title"}
                      </div>
                    ))}
                    {links.length === 0 && (
                      <div className="w-full p-2 rounded-lg bg-slate-200 text-slate-400 text-center text-xs">
                        Links will appear here
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">
                Live preview of your digital card
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from "~/components/RouteErrorBoundary";
