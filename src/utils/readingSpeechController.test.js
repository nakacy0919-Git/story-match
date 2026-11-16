import { createReadingSpeechController } from "./readingSpeechController";
import { score } from "./readingScore";
import { wordPracticeScore } from "../components/ReadingWordModal";
let engine, latest, instances, changes, scores;
class Recognizer {
  constructor() {
    latest = this;
    instances.push(this);
  }
  start() {
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
  abort() {}
  result(parts) {
    this.onresult?.({
      results: parts.map(([text, final]) =>
        Object.assign([{ transcript: text }], { isFinal: final }),
      ),
    });
  }
}
beforeEach(() => {
  jest.useFakeTimers();
  instances = [];
  changes = [];
  scores = [];
  engine = createReadingSpeechController({
    host: {
      SpeechRecognition: Recognizer,
      setTimeout,
      clearTimeout,
      speechSynthesis: { cancel() {} },
    },
    calculate: score,
    onChange: (x) => changes.push(x),
    onScore: (...x) => scores.push(x),
  });
  engine.setItem({ id: "1:0", sentence: "I like reading English books" });
});
afterEach(() => {
  engine.cancel();
  jest.useRealTimers();
});
test("fresh recognizers start synchronously even for adjacent identical sentences", () => {
  for (let i = 0; i < 3; i++) {
    engine.setItem({ id: "1:" + i, sentence: "I like reading English books" });
    engine.begin();
    expect(instances).toHaveLength(i + 1);
    latest.result([["I like reading English books", true]]);
    engine.stop();
    expect(scores[i]).toEqual([100, "I like reading English books", "1:" + i]);
  }
});
test("cumulative revisions do not duplicate final words and stop accepts final results", () => {
  engine.begin();
  latest.result([
    ["I like", true],
    ["reading", false],
  ]);
  latest.result([
    ["I like reading", true],
    ["English", false],
  ]);
  latest.stop = function () {
    this.result([["I like reading English books", true]]);
    this.onend();
  };
  engine.stop();
  expect(scores).toEqual([[100, "I like reading English books", "1:0"]]);
});
test("Copeak restart preserves interim words, starts fresh at 250ms, and scores once", () => {
  engine.begin();
  latest.result([["I like reading", false]]);
  latest.onend();
  jest.advanceTimersByTime(249);
  expect(instances).toHaveLength(1);
  jest.advanceTimersByTime(1);
  expect(instances).toHaveLength(2);
  latest.result([["English books", true]]);
  engine.stop();
  jest.advanceTimersByTime(2000);
  expect(scores).toEqual([[100, "I like reading English books", "1:0"]]);
});
test("captured late callbacks from the old scene cannot change the new scene", () => {
  engine.begin();
  const oldResult = latest.onresult,
    oldEnd = latest.onend;
  engine.setItem({ id: "1:1", sentence: "A different sentence" });
  engine.begin();
  const snapshot = changes.at(-1);
  oldResult({
    results: [Object.assign([{ transcript: "old words" }], { isFinal: true })],
  });
  oldEnd();
  expect(changes.at(-1)).toBe(snapshot);
  expect(scores).toHaveLength(0);
  latest.result([["A different sentence", true]]);
  engine.stop();
  expect(scores[0][2]).toBe("1:1");
});
test("empty recognition does not overwrite a score, and missing end uses the 1600ms fallback", () => {
  engine.begin();
  engine.stop();
  expect(scores).toHaveLength(0);
  engine.begin();
  latest.stop = () => {};
  latest.result([["I like reading English books", false]]);
  engine.stop();
  jest.advanceTimersByTime(1599);
  expect(scores).toHaveLength(0);
  jest.advanceTimersByTime(1);
  expect(scores[0][0]).toBe(100);
  jest.advanceTimersByTime(2000);
  expect(scores).toHaveLength(1);
});

test("word auto-check judges final speech immediately and retries without a stop tap", () => {
  engine.setItem({id:"word:world",sentence:"world",autoJudge:true});
  engine.begin();
  latest.result([["word",false]]);
  expect(scores).toHaveLength(0); // nonmatching interim text may still be revised
  latest.result([["word",true]]);
  expect(scores).toEqual([[0,"word","word:world"]]);
  expect(changes.at(-1).phase).toBe("listening");
  const late=latest.onresult;
  latest.result([["word",true],["world",true]]);
  expect(scores).toEqual([[0,"word","word:world"],[100,"world","word:world"]]);
  expect(changes.at(-1).phase).toBe("idle");
  late({results:[Object.assign([{transcript:"world"}],{isFinal:true})]});
  jest.advanceTimersByTime(12000);
  expect(scores).toHaveLength(2);
});

test("word auto-check times out after inactivity and does not award a score",()=>{
  engine.setItem({id:"word:world",sentence:"world",autoJudge:true});
  engine.begin();
  jest.advanceTimersByTime(10000);
  expect(changes.at(-1).phase).toBe("idle");
  expect(changes.at(-1).status).toContain("時間切れ");
  expect(scores).toHaveLength(0);
});

test("manual reading is not automatically finalized",()=>{
  engine.begin();
  latest.result([["I like reading English books",true]]);
  expect(scores).toHaveLength(0);
  expect(changes.at(-1).phase).toBe("listening");
  engine.stop();
  expect(scores[0][0]).toBe(100);
});

test.each([
  ["very","very",100],
  ["very","very sad",100],
  ["very","very very",100],
  ["very","Very, sad!",100],
  ["very","berry",0],
  ["very","every",0],
  ["world","word",0],
  ["look at","please look at the picture",100],
  ["look at","look right at",0],
  ["look at","at look",0],
  ["look at","look",0],
  ["","very",0]
])("word practice target %s against %s", (target,spoken,expected)=>{
  expect(wordPracticeScore(target,spoken).percent).toBe(expected);
});
test("word practice accepts a matching interim transcript immediately, then ignores late events",()=>{
  engine.cancel();
  engine=createReadingSpeechController({
    host:{SpeechRecognition:Recognizer,setTimeout,clearTimeout,speechSynthesis:{cancel(){}}},
    calculate:wordPracticeScore,getThreshold:()=>100,
    onChange:x=>changes.push(x),onScore:(...x)=>scores.push(x)
  });
  engine.setItem({id:"word:very",sentence:"very",autoJudge:true});
  engine.begin();
  latest.result([["every",false]]);
  expect(scores).toHaveLength(0);
  const late=latest.onresult;
  latest.result([["very sad",false]]);
  expect(scores).toEqual([[100,"very sad","word:very"]]);
  expect(changes.at(-1).phase).toBe("idle");
  late({results:[Object.assign([{transcript:"very sad"}],{isFinal:true})]});
  expect(scores).toHaveLength(1);
});
test("word practice waits for a complete phrase and permits extra words",()=>{
  engine.cancel();
  engine=createReadingSpeechController({
    host:{SpeechRecognition:Recognizer,setTimeout,clearTimeout,speechSynthesis:{cancel(){}}},
    calculate:wordPracticeScore,getThreshold:()=>100,
    onChange:x=>changes.push(x),onScore:(...x)=>scores.push(x)
  });
  engine.setItem({id:"word:look at",sentence:"look at",autoJudge:true});
  engine.begin();
  latest.result([["look",false]]);
  expect(scores).toHaveLength(0);
  latest.result([["please look",true],["at the picture",false]]);
  expect(scores).toEqual([[100,"please look at the picture","word:look at"]]);
  expect(changes.at(-1).phase).toBe("idle");
});
