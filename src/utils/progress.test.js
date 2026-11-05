import {
  completedModes,
  recordResult,
  sceneScores,
  progressKey,
} from "./progress";
import { score } from "./readingScore";
test("reading unlocks at 80, saves best, and only clears all completed scenes", () => {
  let p = recordResult({}, 2, "reading", 79, { scene: 0 });
  expect(completedModes(p[2], 2)[0]).toBe(false);
  p = recordResult(p, 2, "reading", 80, { scene: 0 });
  p = recordResult(p, 2, "reading", 95, { scene: 1 });
  p = recordResult(p, 2, "reading", 10, { scene: 0 });
  expect(sceneScores(p[2], 2)).toEqual([80, 95]);
  expect(completedModes(p[2], 2)[0]).toBe(true);
});
test("zero puzzle time and zero quiz scores remain valid completed attempts", () => {
  let p = recordResult({}, 1, "puzzle", 0, { level: 3 });
  p = recordResult(p, 1, "puzzle", 10, { level: 3 });
  p = recordResult(p, 1, "random", 0, { count: 12, total: 12 });
  p = recordResult(p, 1, "listening", 900, { count: 3, total: 12 });
  expect(p[1].puzzle[3]).toEqual({ best: 0, last: 10 });
  expect(completedModes(p[1], 12)).toEqual([false, true, true, false]);
});
test("quiz best scores stay comparable by question count and full clear is retained", () => {
  let p = recordResult({}, 1, "listening", 800, { count: 12, total: 12 });
  p = recordResult(p, 1, "listening", 200, { count: 3, total: 12 });
  expect(p[1].listening.bestByCount).toEqual({ 12: 800, 3: 200 });
  expect(p[1].listening.fullClear).toBe(true);
  expect(p[2]).toBeUndefined();
});
test("students have independent record keys", () => {
  expect(progressKey({ class: "3-2", number: "1", name: "A" })).not.toBe(
    progressKey({ class: "3-2", number: "2", name: "B" }),
  );
});
test("Copeak word error scoring penalizes omissions and added words", () => {
  expect(
    score("I love English very much", "I love English very much").percent,
  ).toBe(100);
  expect(score("I love English very much", "I love English very").percent).toBe(
    80,
  );
  expect(score("I love English very much", "I love English").percent).toBe(60);
  expect(
    score("I love English", "I love English extra extra extra").percent,
  ).toBe(0);
});
test("numeric transcription and contractions do not cause false penalties", () => {
  expect(score("I have 50 books", "I have fifty books").percent).toBe(100);
  expect(
    score("Box 22 has 1,000 dollars", "Box twenty two has one thousand dollars")
      .percent,
  ).toBe(100);
  expect(score("I don't know", "I do not know").percent).toBe(100);
  expect(score("fifteen", "fifty").percent).toBe(0);
});

test("legacy puzzle records and quiz scores migrate once to their existing owner", () => {
  const { restoreWithLegacy, loadProgress } = require("./progress");
  localStorage.clear();
  const owner = { class: "3-2", number: "1", name: "A" };
  localStorage.setItem("storyMatchBestTimes", JSON.stringify({ "2-L3": 35 }));
  localStorage.setItem(
    "storyMatchHistory",
    JSON.stringify([{ unit: 2, mode: "random", result: 450 }]),
  );
  const records = restoreWithLegacy(owner);
  expect(records[2].puzzle[3].best).toBe(35);
  expect(records[2].random.legacyBest).toBe(450);
  expect(records[2].random.fullClear).toBeUndefined();
  expect(loadProgress(owner)[2].puzzle[3].best).toBe(35);
  expect(restoreWithLegacy({ ...owner, name: "B" })).toEqual({});
  localStorage.clear();
});
