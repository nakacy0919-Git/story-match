import React, {useEffect,useRef,useState} from "react";
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
  const dialog=useRef(null);
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
      generation.current++;
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
      <header className="theater-header">
        <div><span>UNIT {unit} · STORY THEATER</span><strong>Step 1　本文を読む・聞く</strong></div>
        <output aria-live="polite">Scene {index+1} / {total}</output>
        <button type="button" className="theater-close" onClick={exit} aria-label="紙芝居を閉じる">×</button>
      </header>
      <div className="theater-progress" aria-hidden="true"><i style={{width:((index+1)/total*100)+"%"}}/></div>
      <div className="theater-stage">
        <div key={index} className="theater-picture">
          <img src={sceneImage(unit,index)} alt={"Scene "+(index+1)} onLoad={e=>{const img=e.currentTarget;if(img.naturalWidth&&img.naturalHeight)img.parentElement.style.setProperty("--picture-ratio",String(img.naturalWidth/img.naturalHeight));}}/>
          <div className={"theater-caption"+(item.en.length>190?" is-long":"")} tabIndex={0}>
            <p>{item.en}</p>
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
        {index===total-1&&!playing&&<button type="button" className="theater-finish" onClick={finish}>Step 2　音読へ進む →</button>}
      </footer>
    </section>,document.body);
}
const sceneImage=(unit,index)=>`${process.env.PUBLIC_URL||""}/images/unit${unit}/${index+1}.webp`;
