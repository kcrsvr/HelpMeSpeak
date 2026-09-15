import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { useApp } from "../state/AppContext";
import { WordRepo } from "../data/repositories";
import { Word } from "../data/types";
import { WordTile } from "../components/WordTile";
import { ScreenProps } from "../navigation/types";

// Favorites always shows a 2-column tile grid (with pictures), as requested.
const COLUMNS = 2;

export function FavoritesScreen({ navigation }: ScreenProps<"Favorites">) {
  const { theme } = useTheme();
  const { activeProfile } = useApp();
  const [words, setWords] = useState<Word[]>([]);

  const load = useCallback(async () => {
    if (!activeProfile) return;
    setWords(await WordRepo.listFeatured(activeProfile.id));
  }, [activeProfile]);

  // Reload whenever the screen regains focus (e.g. after caregiver edits).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Build rows of COLUMNS items for a simple grid.
  const rows: Word[][] = [];
  for (let i = 0; i < words.length; i += COLUMNS) {
    rows.push(words.slice(i, i + COLUMNS));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.headerBg }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.headerText }]}>⭐ Favorites</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.grid}>
        {words.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textLight }]}>
            No favorites yet. A caregiver can mark words as featured in Caregiver Mode.
          </Text>
        ) : (
          rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((w) => (
                <WordTile
                  key={w.id}
                  word={w}
                  columns={COLUMNS}
                  onPress={() => navigation.navigate("WordExperience", { wordId: w.id })}
                />
              ))}
              {/* pad the last row so tiles keep their width */}
              {row.length < COLUMNS &&
                Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                  <View key={`pad-${i}`} style={{ flex: 1 }} />
                ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* bottom nav — matches ChildHome, with Favorites active */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: theme.navBg }}>
        <View style={[styles.nav, { backgroundColor: theme.navBg }]}>
          <NavTab
            icon="🏠"
            label="Home"
            onPress={() => navigation.navigate("ChildHome")}
            color={theme.navActive}
            textLight={theme.textLight}
          />
          <NavTab
            icon="⭐"
            label="Favorites"
            active
            onPress={() => {}}
            color={theme.navActive}
            textLight={theme.textLight}
          />
          <NavTab
            icon="🕒"
            label="Recent"
            onPress={() => navigation.navigate("RecentlyUsed")}
            color={theme.navActive}
            textLight={theme.textLight}
          />
          <NavTab
            icon="🔒"
            label="Caregiver"
            onPress={() => navigation.navigate("PinGate")}
            color={theme.navActive}
            textLight={theme.textLight}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function NavTab({
  icon,
  label,
  active,
  onPress,
  color,
  textLight,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
  color: string;
  textLight: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.navTabWrap, pressed && { transform: [{ scale: 0.92 }] }]}
    >
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={[styles.navLabel, { color: active ? color : textLight }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  title: { fontSize: 20, fontWeight: "900" },
  grid: { padding: 16, gap: 14 },
  row: { flexDirection: "row", gap: 14 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 15, fontWeight: "600", paddingHorizontal: 20 },
  nav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    paddingTop: 8,
  },
  navTabWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, minHeight: 56 },
  navIcon: { fontSize: 24 },
  navLabel: { fontSize: 11, fontWeight: "700" },
});
