export function isSafeCoverImage(value: string) {
  if (!value || value.length > 500 || /[\u0000-\u001f\\]/.test(value)) return false;

  if (isLocalImagePath(value)) return true;

  return isHttpsImageUrl(value);
}

export function isSafePhotoUpload(value: string) {
  if (value.length > 400_000) return false;
  return /^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}

export function isSafePhotoUrl(value: string) {
  if (!value || value.length > 500 || /[\u0000-\u001f\\]/.test(value)) return false;
  return isLocalImagePath(value) || isHttpsImageUrl(value);
}

function isLocalImagePath(value: string) {
  return value.startsWith("/images/") && !value.split("/").includes("..");
}

function isHttpsImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
