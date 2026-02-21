import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { Profile, Link as PrismaLink } from "@prisma/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save, Link as LinkIcon } from "lucide-react";
import { EmptyState } from "~/components/dashboard/EmptyState";

interface ProfileEditorProps {
  profile: Profile & { links: PrismaLink[] };
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: profile.bio || "",
    primaryColor: profile.primaryColor || "#0F172A",
    secondaryColor: profile.secondaryColor || "#06B6D4",
    username: profile.username || "",
  });
  const [links, setLinks] = useState<Partial<PrismaLink>[]>(profile.links);

  const baseUrl =
    (typeof window !== "undefined" ? window.location.origin : "");
  const displayDomain = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const getLinkByType = (type: string) => links.find((l) => (l.type || "SOCIAL") === type);
  const setLinkByType = (type: string, title: string, url: string) => {
    const existingIndex = links.findIndex((l) => (l.type || "SOCIAL") === type);
    const newEntry = { ...(existingIndex >= 0 ? links[existingIndex] : {}), title, url, type };
    if (existingIndex >= 0) {
      const next = [...links];
      next[existingIndex] = newEntry;
      setLinks(next);
    } else {
      setLinks([...links, newEntry]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, links }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      navigate(".", { replace: true });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { title: "", url: "", type: "SOCIAL" }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof PrismaLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
          <p className="text-slate-500 text-sm">Customize how others see your digital card.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Public Profile URL</CardTitle>
              <CardDescription>Customize your profile link and share your card.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Custom URL</Label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-slate-100 rounded-lg text-slate-500 text-sm border border-slate-200">
                    {displayDomain}/
                  </div>
                  <Input 
                    id="username" 
                    placeholder="your-name" 
                    value={formData.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    className="flex-1 h-11 text-base"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Only letters, numbers, and hyphens allowed.</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Permanent URL (Always Works)</Label>
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <code className="text-xs text-teal-600 font-mono">
                    {displayDomain}/c/{profile.username}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(`${baseUrl}/c/${profile.username}`);
                      toast.success("Permanent link copied!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                  Use this link for physical NFC cards. It will never change even if you update your Custom URL.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your bio and description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself..." 
                  value={formData.bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Contact Methods</CardTitle>
              <CardDescription>These appear at the top of your public card.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+95 9 123 456 789"
                    value={(getLinkByType("PHONE")?.url || "").replace(/^tel:/, "")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkByType("PHONE", "Phone", `tel:${e.target.value}`)}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Public Email</Label>
                  <Input
                    id="email"
                    placeholder="you@example.com"
                    value={(getLinkByType("EMAIL")?.url || "").replace(/^mailto:/, "")}
                    onChange={(e) => setLinkByType("EMAIL", "Email", `mailto:${e.target.value}`)}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://your-website.com"
                    value={getLinkByType("WEBSITE")?.url || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkByType("WEBSITE", "Website", e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Yangon, Myanmar"
                    value={decodeURIComponent((getLinkByType("ADDRESS")?.url || "").replace(/^https?:\/\/(www\.)?google\.com\/maps\/search\/\?api=1&query=/, ""))}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLinkByType(
                        "ADDRESS",
                        "Location",
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.target.value)}`
                      )
                    }
                    className="h-11 text-base"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Tip: Phone and Email will open your dialer or mail app. Location uses Google Maps.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Social & Custom Links</CardTitle>
                <CardDescription>Add links to your social media or websites.</CardDescription>
              </div>
              <Button onClick={addLink} variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                <Plus className="w-4 h-4 mr-1" /> Add Link
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {links.map((link, index) => (
                <div key={index} className="flex gap-4 items-start p-4 rounded-lg bg-slate-50 border border-slate-100 group">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Title</Label>
                      <Input 
                        placeholder="e.g. LinkedIn" 
                        value={link.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink(index, "title", e.target.value)}
                        className="h-11 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">URL</Label>
                      <Input 
                        placeholder="https://..." 
                        value={link.url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink(index, "url", e.target.value)}
                        className="h-11 text-base"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-rose-500 mt-6"
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {links.length === 0 && (
                <EmptyState 
                  icon={LinkIcon} 
                  title="No Links Added" 
                  description="Add your social profiles, websites, or portfolio links to showcase your work."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Choose your theme colors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="primaryColor" 
                    value={formData.primaryColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-10 p-1 rounded-md cursor-pointer"
                  />
                  <Input 
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color (Teal)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="secondaryColor" 
                    value={formData.secondaryColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-12 h-10 p-1 rounded-md cursor-pointer"
                  />
                  <Input 
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-4">Preview on card:</p>
                <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg relative bg-white border border-slate-100">
                   <div style={{ backgroundColor: formData.primaryColor }} className="h-20 w-full" />
                   <div className="absolute top-12 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white bg-slate-200 shadow-sm" />
                   <div className="mt-10 p-4 text-center">
                     <div className="h-4 w-24 bg-slate-200 mx-auto rounded mb-2" />
                     <div className="h-3 w-32 bg-slate-100 mx-auto rounded" />
                     <div style={{ backgroundColor: formData.secondaryColor }} className="mt-4 h-8 w-full rounded-md" />
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
