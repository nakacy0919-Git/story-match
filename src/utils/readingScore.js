/* Grammar-only GCC parity helpers. Does not alter normal Copeak or vocabulary scoring. */

const small = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
function numberWords(n) {
  if (n < 20) return small[n];
  if (n < 100)
    return (
      [
        "",
        "",
        "twenty",
        "thirty",
        "forty",
        "fifty",
        "sixty",
        "seventy",
        "eighty",
        "ninety",
      ][Math.floor(n / 10)] + (n % 10 ? " " + small[n % 10] : "")
    );
  if (n < 1000)
    return (
      small[Math.floor(n / 100)] +
      " hundred" +
      (n % 100 ? " " + numberWords(n % 100) : "")
    );
  if (n < 1000000)
    return (
      numberWords(Math.floor(n / 1000)) +
      " thousand" +
      (n % 1000 ? " " + numberWords(n % 1000) : "")
    );
  return String(n);
}
function words(text) {
  let value = String(text || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/(\d),(?=\d{3}\b)/g, "$1");
  const contractions = {
    "can't": "cannot",
    "won't": "will not",
    "i'm": "i am",
    "you're": "you are",
    "it's": "it is",
    "that's": "that is",
    "i've": "i have",
  };
  for (const [from, to] of Object.entries(contractions))
    value = value.split(from).join(to);
  value = value.replace(
    /\b(does|do|did|is|are|was|were|could|would|should|have|has|had|must)n't\b/g,
    "$1 not",
  );
  value = value.replace(/\b\d+\b/g, (n) => numberWords(Number(n)));
  return value
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}
function score(sentence, spoken) {
  const expected = words(sentence),
    heard = words(spoken),
    n = expected.length,
    m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (expected[i - 1] === heard[j - 1] ? 0 : 1),
      );
  const matched = new Set();
  let i = n,
    j = m;
  while (i || j) {
    if (
      i &&
      j &&
      dp[i][j] === dp[i - 1][j - 1] + (expected[i - 1] === heard[j - 1] ? 0 : 1)
    ) {
      if (expected[i - 1] === heard[j - 1]) matched.add(j - 1);
      i--;
      j--;
    } else if (i && dp[i][j] === dp[i - 1][j] + 1) i--;
    else j--;
  }
  return {
    percent: n
      ? Math.max(0, Math.min(100, Math.round(100 * (1 - dp[n][m] / n))))
      : 100,
    matchCount: matched.size,
    targetCount: n,
    errorCount: dp[n][m],
    wordMatches: heard.map((value, k) => ({ value, matched: matched.has(k) })),
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
              ? [440, 554, 659]
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
