import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import StoryModeBoard from "./components/StoryModeBoard";

const mockBegin = jest.fn();
jest.mock("./utils/useReadingSpeech", () => ({
  useReadingSpeech: () => ({
    phase: "idle", transcript: "", status: "Ready",
    begin: mockBegin, stop: jest.fn(), cancel: jest.fn(), reconnect: jest.fn(),
  }),
}));
jest.mock("./utils/modelAudio", () => ({
  createModelAudioPlayer: () => ({ stop: jest.fn(), play: jest.fn(), setRate: jest.fn() }),
  PLAYBACK_RATES: [0.85, 1],
}));

test("reading display toggles preserve the same scene and microphone controls", () => {
  render(<StoryModeBoard
    storyData={[{ en: "This is the first sentence.", ja: "最初の文です。" },
      { en: "This is the next sentence.", ja: "次の文です。" }]}
    unit={12} scores={[100, 0]} threshold={75} onScore={jest.fn()} onBack={jest.fn()}
  />);
  // The board starts at the first unfinished scene.
  const english = screen.getByText("This is the next sentence.");
  const image = screen.getByRole("img", { name: "Scene 2" });
  const imageButton = screen.getByRole("button", { name: /画像 ON/ });
  fireEvent.click(imageButton);
  expect(image).not.toBeVisible();
  expect(imageButton).toHaveAttribute("aria-pressed", "false");
  const focusButton = screen.getByRole("button", { name: /全画面音読/ });
  fireEvent.click(focusButton);
  expect(screen.getByRole("region", { name: "じっくり学習" })).toHaveClass("is-reading-focus");
  expect(screen.getByText("This is the next sentence.")).toBe(english);
  fireEvent.click(screen.getByRole("button", { name: /和訳 ON/ }));
  expect(screen.queryByText("次の文です。")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /音読スタート/ }));
  expect(mockBegin).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: /画像 OFF/ }));
  expect(image).toBeVisible();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.getByRole("region", { name: "じっくり学習" })).not.toHaveClass("is-reading-focus");
  fireEvent.click(screen.getByRole("button", { name: /前へ/ }));
  expect(screen.getByText("This is the first sentence.")).toBeInTheDocument();
  expect(screen.queryByText("最初の文です。")).not.toBeInTheDocument();
});
