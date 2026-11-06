import {
  createModelAudioPlayer,
  hasModelAudio,
  modelAudioUrl,
} from "./modelAudio";

function fixture() {
  const recordings = [];
  const spoken = [];
  const synthesis = {
    cancel: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn(() => [{ name: "English", lang: "en-US" }]),
    speak: jest.fn((u) => spoken.push(u)),
  };
  const AudioMock = jest.fn().mockImplementation((url) => {
    const a = {
      src: url,
      play: jest.fn(() => Promise.resolve()),
      pause: jest.fn(),
      playbackRate: 1,
    };
    recordings.push(a);
    return a;
  });
  const Utterance = jest.fn().mockImplementation((text) => ({ text }));
  const win = {
    Audio: AudioMock,
    speechSynthesis: synthesis,
    SpeechSynthesisUtterance: Utterance,
  };
  return { win, recordings, spoken, AudioMock, synthesis };
}

test("only checked-in model recordings are advertised", () => {
  expect(hasModelAudio(7, 0)).toBe(true);
  expect(hasModelAudio(8, 11)).toBe(true);
  expect(hasModelAudio(2, 0)).toBe(false);
  expect(hasModelAudio(7, 12)).toBe(false);
  expect(modelAudioUrl(7, 0)).toContain("/audio/unit7/1.wav");
});

test("reading units without MP3 use speech synthesis immediately at the chosen speed", () => {
  const mock = fixture();
  const onEnd = jest.fn();
  const onError = jest.fn();
  const player = createModelAudioPlayer(mock.win);
  player.play({ unit: 2, index: 0, text: "Hello world", rate: 0.75, onEnd, onError });
  expect(mock.AudioMock).not.toHaveBeenCalled();
  expect(mock.synthesis.speak).toHaveBeenCalledTimes(1);
  expect(mock.spoken[0]).toMatchObject({ text: "Hello world", rate: 0.75, lang: "en-US" });
  mock.spoken[0].onend();
  expect(onEnd).toHaveBeenCalledTimes(1);
  expect(onError).not.toHaveBeenCalled();
});

test("recorded Model MP3 takes priority and supports speed changes", () => {
  const mock = fixture();
  const onSource = jest.fn();
  const onEnd = jest.fn();
  const player = createModelAudioPlayer(mock.win);
  player.play({ unit: 7, index: 1, text: "The light is green.", rate: 0.85, onEnd, onSource });
  const a = mock.recordings[0];
  expect(a.src).toContain("/audio/unit7/2.mp3");
  expect(a.playbackRate).toBe(0.85);
  expect(mock.synthesis.speak).not.toHaveBeenCalled();
  a.onplaying();
  expect(onSource).toHaveBeenCalledWith("model");
  player.setRate(1.25);
  expect(a.playbackRate).toBe(1.25);
  a.onended();
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test("missing or broken MP3 falls back, and replay uses TTS directly", () => {
  const mock = fixture();
  const player = createModelAudioPlayer(mock.win);
  const onEnd = jest.fn();
  player.play({ unit: 8, index: 0, text: "The bell rang.", rate: 1, onEnd });
  mock.recordings[0].onerror();
  expect(mock.synthesis.speak).toHaveBeenCalledTimes(1);
  mock.spoken[0].onend();
  expect(onEnd).toHaveBeenCalledTimes(1);
  player.play({ unit: 8, index: 0, text: "The bell rang.", rate: 0.75 });
  expect(mock.AudioMock).toHaveBeenCalledTimes(1);
  expect(mock.spoken[1].rate).toBe(0.75);
});

test("stop invalidates callbacks when scene or question changes", () => {
  const mock = fixture();
  const player = createModelAudioPlayer(mock.win);
  const onEnd = jest.fn();
  player.play({ unit: 2, index: 0, text: "Old scene", onEnd });
  const old = mock.spoken[0];
  player.stop();
  old.onend?.();
  expect(onEnd).not.toHaveBeenCalled();
  expect(mock.synthesis.cancel).toHaveBeenCalled();
});

test("speaking errors are visible and do not silently count as finished", () => {
  const mock = fixture();
  const player = createModelAudioPlayer(mock.win);
  const onError = jest.fn();
  const onEnd = jest.fn();
  player.play({ unit: 2, index: 0, text: "A story", onError, onEnd });
  mock.spoken[0].onerror({ error: "synthesis-failed" });
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onEnd).not.toHaveBeenCalled();
});
