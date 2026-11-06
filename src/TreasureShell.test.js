import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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
