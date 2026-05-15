import React, { useState, useEffect } from 'react';

const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (type === 'correct') {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle'; osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'fanfare') {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square'; [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15); });
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    osc.start(); osc.stop(ctx.currentTime + 1.2);
  }
};

const ListeningModeBoard = ({ storyData, unit, retryCount, onRetry, qCount, onGameClear, studentInfo }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [questions, setQuestions] = useState([]); // 🌟 出題予定のキュー
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0); // 🌟 何問目か
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!storyData) return;
    const allIndices = [...Array(12).keys()].sort(() => Math.random() - 0.5);
    const initialQuestions = allIndices.slice(0, qCount === 'ALL' ? 12 : qCount);
    
    setQuestions(initialQuestions);
    setCurrentQueueIndex(0); setScore(0); setIsCleared(false); setIsStarted(false);
    generateChoices(initialQuestions[0]);
    
    return () => window.speechSynthesis.cancel();
  }, [unit, retryCount, storyData, qCount]);

  useEffect(() => {
    if (isStarted && !isCleared && !feedback) {
      speakText();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQueueIndex, isStarted]); 

  const generateChoices = (correctId) => {
    if (correctId === undefined) return;
    const wrongPool = [...Array(12).keys()].filter(id => id !== correctId);
    const wrongIds = wrongPool.sort(() => Math.random() - 0.5).slice(0, 2);
    setChoices([correctId, ...wrongIds].sort(() => Math.random() - 0.5));
    setQuestionStartTime(Date.now()); 
    setFeedback(null);
  };

  // 🌟 究極の音声フリーズ回避 ＋ 高音質ネイティブボイス選択処理
  const speakText = () => {
    if (!questions[currentIndex] || !storyData) return;
    
    const synth = window.speechSynthesis;
    synth.resume();
    synth.cancel();

    setTimeout(() => {
      const text = storyData[questions[currentIndex]].en;
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 🌟 生徒が聞き取りやすいように少しだけゆっくりに
      utterance.rate = 0.85; 
      utterance.lang = 'en-US';

      // 🌟 デバイス内にある「一番ネイティブに近い高音質ボイス」を探してセットする
      const voices = synth.getVoices();
      const bestVoice = 
        voices.find(v => v.name.includes('Google US English')) || // Chrome用（高音質）
        voices.find(v => v.name.includes('Samantha')) ||          // Safari/iOS用（滑らか）
        voices.find(v => v.name.includes('Alex')) ||              // Mac用
        voices.find(v => v.lang === 'en-US' && v.localService === false) || // Edge等のクラウド音声
        voices.find(v => v.lang === 'en-US');                     // 見つからなければ標準の英語

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      window.currentUtteranceHack = utterance;
      synth.speak(utterance);
    }, 300);
  };

  const handleStartGame = () => {
    setIsStarted(true);
    setQuestionStartTime(Date.now());
  };

  // 🌟 音声エラー時のスキップ処理
  const handleSkip = () => {
    if (feedback || isCleared || !isStarted) return;
    
    window.speechSynthesis.cancel();
    const currentQuestionId = questions[currentQueueIndex];

    // 今の問題を配列の最後に追加し直す（再出題）
    setQuestions(prev => [...prev, currentQuestionId]);
    
    // 次の問題へ（スコアは計算しない）
    const nextIdx = currentQueueIndex + 1;
    setCurrentQueueIndex(nextIdx);
    generateChoices(questions[nextIdx]);
  };

  const handleChoiceClick = (id) => {
    if (feedback || isCleared || !isStarted) return;
    
    window.speechSynthesis.cancel(); 

    if (id === questions[currentQueueIndex]) {
      playSound('correct');
      setFeedback({ status: 'correct', id });
      
      const timeElapsed = (Date.now() - questionStartTime) / 1000;
      const points = Math.max(10, Math.floor(100 - (timeElapsed * 15)));
      setScore(prev => prev + points);
      
      setTimeout(() => {
        const nextIdx = currentQueueIndex + 1;
        if (nextIdx < questions.length) {
          setCurrentQueueIndex(nextIdx);
          generateChoices(questions[nextIdx]);
        } else {
          setIsCleared(true);
          playSound('fanfare');
          onGameClear(score + points);
        }
      }, 800);
    } else {
      playSound('wrong');
      setFeedback({ status: 'wrong', id });
      setScore(prev => Math.max(0, prev - 20)); 
      setTimeout(() => setFeedback(null), 500);
    }
  };

  if (!storyData || questions.length === 0) return null;

  if (!isStarted) {
    return (
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#fff', padding: '50px', borderRadius: '30px', boxShadow: '0 15px 40px rgba(156, 39, 176, 0.2)', border: '5px solid #9C27B0', maxWidth: '600px' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🎧</div>
          <h2 style={{ fontSize: '2rem', color: '#9C27B0', marginBottom: '20px' }}>Quick Listen Mode</h2>
          <p style={{ fontSize: '1.2rem', color: '#666', lineHeight: '1.6', marginBottom: '30px', textAlign: 'left' }}>
            流れる音声を聞いて、正しい画像を瞬時に選ぼう！<br/><br/>
            ✅ 早く答えるほど高得点。<br/>
            ✅ お手付き（ミス）は減点。<br/>
            ✅ <b>もし音声が流れない場合は、「音声が聞こえない」ボタンを押してね。その問題は後でやり直せるよ。</b>（スキップしても得点は減らないよ）
          </p>
          <button onClick={handleStartGame} className="start-go-btn">START!</button>
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
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 20px 30px', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#fff', borderRadius: '15px', padding: '40px', border: '4px solid #9C27B0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ marginBottom: '20px', padding: '10px 30px', backgroundColor: '#333', color: '#fff', borderRadius: '15px', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {studentInfo.class} - {studentInfo.number}番 - {studentInfo.name}
          </div>
          <h2 style={{ color: '#9C27B0', fontSize: '2.5rem', margin: '0 0 20px' }}>🎧 QUICK LISTEN CLEAR! 🎧</h2>
          <div style={{ fontSize: '5rem', color: '#4caf50', fontWeight: '900' }}>{score} pts</div>
          <button onClick={onRetry} style={{ marginTop: '30px', padding: '15px 40px', fontSize: '1.5rem', backgroundColor: '#9C27B0', color: '#fff', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>🔄 Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 20px 30px', alignItems: 'center', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '900px', marginBottom: '10px' }}>
        {/* スキップ分も含むため currentIndex ではなく QueueIndex を利用 */}
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Progress: {currentQueueIndex + 1} / {questions.length}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#9C27B0' }}>SCORE: {score}</div>
      </div>
      
      <div style={{ width: '100%', maxWidth: '900px', flex: 1, backgroundColor: '#f3e5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', borderRadius: '20px', border: '3px solid #ce93d8', boxSizing: 'border-box', position: 'relative' }}>
        <p style={{ color: '#8e24aa', fontWeight: 'bold', margin: '0 0 10px', fontSize: '1.5rem' }}>⚡ 早押しリスニング ⚡</p>
        <div className="sound-wave">
          <div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', position: 'absolute', bottom: '15px', right: '20px' }}>
          {/* 🌟 音声が聞こえないボタン */}
          <button onClick={handleSkip} className="skip-btn">⚠️ 音声が聞こえない</button>
          <button onClick={speakText} className="repeat-btn">🔁 もう一度聞く</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '30px', width: '100%', maxWidth: '1000px', justifyContent: 'center', flex: 1.2, marginTop: '20px' }}>
        {choices.map(id => {
          const isCorrect = feedback?.status === 'correct' && feedback.id === id;
          const isWrong = feedback?.status === 'wrong' && feedback.id === id;
          return (
            <div key={id} onClick={() => handleChoiceClick(id)} style={{ flex: 1, cursor: 'pointer', borderRadius: '15px', overflow: 'hidden', border: isCorrect ? '6px solid #4caf50' : (isWrong ? '6px solid #f44336' : '6px solid transparent'), position: 'relative', aspectRatio: '4/3', backgroundColor: '#fff', boxShadow: '0 6px 15px rgba(0,0,0,0.1)', transition: 'transform 0.1s' }}>
              <img src={`${process.env.PUBLIC_URL}/images/unit${unit}/${id + 1}.webp`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', backgroundColor: '#fff' }} alt="choice" />
              {isCorrect && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(76, 175, 80, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><span style={{fontSize: '5rem'}}>⭕</span></div>}
              {isWrong && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(244, 67, 54, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><span style={{fontSize: '5rem'}}>❌</span></div>}
            </div>
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