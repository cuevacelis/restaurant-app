export interface MenuSession {
  name: string;
  orderId?: string;
}

function cookieKey(tableId?: string) {
  return tableId ? `mesa_${tableId}` : "menu_session";
}

export function readSession(tableId?: string): MenuSession | null {
  if (typeof document === "undefined") return null;
  const key = cookieKey(tableId);
  const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[2])) as MenuSession;
  } catch {
    return null;
  }
}

export function saveSession(session: MenuSession, tableId?: string, hours = 3) {
  const key = cookieKey(tableId);
  const expires = new Date(Date.now() + hours * 3600 * 1000).toUTCString();
  document.cookie = `${key}=${encodeURIComponent(JSON.stringify(session))}; expires=${expires}; path=/; SameSite=Strict`;
}

export function clearSession(tableId?: string) {
  const key = cookieKey(tableId);
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}
