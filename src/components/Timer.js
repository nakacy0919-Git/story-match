import React, { useState, useEffect } from 'react';

// 🌟 penaltySeconds を新しく受け取るように設定
const Timer = ({ isStarted, isCleared, setFinalTime, penaltySeconds = 0 }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval = null;
    
    if (isStarted && !isCleared) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (isCleared) {
      clearInterval(interval);
      // 🌟 クリアした時に、実際の時間＋ペナルティ時間を「最終タイム」として保存
      setFinalTime(time + penaltySeconds);
    }
    
    return () => clearInterval(interval);
  }, [isStarted, isCleared, setFinalTime, time, penaltySeconds]);

  // 🌟 画面に表示する数字は、常に「実際の経過時間 ＋ ペナルティ時間」
  const displayTime = time + penaltySeconds;

  return (
    <div style={{ 
      fontSize: '1.5rem', fontWeight: 'bold', color: '#ff5722', 
      backgroundColor: '#fff', padding: '5px 20px', borderRadius: '20px', 
      border: '3px solid #ff5722', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transition: 'color 0.3s' // 時間が飛んだ時に滑らかに見せる隠し味
    }}>
      ⏱ Time: {displayTime}s
    </div>
  );
};

export default Timer;