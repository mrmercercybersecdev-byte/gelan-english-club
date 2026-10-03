export function normalizedHostname(value: string | null | undefined) {
  if (!value) return "";
  try {
    const first = value.split(",", 1)[0].trim();
    return new URL(first.includes("://") ? first : `https://${first}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isAdminHostname(host: string | null | undefined) {
  const configuredHost = normalizedHostname(process.env.ADMIN_HOST);
  return Boolean(configuredHost && normalizedHostname(host) === configuredHost);
}
