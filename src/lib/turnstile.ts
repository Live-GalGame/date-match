const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "development") return true;
    console.error("[Turnstile] TURNSTILE_SECRET_KEY not configured");
    return false;
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data: SiteverifyResponse = await res.json();
    if (!data.success) {
      console.warn("[Turnstile] Rejected:", data["error-codes"]);
    }
    return data.success;
  } catch (err) {
    console.error("[Turnstile] Verification request failed:", err);
    return false;
  }
}
