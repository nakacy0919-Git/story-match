import React, { useState, useEffect } from 'react';
import Timer from './components/Timer';
import MatchBoard from './components/MatchBoard';
import RandomModeBoard from './components/RandomModeBoard';
import StoryModeBoard from './components/StoryModeBoard';
import ListeningModeBoard from './components/ListeningModeBoard'; // 🌟 新規追加
import HistoryBoard from './components/HistoryBoard';
import { allUnitsData } from './unitsData';

const pastelColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D0BAFF', '#FFB3F7', '#FFD1D1', '#FFF4E6', '#E6FFE6', '#E6F4FF', '#E6E6FA', '#FFE6E6', '#FFFFE6', '#E6FFFF'];

function App() {
  const [currentUnit, setCurrentUnit] = useState(2);
  const [view, setView] = useState('mode-select'); 
  const [gameMode, setGameMode] = useState('puzzle'); // reading, puzzle, random, listening
  const [level, setLevel] = useState(3);
  const [qCount, setQCount] = useState(12);
  const [isStarted, setIsStarted] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [finalTime, setFinalTime] = useState(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  
  const [studentInfo, setStudentInfo] = useState(() => JSON.parse(localStorage.getItem('storyMatchStudent')) || { class: '', number: '', name: '' });
  const [isRegistered, setIsRegistered] = useState(!!studentInfo.class && !!studentInfo.number && !!studentInfo.name);

  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('storyMatchHistory')) || []);
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

  const saveLearningLog = (data) => {
    const newLog = {
      date: new Date().toISOString(),
      unit: currentUnit,
      mode: data.mode,
      result: data.result,
      mistakes: data.mistakes || 0,
      level: data.level || null
    };
    const newHistory = [newLog, ...history].slice(0, 100);
    setHistory(newHistory);
    localStorage.setItem('storyMatchHistory', JSON.stringify(newHistory));
  };

  const handleGameClear = (resultData) => {
    setIsCleared(true);
    saveLearningLog({
      mode: gameMode,
      result: resultData.result,
      mistakes: mistakeCount,
      level: gameMode === 'puzzle' ? level : null
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (studentInfo.class && studentInfo.number && studentInfo.name) {
      localStorage.setItem('storyMatchStudent', JSON.stringify(studentInfo));
      setIsRegistered(true);
    }
  };

  const handleEditInfo = () => {
    const pw = prompt("先生のパスワードを入力してください（情報の書き換え）:");
    if (pw === "3939") {
      setIsRegistered(false);
    } else {
      alert("パスワードが違います。");
    }
  };

  const handleUnitChange = (unitNum) => {
    setCurrentUnit(unitNum);
    resetGameState();
    setView('mode-select');
  };

  const resetGameState = () => {
    setIsStarted(false); setIsCleared(false); setFinalTime(null);
    setMistakeCount(0); setRetryCount(prev => prev + 1); setPenaltySeconds(0);
    window.speechSynthesis.cancel(); // 🌟 モードを切り替えるときに音声を止める
  };

  const handleAddPenalty = (seconds) => setPenaltySeconds(prev => prev + seconds);

  const startReading = () => { resetGameState(); setView('game'); };
  const startPuzzle = (selectedLevel) => { setLevel(selectedLevel); resetGameState(); setView('game'); };
  
  // ランダムモードとリスニングモードの開始処理を統合
  const startQuiz = (count) => { setQCount(count === 'ALL' ? 12 : count); resetGameState(); setIsStarted(true); setView('game'); };

  if (!isRegistered) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f8ff' }}>
        <form onSubmit={handleRegister} style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '400px' }}>
          <h2 style={{ color: '#333', marginBottom: '30px', fontSize: '1.8rem' }}>🎓 Student Registration</h2>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>クラス</label>
            <input type="text" required value={studentInfo.class} onChange={(e) => setStudentInfo({...studentInfo, class: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #ddd', boxSizing: 'border-box', fontSize: '1.1rem' }} />
          </div>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>番号</label>
            <input type="number" required value={studentInfo.number} onChange={(e) => setStudentInfo({...studentInfo, number: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #ddd', boxSizing: 'border-box', fontSize: '1.1rem' }} />
          </div>
          <div style={{ marginBottom: '30px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>氏名</label>
            <input type="text" required value={studentInfo.name} onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #ddd', boxSizing: 'border-box', fontSize: '1.1rem' }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: '#6c5ce7', color: '#fff', border: 'none', borderRadius: '15px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>Start Learning</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#f0f8ff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 15px', gap: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flexShrink: 0 }}>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {view === 'mode-select' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px', alignItems: 'center', padding: '20px', position: 'relative' }}>
              
              <div style={{ position: 'absolute', top: '20px', left: '30px', textAlign: 'left', backgroundColor: '#fff', padding: '15px 25px', borderRadius: '20px', border: '3px solid #eee', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '5px' }}>Student Profile</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>{studentInfo.class} - {studentInfo.number}番 - {studentInfo.name}</div>
                <button onClick={handleEditInfo} style={{ border: 'none', background: 'none', color: '#6c5ce7', textDecoration: 'underline', padding: 0, marginTop: '5px', fontSize: '0.9rem', cursor: 'pointer' }}>情報を変更する</button>
              </div>

              <button 
                onClick={() => setView('history')}
                style={{ position: 'absolute', top: '20px', right: '30px', background: '#fff', border: '4px solid #6c5ce7', borderRadius: '50%', width: '80px', height: '80px', fontSize: '2.5rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)', transition: 'transform 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="学習の記録を見る"
              >
                📊
              </button>

              <h2 style={{ fontSize: '2.5rem', color: '#555', marginBottom: '20px' }}>Select Game Mode - Unit {currentUnit}</h2>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                
                <div onClick={() => { setGameMode('reading'); startReading(); }} className="mode-card" style={{ border: '5px solid #4CAF50' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '10px' }}>📖</div>
                  <h3 style={{ color: '#4CAF50', fontSize: '1.6rem', margin: '15px 0' }}>じっくり学習</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.4' }}>絵本のように<br/>ストーリーを読む</p>
                </div>

                <div onClick={() => { setGameMode('puzzle'); setView('settings-select'); }} className="mode-card" style={{ border: '5px solid #FF6B6B' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '10px' }}>🧩</div>
                  <h3 style={{ color: '#FF6B6B', fontSize: '1.6rem', margin: '15px 0' }}>パズルモード</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.4' }}>空欄に画像を当てはめ<br/>物語を完成させる</p>
                </div>

                <div onClick={() => { setGameMode('random'); setView('settings-select'); }} className="mode-card" style={{ border: '5px solid #4ECDC4' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '10px' }}>⚡</div>
                  <h3 style={{ color: '#4ECDC4', fontSize: '1.6rem', margin: '15px 0' }}>ランダムモード</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.4' }}>英文からイラストを<br/>素早く見極める</p>
                </div>

                {/* 🌟 4. 新しいリスニングモードカード */}
                <div onClick={() => { setGameMode('listening'); setView('settings-select'); }} className="mode-card" style={{ border: '5px solid #9C27B0' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '10px' }}>🎧</div>
                  <h3 style={{ color: '#9C27B0', fontSize: '1.6rem', margin: '15px 0' }}>リスニング</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.4' }}>流れる音声を聞いて<br/>正しい画像を選ぶ</p>
                </div>

              </div>
            </div>
          )}

          {view === 'history' && <HistoryBoard history={history} onBack={() => setView('mode-select')} />}

          {view === 'settings-select' && gameMode === 'puzzle' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
              <h2 style={{ fontSize: '2.5rem', color: '#FF6B6B' }}>Select Puzzle Level</h2>
              <div style={{ display: 'flex', gap: '30px' }}>
                <button onClick={() => startPuzzle(1)} className="level-btn" style={{ backgroundColor: '#FFD700' }}>Level 1<br/><span style={{fontSize:'1rem'}}>(6枚ヒント)</span></button>
                <button onClick={() => startPuzzle(2)} className="level-btn" style={{ backgroundColor: '#FF8C00' }}>Level 2<br/><span style={{fontSize:'1rem'}}>(3枚ヒント)</span></button>
                <button onClick={() => startPuzzle(3)} className="level-btn" style={{ backgroundColor: '#FF4500' }}>Level 3<br/><span style={{fontSize:'1rem'}}>(すべて空欄)</span></button>
              </div>
              <button onClick={() => setView('mode-select')} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline', fontSize: '1.2rem' }}>← もどる</button>
            </div>
          )}

          {/* ランダムモード・リスニングモード共通の設定画面 */}
          {view === 'settings-select' && (gameMode === 'random' || gameMode === 'listening') && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
              <h2 style={{ fontSize: '2.5rem', color: gameMode === 'random' ? '#4ECDC4' : '#9C27B0' }}>Select Question Count</h2>
              <div style={{ display: 'flex', gap: '30px' }}>
                <button onClick={() => startQuiz(5)} className="count-btn" style={{ backgroundColor: gameMode === 'random' ? '#4ECDC4' : '#9C27B0' }}>5問</button>
                <button onClick={() => startQuiz(8)} className="count-btn" style={{ backgroundColor: gameMode === 'random' ? '#4ECDC4' : '#9C27B0' }}>8問</button>
                <button onClick={() => startQuiz('ALL')} className="count-btn" style={{ backgroundColor: gameMode === 'random' ? '#4ECDC4' : '#9C27B0' }}>ALL<br/><span style={{fontSize:'1rem'}}>(全12問)</span></button>
              </div>
              <button onClick={() => setView('mode-select')} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline', fontSize: '1.2rem' }}>← もどる</button>
            </div>
          )}

          {view === 'game' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', flexShrink: 0 }}>
                <button onClick={() => { setView('mode-select'); window.speechSynthesis.cancel(); }} style={{ padding: '10px 20px', borderRadius: '15px', border: 'none', backgroundColor: '#ddd', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'background-color 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#ccc'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#ddd'}>🏠 Quit</button>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontFamily: '"Comic Sans MS", sans-serif', background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Unit {currentUnit} {gameMode === 'puzzle' ? `- L${level}` : ''}
                </h1>
                {gameMode === 'puzzle' ? <Timer key={`timer-${retryCount}`} isStarted={isStarted} isCleared={isCleared} setFinalTime={setFinalTime} penaltySeconds={penaltySeconds} /> : <div style={{ width: '120px' }}></div>}
              </div>

              {gameMode === 'reading' && <StoryModeBoard storyData={currentStoryData} unit={currentUnit} />}
              {gameMode === 'puzzle' && (
                <MatchBoard 
                  storyData={currentStoryData} onGameStart={() => setIsStarted(true)} 
                  onGameClear={() => handleGameClear({ result: finalTime || 0 })} 
                  onMistake={() => setMistakeCount(prev => prev + 1)} onRetry={resetGameState}
                  mistakeCount={mistakeCount} unit={currentUnit} isCleared={isCleared} finalTime={finalTime} bestTime={bestTimes[`${currentUnit}-L${level}`]} retryCount={retryCount}
                  onHintUsed={handleAddPenalty} level={level}
                  studentInfo={studentInfo} 
                />
              )}
              {gameMode === 'random' && (
                <RandomModeBoard 
                  storyData={currentStoryData} unit={currentUnit} retryCount={retryCount} onRetry={resetGameState} qCount={qCount}
                  onGameClear={(score) => handleGameClear({ result: score })}
                  studentInfo={studentInfo} 
                />
              )}
              {/* 🌟 リスニングモードの呼び出し */}
              {gameMode === 'listening' && (
                <ListeningModeBoard 
                  storyData={currentStoryData} unit={currentUnit} retryCount={retryCount} onRetry={resetGameState} qCount={qCount}
                  onGameClear={(score) => handleGameClear({ result: score })}
                  studentInfo={studentInfo} 
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
        .mode-card { cursor: pointer; padding: 40px 20px; background-color: #fff; border-radius: 25px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); width: 230px; box-sizing: border-box; transition: transform 0.2s, box-shadow 0.2s; }
        .mode-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(0,0,0,0.2); }
        .level-btn, .count-btn { padding: 20px 35px; font-size: 1.5rem; font-weight: bold; color: #fff; border: none; border-radius: 18px; cursor: pointer; box-shadow: 0 6px 10px rgba(0,0,0,0.15); transition: transform 0.2s, box-shadow 0.2s; line-height: 1.4; }
        .level-btn:hover, .count-btn:hover { transform: scale(1.05); box-shadow: 0 8px 15px rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
}

export default App;