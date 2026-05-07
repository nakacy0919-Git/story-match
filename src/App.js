import React, { useState, useEffect } from 'react';
import Timer from './components/Timer';
import MatchBoard from './components/MatchBoard';
import RandomModeBoard from './components/RandomModeBoard';
import StoryModeBoard from './components/StoryModeBoard'; // 🌟 新しいモードを読み込み！
import { allUnitsData } from './unitsData';

const pastelColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D0BAFF', '#FFB3F7', '#FFD1D1', '#FFF4E6', '#E6FFE6', '#E6F4FF', '#E6E6FA', '#FFE6E6', '#FFFFE6', '#E6FFFF'];

function App() {
  const [currentUnit, setCurrentUnit] = useState(2);
  const [view, setView] = useState('mode-select'); // mode-select, settings-select, game
  const [gameMode, setGameMode] = useState('puzzle'); // reading, puzzle, random
  const [level, setLevel] = useState(3);
  const [qCount, setQCount] = useState(12);
  
  const [isStarted, setIsStarted] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [finalTime, setFinalTime] = useState(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [bestTimes, setBestTimes] = useState(() => JSON.parse(localStorage.getItem('storyMatchBestTimes')) || {});

  const currentStoryData = allUnitsData[currentUnit];
  const hasData = currentStoryData && currentStoryData.length === 12;

  useEffect(() => {
    if (gameMode === 'puzzle' && isCleared && finalTime !== null) {
      const bestKey = `${currentUnit}-L${level}`;
      const currentBest = bestTimes[bestKey];
      if (!currentBest || finalTime < currentBest) {
        const newBests = { ...bestTimes, [bestKey]: finalTime };
        setBestTimes(newBests);
        localStorage.setItem('storyMatchBestTimes', JSON.stringify(newBests));
      }
    }
  }, [isCleared, finalTime, currentUnit, bestTimes, gameMode, level]);

  const handleGameStart = () => { if (!isStarted) setIsStarted(true); };
  const handleGameClear = () => setIsCleared(true);
  const handleMistake = () => setMistakeCount(prev => prev + 1);
  const handleAddPenalty = (seconds) => setPenaltySeconds(prev => prev + seconds);
  
  const resetGameState = () => {
    setIsStarted(false); setIsCleared(false); setFinalTime(null);
    setMistakeCount(0); setRetryCount(prev => prev + 1); setPenaltySeconds(0);
  };

  const handleRetry = () => { resetGameState(); };

  const handleUnitChange = (unitNum) => {
    setCurrentUnit(unitNum);
    resetGameState();
    setView('mode-select');
  };

  const startReading = () => {
    resetGameState();
    setView('game');
  };

  const startPuzzle = (selectedLevel) => {
    setLevel(selectedLevel);
    resetGameState();
    setView('game');
  };

  const startRandom = (count) => {
    setQCount(count === 'ALL' ? 12 : count);
    resetGameState();
    setIsStarted(true);
    setView('game');
  };

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#f0f8ff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Unit選択 */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 15px', gap: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flexShrink: 0 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} onClick={() => handleUnitChange(i + 1)} style={{
            backgroundColor: pastelColors[i], padding: '5px', borderRadius: '12px', cursor: 'pointer',
            boxShadow: currentUnit === i + 1 ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            transform: currentUnit === i + 1 ? 'scale(1.05)' : 'scale(1)', flexShrink: 0
          }}>
            <div style={{ border: '2px dashed white', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', color: '#555' }}>Unit {i + 1}</div>
          </div>
        ))}
      </div>

      {hasData ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* 🌟 新しいモード選択画面 */}
          {view === 'mode-select' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px', alignItems: 'center', padding: '20px' }}>
              <h2 style={{ fontSize: '2.5rem', color: '#555', marginBottom: '20px' }}>Select Game Mode - Unit {currentUnit}</h2>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                
                {/* 1. じっくり学習（絵本モード） */}
                <div onClick={() => { setGameMode('reading'); startReading(); }} className="mode-card" style={{ border: '5px solid #4CAF50' }}>
                  <div style={{ fontSize: '4.5rem' }}>📖</div>
                  <h3 style={{ color: '#4CAF50', fontSize: '1.8rem', margin: '15px 0' }}>じっくり学習</h3>
                  <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.4' }}>絵本のように<br/>ストーリーを読む</p>
                </div>

                {/* 2. パズルモード（D&D） */}
                <div onClick={() => { setGameMode('puzzle'); setView('settings-select'); }} className="mode-card" style={{ border: '5px solid #FF6B6B' }}>
                  <div style={{ fontSize: '4.5rem' }}>🧩</div>
                  <h3 style={{ color: '#FF6B6B', fontSize: '1.8rem', margin: '15px 0' }}>パズルモード</h3>
                  <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.4' }}>空欄に画像を当てはめ<br/>物語を完成させる</p>
                </div>

                {/* 3. ランダムモード */}
                <div onClick={() => { setGameMode('random'); setView('settings-select'); }} className="mode-card" style={{ border: '5px solid #4ECDC4' }}>
                  <div style={{ fontSize: '4.5rem' }}>⚡</div>
                  <h3 style={{ color: '#4ECDC4', fontSize: '1.8rem', margin: '15px 0' }}>ランダムモード</h3>
                  <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.4' }}>英文からイラストを<br/>素早く見極める</p>
                </div>

              </div>
            </div>
          )}

          {view === 'settings-select' && gameMode === 'puzzle' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
              <h2 style={{ fontSize: '2rem', color: '#FF6B6B' }}>Select Puzzle Level</h2>
              <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={() => startPuzzle(1)} className="level-btn" style={{ backgroundColor: '#FFD700' }}>Level 1 (6枚ヒント)</button>
                <button onClick={() => startPuzzle(2)} className="level-btn" style={{ backgroundColor: '#FF8C00' }}>Level 2 (3枚ヒント)</button>
                <button onClick={() => startPuzzle(3)} className="level-btn" style={{ backgroundColor: '#FF4500' }}>Level 3 (すべて空欄)</button>
              </div>
              <button onClick={() => setView('mode-select')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline', fontSize: '1.2rem' }}>← Back to mode select</button>
            </div>
          )}

          {view === 'settings-select' && gameMode === 'random' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
              <h2 style={{ fontSize: '2rem', color: '#4ECDC4' }}>Select Question Count</h2>
              <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={() => startRandom(5)} className="count-btn">5 Questions</button>
                <button onClick={() => startRandom(8)} className="count-btn">8 Questions</button>
                <button onClick={() => startRandom('ALL')} className="count-btn">ALL (12 Questions)</button>
              </div>
              <button onClick={() => setView('mode-select')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline', fontSize: '1.2rem' }}>← Back to mode select</button>
            </div>
          )}

          {/* ゲーム画面のヘッダー＆ボード表示 */}
          {view === 'game' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', flexShrink: 0 }}>
                <button onClick={() => setView('mode-select')} style={{ padding: '10px 20px', borderRadius: '15px', border: 'none', backgroundColor: '#ddd', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>🏠 Quit</button>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontFamily: '"Comic Sans MS", sans-serif', background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Unit {currentUnit} {gameMode === 'reading' ? '- Reading' : gameMode === 'puzzle' ? `- Level ${level}` : '- Random'}
                </h1>
                
                {/* じっくり学習モードの時はタイマーを隠す */}
                {gameMode === 'puzzle' ? (
                  <Timer key={`timer-${retryCount}`} isStarted={isStarted} isCleared={isCleared} setFinalTime={setFinalTime} penaltySeconds={penaltySeconds} />
                ) : (
                  <div style={{ width: '120px' }}></div> 
                )}
              </div>

              {/* 選んだモードによって表示するボードを切り替える */}
              {gameMode === 'reading' && (
                <StoryModeBoard storyData={currentStoryData} unit={currentUnit} />
              )}
              {gameMode === 'puzzle' && (
                <MatchBoard 
                  storyData={currentStoryData} onGameStart={handleGameStart} onGameClear={handleGameClear} onMistake={handleMistake} onRetry={handleRetry}
                  mistakeCount={mistakeCount} unit={currentUnit} isCleared={isCleared} finalTime={finalTime} bestTime={bestTimes[`${currentUnit}-L${level}`]} retryCount={retryCount}
                  onHintUsed={handleAddPenalty} level={level}
                />
              )}
              {gameMode === 'random' && (
                <RandomModeBoard 
                  storyData={currentStoryData} unit={currentUnit} retryCount={retryCount} onRetry={handleRetry} qCount={qCount}
                />
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#888' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🚧</div>
          <h2 style={{ fontSize: '2rem' }}>Unit {currentUnit} is Coming Soon!</h2>
          <p style={{ fontSize: '1.2rem' }}>教材を作成中です。完成までお待ちください。</p>
        </div>
      )}
      <style>{`
        .mode-card { cursor: pointer; padding: 40px; backgroundColor: #fff; border-radius: 25px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); width: 280px; transition: transform 0.2s, box-shadow 0.2s; background-color: #ffffff; }
        .mode-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(0,0,0,0.2); }
        .level-btn, .count-btn { padding: 20px 30px; font-size: 1.2rem; font-weight: bold; color: #fff; border: none; border-radius: 15px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .count-btn { background-color: #4ECDC4; }
        .level-btn:hover, .count-btn:hover { transform: scale(1.05); }
      `}</style>
    </div>
  );
}

export default App;