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

  await migrateNumberWordsToNames(db);
}

/**
 * Earlier versions seeded the built-in "Numbers" category with digit words
 * ("0".."20"). We now spell out the NAME ("Zero".."Twenty") so the child hears
 * "eight" and the animation spells E-I-G-H-T. This rewrites those words IN
 * PLACE for profiles created before the change.
 *
 * Safety:
 *  - Only built-in words in a category named "Numbers" are touched.
 *  - A word is only renamed if it STILL equals the old digit, so any caregiver
 *    edit (custom label, recorded audio) is left alone.
 *  - The emoji is not changed (the digit tile stays), matching the new seed.
 */
async function migrateNumberWordsToNames(db: SQLite.SQLiteDatabase): Promise<void> {
  const DIGIT_TO_NAME: Record<string, string> = {
    "0": "Zero",
    "1": "One",
    "2": "Two",
    "3": "Three",
    "4": "Four",
    "5": "Five",
    "6": "Six",
    "7": "Seven",
    "8": "Eight",
    "9": "Nine",
    "10": "Ten",
    "11": "Eleven",
    "12": "Twelve",
    "13": "Thirteen",
    "14": "Fourteen",
    "15": "Fifteen",
    "16": "Sixteen",
    "17": "Seventeen",
    "18": "Eighteen",
    "19": "Nineteen",
    "20": "Twenty",
  };

  const now = Date.now();
  for (const [digit, name] of Object.entries(DIGIT_TO_NAME)) {
    await db.runAsync(
      `UPDATE words
         SET word = ?, updatedAt = ?
       WHERE word = ?
         AND categoryId IN (
           SELECT id FROM categories WHERE name = 'Numbers' AND isBuiltIn = 1
         )`,
      [name, now, digit]
    );
  }
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
