import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useApp } from "../state/AppContext";
import { speakPhrase, stopWord } from "../utils/audio";
import { ScreenProps } from "../navigation/types";

// How long the welcome lingers before auto-advancing to the dashboard.
// Long enough for the spoken "Welcome, <name>" greeting to finish comfortably.
const AUTO_ADVANCE_MS = 3000;

/**
 * A warm, personalized greeting shown on app open (for returning users) before
 * the child dashboard. Greets the active child by name with their avatar, then
 * auto-advances. Tapping anywhere skips straight in.
 */
export function WelcomeScreen({ navigation }: ScreenProps<"Welcome">) {
  const { theme } = useTheme();
  const { activeProfile } = useApp();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const advanced = useRef(false);

  const name = activeProfile?.name ?? "Friend";
  const ttsEnabled = activeProfile?.ttsEnabled ?? true;

  const go = () => {
    if (advanced.current) return;
    advanced.current = true;
    stopWord(); // cut off the greeting if we're moving on
    navigation.replace("ChildHome");
  };

  useEffect(() => {
    // Gentle fade + pop in.
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Speak the greeting in the child-like voice, once the screen appears.
    speakPhrase(`Welcome, ${name}`, ttsEnabled).catch(() => {});

    const t = setTimeout(go, AUTO_ADVANCE_MS);
    return () => {
      clearTimeout(t);
      stopWord();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.primary }]}
      onPress={go}
      accessibilityRole="button"
      accessibilityLabel={`Welcome ${name}. Tap to continue.`}
    >
      <Animated.View style={{ alignItems: "center", opacity, transform: [{ scale }] }}>
        <View style={[styles.avatar, { borderColor: "rgba(255,255,255,0.6)" }]}>
          {activeProfile?.avatarUri ? (
            <Image source={{ uri: activeProfile.avatarUri }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarEmoji}>{activeProfile?.avatarEmoji ?? "🙂"}</Text>
          )}
        </View>
        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.name}>{name}!</Text>
        <Text style={styles.wave}>👋</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    overflow: "hidden",
    marginBottom: 28,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarEmoji: { fontSize: 72 },
  welcome: { fontSize: 30, fontWeight: "700", color: "rgba(255,255,255,0.9)", letterSpacing: 1 },
  name: { fontSize: 46, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5, marginTop: 4, textAlign: "center" },
  wave: { fontSize: 56, marginTop: 20 },
});
