import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

const EMOJIS = ["🎈", "✨", "🎉", "⭐", "🎊"];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  emoji: string;
  size: number;
}

/**
 * Lightweight celebratory confetti — a burst of emoji + colored dots that
 * fall from the top. Pure Animated, no extra dependency.
 */
export function Confetti({ colors }: { colors: readonly string[] }) {
  const { height, width } = Dimensions.get("window");

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 26 }).map(() => ({
        left: Math.random() * width,
        delay: Math.random() * 400,
        duration: 1600 + Math.random() * 1200,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        size: 20 + Math.random() * 16,
      })),
    [width]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <FallingPiece key={i} piece={p} screenHeight={height} color={colors[i % colors.length]} />
      ))}
    </View>
  );
}

function FallingPiece({
  piece,
  screenHeight,
  color,
}: {
  piece: Piece;
  screenHeight: number;
  color: string;
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
    outputRange: [-40, screenHeight + 40],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "720deg"],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0],
  });

  // alternate between emoji and colored dot for variety
  const isDot = piece.size > 30;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: piece.left,
        transform: [{ translateY }, { rotate }],
        opacity,
      }}
    >
      {isDot ? (
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: color,
          }}
        />
      ) : (
        <Animated.Text style={{ fontSize: piece.size }}>{piece.emoji}</Animated.Text>
      )}
    </Animated.View>
  );
}
