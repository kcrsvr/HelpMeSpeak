// ============================================================
// Local data model (Phase 1 — on-device only).
// Shapes are kept close to the AppSync @model shapes in design.md
// so the Phase 2 cloud migration is not a rewrite.
// ============================================================

import { ThemeId } from "../theme/themes";

export type SpellingSpeed = "slow" | "medium" | "fast";
export type PhotoType = "real" | "emoji";
export type AudioType = "recorded" | "tts";

/** Milliseconds per letter during the spelling animation. */
export const SPELLING_SPEED_MS: Record<SpellingSpeed, number> = {
  slow: 1200,
  medium: 800,
  fast: 500,
};

export interface Profile {
  id: string;
  name: string;
  avatarEmoji: string;
  theme: ThemeId;
  spellingSpeed: SpellingSpeed;
  gridSize: number; // 2 | 3 | 4
  ttsEnabled: boolean;
  animationEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  profileId: string;
  name: string;
  emoji: string;
  /** Local filesystem URI to a chosen photo; when set it is shown instead of the emoji. */
  imageUri: string | null;
  color: string;
  order: number;
  isBuiltIn: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Word {
  id: string;
  profileId: string;
  categoryId: string;
  word: string;
  /** Emoji used when photoType === "emoji". */
  emoji: string;
  /** Local filesystem URI when photoType === "real". */
  photoUri: string | null;
  photoType: PhotoType;
  /** Local filesystem URI to a recorded audio clip. */
  audioUri: string | null;
  audioType: AudioType;
  isFeatured: boolean;
  order: number;
  usageCount: number;
  lastUsedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/** App-wide singletons stored in the key/value settings table. */
export interface AppSettings {
  onboardingComplete: boolean;
  /** bcrypt-style hash of the caregiver PIN — never the raw PIN. */
  pinHash: string | null;
  activeProfileId: string | null;
}
