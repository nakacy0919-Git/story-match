import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { lookupTranslation, sentenceParts } from "../utils/treasureTranslation";

// A true floating card: it is rendered outside the scrollable lesson panel.
// Words use a centered dialog; selected sentences retain contextual floating translations.
function FloatingCard({popup,onClose,onSpeak,audioError}) {
  if (!popup) return null;
  const isWord=popup.kind==="word";
  const cardWidth=Math.min(372,window.innerWidth-24);
  const left=Math.max(12,Math.min(popup.rect.left,window.innerWidth-cardWidth-12));
  const cardHeight=284;
  const top=popup.rect.bottom+cardHeight+14<window.innerHeight
    ? popup.rect.bottom+10
    : Math.max(12,popup.rect.top-cardHeight-10);
  const content=<div className={"th-float-card"+(isWord?" th-word-modal":"")}
    ref={popup.cardRef} role="dialog" aria-modal={isWord?"true":"false"}
    aria-label={isWord?"単語の意味と発音":"選択した英文の訳"}
    style={isWord?undefined:{left,top,width:cardWidth}}>
    <div className="th-float-header">
      <span>{isWord?"📘 Vocabulary":"🇯🇵 Sentence Translation"}</span>
      <button type="button" className="th-float-close" onClick={onClose}
        autoFocus={isWord} aria-label="ポップアップを閉じる">×</button>
    </div>
    {isWord ? <>
      <div className="th-float-word">{popup.word.word}</div>
      {(popup.word.pronunciation||popup.word.pron)&&<div className="th-float-phonetic">
        {popup.word.pronunciation||popup.word.pron}
      </div>}
      <div className="th-float-meaning">{popup.word.meaning}</div>
      <button type="button" className="th-float-speak"
        onClick={()=>onSpeak(popup.word.word)}>🔊 発音を聞く</button>
      {audioError&&<div className="th-audio-error" role="alert">{audioError}</div>}
    </> : <>
      <div className="th-float-source">{popup.sentence}</div>
      <span className="th-float-sublabel">{popup.translation.label}</span>
      <div className="th-float-ja">{popup.translation.text||"対応する日本語訳は未登録です。"}</div>
      {popup.translation.kind!=="sentence"&&<small className="th-float-caveat">
        この箇所は一文訳を確認できないため、対応する広い範囲の訳を表示しています。
      </small>}
    </>}
  </div>;
  return createPortal(isWord
    ? <div className="th-word-backdrop" onPointerDown={(event)=>{
        if(event.target===event.currentTarget)onClose();
      }}>{content}</div>
    : content,document.body);
}

export default function InteractivePassage({text,words,unit,scope,fontSize}) {
  const [popup,setPopup]=useState(null);
  const [audioError,setAudioError]=useState("");
  const containerRef=useRef(null), cardRef=useRef(null), timerRef=useRef(null), selectingRef=useRef(false);
  const sentences=useMemo(()=>sentenceParts(text),[text]);
  const sentenceTexts=useMemo(()=>sentences.map((item)=>item.text),[sentences]);
  const terms=useMemo(()=>{
    const map=new Map();
    for(const word of words){
      for(const term of word.targetStrings || [word.word]){
        if(term)map.set(term.toLowerCase(),word);
      }
    }
    return map;
  },[words]);
  const wordRegex=useMemo(()=>{
    const keys=[...terms.keys()].sort((a,b)=>b.length-a.length);
    if(!keys.length)return null;
    const escaped=keys.map((item)=>item.replace(/[|\\{}()[\]^$+*?.]/g,"\\$&"));
    return new RegExp("\\b("+escaped.join("|")+")\\b","gi");
  },[terms]);
  const close=useCallback(()=>{setPopup(null);setAudioError("");},[]);
  useEffect(()=>{close();},[unit,scope,text,close]);
  const speak=(word)=>{
    setAudioError("");
    try{
      if(typeof window.SpeechSynthesisUtterance!=="function" || !window.speechSynthesis?.speak){
        setAudioError("このブラウザでは音声合成を使用できません。");return;
      }
      window.speechSynthesis.cancel();
      const utterance=new window.SpeechSynthesisUtterance(word);
      utterance.lang="en-US";utterance.rate=0.85;
      const voices=window.speechSynthesis.getVoices?.()||[];
      utterance.voice=voices.find((v)=>v.lang==="en-US")||voices.find((v)=>v.lang?.startsWith("en"))||null;
      window.speechSynthesis.speak(utterance);
    }catch(_){setAudioError("再生できませんでした。ブラウザの音声設定を確認してください。");}
  };
  const openWord=(event,word)=>{
    setAudioError("");
    setPopup({kind:"word",word,rect:event.currentTarget.getBoundingClientRect(),cardRef});
    speak(word.word);
  };
  const openSentence=useCallback((index,rect)=>{
    if(index<0 || index>=sentenceTexts.length)return;
    const sentence=sentenceTexts[index];
    setPopup({
      kind:"sentence",sentence,rect,
      translation:lookupTranslation(unit,scope,index,sentence,sentenceTexts),
      cardRef,
    });
  },[unit,scope,sentenceTexts]);
  const selectedSentence=useCallback(()=>{
    const selection=window.getSelection?.();
    const host=containerRef.current;
    if(!selection||selection.isCollapsed||!selection.toString().trim()||!host||!selection.rangeCount)return false;
    const node=selection.anchorNode;
    if(!node||!host.contains(node))return false;
    const el=node.nodeType===1?node:node.parentElement;
    const sentenceEl=el?.closest?.("[data-sentence-index]");
    if(!sentenceEl)return false;
    const rect=selection.getRangeAt(0).getBoundingClientRect();
    openSentence(Number(sentenceEl.dataset.sentenceIndex),rect);
    return true;
  },[openSentence]);
  const handlePointerUp=(event)=>{
    selectingRef.current=false;
    if(event.target.closest?.(".th-vocab-inline")||event.target.closest?.(".th-float-card"))return;
    const target=event.target.closest?.("[data-sentence-index]");
    if(timerRef.current)window.clearTimeout(timerRef.current);
    timerRef.current=window.setTimeout(()=>{
      if(selectedSentence())return;
      if(target)openSentence(Number(target.dataset.sentenceIndex),target.getBoundingClientRect());
    },80);
  };
  useEffect(()=>{
    const onSelectionChange=()=>{
      if(selectingRef.current)return;
      if(timerRef.current)window.clearTimeout(timerRef.current);
      timerRef.current=window.setTimeout(()=>selectedSentence(),180);
    };
    const onKey=(event)=>{
      if(event.key==="Escape")close();
    };
    const onOutside=(event)=>{
      if(popup && cardRef.current && !cardRef.current.contains(event.target) &&
         !containerRef.current?.contains(event.target))close();
    };
    document.addEventListener("selectionchange",onSelectionChange);
    document.addEventListener("keydown",onKey);
    document.addEventListener("pointerdown",onOutside);
    return ()=>{
      document.removeEventListener("selectionchange",onSelectionChange);
      document.removeEventListener("keydown",onKey);
      document.removeEventListener("pointerdown",onOutside);
      if(timerRef.current)window.clearTimeout(timerRef.current);
    };
  },[popup,selectedSentence,close]);
  const renderWords=(line)=>{
    if(!wordRegex)return line;
    const bits=line.split(wordRegex);
    return bits.map((bit,index)=>{
      const term=terms.get(bit.toLowerCase());
      return term ? <button key={index} type="button"
        className="th-vocab-inline"
        aria-label={bit+" の意味と発音"}
        title={bit+" の意味と発音"}
        onClick={(event)=>{event.stopPropagation();openWord(event,term);}}>
        {bit}</button> : <React.Fragment key={index}>{bit}</React.Fragment>;
    });
  };
  return <div ref={containerRef} className="th-reading-text th-interactive-text"
    style={fontSize?{fontSize:fontSize+"px"}:undefined}
    onPointerDown={()=>{selectingRef.current=true;}}
    onPointerUp={handlePointerUp}
    onPointerCancel={()=>{selectingRef.current=false;}}
    onKeyUp={()=>selectedSentence()}>
    {sentences.map(({prefix,text:line},index)=>
      <React.Fragment key={index}>{prefix}<span className="th-sentence"
        data-sentence-index={index} title="英文を選択すると日本語訳が表示されます">
        {renderWords(line)}</span></React.Fragment>)}
    <FloatingCard popup={popup} onClose={close} onSpeak={speak} audioError={audioError}/>
  </div>;
}