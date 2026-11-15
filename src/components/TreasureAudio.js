import React, { useEffect, useRef, useState } from "react";
import { getLesson, unitKey } from "./TreasurePanels";
import { saveListeningCompletion, readUnitStudy } from "../utils/studyProgress";
const recordScopes = {
  1: ["full","p1","p2","p3","p4"],
  4: ["full","p1","p2","p3"],
  5: ["full","p1","p2","p3","p4"],
  6: ["full","p1","p2","p3","p4"],
};
const speeds = [0.75,0.85,1,1.25];
export function hasTreasureAudio(unit,scope) {
  return !!recordScopes[unit]?.includes(scope);
}
export function treasureAudioUrl(unit,scope) {
  return "/audio-treasure/unit"+unit+"/"+unitKey(unit)+"_"+scope+".mp3";
}
export default function TreasureAudio({unit,scope}) {
  const [rate,setRate]=useState(0.85);
  const [listenCount,setListenCount]=useState(0);
  useEffect(()=>{const student=(()=>{try{return JSON.parse(window.localStorage.getItem("storyMatchStudent"));}catch(_){return null;}})();setListenCount(readUnitStudy(student,unit).listening?.[scope]||0);},[unit,scope]);
  const completed=()=>{if(saveListeningCompletion(unit,scope))setListenCount(n=>n+1);};
  const [playing,setPlaying]=useState(false);
  const [error,setError]=useState("");
  const [source,setSource]=useState("");
  const audioRef=useRef(null);
  const loop=useRef({start:null,end:null});
  const [loopInfo,setLoopInfo]=useState({start:null,end:null});
  const playbackId=useRef(0);
  const utteranceRef=useRef(null);
  const release=()=>{
    playbackId.current++;
    const a=audioRef.current;audioRef.current=null;
    if(a){a.onended=null;a.onerror=null;a.ontimeupdate=null;try{a.pause();}catch(_){}}
    const u=utteranceRef.current;utteranceRef.current=null;
    if(u){u.onend=null;u.onerror=null;try{window.speechSynthesis?.cancel();}catch(_){}}
  };
  const stop=()=>{release();setPlaying(false);};
  useEffect(()=>{
    const interrupt=()=>{release();setPlaying(false);};
    window.addEventListener("powerslide-mic-start",interrupt);
    return()=>{window.removeEventListener("powerslide-mic-start",interrupt);release();};
    // This player is keyed by unit, scope and panel.
  },[]);
  const playSpeech=(id)=>{
    if(id!==playbackId.current)return;
    const text=getLesson(unit,scope).en;
    if(!text||!window.speechSynthesis||!window.SpeechSynthesisUtterance){
      setError("この範囲の音声を再生できません。");setPlaying(false);return;
    }
    try {
      const u=new window.SpeechSynthesisUtterance(text);
      utteranceRef.current=u;
      u.lang="en-US";u.rate=rate;
      const voices=window.speechSynthesis.getVoices?.()||[];
      u.voice=voices.find((v)=>v.lang==="en-US")||voices.find((v)=>v.lang?.startsWith("en"))||null;
      u.onend=()=>{if(id!==playbackId.current||utteranceRef.current!==u)return;utteranceRef.current=null;playbackId.current++;completed();setPlaying(false);};
      u.onerror=()=>{if(id!==playbackId.current||utteranceRef.current!==u)return;utteranceRef.current=null;playbackId.current++;setPlaying(false);setError("音声合成に失敗しました。もう一度再生してください。");};
      window.speechSynthesis.cancel();
      setPlaying(true);setSource("音声合成");
      window.speechSynthesis.speak(u);
    }catch(_){if(id===playbackId.current){release();setError("音声合成を開始できません。");setPlaying(false);}}
  };
  const play=()=>{
    setError("");
    if(playing){stop();return;}
    release();
    const id=playbackId.current;
    setPlaying(true);
    if(!hasTreasureAudio(unit,scope)){playSpeech(id);return;}
    let a;
    try{a=new window.Audio(treasureAudioUrl(unit,scope));}catch(_){playSpeech(id);return;}
    audioRef.current=a;a.playbackRate=rate;a.preload="auto";
    const active=()=>id===playbackId.current&&audioRef.current===a;
    const fallback=()=>{
      if(!active())return;
      a.onended=null;a.onerror=null;a.ontimeupdate=null;
      try{a.pause();}catch(_){}
      audioRef.current=null;playSpeech(id);
    };
    a.ontimeupdate=()=>{
      if(!active())return;
      const p=loop.current;
      if(p.start!==null&&p.end!==null&&a.currentTime>=p.end){a.currentTime=p.start;}
    };
    a.onended=()=>{if(!active())return;release();setPlaying(false);completed();};
    a.onerror=fallback;
    setSource("モデル音声 MP3");
    try{Promise.resolve(a.play()).catch(fallback);}catch(_){fallback();}
  };
  const seek=(seconds)=>{
    const a=audioRef.current;
    if(a&&Number.isFinite(a.duration)){a.currentTime=Math.max(0,Math.min(a.duration,a.currentTime+seconds));}
  };
  const setLoop=(which)=>{
    const a=audioRef.current;if(!a||!Number.isFinite(a.currentTime)){setError("モデル音声の再生中に設定できます。");return;}
    const current=a.currentTime;
    const next=which==="start"?{start:current,end:null}:{start:loop.current.start,end:current};
    if(which==="end"&&(next.start===null||next.end<=next.start)){setError("Aを設定してからBを設定してください。");return;}
    loop.current=next;setLoopInfo(next);
  };
  const clearLoop=()=>{loop.current={start:null,end:null};setLoopInfo({start:null,end:null});};
  const changeRate=(v)=>{
    const n=Number(v);setRate(n);
    if(audioRef.current)audioRef.current.playbackRate=n;
    // Device speech synthesis applies the new rate on its next playback.
  };
  return <div className="th-audio">
    <span className="th-side-heading">🎧 Audio Player <small>{scope==="full"?"全文":scope.toUpperCase()} {listenCount}/3 回完聴</small></span>
    <button className="th-audio-play" onClick={play}>{playing?"■ Stop Audio":"▶ Play Audio"}</button>
    <div className="th-audio-row">
      <button disabled={!hasTreasureAudio(unit,scope)||source==="音声合成"} onClick={()=>seek(-5)} title="5秒戻る">◀ 5s</button>
      <select aria-label="再生速度" value={rate} onChange={(e)=>changeRate(e.target.value)}>
        {speeds.map((v)=><option value={v} key={v}>{v}×</option>)}
      </select>
      <button disabled={!hasTreasureAudio(unit,scope)||source==="音声合成"} onClick={()=>seek(5)} title="5秒進む">5s ▶</button>
    </div>
    <div className="th-audio-row th-ab-controls">
      <button disabled={!hasTreasureAudio(unit,scope)||source==="音声合成"} onClick={()=>setLoop("start")}>A 開始</button>
      <button disabled={!hasTreasureAudio(unit,scope)||source==="音声合成"} onClick={()=>setLoop("end")}>B 終了</button>
      <button disabled={!hasTreasureAudio(unit,scope)||source==="音声合成"} onClick={clearLoop}>解除</button>
    </div>
    <small>{source||(hasTreasureAudio(unit,scope)?"モデル音声を優先":"英語音声合成で再生")}</small>
    {loopInfo.start!==null&&<small>A {loopInfo.start.toFixed(1)}s{loopInfo.end!==null?" – B "+loopInfo.end.toFixed(1)+"s":""}</small>}
    {error&&<p role="alert" className="th-error">{error}</p>}
  </div>;
}