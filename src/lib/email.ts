import { siteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

export async function sendVerificationEmail(email: string, displayName: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const baseUrl = siteUrl();
  if (process.env.NODE_ENV === "production" && new URL(baseUrl).hostname === "localhost") {
    throw new Error("Set SITE_URL to the production site URL before sending verification emails.");
  }

  const confirmationUrl = new URL("/verify-email", baseUrl);
  confirmationUrl.searchParams.set("token", token);
  const safeName = escapeHtml(displayName);
  const url = confirmationUrl.toString();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Confirm your Gelan English Club account",
      text: `Hi ${displayName},\n\nConfirm your email address to activate your Gelan English Club account:\n${url}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#102044"><h1>Welcome to Gelan English Club</h1><p>Hi ${safeName},</p><p>Confirm your email address to activate your account.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#147d75;color:#fff;text-decoration:none;font-weight:bold">Confirm my email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p></div>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned HTTP ${response.status}.`);
  }
}
