// ============================================================
// Audio playback: plays a caregiver's recorded clip if present,
// otherwise falls back to on-device TTS (when the profile allows it).
// Returns roughly when playback finishes so the word experience can
// sequence the spelling animation after the audio.
//
// SDK 57: expo-av was removed. Playback uses expo-audio's imperative
// createAudioPlayer(); speech uses expo-speech (unchanged).
// ============================================================

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { voiceClip } from "../assets/voice";

let currentPlayer: AudioPlayer | null = null;

/** Tear down the active recorded/clip audio player, if any. Does NOT touch TTS. */
function stopPlayer(): void {
  if (currentPlayer) {
    try {
      currentPlayer.remove();
    } catch {
      // ignore
    }
    currentPlayer = null;
  }
}

async function stopCurrent(): Promise<void> {
  stopPlayer();
  try {
    Speech.stop();
  } catch {
    // ignore
  }
}

// ============================================================
// Child-like voice.
//
// expo-speech only exposes the device's built-in TTS voices — it cannot
// synthesize a real toddler's voice (that needs a neural voice model /
// cloud TTS, which is out of scope for the local-only Phase 1).
//
// The closest approximation on-device is: pick a FEMALE English voice and
// raise the pitch so it reads younger. We resolve the voice once and cache it.
// ============================================================

// A high pitch shifts an adult female voice toward a young-child timbre.
const CHILD_PITCH = 1.7;
const CHILD_RATE = 0.9;

// After the whole word is spoken via TTS, wait this long before returning so
// the TTS engine has fully released the utterance. Prevents the first spelled
// letter from overlapping the word's audio tail (the clipped/rushed "H").
const WORD_TO_SPELLING_SETTLE_MS = 250;

let childVoiceId: string | null = null;
let voiceResolved = false;
let voiceResolving: Promise<void> | null = null;

// Heuristics: names that tend to be female and/or higher-pitched across
// iOS/Android built-in voices. Matched case-insensitively against voice name/id.
const FEMALE_HINTS = [
  "samantha", // iOS US female (default)
  "karen",
  "moira",
  "tessa",
  "fiona",
  "victoria",
  "susan",
  "allison",
  "ava",
  "zoe",
  "female",
];

async function resolveChildVoice(): Promise<void> {
  if (voiceResolved) return;
  if (voiceResolving) return voiceResolving;

  voiceResolving = (async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const english = voices.filter((v) =>
        (v.language || "").toLowerCase().startsWith("en")
      );
      const pool = english.length > 0 ? english : voices;

      const match = pool.find((v) => {
        const hay = `${v.name || ""} ${v.identifier || ""}`.toLowerCase();
        return FEMALE_HINTS.some((h) => hay.includes(h));
      });

      childVoiceId = match?.identifier ?? null;
    } catch {
      childVoiceId = null; // fall back to platform default voice
    } finally {
      voiceResolved = true;
    }
  })();

  return voiceResolving;
}

/**
 * Warm up TTS ahead of the spelling animation. The FIRST call to
 * `getAvailableVoicesAsync()` / the first TTS utterance on iOS carries a
 * one-time latency, which delayed the very first spelled letter's audio and
 * pushed it out of sync with its highlight (only on the first-ever word; by
 * "Again" the engine is already warm). Call this when a word screen mounts so
 * the voice is resolved before Phase 3 starts. Safe to call repeatedly.
 */
export async function primeSpeech(): Promise<void> {
  await resolveChildVoice();
}

/** Shared speech options that give the young-girl-ish voice. */
function childVoiceOptions(rate: number): Speech.SpeechOptions {
  const opts: Speech.SpeechOptions = { pitch: CHILD_PITCH, rate };
  if (childVoiceId) opts.voice = childVoiceId;
  return opts;
}

/**
 * Play a bundled voice-pack clip for `text` if one exists. Returns true if a
 * clip was found and played (to completion), false if there is no clip (caller
 * should then fall back to TTS). `trackAsCurrent` lets awaited playback be
 * interrupted by stopCurrent(); fire-and-forget callers pass false.
 */
async function playPackClip(text: string, trackAsCurrent: boolean): Promise<boolean> {
  const asset = voiceClip(text);
  if (asset == null) return false;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    const player = createAudioPlayer(asset);
    if (trackAsCurrent) currentPlayer = player;
    player.play();
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (!trackAsCurrent) {
          try {
            player.remove();
          } catch {
            // ignore
          }
        }
        resolve();
      };
      const sub = player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish || status.error) {
          sub?.remove?.();
          finish();
        }
      });
      setTimeout(finish, 8000);
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Speak/play a word. Resolves when audio finishes (approx for TTS).
 */
export async function playWord(opts: {
  word: string;
  audioUri: string | null;
  ttsEnabled: boolean;
}): Promise<void> {
  await stopCurrent();

  if (opts.audioUri) {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer({ uri: opts.audioUri });
      currentPlayer = player;
      player.play();

      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve();
        };
        const sub = player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish || status.error) {
            sub?.remove?.();
            finish();
          }
        });
        // Safety timeout in case the finish event never arrives.
        setTimeout(finish, 8000);
      });

      // The recorded clip finished on its own. Only release the audio PLAYER —
      // do NOT call Speech.stop() here. There is no TTS running after a recorded
      // clip, and an async Speech.stop() teardown racing the first spelled
      // letter's Speech.speak() was clipping the start of that letter (the
      // rushed/clipped "H" in "HOME"). The spelled letters own TTS from here.
      stopPlayer();
      return;
    } catch {
      // fall through to voice pack / TTS
    }
  }

  // Next priority: a bundled child-voice-pack clip for this word.
  if (await playPackClip(opts.word, true)) {
    // Same reasoning as the recorded-clip branch: release the player only, so a
    // pending Speech.stop() can't clip the first spelled letter that follows.
    stopPlayer();
    return;
  }

  // Last resort: on-device TTS.
  if (opts.ttsEnabled) {
    await resolveChildVoice();
    await new Promise<void>((resolve) => {
      Speech.speak(opts.word, {
        ...childVoiceOptions(CHILD_RATE),
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
    // Ensure the engine is fully idle before the caller starts spelling. On iOS
    // `onDone` can fire while the utterance is still tearing down; without this
    // the first spelled letter (e.g. "H" in "HOME") overlaps the tail of the
    // word and gets clipped/rushed. A stop + short settle hands the engine over
    // cleanly so the first letter behaves like every other letter.
    try {
      Speech.stop();
    } catch {
      // ignore
    }
    await new Promise<void>((resolve) => setTimeout(resolve, WORD_TO_SPELLING_SETTLE_MS));
  }
}

/**
 * Speak a single letter aloud as it is highlighted during the spelling
 * animation. Uses TTS only. Fire-and-forget: the caller controls pacing via
 * the highlight timer, so this does not await.
 */
export function speakLetter(letter: string, ttsEnabled: boolean): void {
  const ch = letter.trim();
  if (!ch) return;

  // Prefer a bundled child-voice clip for this letter, if one exists. This is
  // fire-and-forget; playPackClip stops any prior clip via createAudioPlayer.
  if (voiceClip(ch) != null) {
    // Stop any lingering speech first so letters stay in sync with the highlight.
    try {
      Speech.stop();
    } catch {
      // ignore
    }
    playPackClip(ch, true).catch(() => {});
    return;
  }

  // Fall back to on-device TTS (respecting the profile's TTS toggle).
  if (!ttsEnabled) return;
  resolveChildVoice();
  try {
    // NOTE: we intentionally do NOT Speech.stop() here. Some letter names take
    // noticeably longer to pronounce than others — e.g. "H" is "aitch", "W" is
    // "double-u" — and hard-stopping the previous utterance when the next
    // letter begins was clipping those longer names (the reported clipped "H"
    // in "HOME"). Letting expo-speech queue the letters means each one is spoken
    // in full; the highlight still advances on the caller's per-letter timer.
    // Speak the lowercase letter — passing an uppercase character makes some
    // TTS voices announce "capital A" instead of just the letter name.
    Speech.speak(ch.toLowerCase(), childVoiceOptions(0.85));
  } catch {
    // TTS is best-effort
  }
}

/**
 * Speak an arbitrary phrase aloud with the child-like voice (e.g. the welcome
 * greeting "Welcome, Rohit"). Resolves when speech finishes.
 */
export async function speakPhrase(phrase: string, ttsEnabled: boolean): Promise<void> {
  const text = phrase.trim();
  if (!text) return;
  await stopCurrent();

  // Prefer a bundled child-voice clip for the whole phrase (e.g. "welcome_rohit"
  // if generated, or a generic "welcome"). Falls through to TTS otherwise.
  if (await playPackClip(text, true)) {
    return;
  }

  if (!ttsEnabled) return;
  await resolveChildVoice();
  await new Promise<void>((resolve) => {
    Speech.speak(text, {
      ...childVoiceOptions(CHILD_RATE),
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export async function stopWord(): Promise<void> {
  await stopCurrent();
}

// ============================================================
// Reward sound — plays when the child completes the "press the letters"
// practice correctly. Plays a bundled applause clip if one is present,
// otherwise falls back to a spoken cheer so there is always audible reward.
//
// To use a real clapping sound, drop an mp3/m4a at
//   src/assets/applause.mp3
// and set APPLAUSE_ASSET below to `require("../assets/applause.mp3")`.
// ============================================================
const APPLAUSE_ASSET: number | null = null;

export async function playApplause(ttsEnabled: boolean): Promise<void> {
  // Do NOT stopCurrent() here — the reward may layer over other feedback.
  if (APPLAUSE_ASSET != null) {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer(APPLAUSE_ASSET);
      player.play();
      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          try {
            player.remove();
          } catch {
            // ignore
          }
          resolve();
        };
        const sub = player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish || status.error) {
            sub?.remove?.();
            finish();
          }
        });
        setTimeout(finish, 6000);
      });
      return;
    } catch {
      // fall through to spoken cheer
    }
  }

  // Fallback: a short spoken cheer so the reward is always audible.
  if (ttsEnabled) {
    await resolveChildVoice();
    await new Promise<void>((resolve) => {
      Speech.speak("Yay! Well done!", {
        ...childVoiceOptions(CHILD_RATE),
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
  }
}
