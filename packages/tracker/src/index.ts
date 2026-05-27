import type { TrackerConfig } from "./types";
import { startTracking } from "./tracker";

function init(): void {
  const scriptEl = document.currentScript as HTMLScriptElement | null;
  if (!scriptEl) return;

  const src = scriptEl.src;
  const match = src.match(/\/t\/([a-f0-9]+)\.js$/);
  if (!match) return;

  const siteKey = match[1];
  const apiUrl = src.replace(/\/t\/[a-f0-9]+\.js$/, "");

  const config: TrackerConfig = { siteKey, apiUrl };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => startTracking(config));
  } else {
    startTracking(config);
  }
}

init();
