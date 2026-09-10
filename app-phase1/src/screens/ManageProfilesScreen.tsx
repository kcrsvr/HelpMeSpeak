import React, { useState } from "react";
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
import { useApp } from "../state/AppContext";
import { ProfileRepo } from "../data/repositories";
import { ScreenProps } from "../navigation/types";

const CG = { bg: "#0F0F1A", card: "#1A1A2E", accent: "#BB86FC" };
const MAX_PROFILES = 3;

export function ManageProfilesScreen({ navigation }: ScreenProps<"ManageProfiles">) {
  const { profiles, activeProfile, reloadProfiles, setActiveProfile } = useApp();
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🙂");
  const [busy, setBusy] = useState(false);

  const addProfile = async () => {
    if (!newName.trim() || profiles.length >= MAX_PROFILES) return;
    setBusy(true);
    try {
      const p = await ProfileRepo.createWithSeed({
        name: newName.trim(),
        avatarEmoji: newEmoji || "🙂",
      });
      await reloadProfiles();
      await setActiveProfile(p.id);
      setNewName("");
      setNewEmoji("🙂");
    } finally {
      setBusy(false);
    }
  };

  const makeActive = async (id: string) => {
    await setActiveProfile(id);
  };

  const removeProfile = (id: string, name: string) => {
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
          return (
            <Pressable
              key={p.id}
              onPress={() => makeActive(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${p.name}`}
              style={[styles.row, active && { borderColor: CG.accent, borderWidth: 2 }]}
            >
              <View style={styles.avatar}>
                <Text style={{ fontSize: 28 }}>{p.avatarEmoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.sub}>
                  {active ? "Active" : "Tap to make active"} • {p.theme}
                </Text>
              </View>
              <Pressable onPress={() => removeProfile(p.id, p.name)} accessibilityRole="button" accessibilityLabel={`Delete ${p.name}`}>
                <Text style={styles.delete}>🗑</Text>
              </Pressable>
            </Pressable>
          );
        })}

        {profiles.length < MAX_PROFILES ? (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Add a child</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.emojiInput}
                value={newEmoji}
                onChangeText={(t) => setNewEmoji(t.slice(0, 2) || "🙂")}
              />
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Child's name"
                placeholderTextColor="#666"
                maxLength={20}
                autoCapitalize="words"
              />
              <Pressable
                style={[styles.addBtn, (!newName.trim() || busy) && { opacity: 0.5 }]}
                disabled={!newName.trim() || busy}
                onPress={addProfile}
                accessibilityRole="button"
                accessibilityLabel="Add profile"
              >
                <Text style={styles.addBtnText}>{busy ? "…" : "Add"}</Text>
              </Pressable>
            </View>
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
  },
  name: { color: "#FFF", fontWeight: "800", fontSize: 17 },
  sub: { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 12, marginTop: 2 },
  delete: { fontSize: 22, padding: 4 },
  addCard: { backgroundColor: CG.card, borderRadius: 16, padding: 16, gap: 12, marginTop: 8 },
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
  limit: { color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 12, fontWeight: "600" },
});
