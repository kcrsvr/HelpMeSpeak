/* eslint-disable no-undef */
// Global Jest setup: default mocks for Expo/native modules.
// Individual tests can override any of these via jest.spyOn / mockImplementation.

// --- expo-crypto ---
jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  // Deterministic "hash": prefix + input so tests can assert on the salted input.
  digestStringAsync: jest.fn(async (_algo, data) => `hashed(${data})`),
}));

// --- expo-file-system/legacy ---
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  getInfoAsync: jest.fn(async () => ({ exists: true })),
  makeDirectoryAsync: jest.fn(async () => undefined),
  copyAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
}));

// --- expo-speech ---
jest.mock("expo-speech", () => ({
  speak: jest.fn((_text, opts) => {
    // Immediately resolve the "done" callback so awaited speech settles.
    opts?.onDone?.();
  }),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(async () => [
    { identifier: "com.apple.voice.samantha", name: "Samantha", language: "en-US" },
  ]),
}));

// --- expo-audio ---
// createAudioPlayer returns a player whose addListener callback we can trigger.
jest.mock("expo-audio", () => {
  const makePlayer = () => {
    const listeners = [];
    return {
      play: jest.fn(),
      remove: jest.fn(),
      addListener: jest.fn((_evt, cb) => {
        listeners.push(cb);
        // Fire "finished" on next tick so awaited playback resolves in tests.
        setTimeout(() => cb({ didJustFinish: true }), 0);
        return { remove: jest.fn() };
      }),
      __listeners: listeners,
    };
  };
  return {
    createAudioPlayer: jest.fn(() => makePlayer()),
    setAudioModeAsync: jest.fn(async () => undefined),
    requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
    useAudioRecorder: jest.fn(() => ({
      prepareToRecordAsync: jest.fn(async () => undefined),
      record: jest.fn(),
      stop: jest.fn(async () => undefined),
      uri: "file:///tmp/recording.m4a",
    })),
    RecordingPresets: { HIGH_QUALITY: {} },
    AudioModule: {},
  };
});

// --- expo-haptics ---
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

// --- expo-image-picker ---
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: "file:///tmp/picked.jpg" }],
  })),
  launchCameraAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: "file:///tmp/camera.jpg" }],
  })),
  MediaTypeOptions: { Images: "Images" },
}));

// --- @react-navigation/native: useFocusEffect runs the effect immediately ---
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  const React = require("react");
  return {
    ...actual,
    useFocusEffect: (cb) => React.useEffect(cb, []),
  };
});

// Silence noisy act() / animation warnings that aren't actionable in unit tests.
const origError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("not wrapped in act")) return;
  origError(...args);
};
