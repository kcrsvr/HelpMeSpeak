import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Easing } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useApp } from "../state/AppContext";
import { ScreenProps } from "../navigation/types";

export function SplashScreen({ navigation }: ScreenProps<"Splash">) {
  const { theme } = useTheme();
  const { ready, settings, profiles } = useApp();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const done = settings.onboardingComplete && settings.pinHash && profiles.length > 0;
      navigation.replace(done ? "ChildHome" : "Onboarding");
    }, 1400);
    return () => clearTimeout(t);
  }, [ready, settings, profiles, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <Animated.Text style={[styles.icon, { transform: [{ scale: pulse }] }]}>
        🗣️
      </Animated.Text>
      <Text style={styles.title}>HelpMeSpeak</Text>
      <Text style={styles.subtitle}>Every child has something to say</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  icon: { fontSize: 80 },
  title: { fontSize: 36, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1 },
  subtitle: { fontSize: 17, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
});
