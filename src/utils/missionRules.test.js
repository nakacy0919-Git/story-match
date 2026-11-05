import { DEFAULT_RULES, validateRules, safeRules } from "./missionRules";
import { completedModes, recordResult } from "./progress";
test("rules accept valid values and reject malformed or out-of-range settings", () => {
  expect(
    validateRules({
      readingAccuracy: 60,
      puzzleSeconds: 90,
      randomPoints: 500,
      listeningPoints: 600,
    }),
  ).toEqual({
    readingAccuracy: 60,
    puzzleSeconds: 90,
    randomPoints: 500,
    listeningPoints: 600,
  });
  for (const v of [0, 101, "60", NaN])
    expect(() =>
      validateRules({ ...DEFAULT_RULES, readingAccuracy: v }),
    ).toThrow();
  expect(() =>
    validateRules({ ...DEFAULT_RULES, puzzleSeconds: -1 }),
  ).toThrow();
  expect(safeRules({})).toEqual(DEFAULT_RULES);
});
test("changing rules re-evaluates best results instead of keeping stale clear flags", () => {
  let p = {};
  for (let i = 0; i < 2; i++)
    p = recordResult(p, 1, "reading", 70, { scene: i });
  p = recordResult(p, 1, "puzzle", 95, { level: 3 });
  p = recordResult(p, 1, "random", 500, { count: 2, total: 2 });
  p = recordResult(p, 1, "listening", 600, { count: 2, total: 2 });
  expect(
    completedModes(p[1], 2, {
      readingAccuracy: 60,
      puzzleSeconds: 100,
      randomPoints: 500,
      listeningPoints: 600,
    }),
  ).toEqual([true, true, true, true]);
  expect(
    completedModes(p[1], 2, {
      readingAccuracy: 80,
      puzzleSeconds: 90,
      randomPoints: 501,
      listeningPoints: 601,
    }),
  ).toEqual([false, false, false, false]);
  expect(
    completedModes({ reading: { 0: 70 } }, 2, {
      ...DEFAULT_RULES,
      readingAccuracy: 60,
    })[0],
  ).toBe(false);
});
