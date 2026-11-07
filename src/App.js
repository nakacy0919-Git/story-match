import React, { useState } from "react";
import StoryMatchApp from "./StoryMatchApp";
import { allUnitsData } from "./unitsData";
import { readStoredJSON, writeStoredJSON } from "./utils/storage";
import {
  ScriptPanel, VocabularyPanel, ComprehensionPanel, GrammarPanel, ReadingPractice,
  paragraphOptions, getLesson,
} from "./components/TreasurePanels";
import TreasureAudio from "./components/TreasureAudio";
import LearningDashboard, { ListeningMissionPanel } from "./components/LearningDashboard";
import "./LearningAnalytics.css";
import "./App.css";
import "./TreasureShell.css";

const units=Object.keys(allUnitsData).map(Number).sort((a,b)=>a-b);
const buttons=[
  {id:"progress",name:"Learning Progress",sub:"進捗を分析",icon:"📊"},
  {id:"script",name:"Script",sub:"英文の本文",icon:"📖"},
  {id:"japanese",name:"Japanese",sub:"日本語訳",icon:"🇯🇵"},
  {id:"comprehension",name:"Comprehension",sub:"内容理解 EN / JP",icon:"🧠"},
  {id:"vocabulary",name:"Vocabulary",sub:"単語と4択クイズ",icon:"📝"},
  {id:"grammar",name:"Grammar",sub:"英文の並び替え",icon:"🔤"},
  {id:"reading",name:"Reading Check",sub:"音読判定",icon:"🎙️"},
  {id:"shadowing",name:"Shadowing",sub:"音声に続けて音読",icon:"🎧"},
  {id:"listening-study",name:"Listening Mission",sub:"各段落を3回聞く",icon:"🔊"},
  {id:"story",name:"Story Match",sub:"4つのゲームモード",icon:"🧩"},
];
function App() {
  const [unit,setUnit]=useState(()=>{
    const last=Number(readStoredJSON("storyMatchLastUnit",1));
    return units.includes(last)?last:1;
  });
  const [scope,setScope]=useState("full");
  const [panel,setPanel]=useState("welcome");
  const [variant,setVariant]=useState(null);
  const paragraphs=paragraphOptions(unit);
  const changeUnit=(next)=>{
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    setUnit(next);setScope("full");setPanel("progress");setVariant(null);
    writeStoredJSON("storyMatchLastUnit",next);
  };
  const openPanel=(target,nextVariant=null)=>{setVariant(nextVariant);setPanel(target);if(target==="reading"||target==="shadowing")setScope("full");};
  const lesson=getLesson(unit,scope);
  const current=buttons.find((b)=>b.id===panel)||buttons[0];
  return <main className="th-shell">
    <nav className="th-unit-strip" aria-label="ユニットを選択">
      {units.map((n)=><button key={n} className={n===unit?"active":""}
        aria-pressed={n===unit} onClick={()=>changeUnit(n)}>Unit {n}</button>)}
    </nav>
    <div className={"th-workspace "+(panel==="welcome"?"is-welcome":"")}>
      <div className="th-stage" style={{ backgroundImage: 'linear-gradient(155deg,rgba(243,248,253,.91),rgba(253,244,237,.92)),url("/treasure-cover.webp")', backgroundSize: "cover", backgroundPosition: "center" }}>
        {panel!=="welcome"&&<div className="th-stage-top">
          <div><span className="th-kicker">TREASURE HUNT · UNIT {unit}</span>
            <strong>{current.icon} {current.name}</strong></div>
          <div className="th-stage-sub">{scope==="full"?"Full Text":"Paragraph "+scope.slice(1)}</div>
        </div>}
        <div className={"th-stage-content "+(panel==="story"?"is-story":panel==="reading"||panel==="shadowing"?"is-reading":"")}>
          {panel==="welcome"&&<div className="th-unit-welcome"><div className="th-welcome-orbit">◎</div><span>YOUR LEARNING JOURNEY</span><h1>Select a Unit</h1><p>上の Unit 1〜15 から学習するUnitを選んでください。</p><small>選択後、円形ゲージの学習分析画面が開きます。</small></div>}
          {panel==="progress"&&<LearningDashboard unit={unit} onOpen={openPanel}/>}
          {panel==="script"&&<ScriptPanel unit={unit} scope={scope}/>}
          {panel==="japanese"&&<ScriptPanel unit={unit} scope={scope} japaneseOnly/>}
          {panel==="vocabulary"&&<VocabularyPanel unit={unit} initialDirection={variant||"enJa"}/>}
          {panel==="comprehension"&&<ComprehensionPanel unit={unit} initialLanguage={variant||"en"}/>}
          {panel==="grammar"&&<GrammarPanel unit={unit}/>}
          {panel==="reading"&&<ReadingPractice unit={unit} scope={scope}/>}
          {panel==="shadowing"&&<ReadingPractice unit={unit} scope={scope} shadowing/>}
          {panel==="story"&&<StoryMatchApp embedded selectedUnit={unit}/>}
          {panel==="listening-study"&&<ListeningMissionPanel unit={unit} scope={scope} onScope={setScope}/>}
        </div>
      </div>
      {panel!=="welcome"&&<aside className="th-sidebar" aria-label="学習機能の選択">
        <div className="th-scope">
          <label htmlFor="th-part">教材範囲</label>
          <select id="th-part" value="1" onChange={()=>{}} aria-label="パート"><option value="1">Part 1</option></select>
          <select value={scope} onChange={(e)=>setScope(e.target.value)} aria-label="再生・表示する段落">
            <option value="full">Full Text</option>
            {paragraphs.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <TreasureAudio key={unit+"-"+scope} unit={unit} scope={scope} text={lesson.en}/>
        <div className="th-sidebar-buttons">
          {buttons.map((b,i)=><React.Fragment key={b.id}>
            {(i===5||i===8)&&<div className="th-side-separator"/>}
            <button className={"th-side-button "+(panel===b.id?"selected":"")}
              aria-pressed={panel===b.id} onClick={()=>openPanel(b.id)}>
              <span className="th-side-icon">{b.icon}</span>
              <span><b>{b.name}</b><small>{b.sub}</small></span>
            </button></React.Fragment>)}
        </div>
        <p className="th-sidebar-note">Unitを選択し、学習機能を切り替えてください。Story Matchでは学習記録を保存します。</p>
      </aside>}
    </div>
  </main>;
}
export default App;