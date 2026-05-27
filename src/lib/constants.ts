import type { PlanType } from "./types";

export const PLAN_LIMITS: Record<
  PlanType,
  {
    maxSites: number;
    maxSessionsPerMonth: number;
    retentionDays: number;
    sessionReplay: boolean;
    exports: boolean;
    api: boolean;
    teamSeats: number;
  }
> = {
  free: {
    maxSites: 1,
    maxSessionsPerMonth: 1000,
    retentionDays: 7,
    sessionReplay: false,
    exports: false,
    api: false,
    teamSeats: 1,
  },
  pro: {
    maxSites: 5,
    maxSessionsPerMonth: 25000,
    retentionDays: 30,
    sessionReplay: true,
    exports: true,
    api: false,
    teamSeats: 1,
  },
  team: {
    maxSites: 20,
    maxSessionsPerMonth: 100000,
    retentionDays: 90,
    sessionReplay: true,
    exports: true,
    api: true,
    teamSeats: 5,
  },
};

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const BATCH_SEND_INTERVAL_MS = 5000; // 5 seconds
export const RAGE_CLICK_THRESHOLD = 3;
export const RAGE_CLICK_WINDOW_MS = 2000; // 2 seconds
export const RATE_LIMIT_PER_MINUTE = 100;
export const MAX_EVENT_TEXT_LENGTH = 100;

export const INTERACTIVE_ELEMENTS = new Set([
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "details",
]);

export const INTERACTIVE_ROLES = new Set([
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
