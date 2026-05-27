import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReplayPlayer } from "@/components/replay/replay-player";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ siteId: string; sessionId: string }>;
}) {
  const { siteId, sessionId } = await params;
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

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session || session.site_id !== siteId) redirect(`/sites/${siteId}/sessions`);

  const { data: pageViews } = await supabase
    .from("page_views")
    .select(
      "*, click_events(*), scroll_events(*)"
    )
    .eq("session_id", sessionId)
    .order("started_at", { ascending: true });

  const replayData = (pageViews || []).map(
    (pv: {
      id: string;
      url: string;
      path: string;
      started_at: string;
      ended_at: string | null;
      viewport_width: number | null;
      viewport_height: number | null;
      click_events: {
        id: string;
        x: number;
        y: number;
        element_tag: string;
        element_text: string;
        is_rage_click: boolean;
        is_dead_click: boolean;
        timestamp: string;
      }[];
      scroll_events: {
        id: string;
        scroll_depth_percent: number;
        timestamp: string;
      }[];
    }) => ({
      id: pv.id,
      url: pv.url,
      path: pv.path,
      started_at: pv.started_at,
      ended_at: pv.ended_at,
      viewport_width: pv.viewport_width,
      viewport_height: pv.viewport_height,
      clicks: (pv.click_events || []).map((ce) => ({
        x: ce.x,
        y: ce.y,
        element_tag: ce.element_tag,
        element_text: ce.element_text,
        is_rage_click: ce.is_rage_click,
        is_dead_click: ce.is_dead_click,
        timestamp: ce.timestamp,
      })),
      scrolls: (pv.scroll_events || []).map((se) => ({
        scroll_depth_percent: se.scroll_depth_percent,
        timestamp: se.timestamp,
      })),
    })
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/sites/${siteId}/sessions`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Session Replay</h1>
        <p className="text-muted-foreground">
          {site.domain} &bull;{" "}
          {new Date(session.started_at).toLocaleString()}
        </p>
      </div>

      <ReplayPlayer
        session={{
          id: session.id,
          visitor_id: session.visitor_id,
          started_at: session.started_at,
          ended_at: session.ended_at,
          device_type: session.device_type,
          viewport_width: session.viewport_width,
          viewport_height: session.viewport_height,
        }}
        pageViews={replayData}
      />
    </div>
  );
}
