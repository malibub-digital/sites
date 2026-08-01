import { RateLimiterMemory } from 'rate-limiter-flexible';

const adminLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60,
  blockDuration: 60,
});

export async function checkAdminRateLimit(): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const res = await adminLimiter.get('admin-login-key');
    if (res && res.consumedPoints >= 3) {
      const retryAfterSeconds = Math.ceil(res.msBeforeNext / 1000) || 60;
      return { allowed: false, retryAfterSeconds };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export async function recordAdminFailedAttempt(): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    await adminLimiter.consume('admin-login-key');
    return { allowed: true };
  } catch (rej: any) {
    const retryAfterSeconds = Math.ceil(rej.msBeforeNext / 1000) || 60;
    return { allowed: false, retryAfterSeconds };
  }
}

export async function resetAdminAttempts(): Promise<void> {
  await adminLimiter.delete('admin-login-key');
}

export async function hashSha256(message: string): Promise<string> {
  const text = (message || "").trim();
  if (!text) return "";
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  if (cryptoObj?.subtle) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await cryptoObj.subtle.digest("SHA-256", msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return "";
}

export function getAdminCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )cms_admin_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAdminCookieToken(token: string) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `cms_admin_token=${encodeURIComponent(token)}; path=/; expires=${expires}; SameSite=Lax`;
}

export function clearAdminCookieToken() {
  if (typeof document === "undefined") return;
  document.cookie = "cms_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}
