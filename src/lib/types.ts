export type PlanType = "free" | "pro" | "team";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  tracking_key: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  site_id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string | null;
  page_count: number;
  device_type: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  country: string | null;
  created_at: string;
}

export interface PageView {
  id: string;
  session_id: string;
  url: string;
  path: string;
  referrer: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface ClickEvent {
  id: string;
  page_view_id: string;
  x: number;
  y: number;
  element_tag: string | null;
  element_class: string | null;
  element_id: string | null;
  element_text: string | null;
  is_rage_click: boolean;
  is_dead_click: boolean;
  timestamp: string;
}

export interface ScrollEvent {
  id: string;
  page_view_id: string;
  scroll_depth_percent: number;
  timestamp: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionWithPages extends Session {
  page_views: (PageView & {
    click_events: ClickEvent[];
    scroll_events: ScrollEvent[];
  })[];
}

export interface SiteWithStats extends Site {
  session_count: number;
  pageview_count: number;
}
