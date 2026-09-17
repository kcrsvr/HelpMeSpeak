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
import { Category, Word } from "../data/types";
import { ScreenProps } from "../navigation/types";

const CG = { bg: "#0F0F1A", card: "#1A1A2E", accent: "#BB86FC" };
const COLUMNS = 2;

export function CategoryDetailScreen({ route, navigation }: ScreenProps<"CategoryDetail">) {
  const { categoryId } = route.params;
  const { activeProfile } = useApp();

  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);

  const load = useCallback(async () => {
    const cat = await CategoryRepo.get(categoryId);
    setCategory(cat);
    if (cat) {
      setName(cat.name);
      setEmoji(cat.emoji);
      setImageUri(cat.imageUri);
    }
    const ws = await WordRepo.listForCategory(categoryId);
    // Alphabetical by word (case-insensitive).
    ws.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
    setWords(ws);
  }, [categoryId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ---- category edits (persisted on blur / change) ----
  const saveName = async () => {
    const trimmed = name.trim();
    if (!category || !trimmed || trimmed === category.name) return;
    await CategoryRepo.update(category.id, { name: trimmed });
    load();
  };

  const saveEmoji = async (next: string) => {
    const e = next.slice(0, 2) || "📁";
    setEmoji(e);
    if (category && !imageUri) {
      await CategoryRepo.update(category.id, { emoji: e });
    }
  };

  const setCategoryImage = async (uri: string) => {
    if (!category) return;
    // remove the previous image file if we're replacing it
    if (imageUri && imageUri !== uri) await deleteMedia(imageUri);
    setImageUri(uri);
    await CategoryRepo.update(category.id, { imageUri: uri });
  };

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
      setCategoryImage(await persistPhoto(res.assets[0].uri));
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
      setCategoryImage(await persistPhoto(res.assets[0].uri));
    }
  };

  const clearImage = async () => {
    if (!category) return;
    await deleteMedia(imageUri);
    setImageUri(null);
    await CategoryRepo.update(category.id, { imageUri: null });
  };

  const addWord = () =>
    navigation.navigate("WordWizard", { categoryId });

  const editWord = (w: Word) =>
    navigation.navigate("WordWizard", { wordId: w.id });

  // grid rows
  const rows: Word[][] = [];
  for (let i = 0; i < words.length; i += COLUMNS) rows.push(words.slice(i, i + COLUMNS));

  return (
    <View style={[styles.container, { backgroundColor: CG.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: CG.card }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.headerBtn}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Category</Text>
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
        {/* ---- editable category header ---- */}
        <View style={styles.editCard}>
          <View style={styles.previewRow}>
            <View style={styles.preview}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImg} />
              ) : (
                <Text style={styles.previewEmoji}>{emoji}</Text>
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

          {imageUri ? (
            <Pressable onPress={clearImage} accessibilityRole="button" accessibilityLabel="Remove picture">
              <Text style={styles.removeLink}>Remove picture (use emoji)</Text>
            </Pressable>
          ) : (
            <View style={styles.emojiRow}>
              <Text style={styles.emojiHint}>Emoji</Text>
              <TextInput
                style={styles.emojiInput}
                value={emoji}
                onChangeText={saveEmoji}
                accessibilityLabel="Category emoji"
              />
            </View>
          )}

          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            onBlur={saveName}
            onSubmitEditing={saveName}
            placeholder="Category name"
            placeholderTextColor="#666"
            maxLength={20}
            returnKeyType="done"
            accessibilityLabel="Category name"
          />
        </View>

        {/* ---- words in this category ---- */}
        <View style={styles.wordsHeaderRow}>
          <Text style={styles.wordsHeader}>WORDS ({words.length})</Text>
          <Pressable style={styles.addWordBtn} onPress={addWord} accessibilityRole="button" accessibilityLabel="Add a word to this category">
            <Text style={styles.addWordText}>＋ Add Word</Text>
          </Pressable>
        </View>

        {words.length === 0 ? (
          <Text style={styles.empty}>No words yet. Tap “Add Word” to create one.</Text>
        ) : (
          rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((w) => (
                <Pressable
                  key={w.id}
                  style={styles.wordTile}
                  onPress={() => editWord(w)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${w.word}`}
                >
                  {w.photoUri ? (
                    <Image source={{ uri: w.photoUri }} style={styles.wordImg} />
                  ) : (
                    <Text style={styles.wordEmoji}>{w.emoji}</Text>
                  )}
                  <Text style={styles.wordLabel} numberOfLines={1}>
                    {w.word}
                  </Text>
                  <Text style={styles.wordEdit}>Tap to edit ✎</Text>
                </Pressable>
              ))}
              {row.length < COLUMNS &&
                Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                  <View key={`pad-${i}`} style={{ flex: 1 }} />
                ))}
            </View>
          ))
        )}
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
  body: { padding: 20, paddingBottom: 60, gap: 14 },

  editCard: { backgroundColor: CG.card, borderRadius: 16, padding: 16, gap: 14 },
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

  wordsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  wordsHeader: { color: CG.accent, fontWeight: "800", fontSize: 13, letterSpacing: 1 },
  addWordBtn: {
    backgroundColor: CG.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  addWordText: { color: CG.bg, fontWeight: "800", fontSize: 13 },
  empty: { color: "rgba(255,255,255,0.5)", fontWeight: "600", textAlign: "center", marginTop: 20 },

  row: { flexDirection: "row", gap: 14 },
  wordTile: {
    flex: 1,
    backgroundColor: CG.card,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 130,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  wordImg: { width: 56, height: 56, borderRadius: 12 },
  wordEmoji: { fontSize: 44 },
  wordLabel: { color: "#FFF", fontWeight: "800", fontSize: 15, textAlign: "center" },
  wordEdit: { color: CG.accent, fontWeight: "700", fontSize: 11 },
});
