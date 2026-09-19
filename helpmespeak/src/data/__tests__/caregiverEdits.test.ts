// Verifies that Caregiver Mode can customize the DEFAULT (built-in, seeded)
// vocabulary — not just caregiver-created content. These tests exercise the
// exact repository calls the caregiver screens make (WordWizardScreen ->
// WordRepo.update, ManageCategories/CategoryDetail -> CategoryRepo.update /
// .delete, and single-word delete via WordRepo.delete) against a real
// in-memory SQLite engine.

import { createFakeDb, ExpoSqliteLike } from "./fakeDb";

let mockFake: ExpoSqliteLike;

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(async () => mockFake),
}));

import type {
  ProfileRepo as ProfileRepoT,
  CategoryRepo as CategoryRepoT,
  WordRepo as WordRepoT,
} from "../repositories";

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
    ProfileRepo = repos.ProfileRepo;
    CategoryRepo = repos.CategoryRepo;
    WordRepo = repos.WordRepo;
  });
  await initSchema();
});

afterEach(() => {
  mockFake.__raw.close();
});

async function seededProfile() {
  return ProfileRepo.createWithSeed({ name: "Test Child" });
}

describe("Caregiver Mode can customize built-in (default) content", () => {
  it("built-in categories and words are actually flagged as built-in after seeding", async () => {
    const p = await seededProfile();
    const cats = await CategoryRepo.listForProfile(p.id);
    // Every seeded category is built-in; this is what the caregiver would edit.
    expect(cats.length).toBeGreaterThan(0);
    expect(cats.every((c) => c.isBuiltIn)).toBe(true);
  });

  it("can rename, recolor and re-emoji a built-in category (like ManageCategories/CategoryDetail)", async () => {
    const p = await seededProfile();
    const builtIn = (await CategoryRepo.listForProfile(p.id)).find((c) => c.isBuiltIn)!;

    await CategoryRepo.update(builtIn.id, {
      name: "Snacks & Treats",
      emoji: "🍩",
      color: "#FF00AA",
    });

    const updated = await CategoryRepo.get(builtIn.id);
    expect(updated?.name).toBe("Snacks & Treats");
    expect(updated?.emoji).toBe("🍩");
    expect(updated?.color).toBe("#FF00AA");
    // Editing does not silently flip the built-in flag.
    expect(updated?.isBuiltIn).toBe(true);
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(builtIn.updatedAt);
  });

  it("can rename and re-emoji a built-in word (like the Word Wizard edit flow)", async () => {
    const p = await seededProfile();
    const word = (await WordRepo.listForProfile(p.id))[0];

    await WordRepo.update(word.id, { word: "My Custom Word", emoji: "🌟" });

    const updated = await WordRepo.get(word.id);
    expect(updated?.word).toBe("My Custom Word");
    expect(updated?.emoji).toBe("🌟");
  });

  it("can feature and un-feature a built-in word so the child home screen changes", async () => {
    const p = await seededProfile();
    const featured = await WordRepo.listFeatured(p.id);
    expect(featured.length).toBeGreaterThan(0);
    const target = featured[0];

    // Caregiver toggles OFF featured.
    await WordRepo.update(target.id, { isFeatured: false });
    expect((await WordRepo.get(target.id))?.isFeatured).toBe(false);
    expect((await WordRepo.listFeatured(p.id)).map((w) => w.id)).not.toContain(target.id);

    // Caregiver toggles a previously-unfeatured word ON.
    const notFeatured = (await WordRepo.listForProfile(p.id)).find((w) => !w.isFeatured)!;
    await WordRepo.update(notFeatured.id, { isFeatured: true });
    expect((await WordRepo.listFeatured(p.id)).map((w) => w.id)).toContain(notFeatured.id);
  });

  it("can attach a real photo/recorded audio to a built-in word (photoType/audioType re-derive)", async () => {
    const p = await seededProfile();
    const word = (await WordRepo.listForProfile(p.id))[0];
    expect(word.photoType).toBe("emoji");
    expect(word.audioType).toBe("tts");

    await WordRepo.update(word.id, {
      photoUri: "file:///documents/media/photo_kid.jpg",
      audioUri: "file:///documents/media/audio_mom.m4a",
    });

    const updated = await WordRepo.get(word.id);
    expect(updated?.photoType).toBe("real");
    expect(updated?.audioType).toBe("recorded");
  });

  it("can delete a single built-in word without affecting the rest of its category", async () => {
    const p = await seededProfile();
    const cat = (await CategoryRepo.listForProfile(p.id))[0];
    const before = await WordRepo.listForCategory(cat.id);
    expect(before.length).toBeGreaterThan(1);

    await WordRepo.delete(before[0].id);

    const after = await WordRepo.listForCategory(cat.id);
    expect(after).toHaveLength(before.length - 1);
    expect(after.map((w) => w.id)).not.toContain(before[0].id);
  });

  it("can delete an entire built-in category and its words cascade away", async () => {
    const p = await seededProfile();
    const cat = (await CategoryRepo.listForProfile(p.id)).find((c) => c.isBuiltIn)!;

    await CategoryRepo.delete(cat.id);

    expect(await CategoryRepo.get(cat.id)).toBeNull();
    expect(await WordRepo.listForCategory(cat.id)).toHaveLength(0);
  });

  it("caregiver-added words coexist with built-in words in the same seeded category", async () => {
    const p = await seededProfile();
    const cat = (await CategoryRepo.listForProfile(p.id))[0];
    const before = await WordRepo.listForCategory(cat.id);

    const added = await WordRepo.create({
      profileId: p.id,
      categoryId: cat.id,
      word: "Caregiver Word",
      emoji: "🆕",
    });

    const after = await WordRepo.listForCategory(cat.id);
    expect(after).toHaveLength(before.length + 1);
    expect(after.map((w) => w.id)).toContain(added.id);
  });
});
