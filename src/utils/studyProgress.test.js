import { readStudy, readUnitStudy, saveListeningCompletion, saveQuizResult, saveReadingResult,
  saveGrammarAnswer, completedListening, validStudent } from "./studyProgress";
import { comprehensionQuestions } from "./comprehensionQuestions";
import { progressKey, recordResult, loadProgress } from "./progress";

const a={class:"3-2",number:"8",name:"A"}, b={class:"3-2",number:"9",name:"B"};
beforeEach(()=>window.localStorage.clear());
test("all metrics are stored separately for students on the same device",()=>{
 window.localStorage.setItem("storyMatchStudent",JSON.stringify(a));
 expect(validStudent(a)).toBe(true);
 saveReadingResult(10,"full",72);
 saveReadingResult(10,"full",92);
 saveReadingResult(10,"p1",82);
  saveQuizResult(10,"vocabulary","enJa",80);
 saveQuizResult(10,"vocabulary","jaEn",90);
 saveQuizResult(10,"comprehension","en",75);
 saveGrammarAnswer(10,0,true,10);
 expect(readUnitStudy(a,10).reading.full).toMatchObject({best:92,attempts:2,last:92});
 expect(readUnitStudy(a,10).shadowing).toBeUndefined();
 expect(readUnitStudy(a,10).vocabulary.jaEn.best).toBe(90);
 expect(readUnitStudy(a,10).grammar.solved).toEqual([0]);
 window.localStorage.setItem("storyMatchStudent",JSON.stringify(b));
 expect(readUnitStudy(b,10).reading).toBeUndefined();
 saveQuizResult(10,"vocabulary","enJa",50);
 expect(readUnitStudy(a,10).vocabulary.enJa.best).toBe(80);
 expect(readUnitStudy(b,10).vocabulary.enJa.best).toBe(50);
});
test("listening has a three-fully-played-times target per paragraph",()=>{
 window.localStorage.setItem("storyMatchStudent",JSON.stringify(a));
 for(let i=0;i<3;i++)saveListeningCompletion(10,"p1");
 saveListeningCompletion(10,"p2");
 const tally=completedListening(readUnitStudy(a,10),["p1","p2"]);
 expect(tally).toEqual({count:1,total:2,percent:67});
});
test("do not assign anonymous progress to a later learner",()=>{
 window.localStorage.removeItem("storyMatchStudent");
 expect(saveQuizResult(10,"comprehension","ja",100)).toBe(false);
 expect(readStudy(a)).toEqual({});
});
test("Story Match keeps old best scores and now also counts reading tries and random speed",()=>{
 let record={};
 record=recordResult(record,10,"reading",84,{scene:0,total:12});
 record=recordResult(record,10,"reading",80,{scene:0,total:12});
 record=recordResult(record,10,"random",825,{total:12,count:12,elapsedSeconds:46.2});
 window.localStorage.setItem(progressKey(a),JSON.stringify(record));
 const loaded=loadProgress(a)[10];
 expect(loaded.reading[0]).toBe(84);
 expect(loaded.readingAttempts[0]).toBe(2);
 expect(loaded.random.bestSeconds).toBe(46.2);
});
test("comprehension is bilingual for all units; Units 10/15 have curated facts",()=>{
 for(let unit=1;unit<=15;unit++){
  const en=comprehensionQuestions(unit,"en"),ja=comprehensionQuestions(unit,"ja");
  expect(en.length).toBeGreaterThanOrEqual(12);expect(ja).toHaveLength(en.length);
  en.concat(ja).forEach(q=>{expect(q.options).toHaveLength(4);expect(new Set(q.options).size).toBe(4);expect(q.options).toContain(q.correct);expect(q.source.en.length).toBeGreaterThan(8);});
 }
 expect(comprehensionQuestions(10,"en")[0].type).toBe("fact");
 expect(comprehensionQuestions(15,"ja")[0].type).toBe("fact");
});


test("new comprehension banks cover key sentence content without copying four items across units",()=>{
 const expected={10:16,11:12,12:14,13:14,14:14,15:16};
 for(const [unit,count] of Object.entries(expected)){
   const en=comprehensionQuestions(Number(unit),"en");
   expect(en).toHaveLength(count);
   expect(en.filter(q=>q.type==="fact").length).toBeGreaterThanOrEqual(6);
   expect(en.filter(q=>q.type==="sentence")).toHaveLength(6);
   expect(new Set(en.map(q=>q.prompt)).size).toBe(count);
 }
 const content=comprehensionQuestions(10,"en");
 expect(content.map(q=>q.prompt).join(" ")).toMatch(/seventh|eight|Bible/i);
});
