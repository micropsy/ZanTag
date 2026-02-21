import { json, redirect, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getDb } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Users, Eye, MousePointer2, TrendingUp, Calendar, ArrowUpRight, Activity } from "lucide-react";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const db = getDb(context);

  const profile = await db.profile.findUnique({
    where: { userId },
    include: {
      contacts: {
        orderBy: { createdAt: 'desc' },
        take: 5 // Get recent 5 leads for activity feed
      },
      _count: {
        select: {
          contacts: true,
          documents: true,
          links: true
        }
      }
    }
  });

  if (!profile) {
    return redirect("/dashboard");
  }

  // Calculate monthly leads
  // Since we only fetched 5 contacts above, we need a separate aggregation for the chart if we want full history
  // But for now let's just do a simple aggregation of all contacts if needed, or just stick to total counts.
  // To get the chart data properly, we should fetch all contacts timestamps.
  const allContacts = await db.contact.findMany({
    where: { profileId: profile.id },
    select: { createdAt: true }
  });

  const leadsByMonth = allContacts.reduce((acc: Record<string, number>, contact) => {
    const date = new Date(contact.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(leadsByMonth).map(([name, total]) => ({ name, total }));

  return json({ 
    profile, 
    stats: {
      views: profile.views,
      leads: profile._count.contacts,
      documents: profile._count.documents,
      links: profile._count.links,
      chartData
    } 
  });
};

export default function AnalyticsPage() {
  const { profile, stats } = useLoaderData<typeof loader>();

  const conversionRate = stats.views > 0 
    ? ((stats.leads / stats.views) * 100).toFixed(1) 
    : "0";

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h2>
        <p className="text-slate-500">Track your profile performance and lead generation.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Views */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Views</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.views}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
              All time visits
            </p>
          </CardContent>
        </Card>

        {/* Total Leads */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
            <div className="p-2 bg-teal-50 rounded-lg">
              <Users className="w-4 h-4 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.leads}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
              People who shared info
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{conversionRate}%</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              Visitor to Lead ratio
            </p>
          </CardContent>
        </Card>

        {/* Active Content */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Active Content</CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <MousePointer2 className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.links + stats.documents}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.links} Links, {stats.documents} Docs
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest interactions with your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.contacts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                        {contact.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {contact.name} shared their details
                        </p>
                        <p className="text-xs text-slate-500">
                          via {contact.source}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from "~/components/RouteErrorBoundary";
