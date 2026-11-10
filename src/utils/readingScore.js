/* Story Match word accuracy: Copeak numeric normalization and reviewed name exclusions. */

import { units } from "./readingNumbers";
import { readingNames } from "./readingNames";

const numericDigitKey = digit => "@number:" + Number(digit);
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
// Foreign phrases written in Latin letters cannot be reliably detected from
// spelling alone. Only reviewed phrases are excluded; ordinary English stays scored.
const foreignPhrases = [
  "bonjour", "merci", "hola", "gracias", "adios", "adiós",
  "buenos días", "buenos dias", "guten tag", "namaste",
  "konnichiwa", "arigatou", "arigato", "sayonara", "ni hao",
  "xin chào", "xin chao", "annyeong", "sawasdee",
];
const IGNORE_KEY = "qzxomittedwordqzx";
const unicodeWord = /[\p{L}\p{M}\p{N}]/u;

function escapeRegex(text) {
  return text.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}
function addIgnoredSpan(spans, start, end) {
  if (start >= end || spans.some((s) => start < s.end && end > s.start))
    return;
  spans.push({ start, end });
}
function hasNonAsciiLetter(text) {
  return Array.from(text).some((char) => char.codePointAt(0) > 127);
}
function protectedSpans(sentence) {
  const source = String(sentence || "");
  const spans = [];

  // Prefer complete, manually reviewed names and titles. Match case and word
  // boundaries so ordinary "mark" is never mistaken for the name "Mark".
  for (const phrase of [...readingNames, ...foreignPhrases].sort(
    (x, y) => y.length - x.length,
  )) {
    const pattern = new RegExp(
      escapeRegex(phrase).replace(/['’]/g, "['’]"),
      readingNames.includes(phrase) ? "gu" : "giu",
    );
    for (const found of source.matchAll(pattern)) {
      const start = found.index;
      let end = start + found[0].length;
      // Proper-name possessives (Celina’s, Terry's) form one optional span.
      if (readingNames.includes(phrase) && /^['’]s\b/u.test(source.slice(end)))
        end += 2;
      if (
        !unicodeWord.test(source[start - 1] || "") &&
        !unicodeWord.test(source[end] || "")
      )
        addIgnoredSpan(spans, start, end);
    }
  }

  // Kanji/kana/Hangul/etc. followed by a phonetic hint in parentheses:
  // 八 (bā), 漢字 (kanji), 日本語 (nihongo). Ignore the hint too.
  const romanization = /\(\s*[\p{L}\p{M}]+(?:[\s'-][\p{L}\p{M}]+)*\s*\)/gu;
  for (const match of source.matchAll(romanization)) {
    const preceding = source.slice(0, match.index).trimEnd();
    const previousWord = preceding.match(/[\p{L}\p{M}]+$/u)?.[0] || "";
    if (hasNonAsciiLetter(previousWord))
      addIgnoredSpan(spans, match.index, match.index + match[0].length);
  }

  const tokens = [...source.matchAll(
    /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu,
  )];
  const isTitle = (word) => /^[A-Z][a-z]+$/.test(word);
  const sentenceStart = (start) => {
    const preceding = source.slice(0, start)
      .replace(/[\s"'“”‘’()[\]{}]+$/gu, "");
    return !preceding || /[.!?:]$/.test(preceding);
  };
  const ordinaryCapitalizedWords = new Set(["English"]);
  const starterWords = new Set([
    "a", "an", "the", "i", "we", "you", "he", "she", "it",
    "they", "in", "on", "at", "to", "from", "for", "of",
    "with", "as", "by", "and", "but", "or", "so", "if",
    "when", "while", "after", "before", "because", "however",
    "today", "yesterday", "tomorrow", "then", "now", "once",
    "this", "that", "these", "those", "there", "here",
  ]);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i], word = token[0], start = token.index;
    const end = start + word.length;
    const letters = word.replace(/['’-]/g, "");
    // All non-ASCII words/characters are not English-only score targets.
    // This includes Han characters and accented foreign-language words.
    if (hasNonAsciiLetter(letters)) {
      addIgnoredSpan(spans, start, end);
      continue;
    }
    if (word === "I" || ordinaryCapitalizedWords.has(word)) continue;
    const titled = isTitle(word);
    const acronym = /^[A-Z]{2,}$/.test(word);
    const internalCaps = /^[a-z]+[A-Z][A-Za-z]*$/.test(word);
    const atStart = sentenceStart(start);

    // Unknown single capitalized words in the middle of a sentence are
    // usually names; sentence-initial regular English remains assessable.
    if ((titled && !atStart) || acronym || internalCaps)
      addIgnoredSpan(spans, start, end);

    // Unknown two-word names at the beginning, e.g. "Ada Lovelace".
    if (
      titled && atStart && !starterWords.has(word.toLowerCase()) &&
      isTitle(tokens[i + 1]?.[0] || "") &&
      /^\s+$/.test(source.slice(end, tokens[i + 1].index))
    ) {
      addIgnoredSpan(spans, start, end);
      addIgnoredSpan(
        spans,
        tokens[i + 1].index,
        tokens[i + 1].index + tokens[i + 1][0].length,
      );
    }
  }
  return spans.sort((x, y) => x.start - y.start);
}

function comparison(sentence) {
  const source = String(sentence || "");
  const spans = protectedSpans(source);
  let masked = "", cursor = 0;
  const ignoredWidths = [];
  for (const span of spans) {
    masked += source.slice(cursor, span.start) + " " + IGNORE_KEY + " ";
    ignoredWidths.push(
      Math.min(10, Math.max(2, words(source.slice(span.start, span.end)).length + 2)),
    );
    cursor = span.end;
  }
  masked += source.slice(cursor);
  let ignored = 0;
  return words(masked).map((token) =>
    token === IGNORE_KEY
      ? { max: ignoredWidths[ignored++] || 2 }
      : token,
  );
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
        // License plates/phone numbers like 8888 may be spoken as
        // "eight eight eight eight", while the printed text uses one token.
        // Match only an exact run of digits so ordinary errors still count.
        if (i < n && typeof expected[i] === "string") {
          const run = /^@number:(\d{2,8})$/.exec(expected[i]);
          if (run && j + run[1].length <= m &&
              [...run[1]].every((digit, k) => heard[j + k] === numericDigitKey(digit)))
            dp[i + 1][j + run[1].length] = Math.min(
              dp[i + 1][j + run[1].length], value
            );
        }
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
