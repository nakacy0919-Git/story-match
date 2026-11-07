import React, { useState, useRef, useEffect } from "react";
import MatchBoard from "./components/MatchBoard";
import RandomModeBoard from "./components/RandomModeBoard";
import StoryModeBoard from "./components/StoryModeBoard";
import ListeningModeBoard from "./components/ListeningModeBoard";
import HistoryBoard from "./components/HistoryBoard";
import { allUnitsData } from "./unitsData";
import { readStoredJSON, writeStoredJSON } from "./utils/storage";
import {
  loadProgress,
  restoreWithLegacy,
  progressKey,
  profileKey,
  recordResult,
  completedModes,
  sceneScores,
} from "./utils/progress";
import "./App.css";
import AdminSettings from "./components/AdminSettings";
import { useMissionRules } from "./utils/useMissionRules";

const modes = [
  ["reading", "📖", "じっくり学習", "絵本のように", "ストーリーを読む"],
  ["puzzle", "🧩", "パズルモード", "空欄に画像を当てはめ", "物語を完成させる"],
  ["random", "⚡", "ランダムモード", "英文からイラストを", "素早く見極める"],
  ["listening", "🎧", "リスニング", "流れる音声を聞いて", "正しい画像を選ぶ"],
];
const units = Object.keys(allUnitsData)
  .map(Number)
  .filter((n) => allUnitsData[n]?.length);
function restoredStudent() {
  const s = readStoredJSON("storyMatchStudent", {});
  return {
    class: typeof s?.class === "string" ? s.class : "",
    number: String(s?.number || ""),
    name: typeof s?.name === "string" ? s.name : "",
  };
}
function App({ embedded = false, selectedUnit = null }) {
  const { rules, accept: acceptRules } = useMissionRules();
  const [student, setStudent] = useState(restoredStudent);
  const [draft, setDraft] = useState(student);
  const [registered, setRegistered] = useState(
    !!(student.class && student.number && student.name),
  );
  const [progress, setProgress] = useState(() => restoreWithLegacy(student));
  const [storageError, setStorageError] = useState(false);
  const [history, setHistory] = useState(() => {
    const stored = readStoredJSON("storyMatchHistory", []);
    return Array.isArray(stored)
      ? stored.filter((x) => x && Number.isFinite(x.result))
      : [];
  });
  const [unit, setUnit] = useState(() =>
    embedded && units.includes(Number(selectedUnit)) ? Number(selectedUnit) :
    units.includes(Number(readStoredJSON("storyMatchLastUnit", 2)))
      ? Number(readStoredJSON("storyMatchLastUnit", 2))
      : 2,
  );
  const [view, setView] = useState("dashboard");
  useEffect(() => {
    if (embedded && units.includes(Number(selectedUnit))) {
      setUnit(Number(selectedUnit));
      setView("dashboard");
      window.speechSynthesis?.cancel();
    }
  }, [embedded, selectedUnit]);
  const [mode, setMode] = useState("reading");
  const [level, setLevel] = useState(3);
  const [count, setCount] = useState("ALL");
  const [attempt, setAttempt] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [finalTime, setFinalTime] = useState(null);
  const startedAt = useRef(null),
    penalty = useRef(0),
    saved = useRef(false);
  const data = allUnitsData[unit] || allUnitsData[units[0]];
  const total = data.length,
    record = progress[unit] || {};
  const done = completedModes(record, total, rules);
  const passed = sceneScores(record, total).filter(
    (n) => n >= rules.readingAccuracy,
  ).length;
  const persist = (next) => {
    setProgress(next);
    setStorageError(!writeStoredJSON(progressKey(student), next));
  };
  const save = (gameMode, result, extra = {}) => {
    persist(
      recordResult(progress, unit, gameMode, result, { total, ...extra }),
    );
    if (gameMode === "reading") return;
    const log = {
      date: new Date().toISOString(),
      unit,
      mode: gameMode,
      result,
      mistakes,
      level: gameMode === "puzzle" ? level : null,
      student: profileKey(student),
    };
    const next = [log, ...history].slice(0, 100);
    setHistory(next);
    if (!writeStoredJSON("storyMatchHistory", next)) setStorageError(true);
  };
  const reset = () => {
    setAttempt((x) => x + 1);
    setCleared(false);
    setMistakes(0);
    setFinalTime(null);
    startedAt.current = null;
    penalty.current = 0;
    saved.current = false;
  };
  const start = () => {
    reset();
    if(mode==="random"||mode==="listening")startedAt.current=Date.now();
    setView("game");
  };
  const finish = (score) => {
    if (saved.current) return;
    saved.current = true;
    setCleared(true);
    if (mode === "puzzle") {
      const time =
        Math.round(
          ((Date.now() - (startedAt.current ?? Date.now())) / 1000 +
            penalty.current) *
            10,
        ) / 10;
      setFinalTime(time);
      save(mode, time, { level });
    } else
      save(mode, score, {
        count: count === "ALL" ? total : Math.min(total, Number(count)),
        elapsedSeconds: mode==="random" ? Math.round((Date.now()-(startedAt.current??Date.now()))/100)/10 : undefined,
      });
  };
  const back = () => {
    window.speechSynthesis?.cancel();
    reset();
    setView("dashboard");
  };
  const register = (e) => {
    e.preventDefault();
    const next = {
      class: draft.class.trim(),
      number: draft.number.trim(),
      name: draft.name.trim(),
    };
    if (!next.class || !next.number || !next.name) return;
    setStudent(next);
    setDraft(next);
    setProgress(loadProgress(next));
    setRegistered(true);
    setStorageError(!writeStoredJSON("storyMatchStudent", next));
    setView("dashboard");
  };
  if (view === "admin")
    return (
      <AdminSettings
        rules={rules}
        onSave={acceptRules}
        onBack={() => setView("dashboard")}
      />
    );
  if (!registered)
    return (
      <main className="registration">
        <form onSubmit={register}>
          <span className="eyebrow">TREASURE HUNT</span>
          <h1>🎓 Student Registration</h1>
          {[
            ["class", "クラス"],
            ["number", "番号"],
            ["name", "氏名"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required
                maxLength={60}
                type={key === "number" ? "number" : "text"}
                min={key === "number" ? 1 : undefined}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </label>
          ))}
          <button className="primary">Start Learning</button>
          <button
            type="button"
            className="subtle"
            onClick={() => setView("admin")}
          >
            管理者設定
          </button>
        </form>
      </main>
    );
  const metric = (id) => {
    if (id === "reading")
      return (
        <>
          <strong>
            {passed}
            <small> / {total} Scenes</small>
          </strong>
          <span>Accuracy {rules.readingAccuracy}%以上でクリア</span>
        </>
      );
    if (id === "puzzle") {
      const records = Object.entries(record.puzzle || {});
      return (
        <>
          <strong>
            {records.length
              ? Math.min(...records.map(([, r]) => r.best)) + " 秒"
              : "— 秒"}
          </strong>
          <span>
            {records.length
              ? records.map(([l, r]) => `L${l}: ${r.best}秒`).join(" · ")
              : "ベストタイムを記録"}{" "}
            {rules.puzzleSeconds
              ? ` / 合格 ${rules.puzzleSeconds}秒以内`
              : " / 時間制限なし"}
          </span>
        </>
      );
    }
    const r = record[id];
    return (
      <>
        <strong>
          {r
            ? (r.bestByCount?.[total] ??
                r.bestByCount?.[r.count] ??
                r.legacyBest ??
                0) + " pts"
            : "— pts"}
        </strong>
        <span>
          {r
            ? r.count
              ? `${r.bestByCount?.[total] !== undefined ? total : r.count}問のベストスコア`
              : "以前のスコア（問題数不明）"
            : "スコアを記録"}{" "}
          · 全{total}問・{rules[id + "Points"]}点以上
        </span>
      </>
    );
  };
  return (
    <main
      className={
        "app-shell " +
        (view === "game" || view === "settings" ? "mission-active" : "")
      }
    >
      {!embedded && view !== "game" && view !== "settings" && (
        <header className="app-header">
          <div>
            <span className="eyebrow">TREASURE HUNT</span>
            <h1>
              Story Match <span>Learning Progress</span>
            </h1>
          </div>
          <div className="student-profile">
            <strong>{student.name}</strong>
            <span>
              {student.class} · {student.number}番
            </span>
          </div>
          <button
            className="subtle"
            onClick={async () => {
              const password = window.prompt(
                "管理者パスワードを入力してください（情報の書き換え）:",
              );
              if (!password) return;
              try {
                const response = await fetch("/api/mission-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "verify", password }),
                });
                if (!response.ok) throw Error("認証できませんでした。");
                setDraft(student);
                setRegistered(false);
              } catch (_) {
                window.alert(
                  "認証できませんでした。パスワードと通信状態を確認してください。",
                );
              }
            }}
          >
            情報を変更する
          </button>
        </header>
      )}
      {storageError && (
        <div role="alert" className="storage-error">
          端末に保存できません。画面を閉じる前にスクリーンショットを保存してください。
        </div>
      )}
      {view === "dashboard" ? (
        <section className="dashboard">
          {!embedded && <nav className="unit-grid" aria-label="ユニットごとの学習進捗">
            {units.map((n) => {
              const flags = completedModes(
                progress[n],
                allUnitsData[n].length,
                rules,
              );
              return (
                <button
                  key={n}
                  className={"unit-tab " + (n === unit ? "selected" : "")}
                  aria-pressed={n === unit}
                  onClick={() => {
                    setUnit(n);
                    writeStoredJSON("storyMatchLastUnit", n);
                  }}
                >
                  <b>Unit {n}</b>
                  <span className="unit-dots">
                    {flags.map((f, i) => (
                      <i
                        key={i}
                        className={f ? "done" : ""}
                        title={modes[i][2] + (f ? " クリア" : " 未クリア")}
                      />
                    ))}
                  </span>
                  <small>{flags.filter(Boolean).length}/4</small>
                </button>
              );
            })}
          </nav>}
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">UNIT {unit} · 学習進捗</span>
              <h2>Select Game Mode</h2>
            </div>
            <div
              className={
                "mission-count " + (done.every(Boolean) ? "all-clear" : "")
              }
            >
              <b>{done.filter(Boolean).length} / 4</b>
              <span>
                {done.every(Boolean) ? "ALL MISSIONS CLEAR!" : "MISSIONS CLEAR"}
              </span>
            </div>
          </div>
          <div className="mission-cards">
            {modes.map(([id, icon, title, a, b], i) => (
              <button
                key={id}
                className={"mission-card " + id}
                onClick={() => {
                  setMode(id);
                  if (id === "reading") start();
                  else setView("settings");
                }}
              >
                <div className="card-top">
                  <span className="mode-icon">{icon}</span>
                  <span className={"badge " + (done[i] ? "complete" : "")}>
                    {done[i] ? "✓ CLEAR" : "CHALLENGE"}
                  </span>
                </div>
                <h3>{title}</h3>
                <p>
                  {a}
                  <br />
                  {b}
                </p>
                <div className="mode-metric">{metric(id)}</div>
                <div className="card-footer">
                  <span>
                    {id === "reading" && passed > 0 && passed < total
                      ? "続きから学習"
                      : "学習をはじめる"}
                  </span>
                  <b>→</b>
                </div>
              </button>
            ))}
          </div>
          <div className="scene-strip">
            <span>📖 Scene</span>
            {sceneScores(record, total).map((n, i) => (
              <span
                key={i}
                className={n >= rules.readingAccuracy ? "passed" : ""}
                title={"Scene " + (i + 1) + ": " + n + "%"}
              >
                {i + 1}
                {n >= rules.readingAccuracy ? " ✓" : ""}
              </span>
            ))}
          </div>
          <footer className="dashboard-footer">
            <p>
              {done.every(Boolean)
                ? "🎉 4つのミッションをクリア！この画面をスクリーンショットで先生に提出しましょう。"
                : "4つのミッションをクリアしたら、この画面をスクリーンショットで先生に提出しましょう。"}
              <small>記録はこの端末・このブラウザに保存されます。</small>
            </p>
            <button className="subtle" onClick={() => setView("admin")}>
              ⚙ 管理者
            </button>
            <button className="subtle" onClick={() => setView("history")}>
              📊 学習の記録
            </button>
          </footer>
        </section>
      ) : view === "history" ? (
        <HistoryBoard
          history={history.filter(
            (x) =>
              x.student === profileKey(student) ||
              (!x.student &&
                readStoredJSON("storyMatchLegacyOwner", null) ===
                  profileKey(student)),
          )}
          onBack={back}
        />
      ) : (
        <>
          <div className="game-toolbar">
            <button className="subtle" onClick={back}>
              ← 学習進捗へ
            </button>
            <strong>
              Unit {unit} · {modes.find((x) => x[0] === mode)[2]}
            </strong>
            {mode === "puzzle" && <span>ヒント +10秒 · ミス {mistakes}回</span>}
          </div>
          {view === "settings" ? (
            <section className="settings">
              <span className="mode-icon">
                {modes.find((x) => x[0] === mode)[1]}
              </span>
              <h2>
                {mode === "puzzle" ? "Select Puzzle Level" : "Select Questions"}
              </h2>
              {mode === "puzzle" ? (
                <div className="setting-options">
                  {[1, 2, 3].map((l) => (
                    <button
                      aria-pressed={level === l}
                      className={level === l ? "selected" : ""}
                      key={l}
                      onClick={() => setLevel(l)}
                    >
                      Level {l}
                      <small>
                        {["6枚ヒント", "3枚ヒント", "すべて空欄"][l - 1]}
                      </small>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <p>
                    全{total}
                    問を終え、{rules[mode + "Points"]}
                    点以上でミッションクリア。短い練習も記録します。
                  </p>
                  <div className="setting-options">
                    {[3, 6, "ALL"].map((c) => (
                      <button
                        aria-pressed={count === c}
                        className={count === c ? "selected" : ""}
                        key={c}
                        onClick={() => setCount(c)}
                      >
                        {c === "ALL" ? `全${total}問` : c + "問"}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <button className="primary" onClick={start}>
                START!
              </button>
            </section>
          ) : (
            <div
              className="game-content"
              key={unit + "-" + mode + "-" + attempt}
            >
              {mode === "reading" && (
                <StoryModeBoard
                  storyData={data}
                  unit={unit}
                  threshold={rules.readingAccuracy}
                  scores={sceneScores(record, total)}
                  onScore={(scene, score) => save("reading", score, { scene })}
                  onBack={back}
                />
              )}
              {mode === "puzzle" && (
                <MatchBoard
                  storyData={data}
                  unit={unit}
                  limitSeconds={rules.puzzleSeconds}
                  level={level}
                  retryCount={attempt}
                  studentInfo={student}
                  onGameStart={() => {
                    if (startedAt.current === null)
                      startedAt.current = Date.now();
                  }}
                  onGameClear={() => finish()}
                  onMistake={() => setMistakes((x) => x + 1)}
                  onHintUsed={(s) => {
                    if (startedAt.current === null)
                      startedAt.current = Date.now();
                    penalty.current += s;
                  }}
                  isCleared={cleared}
                  finalTime={finalTime}
                  bestTime={record.puzzle?.[level]?.best}
                  mistakeCount={mistakes}
                  onRetry={reset}
                />
              )}
              {mode === "random" && (
                <RandomModeBoard
                  storyData={data}
                  unit={unit}
                  retryCount={attempt}
                  minPoints={rules[mode + "Points"]}
                  qCount={count}
                  onGameClear={finish}
                  onRetry={reset}
                  studentInfo={student}
                />
              )}
              {mode === "listening" && (
                <ListeningModeBoard
                  storyData={data}
                  unit={unit}
                  retryCount={attempt}
                  minPoints={rules[mode + "Points"]}
                  qCount={count}
                  onGameClear={finish}
                  onRetry={reset}
                  studentInfo={student}
                />
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
export default App;
