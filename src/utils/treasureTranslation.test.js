import { getLesson } from "../components/TreasurePanels";
import { lookupTranslation, normalizeEnglish, sentenceParts } from "./treasureTranslation";

test("Unit 15 has one-sentence translation through the final sentence", () => {
  const sentences=sentenceParts(getLesson(15).en).map(x=>x.text);
  expect(sentences).toHaveLength(18);
  const first=lookupTranslation(15,"full",0,sentences[0],sentences);
  const last=lookupTranslation(15,"full",17,sentences[17],sentences);
  expect(first.kind).toBe("sentence");
  expect(first.text).toContain("困っている人");
  expect(last.kind).toBe("sentence");
  expect(last.text).toContain("この記事");
});

test("Unit 1 and Unit 2 original Treasure Hunt text have reviewed sentence translations", () => {
  for(const unit of [1,2]){
    const parts=sentenceParts(getLesson(unit).en).map(x=>x.text);
    const result=lookupTranslation(unit,"full",parts.length-1,parts[parts.length-1],parts);
    expect(result.kind).toBe("sentence");
    expect(result.text.length).toBeGreaterThan(10);
  }
});
test("HTML paragraph marks do not interfere with a text comparison", () => {
  expect(normalizeEnglish("Hello.<br><br>World!")).toBe("hello world");
});
test("Other units never present an unmatched paragraph as a single-sentence translation", () => {
  const sentences=sentenceParts(getLesson(10).en).map(x=>x.text);
  const selected=sentences.find(x=>x.includes("comes from the Bible"));
  const result=lookupTranslation(10,"full",sentences.indexOf(selected),selected,sentences);
  expect(["sentence","scene","paragraph"]).toContain(result.kind);
  if(result.kind!=="sentence")expect(result.label).toMatch(/段落|複数|本文/);
});
test("a paragraph view still produces an original source-based translation", () => {
  const sentence=sentenceParts(getLesson(15,"p1").en).map(x=>x.text);
  const result=lookupTranslation(15,"p1",0,sentence[0],sentence);
  expect(result.text.length).toBeGreaterThan(10);
});
