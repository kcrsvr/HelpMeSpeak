import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../state/AppContext";
import { ScreenProps } from "../navigation/types";

const CG = {
  bg: "#0F0F1A",
  card: "#1A1A2E",
  accent: "#BB86FC",
  cardActive: "#252540",
};

export function CaregiverHomeScreen({ navigation }: ScreenProps<"CaregiverHome">) {
  const { activeProfile, profiles } = useApp();

  const exitToChild = () => navigation.replace("ChildHome");

  return (
    <View style={[styles.container, { backgroundColor: CG.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: CG.card }}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Caregiver</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ADMIN</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit to Child Mode"
            onPress={exitToChild}
            style={styles.exitBtn}
          >
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>CHILD PROFILE</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            {activeProfile?.avatarUri ? (
              <Image source={{ uri: activeProfile.avatarUri }} style={styles.profileAvatarImg} />
            ) : (
              <Text style={{ fontSize: 30 }}>{activeProfile?.avatarEmoji ?? "🙂"}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{activeProfile?.name ?? "Child"}</Text>
            <Text style={styles.profileSub}>
              {profiles.length} profile{profiles.length === 1 ? "" : "s"} • Local only
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage profiles"
            onPress={() => navigation.navigate("ManageProfiles")}
            style={styles.manageBtn}
          >
            <Text style={styles.manageText}>Manage</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <ActionButton
            icon="➕"
            label="Add New Word"
            onPress={() => navigation.navigate("WordWizard")}
          />
          <ActionButton
            icon="📂"
            label="Manage Words/Categories"
            onPress={() => navigation.navigate("ManageCategories")}
          />
          <ActionButton
            icon="⚙️"
            label="Settings"
            onPress={() => navigation.navigate("ProfileSettings")}
          />
          <ActionButton
            icon="👦"
            label="Manage Profiles"
            onPress={() => navigation.navigate("ManageProfiles")}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview as child"
          onPress={exitToChild}
          style={({ pressed }) => [styles.previewBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.previewText}>👁️  Preview as Child</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: pressed ? CG.cardActive : CG.card },
        pressed && { transform: [{ scale: 0.96 }] },
      ]}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "900", color: CG.accent },
  badge: { backgroundColor: CG.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "900", color: CG.bg, letterSpacing: 0.5 },
  exitBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  exitText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: CG.accent,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: CG.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(187,134,252,0.2)",
    marginBottom: 12,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6200EE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileAvatarImg: { width: "100%", height: "100%" },
  profileName: { fontSize: 20, fontWeight: "900", color: "#FFF" },
  profileSub: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.5)", marginTop: 2 },
  manageBtn: {
    backgroundColor: CG.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  manageText: { color: CG.bg, fontWeight: "800", fontSize: 13 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  actionBtn: {
    width: "47%",
    minHeight: 100,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionIcon: { fontSize: 32 },
  actionLabel: { fontSize: 13, fontWeight: "800", color: "#FFF", textAlign: "center" },
  previewBtn: {
    backgroundColor: "#2E7D63",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  previewText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
});
