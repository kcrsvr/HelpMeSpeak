import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { WordTile } from "../WordTile";
import { ThemeProvider } from "../../theme/ThemeContext";
import { Word } from "../../data/types";

const baseWord: Word = {
  id: "word_1",
  profileId: "prof_1",
  categoryId: "cat_1",
  word: "Apple",
  emoji: "🍎",
  photoUri: null,
  photoType: "emoji",
  audioUri: null,
  audioType: "tts",
  isFeatured: false,
  order: 0,
  usageCount: 0,
  lastUsedAt: null,
  createdAt: 0,
  updatedAt: 0,
};

const renderTile = async (word: Word, onPress = jest.fn()) => ({
  onPress,
  ...(await render(
    <ThemeProvider>
      <WordTile word={word} onPress={onPress} />
    </ThemeProvider>
  )),
});

describe("WordTile", () => {
  // TILE-1
  it("shows the emoji when there is no photo", async () => {
    const { getByText } = await renderTile(baseWord);
    expect(getByText("🍎")).toBeTruthy();
  });

  // TILE-2
  it("shows an image and hides the emoji when photoUri is set", async () => {
    const { queryByText, getByTestId } = await renderTile({
      ...baseWord,
      photoUri: "file:///tmp/apple.jpg",
      photoType: "real",
    });
    // Emoji is not rendered.
    expect(queryByText("🍎")).toBeNull();
    // An Image is rendered instead.
    expect(getByTestId("word-photo")).toBeTruthy();
  });

  // TILE-3
  it("fires onPress when tapped", async () => {
    const { getByRole, onPress } = await renderTile(baseWord);
    fireEvent.press(getByRole("button", { name: "Apple" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // TILE-4
  it("uses the word text as its accessible label", async () => {
    const { getByLabelText } = await renderTile(baseWord);
    expect(getByLabelText("Apple")).toBeTruthy();
  });
});
