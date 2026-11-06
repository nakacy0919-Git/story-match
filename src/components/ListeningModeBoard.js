import React, { useState, useEffect, useRef, useCallback } from "react";
import { makeQuestions, makeChoices, deferQuestion } from "../utils/game";
import { playSound } from "../utils/sound";
import { createModelAudioPlayer, PLAYBACK_RATES } from "../utils/modelAudio";

const ListeningModeBoard = ({
  storyData,
  unit,
  retryCount,
  onRetry,
  qCount,
  onGameClear,
  studentInfo,
  minPoints = 0,
}) => {
  const [isStarted, setIsStarted] = useState(false);
  const [questions, setQuestions] = useState([]); // 🌟 出題予定のキュー
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0); // 🌟 何問目か
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(0.85);
  const [audioReady, setAudioReady] = useState(false);
  const audioPlayerRef = useRef(null);
  if (!audioPlayerRef.current) audioPlayerRef.current = createModelAudioPlayer();

  const timersRef = useRef([]);
  const lastSpokenIndexRef = useRef(null);
  const [audioError, setAudioError] = useState(false);

  const cancelTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const stopSpeech = useCallback(() => {
    audioPlayerRef.current.stop();
  }, []);

  const generateChoices = useCallback(
    (correctId) => {
      if (correctId === undefined) return;
      setChoices(makeChoices(storyData?.length || 0, correctId));
      setQuestionStartTime(null);
      setAudioReady(false);
      setFeedback(null);
    },
    [storyData],
  );

  useEffect(() => {
    cancelTimers();
    stopSpeech();
    lastSpokenIndexRef.current = null;
    if (!Array.isArray(storyData) || storyData.length === 0) return;
    const nextQuestions = makeQuestions(storyData.length, qCount);
    setQuestions(nextQuestions);
    setCurrentQueueIndex(0);
    setScore(0);
    setIsCleared(false);
    setIsStarted(false);
    setAudioError(false);
    generateChoices(nextQuestions[0]);
    return () => {
      cancelTimers();
      stopSpeech();
    };
  }, [
    unit,
    retryCount,
    storyData,
    qCount,
    cancelTimers,
    stopSpeech,
    generateChoices,
  ]);

  const speakText = useCallback(
    (questionId) => {
      const item = storyData?.[questionId];
      if (!item) return;
      setAudioError(false);
      audioPlayerRef.current.play({
        unit,
        index: questionId,
        text: item.en,
        rate: playbackRate,
        onEnd: () => {
          setAudioReady(true);
          // Listening to the model must not count against the speed score.
          // Replaying the same question does not reset the running clock.
          setQuestionStartTime((before) => before ?? Date.now());
        },
        onError: () => {
          setAudioError(true);
          setAudioReady(false);
        },
      });
    },
    [storyData, unit, playbackRate],
  );

  useEffect(() => {
    if (
      isStarted &&
      !isCleared &&
      questions[currentQueueIndex] !== undefined &&
      lastSpokenIndexRef.current !== currentQueueIndex
    ) {
      lastSpokenIndexRef.current = currentQueueIndex;
      speakText(questions[currentQueueIndex]);
    }
  }, [currentQueueIndex, isStarted, isCleared, questions, speakText]);

  const handleStartGame = () => {
    if (questions.length === 0) return;
    setIsStarted(true);
    setQuestionStartTime(null);
    setAudioReady(false);
    lastSpokenIndexRef.current = 0;
    speakText(questions[0]);
  };

  const handleSkip = () => {
    if (feedback || isCleared || !isStarted) return;
    stopSpeech();
    // Requeue the skipped last question so the next index is always valid.
    const nextQuestions = deferQuestion(questions, currentQueueIndex);
    const nextIndex = currentQueueIndex + 1;
    setQuestions(nextQuestions);
    setCurrentQueueIndex(nextIndex);
    lastSpokenIndexRef.current = null;
    generateChoices(nextQuestions[nextIndex]);
  };

  const handleChoiceClick = (id) => {
    if (feedback || isCleared || !isStarted || !audioReady || questionStartTime === null) return;
    stopSpeech();

    if (id === questions[currentQueueIndex]) {
      playSound("correct");
      setFeedback({ status: "correct", id });
      const elapsed = Math.max(0, (Date.now() - questionStartTime) / 1000);
      const points = Math.max(10, Math.floor(100 - elapsed * 15));
      setScore((previous) => previous + points);
      timersRef.current.push(
        setTimeout(() => {
          const nextIndex = currentQueueIndex + 1;
          if (nextIndex < questions.length) {
            lastSpokenIndexRef.current = null;
            setCurrentQueueIndex(nextIndex);
            generateChoices(questions[nextIndex]);
          } else {
            setIsCleared(true);
            playSound("fanfare");
            onGameClear(score + points);
          }
        }, 800),
      );
    } else {
      playSound("wrong");
      setFeedback({ status: "wrong", id });
      setScore((previous) => Math.max(0, previous - 20));
      timersRef.current.push(setTimeout(() => setFeedback(null), 500));
    }
  };

  if (!storyData || questions.length === 0) return null;

  if (!isStarted) {
    return (
      <div
        className="listening-intro"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "50px",
            borderRadius: "30px",
            boxShadow: "0 15px 40px rgba(156, 39, 176, 0.2)",
            border: "5px solid #9C27B0",
            maxWidth: "600px",
          }}
        >
          <div style={{ fontSize: "5rem", marginBottom: "20px" }}>🎧</div>
          <h2
            style={{ fontSize: "2rem", color: "#9C27B0", marginBottom: "20px" }}
          >
            Quick Listen Mode
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              color: "#666",
              lineHeight: "1.6",
              marginBottom: "30px",
              textAlign: "left",
            }}
          >
            流れる音声を聞いて、正しい画像を瞬時に選ぼう！
            <br />
            <br />
            ✅ 早く答えるほど高得点。
            <br />
            ✅ お手付き（ミス）は減点。
            <br />✅{" "}
            <b>
              音声は登録済みのお手本を優先。ない場合は自動読み上げを使います。音声が聞こえなければ「もう一度聞く」を押してね。
            </b>
            （聞こえない場合はスキップしても減点されません）
          </p>
          <button onClick={handleStartGame} className="start-go-btn">
            START!
          </button>
        </div>
        <style>{`
          .start-go-btn {
            background-color: #9C27B0; color: white; border: none; border-radius: 50px;
            padding: 20px 60px; font-size: 2rem; font-weight: bold; cursor: pointer;
            box-shadow: 0 8px 15px rgba(156, 39, 176, 0.3); transition: all 0.2s;
          }
          .start-go-btn:hover { transform: scale(1.1); background-color: #ba68c8; }
        `}</style>
      </div>
    );
  }

  if (isCleared) {
    return (
      <div
        className="quiz-result"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "10px 20px 30px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            backgroundColor: "#fff",
            borderRadius: "15px",
            padding: "40px",
            border: "4px solid #9C27B0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              marginBottom: "20px",
              padding: "10px 30px",
              backgroundColor: "#333",
              color: "#fff",
              borderRadius: "15px",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            {studentInfo.class} - {studentInfo.number}番 - {studentInfo.name}
          </div>
          <h2
            style={{ color: "#9C27B0", fontSize: "2.5rem", margin: "0 0 20px" }}
          >
            {score >= minPoints
              ? "🎧 QUICK LISTEN CLEAR! 🎧"
              : "もう一度挑戦！"}
          </h2>
          <div
            style={{ fontSize: "5rem", color: "#4caf50", fontWeight: "900" }}
          >
            {score} pts
          </div>
          <p>合格基準：{minPoints}点以上（全問コース）</p>
          <button
            onClick={onRetry}
            style={{
              marginTop: "30px",
              padding: "15px 40px",
              fontSize: "1.5rem",
              backgroundColor: "#9C27B0",
              color: "#fff",
              border: "none",
              borderRadius: "40px",
              cursor: "pointer",
            }}
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="quiz-board"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "10px 20px 30px",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        className="quiz-meta"
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "900px",
          marginBottom: "10px",
        }}
      >
        {/* スキップ分も含むため currentIndex ではなく QueueIndex を利用 */}
        <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          Progress: {currentQueueIndex + 1} / {questions.length}
        </div>
        <div
          style={{ fontSize: "1.8rem", fontWeight: "900", color: "#9C27B0" }}
        >
          SCORE: {score}
        </div>
      </div>

      <div
        className="quiz-prompt"
        style={{
          width: "100%",
          maxWidth: "900px",
          flex: 1,
          backgroundColor: "#f3e5f5",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          borderRadius: "20px",
          border: "3px solid #ce93d8",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <p
          style={{
            color: "#8e24aa",
            fontWeight: "bold",
            margin: "0 0 10px",
            fontSize: "1.5rem",
          }}
        >
          ⚡ 早押しリスニング ⚡
        </p>
        {audioError && (
          <p
            role="alert"
            style={{
              color: "#b71c1c",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            自動再生ができませんでした。「もう一度聞く」を押すか、スキップして再挑戦してください。
          </p>
        )}
        <p className="listening-ready-hint" role="status">
          {audioReady ? "音声を聞き終えました。画像を選んでください。" : "お手本を再生してください。聞き終わると回答できます。"}
        </p>
        <div className="sound-wave">
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
        </div>

        <div
          className="listening-audio-actions"
          style={{
            display: "flex",
            gap: "15px",
            position: "absolute",
            bottom: "15px",
            right: "20px",
          }}
        >
          <label className="audio-speed-control">
            再生速度
            <select
              aria-label="リスニングの再生速度"
              value={playbackRate}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPlaybackRate(next);
                audioPlayerRef.current.setRate(next);
              }}
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate}>{rate.toFixed(2).replace(/0$/, "")}×</option>
              ))}
            </select>
          </label>
          <button onClick={handleSkip} className="skip-btn">
            ⚠️ 音声が聞こえない
          </button>
          <button
            onClick={() => speakText(questions[currentQueueIndex])}
            className="repeat-btn"
          >
            🔁 もう一度聞く
          </button>
        </div>
      </div>

      <div
        className="quiz-choices"
        style={{
          display: "flex",
          gap: "30px",
          width: "100%",
          maxWidth: "1000px",
          justifyContent: "center",
          flex: 1.2,
          marginTop: "20px",
        }}
      >
        {choices.map((id) => {
          const isCorrect =
            feedback?.status === "correct" && feedback.id === id;
          const isWrong = feedback?.status === "wrong" && feedback.id === id;
          return (
            <button
              className="quiz-choice"
              type="button"
              aria-label={"選択画像 " + (id + 1)}
              key={id}
              onClick={() => handleChoiceClick(id)}
              disabled={!audioReady || questionStartTime === null}
              style={{
                flex: 1,
                cursor: audioReady ? "pointer" : "not-allowed",
                opacity: audioReady ? 1 : 0.72,
                borderRadius: "15px",
                overflow: "hidden",
                border: isCorrect
                  ? "6px solid #4caf50"
                  : isWrong
                    ? "6px solid #f44336"
                    : "6px solid transparent",
                position: "relative",
                aspectRatio: "4/3",
                backgroundColor: "#fff",
                boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
                transition: "transform 0.1s",
              }}
            >
              <img
                src={`${process.env.PUBLIC_URL}/images/unit${unit}/${id + 1}.webp`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                  backgroundColor: "#fff",
                }}
                alt="choice"
              />
              {isCorrect && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(76, 175, 80, 0.3)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "5rem" }}>⭕</span>
                </div>
              )}
              {isWrong && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(244, 67, 54, 0.3)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "5rem" }}>❌</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        .sound-wave { display: flex; gap: 6px; align-items: center; justify-content: center; height: 60px; margin-top: 10px; }
        .wave-bar { width: 8px; background-color: #9C27B0; border-radius: 4px; animation: wave 1s ease-in-out infinite; }
        .wave-bar:nth-child(1) { animation-delay: 0.0s; } .wave-bar:nth-child(2) { animation-delay: 0.1s; } .wave-bar:nth-child(3) { animation-delay: 0.2s; } .wave-bar:nth-child(4) { animation-delay: 0.3s; } .wave-bar:nth-child(5) { animation-delay: 0.4s; }
        @keyframes wave { 0%, 100% { height: 15px; } 50% { height: 50px; background-color: #ba68c8; } }
        .repeat-btn, .skip-btn { background-color: #fff; border: 2px solid #ce93d8; border-radius: 20px; padding: 8px 15px; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.2s; }
        .repeat-btn { color: #9C27B0; }
        .skip-btn { color: #f44336; border-color: #ffcdd2; }
        .repeat-btn:hover, .skip-btn:hover { background-color: #f3e5f5; transform: scale(1.05); }
      `}</style>
    </div>
  );
};

export default ListeningModeBoard;
