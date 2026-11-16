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
  },wordPracticeScore,"word:"+target,100);
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
      <strong className="rw-word">{entry.word}</strong>
      {entry.pronunciation&&<div className="rw-ipa">/{entry.pronunciation}/</div>}
      <p className="rw-meaning">{entry.meaning||"この単語の個別の意味は未登録です。"}</p>
      {entry.base&&entry.base.toLowerCase()!==entry.word.toLowerCase()&&<small>見出し語：{entry.base}</small>}
      <button type="button" className="rw-listen" disabled={mic.phase!=="idle"} onClick={()=>speak(entry.word)}>🔊 単語の発音を聞く</button>
      {entry.phrase&&<div className="rw-phrase"><small>本文中の語句・熟語</small><b>{entry.phrase.word}</b><p>{entry.phrase.meaning}</p>
        {entry.phrase.pronunciation&&<small>/{entry.phrase.pronunciation}/</small>}
        <button type="button" className="rw-listen" disabled={mic.phase!=="idle"} onClick={()=>speak(entry.phrase.word)}>🔊 語句の発音を聞く</button>
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
        <button type="button" className="rw-mic" disabled={mic.phase==="scoring"} onClick={()=>{
          if(mic.phase==="listening"){mic.stop();return;}
          window.speechSynthesis?.cancel();clearTimeout(timer.current);setResult(null);setCelebration(0);mic.begin();
        }}>{mic.phase==="listening"?"■ 終了・判定":mic.phase==="scoring"?"判定中…":"🎙 発音チェック"}</button>
        <p role="status">{result?(result.percent===100?"✓ CORRECT! 正しく認識されました。":"もう一度発音してみましょう。"):mic.status}</p>
        {(mic.transcript||result?.spoken)&&<p className="rw-heard">認識：{mic.transcript||result.spoken}</p>}
        <small>音声認識による語句の一致判定です。音素単位の発音評価ではありません。</small>
      </div>
      </div>
    </section>
    {celebration>0&&<div className="rw-celebration" aria-hidden="true"><ReadingCelebration id={celebration}/><div className="rw-success"><span>✓</span><strong>CORRECT!</strong><small>Great pronunciation!</small></div></div>}
  </div>,document.body);
}
