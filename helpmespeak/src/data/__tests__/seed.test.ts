import { SEED_CATEGORIES } from "../seed";

describe("SEED_CATEGORIES", () => {
  it("contains the expected number of starter categories", () => {
    expect(SEED_CATEGORIES.length).toBe(19);
  });

  it("has a unique key for every category", () => {
    const keys = SEED_CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every category a name, emoji, hex color and at least one word", () => {
    for (const cat of SEED_CATEGORIES) {
      expect(cat.name.trim().length).toBeGreaterThan(0);
      expect(cat.emoji.length).toBeGreaterThan(0);
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(cat.words.length).toBeGreaterThan(0);
    }
  });

  it("gives every word a non-empty label and emoji", () => {
    for (const cat of SEED_CATEGORIES) {
      for (const w of cat.words) {
        expect(w.word.trim().length).toBeGreaterThan(0);
        expect(w.emoji.length).toBeGreaterThan(0);
      }
    }
  });

  it("includes at least one featured word so the child home screen is not empty", () => {
    const featuredCount = SEED_CATEGORIES.flatMap((c) => c.words).filter(
      (w) => w.featured
    ).length;
    expect(featuredCount).toBeGreaterThan(0);
  });

  it("has no duplicate word labels within any single category", () => {
    for (const cat of SEED_CATEGORIES) {
      const words = cat.words.map((w) => w.word.toLowerCase());
      expect(new Set(words).size).toBe(words.length);
    }
  });
});
