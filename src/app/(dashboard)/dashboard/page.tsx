import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MousePointerClick,
  Users,
  Eye,
  Clock,
  AlertTriangle,
  MousePointer,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sites } = await supabase
    .from("sites")
    .select("id")
    .eq("user_id", user.id);

  const siteIds = (sites || []).map((s: { id: string }) => s.id);

  let totalSessions = 0;
  let totalPageviews = 0;
  let totalRageClicks = 0;
  let totalDeadClicks = 0;
  const topPages: { path: string; count: number }[] = [];

  if (siteIds.length > 0) {
    const { count: sessionCount } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .in("site_id", siteIds)
      .gte(
        "started_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    totalSessions = sessionCount || 0;

    const { count: pageviewCount } = await supabase
      .from("page_views")
      .select(
        "session_id!inner(site_id)",
        { count: "exact", head: true }
      )
      .gte(
        "started_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    totalPageviews = pageviewCount || 0;

    const { data: rageData } = await supabase
      .from("click_events")
      .select("id", { count: "exact" })
      .eq("is_rage_click", true)
      .gte(
        "timestamp",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );
    totalRageClicks = rageData?.length || 0;

    const { data: deadData } = await supabase
      .from("click_events")
      .select("id", { count: "exact" })
      .eq("is_dead_click", true)
      .gte(
        "timestamp",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );
    totalDeadClicks = deadData?.length || 0;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of the last 7 days
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pageviews
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPageviews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rage Clicks
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRageClicks}</div>
            <p className="text-xs text-muted-foreground">
              3+ rapid clicks on same element
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dead Clicks
            </CardTitle>
            <MousePointer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeadClicks}</div>
            <p className="text-xs text-muted-foreground">
              Clicks on non-interactive elements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sites
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteIds.length}</div>
            <p className="text-xs text-muted-foreground">
              Sites with tracking
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Session Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Collecting data...
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No pageview data yet. Add a site and install the tracking script to
              start collecting data.
            </p>
          ) : (
            <div className="space-y-2">
              {topPages.map((page) => (
                <div
                  key={page.path}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-mono">{page.path}</span>
                  <span className="text-sm text-muted-foreground">
                    {page.count} views
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
