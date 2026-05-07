import React, { useState, useEffect } from 'react';
import Timer from './components/Timer';
import MatchBoard from './components/MatchBoard';
import RandomModeBoard from './components/RandomModeBoard';
import { allUnitsData } from './unitsData'; 

const pastelColors = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#D0BAFF', '#FFB3F7', '#FFD1D1', '#FFF4E6', '#E6FFE6',
  '#E6F4FF', '#E6E6FA', '#FFE6E6', '#FFFFE6', '#E6FFFF'
];

function App() {
  const [gameMode, setGameMode] = useState('learning');
  const [isStarted, setIsStarted] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [finalTime, setFinalTime] = useState(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [currentUnit, setCurrentUnit] = useState(2); 
  const [retryCount, setRetryCount] = useState(0);
  const [bestTimes, setBestTimes] = useState(() => JSON.parse(localStorage.getItem('storyMatchBestTimes')) || {});
  
  // 🌟 ヒントを使った時のペナルティ秒数を記録するステート
  const [penaltySeconds, setPenaltySeconds] = useState(0);

  const currentStoryData = allUnitsData[currentUnit];
  const hasData = currentStoryData && currentStoryData.length === 12;

  useEffect(() => {
    if (gameMode === 'learning' && isCleared && finalTime !== null) {
      const currentBest = bestTimes[currentUnit];
      if (!currentBest || finalTime < currentBest) {
        const newBests = { ...bestTimes, [currentUnit]: finalTime };
        setBestTimes(newBests);
        localStorage.setItem('storyMatchBestTimes', JSON.stringify(newBests));
      }
    }
  }, [isCleared, finalTime, currentUnit, bestTimes, gameMode]);

  const handleGameStart = () => { if (!isStarted) setIsStarted(true); };
  const handleGameClear = () => setIsCleared(true);
  const handleMistake = () => setMistakeCount(prev => prev + 1);
  
  // 🌟 ペナルティを追加する関数
  const handleAddPenalty = (seconds) => {
    setPenaltySeconds(prev => prev + seconds);
  };

  const handleRetry = () => {
    setIsStarted(false); setIsCleared(false); setFinalTime(null);
    setMistakeCount(0); setRetryCount(prev => prev + 1);
    setPenaltySeconds(0); // 🌟 リトライ時にペナルティもリセット！
  };
  
  const handleUnitChange = (unitNum) => { setCurrentUnit(unitNum); handleRetry(); };
  const handleModeChange = (mode) => { if (gameMode !== mode) { setGameMode(mode); handleRetry(); } };

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#f0f8ff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 15px', gap: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} onClick={() => handleUnitChange(i + 1)} style={{
            backgroundColor: pastelColors[i], padding: '5px', borderRadius: '12px', cursor: 'pointer',
            boxShadow: currentUnit === i + 1 ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)', 
            transform: currentUnit === i + 1 ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s', flexShrink: 0
          }}>
            <div style={{ border: '2px dashed white', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', color: '#555' }}>Unit {i + 1}</div>
          </div>
        ))}
      </div>

      {hasData ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '10px', backgroundColor: '#e6f2ff' }}>
            <button onClick={() => handleModeChange('learning')} style={{
              padding: '8px 25px', borderRadius: '30px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: gameMode === 'learning' ? '#FF6B6B' : '#fff', color: gameMode === 'learning' ? '#fff' : '#888'
            }}>📖 じっくり学習</button>
            <button onClick={() => handleModeChange('random')} style={{
              padding: '8px 25px', borderRadius: '30px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: gameMode === 'random' ? '#4ECDC4' : '#fff', color: gameMode === 'random' ? '#fff' : '#888'
            }}>⚡ ランダムモード</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 20px' }}>
            <h1 style={{ margin: 0, fontSize: '2.0rem', fontFamily: '"Comic Sans MS", sans-serif', background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              English Story Match! <span style={{fontSize:'1.1rem', color:'#888', WebkitTextFillColor: '#888'}}> - Unit {currentUnit}</span>
            </h1>
            {gameMode === 'learning' && (
              // 🌟 Timer に penaltySeconds を渡す
              <Timer key={`timer-${retryCount}`} isStarted={isStarted} isCleared={isCleared} setFinalTime={setFinalTime} penaltySeconds={penaltySeconds} />
            )}
          </div>
          
          {gameMode === 'learning' ? (
            <MatchBoard 
              storyData={currentStoryData} onGameStart={handleGameStart} onGameClear={handleGameClear} onMistake={handleMistake} onRetry={handleRetry}
              mistakeCount={mistakeCount} unit={currentUnit} isCleared={isCleared} finalTime={finalTime} bestTime={bestTimes[currentUnit]} retryCount={retryCount}
              onHintUsed={handleAddPenalty} // 🌟 ヒントが使われたらペナルティ関数を呼ぶ
            />
          ) : (
            <RandomModeBoard 
              storyData={currentStoryData} unit={currentUnit} retryCount={retryCount} onRetry={handleRetry}
            />
          )}
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#888' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🚧</div>
          <h2 style={{ fontSize: '2rem' }}>Unit {currentUnit} is Coming Soon!</h2>
          <p style={{ fontSize: '1.2rem' }}>教材を作成中です。完成までお待ちください。</p>
        </div>
      )}
    </div>
  );
}

export default App;