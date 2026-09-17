import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "../Button";
import { ThemeProvider } from "../../theme/ThemeContext";

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Button", () => {
  // BTN-1
  it("renders the title text", async () => {
    const { getByText } = await renderWithTheme(<Button title="Save" onPress={() => {}} />);
    expect(getByText("Save")).toBeTruthy();
  });

  // BTN-2
  it("fires onPress when tapped", async () => {
    const onPress = jest.fn();
    const { getByRole } = await renderWithTheme(<Button title="Go" onPress={onPress} />);
    fireEvent.press(getByRole("button", { name: "Go" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // BTN-3
  it("does not fire onPress when disabled", async () => {
    const onPress = jest.fn();
    const { getByRole } = await renderWithTheme(
      <Button title="Nope" onPress={onPress} disabled />
    );
    fireEvent.press(getByRole("button", { name: "Nope" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  // BTN-4
  it("exposes a button role with an accessible label matching the title", async () => {
    const { getByRole } = await renderWithTheme(
      <Button title="Continue" onPress={() => {}} variant="secondary" />
    );
    expect(getByRole("button", { name: "Continue" })).toBeTruthy();
  });
});
