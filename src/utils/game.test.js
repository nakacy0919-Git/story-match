import { deferQuestion, makeChoices, makeQuestions, shuffle } from './game';

test('quiz contains only valid indices and respects the requested count', () => {
  expect(makeQuestions(12, 5, () => 0.5)).toHaveLength(5);
  expect(new Set(makeQuestions(12, 'ALL', () => 0.5)).size).toBe(12);
  expect(makeQuestions(2, 12, () => 0.5)).toHaveLength(2);
  expect(makeQuestions(0, 5)).toEqual([]);
});

test('scene zero is a valid question and choice', () => {
  const choices = makeChoices(12, 0, () => 0.5);
  expect(choices).toContain(0);
  expect(new Set(choices).size).toBe(3);
  expect(makeChoices(2, 0, () => 0.5)).toHaveLength(2);
});

test('a skipped last question remains available as the next question', () => {
  const queue = deferQuestion([3, 0, 2], 2);
  expect(queue).toEqual([3, 0, 2, 2]);
  expect(queue[3]).toBe(2);
});

test('shuffle does not mutate the input', () => {
  const original = [0, 1, 2, 3];
  expect(shuffle(original, () => 0)).toHaveLength(4);
  expect(original).toEqual([0, 1, 2, 3]);
});
