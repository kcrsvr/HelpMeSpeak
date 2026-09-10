// ============================================================
// THEME SYSTEM — ported from the HTML prototype
// 4 presets, applied per child profile.
// ============================================================

export type ThemeId = "calm-blue" | "rohit" | "nature-green" | "high-contrast";

export interface Theme {
  id: ThemeId;
  name: string;
  primary: string;
  primaryDark: string;
  accent: string;
  bg: string;
  card: string;
  text: string;
  textLight: string;
  navBg: string;
  navActive: string;
  featuredBg: string;
  headerBg: string;
  headerText: string;
  btnText: string;
  highlight: string;
  confetti: [string, string, string, string];
}

export const THEMES: Record<ThemeId, Theme> = {
  "calm-blue": {
    id: "calm-blue",
    name: "Calm Blue",
    primary: "#4A90D9",
    primaryDark: "#2C6FAC",
    accent: "#5BA3E8",
    bg: "#E8F4FD",
    card: "#FFFFFF",
    text: "#1A2A3A",
    textLight: "#5A7A9A",
    navBg: "#FFFFFF",
    navActive: "#4A90D9",
    featuredBg: "#D0E8FA",
    headerBg: "#4A90D9",
    headerText: "#FFFFFF",
    btnText: "#FFFFFF",
    highlight: "#F0C040",
    confetti: ["#4A90D9", "#5BA3E8", "#A8D4F5", "#FFD700"],
  },
  rohit: {
    id: "rohit",
    name: "Rohit",
    primary: "#E74C3C",
    primaryDark: "#C0392B",
    accent: "#F39C12",
    bg: "#FFF9E6",
    card: "#FFFFFF",
    text: "#2C1810",
    textLight: "#8B4513",
    navBg: "#FFFFFF",
    navActive: "#E74C3C",
    featuredBg: "#FDEBD0",
    headerBg: "#E74C3C",
    headerText: "#FFFFFF",
    btnText: "#FFFFFF",
    highlight: "#F39C12",
    confetti: ["#E74C3C", "#F39C12", "#FDEBD0", "#FFD700"],
  },
  "nature-green": {
    id: "nature-green",
    name: "Nature Green",
    primary: "#27AE60",
    primaryDark: "#1E8449",
    accent: "#2ECC71",
    bg: "#F0F9F4",
    card: "#FFFFFF",
    text: "#1A3A2A",
    textLight: "#4A7A5A",
    navBg: "#FFFFFF",
    navActive: "#27AE60",
    featuredBg: "#D5F5E3",
    headerBg: "#27AE60",
    headerText: "#FFFFFF",
    btnText: "#FFFFFF",
    highlight: "#F1C40F",
    confetti: ["#27AE60", "#2ECC71", "#A9DFBF", "#FFD700"],
  },
  "high-contrast": {
    id: "high-contrast",
    name: "High Contrast",
    primary: "#000000",
    primaryDark: "#222222",
    accent: "#FFD700",
    bg: "#FFFFFF",
    card: "#F5F5F5",
    text: "#000000",
    textLight: "#333333",
    navBg: "#000000",
    navActive: "#FFD700",
    featuredBg: "#EEEEEE",
    headerBg: "#000000",
    headerText: "#FFD700",
    btnText: "#000000",
    highlight: "#FFD700",
    confetti: ["#000000", "#FFD700", "#CCCCCC", "#FF0000"],
  },
};

export const THEME_LIST = Object.values(THEMES);
export const DEFAULT_THEME_ID: ThemeId = "calm-blue";
