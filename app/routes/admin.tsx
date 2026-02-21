import { type LoaderFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { Outlet, useLoaderData } from "@remix-run/react";
import { Sidebar } from "~/components/dashboard/Sidebar";
import { MobileNav } from "~/components/dashboard/MobileNav";
import { Toaster } from "~/components/ui/sonner";
import { requireUserId } from "~/utils/session.server";
import { getDb } from "~/utils/db.server";
import { UserRole } from "~/types";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isEmailVerified: true,
      profile: {
        select: {
          id: true,
          username: true,
        }
      }
    }
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Enforce Admin Role
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.BUSINESS_ADMIN) {
    return redirect("/dashboard");
  }

  return json({ user });
};

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <Sidebar user={user} />
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      <MobileNav />
      <Toaster />
    </div>
  );
}
