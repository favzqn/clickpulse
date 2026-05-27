export interface TrackerConfig {
  siteKey: string;
  apiUrl: string;
}

export interface ClickEvent {
  type: "click";
  x: number;
  y: number;
  element_tag: string;
  element_class: string;
  element_id: string;
  element_text: string;
  is_rage_click: boolean;
  is_dead_click: boolean;
  timestamp: number;
}

export interface ScrollEvent {
  type: "scroll";
  scroll_depth_percent: number;
  timestamp: number;
}

export interface PageViewEvent {
  type: "pageview";
  url: string;
  path: string;
  referrer: string;
  viewport_width: number;
  viewport_height: number;
  timestamp: number;
}

export type TrackerEvent = ClickEvent | ScrollEvent | PageViewEvent;

export interface IngestPayload {
  site_key: string;
  visitor_id: string;
  session_id: string;
  events: TrackerEvent[];
}
