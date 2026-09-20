// ============================================================
// SQLite database — single connection, opened once.
// Uses the modern expo-sqlite async API (SDK 51+).
// ============================================================

import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("helpmespeak.db");
  }
  return dbPromise;
}

/**
 * Create all tables if they do not exist. Idempotent — safe to call
 * on every launch. Foreign keys use ON DELETE CASCADE so deleting a
 * profile/category cleans up its children (matches "hard delete" in the design).
 */
export async function initSchema(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS profiles (
      id            TEXT PRIMARY KEY NOT NULL,
      name          TEXT NOT NULL,
      avatarEmoji   TEXT NOT NULL DEFAULT '🙂',
      avatarUri     TEXT,
      theme         TEXT NOT NULL DEFAULT 'calm-blue',
      spellingSpeed TEXT NOT NULL DEFAULT 'medium',
      gridSize      INTEGER NOT NULL DEFAULT 2,
      ttsEnabled    INTEGER NOT NULL DEFAULT 1,
      animationEnabled INTEGER NOT NULL DEFAULT 1,
      createdAt     INTEGER NOT NULL,
      updatedAt     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id         TEXT PRIMARY KEY NOT NULL,
      profileId  TEXT NOT NULL,
      name       TEXT NOT NULL,
      emoji      TEXT NOT NULL DEFAULT '📁',
      imageUri   TEXT,
      color      TEXT NOT NULL DEFAULT '#4A90D9',
      "order"    INTEGER NOT NULL DEFAULT 0,
      isBuiltIn  INTEGER NOT NULL DEFAULT 0,
      createdAt  INTEGER NOT NULL,
      updatedAt  INTEGER NOT NULL,
      FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS words (
      id         TEXT PRIMARY KEY NOT NULL,
      profileId  TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      word       TEXT NOT NULL,
      emoji      TEXT NOT NULL DEFAULT '🔤',
      photoUri   TEXT,
      photoType  TEXT NOT NULL DEFAULT 'emoji',
      videoUri   TEXT,
      mediaType  TEXT NOT NULL DEFAULT 'emoji',
      audioUri   TEXT,
      audioType  TEXT NOT NULL DEFAULT 'tts',
      isFeatured INTEGER NOT NULL DEFAULT 0,
      "order"    INTEGER NOT NULL DEFAULT 0,
      usageCount INTEGER NOT NULL DEFAULT 0,
      lastUsedAt INTEGER,
      createdAt  INTEGER NOT NULL,
      updatedAt  INTEGER NOT NULL,
      FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_categories_profile ON categories(profileId);
    CREATE INDEX IF NOT EXISTS idx_words_profile ON words(profileId);
    CREATE INDEX IF NOT EXISTS idx_words_category ON words(categoryId);
  `);

  await runMigrations(db);
}

/**
 * Additive migrations for databases created by earlier app versions.
 * Each is guarded so it is safe to run on every launch.
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, "categories", "imageUri", "TEXT");
  await addColumnIfMissing(db, "profiles", "avatarUri", "TEXT");
  await addColumnIfMissing(db, "words", "videoUri", "TEXT");
  await addColumnIfMissing(db, "words", "mediaType", "TEXT NOT NULL DEFAULT 'emoji'");
  // Backfill mediaType for rows created before the column existed, deriving it
  // from the media already present (video > photo > emoji).
  await db.execAsync(`
    UPDATE words SET mediaType =
      CASE
        WHEN videoUri IS NOT NULL AND videoUri <> '' THEN 'video'
        WHEN photoUri IS NOT NULL AND photoUri <> '' THEN 'photo'
        ELSE 'emoji'
      END
    WHERE mediaType IS NULL OR mediaType = '' OR mediaType = 'emoji';
  `);
}

async function addColumnIfMissing(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`
  );
  const exists = cols.some((c) => c.name === column);
  if (!exists) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
