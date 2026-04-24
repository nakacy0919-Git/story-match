import React, { useState, useEffect } from 'react';

const Timer = ({ isStarted, isCleared, setFinalTime }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    // 開始していて、まだクリアしていない時だけカウントアップ
    if (isStarted && !isCleared) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (isCleared && isStarted) {
      // クリア時に最終タイムを記録
      setFinalTime(seconds);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStarted, isCleared, seconds, setFinalTime]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '8px 25px', borderRadius: '30px', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#444', fontFamily: 'monospace' }}>
        ⏱ {seconds}s
      </div>
    </div>
  );
};

export default Timer;