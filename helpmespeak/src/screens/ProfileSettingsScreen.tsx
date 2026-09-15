import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../state/AppContext";
import { useTheme } from "../theme/ThemeContext";
import { ProfileRepo } from "../data/repositories";
import { THEME_LIST, ThemeId } from "../theme/themes";
import { SpellingSpeed } from "../data/types";
import { ScreenProps } from "../navigation/types";

const CG = { bg: "#0F0F1A", card: "#1A1A2E", accent: "#BB86FC" };

export function ProfileSettingsScreen({ navigation }: ScreenProps<"ProfileSettings">) {
  const { activeProfile, reloadProfiles } = useApp();
  const { setThemeId } = useTheme();

  const [profile, setProfile] = useState(activeProfile);

  if (!profile) {
    return <View style={[styles.container, { backgroundColor: CG.bg }]} />;
  }

  const patch = async (p: Partial<typeof profile>) => {
    const next = { ...profile, ...p };
    setProfile(next);
    await ProfileRepo.update(profile.id, p);
    await reloadProfiles();
  };

  const chooseTheme = async (id: ThemeId) => {
    await patch({ theme: id });
    setThemeId(id); // live preview in the child app
  };

  return (
    <View style={[styles.container, { backgroundColor: CG.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: CG.card }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.headerBtn}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Settings · {profile.name}</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Theme */}
        <Text style={styles.sectionTitle}>THEME</Text>
        <View style={styles.themeGrid}>
          {THEME_LIST.map((t) => {
            const selected = t.id === profile.theme;
            return (
              <Pressable
                key={t.id}
                onPress={() => chooseTheme(t.id)}
                accessibilityRole="button"
                accessibilityLabel={`${t.name} theme`}
                style={[
                  styles.themeCard,
                  { backgroundColor: t.bg },
                  selected && { borderColor: CG.accent, borderWidth: 3 },
                ]}
              >
                <Text style={[styles.themeName, { color: t.text }]}>{t.name}</Text>
                <View style={styles.swatches}>
                  {[t.primary, t.accent, t.highlight].map((c, i) => (
                    <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Spelling speed */}
        <Text style={styles.sectionTitle}>SPELLING SPEED</Text>
        <View style={styles.pills}>
          {(["slow", "medium", "fast"] as SpellingSpeed[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => patch({ spellingSpeed: s })}
              accessibilityRole="button"
              accessibilityLabel={`${s} speed`}
              style={[styles.pill, profile.spellingSpeed === s && styles.pillActive]}
            >
              <Text
                style={[styles.pillText, profile.spellingSpeed === s && { color: CG.bg }]}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Grid density */}
        <Text style={styles.sectionTitle}>GRID SIZE</Text>
        <View style={styles.pills}>
          {[2, 3, 4].map((g) => (
            <Pressable
              key={g}
              onPress={() => patch({ gridSize: g })}
              accessibilityRole="button"
              accessibilityLabel={`${g} per row`}
              style={[styles.pill, profile.gridSize === g && styles.pillActive]}
            >
              <Text style={[styles.pillText, profile.gridSize === g && { color: CG.bg }]}>
                {g} per row
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Toggles */}
        <Text style={styles.sectionTitle}>SENSORY</Text>
        <ToggleRow
          label="🔊 Text-to-speech fallback"
          value={profile.ttsEnabled}
          onToggle={() => patch({ ttsEnabled: !profile.ttsEnabled })}
        />
        <ToggleRow
          label="✨ Animation & haptics"
          value={profile.animationEnabled}
          onToggle={() => patch({ animationEnabled: !profile.animationEnabled })}
        />
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={styles.toggleRow}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggle, value && { backgroundColor: CG.accent }]}>
        <View style={[styles.toggleKnob, value && { left: 25 }]} />
      </View>
    </Pressable>
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
  headerTitle: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  body: { padding: 20, gap: 8 },
  sectionTitle: {
    color: CG.accent,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    minHeight: 72,
    borderWidth: 3,
    borderColor: "transparent",
  },
  themeName: { fontSize: 13, fontWeight: "800" },
  swatches: { flexDirection: "row", gap: 5 },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  pills: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: CG.accent,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  pillActive: { backgroundColor: CG.accent },
  pillText: { color: CG.accent, fontWeight: "800", fontSize: 13 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CG.card,
    borderRadius: 16,
    padding: 16,
    minHeight: 60,
    marginBottom: 8,
  },
  toggleLabel: { color: "#FFF", fontWeight: "700", fontSize: 15 },
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
});
