import React, { useState, useEffect } from 'react';

const storyData = [
  { en: "Colin wanted to get easy money from the hospital.", ja: "コリンは病院から簡単にお金を手に入れようと企みました。" },
  { en: "Colin: \"Doctor, I have lost my sense of taste.\"", ja: "コリン:「先生、味覚を失ってしまったんです。」" },
  { en: "Doctor: \"Nurse, please bring the medicine from box 22.\"", ja: "医者:「看護師さん、22番の箱から薬を持ってきて。」" },
  { en: "Colin tastes it: \"Yuck! This is gasoline!\"", ja: "コリン(味見して):「オエッ！これガソリンじゃないか！」" },
  { en: "1 week later... Colin: \"I have lost my memory.\"", ja: "1週間後... コリン:「記憶を失ってしまいました。」" },
  { en: "Doctor: \"Nurse, please bring the medicine from box 22.\"", ja: "医者:「看護師さん、22番の箱から薬を...」" },
  { en: "The nurse brings the bottle. Colin remembers it.", ja: "薬が運ばれてくる。コリンはそれを思い出しました。" },
  { en: "Colin: \"No! That's gasoline!\" Doctor: \"Your memory is back!\"", ja: "コリン:「ダメだ！それはガソリンだ！」医者:「記憶が戻りましたね！」" },
  { en: "1 week later... Colin: \"I have lost my eyesight.\"", ja: "1週間後... コリン:「視力を失ってしまいました。」" },
  { en: "Doctor: \"I can't cure that. Here is 1,000 dollars.\"", ja: "医者:「それは治せません。ここに1000ドルあります。」" },
  { en: "Colin: \"Wait a minute! This is only a 1 dollar bill!\"", ja: "コリン:「ちょっと待って！これ1ドル札じゃないか！」" },
  { en: "Doctor: \"Your eyesight is back! You lose again!\"", ja: "医者:「視力が戻りましたね！またあなたの負けです！」" }
];

const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  if (type === 'correct') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime); osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'wrong') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'fanfare') {
    osc.type = 'square'; [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15); });
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05); gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.45); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.start(); osc.stop(ctx.currentTime + 1.2);
  }
};

const RandomModeBoard = ({ unit, retryCount, onRetry }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' or 'wrong'

  useEffect(() => {
    // 12問をシャッフル
    const shuffled = [...Array(12).keys()].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsCleared(false);
    generateChoices(shuffled[0]);
  }, [unit, retryCount]);

  const generateChoices = (correctId) => {
    // 正解以外の11個から2つをランダムに選ぶ
    const wrongPool = [...Array(12).keys()].filter(id => id !== correctId);
    const wrongIds = wrongPool.sort(() => Math.random() - 0.5).slice(0, 2);
    // 3つの選択肢をシャッフルしてセット
    const newChoices = [correctId, ...wrongIds].sort(() => Math.random() - 0.5);
    setChoices(newChoices);
    setQuestionStartTime(Date.now());
    setFeedback(null);
  };

  const handleChoiceClick = (id) => {
    if (feedback) return; // アニメーション中は押せないようにする

    if (id === questions[currentIndex]) {
      // ⭕ 正解の処理（早いほど高得点！）
      playSound('correct');
      setFeedback({ status: 'correct', id });
      
      const timeTaken = (Date.now() - questionStartTime) / 1000;
      // 満点100点、時間がかかるほど減点（最低10点）
      const points = Math.max(10, Math.floor(100 - (timeTaken * 12)));
      setScore(prev => prev + points);

      setTimeout(() => {
        if (currentIndex + 1 < 12) {
          setCurrentIndex(prev => prev + 1);
          generateChoices(questions[currentIndex + 1]);
        } else {
          setIsCleared(true);
          playSound('fanfare');
        }
      }, 800);
    } else {
      // ❌ 不正解の処理
      playSound('wrong');
      setFeedback({ status: 'wrong', id });
      setScore(prev => Math.max(0, prev - 20)); // ペナルティ
      setTimeout(() => setFeedback(null), 500);
    }
  };

  if (questions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 20px 30px', alignItems: 'center', boxSizing: 'border-box' }}>
      
      {isCleared ? (
        <div style={{ flex: 1, width: '100%', backgroundColor: '#fff', borderRadius: '15px', padding: '40px', border: '4px solid #4ECDC4', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(78, 205, 196, 0.3)', animation: 'fadeIn 1s' }}>
          <h2 style={{ color: '#FF8C00', fontSize: '3rem', margin: '0 0 20px' }}>⚡ SPEED MODE CLEAR! ⚡</h2>
          <div style={{ fontSize: '1.5rem', color: '#666', fontWeight: 'bold' }}>FINAL SCORE</div>
          <div style={{ fontSize: '5rem', color: '#4caf50', fontWeight: '900', textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>{score} <span style={{fontSize: '2rem'}}>pts</span></div>
          <button onClick={onRetry} style={{ marginTop: '30px', padding: '15px 40px', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', backgroundColor: '#FF6B6B', border: 'none', borderRadius: '40px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>🔄 Play Again</button>
        </div>
      ) : (
        <>
          {/* スコアと進行状況 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '900px', marginBottom: '10px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#666', backgroundColor: '#fff', padding: '5px 20px', borderRadius: '20px' }}>Q {currentIndex + 1} / 12</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FF8C00', backgroundColor: '#fff', padding: '5px 25px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>SCORE: {score}</div>
          </div>

          {/* 大きな英文表示エリア */}
          <div style={{ width: '100%', maxWidth: '900px', flex: 1, backgroundColor: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', margin: '15px 0 30px', border: '3px solid #eee' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 'bold', color: '#222', lineHeight: '1.4', textAlign: 'center' }}>
              {storyData[questions[currentIndex]].en}
            </div>
          </div>

          {/* 3つの画像選択エリア */}
          <div style={{ display: 'flex', gap: '30px', width: '100%', maxWidth: '1000px', justifyContent: 'center', flex: 1.2 }}>
            {choices.map(id => {
              const isCorrect = feedback?.status === 'correct' && feedback.id === id;
              const isWrong = feedback?.status === 'wrong' && feedback.id === id;
              
              return (
                <div key={id} onClick={() => handleChoiceClick(id)} style={{ 
                  flex: 1, cursor: 'pointer', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#fff',
                  border: isCorrect ? '6px solid #4caf50' : (isWrong ? '6px solid #f44336' : '6px solid transparent'),
                  boxShadow: '0 6px 15px rgba(0,0,0,0.15)', transform: isCorrect ? 'scale(1.05)' : (isWrong ? 'scale(0.95)' : 'scale(1)'),
                  transition: 'all 0.15s', position: 'relative'
                }}>
                  <img src={`${process.env.PUBLIC_URL}/images/${id + 1}.webp`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="choice" />
                  
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