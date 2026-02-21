import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { useFetcher, Form } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { getDb } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { toast } from "sonner";
import { Lock, LogOut } from "lucide-react";
import { compare, hash } from "bcrypt-ts";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return json({});
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "change-password") {
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return json({ error: "New passwords do not match" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await compare(currentPassword, user.password);

    if (!isValid) {
      return json({ error: "Incorrect current password" }, { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 10);

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function SettingsPage() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);
  
  useEffect(() => {
    const data = fetcher.data as { success?: boolean; error?: string } | undefined;
    if (fetcher.state === "idle" && data?.success) {
      toast.success("Password updated successfully");
      formRef.current?.reset();
    } else if (fetcher.state === "idle" && data?.error) {
      toast.error(data.error);
    }
  }, [fetcher.state, fetcher.data]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    formData.append("intent", "change-password");
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm">Manage your profile and system configuration.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-teal-600" />
              Change Password
            </CardTitle>
            <CardDescription>Ensure your account is secure by using a strong password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="w-5 h-5" />
              Sign Out
            </CardTitle>
            <CardDescription>Sign out of your account on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form action="/logout" method="post">
              <Button variant="destructive" type="submit">
                Sign Out
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
