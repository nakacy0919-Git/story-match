import React, { useEffect, useMemo, useState } from "react";
import { unitScripts, unitTranslations, unitVocab } from "../treasureData";
import { allUnitsData } from "../unitsData";
import { useReadingSpeech } from "../utils/useReadingSpeech";
import { score } from "../utils/readingScore";
import { saveQuizResult, saveReadingResult, saveGrammarAnswer, readUnitStudy } from "../utils/studyProgress";
import { readStoredJSON } from "../utils/storage";
import { comprehensionQuestions } from "../utils/comprehensionQuestions";
import { GlossaryText, WordHelpModal, playAnswerSound, AnswerCelebration } from "./ComprehensionHelpers";
import "../ComprehensionEffects.css";
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

function makeVocabularyQuestions(words,dir,pool,englishPool) {
 const reverse=dir==="jaEn";
 return shuffle(words).map(word=>{
   const answer=reverse?word.word:word.meaning;
   const candidates=reverse?englishPool:pool;
   return {prompt:reverse?word.meaning:word.word,correct:answer,
     choices:shuffle([answer,...shuffle(candidates.filter(x=>x!==answer)).slice(0,3)])};
 });
}
export function VocabularyPanel({unit,initialDirection="enJa"}) {
 const words=useMemo(()=>getLesson(unit).words.filter(v=>v.word&&v.meaning),[unit]);
 const pool=useMemo(()=>[...new Set(Object.values(unitVocab).flat().map(v=>v.meaning).filter(Boolean))],[]);
 const englishPool=useMemo(()=>[...new Set(Object.values(unitVocab).flat().map(v=>v.word).filter(Boolean))],[]);
 const [direction,setDirection]=useState(initialDirection);
 const [mode,setMode]=useState("quiz");
 const [questions,setQuestions]=useState(()=>makeVocabularyQuestions(words,initialDirection,pool,englishPool));
 const [index,setIndex]=useState(0),[answered,setAnswered]=useState(null),[correct,setCorrect]=useState(0);
 const [celebration,setCelebration]=useState(null);
 const [soundOn,setSoundOn]=useState(()=>{
  try{return window.localStorage.getItem("treasurePracticeSound")!=="off";}catch(_){return true;}
 });
 const toggleSound=()=>setSoundOn(prev=>{
  const next=!prev;
  try{window.localStorage.setItem("treasurePracticeSound",next?"on":"off");}catch(_){}
  return next;
 });
 useEffect(()=>{
   setDirection(initialDirection);setMode("quiz");
   setQuestions(makeVocabularyQuestions(words,initialDirection,pool,englishPool));
   setIndex(0);setAnswered(null);setCorrect(0);setCelebration(null);
 },[unit,initialDirection,words,pool,englishPool]);
 const startQuiz=(dir=direction)=>{
   setQuestions(makeVocabularyQuestions(words,dir,pool,englishPool));
   setDirection(dir);setCorrect(0);setAnswered(null);setIndex(0);
   setCelebration(null);setMode("quiz");
 };
 const q=questions[index];
 useEffect(()=>{
   if(answered===null||mode!=="quiz"||!q)return undefined;
   const timer=window.setTimeout(()=>{
     setCelebration(null);
     if(index===questions.length-1)setMode("result");
     else{setIndex(i=>i+1);setAnswered(null);}
   },1400);
   return ()=>window.clearTimeout(timer);
 },[answered,index,mode,q,questions.length]);
 const choose=value=>{
   if(answered!==null||!q)return;
   const isCorrect=value===q.correct;
   setAnswered(value);
   setCelebration({correct:isCorrect,question:index});
   playAnswerSound(isCorrect,soundOn);
   const next=correct+(isCorrect?1:0);
   setCorrect(next);
   if(index===questions.length-1&&questions.length)
     saveQuizResult(unit,"vocabulary",direction,100*next/questions.length);
 };
 return <section className="th-panel th-vocab-panel">
  <header className="th-panel-heading">
   <span className="th-kicker">UNIT {unit} · VOCABULARY</span>
   <h2>Vocabulary Training</h2>
   <p>{words.length}語 · クイズから始めて、覚えた単語を確認しましょう。</p>
  </header>
  <div className="th-vocab-toolbar">
   <div className="th-vocab-direction" role="group" aria-label="単語クイズの出題方向">
    <button type="button" className={direction==="enJa"?"is-active":""}
      aria-pressed={direction==="enJa"} disabled={!words.length}
      onClick={()=>startQuiz("enJa")}>英語 → 日本語</button>
    <button type="button" className={direction==="jaEn"?"is-active":""}
      aria-pressed={direction==="jaEn"} disabled={!words.length}
      onClick={()=>startQuiz("jaEn")}>日本語 → 英語</button>
   </div>
   <button className="th-small" onClick={()=>setMode(mode==="study"?"quiz":"study")}>
    {mode==="study"?"クイズに戻る":"単語一覧を見る"}
   </button>
   <button type="button" className="th-small" aria-label="単語クイズの効果音を切り替え"
     aria-pressed={soundOn} onClick={toggleSound}>{soundOn?"🔊 効果音 ON":"🔇 効果音 OFF"}</button>
  </div>
  {mode==="study"?<div className="th-word-grid">{words.map((w,i)=><div className="th-word-card" key={w.word+i}>
   <b>{w.word}</b><p>{w.meaning}</p></div>)}</div>:
   mode==="result"?<div className="th-quiz-card th-vocab-result">
    <span className="th-kicker">QUIZ COMPLETED</span>
    <h3>{correct} / {questions.length}問正解</h3>
    <p>正解率 {Math.round(100*correct/(questions.length||1))}%</p>
    <button className="th-primary" onClick={()=>startQuiz()}>もう一度チャレンジ</button>
   </div>:
   q?<div className="th-quiz-card th-vocab-quiz">
    <div className="th-vocab-progress"><span>QUESTION {index+1} / {questions.length}</span>
     <span>{direction==="enJa"?"ENGLISH → 日本語":"日本語 → ENGLISH"}</span></div>
    <div className="th-vocab-meter" aria-hidden="true"><div style={{width:((index+(answered!==null?1:0))*100/questions.length)+"%"}}/></div>
    <h3>{q.prompt}</h3><p>{direction==="enJa"?"正しい日本語の意味を選んでください。":"対応する英単語を選んでください。"}</p>
    <div className="th-choice-grid th-vocab-choices">{q.choices.map((choice,i)=><button key={i}
      type="button" disabled={answered!==null}
      className={"th-choice "+(answered!==null?(choice===q.correct?"correct":choice===answered?"incorrect":""):"")}
      onClick={()=>choose(choice)}><span className="th-vocab-letter">{String.fromCharCode(65+i)}</span><span>{choice}</span></button>)}</div>
    {answered!==null&&<p className="th-vocab-auto-feedback" role="status">
      {answered===q.correct?"✓ 正解！":"正解："+q.correct}　自動で次の問題に進みます
    </p>}
   </div>:<p>問題は登録されていません。</p>}
  <AnswerCelebration result={celebration}/>
 </section>;
}

function savedComprehensionClears(unit) {
 const student=readStoredJSON("storyMatchStudent",null);
 const stored=readUnitStudy(student,unit).comprehension||{};
 return {en:(stored.en?.best||0)>=100,ja:(stored.ja?.best||0)>=100};
}
function ComprehensionPairStatus({cleared}) {
 return <div className="th-comp-pair-status" aria-label="英語と日本語のクリア状況">
   <span className={cleared.en?"is-done":""}>{cleared.en?"✓":"○"} English {cleared.en?"CLEAR":"未クリア"}</span>
   <span className={cleared.ja?"is-done":""}>{cleared.ja?"✓":"○"} 日本語 {cleared.ja?"CLEAR":"未クリア"}</span>
 </div>;
}
export function ComprehensionPanel({unit,initialLanguage="en"}) {
 const [started,setStarted]=useState(false);
 const [cleared,setCleared]=useState(()=>savedComprehensionClears(unit));
 const [language,setLanguage]=useState(initialLanguage),[questions,setQuestions]=useState([]),
 [index,setIndex]=useState(0),[answered,setAnswered]=useState(null),
 [correct,setCorrect]=useState(0),[finished,setFinished]=useState(false);
 const [wordHelp,setWordHelp]=useState(null),[celebration,setCelebration]=useState(null);
 const [soundOn,setSoundOn]=useState(()=>{
   try{return window.localStorage.getItem("treasureComprehensionSound")!=="off";}catch(_){return true;}
 });
 const lesson=getLesson(unit);
 useEffect(()=>{
   setStarted(false);setCleared(savedComprehensionClears(unit));
   setLanguage(initialLanguage);setQuestions([]);
   setIndex(0);setAnswered(null);setCorrect(0);setFinished(false);
   setWordHelp(null);setCelebration(null);
 },[unit,initialLanguage]);
 useEffect(()=>{
   if(!celebration)return undefined;
   const timer=window.setTimeout(()=>setCelebration(null),1350);
   return ()=>window.clearTimeout(timer);
 },[celebration]);
 useEffect(()=>{
   if(!wordHelp)return undefined;
   const handleKey=event=>{if(event.key==="Escape")setWordHelp(null);};
   document.addEventListener("keydown",handleKey);
   return ()=>document.removeEventListener("keydown",handleKey);
 },[wordHelp]);
 const begin=(lang)=>{
   setStarted(true);setLanguage(lang);setQuestions(comprehensionQuestions(unit,lang));
   setIndex(0);setCorrect(0);setAnswered(null);setFinished(false);
   setCelebration(null);setWordHelp(null);
 };
 const restart=(lang=language)=>begin(lang);
 const toLanguageSelect=()=>{
   setStarted(false);setAnswered(null);setCelebration(null);setWordHelp(null);
 };
 const q=questions[index];
 const choose=value=>{
   if(answered!==null || celebration || !q)return;
   const isCorrect=value===q.correct;
   setAnswered(value);
   const next=correct+(isCorrect?1:0);
   setCorrect(next);
   playAnswerSound(isCorrect,soundOn);
   setCelebration({correct:isCorrect,question:index});
   if(index===questions.length-1 && questions.length) {
     const percent=100*next/questions.length;
     saveQuizResult(unit,"comprehension",language,percent);
     if(percent===100)setCleared(prev=>({...prev,[language]:true}));
   }
 };
 const next=()=>{
   if(celebration)return;
   setWordHelp(null);
   if(index===questions.length-1)setFinished(true);
   else{setIndex(i=>i+1);setAnswered(null);}
 };
 const toggleSound=()=>{
   setSoundOn(prev=>{
     const value=!prev;
     try{window.localStorage.setItem("treasureComprehensionSound",value?"on":"off");}catch(_){}
     return value;
   });
 };
 const bothCleared=cleared.en&&cleared.ja;
 const otherLanguage=language==="en"?"ja":"en";
 return <section className="th-panel th-comprehension-panel">
   <header className="th-panel-heading th-comprehension-heading">
     <div><span className="th-kicker">UNIT {unit} · READING COMPREHENSION</span>
       <h2>内容理解 Check</h2><p>日本語と英語、両方の問題をクリアしましょう。</p></div>
     <div className="th-comprehension-toolbar">
       {started&&<button type="button" className="th-comp-return" onClick={toLanguageSelect}>← 言語を選び直す</button>}
       <button type="button" className="th-sound-toggle" aria-label="クイズの効果音を切り替え"
         aria-pressed={soundOn} title={soundOn?"効果音 ON":"効果音 OFF"}
         onClick={toggleSound}>{soundOn?"🔊":"🔇"}</button>
     </div>
   </header>
   {!started?<div className="th-comp-language-select">
     <span className="th-kicker">CHOOSE YOUR CHALLENGE</span>
     <h3>どちらの言語からチャレンジしますか？</h3>
     <p className="th-comp-requirement">英語・日本語の両方で <strong>100％正解</strong> すると、この内容理解ミッションをクリアできます。</p>
     <ComprehensionPairStatus cleared={cleared}/>
     <div className="th-comp-language-cards">
       <button type="button" onClick={()=>begin("ja")} aria-label="日本語でチャレンジ">
         <span className="th-comp-language-icon" aria-hidden="true">🇯🇵</span>
         <strong>日本語でチャレンジ</strong><small>日本語の問題で本文を理解</small>
         <span className="th-comp-language-state">{cleared.ja?"✓ CLEAR · 復習する":"START →"}</span>
       </button>
       <button type="button" onClick={()=>begin("en")} aria-label="英語でチャレンジ">
         <span className="th-comp-language-icon" aria-hidden="true">🔤</span>
         <strong>Challenge in English</strong><small>英語の問題で内容を理解</small>
         <span className="th-comp-language-state">{cleared.en?"✓ CLEAR · 復習する":"START →"}</span>
       </button>
     </div>
     {bothCleared&&<p className="th-comp-both-clear" role="status">🎉 英語・日本語、両方クリア！</p>}
   </div>:
   finished?<div className="th-comp-results" role="status">
      <span className="th-kicker">COMPREHENSION RESULT · {language==="en"?"ENGLISH":"JAPANESE"}</span>
      <h3>{Math.round(correct*100/(questions.length||1))}%</h3>
      <p>{correct} / {questions.length}問正解</p>
      <ComprehensionPairStatus cleared={cleared}/>
      {bothCleared?<strong className="th-comp-both-clear">🎉 EN・JP 両方クリア！</strong>:
       <p className="th-comp-requirement">両方100％正解でクリアです。未クリアの言語にも挑戦しましょう。</p>}
      <div className="th-comp-result-actions">
        {!bothCleared&&<button type="button" className="th-primary" onClick={()=>begin(otherLanguage)}>
           {otherLanguage==="ja"?"日本語に挑戦 →":"英語に挑戦 →"}</button>}
        <button type="button" className="th-small" onClick={()=>restart()}>この言語をもう一度</button>
        <button type="button" className="th-small" onClick={toLanguageSelect}>言語選択へ</button>
      </div>
   </div>:
   q?<div className="th-comprehension-quiz">
      <ComprehensionPairStatus cleared={cleared}/>
      <div className="th-comprehension-progress">
        <span>QUESTION <strong>{index+1}</strong> / {questions.length}</span>
        <span>{language==="en"?"ENGLISH":"日本語"} · {q.type==="fact"?"内容理解":"重要文"}</span>
      </div>
      <div className="th-comp-progress-track" aria-hidden="true">
        <div style={{width:((index+(answered!==null?1:0))*100/questions.length)+"%"}}/>
      </div>
      <h3 className="th-comp-question">
        <GlossaryText key={unit+":"+language+":"+index} text={q.prompt} words={lesson.words} onOpen={setWordHelp}/>
      </h3>
      <p className="th-comp-hint">青い英単語はタップして日本語の意味を確認できます。</p>
      <div className="th-comprehension-options">
        {q.options.map((option,i)=><div key={i} role="button" tabIndex={answered!==null?-1:0}
          aria-disabled={answered!==null} aria-label={"選択肢 "+(i+1)+": "+option}
          className={"th-choice th-comprehension-choice "+(answered!==null?(option===q.correct?"correct":option===answered?"incorrect":""):"")}
          onClick={()=>choose(option)}
          onKeyDown={event=>{
            if(event.target!==event.currentTarget)return;
            if(event.key==="Enter"||event.key===" "){event.preventDefault();choose(option);}
          }}>
          <span className="th-choice-letter" aria-hidden="true">{String.fromCharCode(65+i)}</span>
          <span><GlossaryText text={option} words={lesson.words} onOpen={setWordHelp}/></span>
        </div>)}
      </div>
      {answered!==null&&<div className="th-comp-response">
        <div className="th-comp-response-heading"><strong>{answered===q.correct?"✓ 正解！":"正解："+q.correct}</strong>
          <button type="button" className="th-primary" disabled={!!celebration} onClick={next}>
            {index===questions.length-1?"結果を見る":"次の問題 →"}
          </button>
        </div>
        {q.source?.en&&<details className="th-comp-source">
          <summary>📖 本文の根拠を確認 <small>{q.source.reference}</small></summary>
          <p>{q.source.en}</p>{q.source.ja&&<p>{q.source.ja}</p>}
        </details>}
      </div>}
    </div>:<p>このUnitの内容問題は準備中です。</p>}
    <WordHelpModal word={wordHelp} onClose={()=>setWordHelp(null)}/>
    <AnswerCelebration result={celebration}/>
  </section>;
}
export function GrammarPanel({unit}) {
  const sentences=useMemo(()=>(allUnitsData[unit]||[])
    .filter((item)=>item.en&&item.ja&&item.en.split(/\s+/).length>=5&&item.en.split(/\s+/).length<=16)
    .slice(0,10),[unit]);
  const [index,setIndex]=useState(0),[picked,setPicked]=useState([]),[checked,setChecked]=useState(false),[,setSolved]=useState([]);
 const [soundOn,setSoundOn]=useState(()=>{
  try{return window.localStorage.getItem("treasurePracticeSound")!=="off";}catch(_){return true;}
 });
 const toggleSound=()=>setSoundOn(prev=>{
  const next=!prev;
  try{window.localStorage.setItem("treasurePracticeSound",next?"on":"off");}catch(_){}
  return next;
 });
  const [best,saveBest]=useBest("th-grammar-best:"+unit);
  useEffect(()=>{setIndex(0);setPicked([]);setChecked(false);setSolved([]);},[unit]);
  const sentence=sentences[index]||{en:"",ja:""};
  const words=useMemo(()=>sentence.en.split(/\s+/).filter(Boolean),[sentence.en]);
  const positions=useMemo(()=>{const a=shuffle(words.map((_,i)=>i));return a.every((n,i)=>n===i)?a.reverse():a;},[words]);
  const correct=picked.length===words.length&&picked.every((n,i)=>n===i);
  const check=()=>{if(checked)return;setChecked(true);playAnswerSound(correct,soundOn);saveGrammarAnswer(unit,index,correct,sentences.length);if(correct){setSolved((old)=>{const next=[...new Set([...old,index])];saveBest(next.length);return next;});}};
  return <section className="th-panel">
    <header className="th-panel-heading"><span className="th-kicker">UNIT {unit} · GRAMMAR</span><h2>Sentence Builder</h2>
      <p>実際の本文を使った語順並び替え練習 · ベスト {best} 問正解</p></header>
    {sentences.length?<div className="th-quiz-card"><span className="th-kicker">SENTENCE {index+1}/{sentences.length}</span>
      <p>日本語の意味をヒントに、単語を正しい語順に並べましょう。</p>
      <p className="th-grammar-translation" lang="ja" aria-label="並び替える英文の日本語訳"><span aria-hidden="true">🇯🇵</span> {sentence.ja}</p>
      <div className="th-assembled">{picked.length?picked.map((n,i)=><button key={i} disabled={checked}
        onClick={()=>setPicked((arr)=>arr.filter((_,j)=>j!==i))}>{words[n]}</button>):"ここに選択した単語が表示されます"}</div>
      <div className="th-token-grid">{positions.filter((n)=>!picked.includes(n)).map((n)=><button key={n}
        onClick={()=>setPicked((a)=>[...a,n])}>{words[n]}</button>)}</div>
      {checked&&<div className="th-feedback"><strong>{correct?"✓ 正解！":"惜しい！語順を確認しましょう。"}</strong><p>{sentence.en}</p></div>}
      <div className="th-actions"><button className="th-small" onClick={()=>{setPicked([]);setChecked(false);}}>リセット</button>
        <button type="button" className="th-small" aria-label="英文並び替えの効果音を切り替え"
          aria-pressed={soundOn} onClick={toggleSound}>{soundOn?"🔊 効果音 ON":"🔇 効果音 OFF"}</button>
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
  const mic=useReadingSpeech(lesson.en,(value,spoken)=>{setPercent(value);setTranscript(spoken);saveReadingResult(unit,scope,shadowing,value);},
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
