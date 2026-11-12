import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import OpeningSequence from "./OpeningSequence";

beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
  delete window.matchMedia;
});

test("shows the exact Power Slide brand then the Treasure Hunt opening", () => {
  const done = jest.fn();
  render(<OpeningSequence onFinish={done} />);
  expect(screen.getByRole("img", { name: "POWER SLIDE" })).toHaveAttribute(
    "src", "/power-slide-emblem.avif",
  );
  expect(screen.getByRole("dialog", { name: "POWER SLIDE オープニング" })).toBeInTheDocument();
  expect(screen.getByText("TREASURE")).toBeInTheDocument();
  expect(screen.getByText("HUNT")).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(5599));
  expect(done).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(done).toHaveBeenCalledTimes(1);
});

test("skip and Escape exit at most once without waiting for the animation", () => {
  const done = jest.fn();
  render(<OpeningSequence onFinish={done} />);
  fireEvent.click(screen.getByRole("button", { name: /スキップ/ }));
  fireEvent.keyDown(window, { key: "Escape" });
  act(() => jest.advanceTimersByTime(6000));
  expect(done).toHaveBeenCalledTimes(1);
});

test("respects reduced-motion accessibility settings", () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  const done = jest.fn();
  render(<OpeningSequence onFinish={done} />);
  act(() => jest.advanceTimersByTime(199));
  expect(done).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(done).toHaveBeenCalledTimes(1);
});
