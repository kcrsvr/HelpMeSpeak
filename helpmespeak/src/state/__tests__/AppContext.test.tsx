import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";

// Mock the data layer that AppProvider drives on mount.
jest.mock("../../data/db", () => ({
  initSchema: jest.fn(async () => undefined),
}));

const mockProfiles = [
  { id: "prof_1", name: "Rohit" },
  { id: "prof_2", name: "Aria" },
];

jest.mock("../../data/repositories", () => ({
  ProfileRepo: {
    list: jest.fn(async () => mockProfiles),
  },
  SettingsRepo: {
    getAll: jest.fn(async () => ({
      onboardingComplete: true,
      pinHash: "abc",
      activeProfileId: "prof_2",
    })),
    setActiveProfileId: jest.fn(async () => undefined),
  },
}));

import { AppProvider, useApp } from "../AppContext";
import { initSchema } from "../../data/db";
import { ProfileRepo, SettingsRepo } from "../../data/repositories";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe("AppContext", () => {
  beforeEach(() => jest.clearAllMocks());

  it("initializes the schema and loads settings + profiles on mount", async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(initSchema).toHaveBeenCalledTimes(1);
    expect(SettingsRepo.getAll).toHaveBeenCalled();
    expect(ProfileRepo.list).toHaveBeenCalled();
    expect(result.current.profiles).toHaveLength(2);
  });

  it("derives activeProfile from settings.activeProfileId", async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.activeProfile?.id).toBe("prof_2");
  });

  it("falls back to the first profile when no activeProfileId is set", async () => {
    (SettingsRepo.getAll as jest.Mock).mockResolvedValueOnce({
      onboardingComplete: true,
      pinHash: "abc",
      activeProfileId: null,
    });
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.activeProfile?.id).toBe("prof_1");
  });

  it("setActiveProfile persists the id and reloads settings", async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.setActiveProfile("prof_1");
    });
    expect(SettingsRepo.setActiveProfileId).toHaveBeenCalledWith("prof_1");
    // getAll called once on mount + once after setActiveProfile.
    expect((SettingsRepo.getAll as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("throws when useApp is called outside a provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(renderHook(() => useApp())).rejects.toThrow(
      "useApp must be used within an AppProvider"
    );
    spy.mockRestore();
  });
});
