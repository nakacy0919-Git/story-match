import React, {useEffect,useLayoutEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {createModelAudioPlayer,PLAYBACK_RATES} from "../utils/modelAudio";
import "./StoryTheater.css";

export default function StoryTheater({storyData,unit,onFinish,onBack}) {
  const [index,setIndex]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [auto,setAuto]=useState(false);
  const [finished,setFinished]=useState(false);
  const [japanese,setJapanese]=useState(false);
  const [rate,setRate]=useState(.85);
  const [error,setError]=useState("");
  const player=useRef(null),generation=useRef(0),timer=useRef(null),watchdog=useRef(null);
  const dialog=useRef(null),screenRef=useRef(null);
  if(!player.current)player.current=createModelAudioPlayer(window,{reuseAudio:true});
  const total=storyData.length;
  const stop=()=>{
    generation.current++;
    clearTimeout(timer.current);clearTimeout(watchdog.current);
    player.current.stop();setPlaying(false);setAuto(false);
  };
  useEffect(()=>{
    const old=document.activeElement;
    dialog.current?.focus();
    return ()=>{
      generation.current = generation.current + 1;
      clearTimeout(timer.current);clearTimeout(watchdog.current);
      player.current.stop();
      if(old?.isConnected)old.focus();
    };
  },[]);
  useEffect(()=>{
    if(index+1<total){
      const img=new Image();img.src=sceneImage(unit,index+1);
    }
  },[index,total,unit]);
  useLayoutEffect(()=>{
    const frame=screenRef.current;
    if(!frame)return;
    const fit=()=>{
      // Prefer two lines of English and one of Japanese; never truncate text.
      for(const [selector,lines,min] of [[".theater-en",2,16],[".theater-ja",1,13]]){
        const el=frame.querySelector(selector);
        if(!el||!el.clientWidth)continue;
        el.style.fontSize="";
        let size=parseFloat(window.getComputedStyle(el).fontSize);
        if(!Number.isFinite(size))continue;
        while(size>min){
          const lineHeight=parseFloat(window.getComputedStyle(el).lineHeight);
          if(!Number.isFinite(lineHeight)||el.scrollHeight<=lineHeight*lines+2)break;
          size=Math.max(min,size-1);
          el.style.fontSize=size+"px";
        }
      }
    };
    fit();
    if(typeof ResizeObserver==="function"){
      const observer=new ResizeObserver(fit);
      observer.observe(frame);
      return ()=>observer.disconnect();
    }
    window.addEventListener("resize",fit);
    return ()=>window.removeEventListener("resize",fit);
  },[index,japanese]);
  function playScene(next,continuous){
    // Invalidate previous events before reusing the same player.
    const id=++generation.current;
    clearTimeout(timer.current);clearTimeout(watchdog.current);
    setIndex(next);setAuto(continuous);setPlaying(true);setFinished(false);setError("");
    const fail=()=>{
      if(id!==generation.current)return;
      stop();setError("音声が再生できませんでした。再生ボタンで再試行するか、手動で次へ進んでください。");
    };
    watchdog.current=setTimeout(fail,Math.max(35000,storyData[next].en.length*180/rate));
    player.current.play({
      unit,index:next,text:storyData[next].en,rate,
      onEnd:()=>{
        if(id!==generation.current)return;
        clearTimeout(watchdog.current);
        if(continuous&&next+1<total){
          timer.current=setTimeout(()=>{
            if(id===generation.current)playScene(next+1,true);
          },650);
        }else{
          setPlaying(false);setAuto(false);
          if(next===total-1)setFinished(true);
        }
      },
      onError:fail,
    });
  }
  const navigate=next=>{
    stop();setError("");setFinished(false);
    setIndex(Math.max(0,Math.min(total-1,next)));
  };
  const exit=()=>{stop();onBack();};
  const finish=()=>{stop();onFinish();};
  const item=storyData[index];
  if(!item)return null;
  return createPortal(
    <section ref={dialog} tabIndex={-1} className="story-theater" aria-label="紙芝居モード" onKeyDown={e=>{
      if(e.key==="Escape"){e.stopPropagation();exit();}
      else if(e.target===dialog.current&&e.key==="ArrowRight"&&index+1<total)navigate(index+1);
      else if(e.target===dialog.current&&e.key==="ArrowLeft"&&index>0)navigate(index-1);
    }}>
      <div className="theater-auditorium" aria-hidden="true">
        <div className="theater-curtain left"/><div className="theater-curtain right"/>
        <div className="theater-wall-light left"/><div className="theater-wall-light right"/>
        <svg className="theater-seats" viewBox="0 0 1200 190" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="cinemaSeat" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#49232a"/><stop offset=".45" stopColor="#24141a"/><stop offset="1" stopColor="#08070c"/></linearGradient>
          </defs>
          {[0,1].map(row=><g key={row} opacity={row===0?.65:1} transform={row===0?"translate(0 0)":"translate(-70 65) scale(1.12)"}>
            {Array.from({length:11},(_,i)=><g key={i} transform={"translate("+(i*122-55)+" 0)"}>
              <path d="M8 99V48Q8 12 39 12H79Q110 12 110 48V99Z" fill="url(#cinemaSeat)" stroke="#633039" strokeWidth="1.4"/>
              <path d="M18 51Q18 23 42 23H76Q100 23 100 51" fill="none" stroke="#9a5055" strokeOpacity=".24" strokeWidth="2"/>
              <rect x="0" y="73" width="118" height="26" rx="12" fill="#120e14"/>
            </g>)}
          </g>)}
        </svg>
      </div>
      <header className="theater-header">
        <div><span>UNIT {unit} · STORY THEATER</span><strong>Step 1　本文を読む・聞く</strong></div>
        <output aria-live="polite">Scene {index+1} / {total}</output>
        <button type="button" className="theater-close" onClick={exit} aria-label="紙芝居を閉じる">×</button>
      </header>
      <div className="theater-progress" aria-hidden="true"><i style={{width:((index+1)/total*100)+"%"}}/></div>
      <div className="theater-stage">
        <div ref={screenRef} key={index} className="theater-picture">
          <img className="theater-image-fill" src={sceneImage(unit,index)} alt="" aria-hidden="true"/>
          <img className="theater-artwork" src={sceneImage(unit,index)} alt={"Scene "+(index+1)}/>
          <div className="theater-caption" tabIndex={0}>
            <p className="theater-en">{item.en}</p>
            {japanese&&<p className="theater-ja">{item.ja}</p>}
          </div>
        </div>
      </div>
      {error&&<p className="theater-message" role="alert">{error}</p>}
      {finished&&<div className="theater-message" role="status">✓ 最後のシーンまで再生しました。次は音読練習です。</div>}
      <footer className="theater-controls">
        <div className="theater-nav">
          <button type="button" onClick={()=>navigate(index-1)} disabled={index===0} aria-label="前のシーン">◀</button>
          <button type="button" onClick={()=>navigate(index+1)} disabled={index===total-1} aria-label="次のシーン">▶</button>
        </div>
        <div className="theater-play">
          <button type="button" className="theater-manual" disabled={playing&&auto} onClick={()=>playing?stop():playScene(index,false)}>{playing&&!auto?"■ 停止":"🔊 このシーン"}</button>
          <button type="button" className="theater-auto" onClick={()=>playing&&auto?stop():playScene(index,true)}>{playing&&auto?"■ 自動再生停止":"▶ 自動再生"}</button>
        </div>
        <div className="theater-settings">
          <button type="button" aria-pressed={japanese} onClick={()=>setJapanese(v=>!v)}>和訳 {japanese?"ON":"OFF"}</button>
          <select aria-label="紙芝居の音声速度" disabled={playing} value={rate} onChange={e=>setRate(Number(e.target.value))}>
            {PLAYBACK_RATES.map(v=><option key={v} value={v}>{v}×</option>)}
          </select>
        </div>
        <button type="button" className="theater-finish" onClick={finish}>{index===total-1&&!playing?"Step 2　音読へ進む →":"⏭ スキップして音読へ進む"}</button>
      </footer>
    </section>,document.body);
}
const sceneImage=(unit,index)=>`${process.env.PUBLIC_URL||""}/images/unit${unit}/${index+1}.webp`;
