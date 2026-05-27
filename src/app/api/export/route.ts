import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan || "free";
  if (plan === "free") {
    return NextResponse.json(
      { error: "Export is available on Pro and Team plans" },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId");
  const type = url.searchParams.get("type") || "clicks";
  const days = parseInt(url.searchParams.get("days") || "7", 10);

  if (!siteId) {
    return NextResponse.json({ error: "siteId required" }, { status: 400 });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const sinceDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  let csv = "";

  if (type === "clicks") {
    const { data } = await supabase
      .from("click_events")
      .select(
        "x, y, element_tag, element_class, element_id, element_text, is_rage_click, is_dead_click, timestamp, page_views!inner(path, session_id, sessions!inner(site_id))"
      )
      .eq("page_views.sessions.site_id", siteId)
      .gte("timestamp", sinceDate)
      .limit(50000);

    csv =
      "timestamp,path,x,y,element_tag,element_class,element_id,element_text,is_rage_click,is_dead_click\n";
    for (const row of data || []) {
      const pv = row.page_views as unknown as { path: string } | null;
      csv += `"${row.timestamp}","${pv?.path || ""}",${row.x},${row.y},"${row.element_tag || ""}","${(row.element_class || "").replace(/"/g, '""')}","${row.element_id || ""}","${(row.element_text || "").replace(/"/g, '""')}",${row.is_rage_click},${row.is_dead_click}\n`;
    }
  } else if (type === "sessions") {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("site_id", siteId)
      .gte("started_at", sinceDate)
      .limit(10000);

    csv =
      "id,visitor_id,started_at,ended_at,page_count,device_type,viewport_width,viewport_height\n";
    for (const row of data || []) {
      csv += `"${row.id}","${row.visitor_id}","${row.started_at}","${row.ended_at || ""}",${row.page_count},"${row.device_type || ""}",${row.viewport_width || ""},${row.viewport_height || ""}\n`;
    }
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="clickpulse-${type}-${days}d.csv"`,
    },
  });
}
