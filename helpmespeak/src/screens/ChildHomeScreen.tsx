import React, { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { useApp } from "../state/AppContext";
import { CategoryRepo, WordRepo } from "../data/repositories";
import { Category, Word } from "../data/types";
import { ScreenProps } from "../navigation/types";

export function ChildHomeScreen({ navigation }: ScreenProps<"ChildHome">) {
  const { theme } = useTheme();
  const { activeProfile } = useApp();
  const [featured, setFeatured] = useState<Word[]>([]);
  const [recent, setRecent] = useState<Word[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!activeProfile) return;
    const [feat, recents, cats, allWords] = await Promise.all([
      WordRepo.listFeatured(activeProfile.id),
      WordRepo.listRecentlyUsed(activeProfile.id, 10),
      CategoryRepo.listForProfile(activeProfile.id),
      WordRepo.listForProfile(activeProfile.id),
    ]);
    setFeatured(feat);
    setRecent(recents);
    setCategories(cats);
    const c: Record<string, number> = {};
    for (const w of allWords) c[w.categoryId] = (c[w.categoryId] ?? 0) + 1;
    setCounts(c);
  }, [activeProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openWord = (w: Word) => navigation.navigate("WordExperience", { wordId: w.id });
  const openCategory = (c: Category) =>
    navigation.navigate("Category", { categoryId: c.id, categoryName: c.name });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.headerBg }}>
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.headerText }]}>HelpMeSpeak</Text>
          <View style={styles.avatar}>
            {activeProfile?.avatarUri ? (
              <Image source={{ uri: activeProfile.avatarUri }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 22 }}>{activeProfile?.avatarEmoji ?? "🙂"}</Text>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Featured */}
        {featured.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>⭐ Featured</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRow}
            >
              {featured.map((w) => (
                <Pressable
                  key={w.id}
                  accessibilityRole="button"
                  accessibilityLabel={w.word}
                  onPress={() => openWord(w)}
                  style={({ pressed }) => [
                    styles.featuredCard,
                    { backgroundColor: theme.card, borderColor: pressed ? theme.primary : "transparent" },
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  {w.photoUri ? (
                    <Image source={{ uri: w.photoUri }} style={styles.featuredPhoto} />
                  ) : (
                    <Text style={styles.featuredEmoji}>{w.emoji}</Text>
                  )}
                  <Text style={[styles.featuredWord, { color: theme.text }]} numberOfLines={1}>
                    {w.word}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Recently Used */}
        {recent.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>🕘 Recently Used</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRow}
            >
              {recent.map((w) => (
                <Pressable
                  key={w.id}
                  accessibilityRole="button"
                  accessibilityLabel={w.word}
                  onPress={() => openWord(w)}
                  style={({ pressed }) => [
                    styles.featuredCard,
                    { backgroundColor: theme.card, borderColor: pressed ? theme.primary : "transparent" },
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  {w.photoUri ? (
                    <Image source={{ uri: w.photoUri }} style={styles.featuredPhoto} />
                  ) : (
                    <Text style={styles.featuredEmoji}>{w.emoji}</Text>
                  )}
                  <Text style={[styles.featuredWord, { color: theme.text }]} numberOfLines={1}>
                    {w.word}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Categories */}
        <Text style={[styles.sectionHeader, { color: theme.text }]}>Categories</Text>
        <View style={styles.categoryGrid}>
          {categories.map((c, i) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.name} category`}
              onPress={() => openCategory(c)}
              style={({ pressed }) => [
                styles.categoryTile,
                { backgroundColor: i % 2 === 0 ? theme.primary : theme.accent },
                pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
              ]}
            >
              {c.imageUri ? (
                <Image source={{ uri: c.imageUri }} style={styles.categoryImg} />
              ) : (
                <Text style={styles.categoryEmoji}>{c.emoji}</Text>
              )}
              <Text style={styles.categoryLabel}>{c.name}</Text>
              <Text style={styles.categoryCount}>{counts[c.id] ?? 0} words</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* bottom nav */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: theme.navBg }}>
        <View style={[styles.nav, { backgroundColor: theme.navBg }]}>
          <NavTab icon="🏠" label="Home" active onPress={() => {}} color={theme.navActive} textLight={theme.textLight} />
          <NavTab
            icon="⭐"
            label="Favorites"
            onPress={() => navigation.navigate("Favorites")}
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
      style={({ pressed }) => [styles.navTab, pressed && { transform: [{ scale: 0.92 }] }]}
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 60,
  },
  logo: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  scroll: { flex: 1 },
  sectionHeader: { fontSize: 16, fontWeight: "800", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  featuredRow: { gap: 14, paddingHorizontal: 20, paddingBottom: 8 },
  featuredCard: {
    width: 100,
    minHeight: 100,
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  featuredEmoji: { fontSize: 38 },
  featuredPhoto: { width: 60, height: 60, borderRadius: 12, backgroundColor: "#eee" },
  featuredWord: { fontSize: 13, fontWeight: "800", textAlign: "center" },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 20,
  },
  categoryTile: {
    width: "47%",
    minHeight: 100,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  categoryEmoji: { fontSize: 36 },
  categoryImg: { width: 48, height: 48, borderRadius: 12 },
  categoryLabel: { fontSize: 15, fontWeight: "800", color: "#FFF", textAlign: "center" },
  categoryCount: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  nav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    paddingTop: 8,
  },
  navTab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, minHeight: 56 },
  navIcon: { fontSize: 24 },
  navLabel: { fontSize: 11, fontWeight: "700" },
});
