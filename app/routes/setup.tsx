import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { getDb } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { Loader2, User, Type, AlignLeft } from "lucide-react";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);

  const profile = await db.profile.findUnique({
    where: { userId },
  });

  if (profile) {
    return redirect("/dashboard");
  }

  return json({});
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const username = formData.get("username");
  const displayName = formData.get("displayName");
  const bio = formData.get("bio");

  if (typeof username !== "string" || username.length < 3) {
    return json({ error: "Username must be at least 3 characters long." }, { status: 400 });
  }

  if (typeof displayName !== "string" || displayName.length === 0) {
    return json({ error: "Display Name is required." }, { status: 400 });
  }

  const db = getDb(context);

  try {
    // Check if username is taken
    const existingProfile = await db.profile.findUnique({
      where: { username },
    });

    if (existingProfile) {
      return json({ error: "Username is already taken." }, { status: 400 });
    }

    await db.profile.create({
      data: {
        userId,
        username,
        displayName,
        bio: typeof bio === "string" ? bio : null,
      },
    });

    return redirect("/dashboard");
  } catch (error) {
    console.error("Profile setup error:", error);
    return json({ error: "Failed to create profile. Please try again." }, { status: 500 });
  }
};

export default function Setup() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ZanTag" className="w-16 h-16 rounded-xl mx-auto mb-4 object-cover" />
          <h1 className="text-2xl font-bold text-slate-900">Setup Your Profile</h1>
          <p className="text-slate-500 mt-2">Let&apos;s get your digital card ready.</p>
        </div>

        <Form method="post" className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
              <input
                type="text"
                id="username"
                name="username"
                required
                minLength={3}
                placeholder="johndoe"
                className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-400">This will be your unique profile URL.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-400" />
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              required
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-slate-400" />
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="Tell us a bit about yourself..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>

          {actionData && "error" in actionData && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {actionData.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              "Complete Setup"
            )}
          </button>
        </Form>
      </div>
    </div>
  );
}
