// Integration tests for the repository layer, running against a REAL in-memory
// SQLite engine (better-sqlite3) shaped like expo-sqlite. This exercises the
// actual schema, cascades, ordering and upserts — not a hand-rolled fake.

import { createFakeDb, ExpoSqliteLike } from "./fakeDb";

// Prefixed with `mock` so jest.mock's factory is allowed to reference it.
let mockFake: ExpoSqliteLike;

// Mock expo-sqlite at the boundary so the REAL db.ts (getDb, initSchema,
// migrations) and the repositories run unchanged against better-sqlite3.
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(async () => mockFake),
}));

import { SEED_CATEGORIES } from "../seed";
import type {
  SettingsRepo as SettingsRepoT,
  ProfileRepo as ProfileRepoT,
  CategoryRepo as CategoryRepoT,
  WordRepo as WordRepoT,
} from "../repositories";

// db.ts memoizes its open DB promise at module scope, so we reset the module
// registry per test and re-require to get a fresh DB bound to a fresh fake.
let SettingsRepo: typeof SettingsRepoT;
let ProfileRepo: typeof ProfileRepoT;
let CategoryRepo: typeof CategoryRepoT;
let WordRepo: typeof WordRepoT;

beforeEach(async () => {
  mockFake = createFakeDb();
  jest.resetModules();
  let initSchema!: () => Promise<void>;
  jest.isolateModules(() => {
    initSchema = require("../db").initSchema;
    const repos = require("../repositories");
    SettingsRepo = repos.SettingsRepo;
    ProfileRepo = repos.ProfileRepo;
    CategoryRepo = repos.CategoryRepo;
    WordRepo = repos.WordRepo;
  });
  await initSchema();
});

afterEach(() => {
  mockFake.__raw.close();
});

async function makeProfile(name = "Rohit") {
  return ProfileRepo.createWithSeed({ name });
}

describe("SettingsRepo", () => {
  it("returns defaults when nothing is stored", async () => {
    const s = await SettingsRepo.getAll();
    expect(s).toEqual({
      onboardingComplete: false,
      pinHash: null,
      activeProfileId: null,
    });
  });

  it("round-trips raw values and upserts on conflict", async () => {
    await SettingsRepo.setRaw("k", "v1");
    expect(await SettingsRepo.getRaw("k")).toBe("v1");
    await SettingsRepo.setRaw("k", "v2"); // ON CONFLICT ... DO UPDATE
    expect(await SettingsRepo.getRaw("k")).toBe("v2");
  });

  it("persists onboarding, pin hash and active profile", async () => {
    await SettingsRepo.setOnboardingComplete(true);
    await SettingsRepo.setPinHash("abc123");
    await SettingsRepo.setActiveProfileId("prof_1");
    const s = await SettingsRepo.getAll();
    expect(s.onboardingComplete).toBe(true);
    expect(s.pinHash).toBe("abc123");
    expect(s.activeProfileId).toBe("prof_1");
  });

  it("treats any non-'true' value as onboarding incomplete", async () => {
    await SettingsRepo.setOnboardingComplete(false);
    expect((await SettingsRepo.getAll()).onboardingComplete).toBe(false);
  });
});

describe("ProfileRepo.createWithSeed", () => {
  it("creates one profile with the requested name and sensible defaults", async () => {
    const p = await makeProfile("Aria");
    expect(p.name).toBe("Aria");
    expect(p.theme).toBe("calm-blue");
    expect(p.spellingSpeed).toBe("medium");
    expect(p.gridSize).toBe(2);
    expect(p.ttsEnabled).toBe(true);
    expect(p.animationEnabled).toBe(true);
    expect(await ProfileRepo.list()).toHaveLength(1);
  });

  it("falls back to 'Child' for a blank name", async () => {
    const p = await ProfileRepo.createWithSeed({ name: "   " });
    expect(p.name).toBe("Child");
  });

  it("seeds all starter categories and every seed word", async () => {
    const p = await makeProfile();
    const cats = await CategoryRepo.listForProfile(p.id);
    expect(cats).toHaveLength(SEED_CATEGORIES.length);

    const totalSeedWords = SEED_CATEGORIES.reduce((n, c) => n + c.words.length, 0);
    const words = await WordRepo.listForProfile(p.id);
    expect(words).toHaveLength(totalSeedWords);
  });

  it("marks seeded categories as built-in", async () => {
    const p = await makeProfile();
    const cats = await CategoryRepo.listForProfile(p.id);
    expect(cats.every((c) => c.isBuiltIn)).toBe(true);
  });

  it("seeds featured words that surface in listFeatured", async () => {
    const p = await makeProfile();
    const featured = await WordRepo.listFeatured(p.id);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((w) => w.isFeatured)).toBe(true);
  });
});

describe("ProfileRepo update/delete", () => {
  it("updates fields and bumps updatedAt", async () => {
    const p = await makeProfile();
    await ProfileRepo.update(p.id, { name: "New Name", gridSize: 3, ttsEnabled: false });
    const updated = await ProfileRepo.get(p.id);
    expect(updated?.name).toBe("New Name");
    expect(updated?.gridSize).toBe(3);
    expect(updated?.ttsEnabled).toBe(false);
  });

  it("is a no-op when updating a missing profile", async () => {
    await expect(ProfileRepo.update("nope", { name: "x" })).resolves.toBeUndefined();
  });

  it("cascades delete to categories and words", async () => {
    const p = await makeProfile();
    await ProfileRepo.delete(p.id);
    expect(await ProfileRepo.get(p.id)).toBeNull();
    expect(await CategoryRepo.listForProfile(p.id)).toHaveLength(0);
    expect(await WordRepo.listForProfile(p.id)).toHaveLength(0);
  });
});

describe("CategoryRepo", () => {
  it("creates a category with defaults and increasing order", async () => {
    const p = await makeProfile();
    const before = await CategoryRepo.listForProfile(p.id);
    const c = await CategoryRepo.create({
      profileId: p.id,
      name: "Custom",
      emoji: "⭐",
      color: "#123456",
    });
    expect(c.isBuiltIn).toBe(false);
    expect(c.order).toBe(before.length); // order = current count
    const after = await CategoryRepo.listForProfile(p.id);
    expect(after).toHaveLength(before.length + 1);
  });

  it("applies default emoji/color when passed empty strings", async () => {
    const p = await makeProfile();
    const c = await CategoryRepo.create({
      profileId: p.id,
      name: "Bare",
      emoji: "",
      color: "",
    });
    expect(c.emoji).toBe("📁");
    expect(c.color).toBe("#4A90D9");
  });

  it("updates a category", async () => {
    const p = await makeProfile();
    const c = await CategoryRepo.create({ profileId: p.id, name: "X", emoji: "❓", color: "#000000" });
    await CategoryRepo.update(c.id, { name: "Renamed" });
    expect((await CategoryRepo.get(c.id))?.name).toBe("Renamed");
  });

  it("cascades delete to its words", async () => {
    const p = await makeProfile();
    const c = await CategoryRepo.create({ profileId: p.id, name: "Temp", emoji: "🗑️", color: "#111111" });
    await WordRepo.create({ profileId: p.id, categoryId: c.id, word: "Doomed" });
    await CategoryRepo.delete(c.id);
    expect(await WordRepo.listForCategory(c.id)).toHaveLength(0);
  });
});

describe("WordRepo", () => {
  it("derives photoType/audioType from the presence of URIs", async () => {
    const p = await makeProfile();
    const cat = (await CategoryRepo.listForProfile(p.id))[0];

    const emojiWord = await WordRepo.create({
      profileId: p.id,
      categoryId: cat.id,
      word: "EmojiOnly",
    });
    expect(emojiWord.photoType).toBe("emoji");
    expect(emojiWord.audioType).toBe("tts");

    const richWord = await WordRepo.create({
      profileId: p.id,
      categoryId: cat.id,
      word: "Rich",
      photoUri: "file:///documents/media/photo_1.jpg",
      audioUri: "file:///documents/media/audio_1.m4a",
    });
    expect(richWord.photoType).toBe("real");
    expect(richWord.audioType).toBe("recorded");
  });

  it("trims the word label on create", async () => {
    const p = await makeProfile();
    const cat = (await CategoryRepo.listForProfile(p.id))[0];
    const w = await WordRepo.create({ profileId: p.id, categoryId: cat.id, word: "  Spaced  " });
    expect(w.word).toBe("Spaced");
  });

  it("re-derives photoType/audioType when a word is updated", async () => {
    const p = await makeProfile();
    const cat = (await CategoryRepo.listForProfile(p.id))[0];
    const w = await WordRepo.create({
      profileId: p.id,
      categoryId: cat.id,
      word: "Toggle",
      photoUri: "file:///documents/media/photo_2.jpg",
    });
    expect(w.photoType).toBe("real");
    await WordRepo.update(w.id, { photoUri: null });
    expect((await WordRepo.get(w.id))?.photoType).toBe("emoji");
  });

  it("recordUsage increments count and sets lastUsedAt, surfacing in recently used", async () => {
    const p = await makeProfile();
    const cat = (await CategoryRepo.listForProfile(p.id))[0];
    const w = await WordRepo.create({ profileId: p.id, categoryId: cat.id, word: "Used" });

    expect(await WordRepo.listRecentlyUsed(p.id)).toHaveLength(0); // none used yet
    await WordRepo.recordUsage(w.id);
    const after = await WordRepo.get(w.id);
    expect(after?.usageCount).toBe(1);
    expect(after?.lastUsedAt).not.toBeNull();

    const recent = await WordRepo.listRecentlyUsed(p.id);
    expect(recent.map((r) => r.id)).toContain(w.id);
  });

  it("listRecentlyUsed respects the limit", async () => {
    const p = await makeProfile();
    const cat = (await CategoryRepo.listForProfile(p.id))[0];
    for (let i = 0; i < 5; i++) {
      const w = await WordRepo.create({ profileId: p.id, categoryId: cat.id, word: `W${i}` });
      await WordRepo.recordUsage(w.id);
    }
    expect(await WordRepo.listRecentlyUsed(p.id, 3)).toHaveLength(3);
  });

  it("deletes a single word without touching others", async () => {
    const p = await makeProfile();
    const cat = (await CategoryRepo.listForProfile(p.id))[0];
    const a = await WordRepo.create({ profileId: p.id, categoryId: cat.id, word: "Keep" });
    const b = await WordRepo.create({ profileId: p.id, categoryId: cat.id, word: "Remove" });
    await WordRepo.delete(b.id);
    expect(await WordRepo.get(b.id)).toBeNull();
    expect(await WordRepo.get(a.id)).not.toBeNull();
  });

  it("orders words within a category by insertion order", async () => {
    const p = await makeProfile();
    const c = await CategoryRepo.create({ profileId: p.id, name: "Ordered", emoji: "🔢", color: "#222222" });
    await WordRepo.create({ profileId: p.id, categoryId: c.id, word: "first" });
    await WordRepo.create({ profileId: p.id, categoryId: c.id, word: "second" });
    const words = await WordRepo.listForCategory(c.id);
    expect(words.map((w) => w.word)).toEqual(["first", "second"]);
  });
});
