import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReadingSpeech } from "../utils/useReadingSpeech";
import { words } from "../utils/readingScore";
import { playSound } from "../utils/sound";
import ReadingCelebration from "./ReadingCelebration";
import "./ReadingWordHelp.css";

// Practice a word or phrase without the name exclusions used in scene scoring.
export function wordPracticeScore(expected, spoken) {
  const a=words(expected), b=words(spoken);
  return {percent:a.length && a.length===b.length && a.every((v,i)=>v===b[i])?100:0};
}

function SpeakerButton({label,disabled,onClick}) {
  return <button type="button" className="rw-speaker" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none"/>
      <path d="M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>
    </svg>
  </button>;
}

export default function ReadingWordModal({entry,context,onClose}) {
  const [target,setTarget]=useState(entry.word);
  const [result,setResult]=useState(null);
  const [celebration,setCelebration]=useState(0);
  const [error,setError]=useState("");
  const timer=useRef(null), dialog=useRef(null);
  const mic=useReadingSpeech(target,(percent,spoken)=>{
    setResult({percent,spoken});
    if(percent===100){
      setCelebration(Date.now());
      playSound("correct");
      clearTimeout(timer.current);
      timer.current=setTimeout(()=>setCelebration(0),2200);
    }
  },wordPracticeScore,"word:"+target,100,true);
  const micRef=useRef(mic);
  micRef.current=mic;
  const closeRef=useRef(onClose);
  closeRef.current=onClose;
  useEffect(()=>{
    const before=document.activeElement;
    dialog.current?.focus();
    const handle=event=>{
      if(event.key==="Escape"){
        event.preventDefault();event.stopPropagation();closeRef.current();
      } else if(event.key==="Tab"){
        const controls=Array.from(dialog.current?.querySelectorAll("button:not([disabled])")||[]);
        if(!controls.length)return;
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){event.preventDefault();first.focus();}
      }
    };
    window.addEventListener("keydown",handle,true);
    return ()=>{
      window.removeEventListener("keydown",handle,true);
      clearTimeout(timer.current);
      window.speechSynthesis?.cancel();
      if(before?.isConnected)before.focus();
    };
  },[]);
  const speak=text=>{
    setError("");
    try{
      if(!window.SpeechSynthesisUtterance||!window.speechSynthesis?.speak)throw Error();
      window.speechSynthesis.cancel();
      const u=new window.SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=.85;
      u.onerror=e=>{if(!["canceled","interrupted"].includes(e.error))setError("音声を再生できませんでした。");};
      window.speechSynthesis.speak(u);
    }catch(_){setError("この端末では発音音声を再生できません。");}
  };
  const choose=text=>{
    mic.cancel();window.speechSynthesis?.cancel();clearTimeout(timer.current);
    setTarget(text);setResult(null);setCelebration(0);
  };
  const close=()=>{mic.cancel();onClose();};
  return createPortal(<div className="rw-shade" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}>
    <section className="rw-dialog" role="dialog" aria-modal="true" aria-label="語句の意味と発音練習" tabIndex={-1} ref={dialog}>
      <header><span>WORD & PHRASE STUDIO</span><button type="button" className="rw-close" aria-label="閉じる" onClick={close}>×</button></header>
      <div className="rw-columns">
      <div className="rw-definition" aria-label="単語・熟語の意味">
      <div className="rw-word-line"><strong className="rw-word">{entry.word}</strong><SpeakerButton label="単語の発音を聞く" disabled={mic.phase!=="idle"} onClick={()=>speak(entry.word)}/></div>
      {entry.pronunciation&&<div className="rw-ipa">/{entry.pronunciation}/</div>}
      <p className="rw-meaning">{entry.meaning||"この単語の個別の意味は未登録です。"}</p>
      {entry.base&&entry.base.toLowerCase()!==entry.word.toLowerCase()&&<small>見出し語：{entry.base}</small>}
      {entry.phrase&&<div className="rw-phrase"><small>本文中の語句・熟語</small><div className="rw-word-line"><b>{entry.phrase.word}</b><SpeakerButton label="語句の発音を聞く" disabled={mic.phase!=="idle"} onClick={()=>speak(entry.phrase.word)}/></div><p>{entry.phrase.meaning}</p>
        {entry.phrase.pronunciation&&<small>/{entry.phrase.pronunciation}/</small>}
      </div>}
      {!entry.meaning&&<details><summary>文脈で意味を確認</summary><p>{context.en}</p><p>{context.ja}</p></details>}
      {error&&<p role="alert">{error}</p>}
      </div>
      <div className="rw-practice" aria-label="発音練習">
        <small>PRONUNCIATION CHECK</small>
        {entry.phrase&&<div className="rw-targets">
          <button type="button" aria-pressed={target===entry.word} disabled={mic.phase!=="idle"} onClick={()=>choose(entry.word)}>単語</button>
          <button type="button" aria-pressed={target===entry.phrase.word} disabled={mic.phase!=="idle"} onClick={()=>choose(entry.phrase.word)}>熟語・語句</button>
        </div>}
        <b>{target}</b>
        <div className="rw-mic-area">
          <button type="button" className={"rw-mic"+(mic.phase==="listening"?" is-listening":"")+(result?.percent===100?" is-correct":"")} disabled={mic.phase==="scoring"} aria-label={mic.phase==="listening"?"発音チェックを停止":"発音チェック"} aria-pressed={mic.phase==="listening"} title={mic.phase==="listening"?"停止":"発音チェック"} onClick={()=>{
            if(mic.phase==="listening"){mic.cancel();setResult(null);return;}
            window.speechSynthesis?.cancel();clearTimeout(timer.current);setResult(null);setCelebration(0);mic.begin();
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {mic.phase==="listening"?<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>:result?.percent===100?<path d="m5 12 4 4L19 6"/>:<><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></>}
            </svg>
          </button>
          <span className="rw-mic-caption">{mic.phase==="listening"?"認識中・タップで停止":result?.percent===100?"もう一度練習":"発音チェック"}</span>
        </div>
        <p role="status">{result?.percent===100?"✓ CORRECT!":mic.status}</p>
        {(mic.transcript||result?.spoken)&&<p className="rw-heard">認識：{mic.transcript||result.spoken}</p>}
      </div>
      </div>
    </section>
    {celebration>0&&<div className="rw-celebration" aria-hidden="true"><ReadingCelebration id={celebration}/><div className="rw-success"><span>✓</span><strong>CORRECT!</strong><small>Great pronunciation!</small></div></div>}
  </div>,document.body);
}
