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
