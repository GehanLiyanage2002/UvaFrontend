// src/lib/api.ts
export const BASE_URL = import.meta.env.VITE_BASE_URL?.replace(/\/+$/, "") || "";

export async function postJSON<T = any>(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: any = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data as T;
}

export type AuthUser = { id: number; name: string; email: string; role: 'member'|'manager' };
export type AuthPayload = { token: string; user: AuthUser };

export function saveAuth({ token, user }: AuthPayload, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("auth_token", token);
  storage.setItem("auth_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_user");
}

export function getAuth(): AuthPayload | null {
  const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  const userStr = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
  if (!token || !userStr) return null;
  try { return { token, user: JSON.parse(userStr) }; } catch { return null; }
}
