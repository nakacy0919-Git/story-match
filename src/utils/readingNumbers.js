// Numeric comparison units from Copeak grammar-practice-engine.js.
const SMALL = Object.freeze({
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
});
const TENS = Object.freeze({
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
});
const ORD = Object.freeze({
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
  thirteenth: 13,
  fourteenth: 14,
  fifteenth: 15,
  sixteenth: 16,
  seventeenth: 17,
  eighteenth: 18,
  nineteenth: 19,
  twentieth: 20,
  thirtieth: 30,
  fortieth: 40,
  fiftieth: 50,
  sixtieth: 60,
  seventieth: 70,
  eightieth: 80,
  ninetieth: 90,
});
const SCALE = Object.freeze({
  thousand: 1000,
  million: 1000000,
  billion: 1000000000,
});
const YEAR_PREFIX = Object.freeze({
  seventeen: 1700,
  eighteen: 1800,
  nineteen: 1900,
  twenty: 2000,
});
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function rawWords(text) {
  return (
    String(text || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/\b\d{1,3}(?:,\d{3})+\b/g, (match) => match.replace(/,/g, ""))
      .replace(/(\d(?:\.\d+)?)\s*%/g, "$1 percent")
      .match(/\d+(?:\.\d+)?(?:st|nd|rd|th)?|[a-z]+/g) || []
  );
}
function numericKey(value, ordinal = false) {
  const numeric = Number(value);
  return (
    "@number:" +
    ((Number.isFinite(numeric) && Number.isSafeInteger(numeric)) ||
    (Number.isFinite(numeric) && String(value).includes("."))
      ? String(numeric)
      : String(value)) +
    (ordinal ? ":ordinal" : "")
  );
}
function literalNumber(token) {
  const match = /^(\d+(?:\.\d+)?)(st|nd|rd|th)?$/.exec(token);
  return match ? numericKey(match[1], !!match[2]) : null;
}
function cardinalValue(token) {
  return own(SMALL, token)
    ? SMALL[token]
    : own(TENS, token)
      ? TENS[token]
      : null;
}
function numberPhrase(tokens, start) {
  // "twenty twenty-six" and "nineteen ninety-nine" are common year readings.
  const prefix = YEAR_PREFIX[tokens[start]];
  const next = cardinalValue(tokens[start + 1]);
  if (prefix !== undefined && next !== null && next >= 10) {
    let value = next,
      end = start + 2;
    if (
      next >= 20 &&
      next % 10 === 0 &&
      end < tokens.length &&
      own(SMALL, tokens[end]) &&
      SMALL[tokens[end]] > 0 &&
      SMALL[tokens[end]] < 10
    ) {
      value += SMALL[tokens[end]];
      end++;
    }
    return { end, key: numericKey(prefix + value) };
  }
  let total = 0,
    group = 0,
    seen = false,
    ordinal = false,
    previous = "start",
    i = start;
  if (
    tokens[i] === "a" &&
    (tokens[i + 1] === "hundred" || own(SCALE, tokens[i + 1]))
  ) {
    group = 1;
    seen = true;
    previous = "unit";
    i++;
  }
  for (; i < tokens.length; i++) {
    const word = tokens[i],
      small = cardinalValue(word),
      ord = own(ORD, word) ? ORD[word] : null;
    if (word === "point") {
      if (!seen) break;
      let j = i + 1,
        decimals = "";
      while (j < tokens.length) {
        const digit = own(SMALL, tokens[j]) ? SMALL[tokens[j]] : null;
        if (digit === null || digit > 9) break;
        decimals += String(digit);
        j++;
      }
      if (!decimals) break;
      return {
        end: j,
        key: numericKey(String(total + group) + "." + decimals),
      };
    }
    if (word === "and") {
      if (
        !["hundred", "scale"].includes(previous) ||
        (cardinalValue(tokens[i + 1]) === null && !own(ORD, tokens[i + 1]))
      )
        break;
      previous = "and";
      continue;
    }
    if (word === "hundred" || word === "hundredth") {
      if (!seen || !["unit", "tens"].includes(previous)) break;
      group *= 100;
      previous = "hundred";
      if (word === "hundredth") {
        ordinal = true;
        i++;
        break;
      }
      continue;
    }
    const scale = own(SCALE, word)
      ? SCALE[word]
      : word === "thousandth"
        ? 1000
        : null;
    if (scale !== null) {
      if (!seen || !["unit", "tens", "hundred"].includes(previous)) break;
      total += group * scale;
      group = 0;
      previous = "scale";
      if (word.endsWith("th")) {
        ordinal = true;
        i++;
        break;
      }
      continue;
    }
    if (small === null && ord === null) break;
    const number = ord === null ? small : ord;
    if (previous === "unit" || previous === "ordinal") break;
    if (previous === "tens" && !(number > 0 && number < 10)) break;
    if (previous === "tens") group += number;
    else group += number;
    seen = true;
    previous =
      ord !== null
        ? "ordinal"
        : number >= 20 && number % 10 === 0
          ? "tens"
          : "unit";
    if (ord !== null) {
      ordinal = true;
      i++;
      break;
    }
  }
  return seen ? { end: i, key: numericKey(total + group, ordinal) } : null;
}
function units(text) {
  const tokens = rawWords(text),
    result = [];
  for (let i = 0; i < tokens.length; ) {
    const raw = tokens[i],
      literal = literalNumber(raw);
    if (literal) {
      result.push({ key: literal, display: [raw] });
      i++;
      continue;
    }
    const phrase = numberPhrase(tokens, i);
    if (phrase && phrase.end > i) {
      result.push({ key: phrase.key, display: tokens.slice(i, phrase.end) });
      i = phrase.end;
      continue;
    }
    result.push({ key: raw, display: [raw] });
    i++;
  }
  return result;
}
export { units };
