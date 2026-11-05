import React, { useEffect, useRef, useState } from 'react';


// ============================================================
// 音読判定：比較しやすい英文へ変換
// ============================================================

const normalizeText = (text) => {
  if (!text) return '';

  let result = text
    .toLowerCase()
    .replace(/[’‘]/g, "'");

  // 短縮形の差による誤判定を減らす
  const contractions = [
    ["can't", "cannot"],
    ["couldn't", "could not"],
    ["didn't", "did not"],
    ["doesn't", "does not"],
    ["don't", "do not"],
    ["isn't", "is not"],
    ["aren't", "are not"],
    ["wasn't", "was not"],
    ["weren't", "were not"],
    ["won't", "will not"],
    ["wouldn't", "would not"],
    ["shouldn't", "should not"],
    ["you've", "you have"],
    ["you're", "you are"],
    ["they're", "they are"],
    ["we're", "we are"],
    ["it's", "it is"],
    ["that's", "that is"],
    ["there's", "there is"],
    ["i'm", "i am"],
    ["i've", "i have"]
  ];

  contractions.forEach(([from, to]) => {
    result = result.split(from).join(to);
  });

  return result
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};


// ============================================================
// Accuracy Rate
// 単語単位のLevenshtein Distance
// ============================================================

const calculateAccuracy = (targetText, spokenText) => {
  const target = normalizeText(targetText)
    .split(' ')
    .filter(Boolean);

  const spoken = normalizeText(spokenText)
    .split(' ')
    .filter(Boolean);

  if (target.length === 0) return 0;
  if (spoken.length === 0) return 0;

  const rows = target.length + 1;
  const cols = spoken.length + 1;

  const dp = Array.from(
    { length: rows },
    () => Array(cols).fill(0)
  );

  for (let i = 0; i < rows; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j < cols; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost =
        target[i - 1] === spoken[j - 1]
          ? 0
          : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  const distance =
    dp[target.length][spoken.length];

  const maxLength = Math.max(
    target.length,
    spoken.length
  );

  const score =
    (1 - distance / maxLength) * 100;

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
};


// ============================================================
// 80%以上：低く柔らかい成功音
// 高音の「ピコーン」は使わない
// ============================================================

const playSuccessSound = () => {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return;

    const ctx = new AudioContext();

    const masterGain =
      ctx.createGain();

    masterGain.connect(
      ctx.destination
    );

    masterGain.gain.setValueAtTime(
      0.0001,
      ctx.currentTime
    );

    masterGain.gain.exponentialRampToValueAtTime(
      0.10,
      ctx.currentTime + 0.08
    );

    masterGain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 1.6
    );

    // 柔らかく低めの音域
    const notes = [
      174.61,
      220.00,
      261.63,
      293.66
    ];

    notes.forEach(
      (frequency, index) => {
        const oscillator =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        oscillator.type = 'sine';

        oscillator.frequency.value =
          frequency;

        const start =
          ctx.currentTime +
          index * 0.16;

        gain.gain.setValueAtTime(
          0.0001,
          start
        );

        gain.gain.exponentialRampToValueAtTime(
          0.08,
          start + 0.08
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + 0.65
        );

        oscillator.connect(gain);

        gain.connect(masterGain);

        oscillator.start(start);

        oscillator.stop(
          start + 0.7
        );
      }
    );

    setTimeout(() => {
      try {
        ctx.close();
      } catch (error) {
        // ignore
      }
    }, 1900);

  } catch (error) {
    console.warn(
      'Success sound error:',
      error
    );
  }
};


// ============================================================
// StoryModeBoard
// ============================================================

const StoryModeBoard = ({
  storyData,
  unit,
  onSceneChange
}) => {

  // ==========================================================
  // Scene
  // ==========================================================

  const [
    currentIndex,
    setCurrentIndex
  ] = useState(0);


  // ==========================================================
  // MP3
  // ==========================================================

  const audioRef = useRef(null);


  // ==========================================================
  // 音読練習
  // ==========================================================

  const [
    readingOpen,
    setReadingOpen
  ] = useState(false);

  const [
    isRecording,
    setIsRecording
  ] = useState(false);

  const [
    transcript,
    setTranscript
  ] = useState('');

  const [
    accuracy,
    setAccuracy
  ] = useState(null);


  const recognitionRef =
    useRef(null);

  const finalTranscriptRef =
    useRef('');

  const liveTranscriptRef =
    useRef('');

  const recordingActiveRef =
    useRef(false);

  const finishRequestedRef =
    useRef(false);


  // ==========================================================
  // 音声停止
  // ==========================================================

  const stopAudio = () => {

    if (audioRef.current) {

      audioRef.current.pause();

      audioRef.current.currentTime = 0;

      audioRef.current = null;
    }


    if (
      'speechSynthesis' in window
    ) {

      window.speechSynthesis.cancel();
    }
  };


  // ==========================================================
  // 音読認識停止
  // ==========================================================

  const stopRecognition = () => {

    recordingActiveRef.current =
      false;

    if (
      recognitionRef.current
    ) {

      try {

        recognitionRef.current.abort();

      } catch (error) {
        // ignore
      }

      recognitionRef.current =
        null;
    }

    setIsRecording(false);
  };


  // ==========================================================
  // Scene番号をApp.jsへ通知
  // ==========================================================

  useEffect(() => {

    if (onSceneChange) {

      onSceneChange(
        currentIndex
      );
    }

  }, [
    currentIndex,
    onSceneChange
  ]);


  // ==========================================================
  // Scene / Unit変更時
  // ==========================================================

  useEffect(() => {

    stopAudio();

    stopRecognition();

    setReadingOpen(false);

    setTranscript('');

    setAccuracy(null);

    finalTranscriptRef.current =
      '';

    liveTranscriptRef.current =
      '';

    finishRequestedRef.current =
      false;

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [
    currentIndex,
    unit
  ]);


  // ==========================================================
  // Componentを離れたとき
  // ==========================================================

  useEffect(() => {

    return () => {

      stopAudio();

      stopRecognition();

    };

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);


  // ==========================================================
  // MP3を再生
  //
  // public/audio/unit7/1.mp3
  // public/audio/unit7/2.mp3
  // ...
  // ==========================================================

  const playAudio = () => {

    stopAudio();


    const audioUrl =
      `${process.env.PUBLIC_URL}/audio/unit${unit}/${currentIndex + 1}.mp3`;


    const audio =
      new Audio(audioUrl);


    audioRef.current =
      audio;


    audio.onerror = () => {

      console.warn(
        'Audio file not found:',
        audioUrl
      );
    };


    audio.play().catch(
      (error) => {

        console.warn(
          'Audio playback failed:',
          error
        );
      }
    );
  };


  // ==========================================================
  // 前へ
  // ==========================================================

  const handlePrev = () => {

    if (
      currentIndex > 0
    ) {

      setCurrentIndex(
        prev => prev - 1
      );
    }
  };


  // ==========================================================
  // 次へ
  // ==========================================================

  const handleNext = () => {

    if (
      currentIndex <
      storyData.length - 1
    ) {

      setCurrentIndex(
        prev => prev + 1
      );
    }
  };


  // ==========================================================
  // 音読練習を開く
  // ==========================================================

  const openReadingPractice = () => {

    stopAudio();

    stopRecognition();


    setTranscript('');

    setAccuracy(null);


    finalTranscriptRef.current =
      '';

    liveTranscriptRef.current =
      '';

    finishRequestedRef.current =
      false;


    setReadingOpen(true);
  };


  // ==========================================================
  // 音読練習を閉じる
  // ==========================================================

  const closeReadingPractice = () => {

    finishRequestedRef.current =
      false;

    stopRecognition();

    setReadingOpen(false);
  };


  // ==========================================================
  // Accuracy確定
  // ==========================================================

  const finalizeAccuracy = () => {

    if (
      !finishRequestedRef.current
    ) {
      return;
    }


    finishRequestedRef.current =
      false;


    const spoken =
      liveTranscriptRef.current
        .replace(/\s+/g, ' ')
        .trim();


    setTranscript(spoken);


    const score =
      calculateAccuracy(
        storyData[currentIndex].en,
        spoken
      );


    setAccuracy(score);


    if (
      score >= 80
    ) {

      playSuccessSound();
    }
  };


  // ==========================================================
  // 音読スタート
  // ==========================================================

  const startReading = () => {

    stopAudio();

    stopRecognition();


    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      alert(
        'このブラウザでは音声認識機能を利用できません。\n\nGoogle Chrome または Microsoft Edge を使用してください。'
      );

      return;
    }


    setTranscript('');

    setAccuracy(null);


    finalTranscriptRef.current =
      '';

    liveTranscriptRef.current =
      '';

    finishRequestedRef.current =
      false;

    recordingActiveRef.current =
      true;


    setIsRecording(true);


    const recognition =
      new SpeechRecognition();


    recognitionRef.current =
      recognition;


    recognition.lang =
      'en-US';


    // ======================================================
    // 少し止まっても認識を継続
    // ======================================================

    recognition.continuous =
      true;


    // ======================================================
    // 読んでいる途中も文字起こし
    // ======================================================

    recognition.interimResults =
      true;


    recognition.maxAlternatives =
      1;


    // ======================================================
    // 結果
    // ======================================================

    recognition.onresult =
      (event) => {

        let interim =
          '';


        for (
          let i =
            event.resultIndex;

          i <
          event.results.length;

          i++
        ) {

          const result =
            event.results[i];

          const text =
            result[0].transcript;


          if (
            result.isFinal
          ) {

            finalTranscriptRef.current +=
              ' ' + text;

          } else {

            interim +=
              ' ' + text;
          }
        }


        const combined =
          (
            finalTranscriptRef.current +
            ' ' +
            interim
          )
            .replace(/\s+/g, ' ')
            .trim();


        liveTranscriptRef.current =
          combined;


        setTranscript(
          combined
        );
      };


    // ======================================================
    // エラー
    // ======================================================

    recognition.onerror =
      (event) => {

        // 無音・手動停止は問題なし
        if (
          event.error ===
            'no-speech' ||
          event.error ===
            'aborted'
        ) {

          return;
        }


        console.warn(
          'Speech Recognition:',
          event.error
        );


        if (
          event.error ===
          'not-allowed'
        ) {

          recordingActiveRef.current =
            false;

          setIsRecording(false);


          alert(
            'マイクの使用が許可されていません。\nブラウザのマイク権限を確認してください。'
          );
        }
      };


    // ======================================================
    // 認識が勝手に止まった場合
    // ======================================================

    recognition.onend =
      () => {

        // 生徒がまだ音読中
        if (
          recordingActiveRef.current
        ) {

          setTimeout(
            () => {

              if (
                !recordingActiveRef.current
              ) {
                return;
              }

              try {

                recognition.start();

              } catch (error) {

                // すでに開始されている場合は無視
              }

            },
            250
          );

        } else {

          finalizeAccuracy();
        }
      };


    // ======================================================
    // Start
    // ======================================================

    try {

      recognition.start();

    } catch (error) {

      console.error(
        'Recognition start error:',
        error
      );

      recordingActiveRef.current =
        false;

      setIsRecording(false);
    }
  };


  // ==========================================================
  // 音読終了
  // ==========================================================

  const stopReading = () => {

    if (!isRecording) {
      return;
    }


    recordingActiveRef.current =
      false;


    finishRequestedRef.current =
      true;


    setIsRecording(false);


    if (
      recognitionRef.current
    ) {

      try {

        recognitionRef.current.stop();

      } catch (error) {

        finalizeAccuracy();
      }
    }


    // onendが呼ばれない場合の保険
    setTimeout(
      () => {

        finalizeAccuracy();

      },
      700
    );
  };


  // ==========================================================
  // Data
  // ==========================================================

  if (
    !storyData ||
    storyData.length === 0
  ) {

    return null;
  }


  const currentItem =
    storyData[currentIndex];


  const imageUrl =
    `${process.env.PUBLIC_URL}/images/unit${unit}/${currentIndex + 1}.webp`;


  // ==========================================================
  // 英文量に応じた自動レイアウト
  // ==========================================================

  const englishLength =
    currentItem.en.length;


  const japaneseLength =
    currentItem.ja
      ? currentItem.ja.length
      : 0;


  // 英文を重めに評価
  const contentAmount =
    englishLength +
    japaneseLength * 0.35;


  let imageWidth =
    55;


  let englishFontSize =
    '2.30rem';


  let japaneseFontSize =
    '1.30rem';


  let textPadding =
    '30px 36px';


  if (
    contentAmount > 300
  ) {

    imageWidth = 41;

    englishFontSize =
      '1.38rem';

    japaneseFontSize =
      '1.00rem';

    textPadding =
      '18px 26px';

  } else if (
    contentAmount > 240
  ) {

    imageWidth = 44;

    englishFontSize =
      '1.52rem';

    japaneseFontSize =
      '1.05rem';

    textPadding =
      '20px 28px';

  } else if (
    contentAmount > 190
  ) {

    imageWidth = 47;

    englishFontSize =
      '1.68rem';

    japaneseFontSize =
      '1.10rem';

    textPadding =
      '22px 30px';

  } else if (
    contentAmount > 145
  ) {

    imageWidth = 50;

    englishFontSize =
      '1.85rem';

    japaneseFontSize =
      '1.16rem';

    textPadding =
      '24px 32px';

  } else if (
    contentAmount > 100
  ) {

    imageWidth = 52;

    englishFontSize =
      '2.05rem';

    japaneseFontSize =
      '1.22rem';
  }


  // ==========================================================
  // Accuracy color
  // ==========================================================

  const getScoreColor = () => {

    if (
      accuracy >= 90
    ) {
      return '#2ecc71';
    }

    if (
      accuracy >= 80
    ) {
      return '#18b6a4';
    }

    if (
      accuracy >= 60
    ) {
      return '#f2b134';
    }

    return '#ef5350';
  };


  // ==========================================================
  // Render
  // ==========================================================

  return (

    <div
      className="story-mode-wrapper"
    >


      {/* ====================================================
          MAIN CARD
      ==================================================== */}

      <div
        className="story-card"
      >


        {/* ==================================================
            LEFT : IMAGE
        ================================================== */}

        <div
          className="story-image-area"
          style={{
            width:
              `${imageWidth}%`
          }}
        >

          <img
            src={imageUrl}
            alt={
              `Scene ${currentIndex + 1}`
            }
            className="story-image"
          />

        </div>


        {/* ==================================================
            RIGHT : TEXT
        ================================================== */}

        <div
          className="story-text-area"
          style={{
            width:
              `${100 - imageWidth}%`,

            padding:
              textPadding
          }}
        >


          {/* ACTION BUTTONS */}

          <div
            className="story-actions"
          >

            <button
              onClick={
                playAudio
              }
              className="audio-btn"
              title="音声を聞く"
            >
              🔊 音声
            </button>


            <button
              onClick={
                openReadingPractice
              }
              className="reading-practice-btn"
              title="音読練習"
            >
              🎙 音読練習
            </button>

          </div>


          {/* ENGLISH */}

          <div
            className="english-text"
            style={{
              fontSize:
                englishFontSize
            }}
          >

            {currentItem.en}

          </div>


          {/* JAPANESE */}

          <div
            className="japanese-text"
            style={{
              fontSize:
                japaneseFontSize
            }}
          >

            {currentItem.ja}

          </div>

        </div>

      </div>


      {/* ====================================================
          NAVIGATION
      ==================================================== */}

      <div
        className="story-navigation"
      >

        <button
          onClick={
            handlePrev
          }
          disabled={
            currentIndex === 0
          }
          className={
            `nav-btn prev-btn ${
              currentIndex === 0
                ? 'disabled-btn'
                : ''
            }`
          }
        >

          ◀ 前へ

        </button>


        <button
          onClick={
            handleNext
          }
          disabled={
            currentIndex ===
            storyData.length - 1
          }
          className={
            `nav-btn next-btn ${
              currentIndex ===
              storyData.length - 1
                ? 'disabled-btn'
                : 'next-btn-anim'
            }`
          }
        >

          {
            currentIndex ===
            storyData.length - 1

              ? '最後です'

              : '次へ ▶'
          }

        </button>

      </div>


      {/* ====================================================
          音読練習 MODAL
      ==================================================== */}

      {
        readingOpen && (

          <div
            className="practice-overlay"
          >

            <div
              className="practice-modal"
            >


              {/* CLOSE */}

              <button
                className="practice-close"
                onClick={
                  closeReadingPractice
                }
              >
                ×
              </button>


              {/* TITLE */}

              <div
                className="practice-title"
              >
                🎙 音読練習
              </div>


              {/* SCRIPT */}

              <div
                className="practice-script"
              >

                {currentItem.en}

              </div>


              {/* CONTROLS */}

              <div
                className="practice-controls"
              >

                {
                  !isRecording &&
                  accuracy === null && (

                    <button
                      className="start-reading-btn"
                      onClick={
                        startReading
                      }
                    >
                      🎙 音読スタート
                    </button>

                  )
                }


                {
                  isRecording && (

                    <button
                      className="stop-reading-btn"
                      onClick={
                        stopReading
                      }
                    >
                      ■ 音読終了
                    </button>

                  )
                }

              </div>


              {/* RECORDING */}

              {
                isRecording && (

                  <div
                    className="recording-indicator"
                  >

                    <span
                      className="recording-dot"
                    />

                    Listening...

                  </div>

                )
              }


              {/* TRANSCRIPT */}

              <div
                className="transcript-box"
              >

                <div
                  className="transcript-title"
                >
                  認識した英語
                </div>


                <div
                  className="transcript-text"
                >

                  {
                    transcript ||
                    '音読すると、ここに発話した英語が表示されます。'
                  }

                </div>

              </div>


              {/* =================================================
                  RESULT
              ================================================= */}

              {
                accuracy !== null && (

                  <div
                    className="result-area"
                  >


                    {/* CELEBRATION */}

                    {
                      accuracy >= 80 && (

                        <div
                          className="celebration-layer"
                        >

                          {
                            Array.from({
                              length: 40
                            }).map(
                              (_, i) => (

                                <span
                                  key={i}
                                  style={{
                                    left:
                                      `${(i * 29) % 100}%`,

                                    animationDelay:
                                      `${(i % 10) * 0.06}s`,

                                    fontSize:
                                      `${15 + (i % 5) * 5}px`
                                  }}
                                >

                                  {
                                    [
                                      '✨',
                                      '★',
                                      '◆',
                                      '●',
                                      '✦'
                                    ][i % 5]
                                  }

                                </span>

                              )
                            )
                          }

                        </div>

                      )
                    }


                    {/* TITLE */}

                    <div
                      className="accuracy-title"
                    >
                      Accuracy Rate
                    </div>


                    {/* =================================================
                        SEMI-CIRCLE GAUGE
                    ================================================= */}

                    <svg
                      className="accuracy-gauge"
                      viewBox="0 0 240 145"
                    >


                      {/* BACKGROUND */}

                      <path
                        d="
                          M 30 120
                          A 90 90
                          0 0 1
                          210 120
                        "
                        fill="none"
                        stroke="#e7e9ed"
                        strokeWidth="22"
                        strokeLinecap="round"
                        pathLength="100"
                      />


                      {/* SCORE */}

                      <path
                        d="
                          M 30 120
                          A 90 90
                          0 0 1
                          210 120
                        "
                        fill="none"
                        stroke={
                          getScoreColor()
                        }
                        strokeWidth="22"
                        strokeLinecap="round"
                        pathLength="100"
                        strokeDasharray={
                          `${accuracy} 100`
                        }
                        className="accuracy-progress"
                      />


                      {/* NUMBER */}

                      <text
                        x="120"
                        y="108"
                        textAnchor="middle"
                        className="accuracy-number"
                        fill={
                          getScoreColor()
                        }
                      >

                        {accuracy}%

                      </text>

                    </svg>


                    {/* MESSAGE */}

                    {
                      accuracy >= 80
                        ? (

                          <div
                            className="great-result"
                          >
                            🎉 Great job!
                          </div>

                        )
                        : (

                          <div
                            className="try-again-message"
                          >
                            もう一度読んで、
                            80%以上を目指そう！
                          </div>

                        )
                    }


                    {/* RETRY */}

                    <button
                      className="retry-reading-btn"
                      onClick={
                        startReading
                      }
                    >
                      🔄 もう一度
                    </button>

                  </div>

                )
              }

            </div>

          </div>

        )
      }


      {/* ====================================================
          CSS
      ==================================================== */}

      <style>{`

        /* ===============================================
           MAIN WRAPPER
        =============================================== */

        .story-mode-wrapper {

          display: flex;

          flex-direction: column;

          flex: 1;

          min-height: 0;

          width: 100%;

          box-sizing: border-box;

          align-items: center;

          overflow: hidden;

          padding:
            4px 24px
            calc(
              10px +
              env(safe-area-inset-bottom)
            );
        }


        /* ===============================================
           MAIN CARD
        =============================================== */

        .story-card {

          display: flex;

          flex-direction: row;

          flex: 1;

          min-height: 0;

          width: 100%;

          max-width: 1450px;

          background: #fff;

          border-radius: 24px;

          overflow: hidden;

          box-shadow:
            0 10px 30px
            rgba(0,0,0,0.12);
        }


        /* ===============================================
           IMAGE
        =============================================== */

        .story-image-area {

          min-width: 0;

          min-height: 0;

          box-sizing: border-box;

          padding: 18px;

          display: flex;

          align-items: center;

          justify-content: center;

          background: #f5f6f7;

          transition:
            width 0.25s ease;
        }


        .story-image {

          display: block;

          width: 100%;

          height: 100%;

          max-width: 100%;

          max-height: 100%;

          min-height: 0;

          object-fit: contain;

          border-radius: 17px;

          box-shadow:
            0 6px 18px
            rgba(0,0,0,0.14);
        }


        /* ===============================================
           TEXT
        =============================================== */

        .story-text-area {

          min-width: 0;

          min-height: 0;

          box-sizing: border-box;

          display: flex;

          flex-direction: column;

          justify-content: center;

          overflow: hidden;

          transition:
            width 0.25s ease;
        }


        .story-actions {

          display: flex;

          gap: 10px;

          align-items: center;

          margin-bottom: 16px;

          flex-shrink: 0;
        }


        .audio-btn,
        .reading-practice-btn {

          border-radius: 24px;

          padding: 8px 17px;

          font-size: 0.95rem;

          font-weight: 800;

          cursor: pointer;

          transition:
            transform 0.18s,
            box-shadow 0.18s;

          white-space: nowrap;
        }


        .audio-btn {

          color: #1478d4;

          background: #eaf5ff;

          border:
            2px solid #2196F3;
        }


        .reading-practice-btn {

          color: #855200;

          background: #fff4d8;

          border:
            2px solid #f0ad2c;
        }


        .audio-btn:hover,
        .reading-practice-btn:hover {

          transform:
            translateY(-2px);

          box-shadow:
            0 4px 8px
            rgba(0,0,0,0.10);
        }


        .audio-btn:active,
        .reading-practice-btn:active {

          transform:
            scale(0.96);
        }


        .english-text {

          font-weight: 850;

          color: #202124;

          line-height: 1.38;

          text-align: left;

          overflow-wrap: break-word;

          word-break: normal;

          transition:
            font-size 0.2s ease;
        }


        .japanese-text {

          margin-top: 20px;

          padding-top: 17px;

          border-top:
            2px dashed #ddd;

          color: #666;

          line-height: 1.6;

          text-align: left;

          overflow-wrap: break-word;

          transition:
            font-size 0.2s ease;
        }


        /* ===============================================
           NAVIGATION
        =============================================== */

        .story-navigation {

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 26px;

          width: 100%;

          max-width: 1000px;

          margin-top: 7px;

          flex-shrink: 0;

          position: sticky;

          bottom: 0;

          z-index: 20;

          box-sizing: border-box;

          padding:
            5px 0
            calc(
              5px +
              env(safe-area-inset-bottom)
            );

          background:
            linear-gradient(
              to top,
              #f0f8ff 72%,
              rgba(
                240,
                248,
                255,
                0
              )
            );
        }


        .nav-btn {

          min-width: 160px;

          padding: 11px 42px;

          border: none;

          border-radius: 40px;

          font-size: 1.25rem;

          font-weight: 800;

          color: white;

          cursor: pointer;

          box-shadow:
            0 4px 8px
            rgba(0,0,0,0.14);

          transition:
            transform 0.18s,
            box-shadow 0.18s;
        }


        .prev-btn {

          background: #4CAF50;
        }


        .next-btn {

          background: #2196F3;
        }


        .disabled-btn {

          background:
            #d9dde2 !important;

          opacity: 0.58;

          cursor: not-allowed;

          animation:
            none !important;
        }


        .next-btn-anim {

          animation:
            pulse-next
            1.6s
            infinite;
        }


        @keyframes pulse-next {

          0% {

            transform:
              scale(1);

            box-shadow:
              0 4px 8px
              rgba(
                33,
                150,
                243,
                0.25
              );
          }

          50% {

            transform:
              scale(1.035);

            box-shadow:
              0 4px 16px
              rgba(
                33,
                150,
                243,
                0.42
              );
          }

          100% {

            transform:
              scale(1);

            box-shadow:
              0 4px 8px
              rgba(
                33,
                150,
                243,
                0.25
              );
          }

        }


        /* ===============================================
           PRACTICE OVERLAY
        =============================================== */

        .practice-overlay {

          position: fixed;

          inset: 0;

          z-index: 9999;

          box-sizing: border-box;

          display: flex;

          align-items: center;

          justify-content: center;

          padding:
            24px
            24px
            calc(
              24px +
              env(
                safe-area-inset-bottom
              )
            );

          background:
            rgba(
              20,
              30,
              45,
              0.74
            );

          backdrop-filter:
            blur(7px);
        }


        .practice-modal {

          position: relative;

          width:
            min(
              980px,
              94vw
            );

          max-height:
            92dvh;

          overflow-y: auto;

          box-sizing:
            border-box;

          padding:
            30px 44px 36px;

          background: white;

          border-radius: 28px;

          box-shadow:
            0 24px 70px
            rgba(0,0,0,0.38);
        }


        .practice-close {

          position: absolute;

          top: 12px;

          right: 20px;

          z-index: 10;

          border: none;

          background: none;

          color: #777;

          font-size: 2.2rem;

          line-height: 1;

          cursor: pointer;
        }


        .practice-title {

          margin-bottom: 18px;

          text-align: center;

          font-size: 1.5rem;

          font-weight: 850;

          color: #333;
        }


        /* ===============================================
           SCRIPT
        =============================================== */

        .practice-script {

          width:
            min(
              820px,
              100%
            );

          margin:
            0 auto 20px;

          box-sizing:
            border-box;

          padding:
            22px 28px;

          background:
            #f8fafc;

          border:
            2px solid #dfe7ef;

          border-radius:
            20px;

          color: #222;

          font-size:
            clamp(
              1.4rem,
              2.2vw,
              2.1rem
            );

          font-weight: 780;

          line-height: 1.5;

          text-align: left;
        }


        /* ===============================================
           RECORDING CONTROLS
        =============================================== */

        .practice-controls {

          display: flex;

          justify-content: center;

          margin:
            15px 0;
        }


        .start-reading-btn,
        .stop-reading-btn,
        .retry-reading-btn {

          border: none;

          border-radius:
            36px;

          padding:
            12px 30px;

          font-size:
            1.1rem;

          font-weight:
            800;

          cursor: pointer;

          transition:
            transform 0.18s,
            box-shadow 0.18s;
        }


        .start-reading-btn {

          background:
            #2196F3;

          color: white;

          box-shadow:
            0 5px 12px
            rgba(
              33,
              150,
              243,
              0.25
            );
        }


        .stop-reading-btn {

          background:
            #ef5350;

          color: white;

          box-shadow:
            0 5px 12px
            rgba(
              239,
              83,
              80,
              0.25
            );
        }


        .retry-reading-btn {

          margin-top: 10px;

          background:
            #edf1f6;

          color: #444;
        }


        .start-reading-btn:hover,
        .stop-reading-btn:hover,
        .retry-reading-btn:hover {

          transform:
            translateY(-2px);
        }


        /* ===============================================
           RECORDING INDICATOR
        =============================================== */

        .recording-indicator {

          display: flex;

          justify-content: center;

          align-items: center;

          gap: 9px;

          margin-bottom: 13px;

          color: #e74c3c;

          font-weight: 800;
        }


        .recording-dot {

          width: 12px;

          height: 12px;

          background:
            #ef5350;

          border-radius:
            50%;

          animation:
            recordingPulse
            1s
            infinite;
        }


        @keyframes recordingPulse {

          0%,
          100% {

            opacity: 1;

            transform:
              scale(1);
          }

          50% {

            opacity: 0.35;

            transform:
              scale(1.4);
          }

        }


        /* ===============================================
           TRANSCRIPT
        =============================================== */

        .transcript-box {

          width:
            min(
              820px,
              100%
            );

          min-height:
            82px;

          margin:
            16px auto 0;

          padding:
            15px 20px;

          box-sizing:
            border-box;

          background:
            #f3f5f7;

          border-radius:
            16px;

          text-align:
            left;
        }


        .transcript-title {

          margin-bottom:
            6px;

          color: #888;

          font-size:
            0.85rem;

          font-weight:
            bold;
        }


        .transcript-text {

          color: #333;

          font-size:
            1.05rem;

          line-height: 1.55;
        }


        /* ===============================================
           RESULT
        =============================================== */

        .result-area {

          position: relative;

          display: flex;

          flex-direction: column;

          align-items: center;

          margin-top:
            17px;
        }


        .accuracy-title {

          color: #555;

          font-size:
            1.05rem;

          font-weight:
            800;

          margin-bottom:
            2px;
        }


        .accuracy-gauge {

          display: block;

          width: 260px;

          height: 150px;
        }


        .accuracy-number {

          font-size: 38px;

          font-weight: 900;
        }


        .accuracy-progress {

          transition:
            stroke-dasharray
            1.1s
            ease;
        }


        .great-result {

          color: #20a96b;

          font-size:
            1.7rem;

          font-weight: 900;

          animation:
            resultPop
            0.65s
            ease;
        }


        @keyframes resultPop {

          0% {

            opacity: 0;

            transform:
              scale(0.3);
          }

          70% {

            transform:
              scale(1.18);
          }

          100% {

            opacity: 1;

            transform:
              scale(1);
          }

        }


        .try-again-message {

          color: #666;

          font-weight: 800;
        }


        /* ===============================================
           CELEBRATION
        =============================================== */

        .celebration-layer {

          position: fixed;

          inset: 0;

          z-index: 10000;

          overflow: hidden;

          pointer-events: none;
        }


        .celebration-layer span {

          position: absolute;

          top: -50px;

          animation:
            celebrationFall
            1.9s
            cubic-bezier(
              .2,
              .75,
              .3,
              1
            )
            forwards;
        }


        @keyframes celebrationFall {

          0% {

            opacity: 0;

            transform:
              translateY(-60px)
              rotate(0deg)
              scale(0.4);
          }

          15% {

            opacity: 1;
          }

          100% {

            opacity: 0.9;

            transform:
              translateY(108dvh)
              rotate(600deg)
              scale(1.25);
          }

        }


        /* =====================================================
           iPAD LANDSCAPE / HEIGHTが低いWindows画面
        ===================================================== */

        @media
        (max-height: 850px)
        and
        (min-width: 901px) {

          .story-mode-wrapper {

            padding:
              2px 16px
              calc(
                5px +
                env(
                  safe-area-inset-bottom
                )
              );
          }


          .story-card {

            border-radius:
              20px;
          }


          .story-image-area {

            padding:
              11px;
          }


          .story-text-area {

            padding:
              16px 24px
              !important;
          }


          .story-actions {

            margin-bottom:
              9px;
          }


          .audio-btn,
          .reading-practice-btn {

            padding:
              6px 14px;

            font-size:
              0.85rem;
          }


          .english-text {

            font-size:
              min(
                1.65rem,
                3.1vh
              )
              !important;

            line-height:
              1.33;
          }


          .japanese-text {

            margin-top:
              12px;

            padding-top:
              10px;

            font-size:
              min(
                1.05rem,
                2.1vh
              )
              !important;

            line-height:
              1.48;
          }


          .story-navigation {

            margin-top:
              4px;

            padding-top:
              3px;

            padding-bottom:
              calc(
                3px +
                env(
                  safe-area-inset-bottom
                )
              );
          }


          .nav-btn {

            min-width:
              145px;

            padding:
              9px 34px;

            font-size:
              1.05rem;
          }


          .practice-modal {

            max-height:
              94dvh;

            padding:
              22px 34px 26px;
          }


          .practice-script {

            padding:
              17px 23px;

            font-size:
              1.45rem;

            line-height:
              1.42;
          }


          .transcript-box {

            min-height:
              68px;

            margin-top:
              10px;
          }


          .accuracy-gauge {

            width:
              220px;

            height:
              126px;
          }

        }


        /* =====================================================
           iPAD PORTRAIT / TABLET / SMALL SCREEN
        ===================================================== */

        @media
        (max-width: 900px) {

          .story-mode-wrapper {

            overflow-y: auto;

            align-items:
              stretch;

            padding:
              4px 12px 0;
          }


          .story-card {

            flex:
              none;

            flex-direction:
              column;

            width:
              100%;

            overflow:
              visible;
          }


          .story-image-area,
          .story-text-area {

            width:
              100%
              !important;
          }


          .story-image-area {

            box-sizing:
              border-box;

            min-height:
              260px;

            max-height:
              45dvh;

            padding:
              12px;
          }


          .story-image {

            max-height:
              42dvh;
          }


          .story-text-area {

            padding:
              20px
              !important;
          }


          .story-actions {

            margin-bottom:
              12px;
          }


          .english-text {

            font-size:
              clamp(
                1.35rem,
                4vw,
                1.8rem
              )
              !important;

            line-height:
              1.38;
          }


          .japanese-text {

            margin-top:
              14px;

            padding-top:
              12px;

            font-size:
              clamp(
                0.95rem,
                2.6vw,
                1.15rem
              )
              !important;
          }


          .story-navigation {

            bottom: 0;

            margin-top:
              5px;

            padding:
              8px 0
              calc(
                10px +
                env(
                  safe-area-inset-bottom
                )
              );
          }


          .nav-btn {

            min-width:
              135px;

            padding:
              10px 22px;

            font-size:
              1.05rem;
          }


          .practice-overlay {

            align-items:
              flex-start;

            overflow-y:
              auto;

            padding:
              16px
              12px
              calc(
                16px +
                env(
                  safe-area-inset-bottom
                )
              );
          }


          .practice-modal {

            width:
              100%;

            max-height:
              none;

            padding:
              28px 18px 30px;

            border-radius:
              22px;
          }


          .practice-script {

            padding:
              18px 20px;

            font-size:
              clamp(
                1.3rem,
                4vw,
                1.8rem
              );
          }

        }


        /* =====================================================
           VERY SMALL
        ===================================================== */

        @media
        (max-width: 520px) {

          .story-actions {

            flex-wrap:
              wrap;
          }


          .story-navigation {

            gap:
              10px;
          }


          .nav-btn {

            min-width:
              120px;

            padding:
              9px 15px;

            font-size:
              0.95rem;
          }


          .story-image-area {

            min-height:
              230px;
          }

        }


        /* =====================================================
           動きを減らす設定のユーザー
        ===================================================== */

        @media
        (prefers-reduced-motion: reduce) {

          .next-btn-anim,
          .recording-dot,
          .great-result,
          .celebration-layer span {

            animation:
              none !important;
          }

        }

      `}</style>

    </div>

  );
};


export default StoryModeBoard;