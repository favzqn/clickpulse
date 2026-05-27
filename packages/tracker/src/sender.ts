import type { IngestPayload, TrackerConfig } from "./types";

export function sendBatch(
  config: TrackerConfig,
  payload: IngestPayload
): void {
  const url = config.apiUrl + "/api/ingest";
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        url,
        new Blob([body], { type: "application/json" })
      );
      if (!sent) {
        fetchFallback(url, body);
      }
    } else {
      fetchFallback(url, body);
    }
  } catch {
    fetchFallback(url, body);
  }
}

function fetchFallback(url: string, body: string): void {
  try {
    fetch(url, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } catch {}
}
