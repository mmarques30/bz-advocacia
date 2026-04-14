/**
 * Shared HMAC verifier for public webhook edge functions
 * (e.g. receive-sheet-lead, meta-callback).
 *
 * Behaviour:
 * - If the given secretEnvVar is NOT configured, the request is allowed
 *   through and a warning is logged. This supports a gradual rollout
 *   where integrations can add signing before the secret is enforced.
 * - If the secret IS configured, the request must carry a valid signature
 *   in one of the accepted headers (x-signature, x-hub-signature-256).
 *   Otherwise the function should respond 401.
 *
 * The signature is the hex-encoded HMAC-SHA256 of the raw request body,
 * optionally prefixed with "sha256=" (GitHub/Meta convention).
 */

const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("sha256=") ? hex.slice("sha256=".length) : hex;
  if (clean.length % 2 !== 0) return new Uint8Array();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export interface HmacResult {
  ok: boolean;
  reason?: "no_secret" | "missing_signature" | "invalid_signature" | "valid";
}

export async function verifyHmac(
  req: Request,
  rawBody: string,
  secretEnvVar: string,
): Promise<HmacResult> {
  const secret = Deno.env.get(secretEnvVar);
  if (!secret) {
    console.warn(
      `[verifyHmac] ${secretEnvVar} is not configured — request allowed without signature verification. ` +
        `Set this secret to enforce HMAC validation.`,
    );
    return { ok: true, reason: "no_secret" };
  }

  const provided =
    req.headers.get("x-signature") ??
    req.headers.get("x-hub-signature-256") ??
    "";

  if (!provided) {
    return { ok: false, reason: "missing_signature" };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = new Uint8Array(sigBuf);
  const got = hexToBytes(provided);

  return timingSafeEqual(expected, got)
    ? { ok: true, reason: "valid" }
    : { ok: false, reason: "invalid_signature" };
}
