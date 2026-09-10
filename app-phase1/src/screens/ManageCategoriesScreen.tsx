import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../state/AppContext";
import { CategoryRepo, WordRepo } from "../data/repositories";
import { Category } from "../data/types";
import { ScreenProps } from "../navigation/types";

const CG = { bg: "#0F0F1A", card: "#1A1A2E", accent: "#BB86FC" };

export function ManageCategoriesScreen({ navigation }: ScreenProps<"ManageCategories">) {
  const { activeProfile } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");

  const load = useCallback(async () => {
    if (!activeProfile) return;
    const [cats, words] = await Promise.all([
      CategoryRepo.listForProfile(activeProfile.id),
      WordRepo.listForProfile(activeProfile.id),
    ]);
    setCategories(cats);
    const c: Record<string, number> = {};
    for (const w of words) c[w.categoryId] = (c[w.categoryId] ?? 0) + 1;
    setCounts(c);
  }, [activeProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const addCategory = async () => {
    if (!activeProfile || !newName.trim()) return;
    await CategoryRepo.create({
      profileId: activeProfile.id,
      name: newName.trim(),
      emoji: newEmoji || "📁",
      color: "#BB86FC",
    });
    setNewName("");
    setNewEmoji("📁");
    load();
  };

  const removeCategory = (c: Category) => {
    const n = counts[c.id] ?? 0;
    Alert.alert(
      `Delete "${c.name}"?`,
      n > 0
        ? `This will also delete ${n} word${n === 1 ? "" : "s"} in it. This cannot be undone.`
        : "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await CategoryRepo.delete(c.id);
            load();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: CG.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: CG.card }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.headerBtn}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Categories</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>New category</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.emojiInput}
              value={newEmoji}
              onChangeText={(t) => setNewEmoji(t.slice(0, 2) || "📁")}
            />
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Category name"
              placeholderTextColor="#666"
              maxLength={20}
            />
            <Pressable
              style={[styles.addBtn, !newName.trim() && { opacity: 0.5 }]}
              disabled={!newName.trim()}
              onPress={addCategory}
              accessibilityRole="button"
              accessibilityLabel="Add category"
            >
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {categories.map((c) => (
          <View key={c.id} style={styles.row}>
            <Text style={styles.rowEmoji}>{c.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{c.name}</Text>
              <Text style={styles.rowSub}>
                {counts[c.id] ?? 0} words{c.isBuiltIn ? " • built-in" : ""}
              </Text>
            </View>
            <Pressable onPress={() => removeCategory(c)} accessibilityRole="button" accessibilityLabel={`Delete ${c.name}`}>
              <Text style={styles.delete}>🗑</Text>
            </Pressable>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 60,
  },
  headerBtn: { color: "#FFF", fontWeight: "700", fontSize: 15, minWidth: 60 },
  headerTitle: { color: "#FFF", fontSize: 17, fontWeight: "900" },
  body: { padding: 20, gap: 12 },
  addCard: { backgroundColor: CG.card, borderRadius: 16, padding: 16, gap: 12, marginBottom: 8 },
  addTitle: { color: CG.accent, fontWeight: "800", fontSize: 13, letterSpacing: 1 },
  addRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  emojiInput: {
    width: 52,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    textAlign: "center",
    fontSize: 22,
    color: "#FFF",
  },
  nameInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    color: "#FFF",
    fontWeight: "700",
  },
  addBtn: {
    backgroundColor: CG.accent,
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 48,
    justifyContent: "center",
  },
  addBtnText: { color: CG.bg, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: CG.card,
    borderRadius: 16,
    padding: 16,
    minHeight: 60,
  },
  rowEmoji: { fontSize: 28 },
  rowName: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  rowSub: { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 12, marginTop: 2 },
  delete: { fontSize: 22, padding: 4 },
});
