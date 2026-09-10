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

export function CategoryScreen({ route, navigation }: ScreenProps<"Category">) {
  const { categoryId, categoryName } = route.params;
  const { theme } = useTheme();
  const { activeProfile } = useApp();
  const [words, setWords] = useState<Word[]>([]);

  const columns = activeProfile?.gridSize ?? 2;

  const load = useCallback(async () => {
    setWords(await WordRepo.listForCategory(categoryId));
  }, [categoryId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // build rows of `columns` items for a simple grid without a FlatList
  const rows: Word[][] = [];
  for (let i = 0; i < words.length; i += columns) {
    rows.push(words.slice(i, i + columns));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.headerBg }}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.headerText }]} numberOfLines={1}>
            {categoryName}
          </Text>
          <View style={{ width: 80 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.grid}>
        {words.length === 0 && (
          <Text style={[styles.empty, { color: theme.textLight }]}>
            No words here yet. Add some in Caregiver Mode.
          </Text>
        )}
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((w) => (
              <WordTile
                key={w.id}
                word={w}
                columns={columns}
                onPress={() => navigation.navigate("WordExperience", { wordId: w.id })}
              />
            ))}
            {/* pad the last row so items keep their width */}
            {row.length < columns &&
              Array.from({ length: columns - row.length }).map((_, i) => (
                <View key={`pad-${i}`} style={{ flex: 1 }} />
              ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    minHeight: 40,
    justifyContent: "center",
  },
  backText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  title: { fontSize: 18, fontWeight: "900", flex: 1, textAlign: "center" },
  grid: { padding: 16, gap: 14 },
  row: { flexDirection: "row", gap: 14 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 15, fontWeight: "600" },
});
