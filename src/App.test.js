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
    SpeechMock.count = (SpeechMock.count || 0) + 1;
  }
  start() {
    this.onstart?.();
  }
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
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  SpeechMock.count = 0;
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

test("scenes 1, 2 and 3 each start a fresh recognizer directly from the tap", () => {
  render(<App />);
  reading();
  const lines = [
    "Colin wanted to get easy money from the hospital.",
    'Colin: "Doctor, I have lost my sense of taste."',
    'Doctor: "Nurse, please bring the medicine from box 22."',
  ];
  for (let i = 0; i < lines.length; i++) {
    say(lines[i]);
    expect(
      JSON.parse(localStorage.getItem(progressKey(student)))[2].reading[i],
    ).toBe(100);
    expect(SpeechMock.count).toBe(i + 1);
    if (i < 2)
      fireEvent.click(screen.getByRole("button", { name: "次のシーンへ ▶" }));
  }
});
test("silent recognizers reconnect and do not leak the previous scene transcript", () => {
  render(<App />);
  reading();
  say("Colin wanted to get easy money from the hospital.");
  fireEvent.click(screen.getByRole("button", { name: "次のシーンへ ▶" }));
  fireEvent.click(screen.getByRole("button", { name: "🎙 音読スタート" }));
  act(() => jest.advanceTimersByTime(8850));
  expect(SpeechMock.count).toBe(3);
  act(() =>
    SpeechMock.latest.say("Colin: Doctor, I have lost my sense of taste."),
  );
  fireEvent.click(screen.getByRole("button", { name: "■ 終了・判定" }));
  expect(
    JSON.parse(localStorage.getItem(progressKey(student)))[2].reading[1],
  ).toBe(100);
});
test("mission workspaces omit the title and student profile", () => {
  render(<App />);
  reading();
  expect(screen.queryByText("Test Student")).not.toBeInTheDocument();
  expect(screen.queryByText("Story Match")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "← 学習進捗へ" }));
  expect(screen.getByText("Test Student")).toBeInTheDocument();
});

test("a delayed WebKit shutdown cannot block or overwrite the next scene", () => {
  render(<App />);
  reading();
  fireEvent.click(screen.getByRole("button", { name: "🎙 音読スタート" }));
  const old = SpeechMock.latest;
  old.stop = () => {};
  act(() => old.say("Colin wanted to get easy money from the hospital."));
  fireEvent.click(screen.getByRole("button", { name: "■ 終了・判定" }));
  act(() => jest.advanceTimersByTime(1600));
  expect(old.onresult).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "次のシーンへ ▶" }));
  fireEvent.click(screen.getByRole("button", { name: "🎙 音読スタート" }));
  act(() => jest.advanceTimersByTime(500));
  expect(SpeechMock.count).toBe(2);
  act(() =>
    SpeechMock.latest.say("Colin: Doctor, I have lost my sense of taste."),
  );
  fireEvent.click(screen.getByRole("button", { name: "■ 終了・判定" }));
  expect(
    JSON.parse(localStorage.getItem(progressKey(student)))[2].reading[1],
  ).toBe(100);
});

test("the previous recognizer is never reused after advancing a scene", () => {
  render(<App />);
  reading();
  say("Colin wanted to get easy money from the hospital.");
  SpeechMock.latest.start = () => {
    const e = new Error("closing");
    e.name = "InvalidStateError";
    throw e;
  };
  fireEvent.click(screen.getByRole("button", { name: "次のシーンへ ▶" }));
  fireEvent.click(screen.getByRole("button", { name: "🎙 音読スタート" }));
  act(() => jest.advanceTimersByTime(850));
  expect(SpeechMock.count).toBe(2);
  act(() =>
    SpeechMock.latest.say("Colin: Doctor, I have lost my sense of taste."),
  );
  fireEvent.click(screen.getByRole("button", { name: "■ 終了・判定" }));
  expect(
    JSON.parse(localStorage.getItem(progressKey(student)))[2].reading[1],
  ).toBe(100);
});

test("manual start in every scene remains inside the trusted click task", () => {
  const Base = SpeechMock;
  let userActivation = false;
  window.SpeechRecognition = class extends Base {
    start() {
      if (!userActivation) throw new Error("user activation lost");
      super.start();
    }
  };
  render(<App />);
  reading();
  const lines = [
    "Colin wanted to get easy money from the hospital.",
    "Colin: Doctor, I have lost my sense of taste.",
    "Doctor: Nurse, please bring the medicine from box 22.",
  ];
  for (let i = 0; i < lines.length; i++) {
    userActivation = true;
    fireEvent.click(screen.getByRole("button", { name: "🎙 音読スタート" }));
    userActivation = false;
    expect(SpeechMock.count).toBe(i + 1);
    act(() => SpeechMock.latest.say(lines[i]));
    fireEvent.click(screen.getByRole("button", { name: "■ 終了・判定" }));
    expect(
      JSON.parse(localStorage.getItem(progressKey(student)))[2].reading[i],
    ).toBe(100);
    if (i < 2)
      fireEvent.click(screen.getByRole("button", { name: "次のシーンへ ▶" }));
  }
});

test("an 80 percent pass shows confetti and a skip never creates progress", () => {
  render(<App />);
  reading();
  fireEvent.click(screen.getByRole("button", { name: "スキップ（未クリア）" }));
  expect(screen.getByText("Scene 2 / 12")).toBeInTheDocument();
  expect(
    JSON.parse(localStorage.getItem(progressKey(student)))?.[2]?.reading?.[0],
  ).toBeUndefined();
  expect(screen.queryByTestId("reading-confetti")).not.toBeInTheDocument();
  say("Doctor, I have lost my sense of taste.");
  expect(screen.getByTestId("reading-confetti")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "← 学習進捗へ" }));
  expect(screen.queryByText("ALL MISSIONS CLEAR!")).not.toBeInTheDocument();
  reading();
  expect(screen.getByText("Scene 1 / 12")).toBeInTheDocument();
});
test("a failed attempt does not show confetti", () => {
  render(<App />);
  reading();
  say("unrelated");
  expect(screen.queryByTestId("reading-confetti")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "スキップ（未クリア）" }),
  ).toBeEnabled();
});

test("a cached administrator threshold applies to reading gates and confetti", () => {
  localStorage.setItem(
    "storyMatchMissionRulesCache",
    JSON.stringify({
      readingAccuracy: 60,
      puzzleSeconds: 0,
      randomPoints: 0,
      listeningPoints: 0,
    }),
  );
  render(<App />);
  reading();
  expect(screen.getByText("Accuracy 60%以上で合格")).toBeInTheDocument();
  say("Colin wanted to get easy money");
  expect(screen.getByRole("button", { name: "次のシーンへ ▶" })).toBeEnabled();
  expect(screen.getByTestId("reading-confetti")).toBeInTheDocument();
});


test("reading uses Unit 7 Model recordings and adjusts playback speed", () => {
  const OriginalAudio = window.Audio;
  const instances = [];
  window.Audio = jest.fn().mockImplementation((src) => {
    const a = {
      src,
      playbackRate: 1,
      play: jest.fn(() => Promise.resolve()),
      pause: jest.fn(),
    };
    instances.push(a);
    return a;
  });
  try {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Unit 7/ }));
    reading();
    fireEvent.click(screen.getByRole("button", { name: "🔊 お手本を聞く" }));
    expect(instances[0].src).toContain("/audio/unit7/1.wav");
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox", { name: "お手本の再生速度" }), {
      target: { value: "0.75" },
    });
    expect(instances[0].playbackRate).toBe(0.75);
  } finally {
    window.Audio = OriginalAudio;
  }
});

test("listening waits until the model audio finishes before enabling answers", () => {
  const OriginalAudio = window.Audio;
  const instances = [];
  window.Audio = jest.fn().mockImplementation((src) => {
    const a = {
      src,
      playbackRate: 1,
      play: jest.fn(() => Promise.resolve()),
      pause: jest.fn(),
    };
    instances.push(a);
    return a;
  });
  try {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Unit 7/ }));
    fireEvent.click(screen.getByRole("button", { name: /🎧.*リスニング/ }));
    fireEvent.click(screen.getByRole("button", { name: "START!" }));
    fireEvent.click(screen.getByRole("button", { name: "START!" }));
    expect(instances).toHaveLength(1);
    const images = screen.getAllByRole("button", { name: /選択画像/ });
    expect(images.every((button) => button.disabled)).toBe(true);
    act(() => instances[0].onended());
    expect(images.every((button) => !button.disabled)).toBe(true);
    expect(screen.getByText("音声を聞き終えました。画像を選んでください。")).toBeInTheDocument();
  } finally {
    window.Audio = OriginalAudio;
  }
});
