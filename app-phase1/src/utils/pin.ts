// ============================================================
// Caregiver PIN — hashed locally, never stored in plain text.
// Phase 1 has no cloud, so a salted SHA-256 (via expo-crypto) is
// sufficient and dependency-free. (Design calls for bcrypt; a native
// bcrypt module can replace this in a later hardening pass without
// changing callers.)
// ============================================================

import * as Crypto from "expo-crypto";

// Static app salt. A per-install random salt would be marginally better,
// but the PIN never leaves the device and the threat model is casual access.
const SALT = "helpmespeak::pin::v1";

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${SALT}:${pin}`
  );
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const candidate = await hashPin(pin);
  return candidate === hash;
}
