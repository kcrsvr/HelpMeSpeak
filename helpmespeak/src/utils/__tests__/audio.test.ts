// audio.ts holds module-level cached state (resolved voice, current player),
// so each test re-imports the module fresh via jest.isolateModulesAsync-style
// resetModules + require, and controls the voice-pack + native mocks.

jest.mock("../../assets/voice", () => ({
  voiceClip: jest.fn(() => null),
  voiceKey: jest.fn((t: string) => t),
  hasVoicePack: jest.fn(() => false),
}));

type AudioModule = typeof import("../audio");

function loadAudio(): {
  audio: AudioModule;
  Speech: typeof import("expo-speech");
  expoAudio: typeof import("expo-audio");
  voice: { voiceClip: jest.Mock };
} {
  let audio!: AudioModule;
  let Speech!: typeof import("expo-speech");
  let expoAudio!: typeof import("expo-audio");
  let voice!: { voiceClip: jest.Mock };
  // Require the module AND its dependencies inside the same isolated registry so
  // the mock instances we assert on are the exact ones audio.ts captured.
  jest.isolateModules(() => {
    audio = require("../audio");
    Speech = require("expo-speech");
    expoAudio = require("expo-audio");
    voice = require("../../assets/voice");
  });
  return { audio, Speech, expoAudio, voice };
}

describe("audio utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterAll(() => {
    // audio.ts arms 6s/8s safety setTimeouts inside playback promises that
    // resolve early via the mocked player; clear the dangling timers so Jest
    // exits cleanly instead of warning about open handles.
    jest.clearAllTimers();
  });

  describe("playWord", () => {
    it("plays a recorded clip when audioUri is provided", async () => {
      const { audio, expoAudio, Speech } = loadAudio();
      await audio.playWord({ word: "Apple", audioUri: "file:///a.m4a", ttsEnabled: true });

      expect(expoAudio.createAudioPlayer).toHaveBeenCalledWith({ uri: "file:///a.m4a" });
      // Recorded audio takes priority: TTS should not be used.
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it("does not call Speech.stop after a recorded clip finishes (would clip the next spelled letter)", async () => {
      const { audio, Speech } = loadAudio();
      // Regression: a recorded word (e.g. "Home") is immediately followed by the
      // spelled letters via TTS. An async Speech.stop() teardown here raced the
      // first letter's Speech.speak(), clipping the start of "H". The recorded
      // branch must release only the audio player, never touch TTS.
      await audio.playWord({ word: "Home", audioUri: "file:///home.m4a", ttsEnabled: true });
      // Exactly one stop — the guard at the START of playWord that clears any
      // prior audio. Crucially there is NO second stop after the clip finishes,
      // which is what used to race and clip the first spelled letter.
      expect(Speech.stop).toHaveBeenCalledTimes(1);
    });

    it("falls back to a bundled voice-pack clip when no audioUri but a clip exists", async () => {
      const { audio, expoAudio, Speech, voice } = loadAudio();
      voice.voiceClip.mockReturnValue(42); // a bundled asset module id

      await audio.playWord({ word: "Apple", audioUri: null, ttsEnabled: true });

      expect(expoAudio.createAudioPlayer).toHaveBeenCalledWith(42);
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it("falls back to TTS when no audioUri and no pack clip, and tts is enabled", async () => {
      const { audio, Speech } = loadAudio();
      await audio.playWord({ word: "Banana", audioUri: null, ttsEnabled: true });

      expect(Speech.speak).toHaveBeenCalledWith("Banana", expect.objectContaining({ pitch: expect.any(Number) }));
    });

    it("does not speak when tts is disabled and there is no audio or clip", async () => {
      const { audio, Speech } = loadAudio();
      await audio.playWord({ word: "Rice", audioUri: null, ttsEnabled: false });
      expect(Speech.speak).not.toHaveBeenCalled();
    });
  });

  describe("speakLetter", () => {
    it("speaks the lowercased letter via TTS when enabled and no clip exists", () => {
      const { audio, Speech } = loadAudio();
      audio.speakLetter("A", true);
      expect(Speech.speak).toHaveBeenCalledWith("a", expect.any(Object));
    });

    it("does nothing for blank input", () => {
      const { audio, Speech } = loadAudio();
      audio.speakLetter("   ", true);
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it("does not speak when tts disabled and no clip exists", () => {
      const { audio, Speech } = loadAudio();
      audio.speakLetter("B", false);
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it("prefers a bundled clip over TTS when one exists", async () => {
      const { audio, Speech, expoAudio, voice } = loadAudio();
      voice.voiceClip.mockReturnValue(7);
      audio.speakLetter("C", true);
      // speakLetter kicks off playPackClip fire-and-forget; let the microtask run.
      await Promise.resolve();
      expect(expoAudio.createAudioPlayer).toHaveBeenCalledWith(7);
      expect(Speech.speak).not.toHaveBeenCalled();
    });
  });

  describe("speakPhrase", () => {
    it("speaks a trimmed phrase via TTS when enabled and no clip exists", async () => {
      const { audio, Speech } = loadAudio();
      await audio.speakPhrase("  Welcome Rohit  ", true);
      expect(Speech.speak).toHaveBeenCalledWith("Welcome Rohit", expect.any(Object));
    });

    it("does nothing for an empty phrase", async () => {
      const { audio, Speech } = loadAudio();
      await audio.speakPhrase("", true);
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it("does not speak when tts disabled", async () => {
      const { audio, Speech } = loadAudio();
      await audio.speakPhrase("hi", false);
      expect(Speech.speak).not.toHaveBeenCalled();
    });
  });

  describe("stopWord", () => {
    it("stops any current speech", async () => {
      const { audio, Speech } = loadAudio();
      await audio.stopWord();
      expect(Speech.stop).toHaveBeenCalled();
    });
  });

  describe("playApplause", () => {
    it("falls back to a spoken cheer when tts is enabled (no applause asset bundled)", async () => {
      const { audio, Speech } = loadAudio();
      await audio.playApplause(true);
      expect(Speech.speak).toHaveBeenCalledWith("Yay! Well done!", expect.any(Object));
    });

    it("is silent when tts is disabled", async () => {
      const { audio, Speech } = loadAudio();
      await audio.playApplause(false);
      expect(Speech.speak).not.toHaveBeenCalled();
    });
  });
});
