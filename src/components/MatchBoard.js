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

const MatchBoard = ({ storyData, onGameStart, onGameClear, onMistake, onRetry, mistakeCount, unit, isCleared, finalTime, bestTime, retryCount, onHintUsed, level, studentInfo }) => {
  const [slots, setSlots] = useState(Array(12).fill(null));
  const [deck, setDeck] = useState([]);
  const [correctFlags, setCorrectFlags] = useState(Array(12).fill(false));
  const [hintFlags, setHintFlags] = useState(Array(12).fill(false));
  const [errorSlot, setErrorSlot] = useState(null);

  useEffect(() => {
    if (!storyData) return;
    let initialSlots = Array(12).fill(null);
    let initialFlags = Array(12).fill(false);
    let hintIndices = [];
    if (level === 1) hintIndices = [0, 2, 4, 6, 8, 10];
    if (level === 2) hintIndices = [0, 5, 11];
    hintIndices.forEach(idx => {
      initialSlots[idx] = { id: (idx + 1).toString(), url: process.env.PUBLIC_URL + `/images/unit${unit}/${idx + 1}.webp` };
      initialFlags[idx] = true;
    });
    setSlots(initialSlots);
    setCorrectFlags(initialFlags);
    setHintFlags(Array(12).fill(false));
    setErrorSlot(null);
    const deckImages = Array.from({ length: 12 }, (_, i) => ({
      id: (i + 1).toString(), 
      url: process.env.PUBLIC_URL + `/images/unit${unit}/${i + 1}.webp` 
    })).filter(img => !hintIndices.includes(parseInt(img.id) - 1)).sort(() => Math.random() - 0.5);
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
    } else { newDeck.splice(destination.index, 0, movedItem); }
    setSlots(newSlots); setDeck(newDeck);
    if (newSlots.every((s, i) => s && s.id === (i + 1).toString())) onGameClear();
  };

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
              <div key={index} className={errorSlot === index ? 'shake-animation' : ''} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRadius: '12px', border: correctFlags[index] ? '3px solid #4caf50' : (errorSlot === index ? '3px solid #f44336' : '1px solid #ccc'), padding: '8px', boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '6px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#222', flex: 1 }}>{index + 1}. {data.en}</div>
                    {!correctFlags[index] && !hintFlags[index] && <button onClick={() => handleHintClick(index)} className="hint-btn">💡</button>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: (hintFlags[index] && !correctFlags[index]) ? '#f57c00' : '#666', marginTop: '4px', opacity: (correctFlags[index] || hintFlags[index]) ? 1 : 0 }}>{data.ja}</div>
                </div>
                <Droppable droppableId={`slot-${index}`} isDropDisabled={correctFlags[index]}>
                  {(provided, snapshot) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} style={{ width: '100%', aspectRatio: '4 / 3', backgroundColor: correctFlags[index] ? '#e8f5e9' : (errorSlot === index ? '#ffebee' : (snapshot.isDraggingOver ? '#e3f2fd' : '#f8f9fa')), border: '2px dashed #b0bec5', borderRadius: '8px', position: 'relative' }}>
                      {slots[index] && (
                        <Draggable key={slots[index].id} draggableId={`drag-${slots[index].id}`} index={0} isDragDisabled={correctFlags[index]}>
                          {(p, snap) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} style={{ ...p.draggableProps.style, ...(snap.isDragging ? { width: '160px', height: '120px', zIndex: 9999 } : { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }) }}>
                              <img src={slots[index].url} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', backgroundColor: '#fff', borderRadius: snap.isDragging ? '8px' : '6px' }} alt="scene" />
                            </div>
                          )}
                        </Draggable>
                      )}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                        {correctFlags[index] && <><div className="correct-ripple"></div><div className="pop-icon-gorgeous" style={{ color: '#4caf50', fontSize: '4rem' }}>⭕</div></>}
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
          <div style={{ flex: 1.5, backgroundColor: '#fff', borderRadius: '15px', padding: '20px', border: '3px solid #FFD700', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginRight: '20px', marginBottom: '15px' }}>
            {/* 🌟 リザルト画面に クラス・番号・氏名 を表示 */}
            <div style={{ marginBottom: '10px', padding: '5px 15px', backgroundColor: '#333', color: '#fff', borderRadius: '10px', fontWeight: 'bold' }}>
              {studentInfo.class} - {studentInfo.number}番 - {studentInfo.name}
            </div>
            <h2 style={{ color: '#FF8C00', fontSize: '2rem', margin: '0 0 10px' }}>RESULT</h2>
            <div style={{ fontSize: '2.5rem', color: '#4caf50', fontWeight: '900' }}>{finalTime}s</div>
            <div style={{ fontSize: '1rem', color: '#666' }}>Best: {bestTime || '-'}s</div>
            <div style={{ marginTop: '10px' }}>Mistakes: {mistakeCount}</div>
            <button onClick={onRetry} className="retry-btn">🔄 Retry</button>
          </div>
        ) : (
          <div style={{ flex: 1.5, overflowY: 'auto', paddingRight: '5px', marginRight: '20px', marginBottom: '15px' }}>
            <Droppable droppableId="deck" direction="horizontal">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', backgroundColor: '#fff', borderRadius: '15px', padding: '12px', border: '2px solid #ddd', minHeight: '100%' }}>
                  {deck.map((item, index) => (
                    <Draggable key={item.id} draggableId={`deck-${item.id}`} index={index}>
                      {(p, snap) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} style={{ ...p.draggableProps.style, ...(snap.isDragging ? { width: '160px', height: '120px' } : { width: 'calc(33.333% - 6px)', aspectRatio: '4/3' }) }}>
                          <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', backgroundColor: '#fff', borderRadius: '8px' }} alt="card" />
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
      <style>{`.pop-icon-gorgeous { animation: gorgeousPop 0.8s forwards; } @keyframes gorgeousPop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1.8); opacity: 0; } }`}</style>
    </DragDropContext>
  );
};

export default MatchBoard;