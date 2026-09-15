import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "../state/AppContext";
import { ProfileRepo } from "../data/repositories";
import { persistPhoto, deleteMedia } from "../data/media";
import { ScreenProps } from "../navigation/types";

const CG = { bg: "#0F0F1A", card: "#1A1A2E", accent: "#BB86FC" };
const MAX_PROFILES = 3;

// Shared photo pickers (library / camera) returning a persisted file URI.
async function pickFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", "Please allow photo access to choose a picture.");
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (!res.canceled && res.assets[0]) return persistPhoto(res.assets[0].uri);
  return null;
}

async function takeWithCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", "Please allow camera access to take a picture.");
    return null;
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (!res.canceled && res.assets[0]) return persistPhoto(res.assets[0].uri);
  return null;
}

export function ManageProfilesScreen({ navigation }: ScreenProps<"ManageProfiles">) {
  const { profiles, activeProfile, reloadProfiles, setActiveProfile } = useApp();

  // New-profile form
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🙂");
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Which existing profile is being edited (id), and its draft fields.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("🙂");
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null);

  // ---- add new profile ----
  const addNewPhoto = async (source: "library" | "camera") => {
    const uri = source === "camera" ? await takeWithCamera() : await pickFromLibrary();
    if (uri) setNewAvatarUri(uri);
  };

  const addProfile = async () => {
    if (!newName.trim() || profiles.length >= MAX_PROFILES || busy) return;
    setBusy(true);
    try {
      const p = await ProfileRepo.createWithSeed({
        name: newName.trim(),
        avatarEmoji: newEmoji || "🙂",
        avatarUri: newAvatarUri,
      });
      await reloadProfiles();
      await setActiveProfile(p.id);
      setNewName("");
      setNewEmoji("🙂");
      setNewAvatarUri(null);
    } finally {
      setBusy(false);
    }
  };

  // ---- edit existing profile ----
  const startEdit = (id: string, name: string, emoji: string, avatarUri: string | null) => {
    setEditingId(id);
    setEditName(name);
    setEditEmoji(emoji);
    setEditAvatarUri(avatarUri);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const editPhoto = async (source: "library" | "camera") => {
    const uri = source === "camera" ? await takeWithCamera() : await pickFromLibrary();
    if (uri) {
      // replace previous file if we're swapping the picture
      if (editAvatarUri && editAvatarUri !== uri) await deleteMedia(editAvatarUri);
      setEditAvatarUri(uri);
    }
  };

  const clearEditPhoto = async () => {
    await deleteMedia(editAvatarUri);
    setEditAvatarUri(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await ProfileRepo.update(editingId, {
      name: editName.trim(),
      avatarEmoji: editEmoji || "🙂",
      avatarUri: editAvatarUri,
    });
    await reloadProfiles();
    setEditingId(null);
  };

  const makeActive = async (id: string) => {
    if (editingId) return; // don't switch while editing
    await setActiveProfile(id);
  };

  const removeProfile = (id: string, name: string, avatarUri: string | null) => {
    if (profiles.length <= 1) {
      Alert.alert("Cannot delete", "You need at least one profile.");
      return;
    }
    Alert.alert(`Delete "${name}"?`, "This deletes all their words and categories. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMedia(avatarUri);
          await ProfileRepo.delete(id);
          await reloadProfiles();
          const remaining = await ProfileRepo.list();
          if (remaining[0]) await setActiveProfile(remaining[0].id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: CG.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: CG.card }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.headerBtn}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Profiles</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        {profiles.map((p) => {
          const active = p.id === activeProfile?.id;
          const isEditing = editingId === p.id;

          if (isEditing) {
            // ---- inline edit form for this profile ----
            return (
              <View key={p.id} style={styles.editCard}>
                <Text style={styles.addTitle}>EDIT PROFILE</Text>
                <View style={styles.avatarRow}>
                  <View style={styles.avatarLarge}>
                    {editAvatarUri ? (
                      <Image source={{ uri: editAvatarUri }} style={styles.avatarImg} />
                    ) : (
                      <Text style={{ fontSize: 34 }}>{editEmoji}</Text>
                    )}
                  </View>
                  <View style={styles.avatarBtns}>
                    <Pressable style={styles.pickBtn} onPress={() => editPhoto("library")} accessibilityRole="button" accessibilityLabel="Choose photo">
                      <Text style={styles.pickBtnText}>🖼️ Choose</Text>
                    </Pressable>
                    <Pressable style={styles.pickBtn} onPress={() => editPhoto("camera")} accessibilityRole="button" accessibilityLabel="Take photo">
                      <Text style={styles.pickBtnText}>📷 Camera</Text>
                    </Pressable>
                  </View>
                </View>

                {editAvatarUri ? (
                  <Pressable onPress={clearEditPhoto} accessibilityRole="button" accessibilityLabel="Remove picture">
                    <Text style={styles.removeLink}>Remove picture (use emoji)</Text>
                  </Pressable>
                ) : (
                  <View style={styles.emojiRow}>
                    <Text style={styles.emojiHint}>Emoji</Text>
                    <TextInput
                      style={styles.emojiInput}
                      value={editEmoji}
                      onChangeText={(t) => setEditEmoji(t.slice(0, 2) || "🙂")}
                      accessibilityLabel="Profile emoji"
                    />
                  </View>
                )}

                <TextInput
                  style={styles.nameInputFull}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Child's name"
                  placeholderTextColor="#666"
                  maxLength={20}
                  autoCapitalize="words"
                  accessibilityLabel="Child's name"
                />

                <View style={styles.editActions}>
                  <Pressable style={styles.cancelBtn} onPress={cancelEdit} accessibilityRole="button" accessibilityLabel="Cancel">
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveBtn, !editName.trim() && { opacity: 0.5 }]}
                    disabled={!editName.trim()}
                    onPress={saveEdit}
                    accessibilityRole="button"
                    accessibilityLabel="Save changes"
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          // ---- normal profile row ----
          return (
            <Pressable
              key={p.id}
              onPress={() => makeActive(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${p.name}`}
              style={[styles.row, active && { borderColor: CG.accent, borderWidth: 2 }]}
            >
              <View style={styles.avatar}>
                {p.avatarUri ? (
                  <Image source={{ uri: p.avatarUri }} style={styles.avatarImgSmall} />
                ) : (
                  <Text style={{ fontSize: 28 }}>{p.avatarEmoji}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.sub}>
                  {active ? "Active" : "Tap to make active"} • {p.theme}
                </Text>
              </View>
              <Pressable
                onPress={() => startEdit(p.id, p.name, p.avatarEmoji, p.avatarUri)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${p.name}`}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <Text style={styles.editIcon}>✎</Text>
              </Pressable>
              <Pressable
                onPress={() => removeProfile(p.id, p.name, p.avatarUri)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${p.name}`}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <Text style={styles.delete}>🗑</Text>
              </Pressable>
            </Pressable>
          );
        })}

        {/* ---- add a new profile ---- */}
        {profiles.length < MAX_PROFILES ? (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>ADD A CHILD</Text>

            <View style={styles.avatarRow}>
              <View style={styles.avatarLarge}>
                {newAvatarUri ? (
                  <Image source={{ uri: newAvatarUri }} style={styles.avatarImg} />
                ) : (
                  <Text style={{ fontSize: 34 }}>{newEmoji}</Text>
                )}
              </View>
              <View style={styles.avatarBtns}>
                <Pressable style={styles.pickBtn} onPress={() => addNewPhoto("library")} accessibilityRole="button" accessibilityLabel="Choose photo">
                  <Text style={styles.pickBtnText}>🖼️ Choose</Text>
                </Pressable>
                <Pressable style={styles.pickBtn} onPress={() => addNewPhoto("camera")} accessibilityRole="button" accessibilityLabel="Take photo">
                  <Text style={styles.pickBtnText}>📷 Camera</Text>
                </Pressable>
              </View>
            </View>

            {newAvatarUri ? (
              <Pressable onPress={async () => { await deleteMedia(newAvatarUri); setNewAvatarUri(null); }} accessibilityRole="button" accessibilityLabel="Remove picture">
                <Text style={styles.removeLink}>Remove picture (use emoji)</Text>
              </Pressable>
            ) : (
              <View style={styles.emojiRow}>
                <Text style={styles.emojiHint}>Or pick an emoji</Text>
                <TextInput
                  style={styles.emojiInput}
                  value={newEmoji}
                  onChangeText={(t) => setNewEmoji(t.slice(0, 2) || "🙂")}
                  accessibilityLabel="Profile emoji"
                />
              </View>
            )}

            <TextInput
              style={styles.nameInputFull}
              value={newName}
              onChangeText={setNewName}
              placeholder="Child's name"
              placeholderTextColor="#666"
              maxLength={20}
              autoCapitalize="words"
              accessibilityLabel="Child's name"
            />

            <Pressable
              style={[styles.addBtn, (!newName.trim() || busy) && { opacity: 0.5 }]}
              disabled={!newName.trim() || busy}
              onPress={addProfile}
              accessibilityRole="button"
              accessibilityLabel="Add profile"
            >
              <Text style={styles.addBtnText}>{busy ? "Adding…" : "Add Profile"}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.limit}>Maximum of {MAX_PROFILES} profiles reached.</Text>
        )}
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

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: CG.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#6200EE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImgSmall: { width: "100%", height: "100%" },
  name: { color: "#FFF", fontWeight: "800", fontSize: 17 },
  sub: { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 12, marginTop: 2 },
  iconBtn: { paddingHorizontal: 4 },
  editIcon: { color: CG.accent, fontSize: 22, fontWeight: "900" },
  delete: { fontSize: 22 },

  addCard: { backgroundColor: CG.card, borderRadius: 16, padding: 16, gap: 14, marginTop: 8 },
  editCard: {
    backgroundColor: CG.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: CG.accent,
  },
  addTitle: { color: CG.accent, fontWeight: "800", fontSize: 13, letterSpacing: 1 },

  avatarRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarBtns: { flex: 1, gap: 8 },
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
  nameInputFull: {
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

  editActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: "#FFF", fontWeight: "800" },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: CG.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: CG.bg, fontWeight: "900" },

  limit: { color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 12, fontWeight: "600" },
});
