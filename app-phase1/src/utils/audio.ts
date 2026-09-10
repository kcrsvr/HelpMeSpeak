// ============================================================
// Audio playback: plays a caregiver's recorded clip if present,
// otherwise falls back to on-device TTS (when the profile allows it).
// Returns roughly when playback finishes so the word experience can
// sequence the spelling animation after the audio.
// ============================================================

import { Audio } from "expo-av";
import * as Speech from "expo-speech";

let currentSound: Audio.Sound | null = null;

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

/** Shared speech options that give the young-girl-ish voice. */
function childVoiceOptions(rate: number): Speech.SpeechOptions {
  const opts: Speech.SpeechOptions = { pitch: CHILD_PITCH, rate };
  if (childVoiceId) opts.voice = childVoiceId;
  return opts;
}

async function stopCurrent(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.unloadAsync();
    } catch {
      // ignore
    }
    currentSound = null;
  }
  try {
    Speech.stop();
  } catch {
    // ignore
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
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: opts.audioUri },
        { shouldPlay: true }
      );
      currentSound = sound;
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) resolve();
          if (!status.isLoaded && (status as any).error) resolve();
        });
      });
      await stopCurrent();
      return;
    } catch {
      // fall through to TTS
    }
  }

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
  }
}

/**
 * Speak a single letter aloud as it is highlighted during the spelling
 * animation. Uses TTS only (letters are never pre-recorded). Fire-and-forget:
 * the caller controls pacing via the highlight timer, so this does not await.
 *
 * We spell using the letter's phonetic name where the raw character would be
 * ambiguous or silent to TTS ("A" reads fine, but a bare letter is spoken as
 * its name, which is exactly what we want for spelling).
 */
export function speakLetter(letter: string, ttsEnabled: boolean): void {
  if (!ttsEnabled) return;
  const ch = letter.trim();
  if (!ch) return;
  // Ensure the child voice is resolved (cached after the first call).
  resolveChildVoice();
  try {
    // Stop any lingering utterance so letters don't queue up and drift
    // out of sync with the highlight.
    Speech.stop();
    // Speak the lowercase letter — passing an uppercase character makes some
    // TTS voices announce "capital A" instead of just the letter name.
    Speech.speak(ch.toLowerCase(), childVoiceOptions(0.85));
  } catch {
    // TTS is best-effort
  }
}

export async function stopWord(): Promise<void> {
  await stopCurrent();
}
