import React, { useState, useEffect } from 'react';

const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  if (type === 'correct') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'wrong') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'fanfare') {
    osc.type = 'square'; [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15); });
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    osc.start(); osc.stop(ctx.currentTime + 1.2);
  }
};

// 🌟 qCount を受け取るように修正
const RandomModeBoard = ({ storyData, unit, retryCount, onRetry, qCount }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!storyData) return;

    // 🌟 全12問の中から qCount 分だけランダムに抽出
    const allIndices = [...Array(12).keys()].sort(() => Math.random() - 0.5);
    const shuffled = allIndices.slice(0, qCount);
    
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsCleared(false);
    
    generateChoices(shuffled[0]);
  }, [unit, retryCount, storyData, qCount]);

  const generateChoices = (correctId) => {
    const wrongPool = [...Array(12).keys()].filter(id => id !== correctId);
    const wrongIds = wrongPool.sort(() => Math.random() - 0.5).slice(0, 2);
    setChoices([correctId, ...wrongIds].sort(() => Math.random() - 0.5));
    setQuestionStartTime(Date.now());
    setFeedback(null);
  };

  const handleChoiceClick = (id) => {
    if (feedback || isCleared) return;
    if (id === questions[currentIndex]) {
      playSound('correct');
      setFeedback({ status: 'correct', id });
      const points = Math.max(10, Math.floor(100 - ((Date.now() - questionStartTime) / 1000) * 12));
      setScore(prev => prev + points);
      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex(prev => prev + 1);
          generateChoices(questions[currentIndex + 1]);
        } else {
          setIsCleared(true);
          playSound('fanfare');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 20px 30px', alignItems: 'center', boxSizing: 'border-box' }}>
      {isCleared ? (
        <div style={{ flex: 1, width: '100%', backgroundColor: '#fff', borderRadius: '15px', padding: '40px', border: '4px solid #4ECDC4', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(78, 205, 196, 0.3)' }}>
          <h2 style={{ color: '#FF8C00', fontSize: '3rem', margin: '0 0 20px' }}>⚡ SPEED MODE CLEAR! ⚡</h2>
          <div style={{ fontSize: '1.5rem', color: '#666', fontWeight: 'bold' }}>FINAL SCORE</div>
          <div style={{ fontSize: '5rem', color: '#4caf50', fontWeight: '900' }}>{score} pts</div>
          <button onClick={onRetry} style={{ marginTop: '30px', padding: '15px 40px', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', backgroundColor: '#FF6B6B', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>🔄 Play Again</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '900px', marginBottom: '10px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#666', backgroundColor: '#fff', padding: '5px 20px', borderRadius: '20px' }}>Q {currentIndex + 1} / {questions.length}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FF8C00', backgroundColor: '#fff', padding: '5px 25px', borderRadius: '20px' }}>SCORE: {score}</div>
          </div>
          <div style={{ width: '100%', maxWidth: '900px', flex: 1, backgroundColor: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', borderRadius: '20px', margin: '15px 0 30px', border: '3px solid #eee' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#222', textAlign: 'center' }}>{storyData[questions[currentIndex]].en}</div>
          </div>
          <div style={{ display: 'flex', gap: '30px', width: '100%', maxWidth: '1000px', justifyContent: 'center', flex: 1.2 }}>
            {choices.map(id => {
              const isCorrect = feedback?.status === 'correct' && feedback.id === id;
              const isWrong = feedback?.status === 'wrong' && feedback.id === id;
              return (
                <div key={id} onClick={() => handleChoiceClick(id)} style={{ flex: 1, cursor: 'pointer', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#fff', border: isCorrect ? '6px solid #4caf50' : (isWrong ? '6px solid #f44336' : '6px solid transparent'), boxShadow: '0 6px 15px rgba(0,0,0,0.15)', transform: isCorrect ? 'scale(1.05)' : (isWrong ? 'scale(0.95)' : 'scale(1)'), transition: 'all 0.15s', position: 'relative', aspectRatio: '4/3' }}>
                  <img src={`${process.env.PUBLIC_URL}/images/unit${unit}/${id + 1}.webp`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="choice" />
                  {isCorrect && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.3)' }}><span style={{fontSize: '5rem'}}>⭕</span></div>}
                  {isWrong && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(244, 67, 54, 0.3)' }}><span style={{fontSize: '5rem'}}>❌</span></div>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RandomModeBoard;