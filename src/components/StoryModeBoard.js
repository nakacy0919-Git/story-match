import React, { useState, useRef, useEffect } from "react";
import { score, createFeedback } from "../utils/readingScore";
import ReadingCelebration from "./ReadingCelebration";
import { useReadingSpeech } from "../utils/useReadingSpeech";

function Scene({
  item,
  index,
  total,
  unit,
  best,
  onScore,
  threshold,
  onPrev,
  onNext,
  onSkip,
  onBack,
}) {
  const [result, setResult] = useState(null),
    [spoken, setSpoken] = useState("");
  const [audioError, setAudioError] = useState("");
  const [celebration, setCelebration] = useState(0);
  const celebrationTimer = useRef(null);
  const audio = useRef(null),
    feedback = useRef(null),
    utterance = useRef(null);
  const mic = useReadingSpeech(
    item.en,
    (percent, text) => {
      setResult(percent);
      setSpoken(text);
      onScore(index, percent);
      if (percent >= threshold) {
        if (!feedback.current) feedback.current = createFeedback(window);
        feedback.current.tone("80");
        clearTimeout(celebrationTimer.current);
        setCelebration(Date.now());
        celebrationTimer.current = setTimeout(() => setCelebration(0), 2400);
      }
    },
    score,
    `${unit}:${index}`,
    threshold,
  );
  const stopAudio = () => {
    if (audio.current) {
      audio.current.onerror = null;
      audio.current.pause();
      audio.current = null;
    }
    window.speechSynthesis?.cancel();
  };
  useEffect(
    () => () => {
      stopAudio();
      clearTimeout(celebrationTimer.current);
    },
    [],
  );
  useEffect(() => {
    setResult(null);
    setCelebration(0);
    clearTimeout(celebrationTimer.current);
    setSpoken("");
    setAudioError("");
    stopAudio();
  }, [unit, index]);
  const play = () => {
    stopAudio();
    setAudioError("");
    const fallback = () => {
      const synth = window.speechSynthesis;
      if (!synth || !window.SpeechSynthesisUtterance) {
        setAudioError(
          "音声を再生できません。端末の音量とブラウザ設定を確認してください。",
        );
        return;
      }
      const u = new window.SpeechSynthesisUtterance(item.en);
      u.lang = "en-US";
      u.rate = 0.85;
      const voices = synth.getVoices();
      u.voice = voices.find((v) => v.lang === "en-US") || null;
      u.onerror = () =>
        setAudioError("音声を再生できません。もう一度お手本を押してください。");
      utterance.current = u;
      synth.speak(u);
    };
    const a = new Audio(
      `${process.env.PUBLIC_URL}/audio/unit${unit}/${index + 1}.mp3`,
    );
    audio.current = a;
    let fellBack = false;
    const once = () => {
      if (fellBack || audio.current !== a) return;
      fellBack = true;
      fallback();
    };
    a.onerror = once;
    a.play().catch(once);
  };
  const tapFeedback = () => {
    if (!feedback.current) feedback.current = createFeedback(window);
    feedback.current.tone("tap");
  };
  const passed = best >= threshold || (result !== null && result >= threshold);
  return (
    <section className="reading-studio">
      {celebration > 0 && <ReadingCelebration id={celebration} />}
      <div className="reading-top">
        <span>
          Scene {index + 1} / {total}
        </span>
        <span className={"badge " + (passed ? "complete" : "")}>
          {passed ? "✓ CLEAR" : `Accuracy ${threshold}%以上で合格`}
        </span>
      </div>
      <div
        className={
          "reading-main " +
          (item.en.length + item.ja.length * 0.5 > 130 ? "dense" : "")
        }
      >
        <div className="reading-image">
          <img
            src={`${process.env.PUBLIC_URL}/images/unit${unit}/${index + 1}.webp`}
            alt={"Scene " + (index + 1)}
          />
        </div>
        <div className="reading-text">
          <button
            className="subtle"
            disabled={mic.phase !== "idle"}
            onClick={play}
          >
            🔊 お手本を聞く
          </button>
          <p className="reading-english">{item.en}</p>
          <p className="reading-japanese">{item.ja}</p>
        </div>
      </div>
      <div className="reading-evaluation">
        <div className={"accuracy " + (passed ? "pass" : "")}>
          <span>Accuracy</span>
          <strong>
            {result === null ? "—" : result}
            <small>%</small>
          </strong>
          <span>Best {best || 0}%</span>
        </div>
        <div className="transcript">
          <span>認識した英文</span>
          <p>
            {mic.transcript ||
              spoken ||
              "音読すると、ここに英文が表示されます。"}
          </p>
          <small role="status" data-mic-state={mic.phase}>
            {mic.status}
          </small>
        </div>
        <button
          className="subtle reconnect-mic"
          onClick={() => {
            stopAudio();
            tapFeedback();
            mic.reconnect();
          }}
          disabled={mic.phase === "scoring"}
        >
          マイクを再接続
        </button>
      </div>
      {audioError && <p role="alert">{audioError}</p>}
      <div className="reading-controls">
        <button
          className="subtle"
          disabled={index === 0 || mic.phase !== "idle"}
          onClick={() => {
            mic.cancel();
            onPrev();
          }}
        >
          ◀ 前へ
        </button>
        <button
          className="primary"
          disabled={mic.phase === "scoring"}
          onClick={() => {
            tapFeedback();
            if (mic.phase === "listening") mic.stop();
            else {
              stopAudio();
              setResult(null);
              mic.begin();
            }
          }}
        >
          {mic.phase === "listening"
            ? "■ 終了・判定"
            : mic.phase === "scoring"
              ? "判定中…"
              : "🎙 音読スタート"}
        </button>
        <button
          className="subtle reading-skip"
          disabled={mic.phase !== "idle" || passed}
          onClick={() => {
            mic.cancel();
            stopAudio();
            if (index === total - 1) onBack();
            else onSkip();
          }}
        >
          スキップ（未クリア）
        </button>
        <button
          className="primary next"
          disabled={!passed || mic.phase !== "idle"}
          onClick={() => {
            mic.cancel();
            if (index === total - 1) onBack();
            else onNext();
          }}
        >
          {index === total - 1 ? "✓ 学習進捗へ" : "次のシーンへ ▶"}
        </button>
      </div>
    </section>
  );
}
export default function StoryModeBoard({
  storyData,
  unit,
  scores,
  threshold = 80,
  onScore,
  onBack,
}) {
  const [index, setIndex] = useState(() => {
    const first = scores.findIndex((n) => n < threshold);
    return first < 0 ? 0 : first;
  });
  return (
    <Scene
      item={storyData[index]}
      index={index}
      total={storyData.length}
      unit={unit}
      threshold={threshold}
      best={scores[index]}
      onScore={onScore}
      onPrev={() => setIndex((i) => Math.max(0, i - 1))}
      onNext={() => {
        if (scores[index] >= threshold)
          setIndex((i) => Math.min(storyData.length - 1, i + 1));
      }}
      onSkip={() => setIndex((i) => Math.min(storyData.length - 1, i + 1))}
      onBack={onBack}
    />
  );
}
