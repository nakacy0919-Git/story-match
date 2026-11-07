import React, { useEffect, useMemo, useState } from "react";
import { unitScripts, unitTranslations, unitVocab } from "../treasureData";
import { allUnitsData } from "../unitsData";
import { useReadingSpeech } from "../utils/useReadingSpeech";
import { score } from "../utils/readingScore";
import InteractivePassage from "./InteractivePassage";

export const unitKey = (u) => "U" + String(u).padStart(2, "0") + "_P1";
export function cleanText(s) {
  return String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").trim();
}
export function paragraphOptions(unit) {
  const prefix = unitKey(unit) + "_p";
  return [...new Set(Object.keys(unitScripts).filter((k) => k.startsWith(prefix))
    .map((k) => Number(k.slice(prefix.length))).filter(Number.isInteger))]
    .sort((a,b) => a-b).map((n) => ({ value: "p"+n, label: "Paragraph "+n }));
}
export function getLesson(unit, scope = "full") {
  const prefix = unitKey(unit);
  const key = prefix + "_" + scope;
  return {
    en: cleanText(unitScripts[key] || (scope !== "full" ? unitScripts[prefix+"_full"] : "")),
    ja: cleanText(unitTranslations[key] || (scope !== "full" ? unitTranslations[prefix+"_full"] : "")),
    words: unitVocab[prefix] || [],
  };
}
const FONT_SIZE_STORAGE_KEY = "treasure-hunt-reading-font-size";
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 32;
const DEFAULT_FONT_SIZE = 22;

export function ScriptPanel({unit,scope,japaneseOnly=false}) {
  const lesson=getLesson(unit,scope);
  const [showFullJapanese,setShowFullJapanese]=useState(false);
  const [fontSize,setFontSize]=useState(()=>{
    try {
      const saved=Number(window.localStorage.getItem(FONT_SIZE_STORAGE_KEY));
      return saved>=MIN_FONT_SIZE&&saved<=MAX_FONT_SIZE&&Number.isFinite(saved)?saved:DEFAULT_FONT_SIZE;
    } catch (_) {
      return DEFAULT_FONT_SIZE;
    }
  });
  useEffect(()=>setShowFullJapanese(false),[unit,scope,japaneseOnly]);
  useEffect(()=>{
    try {window.localStorage.setItem(FONT_SIZE_STORAGE_KEY,String(fontSize));}catch (_) {}
  },[fontSize]);
  const resize=(delta)=>setFontSize((current)=>Math.max(MIN_FONT_SIZE,Math.min(MAX_FONT_SIZE,current+delta)));
  const textStyle={fontSize:fontSize+"px"};

  return <section className="th-panel th-script-panel">
    <header className="th-panel-heading th-script-heading">
      <div className="th-script-title">
        <span className="th-kicker">UNIT {unit} · {scope==="full"?"FULL TEXT":scope.toUpperCase()}</span>
        <h2>{japaneseOnly?"Japanese Translation":"Reading Script"}</h2>
      </div>
      <div className="th-script-controls">
        <div className="th-font-controls" role="group" aria-label="本文の文字サイズ">
          <span className="th-font-label" aria-hidden="true">A</span>
          <button type="button" aria-label="文字を小さく" title="文字を小さく"
            disabled={fontSize<=MIN_FONT_SIZE} onClick={()=>resize(-2)}>−</button>
          <output aria-label="現在の文字サイズ">{fontSize}px</output>
          <button type="button" aria-label="文字を大きく" title="文字を大きく"
            disabled={fontSize>=MAX_FONT_SIZE} onClick={()=>resize(2)}>＋</button>
        </div>
        {!japaneseOnly&&lesson.en&&<button type="button" className="th-small th-compact-translation"
          aria-pressed={showFullJapanese} onClick={()=>setShowFullJapanese((value)=>!value)}>
          {showFullJapanese?"全文訳を隠す":"🇯🇵 全文訳を表示"}
        </button>}
      </div>
    </header>
    {!japaneseOnly&&<p className="th-script-hint">青い単語：意味・発音　｜　英文を選択／タップ：一文の和訳</p>}
    {!japaneseOnly&&(lesson.en
      ? <InteractivePassage key={unit+":"+scope} text={lesson.en} words={lesson.words}
          unit={unit} scope={scope} fontSize={fontSize}/>
      : <p>この範囲の英文は未登録です。</p>)}
    {(japaneseOnly||showFullJapanese)&&<div className="th-translation" style={textStyle}>
      {lesson.ja||"日本語訳は未登録です。"}
    </div>}
    {japaneseOnly&&lesson.en&&<details className="th-details"><summary>英文も表示する</summary>
      <InteractivePassage key={"ja:"+unit+":"+scope} text={lesson.en} words={lesson.words}
        unit={unit} scope={scope} fontSize={fontSize}/></details>}
  </section>;
}

function shuffle(arr) {
  const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
function useBest(key) {
  const [best,setBest]=useState(0);
  useEffect(()=>{try{setBest(Number(localStorage.getItem(key))||0);}catch(_){setBest(0);}},[key]);
  const save=(n)=>setBest((old)=>{const next=Math.max(old,n);try{localStorage.setItem(key,String(next));}catch(_){}return next;});
  return [best,save];
}
export function VocabularyPanel({unit}) {
  const words=useMemo(()=>getLesson(unit).words.filter((v)=>v.word&&v.meaning),[unit]);
  const pool=useMemo(()=>[...new Set(Object.values(unitVocab).flat().map((v)=>v.meaning).filter(Boolean))],[]);
  const [mode,setMode]=useState("study"),[questions,setQuestions]=useState([]),[index,setIndex]=useState(0),
    [answered,setAnswered]=useState(null),[correct,setCorrect]=useState(0);
  const [best,saveBest]=useBest("th-vocab-best:"+unit);
  useEffect(()=>{setMode("study");setIndex(0);setAnswered(null);setCorrect(0);},[unit]);
  const start=()=>{setQuestions(shuffle(words).map((word)=>({...word,choices:shuffle([word.meaning,...shuffle(pool.filter((x)=>x!==word.meaning)).slice(0,3)])})));
    setCorrect(0);setIndex(0);setAnswered(null);setMode("quiz");};
  const q=questions[index];
  const choose=(choice)=>{if(answered!==null)return;setAnswered(choice);
    const n=correct+(choice===q.meaning?1:0);setCorrect(n);
    if(index===questions.length-1)saveBest(Math.round(100*n/questions.length));};
  return <section className="th-panel">
    <header className="th-panel-heading"><span className="th-kicker">UNIT {unit} · VOCABULARY</span><h2>Vocabulary Training</h2>
      <p>{words.length}語の学習 · ベスト正解率 {best}%</p></header>
    <div className="th-actions"><button className="th-small" onClick={()=>setMode("study")}>単語一覧</button>
      <button className="th-primary" onClick={start} disabled={!words.length}>4択クイズ</button></div>
    {mode==="study"?<div className="th-word-grid">{words.map((v,i)=><div className="th-word-card" key={v.word+i}>
      <b>{v.word}</b><span>{v.pronunciation||v.pron||""}</span><p>{v.meaning}</p></div>)}</div>
    :mode==="result"?<div className="th-quiz-card"><h3>{correct} / {questions.length} 問正解</h3>
      <p>正解率 {Math.round(correct/questions.length*100)}%</p><button className="th-primary" onClick={start}>再挑戦</button></div>
    :q?<div className="th-quiz-card"><span className="th-kicker">QUESTION {index+1} / {questions.length}</span><h3>{q.word}</h3>
      <p>正しい日本語の意味を選んでください。</p>
      <div className="th-choice-grid">{q.choices.map((x,i)=><button key={i} disabled={answered!==null}
        className={"th-choice "+(answered!==null?(x===q.meaning?"correct":x===answered?"incorrect":""):"")}
        onClick={()=>choose(x)}>{x}</button>)}</div>
      {answered!==null&&<div className="th-feedback"><strong>{answered===q.meaning?"✓ 正解！":"正解："+q.meaning}</strong>
        <button className="th-primary" onClick={()=>{if(index===questions.length-1)setMode("result");else{setIndex(index+1);setAnswered(null);}}}>
          {index===questions.length-1?"結果へ":"次の問題 →"}</button></div>}</div>:<p>このUnitの単語は未登録です。</p>}
  </section>;
}
export function GrammarPanel({unit}) {
  const sentences=useMemo(()=>(allUnitsData[unit]||[]).map((x)=>x.en)
    .filter((s)=>s.split(/\s+/).length>=5&&s.split(/\s+/).length<=16).slice(0,10),[unit]);
  const [index,setIndex]=useState(0),[picked,setPicked]=useState([]),[checked,setChecked]=useState(false),[,setSolved]=useState([]);
  const [best,saveBest]=useBest("th-grammar-best:"+unit);
  useEffect(()=>{setIndex(0);setPicked([]);setChecked(false);setSolved([]);},[unit]);
  const sentence=sentences[index]||"";
  const words=useMemo(()=>sentence.split(/\s+/).filter(Boolean),[sentence]);
  const positions=useMemo(()=>{const a=shuffle(words.map((_,i)=>i));return a.every((n,i)=>n===i)?a.reverse():a;},[words]);
  const correct=picked.length===words.length&&picked.every((n,i)=>n===i);
  const check=()=>{if(checked)return;setChecked(true);if(correct){setSolved((old)=>{const next=[...new Set([...old,index])];saveBest(next.length);return next;});}};
  return <section className="th-panel">
    <header className="th-panel-heading"><span className="th-kicker">UNIT {unit} · GRAMMAR</span><h2>Sentence Builder</h2>
      <p>実際の本文を使った語順並び替え練習 · ベスト {best} 問正解</p></header>
    {sentences.length?<div className="th-quiz-card"><span className="th-kicker">SENTENCE {index+1}/{sentences.length}</span>
      <p>単語をタップして正しい英文を完成させましょう。</p>
      <div className="th-assembled">{picked.length?picked.map((n,i)=><button key={i} disabled={checked}
        onClick={()=>setPicked((arr)=>arr.filter((_,j)=>j!==i))}>{words[n]}</button>):"ここに選択した単語が表示されます"}</div>
      <div className="th-token-grid">{positions.filter((n)=>!picked.includes(n)).map((n)=><button key={n}
        onClick={()=>setPicked((a)=>[...a,n])}>{words[n]}</button>)}</div>
      {checked&&<div className="th-feedback"><strong>{correct?"✓ 正解！":"惜しい！語順を確認しましょう。"}</strong><p>{sentence}</p></div>}
      <div className="th-actions"><button className="th-small" onClick={()=>{setPicked([]);setChecked(false);}}>リセット</button>
        {checked?<button className="th-primary" onClick={()=>{setIndex((index+1)%sentences.length);setPicked([]);setChecked(false);}}>次の英文 →</button>
        :<button className="th-primary" disabled={picked.length!==words.length} onClick={check}>答え合わせ</button>}</div>
    </div>:<p>練習に適した英文が登録されていません。</p>}
  </section>;
}
function AccuracyGauge({percent}) {
  const value=percent===null?0:Math.max(0,Math.min(100,percent));
  const display=percent===null?"—":Math.round(value)+"%";
  return <div className="th-reading-gauge" aria-label={"Accuracy "+display}>
    <svg viewBox="0 0 120 85" role="img" aria-label={"Accuracy "+display} focusable="false">
      <path className="th-gauge-track" d="M 14 66 A 46 46 0 0 1 106 66" fill="none" strokeWidth="10" strokeLinecap="round" pathLength="100"/>
      <path className="th-gauge-fill" d="M 14 66 A 46 46 0 0 1 106 66" fill="none" strokeWidth="10" strokeLinecap="round"
        pathLength="100" strokeDasharray={value+" 100"} />
      <text x="60" y="61" textAnchor="middle" className="th-gauge-value">{display}</text>
      <text x="60" y="78" textAnchor="middle" className="th-gauge-label">Accuracy</text>
    </svg>
  </div>;
}

export function ReadingPractice({unit,scope,shadowing=false}) {
  const lesson=getLesson(unit,scope);
  const [percent,setPercent]=useState(null),[transcript,setTranscript]=useState("");
  const mic=useReadingSpeech(lesson.en,(value,spoken)=>{setPercent(value);setTranscript(spoken);},
    score,"th:"+unit+":"+scope,80);
  useEffect(()=>{setPercent(null);setTranscript("");},[unit,scope,shadowing]);
  const isListening=mic.phase==="listening";
  const isScoring=mic.phase==="scoring";
  const displayTranscript=mic.transcript||transcript||"ここに認識された英文が表示されます。";
  return <section className="th-panel th-reading-panel">
    <header className="th-panel-heading th-reading-heading">
      <div><span className="th-kicker">UNIT {unit} · {shadowing?"SHADOWING":"READING"}</span>
        <h2>{shadowing?"Shadowing Practice":"Reading Check"}</h2></div>
      <p>{shadowing?"右のモデル音声に続けて発話しましょう。イヤホンを推奨します。":"本文はここだけスクロール。下のボタンで音読開始／終了・判定を切り替えます。"}</p>
    </header>
    <div className="th-reading-scroll" role="region" aria-label="音読する英文（スクロール可能）" tabIndex={0}>
      <div className="th-practice-text">{lesson.en||"この範囲の英文は登録されていません。"}</div>
    </div>
    <footer className="th-reading-dock" aria-label="音読の操作と評価">
      <div className="th-reading-dock-left">
        <div className="th-reading-dock-actions">
          <button type="button" className={"th-primary th-record-toggle"+(isListening?" is-recording":"")}
            disabled={!lesson.en||isScoring} aria-pressed={isListening}
            onClick={()=>isListening?mic.stop():mic.begin()}>
            {isListening?"■ 終了・判定":isScoring?"判定中…":"🎙 音読スタート"}
          </button>
          <button type="button" className="th-small th-reconnect" disabled={!lesson.en||isScoring}
            onClick={()=>{setPercent(null);setTranscript("");mic.reconnect();}}>マイク再接続</button>
        </div>
        <p className="th-reading-status" role="status" title={mic.status}>{mic.status}</p>
        <div className="th-reading-transcript">
          <span className="th-transcript-title">文字起こし <span>{isListening?"● 認識中":isScoring?"判定中":percent===null?"待機中":"判定完了"}</span></span>
          <p aria-label="認識された英文">{displayTranscript}</p>
        </div>
      </div>
      <AccuracyGauge percent={percent}/>
    </footer>
  </section>;
}
