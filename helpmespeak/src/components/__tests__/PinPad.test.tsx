import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PinPad } from "../PinPad";
import { ThemeProvider } from "../../theme/ThemeContext";

const renderPad = async (
  props: Partial<React.ComponentProps<typeof PinPad>> = {}
) => {
  const onDigit = jest.fn();
  const onDelete = jest.fn();
  const utils = await render(
    <ThemeProvider>
      <PinPad length={0} onDigit={onDigit} onDelete={onDelete} {...props} />
    </ThemeProvider>
  );
  return { onDigit, onDelete, ...utils };
};

describe("PinPad", () => {
  // PAD-1
  it("renders digit keys 0-9 and a delete key", async () => {
    const { getByLabelText } = await renderPad();
    for (let d = 0; d <= 9; d++) {
      expect(getByLabelText(`Digit ${d}`)).toBeTruthy();
    }
    expect(getByLabelText("Delete")).toBeTruthy();
  });

  // PAD-2
  it("calls onDigit with the tapped digit", async () => {
    const { getByLabelText, onDigit } = await renderPad();
    fireEvent.press(getByLabelText("Digit 5"));
    expect(onDigit).toHaveBeenCalledWith("5");
  });

  // PAD-3
  it("calls onDelete when the delete key is tapped", async () => {
    const { getByLabelText, onDelete } = await renderPad();
    fireEvent.press(getByLabelText("Delete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  // PAD-4
  it("renders exactly 11 pressable keys (0-9 plus delete)", async () => {
    const { getAllByRole } = await renderPad();
    expect(getAllByRole("button")).toHaveLength(11);
  });
});
