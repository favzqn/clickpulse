const VID_KEY = "cp_vid";
const SID_KEY = "cp_sid";
const SLT_KEY = "cp_slt";
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VID_KEY);
    if (existing) return existing;
  } catch {}

  const id =
    "v_" +
    Math.random().toString(36).substr(2, 12) +
    "_" +
    Date.now().toString(36);
  try {
    localStorage.setItem(VID_KEY, id);
  } catch {}
  return id;
}

export function getSessionId(): string {
  try {
    const lastActivity = sessionStorage.getItem(SLT_KEY);
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed < SESSION_TIMEOUT) {
        const existing = sessionStorage.getItem(SID_KEY);
        if (existing) {
          sessionStorage.setItem(SLT_KEY, Date.now().toString());
          return existing;
        }
      }
    }
  } catch {}

  const id =
    "s_" +
    Math.random().toString(36).substr(2, 10) +
    "_" +
    Date.now().toString(36);
  try {
    sessionStorage.setItem(SID_KEY, id);
    sessionStorage.setItem(SLT_KEY, Date.now().toString());
  } catch {}
  return id;
}

export function touchSession(): void {
  try {
    sessionStorage.setItem(SLT_KEY, Date.now().toString());
  } catch {}
}
