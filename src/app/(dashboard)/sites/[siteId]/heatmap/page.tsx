import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeatmapView } from "@/components/heatmap/heatmap-view";

export const dynamic = "force-dynamic";

export default async function HeatmapPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ path?: string; days?: string }>;
}) {
  const { siteId } = await params;
  const { path: selectedPath, days: selectedDays } = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .single();

  if (!site) redirect("/sites");

  const daysAgo = parseInt(selectedDays || "7", 10);
  const sinceDate = new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: pageViewData } = await supabase
    .from("page_views")
    .select("path, sessions!inner(site_id)")
    .eq("sessions.site_id", siteId)
    .gte("started_at", sinceDate);

  const paths = [
    ...new Set((pageViewData || []).map((pv: { path: string }) => pv.path)),
  ].sort();

  const activePath = selectedPath || paths[0] || "/";

  let clicks: {
    x: number;
    y: number;
    element_tag: string;
    element_class: string;
    element_id: string;
    element_text: string;
    is_rage_click: boolean;
    is_dead_click: boolean;
    timestamp: string;
    page_views: { path: string; viewport_width: number; viewport_height: number } | null;
  }[] = [];

  if (paths.length > 0) {
    const { data: clickData } = await supabase
      .from("click_events")
      .select(
        "x, y, element_tag, element_class, element_id, element_text, is_rage_click, is_dead_click, timestamp, page_views!inner(path, viewport_width, viewport_height, session_id, sessions!inner(site_id))"
      )
      .eq("page_views.sessions.site_id", siteId)
      .eq("page_views.path", activePath)
      .gte("timestamp", sinceDate)
      .limit(10000);

    clicks = clickData || [];
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/sites/${siteId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {site.name}
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Heatmap</h1>
        <p className="text-muted-foreground">{site.domain}</p>
      </div>

      <HeatmapView
        siteId={siteId}
        paths={paths}
        activePath={activePath}
        clicks={clicks.map((c) => ({
          x: c.x,
          y: c.y,
          element_tag: c.element_tag,
          is_rage_click: c.is_rage_click,
          is_dead_click: c.is_dead_click,
          viewport_width: c.page_views?.viewport_width || 1920,
          viewport_height: c.page_views?.viewport_height || 1080,
        }))}
        days={daysAgo}
      />
    </div>
  );
}
