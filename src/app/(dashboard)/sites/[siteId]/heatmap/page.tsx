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

  const paths = Array.from(
    new Set((pageViewData || []).map((pv: { path: string }) => pv.path))
  ).sort();

  const activePath = selectedPath || paths[0] || "/";

  let clicks: {
    x: number;
    y: number;
    element_tag: string;
    is_rage_click: boolean;
    is_dead_click: boolean;
    viewport_width: number;
    viewport_height: number;
  }[] = [];

  if (paths.length > 0) {
    const { data: clickData } = await supabase
      .from("click_events")
      .select(
        "x, y, element_tag, is_rage_click, is_dead_click, page_views!inner(path, viewport_width, viewport_height, sessions!inner(site_id))"
      )
      .eq("page_views.sessions.site_id", siteId)
      .eq("page_views.path", activePath)
      .gte("timestamp", sinceDate)
      .limit(10000);

    clicks = (clickData || []).map((c: Record<string, unknown>) => {
      const pv = c.page_views as unknown as { viewport_width: number; viewport_height: number }[];
      return {
        x: c.x as number,
        y: c.y as number,
        element_tag: (c.element_tag as string) || "",
        is_rage_click: c.is_rage_click as boolean,
        is_dead_click: c.is_dead_click as boolean,
        viewport_width: pv?.[0]?.viewport_width || 1920,
        viewport_height: pv?.[0]?.viewport_height || 1080,
      };
    });
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
        clicks={clicks}
        days={daysAgo}
      />
    </div>
  );
}
