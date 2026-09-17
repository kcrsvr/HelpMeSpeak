import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { ThemeProvider, useTheme } from "../ThemeContext";
import { THEMES, DEFAULT_THEME_ID } from "../themes";

const wrapper =
  (initialThemeId?: any) =>
  ({ children }: { children: React.ReactNode }) =>
    <ThemeProvider initialThemeId={initialThemeId}>{children}</ThemeProvider>;

describe("ThemeContext", () => {
  it("defaults to the default theme", async () => {
    const { result } = await renderHook(() => useTheme(), { wrapper: wrapper() });
    expect(result.current.themeId).toBe(DEFAULT_THEME_ID);
    expect(result.current.theme).toBe(THEMES[DEFAULT_THEME_ID]);
  });

  it("honors an explicit initialThemeId", async () => {
    const { result } = await renderHook(() => useTheme(), { wrapper: wrapper("rohit") });
    expect(result.current.themeId).toBe("rohit");
    expect(result.current.theme.name).toBe("Rohit");
  });

  it("switches the active theme via setThemeId", async () => {
    const { result } = await renderHook(() => useTheme(), { wrapper: wrapper() });
    await act(async () => result.current.setThemeId("nature-green"));
    expect(result.current.themeId).toBe("nature-green");
    expect(result.current.theme).toBe(THEMES["nature-green"]);
  });

  it("throws a clear error when used outside a provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(renderHook(() => useTheme())).rejects.toThrow(
      "useTheme must be used within a ThemeProvider"
    );
    spy.mockRestore();
  });
});
