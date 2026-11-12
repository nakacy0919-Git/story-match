import React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

beforeEach(() => {
  window.localStorage.clear();
  window.speechSynthesis = { cancel: jest.fn(), getVoices: () => [], speak: jest.fn() };
});
afterEach(cleanup);
function boot(){render(<App/>);fireEvent.click(screen.getByRole("button",{name:"Unit 1"}));fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));}

test("single-page Treasure Hunt workspace opens scripts and original game modes", () => {
  boot();
  expect(screen.getByRole("navigation", { name: "ユニットを選択" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Reading Script" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Unit 10" }));
  expect(screen.getByRole("heading",{name:"Learning Progress"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));
  expect(screen.getByText("UNIT 10 · FULL TEXT")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Reading Script" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Japanese.*日本語訳/ }));
  expect(screen.getByRole("heading", { name: "Japanese Translation" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Story Match.*4つのゲームモード/ }));
  expect(screen.getByText(/Student Registration/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("クラス"), { target: { value: "3-2" } });
  fireEvent.change(screen.getByLabelText("番号"), { target: { value: "8" } });
  fireEvent.change(screen.getByLabelText("氏名"), { target: { value: "Student" } });
  fireEvent.click(screen.getByRole("button", { name: "Start Learning" }));
  expect(screen.getByRole("heading", { name: "Select Game Mode" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "じっくり学習" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "パズルモード" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "ランダムモード" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "リスニング" })).toBeInTheDocument();
});

test("vocabulary and grammar are available without student registration", () => {
  boot();
  fireEvent.click(screen.getByRole("button", { name: /Vocabulary.*単語と4択クイズ/ }));
  expect(screen.getByRole("heading", { name: "Vocabulary Training" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Grammar.*英文の並び替え/ }));
  expect(screen.getByRole("heading", { name: "Sentence Builder" })).toBeInTheDocument();
});


test("a vocabulary word opens an anchored popup with English playback", () => {
  window.SpeechSynthesisUtterance=function(word){this.text=word;};
  boot();
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
  fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));
  fireEvent.click(screen.getAllByRole("button",{name:/crowd の意味と発音/})[0]);
  const dialog=screen.getByRole("dialog",{name:"単語の意味と発音"});
  expect(dialog).toHaveTextContent("群衆");
  expect(dialog).toHaveTextContent("crowd");
  expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  expect(document.querySelector(".th-definition")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"ポップアップを閉じる"}));
  expect(screen.queryByRole("dialog",{name:"単語の意味と発音"})).toBeNull();
});

test("tapping a sentence opens its Japanese translation instead of pushing down the passage", async () => {
  boot();
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
  fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));
  const sentence=document.querySelector('[data-sentence-index="14"]');
  expect(sentence).toHaveTextContent("Clearly");
  fireEvent.pointerUp(sentence);
  const dialog=await screen.findByRole("dialog",{name:"選択した英文の訳"});
  expect(dialog).toHaveTextContent("一文の日本語訳");
  expect(dialog).toHaveTextContent("グループの人数が少ないほど");
});

test("full Japanese translation remains available within the Script panel", () => {
  boot();
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
  fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));
  fireEvent.click(screen.getByRole("button",{name:/全文訳を表示/}));
  expect(screen.getByRole("button",{name:"全文訳を隠す"})).toBeInTheDocument();
  expect(document.querySelector(".th-translation")).toBeInTheDocument();
});


test("reading font size controls are compact, bounded, and retained across units",()=>{
  boot();
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
  fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));
  const paragraph=document.querySelector(".th-interactive-text");
  expect(paragraph).toHaveStyle({fontSize:"22px"});
  fireEvent.click(screen.getByRole("button",{name:"文字を大きく"}));
  expect(paragraph).toHaveStyle({fontSize:"24px"});
  expect(screen.getByLabelText("現在の文字サイズ")).toHaveTextContent("24px");
  expect(window.localStorage.getItem("treasure-hunt-reading-font-size")).toBe("24");
  fireEvent.click(screen.getByRole("button",{name:"Unit 14"}));
  fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));
  expect(document.querySelector(".th-interactive-text")).toHaveStyle({fontSize:"24px"});
  fireEvent.click(screen.getByRole("button",{name:"文字を小さく"}));
  expect(document.querySelector(".th-interactive-text")).toHaveStyle({fontSize:"22px"});
});

test("word popup is a centered modal and shows pronunciation",()=>{
  window.SpeechSynthesisUtterance=function(word){this.text=word;};
  boot();
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
  fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));
  fireEvent.click(screen.getAllByRole("button",{name:/crowd の意味と発音/})[0]);
  const wordModal=screen.getByRole("dialog",{name:"単語の意味と発音"});
  expect(wordModal).toHaveClass("th-word-modal");
  expect(wordModal.parentElement).toHaveClass("th-word-backdrop");
  expect(wordModal).toHaveAttribute("aria-modal","true");
  expect(wordModal).toHaveTextContent("crowd");
  fireEvent.pointerDown(wordModal.parentElement);
  expect(screen.queryByRole("dialog",{name:"単語の意味と発音"})).toBeNull();
});

test("Japanese translation uses the same adjustable font size",()=>{
  boot();
  fireEvent.click(screen.getByRole("button",{name:/Japanese.*日本語訳/}));
  fireEvent.click(screen.getByRole("button",{name:"文字を大きく"}));
  expect(document.querySelector(".th-translation")).toHaveStyle({fontSize:"24px"});
});


class ReadingDockSpeechMock {
  constructor(){ReadingDockSpeechMock.latest=this;}
  start(){this.onstart?.();}
  stop(){this.onend?.();}
  abort(){}
  say(text){const result=[{transcript:text}];result.isFinal=true;this.onresult?.({results:[result],resultIndex:0});}
}
test("Reading Check has a fixed control dock and independently scrollable English passage",()=>{
  window.SpeechRecognition=ReadingDockSpeechMock;
  boot();
  fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
  fireEvent.click(screen.getByRole("button",{name:/Script.*英文の本文/}));
  fireEvent.click(screen.getByRole("button",{name:/Reading Check.*音読判定/}));
  expect(document.querySelector(".th-stage-content")).toHaveClass("is-reading");
  expect(screen.getByRole("region",{name:"音読する英文（スクロール可能）"})).toHaveTextContent("A lucky number");
  expect(document.querySelector(".th-reading-dock")).toBeInTheDocument();
  expect(screen.getByRole("img",{name:"Accuracy —"})).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"🎙 音読スタート"})).toBeInTheDocument();
});
test("the same recording button starts and stops and updates the semicircle Accuracy result",()=>{
  window.SpeechRecognition=ReadingDockSpeechMock;
  boot();
  fireEvent.click(screen.getByRole("button",{name:/Reading Check.*音読判定/}));
  fireEvent.click(screen.getByRole("button",{name:"🎙 音読スタート"}));
  expect(screen.getByRole("button",{name:"■ 終了・判定"})).toHaveAttribute("aria-pressed","true");
  const expected=document.querySelector(".th-practice-text").textContent;
  act(()=>ReadingDockSpeechMock.latest.say(expected));
  expect(screen.getByLabelText("認識された英文")).toHaveTextContent(expected.slice(0,25));
  fireEvent.click(screen.getByRole("button",{name:"■ 終了・判定"}));
  expect(screen.getByRole("button",{name:"🎙 音読スタート"})).toHaveAttribute("aria-pressed","false");
  expect(screen.getByRole("img",{name:"Accuracy 100%"})).toBeInTheDocument();
});
test("Shadowing shares the same fixed panel and single recording control",()=>{
  window.SpeechRecognition=ReadingDockSpeechMock;
  boot();
  fireEvent.click(screen.getByRole("button",{name:/Shadowing.*音声に続けて音読/}));
  expect(document.querySelector(".th-stage-content")).toHaveClass("is-reading");
  expect(screen.getByRole("region",{name:"音読する英文（スクロール可能）"})).toBeInTheDocument();
  expect(document.querySelector(".th-reading-dock")).toBeInTheDocument();
});


test("Power Slide opening reveals Learning Progress with 12-ring analytics",()=>{
 render(<App/>);
 expect(screen.getByRole("dialog",{name:"POWER SLIDE オープニング"})).toBeInTheDocument();
 expect(screen.getByRole("heading",{name:"Learning Progress"})).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:/スキップ/}));
 expect(screen.queryByRole("dialog",{name:"POWER SLIDE オープニング"})).toBeNull();
 expect(screen.queryByRole("heading",{name:"Reading Script"})).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
 expect(screen.getByRole("heading",{name:"Learning Progress"})).toBeInTheDocument();
 expect(document.querySelectorAll(".th-analytics-card")).toHaveLength(12);
 expect(screen.getByText(/12項目の達成度/)).toBeInTheDocument();
 expect(document.querySelectorAll(".th-analytics-group")).toHaveLength(3);
 document.querySelectorAll(".th-analytics-group").forEach(group=>{
   expect(group.querySelectorAll(".th-analytics-card")).toHaveLength(4);
 });
 expect(document.querySelectorAll(".th-activity-icon svg")).toHaveLength(12);
 expect(document.querySelector(".th-analytics-listening")).toBeNull();
 expect(document.querySelector(".th-stage-top")).toBeNull();
 expect(screen.getAllByRole("heading",{name:"Learning Progress"})).toHaveLength(1);
});

test("personal metrics are isolated and listening counts only completed playback",()=>{
 const student={class:"3-2",number:"6",name:"Progress Student"};
 localStorage.setItem("storyMatchStudent",JSON.stringify(student));
 render(<App/>);
 fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
 expect(screen.getByRole("heading",{name:"Learning Progress"})).toBeInTheDocument();
 expect(screen.getByText(/Progress Student/)).toBeInTheDocument();
 expect(screen.getByRole("button",{name:/段落リスニング 0% 練習へ/})).toBeInTheDocument();
 expect(document.querySelector(".th-analytics-listening")).toBeNull();
});


test("every metric keeps its click action after the four-column layout redesign",()=>{
 const student={class:"3-2",number:"9",name:"Card Student"};
 localStorage.setItem("storyMatchStudent",JSON.stringify(student));
 render(<App/>);
 fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
 const cards=document.querySelectorAll(".th-analytics-group");
 expect(cards[0].getAttribute("data-tone")).toBe("sky");
 expect(cards[1].getAttribute("data-tone")).toBe("teal");
 expect(cards[2].getAttribute("data-tone")).toBe("violet");
 fireEvent.click(screen.getByRole("button",{name:/段落リスニング 0% 練習へ/}));
 expect(screen.getByRole("heading",{name:"Listening Mission"})).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:/Learning Progress.*進捗を分析/}));
 fireEvent.click(screen.getByRole("button",{name:/内容把握 EN 0% 練習へ/}));
 expect(screen.getByRole("heading",{name:"内容理解 Check"})).toBeInTheDocument();
});


test("Unit 10 comprehension has sixteen contextual questions and opens word help",()=>{
  const student={class:"3-2",number:"10",name:"Comprehension Student"};
  localStorage.setItem("storyMatchStudent",JSON.stringify(student));
  render(<App/>);
  fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
  fireEvent.click(screen.getByRole("button",{name:/内容把握 EN 0% 練習へ/}));
  expect(screen.getByRole("heading",{name:"内容理解 Check"})).toBeInTheDocument();
  expect(screen.getByText(/QUESTION/).parentElement).toHaveTextContent("16");
  fireEvent.click(screen.getAllByRole("button",{name:"Where の意味"})[0]);
  expect(screen.getByRole("dialog",{name:"単語の意味"})).toHaveTextContent("どこ");
  fireEvent.click(screen.getByRole("button",{name:"単語カードを閉じる"}));
  expect(screen.queryByRole("dialog",{name:"単語の意味"})).toBeNull();
});

test("correct and wrong choices show fullscreen overlays without changing score prematurely",()=>{
  const student={class:"3-2",number:"12",name:"Animation Student"};
  localStorage.setItem("storyMatchStudent",JSON.stringify(student));
  render(<App/>);
  fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
  fireEvent.click(screen.getByRole("button",{name:/内容把握 EN 0% 練習へ/}));
  fireEvent.click(screen.getByRole("button",{name:/選択肢 .*On license plates and phone numbers/}));
  expect(screen.getByText("CORRECT!")).toBeInTheDocument();
  expect(document.querySelector(".th-answer-overlay")).toHaveClass("is-correct");
});


test("incorrect answers show a full-screen feedback overlay and source evidence remains available",()=>{
 const student={class:"3-2",number:"13",name:"Incorrect Student"};
 localStorage.setItem("storyMatchStudent",JSON.stringify(student));
 render(<App/>);
 fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
 fireEvent.click(screen.getByRole("button",{name:/内容把握 EN 0% 練習へ/}));
 fireEvent.click(screen.getByRole("button",{name:/選択肢 .*Only on school uniforms/}));
 expect(screen.getByText("NOT QUITE")).toBeInTheDocument();
 expect(document.querySelector(".th-answer-overlay")).toHaveClass("is-incorrect");
 expect(screen.getByText(/正解：On license plates and phone numbers/)).toBeInTheDocument();
 expect(screen.getByText(/本文の根拠を確認/)).toBeInTheDocument();
});
test("quiz sound can be muted before answering and stays off after navigation",()=>{
 render(<App/>);
 fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
 fireEvent.click(screen.getByRole("button",{name:/Comprehension.*内容理解 EN/}));
 const toggle=screen.getByRole("button",{name:"クイズの効果音を切り替え"});
 expect(toggle).toHaveAttribute("aria-pressed","true");
 fireEvent.click(toggle);
 expect(toggle).toHaveAttribute("aria-pressed","false");
 expect(localStorage.getItem("treasureComprehensionSound")).toBe("off");
});


test("Vocabulary and Sentence Builder offer sound controls and remember the mute preference",()=>{
  boot();
  fireEvent.click(screen.getByRole("button",{name:/Vocabulary.*単語と4択クイズ/}));
  const vocab=screen.getByRole("button",{name:"単語クイズの効果音を切り替え"});
  expect(vocab).toHaveAttribute("aria-pressed","true");
  fireEvent.click(vocab);
  expect(vocab).toHaveAttribute("aria-pressed","false");
  expect(window.localStorage.getItem("treasurePracticeSound")).toBe("off");
  fireEvent.click(screen.getByRole("button",{name:/Grammar.*英文の並び替え/}));
  const grammar=screen.getByRole("button",{name:"英文並び替えの効果音を切り替え"});
  expect(grammar).toHaveAttribute("aria-pressed","false");
  fireEvent.click(grammar);
  expect(window.localStorage.getItem("treasurePracticeSound")).toBe("on");
});
