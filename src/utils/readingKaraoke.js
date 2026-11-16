// Word offsets preserve the original text, including spaces and punctuation.
export function readingWords(text) {
  return Array.from(String(text || "").matchAll(/\S+/g), match => ({
    text: match[0], start: match.index, end: match.index + match[0].length,
    weight: Math.max(1.5, Math.sqrt(match[0].replace(/[^a-z0-9]/gi, "").length) * 1.5)
      + (/[.!?]["'”’)]*$/.test(match[0]) ? 2 : /[,;:]["'”’)]*$/.test(match[0]) ? 0.8 : 0),
  }));
}

// An estimate, not a forced alignment: used when no precise timestamps exist.
export function readingOffsetAt(words, fraction) {
  if (!words.length || !Number.isFinite(fraction)) return null;
  const total = words.reduce((sum, word) => sum + word.weight, 0);
  let remaining = Math.max(0, Math.min(1, fraction)) * total;
  for (const word of words) {
    if (remaining < word.weight) return word.start;
    remaining -= word.weight;
  }
  return words[words.length - 1].start;
}

export function estimatedReadingSeconds(words, rate) {
  return Math.max(0.5, words.reduce((sum, word) => sum + word.weight, 0) / (7.5 * Math.max(0.25, rate || 1)));
}
