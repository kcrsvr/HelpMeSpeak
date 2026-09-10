import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useApp } from "../state/AppContext";
import { PinPad } from "../components/PinPad";
import { verifyPin } from "../utils/pin";
import { ScreenProps } from "../navigation/types";

export function PinGateScreen({ navigation }: ScreenProps<"PinGate">) {
  const { theme } = useTheme();
  const { settings } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const onDigit = async (d: string) => {
    if (checking || pin.length >= 4) return;
    setError("");
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      setChecking(true);
      const ok = settings.pinHash ? await verifyPin(next, settings.pinHash) : false;
      if (ok) {
        setPin("");
        setChecking(false);
        navigation.replace("CaregiverHome");
      } else {
        setError("Wrong PIN. Try again.");
        setPin("");
        setChecking(false);
      }
    }
  };

  const onDelete = () => {
    if (checking) return;
    setError("");
    setPin((p) => p.slice(0, -1));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={() => navigation.goBack()}
          style={styles.cancel}
        >
          <Text style={[styles.cancelText, { color: theme.textLight }]}>✕ Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.lock}>🔒</Text>
        <Text style={[styles.title, { color: theme.text }]}>Caregiver Mode</Text>
        <Text style={[styles.sub, { color: theme.textLight }]}>Enter your 4-digit PIN</Text>
        <PinPad length={pin.length} onDigit={onDigit} onDelete={onDelete} />
        <Text style={styles.error}>{error}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { flexDirection: "row", padding: 16 },
  cancel: { padding: 8 },
  cancelText: { fontSize: 15, fontWeight: "700" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingBottom: 40 },
  lock: { fontSize: 60 },
  title: { fontSize: 24, fontWeight: "900" },
  sub: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  error: { color: "#E74C3C", fontWeight: "700", minHeight: 24, marginTop: 8 },
});
