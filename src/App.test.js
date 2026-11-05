import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import { progressKey, recordResult } from "./utils/progress";
const student = { class: "3-2", number: "8", name: "Test Student" };
class SpeechMock {
  constructor() {
    SpeechMock.latest = this;
  }
  start() {}
  stop() {
    this.onend?.();
  }
  abort() {}
  say(text) {
    const r = [{ transcript: text }];
    r.isFinal = true;
    this.onresult({ results: [r], resultIndex: 0 });
  }
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("storyMatchStudent", JSON.stringify(student));
  window.SpeechRecognition = SpeechMock;
  window.speechSynthesis = {
    cancel: jest.fn(),
    resume: jest.fn(),
    speak: jest.fn(),
    getVoices: () => [],
  };
  jest.useFakeTimers();
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});
const reading = () =>
  fireEvent.click(screen.getByRole("button", { name: /📖.*じっくり学習/ }));
const say = (text) => {
  fireEvent.click(screen.getByRole("button", { name: "🎙 音読スタート" }));
  act(() => SpeechMock.latest.say(text));
  fireEvent.click(screen.getByRole("button", { name: "■ 終了・判定" }));
};
test("reading requires 80%, saves progress, and resumes at the first uncleared scene", () => {
  render(<App />);
  reading();
  expect(
    screen.getByRole("button", { name: "次のシーンへ ▶" }),
  ).toBeDisabled();
  say("unrelated");
  expect(
    screen.getByRole("button", { name: "次のシーンへ ▶" }),
  ).toBeDisabled();
  say("Colin wanted to get easy money from the hospital.");
  expect(screen.getByRole("button", { name: "次のシーンへ ▶" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "← 学習進捗へ" }));
  expect(
    JSON.parse(localStorage.getItem(progressKey(student)))[2].reading[0],
  ).toBe(100);
  reading();
  expect(screen.getByText("Scene 2 / 12")).toBeInTheDocument();
});
test("a prior recognizer cannot write to another scene after unmount", () => {
  render(<App />);
  reading();
  fireEvent.click(screen.getByRole("button", { name: "🎙 音読スタート" }));
  const old = SpeechMock.latest;
  fireEvent.click(screen.getByRole("button", { name: "← 学習進捗へ" }));
  expect(old.onresult).toBeNull();
  expect(old.onend).toBeNull();
});
test("completed missions and student name survive a reload", () => {
  let p = {};
  for (let i = 0; i < 12; i++)
    p = recordResult(p, 2, "reading", 80, { scene: i });
  p = recordResult(p, 2, "puzzle", 42.5, { level: 3 });
  p = recordResult(p, 2, "random", 950, { count: 12, total: 12 });
  p = recordResult(p, 2, "listening", 850, { count: 12, total: 12 });
  localStorage.setItem(progressKey(student), JSON.stringify(p));
  render(<App />);
  expect(screen.getByText("Test Student")).toBeInTheDocument();
  expect(screen.getByText("ALL MISSIONS CLEAR!")).toBeInTheDocument();
  expect(screen.getByText("950 pts")).toBeInTheDocument();
  expect(screen.getByText("850 pts")).toBeInTheDocument();
});
test("tap placement completes puzzle once and records elapsed seconds", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /🧩.*パズルモード/ }));
  fireEvent.click(screen.getByRole("button", { name: /Level 1/ }));
  fireEvent.click(screen.getByRole("button", { name: "START!" }));
  // Keyboard activation uses the same accessible tap fallback.
  for (const n of [2, 4, 6, 8, 10, 12]) {
    fireEvent.click(screen.getByRole("button", { name: "画像 " + n }), {
      detail: 0,
    });
    act(() => jest.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole("button", { name: "空欄 " + n }));
  }
  const p = JSON.parse(localStorage.getItem(progressKey(student)));
  expect(p[2].puzzle[1].best).toBe(6);
  expect(JSON.parse(localStorage.getItem("storyMatchHistory"))).toHaveLength(1);
});
