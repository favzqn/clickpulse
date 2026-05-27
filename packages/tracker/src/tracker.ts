import type { TrackerEvent, IngestPayload, TrackerConfig } from "./types";
import { getVisitorId, getSessionId, touchSession } from "./session";

const BATCH_INTERVAL = 5000;
const MAX_TEXT_LENGTH = 100;
const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW = 2000;

const INTERACTIVE_TAGS = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "SUMMARY",
]);

const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "tab",
  "menuitem",
  "option",
  "checkbox",
  "radio",
  "switch",
  "slider",
]);

let eventQueue: TrackerEvent[] = [];
let lastClicks: { tag: string; cls: string; id: string; time: number }[] = [];
let maxScrollDepth = 0;
let flushTimer: ReturnType<typeof setInterval> | null = null;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max);
}

function isInteractive(el: Element): boolean {
  if (INTERACTIVE_TAGS.has(el.tagName)) return true;
  if (el.hasAttribute("onclick")) return true;
  const role = el.getAttribute("role");
  if (role && INTERACTIVE_ROLES.has(role)) return true;
  const tabindex = el.getAttribute("tabindex");
  if (tabindex && tabindex !== "-1") return true;
  return false;
}

function detectDevice(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function handleClick(e: MouseEvent): void {
  const target = e.target as Element;
  if (!target) return;

  const tag = target.tagName || "";
  const cls = (target as HTMLElement).className || "";
  const id = target.id || "";
  const text = truncate(
    (target.textContent || "").trim().replace(/\s+/g, " "),
    MAX_TEXT_LENGTH
  );

  const now = Date.now();
  const clickInfo = {
    tag,
    cls: typeof cls === "string" ? cls : "",
    id,
    time: now,
  };

  lastClicks.push(clickInfo);
  lastClicks = lastClicks.filter((c) => now - c.time < RAGE_CLICK_WINDOW);

  const sameElementClicks = lastClicks.filter(
    (c) => c.tag === clickInfo.tag && c.cls === clickInfo.cls && c.id === clickInfo.id
  );
  const isRageClick = sameElementClicks.length >= RAGE_CLICK_THRESHOLD;
  const isDeadClick = !isInteractive(target);

  const rect = target.getBoundingClientRect();
  const x = e.clientX - rect.left + rect.left;
  const y = e.clientY - rect.top + rect.top;

  eventQueue.push({
    type: "click",
    x: Math.round(x),
    y: Math.round(y),
    element_tag: tag,
    element_class: typeof cls === "string" ? truncate(cls, 200) : "",
    element_id: id,
    element_text: text,
    is_rage_click: isRageClick,
    is_dead_click: isDeadClick,
    timestamp: now,
  });

  touchSession();
}

let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

function handleScroll(): void {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop =
      window.pageYOffset || document.documentElement.scrollTop;
    const clientHeight = window.innerHeight;
    const depth = Math.round(((scrollTop + clientHeight) / scrollHeight) * 100);

    if (depth > maxScrollDepth) {
      maxScrollDepth = depth;
    }
    touchSession();
  }, 200);
}

function sendPageView(config: TrackerConfig): void {
  eventQueue.push({
    type: "pageview",
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || "",
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timestamp: Date.now(),
  });
}

function flush(config: TrackerConfig): void {
  if (eventQueue.length === 0) return;

  if (maxScrollDepth > 0) {
    eventQueue.push({
      type: "scroll",
      scroll_depth_percent: maxScrollDepth,
      timestamp: Date.now(),
    });
    maxScrollDepth = 0;
  }

  const payload: IngestPayload = {
    site_key: config.siteKey,
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    events: [...eventQueue],
  };

  eventQueue = [];

  const url = config.apiUrl + "/api/ingest";
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      fetch(url, {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {}
}

export function startTracking(config: TrackerConfig): void {
  document.addEventListener("click", handleClick, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });

  sendPageView(config);

  flushTimer = setInterval(() => flush(config), BATCH_INTERVAL);

  window.addEventListener("beforeunload", () => flush(config));
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(config);
  });
}
