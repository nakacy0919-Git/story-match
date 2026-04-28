import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'correct') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, ctx.currentTime); osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } else if (type === 'wrong') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'fanfare') {
    osc.type = 'square';
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15); });
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05); gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.45); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.start(); osc.stop(ctx.currentTime + 1.2);
  }
};

const MatchBoard = ({ storyData, onGameStart, onGameClear, onMistake, onRetry, mistakeCount, unit, isCleared, finalTime, bestTime, retryCount }) => {
  const [slots, setSlots] = useState(Array(12).fill(null));
  const [deck, setDeck] = useState([]);
  const [correctFlags, setCorrectFlags] = useState(Array(12).fill(false));
  const [errorSlot, setErrorSlot] = useState(null);

  useEffect(() => {
    if (!storyData) return; // データがない場合は何もしない

    setSlots(Array(12).fill(null));
    setCorrectFlags(Array(12).fill(false));
    setErrorSlot(null);
    
    const initialImages = Array.from({ length: 12 }, (_, i) => ({
      id: (i + 1).toString(), 
      // 🌟 画像パスを Unit ごとに分ける
      url: process.env.PUBLIC_URL + `/images/unit${unit}/${i + 1}.webp` 
    })).sort(() => Math.random() - 0.5);
    
    setDeck(initialImages);
  }, [unit, retryCount, storyData]);

  useEffect(() => { if (isCleared) playSound('fanfare'); }, [isCleared]);

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
        const existingItem = newSlots[slotIdx];
        newSlots[slotIdx] = movedItem;
        if (existingItem) newDeck.push(existingItem);
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

  // 🌟 ここから下の描画部分は storyData を使います
  if (!storyData) return null;

  return (
    <>
      {isCleared && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)' }}>
          <h1 style={{ fontSize: '6rem', color: '#FFD700', textShadow: '0 0 20px #FF8C00, 4px 4px 0px #d35400', animation: 'zoomBounce 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', transform: 'scale(0)' }}>MISSION CLEAR!</h1>
        </div>
      )}

      <DragDropContext onDragStart={onGameStart} onDragEnd={handleOnDragEnd}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, padding: '0 20px 15px', boxSizing: 'border-box', overflow: 'hidden' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '10px', flex: 2.0 }}>
            {storyData.map((data, index) => (
              <div key={index} className={errorSlot === index ? 'shake-animation' : ''} style={{ 
                display: 'flex', flexDirection: 'column', backgroundColor: '#fff', 
                borderRadius: '12px', border: correctFlags[index] ? '3px solid #4caf50' : (errorSlot === index ? '3px solid #f44336' : '1px solid #ccc'),
                padding: '6px', boxSizing: 'border-box', position: 'relative', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'border 0.2s'
              }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#222', lineHeight: '1.2' }}>{index + 1}. {data.en}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', lineHeight: '1.2', opacity: correctFlags[index] ? 1 : 0, height: correctFlags[index] ? 'auto' : 0, transition: 'opacity 0.5s', overflow: 'hidden' }}>{data.ja}</div>
                </div>
                <Droppable droppableId={`slot-${index}`}>
                  {(provided, snapshot) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} style={{
                      width: '100%', aspectRatio: '4 / 3', 
                      backgroundColor: correctFlags[index] ? '#e8f5e9' : (errorSlot === index ? '#ffebee' : (snapshot.isDraggingOver ? '#e3f2fd' : '#f8f9fa')),
                      border: '2px dashed #b0bec5', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden'
                    }}>
                      {slots[index] ? (
                        <Draggable key={slots[index].id} draggableId={`drag-${slots[index].id}`} index={0} isDragDisabled={correctFlags[index]}>
                          {(p, snap) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} style={{ 
                              ...p.draggableProps.style, 
                              ...(snap.isDragging ? {} : { width: '100%', height: '100%' })
                            }}>
                              <img src={slots[index].url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '6px' }} alt={`scene-${index+1}`} />
                            </div>
                          )}
                        </Draggable>
                      ) : provided.placeholder}
                      {correctFlags[index] && <div className="pop-icon" style={{ position: 'absolute', color: '#4caf50', fontSize: '3rem', zIndex: 10 }}>⭕</div>}
                      {errorSlot === index && <div className="pop-icon" style={{ position: 'absolute', color: '#f44336', fontSize: '3rem', zIndex: 10 }}>❌</div>}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>

          {isCleared ? (
            <div style={{ flex: 2.0, backgroundColor: '#fff', borderRadius: '15px', padding: '20px', border: '3px solid #FFD700', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(255, 215, 0, 0.3)', animation: 'fadeIn 1s', position: 'relative', zIndex: 1001 }}>
              <h2 style={{ color: '#FF8C00', fontSize: '2rem', margin: '0 0 15px', borderBottom: '3px dashed #FFD700', paddingBottom: '10px' }}>RESULT</h2>
              <div style={{ textAlign: 'center', margin: '5px 0' }}><div style={{ fontSize: '1rem', color: '#666', fontWeight: 'bold' }}>Time</div><div style={{ fontSize: '2.5rem', color: '#4caf50', fontWeight: '900' }}>{finalTime}s</div></div>
              <div style={{ textAlign: 'center', margin: '10px 0', padding: '10px', backgroundColor: '#fff8e1', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }}><div style={{ fontSize: '0.9rem', color: '#f57c00', fontWeight: 'bold' }}>Best Record</div><div style={{ fontSize: '1.5rem', color: '#ff9800', fontWeight: 'bold' }}>{bestTime ? `${bestTime}s` : '-s'}</div></div>
              <div style={{ textAlign: 'center', margin: '5px 0 15px', fontSize: '1.1rem', fontWeight: 'bold', color: mistakeCount === 0 ? '#4caf50' : '#f44336' }}>Mistakes: {mistakeCount}{mistakeCount === 0 && ' (Perfect! ✨)'}</div>
              <button onClick={onRetry} className="retry-btn">🔄 Retry</button>
            </div>
          ) : (
            <Droppable droppableId="deck" direction="horizontal">
              {(provided, snapshot) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{
                  flex: 2.0, backgroundColor: snapshot.isDraggingOver ? '#f1f8e9' : '#fff', borderRadius: '15px',
                  padding: '10px', border: '2px solid #ddd', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', alignContent: 'start'
                }}>
                  {deck.map((item, index) => (
                    <Draggable key={item.id} draggableId={`deck-${item.id}`} index={index}>
                      {(p, snap) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} style={{ 
                          ...p.draggableProps.style, 
                          ...(snap.isDragging ? {} : { width: '100%' })
                        }}>
                          <img src={item.url} style={{ 
                            width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: '8px', display: 'block',
                            boxShadow: snap.isDragging ? '0 10px 20px rgba(0,0,0,0.3)' : '0 3px 6px rgba(0,0,0,0.15)' 
                          }} alt="card" />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>

        <style>{`
          .shake-animation { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
          @keyframes shake { 10%, 90% { transform: translate3d(-3px, 0, 0); } 20%, 80% { transform: translate3d(4px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-6px, 0, 0); } 40%, 60% { transform: translate3d(6px, 0, 0); } }
          .pop-icon { animation: popOut 0.8s forwards; pointer-events: none; }
          @keyframes popOut { 0% { transform: scale(0.5); opacity: 0; } 30% { transform: scale(1.5); opacity: 1; } 70% { transform: scale(1.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
          @keyframes zoomBounce { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
          .retry-btn { padding: 12px 30px; font-size: 1.2rem; font-weight: bold; color: #fff; background-color: #008CBA; border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: transform 0.1s; }
          .retry-btn:active { transform: scale(0.95); }
        `}</style>
      </DragDropContext>
    </>
  );
};

export default MatchBoard;