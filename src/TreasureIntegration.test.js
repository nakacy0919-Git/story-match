import { getLesson, paragraphOptions, cleanText } from "./components/TreasurePanels";
import { hasTreasureAudio, treasureAudioUrl } from "./components/TreasureAudio";
describe("Treasure Hunt integration", () => {
  test.each(Array.from({length:15},(_,i)=>i+1))("Unit %i keeps its complete English lesson", (unit) => {
    const lesson=getLesson(unit);
    expect(lesson.en.length).toBeGreaterThan(75);
    expect(lesson.en).not.toContain("工事中");
    expect(lesson.ja.length).toBeGreaterThan(10);
    expect(lesson.words.length).toBeGreaterThan(0);
  });
  test("paragraph selection follows real source keys",()=>{
    expect(paragraphOptions(1)).toHaveLength(5);
    expect(paragraphOptions(10)).toHaveLength(5);
    expect(paragraphOptions(2)).toHaveLength(0);
    expect(getLesson(1,"p1").en.length).toBeGreaterThan(50);
  });
  test("original model MP3 paths do not confuse source units",()=>{
    expect(hasTreasureAudio(1,"full")).toBe(true);
    expect(hasTreasureAudio(1,"p5")).toBe(false);
    expect(hasTreasureAudio(10,"full")).toBe(false);
    expect(treasureAudioUrl(4,"p2")).toContain("unit4/U04_P1_p2.mp3");
  });
  test("line break markup becomes readable content",()=>{
    expect(cleanText("Hello<br><br>World")).toBe("Hello\n\nWorld");
  });
});