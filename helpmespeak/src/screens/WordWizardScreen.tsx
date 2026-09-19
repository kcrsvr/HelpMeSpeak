import React, { useEffect, useState } from "react";
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
import * as ImagePicker from "expo-image-picker";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  createAudioPlayer,
} from "expo-audio";
import { useApp } from "../state/AppContext";
import { CategoryRepo, WordRepo } from "../data/repositories";
import { persistAudio, persistPhoto, deleteMedia } from "../data/media";
import { Category } from "../data/types";
import { ScreenProps } from "../navigation/types";

const CG = { bg: "#0F0F1A", card: "#1A1A2E", accent: "#BB86FC", cardActive: "#252540" };

export function WordWizardScreen({ route, navigation }: ScreenProps<"WordWizard">) {
  const editingId = route.params?.wordId;
  const preselectedCategoryId = route.params?.categoryId;
  const { activeProfile } = useApp();

  const [step, setStep] = useState(0); // 0..4
  const [categories, setCategories] = useState<Category[]>([]);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [emoji, setEmoji] = useState("🔤");
  const [wordText, setWordText] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  // inline "create a new category" form (shown on the Category step)
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📁");
  const [creatingCat, setCreatingCat] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeProfile) return;
    (async () => {
      const cats = await CategoryRepo.listForProfile(activeProfile.id);
      setCategories(cats);
      if (!editingId) {
        // Preselect the category we came from, if any; else the first.
        const preferred = preselectedCategoryId
          ? cats.find((c) => c.id === preselectedCategoryId)
          : undefined;
        setCategoryId(preferred?.id ?? cats[0]?.id ?? null);
      }
      if (editingId) {
        const w = await WordRepo.get(editingId);
        if (w) {
          setPhotoUri(w.photoUri);
          setEmoji(w.emoji);
          setWordText(w.word);
          setCategoryId(w.categoryId);
          setIsFeatured(w.isFeatured);
          setAudioUri(w.audioUri);
        }
      }
    })();
  }, [activeProfile, editingId, preselectedCategoryId]);

  // ---- photo ----
  // Choose an existing photo from the device's library.
  const pickPhoto = async () => {
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
      const stored = await persistPhoto(res.assets[0].uri);
      setPhotoUri(stored);
    }
  };

  // Open the camera and take a new photo right now.
  const takePhoto = async () => {
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
      const stored = await persistPhoto(res.assets[0].uri);
      setPhotoUri(stored);
    }
  };

  // ---- audio (expo-audio) ----
  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow microphone access to record.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (e) {
      Alert.alert("Recording failed", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const stored = await persistAudio(uri);
        setAudioUri(stored);
      }
    } catch {
      // ignore
    }
    try {
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      // ignore
    }
  };

  const playRecording = async () => {
    if (!audioUri) return;
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer({ uri: audioUri });
      player.play();
      const sub = player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish || status.error) {
          sub?.remove?.();
          player.remove();
        }
      });
    } catch {
      // ignore
    }
  };

  const clearRecording = async () => {
    await deleteMedia(audioUri);
    setAudioUri(null);
  };

  // Create a brand-new category right here in the wizard, then select it.
  const createCategory = async () => {
    if (!activeProfile) return;
    const name = newCatName.trim();
    if (!name) {
      Alert.alert("Name needed", "Give the new category a name.");
      return;
    }
    setCreatingCat(true);
    try {
      const cat = await CategoryRepo.create({
        profileId: activeProfile.id,
        name,
        emoji: newCatEmoji || "📁",
        color: "#4A90D9",
      });
      setCategories((prev) => [...prev, cat]);
      setCategoryId(cat.id);
      // reset & hide the inline form
      setNewCatName("");
      setNewCatEmoji("📁");
      setShowNewCategory(false);
    } finally {
      setCreatingCat(false);
    }
  };

  // Delete the word being edited (with confirmation), cleaning up its media.
  const deleteWord = () => {
    if (!editingId) return;
    Alert.alert(
      "Delete word?",
      `"${wordText.trim() || "This word"}" will be removed. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deleteMedia(photoUri);
              await deleteMedia(audioUri);
              await WordRepo.delete(editingId);
              navigation.goBack();
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const canSave = wordText.trim().length > 0 && !!categoryId;

  const save = async (addAnother: boolean) => {
    if (!activeProfile || !categoryId) return;
    setSaving(true);
    try {
      if (editingId) {
        await WordRepo.update(editingId, {
          word: wordText.trim(),
          emoji,
          photoUri,
          audioUri,
          categoryId,
          isFeatured,
        });
      } else {
        await WordRepo.create({
          profileId: activeProfile.id,
          categoryId,
          word: wordText.trim(),
          emoji,
          photoUri,
          audioUri,
          isFeatured,
        });
      }

      if (addAnother && !editingId) {
        // reset for next entry
        setPhotoUri(null);
        setEmoji("🔤");
        setWordText("");
        setIsFeatured(false);
        setAudioUri(null);
        setStep(0);
      } else {
        navigation.goBack();
      }
    } finally {
      setSaving(false);
    }
  };

  const steps = ["Photo", "Audio", "Word", "Category", "Review"];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: CG.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: CG.card }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Cancel" accessibilityRole="button">
            <Text style={styles.headerBtn}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{editingId ? "Edit Word" : "Add New Word"}</Text>
          <Text style={styles.stepLabel}>
            {step + 1}/{steps.length}
          </Text>
        </View>
      </SafeAreaView>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {step === 0 && (
          <>
            <Text style={styles.stepTitle}>Add a picture</Text>
            <Text style={styles.stepDesc}>
              Choose a photo from the library or take one with the camera. Or use an emoji for now.
            </Text>
            <View style={styles.uploadArea}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.uploadPreview} />
              ) : (
                <>
                  <Text style={{ fontSize: 48 }}>{emoji}</Text>
                  <Text style={styles.uploadHint}>No photo yet</Text>
                </>
              )}
            </View>

            {/* Two ways to add a photo */}
            <View style={styles.photoBtnRow}>
              <Pressable
                style={styles.photoBtn}
                onPress={pickPhoto}
                accessibilityRole="button"
                accessibilityLabel="Choose a photo from the library"
              >
                <Text style={styles.photoBtnIcon}>🖼️</Text>
                <Text style={styles.photoBtnLabel}>Choose Photo</Text>
              </Pressable>
              <Pressable
                style={styles.photoBtn}
                onPress={takePhoto}
                accessibilityRole="button"
                accessibilityLabel="Open camera and take a picture"
              >
                <Text style={styles.photoBtnIcon}>📷</Text>
                <Text style={styles.photoBtnLabel}>Take Photo</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Or pick an emoji</Text>
            <TextInput
              style={styles.input}
              value={emoji}
              onChangeText={(t) => setEmoji(t.slice(0, 2) || "🔤")}
              placeholder="🔤"
              placeholderTextColor="#666"
            />
            {photoUri && (
              <Pressable onPress={async () => { await deleteMedia(photoUri); setPhotoUri(null); }}>
                <Text style={styles.linkDanger}>Remove photo</Text>
              </Pressable>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Record the word</Text>
            <Text style={styles.stepDesc}>
              Record how the word sounds. If you skip this, the app uses text-to-speech.
            </Text>
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              accessibilityRole="button"
              accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
              style={[styles.recordBtn, isRecording && { backgroundColor: "#C0392B" }]}
            >
              <Text style={styles.recordIcon}>{isRecording ? "⏹" : "🎙️"}</Text>
              <Text style={styles.recordLabel}>
                {isRecording ? "Stop" : audioUri ? "Re-record" : "Record"}
              </Text>
            </Pressable>
            {audioUri && !isRecording && (
              <View style={styles.audioActions}>
                <Pressable style={styles.smallBtn} onPress={playRecording} accessibilityRole="button" accessibilityLabel="Play recording">
                  <Text style={styles.smallBtnText}>▶ Play</Text>
                </Pressable>
                <Pressable style={styles.smallBtn} onPress={clearRecording} accessibilityRole="button" accessibilityLabel="Delete recording">
                  <Text style={styles.smallBtnText}>🗑 Delete</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Type the word</Text>
            <Text style={styles.stepDesc}>This is what gets spelled out for the child.</Text>
            <TextInput
              style={[styles.input, styles.inputLarge]}
              value={wordText}
              onChangeText={setWordText}
              placeholder="e.g. Apple"
              placeholderTextColor="#666"
              autoCapitalize="words"
              maxLength={24}
            />
            <Text style={styles.charCount}>{wordText.length}/24</Text>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Assign a category</Text>
            <Text style={styles.stepDesc}>Where should this word live?</Text>
            <View style={styles.chipWrap}>
              {categories.map((c) => {
                const selected = c.id === categoryId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    accessibilityRole="button"
                    accessibilityLabel={c.name}
                    style={[styles.chip, selected && { backgroundColor: CG.accent }]}
                  >
                    <Text style={[styles.chipText, selected && { color: CG.bg }]}>
                      {c.emoji} {c.name}
                    </Text>
                  </Pressable>
                );
              })}
              {/* Create-a-new-category chip */}
              <Pressable
                onPress={() => setShowNewCategory((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Create a new category"
                style={[styles.chip, styles.newCatChip]}
              >
                <Text style={[styles.chipText, { color: CG.accent }]}>
                  {showNewCategory ? "✕ Cancel" : "＋ New Category"}
                </Text>
              </Pressable>
            </View>

            {showNewCategory && (
              <View style={styles.newCatForm}>
                <Text style={styles.fieldLabel}>New category</Text>
                <View style={styles.newCatRow}>
                  <TextInput
                    style={styles.newCatEmojiInput}
                    value={newCatEmoji}
                    onChangeText={(t) => setNewCatEmoji(t.slice(0, 2) || "📁")}
                    accessibilityLabel="New category emoji"
                  />
                  <TextInput
                    style={styles.newCatNameInput}
                    value={newCatName}
                    onChangeText={setNewCatName}
                    placeholder="Category name"
                    placeholderTextColor="#666"
                    autoCapitalize="words"
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={createCategory}
                    accessibilityLabel="New category name"
                  />
                </View>
                <Pressable
                  disabled={!newCatName.trim() || creatingCat}
                  onPress={createCategory}
                  accessibilityRole="button"
                  accessibilityLabel="Create category"
                  style={[
                    styles.createCatBtn,
                    (!newCatName.trim() || creatingCat) && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.createCatBtnText}>
                    {creatingCat ? "Creating…" : "Create & Select"}
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>Review</Text>
            <View style={styles.reviewCard}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.reviewPhoto} />
              ) : (
                <Text style={{ fontSize: 56 }}>{emoji}</Text>
              )}
              <Text style={styles.reviewWord}>{wordText || "(no word)"}</Text>
              <Text style={styles.reviewMeta}>
                {categories.find((c) => c.id === categoryId)?.name ?? "No category"}
              </Text>
              <Text style={styles.reviewMeta}>
                {audioUri ? "🎙️ Recorded audio" : "🔊 Text-to-speech"}
              </Text>
            </View>
            <Pressable
              style={styles.featuredRow}
              onPress={() => setIsFeatured((v) => !v)}
              accessibilityRole="switch"
              accessibilityState={{ checked: isFeatured }}
              accessibilityLabel="Set as featured"
            >
              <Text style={styles.featuredLabel}>⭐ Set as Featured</Text>
              <View style={[styles.toggle, isFeatured && { backgroundColor: CG.accent }]}>
                <View style={[styles.toggleKnob, isFeatured && { left: 25 }]} />
              </View>
            </Pressable>

            {editingId && (
              <Pressable
                onPress={deleteWord}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Delete this word"
                style={[styles.deleteWordBtn, saving && { opacity: 0.5 }]}
              >
                <Text style={styles.deleteWordText}>🗑 Delete Word</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      {/* footer nav */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: CG.bg }}>
        <View style={styles.footer}>
          {step > 0 && (
            <Pressable
              onPress={() => setStep((s) => s - 1)}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={[styles.footerBtn, styles.footerSecondary]}
            >
              <Text style={styles.footerSecondaryText}>Back</Text>
            </Pressable>
          )}
          {step < 4 ? (
            <Pressable
              onPress={() => setStep((s) => s + 1)}
              accessibilityRole="button"
              accessibilityLabel="Next"
              style={[styles.footerBtn, styles.footerPrimary]}
            >
              <Text style={styles.footerPrimaryText}>Next</Text>
            </Pressable>
          ) : (
            <View style={styles.saveRow}>
              {!editingId && (
                <Pressable
                  disabled={!canSave || saving}
                  onPress={() => save(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Save and add another"
                  style={[styles.footerBtn, styles.footerSecondary, (!canSave || saving) && { opacity: 0.5 }]}
                >
                  <Text style={styles.footerSecondaryText}>Save</Text>
                </Pressable>
              )}
              <Pressable
                disabled={!canSave || saving}
                onPress={() => save(false)}
                accessibilityRole="button"
                accessibilityLabel="Save and exit"
                style={[styles.footerBtn, styles.footerPrimary, (!canSave || saving) && { opacity: 0.5 }]}
              >
                <Text style={styles.footerPrimaryText}>{saving ? "Saving…" : "Save & Exit"}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
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
  headerBtn: { color: "#FFF", fontSize: 20, fontWeight: "700", minWidth: 40 },
  headerTitle: { color: "#FFF", fontSize: 17, fontWeight: "900" },
  stepLabel: { color: CG.accent, fontWeight: "700", minWidth: 40, textAlign: "right" },
  progressTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.1)" },
  progressFill: { height: 4, backgroundColor: CG.accent },
  body: { padding: 20, gap: 10 },
  stepTitle: { fontSize: 20, fontWeight: "900", color: "#FFF" },
  stepDesc: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.6)", marginBottom: 10 },
  uploadArea: {
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(187,134,252,0.4)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: CG.card,
  },
  uploadPreview: { width: "100%", height: "100%", borderRadius: 18 },
  uploadHint: { color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  photoBtnRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  photoBtn: {
    flex: 1,
    backgroundColor: CG.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(187,134,252,0.35)",
    minHeight: 88,
  },
  photoBtnIcon: { fontSize: 30 },
  photoBtnLabel: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  fieldLabel: { color: "rgba(255,255,255,0.6)", fontWeight: "700", marginTop: 12 },
  input: {
    backgroundColor: CG.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputLarge: { fontSize: 24, textAlign: "center" },
  charCount: { color: "rgba(255,255,255,0.4)", textAlign: "right", marginTop: 6 },
  linkDanger: { color: "#E74C3C", fontWeight: "700", textAlign: "center", marginTop: 12 },
  recordBtn: {
    backgroundColor: "#E74C3C",
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  recordIcon: { fontSize: 40 },
  recordLabel: { color: "#FFF", fontWeight: "900", fontSize: 18 },
  audioActions: { flexDirection: "row", gap: 12, marginTop: 16, justifyContent: "center" },
  smallBtn: {
    backgroundColor: CG.card,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  smallBtnText: { color: "#FFF", fontWeight: "700" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  chip: {
    backgroundColor: CG.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 44,
    justifyContent: "center",
  },
  chipText: { color: "#FFF", fontWeight: "700" },
  newCatChip: {
    borderColor: CG.accent,
    borderStyle: "dashed",
    backgroundColor: "rgba(187,134,252,0.08)",
  },
  newCatForm: {
    backgroundColor: CG.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(187,134,252,0.3)",
  },
  newCatRow: { flexDirection: "row", gap: 10 },
  newCatEmojiInput: {
    width: 60,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    textAlign: "center",
    fontSize: 24,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  newCatNameInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  createCatBtn: {
    backgroundColor: CG.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  createCatBtnText: { color: CG.bg, fontWeight: "800", fontSize: 15 },
  deleteWordBtn: {
    borderWidth: 2,
    borderColor: "#E74C3C",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    minHeight: 56,
  },
  deleteWordText: { color: "#E74C3C", fontWeight: "800", fontSize: 16 },
  reviewCard: {
    backgroundColor: CG.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  reviewPhoto: { width: 120, height: 120, borderRadius: 18 },
  reviewWord: { fontSize: 24, fontWeight: "900", color: "#FFF", marginTop: 8 },
  reviewMeta: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  featuredRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CG.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  featuredLabel: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  toggle: { width: 52, height: 30, borderRadius: 15, backgroundColor: "#444" },
  toggleKnob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  footer: { flexDirection: "row", gap: 12, padding: 16 },
  saveRow: { flex: 1, flexDirection: "row", gap: 12 },
  footerBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  footerPrimary: { backgroundColor: CG.accent },
  footerPrimaryText: { color: CG.bg, fontWeight: "900", fontSize: 17 },
  footerSecondary: { borderWidth: 2, borderColor: CG.accent },
  footerSecondaryText: { color: CG.accent, fontWeight: "800", fontSize: 16 },
});
