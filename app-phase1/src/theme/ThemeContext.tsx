import React, { createContext, useContext, useMemo, useState } from "react";
import { Theme, THEMES, ThemeId, DEFAULT_THEME_ID } from "./themes";

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
  initialThemeId = DEFAULT_THEME_ID,
}: {
  children: React.ReactNode;
  initialThemeId?: ThemeId;
}) {
  const [themeId, setThemeId] = useState<ThemeId>(initialThemeId);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: THEMES[themeId], themeId, setThemeId }),
    [themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
