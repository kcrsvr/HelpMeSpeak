import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "../state/AppContext";
import { CategoryRepo, WordRepo } from "../data/repositories";
import { persistPhoto, deleteMedia } from "../data/media";
import { Category } from "../data/types";
import { ScreenProps } from "../navigation/types";

const CG = { bg: "#0F0F1A", card: "#1A1A2E", accent: "#BB86FC" };

export function ManageCategoriesScreen({ navigation }: ScreenProps<"ManageCategories">) {
  const { activeProfile } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // New-category form state
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  // ---- picture for the new category ----
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo access to choose a picture.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets[0]) {
      setNewImageUri(await persistPhoto(res.assets[0].uri));
    }
  };

  const takeImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow camera access to take a picture.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets[0]) {
      setNewImageUri(await persistPhoto(res.assets[0].uri));
    }
  };

  const clearImage = async () => {
    await deleteMedia(newImageUri);
    setNewImageUri(null);
  };

  const addCategory = async () => {
    if (!activeProfile || !newName.trim() || saving) return;
    setSaving(true);
    try {
      await CategoryRepo.create({
        profileId: activeProfile.id,
        name: newName.trim(),
        emoji: newEmoji || "📁",
        imageUri: newImageUri,
        color: "#BB86FC",
      });
      // reset form
      setNewName("");
      setNewEmoji("📁");
      setNewImageUri(null);
      load();
    } finally {
      setSaving(false);
    }
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
            await deleteMedia(c.imageUri);
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
          <Text style={styles.headerTitle}>Words / Categories</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
        {/* ---- New category form ---- */}
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>NEW CATEGORY</Text>

          {/* 1) picture or emoji */}
          <View style={styles.previewRow}>
            <View style={styles.preview}>
              {newImageUri ? (
                <Image source={{ uri: newImageUri }} style={styles.previewImg} />
              ) : (
                <Text style={styles.previewEmoji}>{newEmoji}</Text>
              )}
            </View>
            <View style={styles.pickBtns}>
              <Pressable style={styles.pickBtn} onPress={pickImage} accessibilityRole="button" accessibilityLabel="Choose a picture">
                <Text style={styles.pickBtnText}>🖼️ Choose</Text>
              </Pressable>
              <Pressable style={styles.pickBtn} onPress={takeImage} accessibilityRole="button" accessibilityLabel="Take a picture">
                <Text style={styles.pickBtnText}>📷 Camera</Text>
              </Pressable>
            </View>
          </View>

          {newImageUri ? (
            <Pressable onPress={clearImage} accessibilityRole="button" accessibilityLabel="Remove picture">
              <Text style={styles.removeLink}>Remove picture (use emoji)</Text>
            </Pressable>
          ) : (
            <View style={styles.emojiRow}>
              <Text style={styles.emojiHint}>Or use an emoji</Text>
              <TextInput
                style={styles.emojiInput}
                value={newEmoji}
                onChangeText={(t) => setNewEmoji(t.slice(0, 2) || "📁")}
                accessibilityLabel="Category emoji"
              />
            </View>
          )}

          {/* 2) name */}
          <TextInput
            style={styles.nameInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Category name"
            placeholderTextColor="#666"
            maxLength={20}
            accessibilityLabel="Category name"
          />

          {/* 3) add */}
          <Pressable
            style={[styles.addBtn, (!newName.trim() || saving) && { opacity: 0.5 }]}
            disabled={!newName.trim() || saving}
            onPress={addCategory}
            accessibilityRole="button"
            accessibilityLabel="Add category"
          >
            <Text style={styles.addBtnText}>{saving ? "Adding…" : "Add Category"}</Text>
          </Pressable>
        </View>

        {/* ---- existing categories ---- */}
        {categories.map((c) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate("CategoryDetail", { categoryId: c.id })}
            accessibilityRole="button"
            accessibilityLabel={`Open ${c.name}`}
          >
            {c.imageUri ? (
              <Image source={{ uri: c.imageUri }} style={styles.rowImg} />
            ) : (
              <Text style={styles.rowEmoji}>{c.emoji}</Text>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{c.name}</Text>
              <Text style={styles.rowSub}>
                {counts[c.id] ?? 0} words{c.isBuiltIn ? " • built-in" : ""}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
            <Pressable
              onPress={() => removeCategory(c)}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${c.name}`}
              hitSlop={8}
            >
              <Text style={styles.delete}>🗑</Text>
            </Pressable>
          </Pressable>
        ))}
        </ScrollView>
      </KeyboardAvoidingView>
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
  body: { padding: 20, paddingBottom: 60, gap: 12 },

  addCard: { backgroundColor: CG.card, borderRadius: 16, padding: 16, gap: 14, marginBottom: 8 },
  addTitle: { color: CG.accent, fontWeight: "800", fontSize: 13, letterSpacing: 1 },

  previewRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImg: { width: "100%", height: "100%" },
  previewEmoji: { fontSize: 36 },
  pickBtns: { flex: 1, gap: 8 },
  pickBtn: {
    backgroundColor: "rgba(187,134,252,0.15)",
    borderWidth: 1,
    borderColor: "rgba(187,134,252,0.35)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  pickBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  removeLink: { color: "#E57373", fontWeight: "700", fontSize: 13 },

  emojiRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  emojiHint: { color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  emojiInput: {
    width: 60,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    textAlign: "center",
    fontSize: 24,
    color: "#FFF",
  },

  nameInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: CG.accent,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: CG.bg, fontWeight: "900", fontSize: 16 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: CG.card,
    borderRadius: 16,
    padding: 16,
    minHeight: 60,
  },
  rowEmoji: { fontSize: 28, width: 44, textAlign: "center" },
  rowImg: { width: 44, height: 44, borderRadius: 10 },
  rowName: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  rowSub: { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 12, marginTop: 2 },
  chevron: { color: "rgba(255,255,255,0.4)", fontSize: 24, fontWeight: "700", paddingHorizontal: 4 },
  delete: { fontSize: 22, padding: 4 },
});
