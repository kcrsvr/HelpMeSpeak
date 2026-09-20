import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "../theme/ThemeContext";
import { useApp } from "../state/AppContext";
import { WordRepo } from "../data/repositories";
import { SPELLING_SPEED_MS, Word } from "../data/types";
import { playApplause, playWord, primeSpeech, speakLetter, stopWord } from "../utils/audio";
import { Confetti } from "../components/Confetti";
import { ScreenProps } from "../navigation/types";

type Phase = "loading" | "image" | "audio" | "spelling" | "celebrate";

// How much bigger the reward confetti burst is when the child completes the
// "press the letters" practice (3x the normal celebrate burst).
const REWARD_CONFETTI_INTENSITY = 3;

// How much the picture "pops" on entrance before settling back to 1x.
// Kept small so the transient scaled size never spills onto the letters below.
const ENTRANCE_POP = 1.08;

export function WordExperienceScreen({ route, navigation }: ScreenProps<"WordExperience">) {
  const { wordId } = route.params;
  const { theme } = useTheme();
  const { activeProfile } = useApp();

  const [word, setWord] = useState<Word | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [layout, setLayout] = useState<LayoutSize | null>(null);

  // --- interactive "press the letters" practice mode ---
  const [practice, setPractice] = useState(false);
  // How many letters the child has pressed correctly, left to right.
  const [pressedCount, setPressedCount] = useState(0);
  // The letter tile currently replaying its highlight animation on tap.
  const [flashIndex, setFlashIndex] = useState(-1);
  // Amplified confetti reward after finishing the whole word correctly.
  const [reward, setReward] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCenterLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, []);

  const scale = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cancelled = useRef(false);

  const animationEnabled = activeProfile?.animationEnabled ?? true;
  const ttsEnabled = activeProfile?.ttsEnabled ?? true;
  const letterMs = SPELLING_SPEED_MS[activeProfile?.spellingSpeed ?? "medium"];

  // Show the video only when the word has one AND motion is allowed for this
  // child. When animation is disabled we fall back to the still photo (if any)
  // or the emoji, so the sensory setting is respected.
  const showVideo = !!word?.videoUri && animationEnabled;

  // A single muted, looping player for the word's clip. The video carries NO
  // audio of its own — the app owns the voice (playWord/TTS) — so we always
  // mute it. Source is set imperatively once the word loads.
  const videoPlayer = useVideoPlayer(null, (player) => {
    player.muted = true;
    player.loop = true;
    // The clip is silent and must NOT take over the audio session, or it
    // interrupts the spoken word/letters (e.g. clipping the first letter's
    // audio). "mixWithOthers" lets it coexist with the TTS/recorded voice.
    player.audioMixingMode = "mixWithOthers";
  });

  // Restart the clip from the beginning and play. Used on first load and again
  // whenever the child taps "Again?" so the living picture visibly replays.
  const restartVideo = useCallback(() => {
    if (!showVideo || !word?.videoUri) return;
    try {
      videoPlayer.muted = true;
      videoPlayer.loop = true;
      videoPlayer.audioMixingMode = "mixWithOthers";
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    } catch {
      // playback is a non-essential enhancement; ignore failures
    }
  }, [showVideo, word?.videoUri, videoPlayer]);

  // Load the source when the word/visibility changes, then start looping.
  useEffect(() => {
    if (showVideo && word?.videoUri) {
      try {
        videoPlayer.muted = true;
        videoPlayer.loop = true;
        videoPlayer.audioMixingMode = "mixWithOthers";
        videoPlayer.replace({ uri: word.videoUri });
        videoPlayer.play();
      } catch {
        // ignore
      }
    } else {
      try {
        videoPlayer.pause();
      } catch {
        // ignore
      }
    }
  }, [showVideo, word?.videoUri, videoPlayer]);

  // Belt-and-suspenders loop: some platforms/clips don't honour `loop` reliably
  // after `replace()`, so when playback reaches the end we seek back to the
  // start and keep it going — the "living picture" never stops.
  useEffect(() => {
    if (!showVideo) return undefined;
    const sub = videoPlayer.addListener("playToEnd", () => {
      try {
        videoPlayer.currentTime = 0;
        videoPlayer.play();
      } catch {
        // ignore
      }
    });
    return () => {
      try {
        sub?.remove?.();
      } catch {
        // ignore
      }
    };
  }, [showVideo, videoPlayer]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(resolve, ms);
      timers.current.push(t);
    });

  const run = useCallback(
    async (w: Word) => {
      cancelled.current = false;
      setHighlightIndex(-1);

      // Phase 1 — image "pops" in. The picture is already sized large, so a
      // gentle pop reads well; a big zoom would visually spill the scaled image
      // past its layout box and onto the letters below. It settles back to 1x
      // so the letters/button below have zero scale overshoot to contend with.
      setPhase("image");
      scale.setValue(0.85);
      Animated.sequence([
        Animated.timing(scale, {
          toValue: ENTRANCE_POP,
          duration: 360,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      await wait(600);
      if (cancelled.current) return;

      // Phase 2 — play the whole word once, up front. The picture stays on
      // screen (no separate "Speaking" indicator).
      setPhase("audio");
      await playWord({ word: w.word, audioUri: w.audioUri, ttsEnabled });
      if (cancelled.current) return;
      await wait(150);
      if (cancelled.current) return;

      // Phase 3 — spelling, letter by letter.
      // Ensure the TTS voice is resolved BEFORE the first letter so its audio
      // starts in lockstep with the highlight (otherwise first-time voice
      // resolution latency clipped/desynced the first letter on a fresh word).
      await primeSpeech();
      if (cancelled.current) return;
      setPhase("spelling");
      const letters = w.word.replace(/\s+/g, "").split("");
      for (let i = 0; i < letters.length; i++) {
        if (cancelled.current) return;
        setHighlightIndex(i);
        // Speak the letter aloud in sync with its highlight.
        speakLetter(letters[i], ttsEnabled);
        try {
          if (animationEnabled) Haptics.selectionAsync();
        } catch {
          // haptics optional
        }
        await wait(letterMs);
      }
      setHighlightIndex(-1);
      if (cancelled.current) return;

      // Phase 3b — play the whole word once more, after spelling it out.
      await wait(200);
      if (cancelled.current) return;
      await playWord({ word: w.word, audioUri: w.audioUri, ttsEnabled });
      if (cancelled.current) return;

      // Phase 4/5 — celebrate + again
      setPhase("celebrate");
      try {
        if (animationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // optional
      }
    },
    [scale, ttsEnabled, animationEnabled, letterMs]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      // Warm up TTS immediately so the first spelled letter's audio isn't
      // delayed by first-time voice resolution (which desynced "H" from its
      // highlight on the very first word). Fire-and-forget; run() also awaits it.
      primeSpeech().catch(() => {});
      const w = await WordRepo.get(wordId);
      if (!active) return;
      setWord(w);
      if (w) {
        // Record usage as soon as the word is opened. Opening a word IS using
        // it, so this must not depend on the child watching the full animation
        // + spelling sequence (which is easy to leave early — previously the
        // recordUsage call sat at the tail of run() and was skipped whenever
        // the screen unmounted first, so Recently Used never populated).
        WordRepo.recordUsage(w.id).catch(() => {});
        run(w);
      }
    })();
    return () => {
      active = false;
      cancelled.current = true;
      clearTimers();
      if (flashTimer.current) clearTimeout(flashTimer.current);
      stopWord();
    };
  }, [wordId, run]);

  const resetPractice = () => {
    if (flashTimer.current) {
      clearTimeout(flashTimer.current);
      flashTimer.current = null;
    }
    setPractice(false);
    setPressedCount(0);
    setFlashIndex(-1);
    setReward(false);
  };

  const again = () => {
    clearTimers();
    stopWord();
    resetPractice();
    restartVideo(); // replay the living picture from the top
    if (word) run(word);
  };

  const goBack = () => {
    cancelled.current = true;
    clearTimers();
    if (flashTimer.current) clearTimeout(flashTimer.current);
    stopWord();
    navigation.goBack();
  };

  // Enter interactive practice: the child taps the letters left to right.
  const startPractice = () => {
    clearTimers();
    stopWord();
    cancelled.current = true; // stop any running auto-spell sequence
    setHighlightIndex(-1);
    setReward(false);
    setPressedCount(0);
    setFlashIndex(-1);
    setPractice(true);
    setPhase("celebrate"); // keep the letters + buttons visible
    restartVideo(); // keep the living picture looping during practice
  };

  // Handle a tap on a letter tile during practice.
  const onPressLetter = (index: number) => {
    if (!practice || !word) return;
    const wordLetters = word.word.replace(/\s+/g, "").split("");

    // Only the next expected letter (left to right) counts.
    if (index !== pressedCount) {
      try {
        if (animationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // optional
      }
      return;
    }

    // Replay the single-letter spell animation: highlight + speak, same style.
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashIndex(index);
    speakLetter(wordLetters[index], ttsEnabled);
    try {
      if (animationEnabled) Haptics.selectionAsync();
    } catch {
      // optional
    }
    flashTimer.current = setTimeout(() => setFlashIndex(-1), letterMs);

    const nextCount = pressedCount + 1;
    setPressedCount(nextCount);

    // Finished the whole word correctly → amplified confetti + applause reward.
    if (nextCount >= wordLetters.length) {
      setReward(true);
      try {
        if (animationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // optional
      }
      playApplause(ttsEnabled).catch(() => {});
    }
  };

  if (!word) {
    return <View style={[styles.container, { backgroundColor: theme.primary }]} />;
  }

  const letters = word.word.replace(/\s+/g, "").split("");
  const dims = computeDynamicSizes(layout, letters.length);

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      {/* Confetti is a reward: only after the child presses every letter in
          the correct order during practice. No confetti on the auto sequence. */}
      {reward && <Confetti colors={theme.confetti} intensity={REWARD_CONFETTI_INTENSITY} />}

      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </SafeAreaView>

      <View style={styles.center} onLayout={onCenterLayout}>
        {/* video / image / emoji — sized to the device and word length */}
        {showVideo ? (
          <Animated.View
            style={[
              styles.photoBorder,
              {
                width: dims.imageSize,
                height: dims.imageSize,
                borderRadius: dims.imageSize * 0.16,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.2)",
                transform: [{ scale }],
              },
            ]}
          >
            <VideoView
              player={videoPlayer}
              style={styles.videoFill}
              contentFit="cover"
              nativeControls={false}
              allowsPictureInPicture={false}
            />
          </Animated.View>
        ) : word.photoUri ? (
          <Animated.Image
            source={{ uri: word.photoUri }}
            style={[
              styles.photo,
              styles.photoBorder,
              {
                width: dims.imageSize,
                height: dims.imageSize,
                borderRadius: dims.imageSize * 0.16,
                transform: [{ scale }],
              },
            ]}
          />
        ) : (
          <Animated.Text
            style={[
              styles.bigEmoji,
              {
                fontSize: dims.emojiSize,
                lineHeight: dims.emojiSize * 1.2,
                transform: [{ scale }],
              },
            ]}
          >
            {word.emoji}
          </Animated.Text>
        )}

        {(phase === "audio" || phase === "spelling" || phase === "celebrate") && (
          <View
            style={[
              styles.lettersRow,
              { gap: dims.letterGap, marginTop: dims.lettersMarginTop },
            ]}
          >
            {letters.map((ch, i) => {
              const baseTile = {
                width: dims.tileWidth,
                height: dims.tileHeight,
                borderRadius: dims.tileWidth * 0.25,
              };

              // ---- PRACTICE ("Press") mode: a distinct look from the auto
              // sequence, plus an animated "press me next" cue on the current
              // target letter so the child feels the urge to tap it.
              if (practice) {
                const isFlashing = i === flashIndex; // just tapped, popping
                const isPressed = i < pressedCount && !isFlashing; // already done
                const isNext = i === pressedCount && !isFlashing; // press me next

                return (
                  <PracticeLetterTile
                    key={i}
                    char={ch}
                    baseTile={baseTile}
                    fontSize={dims.letterFontSize}
                    state={isFlashing ? "flashing" : isPressed ? "pressed" : isNext ? "next" : "pending"}
                    highlightColor={theme.highlight}
                    onPress={() => onPressLetter(i)}
                  />
                );
              }

              // ---- AUTO ("Again") mode: unchanged spell-out styling.
              const active = i === highlightIndex && phase === "spelling";
              const done = phase === "celebrate" || i < highlightIndex;
              const tileStyle = [
                styles.letter,
                baseTile,
                active && {
                  backgroundColor: theme.highlight,
                  transform: [{ scale: 1.5 }],
                },
                done && { backgroundColor: "rgba(255,255,255,0.35)" },
              ];
              const textStyle = [
                styles.letterText,
                { fontSize: dims.letterFontSize },
                active && { color: "#1A1A1A" },
                done && { color: "#FFF" },
              ];

              return (
                <View key={i} style={tileStyle}>
                  <Text style={textStyle}>{ch.toUpperCase()}</Text>
                </View>
              );
            })}
          </View>
        )}

        {phase === "celebrate" && (
          <View
            style={[
              styles.celebrateBlock,
              { marginTop: dims.celebrateMarginTop },
            ]}
          >
            <View style={styles.buttonRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Play again"
                onPress={again}
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    minHeight: dims.buttonHeight,
                    paddingVertical: Math.max((dims.buttonHeight - 32) / 2, 10),
                  },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={[styles.actionText, { color: theme.primary }]}>Again? 🔁</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Press the letters yourself"
                onPress={startPractice}
                style={({ pressed }) => [
                  styles.actionBtn,
                  practice && { backgroundColor: theme.highlight },
                  {
                    minHeight: dims.buttonHeight,
                    paddingVertical: Math.max((dims.buttonHeight - 32) / 2, 10),
                  },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={[styles.actionText, { color: theme.primary }]}>Press 👆</Text>
              </Pressable>
            </View>

            {practice && !reward && (
              <Text style={styles.practiceHint}>Tap the letters in order 👉</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

type PracticeState = "pending" | "next" | "pressed" | "flashing";

/**
 * A single letter tile in "Press" practice mode.
 *
 * The "next" letter (the one the child should press) gently PULSES — a soft
 * breathing scale plus a grey→light background shimmer — to draw the eye and
 * invite a tap, without the harshness of a hard blink (kinder for sensory
 * sensitivity). When pressed it settles into the enlarged highlight-colour
 * "done" look, and the pulse automatically moves to the new next letter.
 */
function PracticeLetterTile({
  char,
  baseTile,
  fontSize,
  state,
  highlightColor,
  onPress,
}: {
  char: string;
  baseTile: { width: number; height: number; borderRadius: number };
  fontSize: number;
  state: PracticeState;
  highlightColor: string;
  onPress: () => void;
}) {
  // 0..1 drives the pulse for the "next" tile.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === "next") {
      pulse.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // backgroundColor can't use native driver
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return () => {
        loop.stop();
        pulse.setValue(0);
      };
    }
    // non-next states: make sure the pulse is reset
    pulse.setValue(0);
    return undefined;
  }, [state, pulse]);

  // Static (non-animated) states.
  if (state === "pressed" || state === "flashing") {
    const scale = state === "flashing" ? 1.6 : 1.2;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Letter ${char.toUpperCase()}`}
        onPress={onPress}
        style={[
          styles.letter,
          baseTile,
          { backgroundColor: highlightColor, transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.letterText, { fontSize, color: "#1A1A1A", fontWeight: "900" }]}>
          {char.toUpperCase()}
        </Text>
      </Pressable>
    );
  }

  if (state === "pending") {
    // Not yet reached — dim and quiet.
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Letter ${char.toUpperCase()}`}
        onPress={onPress}
        style={[styles.letter, baseTile, styles.pendingTile]}
      >
        <Text style={[styles.letterText, { fontSize, color: "rgba(255,255,255,0.6)" }]}>
          {char.toUpperCase()}
        </Text>
      </Pressable>
    );
  }

  // state === "next" → animated grey→light pulse + gentle scale breathing.
  const animatedBg = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(200,200,200,0.35)", "rgba(255,255,255,0.85)"],
  });
  const animatedScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  return (
    <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Press letter ${char.toUpperCase()}`}
        onPress={onPress}
      >
        <Animated.View style={[styles.letter, baseTile, { backgroundColor: animatedBg }]}>
          <Text style={[styles.letterText, { fontSize, color: "#1A2A3A", fontWeight: "900" }]}>
            {char.toUpperCase()}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

type LayoutSize = { width: number; height: number };

type DynamicSizes = {
  imageSize: number;
  emojiSize: number;
  tileWidth: number;
  tileHeight: number;
  letterGap: number;
  letterFontSize: number;
  lettersMarginTop: number;
  celebrateMarginTop: number;
  celebrateGap: number;
  buttonHeight: number;
};

/**
 * Compute the largest picture and letter sizes that fit the available area for
 * the given word length. Everything scales off the measured layout box so it
 * adapts to phone vs. tablet, portrait vs. landscape, and short vs. long words.
 */
function computeDynamicSizes(layout: LayoutSize | null, letterCount: number): DynamicSizes {
  // Sensible fallback before the layout box has been measured.
  const width = layout?.width ?? 360;
  const height = layout?.height ?? 640;
  const count = Math.max(letterCount, 1);

  const horizontalPadding = 32; // matches styles.center padding * 2 (approx)
  const verticalPadding = 32; // center padding top+bottom
  const usableWidth = Math.max(width - horizontalPadding, 120);
  const usableHeight = Math.max(height - verticalPadding, 200);

  // Chrome that must coexist with the letters and image during the celebrate
  // phase: the word label + the "Again?" button + margins/gaps between the three
  // stacked blocks. On short screens (landscape phones) this spacing is scaled
  // down via `compact` so everything still fits without overlap.
  const compact = clamp(usableHeight / 640, 0.5, 1); // 1 on tall screens, 0.5 on short
  const buttonHeight = Math.round(clamp(56 * compact, 44, 72)); // keep a tappable min (44)
  // Generous top margin so the active letter (which scales to 1.5x and grows
  // upward) always has clear space above the row and never touches the picture.
  const lettersTopMargin = Math.round(72 * compact);
  const celebrateTopMargin = Math.round(56 * compact);
  const celebrateInnerGap = Math.round(24 * compact);

  // --- Letter tiles ---------------------------------------------------------
  // The tile width is bounded by BOTH constraints:
  //   (a) width: all tiles + gaps must fit on one row within usableWidth
  //   (b) height: the tile row, image, and celebrate block must all fit the
  //       usable height. On short (landscape) screens this is the tight one.
  const minGap = 4;
  const maxGap = 14;
  const gap = clamp(usableWidth / (count * 6), minGap, maxGap);

  // (a) widest tile that fits the row horizontally.
  const widthCappedTile = (usableWidth - gap * (count - 1)) / count;

  // (b) a height-aware ceiling. On short screens the letter row must claim a
  // smaller share so the image and celebrate block still fit. tileHeight is
  // tileWidth * 1.2, so cap tileWidth accordingly.
  const rowHeightShare = 0.22 * compact + 0.06; // ~0.28 tall, ~0.17 short
  const heightCappedTile = (usableHeight * rowHeightShare) / 1.2;

  // Never below 20px so tiles stay legible even for long words on small screens;
  // the row is allowed to get narrow but must fit one line.
  let tileWidth = clamp(Math.min(widthCappedTile, heightCappedTile), 20, 120);
  const tileHeight = tileWidth * 1.2;
  const letterFontSize = clamp(tileWidth * 0.62, 14, 84);

  // --- Picture/emoji: take whatever vertical space is left ------------------
  // Reserve room for the letter row AND the celebrate block (now just the
  // "Again?" button), or they overlap the picture. A tapped letter scales up to
  // 1.6x from its center in practice mode, so it grows ~0.3*tileHeight ABOVE the
  // row's normal top edge — the top margin plus this headroom keeps that growth
  // off the picture on every device size.
  const activeOvershoot = tileHeight * 0.3;
  const lettersBlock = lettersTopMargin + tileHeight + activeOvershoot;
  // Celebrate block = the button row (Again + Press, side by side so height is
  // one button) plus a practice-hint line (~24px) that can appear below it.
  const celebrateBlock = celebrateTopMargin + buttonHeight + 24;
  const reservedBelowImage = lettersBlock + celebrateBlock;
  // Floor of 90 keeps a visible picture even in the most cramped landscape case.
  const availableForImage = Math.max(usableHeight - reservedBelowImage, 90);
  const imageSize = clamp(Math.min(availableForImage, usableWidth * 0.9), 90, 560);
  const emojiSize = clamp(Math.min(availableForImage, usableWidth) * 0.9, 60, 400);

  return {
    imageSize,
    emojiSize,
    tileWidth,
    tileHeight,
    letterGap: gap,
    letterFontSize,
    lettersMarginTop: lettersTopMargin,
    celebrateMarginTop: celebrateTopMargin,
    celebrateGap: celebrateInnerGap,
    buttonHeight,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeTop: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  backBtn: {
    margin: 16,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    minHeight: 40,
    justifyContent: "center",
  },
  backText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  // bigEmoji fontSize/lineHeight are set dynamically at render time.
  bigEmoji: { textAlign: "center" },
  // photo width/height/borderRadius are set dynamically at render time.
  photo: {
    backgroundColor: "rgba(255,255,255,0.2)",
    resizeMode: "cover",
  },
  // fills the bordered wrapper for the video player (border/rounding live on the wrapper)
  videoFill: { width: "100%", height: "100%" },
  // thick white border framing the picture
  photoBorder: {
    borderWidth: 6,
    borderColor: "#FFF",
  },
  lettersRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 8,
  },
  // letter width/height/borderRadius are set dynamically at render time.
  letter: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Muted look for letters not yet pressed in practice mode, so the pressed
  // (bold, bigger, accent-colored) ones clearly stand out.
  pendingTile: { backgroundColor: "rgba(255,255,255,0.12)", opacity: 0.7 },
  // letterText fontSize is set dynamically at render time.
  letterText: { fontWeight: "900", color: "rgba(255,255,255,0.6)" },
  celebrateBlock: { alignItems: "center", marginTop: 32, gap: 12 },
  buttonRow: { flexDirection: "row", gap: 14, justifyContent: "center", alignItems: "center" },
  actionBtn: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 20,
    minHeight: 72,
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: 22, fontWeight: "900" },
  practiceHint: { color: "#FFF", fontSize: 15, fontWeight: "700", opacity: 0.95 },
});
