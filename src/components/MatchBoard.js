import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { shuffle } from "../utils/game";
import { playSound } from "../utils/sound";
// Pointer hit testing supports a wrapping image grid without DnD's one-axis
// collision assumptions. Tap an image then a slot also works on touch devices.
function PuzzlePassage({ children }) {
  const text = React.Children.toArray(children).join("");
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    let active = true;
    const card = el.parentElement;
    const fit = () => {
      if (!active) return;
      const css = getComputedStyle(card);
      const available =
        card.clientHeight -
        parseFloat(css.paddingTop) -
        parseFloat(css.paddingBottom) -
        24;
      const maxText = Math.max(24, available - Math.max(44, available * 0.4));
      let size = 13;
      el.style.height = "auto";
      el.style.fontSize = size + "px";
      while (size > 8.5 && el.scrollHeight > maxText + 1) {
        size -= 0.5;
        el.style.fontSize = size + "px";
      }
      // Use natural text height, leaving all remaining space for the picture.
      el.style.height =
        Math.min(el.scrollHeight, Math.max(24, available - 32)) + "px";
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(card);
    document.fonts?.ready.then(fit);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [text]);
  return (
    <p className="puzzle-passage" ref={ref}>
      {children}
    </p>
  );
}
export default function MatchBoard({
  storyData,
  unit,
  level,
  limitSeconds = 0,
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
    [drag, setDrag] = useState(null),
    [detail, setDetail] = useState(null),
    [newMatches, setNewMatches] = useState([]);
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
      setNewMatches((previous) => [...previous, slot]);
      setSelected(null);
      playSound("puzzle-correct");
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
                (newMatches.includes(i) ? "just-matched " : "") +
                (error === i ? "wrong" : "")
              }
            >
              <PuzzlePassage>
                {i + 1}. {item.en}
              </PuzzlePassage>
              <div className="slot-translation">
                <button
                  aria-label={"Scene " + (i + 1) + " のヒント"}
                  onClick={() => {
                    if (!placed.includes(i) && !hints.includes(i)) {
                      begin();
                      penalties.current += 10;
                      onHintUsed(10);
                      setHints([...hints, i]);
                    }
                    setDetail(i);
                  }}
                >
                  {placed.includes(i) || hints.includes(i)
                    ? "英文・訳を確認"
                    : "💡 ヒント +10秒"}
                </button>
              </div>
              <button
                className="drop-target"
                data-slot={i}
                aria-label={"空欄 " + (i + 1)}
                disabled={placed.includes(i) || isCleared}
                onClick={() => place(selected, i)}
              >
                {placed.includes(i) ? (
                  <>
                    <span className="placed-image">{image(i)}</span>
                    <span className="puzzle-correct-mark" aria-label="正解">
                      <svg viewBox="0 0 40 40" aria-hidden="true">
                        <circle cx="20" cy="20" r="14" pathLength="100" />
                      </svg>
                    </span>
                  </>
                ) : (
                  <span>{selected !== null ? "ここに置く" : i + 1}</span>
                )}
              </button>
            </div>
          ))}
        </div>
        <aside className="puzzle-deck" style={{ "--deck-rows": Math.ceil(deck.length / 2) }}>
          {isCleared ? (
            <div className="puzzle-result">
              <span className="eyebrow">MISSION COMPLETE</span>
              <h2>
                {!limitSeconds || finalTime <= limitSeconds
                  ? "🧩 CLEAR!"
                  : "もう一度挑戦！"}
              </h2>
              <b>{studentInfo.name}</b>
              <strong>{finalTime} 秒</strong>
              <span>
                Level {level} · Best {bestTime ?? finalTime}秒
              </span>
              <span>
                {limitSeconds
                  ? `合格基準 ${limitSeconds}秒以内`
                  : "時間制限なし"}{" "}
                · ミス {mistakeCount}回
              </span>
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
      {detail !== null && (
        <div className="puzzle-detail-backdrop" onClick={() => setDetail(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={"Scene " + (detail + 1) + " のヒント"}
            className="puzzle-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="subtle"
              onClick={() => setDetail(null)}
            >
              閉じる
            </button>
            <h3>Scene {detail + 1}</h3>
            <p>{storyData[detail].en}</p>
            <p>{storyData[detail].ja}</p>
          </section>
        </div>
      )}
      {drag && (
        <div className="drag-preview" style={{ left: drag.x, top: drag.y }}>
          {image(drag.id)}
        </div>
      )}
    </section>
  );
}
