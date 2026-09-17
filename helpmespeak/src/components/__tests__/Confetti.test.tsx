import React from "react";
import { render } from "@testing-library/react-native";
import { Animated } from "react-native";
import { Confetti } from "../Confetti";

const COLORS = ["#FF0000", "#00FF00", "#0000FF"];

// Confetti runs looped Animated.timing with useNativeDriver: true. Under Jest
// there is no native animation module, and letting the loop start crashes the
// worker. We stub the animation driver so mounting only exercises the render
// path (which is what these tests assert on).
let loopSpy: jest.SpyInstance;
let timingSpy: jest.SpyInstance;

beforeAll(() => {
  const noopAnim = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() } as any;
  loopSpy = jest.spyOn(Animated, "loop").mockReturnValue(noopAnim);
  timingSpy = jest.spyOn(Animated, "timing").mockReturnValue(noopAnim);
});

afterAll(() => {
  loopSpy.mockRestore();
  timingSpy.mockRestore();
});

describe("Confetti", () => {
  // CONF-1
  it("renders without crashing at default intensity", async () => {
    const tree = await render(<Confetti colors={COLORS} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  // CONF-2
  it("renders more pieces at higher intensity", async () => {
    // Piece count = round(40 * max(intensity, 1)). Some pieces are colored
    // dots and some are emoji, so we compare total node counts between
    // intensities rather than asserting an exact number.
    const low = await render(<Confetti colors={COLORS} intensity={1} />);
    const high = await render(<Confetti colors={COLORS} intensity={3} />);

    const countNodes = (node: any): number => {
      if (node == null) return 0;
      if (Array.isArray(node)) return node.reduce((n, c) => n + countNodes(c), 0);
      const children = node.children ?? [];
      return 1 + countNodes(children);
    };

    expect(countNodes(high.toJSON())).toBeGreaterThan(countNodes(low.toJSON()));
  });
});
