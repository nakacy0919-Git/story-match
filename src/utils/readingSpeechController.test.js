import { createReadingSpeechController } from "./readingSpeechController";
import { score } from "./readingScore";
let engine, latest, instances, changes, scores;
class Recognizer {
  constructor() {
    latest = this;
    instances.push(this);
  }
  start() {
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
  abort() {}
  result(parts) {
    this.onresult?.({
      results: parts.map(([text, final]) =>
        Object.assign([{ transcript: text }], { isFinal: final }),
      ),
    });
  }
}
beforeEach(() => {
  jest.useFakeTimers();
  instances = [];
  changes = [];
  scores = [];
  engine = createReadingSpeechController({
    host: {
      SpeechRecognition: Recognizer,
      setTimeout,
      clearTimeout,
      speechSynthesis: { cancel() {} },
    },
    calculate: score,
    onChange: (x) => changes.push(x),
    onScore: (...x) => scores.push(x),
  });
  engine.setItem({ id: "1:0", sentence: "I like reading English books" });
});
afterEach(() => {
  engine.cancel();
  jest.useRealTimers();
});
test("fresh recognizers start synchronously even for adjacent identical sentences", () => {
  for (let i = 0; i < 3; i++) {
    engine.setItem({ id: "1:" + i, sentence: "I like reading English books" });
    engine.begin();
    expect(instances).toHaveLength(i + 1);
    latest.result([["I like reading English books", true]]);
    engine.stop();
    expect(scores[i]).toEqual([100, "I like reading English books", "1:" + i]);
  }
});
test("cumulative revisions do not duplicate final words and stop accepts final results", () => {
  engine.begin();
  latest.result([
    ["I like", true],
    ["reading", false],
  ]);
  latest.result([
    ["I like reading", true],
    ["English", false],
  ]);
  latest.stop = function () {
    this.result([["I like reading English books", true]]);
    this.onend();
  };
  engine.stop();
  expect(scores).toEqual([[100, "I like reading English books", "1:0"]]);
});
test("Copeak restart preserves interim words, starts fresh at 250ms, and scores once", () => {
  engine.begin();
  latest.result([["I like reading", false]]);
  latest.onend();
  jest.advanceTimersByTime(249);
  expect(instances).toHaveLength(1);
  jest.advanceTimersByTime(1);
  expect(instances).toHaveLength(2);
  latest.result([["English books", true]]);
  engine.stop();
  jest.advanceTimersByTime(2000);
  expect(scores).toEqual([[100, "I like reading English books", "1:0"]]);
});
test("captured late callbacks from the old scene cannot change the new scene", () => {
  engine.begin();
  const oldResult = latest.onresult,
    oldEnd = latest.onend;
  engine.setItem({ id: "1:1", sentence: "A different sentence" });
  engine.begin();
  const snapshot = changes.at(-1);
  oldResult({
    results: [Object.assign([{ transcript: "old words" }], { isFinal: true })],
  });
  oldEnd();
  expect(changes.at(-1)).toBe(snapshot);
  expect(scores).toHaveLength(0);
  latest.result([["A different sentence", true]]);
  engine.stop();
  expect(scores[0][2]).toBe("1:1");
});
test("empty recognition does not overwrite a score, and missing end uses the 1600ms fallback", () => {
  engine.begin();
  engine.stop();
  expect(scores).toHaveLength(0);
  engine.begin();
  latest.stop = () => {};
  latest.result([["I like reading English books", false]]);
  engine.stop();
  jest.advanceTimersByTime(1599);
  expect(scores).toHaveLength(0);
  jest.advanceTimersByTime(1);
  expect(scores[0][0]).toBe(100);
  jest.advanceTimersByTime(2000);
  expect(scores).toHaveLength(1);
});
