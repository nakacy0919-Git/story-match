import React, { useEffect, useRef, useState } from "react";
import { getLesson, unitKey } from "./TreasurePanels";
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
  const [playing,setPlaying]=useState(false);
  const [error,setError]=useState("");
  const [source,setSource]=useState("");
  const audioRef=useRef(null);
  const loop=useRef({start:null,end:null});
  const [loopInfo,setLoopInfo]=useState({start:null,end:null});
  const spoken=useRef(false);
  const stop=()=>{
    if(audioRef.current) {audioRef.current.pause();audioRef.current=null;}
    try {window.speechSynthesis?.cancel();}catch(_){}
    spoken.current=false;setPlaying(false);
  };
  useEffect(()=>()=>{if(audioRef.current)audioRef.current.pause();window.speechSynthesis?.cancel();},[unit,scope]);
  const playSpeech=()=>{
    const text=getLesson(unit,scope).en;
    if(!text||!window.speechSynthesis||!window.SpeechSynthesisUtterance){
      setError("この範囲の音声を再生できません。");setPlaying(false);return;
    }
    try {
      window.speechSynthesis.cancel();
      const u=new window.SpeechSynthesisUtterance(text);
      u.lang="en-US";u.rate=rate;
      const voices=window.speechSynthesis.getVoices();
      u.voice=voices.find((v)=>v.lang==="en-US")||voices.find((v)=>v.lang?.startsWith("en"))||null;
      u.onend=()=>{spoken.current=false;setPlaying(false);};
      u.onerror=()=>{spoken.current=false;setPlaying(false);setError("音声合成に失敗しました。ブラウザで再試行してください。");};
      window.speechSynthesis.speak(u);spoken.current=true;setPlaying(true);setSource("音声合成");
    }catch(_){setError("音声合成を開始できません。");setPlaying(false);}
  };
  const play=()=>{
    setError("");
    if(playing){stop();return;}
    if(audioRef.current&&audioRef.current.paused){
      audioRef.current.play().then(()=>setPlaying(true)).catch(()=>playSpeech());return;
    }
    if(!hasTreasureAudio(unit,scope)){playSpeech();return;}
    const a=new window.Audio(treasureAudioUrl(unit,scope));
    audioRef.current=a;a.playbackRate=rate;a.preload="auto";
    a.ontimeupdate=()=>{
      const p=loop.current;
      if(p.start!==null&&p.end!==null&&a.currentTime>=p.end){a.currentTime=p.start;}
    };
    a.onended=()=>setPlaying(false);
    a.onerror=()=>{
      if(audioRef.current===a){a.pause();audioRef.current=null;playSpeech();}
    };
    a.play().then(()=>{setPlaying(true);setSource("モデル音声 MP3");}).catch(()=>{
      a.pause();audioRef.current=null;playSpeech();
    });
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
    <span className="th-side-heading">🎧 Audio Player</span>
    <button className="th-audio-play" onClick={play}>{playing?"■ Stop Audio":"▶ Play Audio"}</button>
    <div className="th-audio-row">
      <button onClick={()=>seek(-5)} title="5秒戻る">◀ 5s</button>
      <select aria-label="再生速度" value={rate} onChange={(e)=>changeRate(e.target.value)}>
        {speeds.map((v)=><option value={v} key={v}>{v}×</option>)}
      </select>
      <button onClick={()=>seek(5)} title="5秒進む">5s ▶</button>
    </div>
    <div className="th-audio-row th-ab-controls">
      <button onClick={()=>setLoop("start")}>A 開始</button>
      <button onClick={()=>setLoop("end")}>B 終了</button>
      <button onClick={clearLoop}>解除</button>
    </div>
    <small>{source||(hasTreasureAudio(unit,scope)?"モデル音声を優先":"英語音声合成で再生")}</small>
    {loopInfo.start!==null&&<small>A {loopInfo.start.toFixed(1)}s{loopInfo.end!==null?" – B "+loopInfo.end.toFixed(1)+"s":""}</small>}
    {error&&<p role="alert" className="th-error">{error}</p>}
  </div>;
}