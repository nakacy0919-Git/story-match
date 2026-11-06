import { score } from "./readingScore";
import { allUnitsData } from "../unitsData";
test.each([
  ["seventy", "70"],
  ["seventy five", "75"],
  ["twenty-two", "22"],
  ["one hundred and five", "105"],
  ["five thousand three hundred and seventy three", "5,373"],
  ["nineteen eighty", "1980"],
  ["seventh", "7th"],
  ["90 %", "ninety percent"],
  ["3.5", "three point five"],
])("numbers compare by value: %s = %s", (a, b) => {
  expect(
    score("There are " + a + " books", "There are " + b + " books").percent,
  ).toBe(100);
});
test("different values stay incorrect", () => {
  expect(score("seventy", "seventeen").percent).toBe(0);
  expect(score("70", "71").percent).toBe(0);
});
test("names, places, and split recognitions do not penalize ordinary words", () => {
  expect(
    score("Colin wanted to get easy money", "Calling wanted to get easy money")
      .percent,
  ).toBe(100);
  expect(
    score("Terry Fox was born in Canada", "Cherry box was born in can add a")
      .percent,
  ).toBe(100);
  expect(score("James Lind was a doctor", "was a doctor").percent).toBe(100);
  expect(
    score("Celina’s family needed water", "Selena family needed water").percent,
  ).toBe(100);
  expect(
    score(
      "In Ethiopia people need clean water",
      "In ethi opia people need clean water",
    ).percent,
  ).toBe(100);
});
test("ordinary omissions and additions remain errors around excluded names", () => {
  expect(
    score("Terry Fox was born in Canada", "Terry Fox").percent,
  ).toBeLessThan(80);
  expect(
    score("Colin wanted to get easy money", "wanted").percent,
  ).toBeLessThan(80);
  expect(
    score("Mark wanted easy money", "Mark wanted easy money extra extra extra")
      .percent,
  ).toBeLessThan(80);
  expect(score("Today we help people", "Today").percent).toBeLessThan(80);
  expect(score("Colin", "Colin").percent).toBe(0);
  expect(score("Colin wanted money", "").percent).toBe(0);
});
test("every curriculum scene still scores its exact transcript at 100", () => {
  for (const scenes of Object.values(allUnitsData))
    for (const scene of scenes) {
      expect(score(scene.en, scene.en).percent).toBe(100);
    }
});


test("kanji, kana, Hangul, Arabic and Cyrillic are not required for English accuracy", () => {
  expect(score("The word 八 means eight.", "The word means eight").percent).toBe(100);
  expect(score("I said こんにちは to my friend.", "I said to my friend").percent).toBe(100);
  expect(score("She speaks 한국어 at home.", "She speaks at home").percent).toBe(100);
  expect(score("We learned العربية yesterday.", "We learned yesterday").percent).toBe(100);
  expect(score("They saw Москва on a map.", "They saw on a map").percent).toBe(100);
});
test("romanized non-English hints following foreign writing are ignored", () => {
  expect(score("The word 八 (bā) means eight.", "The word means eight").percent).toBe(100);
  expect(score("The word 八 (ba) means eight.", "The word means eight").percent).toBe(100);
  expect(score("The word 八 (bā) sounds like 発 (fā).", "The word sounds like").percent).toBe(100);
});
test("foreign language phrases and accented words are optional", () => {
  expect(score("She said bonjour and smiled.", "She said and smiled").percent).toBe(100);
  expect(score("He said hola and gracias to me.", "He said and to me").percent).toBe(100);
  expect(score("We enjoyed mañana together.", "We enjoyed together").percent).toBe(100);
});
test("unknown capitalized names are excluded without losing ordinary English", () => {
  expect(score("I met Alice in Tokyo yesterday.", "I met in yesterday").percent).toBe(100);
  expect(score("Ada Lovelace wrote the program.", "wrote the program").percent).toBe(100);
  expect(score("I visited Kyoto and Osaka.", "I visited and").percent).toBe(100);
  expect(score("I called NASA yesterday.", "I called yesterday").percent).toBe(100);
});
test("normal sentence starters, pronouns and lower-case common nouns stay scored", () => {
  expect(score("Today we help people.", "we help people").percent).toBeLessThan(100);
  expect(score("The teacher is kind.", "teacher is kind").percent).toBeLessThan(100);
  expect(score("We said I love you.", "We said love you").percent).toBeLessThan(100);
  expect(score("I made a mark on the wall.", "I made a on the wall").percent).toBeLessThan(100);
  expect(score("I saw a small red box.", "I saw small red box").percent).toBeLessThan(100);
});
test("only non-English or named terms is not sufficient to clear reading", () => {
  expect(score("八 (bā)", "").percent).toBe(0);
  expect(score("Terry Fox", "Terry Fox").percent).toBe(0);
  expect(score("He saw 你好 today.", "你好").percent).toBe(0);
  expect(score("The word 八 (bā) means eight.", "八").percent).toBe(0);
});
