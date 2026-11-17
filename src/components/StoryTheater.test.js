import React from "react";
import {render,screen,fireEvent,act,cleanup} from "@testing-library/react";
import "@testing-library/jest-dom";
import StoryTheater from "./StoryTheater";

const mockPlay=jest.fn(),mockStop=jest.fn();
jest.mock("../utils/modelAudio",()=>({
  createModelAudioPlayer:()=>({play:mockPlay,stop:mockStop}),
  PLAYBACK_RATES:[.85,1]
}));
const data=[{en:"First scene.",ja:"最初。"},{en:"Second scene.",ja:"次。"}];
beforeEach(()=>{jest.useFakeTimers();mockPlay.mockClear();mockStop.mockClear();});
afterEach(()=>{cleanup();jest.useRealTimers();});
test("continuous playback changes images and captions in order and offers reading after the last scene",()=>{
 const onFinish=jest.fn();
 render(<StoryTheater unit={12} storyData={data} onFinish={onFinish} onBack={jest.fn()}/>);
 expect(screen.getByText("First scene.")).toBeInTheDocument();
 expect(screen.queryByRole("button",{name:/音読へ進む/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:/自動再生/}));
 expect(mockPlay.mock.calls[0][0]).toMatchObject({index:0,text:"First scene."});
 act(()=>{mockPlay.mock.calls[0][0].onEnd();jest.advanceTimersByTime(650);});
 expect(screen.getByText("Second scene.")).toBeInTheDocument();
 expect(screen.getByRole("img",{name:"Scene 2"})).toHaveAttribute("src",expect.stringContaining("/images/unit12/2.webp"));
 expect(mockPlay.mock.calls[1][0]).toMatchObject({index:1,text:"Second scene."});
 act(()=>mockPlay.mock.calls[1][0].onEnd());
 fireEvent.click(screen.getByRole("button",{name:/音読へ進む/}));
 expect(onFinish).toHaveBeenCalledTimes(1);
});
test("manual navigation cancels stale narration and translation remains optional",()=>{
 render(<StoryTheater unit={12} storyData={data} onFinish={jest.fn()} onBack={jest.fn()}/>);
 fireEvent.click(screen.getByRole("button",{name:/このシーン/}));
 const stale=mockPlay.mock.calls[0][0].onEnd;
 fireEvent.click(screen.getByRole("button",{name:"次のシーン"}));
 act(()=>{stale();jest.advanceTimersByTime(1000);});
 expect(mockPlay).toHaveBeenCalledTimes(1);
 expect(screen.getByText("Second scene.")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"和訳 OFF"}));
 expect(screen.getByText("次。")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"前のシーン"}));
 expect(screen.getByText("最初。")).toBeInTheDocument();
});
test("audio errors stop playback rather than silently skipping a scene",()=>{
 render(<StoryTheater unit={12} storyData={data} onFinish={jest.fn()} onBack={jest.fn()}/>);
 fireEvent.click(screen.getByRole("button",{name:/自動再生/}));
 act(()=>{mockPlay.mock.calls[0][0].onError();jest.advanceTimersByTime(60000);});
 expect(screen.getByRole("alert")).toHaveTextContent("再生できません");
 expect(screen.getByText("First scene.")).toBeInTheDocument();
 expect(mockPlay).toHaveBeenCalledTimes(1);
});
