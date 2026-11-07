import React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

beforeEach(() => {
  window.localStorage.clear();
  window.speechSynthesis = { cancel: jest.fn(), getVoices: () => [], speak: jest.fn() };
});
afterEach(cleanup);

test("single-page Treasure Hunt workspace opens scripts and original game modes", () => {
  render(<App />);
  expect(screen.getByRole("navigation", { name: "ユニットを選択" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Reading Script" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Unit 10" }));
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
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Vocabulary.*単語と4択クイズ/ }));
  expect(screen.getByRole("heading", { name: "Vocabulary Training" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Grammar.*英文の並び替え/ }));
  expect(screen.getByRole("heading", { name: "Sentence Builder" })).toBeInTheDocument();
});


test("a vocabulary word opens an anchored popup with English playback", () => {
  window.SpeechSynthesisUtterance=function(word){this.text=word;};
  render(<App />);
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
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
  render(<App />);
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
  const sentence=document.querySelector('[data-sentence-index="14"]');
  expect(sentence).toHaveTextContent("Clearly");
  fireEvent.pointerUp(sentence);
  const dialog=await screen.findByRole("dialog",{name:"選択した英文の訳"});
  expect(dialog).toHaveTextContent("一文の日本語訳");
  expect(dialog).toHaveTextContent("グループの人数が少ないほど");
});

test("full Japanese translation remains available within the Script panel", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
  fireEvent.click(screen.getByRole("button",{name:/全文訳を表示/}));
  expect(screen.getByRole("button",{name:"全文訳を隠す"})).toBeInTheDocument();
  expect(document.querySelector(".th-translation")).toBeInTheDocument();
});


test("reading font size controls are compact, bounded, and retained across units",()=>{
  render(<App />);
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
  const paragraph=document.querySelector(".th-interactive-text");
  expect(paragraph).toHaveStyle({fontSize:"22px"});
  fireEvent.click(screen.getByRole("button",{name:"文字を大きく"}));
  expect(paragraph).toHaveStyle({fontSize:"24px"});
  expect(screen.getByLabelText("現在の文字サイズ")).toHaveTextContent("24px");
  expect(window.localStorage.getItem("treasure-hunt-reading-font-size")).toBe("24");
  fireEvent.click(screen.getByRole("button",{name:"Unit 14"}));
  expect(document.querySelector(".th-interactive-text")).toHaveStyle({fontSize:"24px"});
  fireEvent.click(screen.getByRole("button",{name:"文字を小さく"}));
  expect(document.querySelector(".th-interactive-text")).toHaveStyle({fontSize:"22px"});
});

test("word popup is a centered modal and shows pronunciation",()=>{
  window.SpeechSynthesisUtterance=function(word){this.text=word;};
  render(<App />);
  fireEvent.click(screen.getByRole("button",{name:"Unit 15"}));
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
  render(<App />);
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
  render(<App/>);
  fireEvent.click(screen.getByRole("button",{name:"Unit 10"}));
  fireEvent.click(screen.getByRole("button",{name:/Reading Check.*音読判定/}));
  expect(document.querySelector(".th-stage-content")).toHaveClass("is-reading");
  expect(screen.getByRole("region",{name:"音読する英文（スクロール可能）"})).toHaveTextContent("A lucky number");
  expect(document.querySelector(".th-reading-dock")).toBeInTheDocument();
  expect(screen.getByRole("img",{name:"Accuracy —"})).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"🎙 音読スタート"})).toBeInTheDocument();
});
test("the same recording button starts and stops and updates the semicircle Accuracy result",()=>{
  window.SpeechRecognition=ReadingDockSpeechMock;
  render(<App/>);
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
  render(<App/>);
  fireEvent.click(screen.getByRole("button",{name:/Shadowing.*音声に続けて音読/}));
  expect(document.querySelector(".th-stage-content")).toHaveClass("is-reading");
  expect(screen.getByRole("region",{name:"音読する英文（スクロール可能）"})).toBeInTheDocument();
  expect(document.querySelector(".th-reading-dock")).toBeInTheDocument();
});
