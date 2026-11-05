import React, { useState, useRef, useEffect } from "react";
import { shuffle } from "../utils/game";
import { playSound } from "../utils/sound";
// Pointer hit testing supports a wrapping image grid without DnD's one-axis
// collision assumptions. Tap an image then a slot also works on touch devices.
export default function MatchBoard({
  storyData,
  unit,
  level,
  onGameStart,
  onGameClear,
  onMistake,
  onHintUsed,
  isCleared,
  finalTime,
  bestTime,
  mistakeCount,
  onRetry,
  studentInfo,
}) {
  const initial = () => {
    const n = storyData.length;
    return (
      level === 1 ? [0, 2, 4, 6, 8, 10] : level === 2 ? [0, 5, 11] : []
    ).filter((i) => i < n);
  };
  const [placed, setPlaced] = useState(initial),
    [deck] = useState(() =>
      shuffle(storyData.map((_, i) => i).filter((i) => !initial().includes(i))),
    );
  const [selected, setSelected] = useState(null),
    [hints, setHints] = useState([]),
    [error, setError] = useState(null),
    [drag, setDrag] = useState(null);
  const timer = useRef(null),
    gesture = useRef(null),
    board = useRef(null),
    completeRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(null),
    penalties = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      if (startTime.current !== null && !completeRef.current)
        setElapsed((Date.now() - startTime.current) / 1000 + penalties.current);
    }, 100);
    return () => {
      clearInterval(id);
      clearTimeout(timer.current);
    };
  }, []);
  const begin = () => {
    if (startTime.current === null) startTime.current = Date.now();
    onGameStart();
  };
  const place = (card, slot) => {
    if (
      card === null ||
      !Number.isInteger(slot) ||
      isCleared ||
      placed.includes(slot)
    )
      return;
    begin();
    if (card === slot) {
      const next = [...placed, slot];
      setPlaced(next);
      setSelected(null);
      playSound("correct");
      if (next.length === storyData.length && !completeRef.current) {
        completeRef.current = true;
        onGameClear();
      }
    } else {
      onMistake();
      playSound("wrong");
      setError(slot);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setError(null), 500);
    }
  };
  const image = (id, extra = {}) => (
    <img
      draggable={false}
      src={`${process.env.PUBLIC_URL}/images/unit${unit}/${id + 1}.webp`}
      alt={"Scene " + (id + 1)}
      style={extra}
    />
  );
  const pointerDown = (event, id) => {
    if (event.button !== 0 || isCleared) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    begin();
    gesture.current = { id, x: event.clientX, y: event.clientY, moved: false };
    setSelected(id);
  };
  const pointerMove = (event) => {
    const g = gesture.current;
    if (!g) return;
    if (Math.hypot(event.clientX - g.x, event.clientY - g.y) > 6)
      g.moved = true;
    if (g.moved) setDrag({ id: g.id, x: event.clientX, y: event.clientY });
  };
  const pointerUp = (event) => {
    const g = gesture.current;
    gesture.current = null;
    setDrag(null);
    if (!g) return;
    if (g.moved) {
      const el = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-slot]");
      if (el && board.current?.contains(el))
        place(g.id, Number(el.dataset.slot));
    }
  };
  return (
    <section className="puzzle-board" ref={board}>
      <div className="puzzle-meta">
        <span>
          Level {level} · {placed.length} / {storyData.length} Scenes
        </span>
        <strong>⏱ {isCleared ? finalTime : elapsed.toFixed(1)} 秒</strong>
        <span>画像をドラッグ、または画像→空欄をタップ</span>
      </div>
      <div className="puzzle-columns">
        <div className="puzzle-slots">
          {storyData.map((item, i) => (
            <div
              key={i}
              className={
                "puzzle-slot " +
                (placed.includes(i) ? "matched " : "") +
                (error === i ? "wrong" : "")
              }
            >
              <p>
                {i + 1}. {item.en}
              </p>
              <div className="slot-translation">
                {placed.includes(i) || hints.includes(i) ? (
                  item.ja
                ) : (
                  <button
                    onClick={() => {
                      if (!hints.includes(i)) {
                        begin();
                        penalties.current += 10;
                        onHintUsed(10);
                        setHints([...hints, i]);
                      }
                    }}
                  >
                    💡 ヒント +10秒
                  </button>
                )}
              </div>
              <button
                className="drop-target"
                data-slot={i}
                aria-label={"空欄 " + (i + 1)}
                disabled={placed.includes(i) || isCleared}
                onClick={() => place(selected, i)}
              >
                {placed.includes(i) ? (
                  image(i)
                ) : (
                  <span>{selected !== null ? "ここに置く" : i + 1}</span>
                )}
              </button>
            </div>
          ))}
        </div>
        <aside className="puzzle-deck">
          {isCleared ? (
            <div className="puzzle-result">
              <span className="eyebrow">MISSION COMPLETE</span>
              <h2>🧩 CLEAR!</h2>
              <b>{studentInfo.name}</b>
              <strong>{finalTime} 秒</strong>
              <span>
                Level {level} · Best {bestTime ?? finalTime}秒
              </span>
              <span>ミス {mistakeCount}回</span>
              <button className="primary" onClick={onRetry}>
                🔄 Retry
              </button>
            </div>
          ) : (
            <>
              {deck
                .filter((id) => !placed.includes(id))
                .map((id) => (
                  <button
                    key={id}
                    className={
                      "puzzle-image " + (selected === id ? "chosen" : "")
                    }
                    aria-label={"画像 " + (id + 1)}
                    aria-pressed={selected === id}
                    onPointerDown={(e) => pointerDown(e, id)}
                    onPointerMove={pointerMove}
                    onPointerUp={pointerUp}
                    onPointerCancel={() => {
                      gesture.current = null;
                      setDrag(null);
                    }}
                    onClick={(e) => {
                      if (e.detail === 0) {
                        begin();
                        setSelected(id);
                      }
                    }}
                  >
                    {image(id)}
                  </button>
                ))}
            </>
          )}
        </aside>
      </div>
      {drag && (
        <div className="drag-preview" style={{ left: drag.x, top: drag.y }}>
          {image(drag.id)}
        </div>
      )}
    </section>
  );
}
