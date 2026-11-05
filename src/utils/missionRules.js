const DEFAULT_RULES = Object.freeze({
  readingAccuracy: 80,
  puzzleSeconds: 0,
  randomPoints: 0,
  listeningPoints: 0,
});
function validateRules(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("合格基準の形式が不正です。");
  const limits = {
    readingAccuracy: [1, 100],
    puzzleSeconds: [0, 86400],
    randomPoints: [0, 100000],
    listeningPoints: [0, 100000],
  };
  const result = {};
  for (const [key, [min, max]] of Object.entries(limits)) {
    const n = value[key];
    if (
      typeof n !== "number" ||
      !Number.isFinite(n) ||
      !Number.isInteger(n) ||
      n < min ||
      n > max
    )
      throw Error("合格基準は範囲内の整数で入力してください。");
    result[key] = n;
  }
  return result;
}
function safeRules(value) {
  try {
    return validateRules(value);
  } catch (_) {
    return { ...DEFAULT_RULES };
  }
}
module.exports = { DEFAULT_RULES, validateRules, safeRules };
