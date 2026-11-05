// Fisher-Yates shuffle: unlike sort(() => Math.random() - 0.5), it is unbiased.
export function shuffle(items, random = Math.random) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function makeQuestions(sceneCount, count, random = Math.random) {
  const total = Number.isInteger(sceneCount) ? Math.max(0, sceneCount) : 0;
  const requested = count === 'ALL' ? total : Number(count);
  const limit = Number.isFinite(requested) ? Math.min(total, Math.max(0, Math.floor(requested))) : total;
  return shuffle(Array.from({ length: total }, (_, index) => index), random).slice(0, limit);
}

export function makeChoices(sceneCount, correctIndex, random = Math.random) {
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= sceneCount) return [];
  const wrong = shuffle(
    Array.from({ length: sceneCount }, (_, index) => index).filter(index => index !== correctIndex),
    random
  ).slice(0, 2);
  return shuffle([correctIndex, ...wrong], random);
}

export function deferQuestion(queue, index) {
  if (!Array.isArray(queue) || index < 0 || index >= queue.length) return queue;
  return [...queue, queue[index]];
}
