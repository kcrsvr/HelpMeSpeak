// ============================================================
// App-level state: settings, profiles, and the active child profile.
// Thin layer over the repositories; screens read from here and call
// reload() after mutations. No cloud, no async middleware — Phase 1.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { initSchema } from "../data/db";
import { ProfileRepo, SettingsRepo } from "../data/repositories";
import { AppSettings, Profile } from "../data/types";

interface AppContextValue {
  ready: boolean;
  settings: AppSettings;
  profiles: Profile[];
  activeProfile: Profile | null;

  reloadSettings: () => Promise<void>;
  reloadProfiles: () => Promise<void>;
  setActiveProfile: (id: string) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  onboardingComplete: false,
  pinHash: null,
  activeProfileId: null,
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const reloadSettings = useCallback(async () => {
    setSettings(await SettingsRepo.getAll());
  }, []);

  const reloadProfiles = useCallback(async () => {
    setProfiles(await ProfileRepo.list());
  }, []);

  const setActiveProfile = useCallback(
    async (id: string) => {
      await SettingsRepo.setActiveProfileId(id);
      await reloadSettings();
    },
    [reloadSettings]
  );

  useEffect(() => {
    (async () => {
      await initSchema();
      await Promise.all([reloadSettings(), reloadProfiles()]);
      setReady(true);
    })();
  }, [reloadSettings, reloadProfiles]);

  const activeProfile = useMemo(() => {
    if (!settings.activeProfileId) return profiles[0] ?? null;
    return profiles.find((p) => p.id === settings.activeProfileId) ?? profiles[0] ?? null;
  }, [profiles, settings.activeProfileId]);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      settings,
      profiles,
      activeProfile,
      reloadSettings,
      reloadProfiles,
      setActiveProfile,
    }),
    [ready, settings, profiles, activeProfile, reloadSettings, reloadProfiles, setActiveProfile]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
