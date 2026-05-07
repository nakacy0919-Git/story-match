import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (type === 'correct') {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; const startTime = ctx.currentTime + i * 0.05; 
      osc.frequency.setValueAtTime(freq, startTime); gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      osc.start(startTime); osc.stop(startTime + 0.5);
    });
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

const MatchBoard = ({ storyData, onGameStart, onGameClear, onMistake, onRetry, mistakeCount, unit, isCleared, finalTime, bestTime, retryCount, onHintUsed, level }) => {
  const [slots, setSlots] = useState(Array(12).fill(null));
  const [deck, setDeck] = useState([]);
  const [correctFlags, setCorrectFlags] = useState(Array(12).fill(false));
  const [hintFlags, setHintFlags] = useState(Array(12).fill(false));
  const [errorSlot, setErrorSlot] = useState(null);

  useEffect(() => {
    if (!storyData) return;
    
    let initialSlots = Array(12).fill(null);
    let initialFlags = Array(12).fill(false);
    
    // 🌟 Levelに応じてヒントとして埋めるインデックスを決定
    let hintIndices = [];
    if (level === 1) hintIndices = [0, 2, 4, 6, 8, 10]; // 6枚
    if (level === 2) hintIndices = [0, 5, 11]; // 3枚
    
    hintIndices.forEach(idx => {
      initialSlots[idx] = { id: (idx + 1).toString(), url: process.env.PUBLIC_URL + `/images/unit${unit}/${idx + 1}.webp` };
      initialFlags[idx] = true;
    });

    setSlots(initialSlots);
    setCorrectFlags(initialFlags);
    setHintFlags(Array(12).fill(false));
    setErrorSlot(null);
    
    // 山札には埋まっていないカードだけを入れる
    const deckImages = Array.from({ length: 12 }, (_, i) => ({
      id: (i + 1).toString(), 
      url: process.env.PUBLIC_URL + `/images/unit${unit}/${i + 1}.webp` 
    })).filter(img => !hintIndices.includes(parseInt(img.id) - 1))
      .sort(() => Math.random() - 0.5);
      
    setDeck(deckImages);
  }, [unit, retryCount, storyData, level]);

  useEffect(() => { if (isCleared) playSound('fanfare'); }, [isCleared]);

  const handleHintClick = (index) => {
    if (correctFlags[index] || hintFlags[index]) return;
    const newHintFlags = [...hintFlags];
    newHintFlags[index] = true;
    setHintFlags(newHintFlags);
    if (onHintUsed) onHintUsed(10);
  };

  const handleOnDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    let newSlots = [...slots];
    let newDeck = [...deck];
    let movedItem = null;

    if (source.droppableId === 'deck') {
      movedItem = newDeck.splice(source.index, 1)[0];
    } else {
      const slotIdx = parseInt(source.droppableId.split('-')[1]);
      movedItem = newSlots[slotIdx];
      newSlots[slotIdx] = null;
    }

    if (destination.droppableId.startsWith('slot')) {
      const slotIdx = parseInt(destination.droppableId.split('-')[1]);
      if (movedItem.id === (slotIdx + 1).toString()) {
        playSound('correct');
        newSlots[slotIdx] = movedItem;
        const newFlags = [...correctFlags];
        newFlags[slotIdx] = true;
        setCorrectFlags(newFlags);
      } else {
        playSound('wrong');
        onMistake(); 
        setErrorSlot(slotIdx);
        setTimeout(() => setErrorSlot(null), 600);
        newDeck.splice(source.index, 0, movedItem);
      }
    } else {
      newDeck.splice(destination.index, 0, movedItem);
    }

    setSlots(newSlots);
    setDeck(newDeck);
    if (newSlots.every((s, i) => s && s.id === (i + 1).toString())) onGameClear();
  };

  if (!storyData) return null;

  return (
    <DragDropContext onDragStart={onGameStart} onDragEnd={handleOnDragEnd}>
      <div style={{ display: 'flex', gap: '15px', flex: 1, boxSizing: 'border-box', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        
        {isCleared && (
          <div style={{ position: 'absolute', top: 0, left: '20px', width: 'calc((100% - 40px) * 2.5 / 4)', height: '100%', pointerEvents: 'none', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)' }}>
            <h1 style={{ fontSize: '6rem', color: '#FFD700', textShadow: '0 0 20px #FF8C00, 4px 4px 0px #d35400', animation: 'zoomBounce 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', transform: 'scale(0)' }}>MISSION CLEAR!</h1>
          </div>
        )}

        <div style={{ flex: 2.5, overflowY: 'auto', paddingRight: '8px', marginLeft: '20px', marginBottom: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {storyData.map((data, index) => (
              <div key={index} className={errorSlot === index ? 'shake-animation' : ''} style={{ 
                display: 'flex', flexDirection: 'column', backgroundColor: '#fff', 
                borderRadius: '12px', border: correctFlags[index] ? '3px solid #4caf50' : (errorSlot === index ? '3px solid #f44336' : '1px solid #ccc'),
                padding: '8px', boxSizing: 'border-box', position: 'relative', boxShadow: correctFlags[index] ? '0 0 15px rgba(76, 175, 80, 0.4)' : '0 2px 5px rgba(0,0,0,0.05)', transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '6px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#222', lineHeight: '1.25', textAlign: 'left', flex: 1 }}>{index + 1}. {data.en}</div>
                    {!correctFlags[index] && !hintFlags[index] && (
                      <button onClick={() => handleHintClick(index)} className="hint-btn">💡</button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: (hintFlags[index] && !correctFlags[index]) ? '#f57c00' : '#666', marginTop: '4px', lineHeight: '1.25', opacity: (correctFlags[index] || hintFlags[index]) ? 1 : 0, height: (correctFlags[index] || hintFlags[index]) ? 'auto' : 0, transition: 'opacity 0.5s', overflow: 'hidden', textAlign: 'left' }}>
                    {hintFlags[index] && !correctFlags[index] && <span style={{fontSize: '0.65rem', fontWeight: 'bold'}}>[HINT] </span>}{data.ja}
                  </div>
                </div>
                <Droppable droppableId={`slot-${index}`} isDropDisabled={correctFlags[index]}>
                  {(provided, snapshot) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} style={{ width: '100%', aspectRatio: '4 / 3', backgroundColor: correctFlags[index] ? '#e8f5e9' : (errorSlot === index ? '#ffebee' : (snapshot.isDraggingOver ? '#e3f2fd' : '#f8f9fa')), border: '2px dashed #b0bec5', borderRadius: '8px', position: 'relative' }}>
                      {slots[index] && (
                        <Draggable key={slots[index].id} draggableId={`drag-${slots[index].id}`} index={0} isDragDisabled={correctFlags[index]}>
                          {(p, snap) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} style={{ ...p.draggableProps.style, ...(snap.isDragging ? { width: '160px', height: '120px', zIndex: 9999, opacity: 0.95, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', borderRadius: '8px' } : { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }) }}>
                              <img src={slots[index].url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: snap.isDragging ? '8px' : '6px' }} alt={`scene-${index+1}`} />
                            </div>
                          )}
                        </Draggable>
                      )}
                      <div style={{ display: 'none' }}>{provided.placeholder}</div>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                        {correctFlags[index] && (
                          <><div className="correct-ripple"></div><div className="pop-icon-gorgeous" style={{ color: '#4caf50', fontSize: '4rem', filter: 'drop-shadow(0px 0px 8px rgba(76, 175, 80, 0.8))' }}>⭕</div></>
                        )}
                        {errorSlot === index && <div className="pop-icon" style={{ color: '#f44336', fontSize: '3rem' }}>❌</div>}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>

        {isCleared ? (
          <div style={{ flex: 1.5, backgroundColor: '#fff', borderRadius: '15px', padding: '20px', border: '3px solid #FFD700', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(255, 215, 0, 0.3)', animation: 'fadeIn 1s', position: 'relative', zIndex: 1001, marginRight: '20px', marginBottom: '15px' }}>
            <h2 style={{ color: '#FF8C00', fontSize: '2rem', margin: '0 0 15px', borderBottom: '3px dashed #FFD700', paddingBottom: '10px' }}>RESULT</h2>
            <div style={{ textAlign: 'center', margin: '5px 0' }}><div style={{ fontSize: '1rem', color: '#666', fontWeight: 'bold' }}>Time</div><div style={{ fontSize: '2.5rem', color: '#4caf50', fontWeight: '900' }}>{finalTime}s</div></div>
            <div style={{ textAlign: 'center', margin: '10px 0', padding: '10px', backgroundColor: '#fff8e1', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }}><div style={{ fontSize: '0.9rem', color: '#f57c00', fontWeight: 'bold' }}>Best Record</div><div style={{ fontSize: '1.5rem', color: '#ff9800', fontWeight: 'bold' }}>{bestTime ? `${bestTime}s` : '-s'}</div></div>
            <div style={{ textAlign: 'center', margin: '5px 0 15px', fontSize: '1.1rem', fontWeight: 'bold', color: mistakeCount === 0 ? '#4caf50' : '#f44336' }}>Mistakes: {mistakeCount}</div>
            <button onClick={onRetry} className="retry-btn">🔄 Retry</button>
          </div>
        ) : (
          <div style={{ flex: 1.5, overflowY: 'auto', paddingRight: '5px', marginRight: '20px', marginBottom: '15px' }}>
            <Droppable droppableId="deck" direction="horizontal">
              {(provided, snapshot) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start', backgroundColor: snapshot.isDraggingOver ? '#f1f8e9' : '#fff', borderRadius: '15px', padding: '12px', border: '2px solid #ddd', minHeight: '100%' }}>
                  {deck.map((item, index) => (
                    <Draggable key={item.id} draggableId={`deck-${item.id}`} index={index}>
                      {(p, snap) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} style={{ ...p.draggableProps.style, ...(snap.isDragging ? { width: '160px', height: '120px', zIndex: 9999, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', borderRadius: '8px' } : { width: 'calc(33.333% - 6px)', aspectRatio: '4 / 3' }) }}>
                          <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', display: 'block' }} alt="card" />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        )}
      </div>
      <style>{`
        .shake-animation { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-3px, 0, 0); } 20%, 80% { transform: translate3d(4px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-6px, 0, 0); } 40%, 60% { transform: translate3d(6px, 0, 0); } }
        .pop-icon-gorgeous { animation: gorgeousPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes gorgeousPop { 0% { transform: scale(0.5) rotate(-20deg); opacity: 0; } 30% { transform: scale(1.4) rotate(15deg); opacity: 1; } 50% { transform: scale(1.2) rotate(0deg); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
        .correct-ripple { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 6px solid #4caf50; border-radius: 8px; box-sizing: border-box; animation: ripple 0.6s ease-out forwards; pointer-events: none; }
        @keyframes ripple { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.15); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .retry-btn { padding: 12px 30px; font-size: 1.2rem; font-weight: bold; color: #fff; background-color: #008CBA; border: none; border-radius: 30px; cursor: pointer; }
        .hint-btn { background: #fff9c4; border: 1px solid #fbc02d; border-radius: 50%; width: 24px; height: 24px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 5px; }
      `}</style>
    </DragDropContext>
  );
};

export default MatchBoard;