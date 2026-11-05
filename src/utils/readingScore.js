/* Story Match word accuracy: Copeak numeric normalization and reviewed name exclusions. */

import { units } from "./readingNumbers";
import { readingNames } from "./readingNames";
function normalized(text) {
  let value = String(text || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'");
  const contractions = {
    "can't": "cannot",
    "won't": "will not",
    "I'm": "I am",
    "i'm": "i am",
    "you're": "you are",
    "it's": "it is",
    "that's": "that is",
    "I've": "I have",
    "i've": "i have",
  };
  for (const [from, to] of Object.entries(contractions))
    value = value.split(from).join(to);
  return value.replace(
    /\b(does|do|did|is|are|was|were|could|would|should|have|has|had|must)n't\b/gi,
    "$1 not",
  );
}
function words(text) {
  return units(normalized(text)).map((x) => x.key);
}
function comparison(sentence) {
  const expected = words(sentence),
    ignored = [];
  // Names are reviewed against this curriculum, not guessed from capitalization.
  const names = readingNames
    .filter((name) => String(sentence).includes(name))
    .map(words)
    .sort((a, b) => b.length - a.length);
  for (let i = 0; i < expected.length; ) {
    const name = names.find((tokens) =>
      tokens.every(
        (v, j) =>
          expected[i + j] === v ||
          (j === tokens.length - 1 && expected[i + j] === v + "s"),
      ),
    );
    if (name) {
      ignored.push({ max: Math.min(10, name.length + 2) });
      i += name.length;
    } else {
      ignored.push(expected[i]);
      i++;
    }
  }
  return ignored;
}
function score(sentence, spoken) {
  const expected = comparison(sentence),
    heard = words(spoken),
    n = expected.length,
    m = heard.length;
  const targetCount = expected.filter((x) => typeof x === "string").length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  dp[0][0] = 0;
  for (let i = 0; i <= n; i++)
    for (let j = 0; j <= m; j++) {
      const value = dp[i][j];
      if (!Number.isFinite(value)) continue;
      if (i < n && typeof expected[i] !== "string") {
        // An excluded proper name may be omitted or transcribed as a few words.
        // Ordinary words following it still require their own alignment.
        for (let k = 0; k <= Math.min(expected[i].max, m - j); k++)
          dp[i + 1][j + k] = Math.min(dp[i + 1][j + k], value);
      } else {
        if (i < n) dp[i + 1][j] = Math.min(dp[i + 1][j], value + 1);
        if (j < m) dp[i][j + 1] = Math.min(dp[i][j + 1], value + 1);
        if (i < n && j < m)
          dp[i + 1][j + 1] = Math.min(
            dp[i + 1][j + 1],
            value + (expected[i] === heard[j] ? 0 : 1),
          );
      }
    }
  const errorCount = dp[n][m];
  return {
    percent:
      targetCount && m
        ? Math.max(
            0,
            Math.min(100, Math.round(100 * (1 - errorCount / targetCount))),
          )
        : 0,
    targetCount,
    errorCount,
    excludedCount: expected.filter((x) => typeof x !== "string").length,
  };
}
function createFeedback(win) {
  let context = null,
    enabled = true;
  try {
    enabled = win.localStorage?.getItem("copeak-grammar-sounds") !== "off";
  } catch (_) {}
  function tone(kind = "tap") {
    if (!enabled) return;
    try {
      const Audio = win.AudioContext || win.webkitAudioContext;
      if (!Audio) return;
      if (!context || context.state === "closed") context = new Audio();
      if (context.state === "suspended") context.resume().catch(() => {});
      const notes =
        kind === "100"
          ? [523, 659, 784, 1046]
          : kind === "90"
            ? [493, 659, 880]
            : kind === "80"
              ? [392, 494, 587, 784]
              : kind === "retry"
                ? [392, 440]
                : kind === "next"
                  ? [587, 784]
                  : kind === "rise"
                    ? [330, 392, 440, 523]
                    : [523, 659];
      notes.forEach((hz, i) => {
        const t = context.currentTime + i * (kind === "tap" ? 0.055 : 0.09),
          osc = context.createOscillator(),
          gain = context.createGain();
        osc.type = "sine";
        osc.frequency.value = hz;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(
          kind === "tap" ? 0.018 : 0.025,
          t + 0.017,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch (_) {
      /* Optional feedback must never block the microphone. */
    }
  }
  return {
    tone,
    get enabled() {
      return enabled;
    },
    toggle() {
      enabled = !enabled;
      try {
        win.localStorage?.setItem(
          "copeak-grammar-sounds",
          enabled ? "on" : "off",
        );
      } catch (_) {}
      return enabled;
    },
  };
}
export { score, words, createFeedback };
