// ============================================================
// Repositories — the only place that talks SQL. Everything else
// in the app uses these typed functions.
// ============================================================

import { getDb } from "./db";
import { SEED_CATEGORIES } from "./seed";
import {
  AppSettings,
  Category,
  MediaType,
  Profile,
  SpellingSpeed,
  Word,
} from "./types";
import { ThemeId } from "../theme/themes";
import { newId, now } from "../utils/id";

// ---------- row mappers ----------

function toBool(v: number): boolean {
  return v === 1;
}
function fromBool(v: boolean): number {
  return v ? 1 : 0;
}

/**
 * Derive the visual media kind from the URIs present. Video wins over a photo
 * (the photo, when also present, serves as the still poster), and emoji is the
 * fallback when neither is set. Keeps photoType/mediaType consistent with the
 * stored files, matching how audioType is derived from audioUri.
 */
function deriveMediaType(videoUri: string | null, photoUri: string | null): MediaType {
  if (videoUri) return "video";
  if (photoUri) return "photo";
  return "emoji";
}

function mapProfile(r: any): Profile {
  return {
    id: r.id,
    name: r.name,
    avatarEmoji: r.avatarEmoji,
    avatarUri: r.avatarUri ?? null,
    theme: r.theme as ThemeId,
    spellingSpeed: r.spellingSpeed as SpellingSpeed,
    gridSize: r.gridSize,
    ttsEnabled: toBool(r.ttsEnabled),
    animationEnabled: toBool(r.animationEnabled),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function mapCategory(r: any): Category {
  return {
    id: r.id,
    profileId: r.profileId,
    name: r.name,
    emoji: r.emoji,
    imageUri: r.imageUri ?? null,
    color: r.color,
    order: r.order,
    isBuiltIn: toBool(r.isBuiltIn),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function mapWord(r: any): Word {
  return {
    id: r.id,
    profileId: r.profileId,
    categoryId: r.categoryId,
    word: r.word,
    emoji: r.emoji,
    photoUri: r.photoUri ?? null,
    photoType: r.photoType,
    videoUri: r.videoUri ?? null,
    mediaType: (r.mediaType as MediaType) ?? deriveMediaType(r.videoUri ?? null, r.photoUri ?? null),
    audioUri: r.audioUri ?? null,
    audioType: r.audioType,
    isFeatured: toBool(r.isFeatured),
    order: r.order,
    usageCount: r.usageCount,
    lastUsedAt: r.lastUsedAt ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// ---------- settings (key/value) ----------

export const SettingsRepo = {
  async getRaw(key: string): Promise<string | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string | null }>(
      "SELECT value FROM settings WHERE key = ?",
      [key]
    );
    return row?.value ?? null;
  },

  async setRaw(key: string, value: string | null): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value]
    );
  },

  async getAll(): Promise<AppSettings> {
    const [onboarding, pinHash, activeProfileId] = await Promise.all([
      this.getRaw("onboardingComplete"),
      this.getRaw("pinHash"),
      this.getRaw("activeProfileId"),
    ]);
    return {
      onboardingComplete: onboarding === "true",
      pinHash: pinHash ?? null,
      activeProfileId: activeProfileId ?? null,
    };
  },

  async setOnboardingComplete(v: boolean): Promise<void> {
    await this.setRaw("onboardingComplete", v ? "true" : "false");
  },
  async setPinHash(hash: string): Promise<void> {
    await this.setRaw("pinHash", hash);
  },
  async setActiveProfileId(id: string | null): Promise<void> {
    await this.setRaw("activeProfileId", id);
  },
};

// ---------- profiles ----------

export const ProfileRepo = {
  async list(): Promise<Profile[]> {
    const db = await getDb();
    const rows = await db.getAllAsync("SELECT * FROM profiles ORDER BY createdAt ASC");
    return rows.map(mapProfile);
  },

  async get(id: string): Promise<Profile | null> {
    const db = await getDb();
    const row = await db.getFirstAsync("SELECT * FROM profiles WHERE id = ?", [id]);
    return row ? mapProfile(row) : null;
  },

  /**
   * Create a profile AND seed it with the pre-loaded categories/words.
   * Wrapped in a transaction so a partial seed can never happen.
   */
  async createWithSeed(input: {
    name: string;
    avatarEmoji?: string;
    avatarUri?: string | null;
    theme?: ThemeId;
  }): Promise<Profile> {
    const db = await getDb();
    const ts = now();
    const profileId = newId("prof");
    const profile: Profile = {
      id: profileId,
      name: input.name.trim() || "Child",
      avatarEmoji: input.avatarEmoji ?? "🙂",
      avatarUri: input.avatarUri ?? null,
      theme: input.theme ?? "calm-blue",
      spellingSpeed: "medium",
      gridSize: 2,
      ttsEnabled: true,
      animationEnabled: true,
      createdAt: ts,
      updatedAt: ts,
    };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO profiles
          (id, name, avatarEmoji, avatarUri, theme, spellingSpeed, gridSize, ttsEnabled, animationEnabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.id,
          profile.name,
          profile.avatarEmoji,
          profile.avatarUri,
          profile.theme,
          profile.spellingSpeed,
          profile.gridSize,
          fromBool(profile.ttsEnabled),
          fromBool(profile.animationEnabled),
          profile.createdAt,
          profile.updatedAt,
        ]
      );

      let catOrder = 0;
      for (const cat of SEED_CATEGORIES) {
        const catId = newId("cat");
        await db.runAsync(
          `INSERT INTO categories
            (id, profileId, name, emoji, color, "order", isBuiltIn, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [catId, profileId, cat.name, cat.emoji, cat.color, catOrder++, ts, ts]
        );

        let wordOrder = 0;
        for (const w of cat.words) {
          await db.runAsync(
            `INSERT INTO words
              (id, profileId, categoryId, word, emoji, photoUri, photoType, videoUri, mediaType, audioUri, audioType, isFeatured, "order", usageCount, lastUsedAt, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, NULL, 'emoji', NULL, 'emoji', NULL, 'tts', ?, ?, 0, NULL, ?, ?)`,
            [
              newId("word"),
              profileId,
              catId,
              w.word,
              w.emoji,
              fromBool(!!w.featured),
              wordOrder++,
              ts,
              ts,
            ]
          );
        }
      }
    });

    return profile;
  },

  async update(id: string, patch: Partial<Profile>): Promise<void> {
    const db = await getDb();
    const existing = await this.get(id);
    if (!existing) return;
    const next = { ...existing, ...patch, updatedAt: now() };
    await db.runAsync(
      `UPDATE profiles SET
        name = ?, avatarEmoji = ?, avatarUri = ?, theme = ?, spellingSpeed = ?, gridSize = ?,
        ttsEnabled = ?, animationEnabled = ?, updatedAt = ?
       WHERE id = ?`,
      [
        next.name,
        next.avatarEmoji,
        next.avatarUri,
        next.theme,
        next.spellingSpeed,
        next.gridSize,
        fromBool(next.ttsEnabled),
        fromBool(next.animationEnabled),
        next.updatedAt,
        id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM profiles WHERE id = ?", [id]); // cascades
  },
};

// ---------- categories ----------

export const CategoryRepo = {
  async listForProfile(profileId: string): Promise<Category[]> {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM categories WHERE profileId = ? ORDER BY "order" ASC, createdAt ASC',
      [profileId]
    );
    return rows.map(mapCategory);
  },

  async get(id: string): Promise<Category | null> {
    const db = await getDb();
    const row = await db.getFirstAsync("SELECT * FROM categories WHERE id = ?", [id]);
    return row ? mapCategory(row) : null;
  },

  async create(input: {
    profileId: string;
    name: string;
    emoji: string;
    color: string;
    imageUri?: string | null;
  }): Promise<Category> {
    const db = await getDb();
    const ts = now();
    const countRow = await db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM categories WHERE profileId = ?",
      [input.profileId]
    );
    const cat: Category = {
      id: newId("cat"),
      profileId: input.profileId,
      name: input.name.trim(),
      emoji: input.emoji || "📁",
      imageUri: input.imageUri ?? null,
      color: input.color || "#4A90D9",
      order: countRow?.c ?? 0,
      isBuiltIn: false,
      createdAt: ts,
      updatedAt: ts,
    };
    await db.runAsync(
      `INSERT INTO categories (id, profileId, name, emoji, imageUri, color, "order", isBuiltIn, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        cat.id,
        cat.profileId,
        cat.name,
        cat.emoji,
        cat.imageUri,
        cat.color,
        cat.order,
        cat.createdAt,
        cat.updatedAt,
      ]
    );
    return cat;
  },

  async update(id: string, patch: Partial<Category>): Promise<void> {
    const db = await getDb();
    const existing = await this.get(id);
    if (!existing) return;
    const next = { ...existing, ...patch, updatedAt: now() };
    await db.runAsync(
      `UPDATE categories SET name = ?, emoji = ?, imageUri = ?, color = ?, "order" = ?, updatedAt = ? WHERE id = ?`,
      [next.name, next.emoji, next.imageUri, next.color, next.order, next.updatedAt, id]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM categories WHERE id = ?", [id]); // cascades to words
  },
};

// ---------- words ----------

export const WordRepo = {
  async listForProfile(profileId: string): Promise<Word[]> {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM words WHERE profileId = ? ORDER BY "order" ASC, createdAt ASC',
      [profileId]
    );
    return rows.map(mapWord);
  },

  async listForCategory(categoryId: string): Promise<Word[]> {
    const db = await getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM words WHERE categoryId = ? ORDER BY "order" ASC, createdAt ASC',
      [categoryId]
    );
    return rows.map(mapWord);
  },

  async listFeatured(profileId: string): Promise<Word[]> {
    const db = await getDb();
    // Newest featured word first, so a word just marked as featured in Caregiver
    // Mode appears at the front of the Featured row. `updatedAt` (not createdAt)
    // is used so toggling an existing word to featured also brings it forward.
    // Ties fall back to usage so popular words stay ahead of unused ones.
    const rows = await db.getAllAsync(
      "SELECT * FROM words WHERE profileId = ? AND isFeatured = 1 ORDER BY updatedAt DESC, usageCount DESC",
      [profileId]
    );
    return rows.map(mapWord);
  },

  /**
   * Most recently opened words, newest first. Only includes words that have
   * actually been used (lastUsedAt set). Defaults to the last 10.
   */
  async listRecentlyUsed(profileId: string, limit = 10): Promise<Word[]> {
    const db = await getDb();
    const rows = await db.getAllAsync(
      "SELECT * FROM words WHERE profileId = ? AND lastUsedAt IS NOT NULL ORDER BY lastUsedAt DESC LIMIT ?",
      [profileId, limit]
    );
    return rows.map(mapWord);
  },

  async get(id: string): Promise<Word | null> {
    const db = await getDb();
    const row = await db.getFirstAsync("SELECT * FROM words WHERE id = ?", [id]);
    return row ? mapWord(row) : null;
  },

  async create(input: {
    profileId: string;
    categoryId: string;
    word: string;
    emoji?: string;
    photoUri?: string | null;
    videoUri?: string | null;
    audioUri?: string | null;
    isFeatured?: boolean;
  }): Promise<Word> {
    const db = await getDb();
    const ts = now();
    const countRow = await db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM words WHERE categoryId = ?",
      [input.categoryId]
    );
    const w: Word = {
      id: newId("word"),
      profileId: input.profileId,
      categoryId: input.categoryId,
      word: input.word.trim(),
      emoji: input.emoji || "🔤",
      photoUri: input.photoUri ?? null,
      photoType: input.photoUri ? "real" : "emoji",
      videoUri: input.videoUri ?? null,
      mediaType: deriveMediaType(input.videoUri ?? null, input.photoUri ?? null),
      audioUri: input.audioUri ?? null,
      audioType: input.audioUri ? "recorded" : "tts",
      isFeatured: !!input.isFeatured,
      order: countRow?.c ?? 0,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: ts,
      updatedAt: ts,
    };
    await db.runAsync(
      `INSERT INTO words
        (id, profileId, categoryId, word, emoji, photoUri, photoType, videoUri, mediaType, audioUri, audioType, isFeatured, "order", usageCount, lastUsedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`,
      [
        w.id,
        w.profileId,
        w.categoryId,
        w.word,
        w.emoji,
        w.photoUri,
        w.photoType,
        w.videoUri,
        w.mediaType,
        w.audioUri,
        w.audioType,
        fromBool(w.isFeatured),
        w.order,
        w.createdAt,
        w.updatedAt,
      ]
    );
    return w;
  },

  async update(id: string, patch: Partial<Word>): Promise<void> {
    const db = await getDb();
    const existing = await this.get(id);
    if (!existing) return;
    const next = { ...existing, ...patch, updatedAt: now() };
    // keep photoType/mediaType/audioType consistent with the URIs
    next.photoType = next.photoUri ? "real" : "emoji";
    next.mediaType = deriveMediaType(next.videoUri, next.photoUri);
    next.audioType = next.audioUri ? "recorded" : "tts";
    await db.runAsync(
      `UPDATE words SET
        categoryId = ?, word = ?, emoji = ?, photoUri = ?, photoType = ?,
        videoUri = ?, mediaType = ?, audioUri = ?, audioType = ?, isFeatured = ?, "order" = ?, updatedAt = ?
       WHERE id = ?`,
      [
        next.categoryId,
        next.word,
        next.emoji,
        next.photoUri,
        next.photoType,
        next.videoUri,
        next.mediaType,
        next.audioUri,
        next.audioType,
        fromBool(next.isFeatured),
        next.order,
        next.updatedAt,
        id,
      ]
    );
  },

  async recordUsage(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "UPDATE words SET usageCount = usageCount + 1, lastUsedAt = ? WHERE id = ?",
      [now(), id]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM words WHERE id = ?", [id]);
  },
};
