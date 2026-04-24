import React, { useState, useEffect } from 'react';
import Timer from './components/Timer';
import MatchBoard from './components/MatchBoard';

const pastelColors = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#D0BAFF', '#FFB3F7', '#FFD1D1', '#FFF4E6', '#E6FFE6',
  '#E6F4FF', '#E6E6FA', '#FFE6E6', '#FFFFE6', '#E6FFFF'
];

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [finalTime, setFinalTime] = useState(null);
  const [mistakeCount, setMistakeCount] = useState(0); // ❌ミス回数
  const [currentUnit, setCurrentUnit] = useState(1);
  const [retryCount, setRetryCount] = useState(0); // 🔄リセット用
  
  const [bestTimes, setBestTimes] = useState(() => JSON.parse(localStorage.getItem('storyMatchBestTimes')) || {});

  useEffect(() => {
    if (isCleared && finalTime !== null) {
      const currentBest = bestTimes[currentUnit];
      if (!currentBest || finalTime < currentBest) {
        const newBests = { ...bestTimes, [currentUnit]: finalTime };
        setBestTimes(newBests);
        localStorage.setItem('storyMatchBestTimes', JSON.stringify(newBests));
      }
    }
  }, [isCleared, finalTime, currentUnit, bestTimes]);

  const handleGameStart = () => {
    if (!isStarted) setIsStarted(true); // 初めて画像を触った時にタイマー開始
  };
  const handleGameClear = () => setIsCleared(true);
  const handleMistake = () => setMistakeCount(prev => prev + 1); // ミス回数を追加

  // リトライ（もう一度プレイ）の処理
  const handleRetry = () => {
    setIsStarted(false);
    setIsCleared(false);
    setFinalTime(null);
    setMistakeCount(0);
    setRetryCount(prev => prev + 1); // タイマーと盤面をリセット
  };

  const handleUnitChange = (unitNum) => {
    setCurrentUnit(unitNum);
    handleRetry(); // Unit変更時もリセット
  };

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#f0f8ff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 15px', gap: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} onClick={() => handleUnitChange(i + 1)} style={{
            backgroundColor: pastelColors[i], padding: '5px', borderRadius: '12px', cursor: 'pointer',
            boxShadow: currentUnit === i + 1 ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)', transform: currentUnit === i + 1 ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s', flexShrink: 0
          }}>
            <div style={{ border: '2px dashed white', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', color: '#555', fontSize: '1rem' }}>Unit {i + 1}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontFamily: '"Comic Sans MS", "Fredoka One", "Rounded Mplus 1c", sans-serif', background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(2px 2px 1px rgba(0,0,0,0.1))' }}>
          English Story Match! <span style={{fontSize:'1.2rem', color:'#888', WebkitTextFillColor: '#888'}}> - Unit {currentUnit}</span>
        </h1>
        {/* keyにretryCountを渡すことで、リトライ時にタイマーが完全に0に戻ります */}
        <Timer key={`timer-${retryCount}`} isStarted={isStarted} isCleared={isCleared} setFinalTime={setFinalTime} />
      </div>
      
      <MatchBoard 
        onGameStart={handleGameStart}
        onGameClear={handleGameClear} 
        onMistake={handleMistake}
        onRetry={handleRetry}
        mistakeCount={mistakeCount}
        unit={currentUnit} 
        isCleared={isCleared} 
        finalTime={finalTime} 
        bestTime={bestTimes[currentUnit]} 
        retryCount={retryCount}
      />
    </div>
  );
}

export default App;