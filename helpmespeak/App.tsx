import React, { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AppProvider, useApp } from "./src/state/AppContext";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { RootStackParamList } from "./src/navigation/types";

import { SplashScreen } from "./src/screens/SplashScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { ChildHomeScreen } from "./src/screens/ChildHomeScreen";
import { CategoryScreen } from "./src/screens/CategoryScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { RecentlyUsedScreen } from "./src/screens/RecentlyUsedScreen";
import { WordExperienceScreen } from "./src/screens/WordExperienceScreen";
import { PinGateScreen } from "./src/screens/PinGateScreen";
import { CaregiverHomeScreen } from "./src/screens/CaregiverHomeScreen";
import { WordWizardScreen } from "./src/screens/WordWizardScreen";
import { ManageCategoriesScreen } from "./src/screens/ManageCategoriesScreen";
import { CategoryDetailScreen } from "./src/screens/CategoryDetailScreen";
import { ManageProfilesScreen } from "./src/screens/ManageProfilesScreen";
import { ProfileSettingsScreen } from "./src/screens/ProfileSettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Keeps the visible theme in sync with the active child's saved theme.
 * When the caregiver switches profiles (or a profile's theme changes),
 * the child app re-themes automatically.
 */
function ThemeSync() {
  const { activeProfile } = useApp();
  const { themeId, setThemeId } = useTheme();

  useEffect(() => {
    if (activeProfile && activeProfile.theme !== themeId) {
      setThemeId(activeProfile.theme);
    }
  }, [activeProfile, themeId, setThemeId]);

  return null;
}

function Navigation() {
  const { ready } = useApp();
  const { theme } = useTheme();

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <Image
          source={require("./src/assets/logo.png")}
          style={styles.loadingLogo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="HelpMeSpeak"
        />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <ThemeSync />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        {/* First run */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* Child mode */}
        <Stack.Screen name="ChildHome" component={ChildHomeScreen} />
        <Stack.Screen
          name="Category"
          component={CategoryScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="RecentlyUsed" component={RecentlyUsedScreen} />
        <Stack.Screen
          name="WordExperience"
          component={WordExperienceScreen}
          options={{ animation: "fade" }}
        />

        {/* Caregiver mode */}
        <Stack.Screen
          name="PinGate"
          component={PinGateScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="CaregiverHome" component={CaregiverHomeScreen} />
        <Stack.Screen
          name="WordWizard"
          component={WordWizardScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="ManageCategories"
          component={ManageCategoriesScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="CategoryDetail"
          component={CategoryDetailScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="ManageProfiles"
          component={ManageProfilesScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="ProfileSettings"
          component={ProfileSettingsScreen}
          options={{ animation: "slide_from_right" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemeProvider>
          <StatusBar style="light" />
          <Navigation />
        </ThemeProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  loadingLogo: { width: 160, height: 160 },
});
