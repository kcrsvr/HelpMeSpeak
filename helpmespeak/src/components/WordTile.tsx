import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Word } from "../data/types";

interface WordTileProps {
  word: Word;
  onPress: () => void;
  /** number of columns in the grid — controls tile sizing */
  columns?: number;
}

export function WordTile({ word, onPress, columns = 2 }: WordTileProps) {
  const { theme } = useTheme();
  const emojiSize = columns >= 4 ? 34 : columns === 3 ? 40 : 48;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={word.word}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: pressed ? theme.primary : "transparent" },
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      {word.photoUri ? (
        <Image testID="word-photo" source={{ uri: word.photoUri }} style={styles.photo} resizeMode="cover" />
      ) : (
        <Text style={[styles.emoji, { fontSize: emojiSize }]}>{word.emoji}</Text>
      )}
      <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
        {word.word}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 120,
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 2,
    // subtle elevation
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emoji: { lineHeight: 56 },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 14, backgroundColor: "#eee" },
  label: { fontSize: 15, fontWeight: "800", textAlign: "center" },
});
