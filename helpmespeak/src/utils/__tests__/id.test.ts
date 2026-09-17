import { newId, now } from "../id";

describe("id utils", () => {
  describe("newId", () => {
    it("prefixes the id with the given semantic prefix", () => {
      expect(newId("word")).toMatch(/^word_/);
      expect(newId("cat")).toMatch(/^cat_/);
      expect(newId("prof")).toMatch(/^prof_/);
    });

    it("produces a non-empty suffix after the underscore", () => {
      const id = newId("photo");
      const suffix = id.slice("photo_".length);
      expect(suffix.length).toBeGreaterThan(0);
    });

    it("generates unique ids across many rapid calls", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) ids.add(newId("x"));
      expect(ids.size).toBe(1000);
    });

    it("only uses base36 characters in the suffix", () => {
      const suffix = newId("audio").slice("audio_".length);
      expect(suffix).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe("now", () => {
    it("returns the current epoch millis", () => {
      const before = Date.now();
      const value = now();
      const after = Date.now();
      expect(value).toBeGreaterThanOrEqual(before);
      expect(value).toBeLessThanOrEqual(after);
    });

    it("returns a number", () => {
      expect(typeof now()).toBe("number");
    });
  });
});
