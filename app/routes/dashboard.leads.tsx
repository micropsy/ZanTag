import { type LoaderFunctionArgs, type ActionFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getDb } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { LeadsList } from "~/components/dashboard/LeadsList";
import { ManualLeadForm } from "~/components/dashboard/ManualLeadForm";

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

  const leads = await db.contact.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" }
  });

  return json({ leads, profileId: profile.id });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create-lead") {
    const profileId = formData.get("profileId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const source = formData.get("source") as string;

    if (!name) {
      return json({ error: "Name is required" }, { status: 400 });
    }

    const db = getDb(context);
    
    // Verify profile ownership
    const profile = await db.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile || profile.userId !== userId) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      await db.contact.create({
        data: {
          profileId,
          name,
          email: email || null,
          phone: phone || null,
          notes: notes || null,
          source: source || "MANUAL",
        },
      });
      return json({ success: true });
    } catch (error) {
      console.error("Create lead error:", error);
      return json({ error: "Failed to create lead" }, { status: 500 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function LeadsPage() {
  const { leads, profileId } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leads Manager</h2>
          <p className="text-slate-500 text-sm">Manage and export contacts captured through your profile.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ManualLeadForm profileId={profileId} />
        </div>
        <div className="lg:col-span-2">
          <LeadsList leads={leads} />
        </div>
      </div>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from "~/components/RouteErrorBoundary";
