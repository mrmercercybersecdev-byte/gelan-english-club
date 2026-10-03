import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_SECONDS = 12 * 60 * 60;

function signingKey() {
  // DATABASE_URL is already required and contains deployment-managed secret material.
  const key = process.env.MEET_PEER_SECRET || process.env.ADMIN_PASSWORD || process.env.DATABASE_URL;
  if (!key) throw new Error("Meeting peer signing key is not configured.");
  return createHmac("sha256", key).update("gelan-english-club:meeting-peer:v1").digest();
}

function signature(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest();
}

export function createMeetPeerToken(roomCode: string, peerId: string) {
  const payload = Buffer.from(JSON.stringify({
    roomCode,
    peerId,
    expiresAt: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  })).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

export function verifyMeetPeerToken(token: string, roomCode: string, peerId: string) {
  if (token.length > 1024) return false;
  const [payload, encodedSignature, extra] = token.split(".");
  if (!payload || !encodedSignature || extra) return false;

  let actual: Buffer;
  try {
    actual = Buffer.from(encodedSignature, "base64url");
  } catch {
    return false;
  }
  const expected = signature(payload);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      roomCode?: unknown;
      peerId?: unknown;
      expiresAt?: unknown;
    };
    return claims.roomCode === roomCode && claims.peerId === peerId &&
      typeof claims.expiresAt === "number" && claims.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
