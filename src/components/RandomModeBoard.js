import React, { useState, useEffect, useRef } from 'react';
import { makeQuestions, makeChoices } from '../utils/game';
import { playSound } from '../utils/sound';

const RandomModeBoard = ({ storyData, unit, retryCount, onRetry, qCount, onGameClear, studentInfo }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const timersRef = useRef([]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = (callback, delay) => {
    timersRef.current.push(setTimeout(callback, delay));
  };

  useEffect(() => {
    if (!storyData) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const shuffled = makeQuestions(storyData.length, qCount);
    setQuestions(shuffled);
    setCurrentIndex(0); setScore(0); setIsCleared(false);
    generateChoices(shuffled[0]);
  }, [unit, retryCount, storyData, qCount]);

  const generateChoices = (correctId) => {
    setChoices(makeChoices(storyData.length, correctId));
    setQuestionStartTime(Date.now()); setFeedback(null);
  };

  const handleChoiceClick = (id) => {
    if (feedback || isCleared) return;
    if (id === questions[currentIndex]) {
      playSound('correct');
      setFeedback({ status: 'correct', id });
      const points = Math.max(10, Math.floor(100 - ((Date.now() - questionStartTime) / 1000) * 12));
      setScore(prev => prev + points);
      schedule(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex(prev => prev + 1);
          generateChoices(questions[currentIndex + 1]);
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
      schedule(() => setFeedback(null), 500);
    }
  };

  if (!storyData || questions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 20px 30px', alignItems: 'center', boxSizing: 'border-box' }}>
      {isCleared ? (
        <div style={{ flex: 1, width: '100%', backgroundColor: '#fff', borderRadius: '15px', padding: '40px', border: '4px solid #4ECDC4', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {/* 🌟 リザルト画面に クラス・番号・氏名 を表示 */}
          <div style={{ marginBottom: '20px', padding: '10px 30px', backgroundColor: '#333', color: '#fff', borderRadius: '15px', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {studentInfo.class} - {studentInfo.number}番 - {studentInfo.name}
          </div>
          <h2 style={{ color: '#FF8C00', fontSize: '2.5rem', margin: '0 0 20px' }}>⚡ SPEED MODE CLEAR! ⚡</h2>
          <div style={{ fontSize: '5rem', color: '#4caf50', fontWeight: '900' }}>{score} pts</div>
          <button onClick={onRetry} style={{ marginTop: '30px', padding: '15px 40px', fontSize: '1.5rem', backgroundColor: '#FF6B6B', color: '#fff', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>🔄 Play Again</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '900px', marginBottom: '10px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Q {currentIndex + 1} / {questions.length}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FF8C00' }}>SCORE: {score}</div>
          </div>
          
          <div style={{ width: '100%', maxWidth: '900px', flex: 1, backgroundColor: '#fff', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '20px 40px', borderRadius: '20px', border: '3px solid #eee', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', textAlign: 'left', width: '100%' }}>{storyData[questions[currentIndex]].en}</div>
          </div>
          
          <div style={{ display: 'flex', gap: '30px', width: '100%', maxWidth: '1000px', justifyContent: 'center', flex: 1.2, marginTop: '20px' }}>
            {choices.map(id => {
              const isCorrect = feedback?.status === 'correct' && feedback.id === id;
              const isWrong = feedback?.status === 'wrong' && feedback.id === id;
              return (
                <div key={id} onClick={() => handleChoiceClick(id)} style={{ flex: 1, cursor: 'pointer', borderRadius: '15px', overflow: 'hidden', border: isCorrect ? '6px solid #4caf50' : (isWrong ? '6px solid #f44336' : '6px solid transparent'), position: 'relative', aspectRatio: '4/3' }}>
                  <img src={`${process.env.PUBLIC_URL}/images/unit${unit}/${id + 1}.webp`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', backgroundColor: '#fff' }} alt="choice" />
                  {isCorrect && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(76, 175, 80, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><span style={{fontSize: '5rem'}}>⭕</span></div>}
                  {isWrong && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(244, 67, 54, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><span style={{fontSize: '5rem'}}>❌</span></div>}
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