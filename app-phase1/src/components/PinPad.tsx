import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface PinPadProps {
  length: number; // number of digits entered so far
  maxLength?: number;
  onDigit: (d: string) => void;
  onDelete: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function PinPad({ length, maxLength = 4, onDigit, onDelete }: PinPadProps) {
  const { theme } = useTheme();

  return (
    <View>
      <View style={styles.dots}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: theme.primary },
              i < length && { backgroundColor: theme.primary },
            ]}
          />
        ))}
      </View>

      <View style={styles.pad}>
        {KEYS.map((k, i) => {
          if (k === "") return <View key={i} style={styles.keySpacer} />;
          const isDel = k === "del";
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={isDel ? "Delete" : `Digit ${k}`}
              onPress={() => (isDel ? onDelete() : onDigit(k))}
              style={({ pressed }) => [
                styles.key,
                { backgroundColor: theme.card },
                pressed && { backgroundColor: theme.featuredBg, transform: [{ scale: 0.94 }] },
              ]}
            >
              <Text style={[styles.keyText, { color: theme.text }]}>
                {isDel ? "⌫" : k}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 20,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: "transparent",
  },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  key: {
    width: "30%",
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  keySpacer: {
    width: "30%",
    height: 64,
  },
  keyText: {
    fontSize: 26,
    fontWeight: "800",
  },
});
