import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../theme/ThemeContext";
import { useApp } from "../state/AppContext";
import { WordRepo } from "../data/repositories";
import { SPELLING_SPEED_MS, Word } from "../data/types";
import { playWord, speakLetter, stopWord } from "../utils/audio";
import { Confetti } from "../components/Confetti";
import { ScreenProps } from "../navigation/types";

type Phase = "loading" | "image" | "audio" | "spelling" | "celebrate";

export function WordExperienceScreen({ route, navigation }: ScreenProps<"WordExperience">) {
  const { wordId } = route.params;
  const { theme } = useTheme();
  const { activeProfile } = useApp();

  const [word, setWord] = useState<Word | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const scale = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cancelled = useRef(false);

  const animationEnabled = activeProfile?.animationEnabled ?? true;
  const ttsEnabled = activeProfile?.ttsEnabled ?? true;
  const letterMs = SPELLING_SPEED_MS[activeProfile?.spellingSpeed ?? "medium"];

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

      // Phase 1 — image enlarges
      setPhase("image");
      scale.setValue(1);
      Animated.timing(scale, {
        toValue: w.photoUri ? 1.4 : 2,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
      await wait(600);
      if (cancelled.current) return;

      // Phase 2 — audio
      setPhase("audio");
      await playWord({ word: w.word, audioUri: w.audioUri, ttsEnabled });
      if (cancelled.current) return;
      await wait(150);
      if (cancelled.current) return;

      // Phase 3 — spelling, letter by letter
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

      // Phase 4/5 — celebrate + again
      setPhase("celebrate");
      try {
        if (animationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // optional
      }
      WordRepo.recordUsage(w.id).catch(() => {});
    },
    [scale, ttsEnabled, animationEnabled, letterMs]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const w = await WordRepo.get(wordId);
      if (!active) return;
      setWord(w);
      if (w) run(w);
    })();
    return () => {
      active = false;
      cancelled.current = true;
      clearTimers();
      stopWord();
    };
  }, [wordId, run]);

  const again = () => {
    clearTimers();
    stopWord();
    if (word) run(word);
  };

  const goBack = () => {
    cancelled.current = true;
    clearTimers();
    stopWord();
    navigation.goBack();
  };

  if (!word) {
    return <View style={[styles.container, { backgroundColor: theme.primary }]} />;
  }

  const letters = word.word.replace(/\s+/g, "").split("");

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      {phase === "celebrate" && <Confetti colors={theme.confetti} />}

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

      <View style={styles.center}>
        {/* image / emoji */}
        {word.photoUri ? (
          <Animated.Image
            source={{ uri: word.photoUri }}
            style={[styles.photo, { transform: [{ scale }] }]}
          />
        ) : (
          <Animated.Text style={[styles.bigEmoji, { transform: [{ scale }] }]}>
            {word.emoji}
          </Animated.Text>
        )}

        {phase === "audio" && (
          <View style={styles.audioBlock}>
            <Text style={styles.audioLabel}>Speaking…</Text>
            <Waveform />
          </View>
        )}

        {(phase === "spelling" || phase === "celebrate") && (
          <View style={styles.lettersRow}>
            {letters.map((ch, i) => {
              const done = phase === "celebrate" || i < highlightIndex;
              const active = i === highlightIndex && phase === "spelling";
              return (
                <View
                  key={i}
                  style={[
                    styles.letter,
                    active && {
                      backgroundColor: theme.highlight,
                      transform: [{ scale: 1.5 }],
                    },
                    done && { backgroundColor: "rgba(255,255,255,0.35)" },
                  ]}
                >
                  <Text
                    style={[
                      styles.letterText,
                      active && { color: "#1A1A1A" },
                      done && { color: "#FFF" },
                    ]}
                  >
                    {ch.toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {phase === "celebrate" && (
          <View style={styles.celebrateBlock}>
            <Text style={styles.wordLabel}>{word.word}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Play again"
              onPress={again}
              style={({ pressed }) => [
                styles.againBtn,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text style={[styles.againText, { color: theme.primary }]}>Again? 🔁</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function Waveform() {
  const bars = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const anims = useRef(bars.map(() => new Animated.Value(0.4))).current;

  useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, {
            toValue: 1,
            duration: 400,
            delay: i * 60,
            useNativeDriver: true,
          }),
          Animated.timing(a, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);

  return (
    <View style={styles.waveform}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[styles.waveBar, { transform: [{ scaleY: a }] }]}
        />
      ))}
    </View>
  );
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  bigEmoji: { fontSize: 80, lineHeight: 96 },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  audioBlock: { alignItems: "center", marginTop: 56, gap: 16 },
  audioLabel: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  waveform: { flexDirection: "row", alignItems: "center", gap: 5, height: 50 },
  waveBar: { width: 6, height: 44, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.9)" },
  lettersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 56,
    paddingHorizontal: 16,
  },
  letter: {
    width: 48,
    height: 58,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: { fontSize: 26, fontWeight: "900", color: "rgba(255,255,255,0.6)" },
  celebrateBlock: { alignItems: "center", marginTop: 32, gap: 24 },
  wordLabel: { fontSize: 34, fontWeight: "900", color: "#FFF", letterSpacing: 4 },
  againBtn: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingHorizontal: 48,
    paddingVertical: 20,
    minHeight: 72,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  againText: { fontSize: 24, fontWeight: "900" },
});
