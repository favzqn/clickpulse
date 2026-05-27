import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getRedis } from "@/lib/redis";
import { RATE_LIMIT_PER_MINUTE } from "@/lib/constants";

const EventSchema = z.object({
  type: z.enum(["click", "scroll", "pageview"]),
  timestamp: z.number(),
  x: z.number().optional(),
  y: z.number().optional(),
  element_tag: z.string().optional(),
  element_class: z.string().optional(),
  element_id: z.string().optional(),
  element_text: z.string().optional(),
  is_rage_click: z.boolean().optional(),
  is_dead_click: z.boolean().optional(),
  scroll_depth_percent: z.number().optional(),
  url: z.string().optional(),
  path: z.string().optional(),
  referrer: z.string().optional(),
  viewport_width: z.number().optional(),
  viewport_height: z.number().optional(),
});

const PayloadSchema = z.object({
  site_key: z.string().min(1),
  visitor_id: z.string().min(1),
  session_id: z.string().min(1),
  events: z.array(EventSchema).min(1).max(500),
});

export async function POST(request: Request) {
  const redis = getRedis();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (redis) {
    const key = `rate:ingest:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60);
    }
    if (count > RATE_LIMIT_PER_MINUTE) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { site_key, visitor_id, session_id, events } = parsed.data;

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("tracking_key", site_key)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Invalid site key" }, { status: 404 });
  }

  const sessionId = session_id;

  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", session_id)
    .single();

  if (!existingSession) {
    const firstPv = events.find((e) => e.type === "pageview");
    const deviceType =
      (firstPv?.viewport_width || 1920) < 768
        ? "mobile"
        : (firstPv?.viewport_width || 1920) < 1024
          ? "tablet"
          : "desktop";

    const { data: newSession, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        id: session_id,
        site_id: site.id,
        visitor_id,
        device_type: deviceType,
        viewport_width: firstPv?.viewport_width || null,
        viewport_height: firstPv?.viewport_height || null,
      })
      .select("id")
      .single();

    if (sessionError || !newSession) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
  }

  let currentPageViewId: string | null = null;
  const pageViewMap = new Map<string, string>();

  for (const event of events) {
    if (event.type === "pageview" && event.url && event.path) {
      const { data: pv, error: pvError } = await supabase
        .from("page_views")
        .insert({
          session_id: sessionId,
          url: event.url,
          path: event.path,
          referrer: event.referrer || null,
          viewport_width: event.viewport_width || null,
          viewport_height: event.viewport_height || null,
        })
        .select("id")
        .single();

      if (!pvError && pv) {
        currentPageViewId = pv.id;
        pageViewMap.set(event.path, pv.id);
      }
    }
  }

  if (!currentPageViewId) {
    const { data: latestPv } = await supabase
      .from("page_views")
      .select("id")
      .eq("session_id", sessionId)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (latestPv) {
      currentPageViewId = latestPv.id;
    }
  }

  if (!currentPageViewId) {
    return NextResponse.json({ received: true }, { status: 204 });
  }

  const clickEvents = events
    .filter((e) => e.type === "click")
    .map((e) => ({
      page_view_id: currentPageViewId,
      x: e.x || 0,
      y: e.y || 0,
      element_tag: e.element_tag || null,
      element_class: e.element_class || null,
      element_id: e.element_id || null,
      element_text: e.element_text || null,
      is_rage_click: e.is_rage_click || false,
      is_dead_click: e.is_dead_click || false,
      timestamp: new Date(e.timestamp).toISOString(),
    }));

  const scrollEvents = events
    .filter((e) => e.type === "scroll")
    .map((e) => ({
      page_view_id: currentPageViewId,
      scroll_depth_percent: e.scroll_depth_percent || 0,
      timestamp: new Date(e.timestamp).toISOString(),
    }));

  if (clickEvents.length > 0) {
    await supabase.from("click_events").insert(clickEvents);
  }

  if (scrollEvents.length > 0) {
    await supabase.from("scroll_events").insert(scrollEvents);
  }

  await supabase
    .from("sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  return new NextResponse(null, { status: 204 });
}
