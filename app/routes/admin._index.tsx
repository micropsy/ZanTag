import { type LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getDb } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { UserRole } from "~/types";
import { AdminUserTable } from "~/components/admin/AdminUserTable";
import { AdminCompanyTable } from "~/components/admin/AdminCompanyTable";
import { InvitationManager } from "~/components/admin/InvitationManager";
import { SystemConfig } from "~/components/admin/SystemConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);

  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!currentUser || (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.BUSINESS_ADMIN)) {
    throw new Response("Unauthorized", { status: 403 });
  }

  // Fetch users for AdminUserTable
  // Only SUPER_ADMIN can see all users, BUSINESS_ADMIN sees their staff?
  // For now, let's assume SUPER_ADMIN sees all, BUSINESS_ADMIN sees nothing or limited.
  // The AdminUserTable component seems designed for SUPER_ADMIN user management.
  
  let users: { id: string; name: string | null; email: string; role: string }[] = [];
  let organizations: { id: string; name: string; slug: string; admin: { id: string; name: string | null; email: string } | null }[] = [];
  let admins: { id: string; name: string | null; email: string; role: string }[] = [];

  if (currentUser.role === UserRole.SUPER_ADMIN) {
    users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    organizations = await db.organization.findMany({
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    // Admins for dropdown in CompanyTable
    admins = users; // Reuse fetched users
  }

  return json({
    user: currentUser,
    users,
    organizations,
    admins,
  });
};

export default function AdminDashboard() {
  const { user, users, organizations, admins } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Admin Portal</h2>
        <p className="text-slate-500">Manage users, organizations, and system settings.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          {user.role === UserRole.SUPER_ADMIN && (
            <>
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
              <TabsTrigger value="settings">System Config</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all registered users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUserTable users={users} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Codes</CardTitle>
              <CardDescription>
                Create and manage invite codes for new users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationManager user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === UserRole.SUPER_ADMIN && (
          <>
            <TabsContent value="organizations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>
                    Manage companies and their administrators.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminCompanyTable initial={organizations} admins={admins} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <SystemConfig user={user} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
