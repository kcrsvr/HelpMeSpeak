// ============================================================
// ID + time helpers. IDs are generated locally with a semantic
// prefix. We avoid Crypto.randomUUID() here because on some Expo
// versions it has returned a Promise; a timestamp + random suffix
// is collision-safe enough for a single-device local database.
// ============================================================

function randomSuffix(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

/** Short, unique id with a semantic prefix (e.g. "word_lz3k...9f"). */
export function newId(prefix: string): string {
  return `${prefix}_${randomSuffix()}`;
}

export function now(): number {
  return Date.now();
}
