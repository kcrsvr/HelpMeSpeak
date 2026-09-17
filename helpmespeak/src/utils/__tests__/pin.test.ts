import * as Crypto from "expo-crypto";
import { hashPin, verifyPin } from "../pin";

const mockDigest = Crypto.digestStringAsync as jest.Mock;

describe("pin utils", () => {
  beforeEach(() => {
    mockDigest.mockClear();
  });

  describe("hashPin", () => {
    it("hashes the pin with SHA-256 and the static salt prefix", async () => {
      await hashPin("1234");
      expect(mockDigest).toHaveBeenCalledWith(
        "SHA-256",
        "helpmespeak::pin::v1:1234"
      );
    });

    it("returns the digest string produced by expo-crypto", async () => {
      const result = await hashPin("0000");
      // jest.setup deterministic mock: hashed(<salted input>)
      expect(result).toBe("hashed(helpmespeak::pin::v1:0000)");
    });

    it("produces different hashes for different pins", async () => {
      const a = await hashPin("1111");
      const b = await hashPin("2222");
      expect(a).not.toBe(b);
    });
  });

  describe("verifyPin", () => {
    it("returns true when the pin matches the stored hash", async () => {
      const hash = await hashPin("4321");
      await expect(verifyPin("4321", hash)).resolves.toBe(true);
    });

    it("returns false when the pin does not match", async () => {
      const hash = await hashPin("4321");
      await expect(verifyPin("0000", hash)).resolves.toBe(false);
    });

    it("returns false against an arbitrary non-matching hash", async () => {
      await expect(verifyPin("1234", "not-a-real-hash")).resolves.toBe(false);
    });
  });
});
