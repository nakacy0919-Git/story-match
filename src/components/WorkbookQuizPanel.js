import React, {useEffect, useState} from "react";
import {workbookReading} from "../workbookReading";
import {workbookGrammar} from "../workbookGrammar";
import {workbookVarious,workbookListeningPending} from "../workbookVarious";
import {saveQuizResult} from "../utils/studyProgress";
import {AnswerCelebration,playAnswerSound} from "./ComprehensionHelpers";
import "../WorkbookQuiz.css";

export const workbookSections=[
 {id:"workbook-reading",name:"Reading Questions",ja:"本文読解問題",icon:"📖",data:workbookReading,metric:"workbookReading"},
 {id:"workbook-grammar",name:"Grammar & Writing",ja:"文法・英作文",icon:"🔤",data:workbookGrammar,metric:"workbookGrammar"},
 {id:"workbook-various",name:"Various Questions",ja:"語彙・主題・ことわざ",icon:"🧩",data:workbookVarious,metric:"workbookVarious"}
];
export function getWorkbookQuestions(unit,section){
 return workbookSections.find(x=>x.id===section)?.data[unit]||[];
}
const norm=(x)=>String(x??"").normalize("NFKC").toLowerCase().replace(/[“”‘’]/g,"'")
 .replace(/[^a-z0-9一-龯ぁ-んァ-ヶー]/g,"");
const validShort=(value,variants)=>(variants||[]).some(x=>norm(x)===norm(value));
const matchesOrder=(tokens,indices,target)=>norm(indices.map(i=>tokens[i]).join(" "))===norm(target);
export {norm as normalizeWorkbookAnswer,validShort,matchesOrder};

function PromptChoices({question,selected,onSelect,locked}){
 if(question.type==="multi")return <div className="th-workbook-options">
  {question.options.map((text,i)=><button key={i} type="button"
    className={"th-workbook-option "+(selected.includes(i)?"chosen":"")}
    aria-pressed={selected.includes(i)} disabled={locked}
    onClick={()=>onSelect(selected.includes(i)?selected.filter(x=>x!==i):[...selected,i])}>
    <span className="th-wb-letter">{String.fromCharCode(65+i)}</span>{text}
  </button>)}
 </div>;
 return <div className="th-workbook-options">{question.options.map((text,i)=><button
   type="button" key={i} disabled={locked} aria-pressed={selected===i}
   className={"th-workbook-option "+(selected===i?"chosen":"")}
   onClick={()=>onSelect(i)}><span className="th-wb-letter">{String.fromCharCode(65+i)}</span>{text}
 </button>)}</div>;
}
function OrderQuestion({question,order,onOrder,locked}){
 return <div className="th-wb-order">
   <div className="th-wb-order-answer" aria-label="組み立てた英文">
    {order.length?order.map((i,n)=><button key={i} type="button" disabled={locked}
      onClick={()=>onOrder(order.filter(v=>v!==i))} title="押すと戻ります">{question.tokens[i]} <span>×</span></button>)
      :<small>下の語句を順にタップして英文を作りましょう。</small>}
   </div>
   <div className="th-wb-order-pool">
    {question.tokens.map((token,i)=><button type="button" key={i} disabled={locked||order.includes(i)}
      onClick={()=>onOrder([...order,i])}>{token}</button>)}
   </div>
   {!locked&&order.length>0&&<button type="button" className="th-wb-clear" onClick={()=>onOrder([])}>やり直す</button>}
 </div>;
}
function correctText(q){
 if(q.type==="choice")return q.options[q.answer];
 if(q.type==="multi")return q.answer.map(i=>q.options[i]).join("／");
 if(q.type==="short")return q.answers[0];
 return q.answer;
}
function evaluate(q,selected,typed,order){
 if(q.type==="choice")return selected===q.answer;
 if(q.type==="multi")return selected.length===q.answer.length && q.answer.every(i=>selected.includes(i));
 if(q.type==="short")return validShort(typed,q.answers);
 if(q.type==="order")return matchesOrder(q.tokens,order,q.answer);
 return false;
}
export default function WorkbookQuizPanel({unit,section,onOpen}){
 const category=workbookSections.find(x=>x.id===section);
 const questions=getWorkbookQuestions(unit,section);
 const [index,setIndex]=useState(0),[answer,setAnswer]=useState(null),[multi,setMulti]=useState([]),
 [typed,setTyped]=useState(""),[order,setOrder]=useState([]),[review,setReview]=useState(null),
 [earned,setEarned]=useState(0),[finished,setFinished]=useState(false),[overlay,setOverlay]=useState(null);
 const [soundOn,setSoundOn]=useState(()=>{
  try{return localStorage.getItem("treasureWorkbookSound")!=="off";}catch(_){return true;}
 });
 useEffect(()=>{setIndex(0);setAnswer(null);setMulti([]);setTyped("");setOrder([]);
  setReview(null);setEarned(0);setFinished(false);setOverlay(null);},[unit,section]);
 useEffect(()=>{
  if(!overlay)return undefined;
  const timeout=window.setTimeout(()=>setOverlay(null),1250);
  return ()=>window.clearTimeout(timeout);
 },[overlay]);
 const q=questions[index];
 const completed=review!==null;
 const score=(isCorrect)=>{
   if(completed||!q)return;
   const next=earned+(isCorrect?1:0);
   setEarned(next);setReview(isCorrect);
   playAnswerSound(isCorrect,soundOn);
   setOverlay({correct:isCorrect,index});
   if(index===questions.length-1&&questions.length){
    saveQuizResult(unit,category.metric,"complete",Math.round(next*100/questions.length));
   }
 };
 const submit=()=>score(evaluate(q,q?.type==="multi"?multi:answer,typed,order));
 const next=()=>{
  if(overlay)return;
  if(index+1>=questions.length){setFinished(true);return;}
  setIndex(i=>i+1);setAnswer(null);setMulti([]);setTyped("");setOrder([]);setReview(null);
 };
 const toggleSound=()=>{
  setSoundOn(prev=>{
   const next=!prev;
   try{localStorage.setItem("treasureWorkbookSound",next?"on":"off");}catch(_){}
   return next;
  });
 };
 const canSubmit=q?.type==="multi"?multi.length>0:
   q?.type==="choice"?answer!==null:
   q?.type==="order"?order.length===q.tokens.length:
   q?.type==="short"?typed.trim().length>0:false;
 const pending=section==="workbook-various"?workbookListeningPending[unit]:null;
 const isWritten=q?.type==="written";
 const reset=()=>{setIndex(0);setAnswer(null);setMulti([]);setTyped("");setOrder([]);setReview(null);
  setEarned(0);setFinished(false);setOverlay(null);};
 if(!category)return null;
 return <section className="th-panel th-workbook-panel">
  <header className="th-workbook-header">
   <div><span className="th-kicker">TREASURE HUNT WORKBOOK · UNIT {unit}</span>
    <h2>{category.icon} {category.name}</h2><p>{category.ja} · 問題集に対応した練習問題</p></div>
   <div className="th-workbook-head-actions">
    <span className="th-wb-count">{questions.length} 問</span>
    <button type="button" className="th-wb-sound" aria-label="問題集の効果音を切り替え"
      aria-pressed={soundOn} onClick={toggleSound}>{soundOn?"🔊":"🔇"}</button>
   </div>
  </header>
  {!questions.length?<p>このUnitの問題集は未登録です。Unit 10〜15でご利用ください。</p>:
   finished?<div className="th-wb-results">
    <span className="th-kicker">UNIT {unit} · {category.name.toUpperCase()}</span>
    <strong>{Math.round(earned/questions.length*100)}%</strong>
    <h3>{earned} / {questions.length} 問達成</h3>
    <p>記述問題は解答例と照らした自己採点を含みます。</p>
    <button type="button" className="th-primary" onClick={reset}>もう一度練習</button>
   </div>:
   <div className="th-workbook-card">
    <div className="th-wb-question-meta">
     <span>QUESTION {index+1} / {questions.length}</span>
     <span>p.{q.page} · {q.section}</span>
    </div>
    <div className="th-wb-meter"><div style={{width:(index+(completed?1:0))*100/questions.length+"%"}}/></div>
    <h3 className="th-wb-prompt">{q.prompt}</h3>
    {q.paragraph&&<span className="th-wb-paragraph">本文 第{q.paragraph}段落</span>}
    {q.type==="choice"&&<PromptChoices question={q} selected={answer} onSelect={setAnswer} locked={completed}/>}
    {q.type==="multi"&&<PromptChoices question={q} selected={multi} onSelect={setMulti} locked={completed}/>}
    {q.type==="short"&&<form onSubmit={event=>{event.preventDefault();if(canSubmit)submit();}}>
      <label className="th-wb-input-label">解答を入力
      <input aria-label="空所の解答" value={typed} onChange={event=>setTyped(event.target.value)}
        disabled={completed} autoComplete="off" spellCheck={false} placeholder="答えを入力"/>
      </label></form>}
    {q.type==="order"&&<OrderQuestion question={q} order={order} onOrder={setOrder} locked={completed}/>}
    {isWritten&&<label className="th-wb-input-label">自分の解答
     <textarea aria-label="記述問題の解答" value={typed} onChange={e=>setTyped(e.target.value)}
      placeholder="まず自分で書いてみましょう。" rows={3} disabled={completed}/>
    </label>}
    {!completed?<div className="th-wb-footer-actions">
      {isWritten?<button type="button" className="th-primary" onClick={()=>setReview("pending")}>解答例を確認する</button>:
      <button type="button" className="th-primary" disabled={!canSubmit} onClick={submit}>判定する</button>}
      <span>自動判定：選択・穴埋め・並び替え ／ 記述：自己採点</span>
    </div>:<div className="th-wb-explanation">
      <div className="th-wb-explanation-header">
       <strong>{review==="pending"?"解答例と照合":review?"✓ 正解！":"次のポイントを確認"}</strong>
       <span className="th-wb-score">達成 {earned} / {index+1}</span>
      </div>
      <div className="th-wb-correct-answer"><small>{isWritten?"模範解答例":"正解"}</small>
       <p>{correctText(q)}</p></div>
      {q.explanation&&<p className="th-wb-explanation-text">{q.explanation}</p>}
      {review==="pending"?<div className="th-wb-self-check">
       <p>自分の解答が意味・文法の点で合っているか確認してください。別の適切な訳・表現も正解になります。</p>
       <button type="button" onClick={()=>score(true)}>できた <span>✓</span></button>
       <button type="button" onClick={()=>score(false)}>もう一度 <span>↻</span></button>
      </div>:<button type="button" className="th-primary th-wb-next"
       disabled={!!overlay} onClick={next}>{index+1===questions.length?"結果を見る":"次の問題 →"}</button>}
    </div>}
   </div>}
  {pending&&<details className="th-wb-pending">
    <summary>🎧 Listening：p.{pending.page}（原音声を確認できるまで採点対象外）</summary>
    <strong>{pending.title}</strong>
    {pending.details.map((desc,i)=><p key={i}>{i+1}. {desc}</p>)}
    <small>{pending.reason}。答えは推測で登録していません。</small>
   </details>}
  <div className="th-wb-disclaimer">
   原本の問題番号・ページに対応したデジタル練習版です。記述の解答は教材用解答例であり出版社の公式解答ではありません。
   {section==="workbook-reading"&&<button type="button" onClick={()=>onOpen("script")}>本文を確認する <span>↗</span></button>}
  </div>
  <AnswerCelebration result={overlay}/>
 </section>;
}
