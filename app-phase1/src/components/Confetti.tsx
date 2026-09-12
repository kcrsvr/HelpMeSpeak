import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

// Celebratory emojis — a rich mix of party bits, animals, and birds so the
// reward feels alive and fun for kids.
const PARTY_EMOJIS = ["🎈", "✨", "🎉", "⭐", "🎊", "🌟", "💫", "🌈", "🍭", "🎀"];
const ANIMAL_EMOJIS = [
  "🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
  "🐷", "🐸", "🐵", "🦄", "🐝", "🦋", "🐢", "🐙", "🐳", "🐬",
];
const BIRD_EMOJIS = ["🐦", "🐤", "🐥", "🦆", "🦉", "🦜", "🕊️", "🐧", "🦚", "🦩"];

const ALL_EMOJIS = [...PARTY_EMOJIS, ...ANIMAL_EMOJIS, ...BIRD_EMOJIS];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  emoji: string | null; // null => colored dot
  size: number;
  swayAmp: number; // horizontal sway amplitude
  swayPhase: number; // 0 or 1 — sway direction
  spin: number; // total rotation in degrees
  color: string;
}

/**
 * Rich celebratory confetti — a lively fall of party bits, animals, and birds
 * mixed with colored dots. Pieces drift/sway as they fall and spin for a fuller,
 * more organic burst. Pure Animated, no extra dependency.
 *
 * `intensity` multiplies the number of pieces for a bigger reward burst
 * (e.g. 2 or 3 for the "practice completed" celebration). Defaults to 1.
 */
export function Confetti({
  colors,
  intensity = 1,
}: {
  colors: readonly string[];
  intensity?: number;
}) {
  const { height, width } = Dimensions.get("window");
  const count = Math.round(40 * Math.max(intensity, 1));

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }).map((_, i) => {
        // ~65% fun emojis (animals/birds/party), ~35% colored dots.
        const isDot = Math.random() < 0.35;
        return {
          left: Math.random() * width,
          delay: Math.random() * 650,
          duration: 1800 + Math.random() * 1600,
          emoji: isDot ? null : ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)],
          size: 22 + Math.random() * 22,
          swayAmp: 18 + Math.random() * 42,
          swayPhase: Math.random() < 0.5 ? 0 : 1,
          spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
          color: colors[i % colors.length],
        };
      }),
    [width, count, colors]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <FallingPiece key={i} piece={p} screenHeight={height} />
      ))}
    </View>
  );
}

function FallingPiece({
  piece,
  screenHeight,
}: {
  piece: Piece;
  screenHeight: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [progress, piece]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, screenHeight + 60],
  });

  // Gentle side-to-side sway so pieces drift like real confetti instead of
  // falling straight down.
  const sway = piece.swayAmp;
  const translateX = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange:
      piece.swayPhase === 0
        ? [0, sway, 0, -sway, 0]
        : [0, -sway, 0, sway, 0],
  });

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${piece.spin}deg`],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.05, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: piece.left,
        transform: [{ translateY }, { translateX }, { rotate }],
        opacity,
      }}
    >
      {piece.emoji === null ? (
        <View
          style={{
            width: piece.size * 0.5,
            height: piece.size * 0.5,
            borderRadius: piece.size * 0.25,
            backgroundColor: piece.color,
          }}
        />
      ) : (
        <Animated.Text style={{ fontSize: piece.size }}>{piece.emoji}</Animated.Text>
      )}
    </Animated.View>
  );
}
