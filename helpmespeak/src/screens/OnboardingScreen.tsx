import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { useApp } from "../state/AppContext";
import { Button } from "../components/Button";
import { PinPad } from "../components/PinPad";
import { ProfileRepo, SettingsRepo } from "../data/repositories";
import { hashPin } from "../utils/pin";
import { ScreenProps } from "../navigation/types";

type Step = 0 | 1 | 2 | 3;

export function OnboardingScreen({ navigation }: ScreenProps<"Onboarding">) {
  const { theme } = useTheme();
  const { reloadProfiles, reloadSettings, setActiveProfile } = useApp();

  const [step, setStep] = useState<Step>(0);
  const [childName, setChildName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onDigit = (d: string) => {
    setError("");
    if (!confirming) {
      if (pin.length < 4) {
        const next = pin + d;
        setPin(next);
        if (next.length === 4) setConfirming(true);
      }
    } else {
      if (confirmPin.length < 4) setConfirmPin(confirmPin + d);
    }
  };

  const onDelete = () => {
    setError("");
    if (confirming && confirmPin.length > 0) setConfirmPin(confirmPin.slice(0, -1));
    else if (confirming && confirmPin.length === 0) {
      setConfirming(false);
      setPin(pin.slice(0, -1));
    } else if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  const finish = async () => {
    if (pin !== confirmPin) {
      setError("PINs don't match. Try again.");
      setPin("");
      setConfirmPin("");
      setConfirming(false);
      return;
    }
    setSaving(true);
    try {
      const hash = await hashPin(pin);
      await SettingsRepo.setPinHash(hash);
      const profile = await ProfileRepo.createWithSeed({
        name: childName.trim() || "Child",
      });
      await SettingsRepo.setOnboardingComplete(true);
      await reloadProfiles();
      await reloadSettings();
      await setActiveProfile(profile.id);
      navigation.replace("ChildHome");
    } finally {
      setSaving(false);
    }
  };

  const slides = [
    {
      emoji: "👦",
      title: "Child Mode",
      desc: "Tap a picture to hear the word and watch it spelled out, one letter at a time, with a happy celebration.",
    },
    {
      emoji: "🔒",
      title: "Caregiver Mode",
      desc: "A private, PIN-protected space to add your own photos and recordings, manage words, and adjust settings.",
    },
    {
      emoji: "🙂",
      title: "Who is this for?",
      desc: "Tell us the child's name. You can add more children later.",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* progress dots */}
      <View style={styles.progress}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              { backgroundColor: i === step ? theme.primary : "#DDD" },
              i === step && { transform: [{ scale: 1.3 }] },
            ]}
          />
        ))}
      </View>

      <View style={styles.body}>
        {step < 3 ? (
          <>
            <Text style={styles.emoji}>{slides[step].emoji}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{slides[step].title}</Text>
            <Text style={[styles.desc, { color: theme.textLight }]}>{slides[step].desc}</Text>
            {step === 2 && (
              <TextInput
                style={[styles.input, { borderColor: theme.primary, color: theme.text }]}
                placeholder="Child's name"
                placeholderTextColor={theme.textLight}
                value={childName}
                onChangeText={setChildName}
                maxLength={24}
                autoCapitalize="words"
                returnKeyType="done"
              />
            )}
          </>
        ) : (
          <View style={styles.pinWrap}>
            <Text style={[styles.title, { color: theme.text }]}>
              {confirming ? "Confirm PIN" : "Set Caregiver PIN"}
            </Text>
            <Text style={[styles.desc, { color: theme.textLight }]}>
              {confirming
                ? "Enter the same 4 digits again."
                : "Choose 4 digits to protect Caregiver Mode."}
            </Text>
            <PinPad
              length={confirming ? confirmPin.length : pin.length}
              onDigit={onDigit}
              onDelete={onDelete}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {step < 3 ? (
          <Button
            title="Continue"
            onPress={() => setStep((s) => (s + 1) as Step)}
          />
        ) : (
          <Button
            title={saving ? "Saving…" : "Let's Go"}
            disabled={saving || confirmPin.length < 4}
            onPress={finish}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 12,
  },
  progressDot: { width: 10, height: 10, borderRadius: 5 },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emoji: { fontSize: 90 },
  title: { fontSize: 26, fontWeight: "900", textAlign: "center" },
  desc: { fontSize: 16, fontWeight: "600", textAlign: "center", lineHeight: 24 },
  input: {
    marginTop: 20,
    width: "100%",
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  pinWrap: { width: "100%", alignItems: "center", gap: 8 },
  error: { color: "#E74C3C", fontWeight: "700", marginTop: 8 },
  footer: { padding: 24 },
});
