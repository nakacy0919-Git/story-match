import React, { useEffect, useState } from "react";
import { readStoredJSON, writeStoredJSON } from "../utils/storage";
import { loadProgress } from "../utils/progress";
import { STUDY_CHANGED, validStudent, readUnitStudy, completedListening, emitStudyChange } from "../utils/studyProgress";
import { paragraphOptions } from "./TreasurePanels";
import { allUnitsData } from "../unitsData";
import { workbookSections, getWorkbookQuestions } from "./WorkbookQuizPanel";
import ShareAppQR from "./ShareAppQR";

const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
function Ring({value,size="small"}) {
 return <div className={"th-progress-ring "+size} role="img" aria-label={"進捗 "+clamp(value)+"%"}
  style={{"--value":clamp(value)+"%"}}>
  <div><strong>{clamp(value)}</strong><span>%</span></div>
 </div>;
}
/* A compact, consistent set of activity icons: no extra icon dependency. */
function ActivityIcon({name}) {
 const icons={
  reading:<><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></>,
  compEn:<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/></>,
  compJa:<><path d="M4 5h12M10 3v3M6 7c1 5 4 8 9 10M15 7c-1 4-5 8-10 10M14 21l4-10 4 10M16 17h4"/></>,
  listen:<><path d="M3 9v6h4l5 4V5L7 9H3zM16 9a5 5 0 0 1 0 6M19 5a10 10 0 0 1 0 14"/></>,
  vocabE:<><path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1V6zM12 6c3-2 6-2 10-1v14c-4-1-7-1-10 1V6zM12 6v14"/><path d="M5 9h4M15 9h4"/></>,
  vocabJ:<><path d="M4 7h15l-3-3M19 7l-3 3M20 17H5l3-3M5 17l3 3"/><path d="M10 11h4M12 9v4"/></>,
  grammar:<><path d="M7 5h13M7 12h13M7 19h13M2 5h1M2 12h1M2 19h1"/><path d="m16 10 2 2-2 2"/></>,
  storyRead:<><path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1V6zM12 6c3-2 6-2 10-1v14c-4-1-7-1-10 1V6zM12 6v14"/><path d="M6 9h3M15 9h3"/></>,
  puzzle:<><path d="M8 3H4a1 1 0 0 0-1 1v5h2a2 2 0 0 1 0 4H3v7a1 1 0 0 0 1 1h6v-2a2 2 0 0 1 4 0v2h6a1 1 0 0 0 1-1v-6h-2a2 2 0 0 1 0-4h2V4a1 1 0 0 0-1-1h-5v2a2 2 0 0 1-4 0V3H8z"/></>,
  random:<><path d="M13 2 4 14h7l-1 8 10-13h-7l1-7z"/></>,
  storyListen:<><circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15"/></>
 };
 return <svg className="th-activity-svg" viewBox="0 0 24 24" fill="none"
   stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
   aria-hidden="true" focusable="false">{icons[name]||icons.reading}</svg>;
}

function getStudent(){return readStoredJSON("storyMatchStudent",null);}
function formatSeconds(v){return Number.isFinite(v)?v.toFixed(1)+"s":"—";}
export function summarize(unit,study,story){
 const scenes=allUnitsData[unit]||[];
 const scopes=paragraphOptions(unit).map(x=>x.value);
 const listen=completedListening(study,scopes);
 const scores=Object.values(story?.reading||{});
 const passed=scores.filter(x=>x>=80).length;
 const puzzle=Object.values(story?.puzzle||{}).map(x=>x.best).filter(Number.isFinite);
 const fastest=puzzle.length?Math.min(...puzzle):null;
 const randomTime=story?.random?.bestSeconds;
 const storyPoints=story?.listening?.bestByCount?.[scenes.length]??null;
 const storyRandomPoints=story?.random?.bestByCount?.[scenes.length]??null;
 const gram=study.grammar||{};
 const grammarTotal=(scenes||[]).map(x=>x.en).filter(x=>x.split(/\s+/).length>=5&&x.split(/\s+/).length<=16).slice(0,10).length;
 const groups=[
 {name:"READING & COMPREHENSION",tone:"sky",items:[
 {key:"reading",name:"本文音読",value:study.reading?.full?.best||0,meta:"Best "+(study.reading?.full?.best||0)+"% · "+(study.reading?.full?.attempts||0)+"回",panel:"reading"},
 {key:"compEn",name:"内容把握 EN",value:study.comprehension?.en?.best||0,meta:(study.comprehension?.en?.attempts||0)+"回 · 英語の設問",panel:"comprehension",variant:"en"},
 {key:"compJa",name:"内容把握 JP",value:study.comprehension?.ja?.best||0,meta:(study.comprehension?.ja?.attempts||0)+"回 · 日本語の設問",panel:"comprehension",variant:"ja"},
 ]},
 {name:"VOCABULARY & SKILLS",tone:"teal",items:[
 {key:"listen",name:"段落リスニング",value:listen.percent,meta:listen.count+" / "+listen.total+" 段落で3回達成",panel:"listening-study"},
 {key:"vocabE",name:"英語 → 日本語",value:study.vocabulary?.enJa?.best||0,meta:(study.vocabulary?.enJa?.attempts||0)+"回 · 意味の4択",panel:"vocabulary",variant:"enJa"},
 {key:"vocabJ",name:"日本語 → 英語",value:study.vocabulary?.jaEn?.best||0,meta:(study.vocabulary?.jaEn?.attempts||0)+"回 · 単語の4択",panel:"vocabulary",variant:"jaEn"},
 {key:"grammar",name:"英文並び替え",value:grammarTotal?100*(gram.solved?.length||0)/grammarTotal:0,meta:(gram.solved?.length||0)+" / "+grammarTotal+" 文完成",panel:"grammar"}
 ]},
 {name:"STORY MATCH",tone:"violet",items:[
 {key:"storyRead",name:"じっくり学習",value:scenes.length?passed*100/scenes.length:0,meta:passed+" / "+scenes.length+" シーン達成",panel:"story"},
 {key:"puzzle",name:"パズル",value:fastest===null?0:Math.min(100,30/Math.max(1,fastest)*100),meta:"Best "+formatSeconds(fastest)+" · 目標30秒",panel:"story"},
 {key:"random",name:"ランダム",value:story?.random?.fullClear?100:0,meta:formatSeconds(randomTime)+" · "+(storyRandomPoints===null?"—":storyRandomPoints)+" pts",panel:"story"},
 {key:"storyListen",name:"ゲームリスニング",value:storyPoints===null?0:Math.min(100,storyPoints/800*100),meta:(storyPoints===null?"—":storyPoints)+" pts · 目標800点",panel:"story"}
 ]}
 ];
 const all=groups.flatMap(x=>x.items);
 const overall=Math.round(all.reduce((n,x)=>n+clamp(x.value),0)/all.length);
 return {groups,overall,complete:all.filter(x=>clamp(x.value)===100).length,total:all.length};
}
export default function LearningDashboard({unit,onOpen}) {
 const [student,setStudent]=useState(getStudent);
 const [draft,setDraft]=useState({class:"",number:"",name:""});
 const [editing,setEditing]=useState(false);
 const [,setRevision]=useState(0);
 const [error,setError]=useState("");
 useEffect(()=>{
   const update=()=>setRevision(v=>v+1);
   window.addEventListener(STUDY_CHANGED,update);
   window.addEventListener("storage",update);
   return ()=>{window.removeEventListener(STUDY_CHANGED,update);window.removeEventListener("storage",update);};
 },[]);
 const details=(()=>{
   const record=validStudent(student)?readUnitStudy(student,unit):{};
   const story=validStudent(student)?(loadProgress(student)[unit]||{}):{};
   return summarize(unit,record,story);
 })();
 const register=(event)=>{
   event.preventDefault();
   const next={class:draft.class.trim(),number:draft.number.trim(),name:draft.name.trim()};
   if(!validStudent(next)){setError("クラス・番号・氏名を入力してください。");return;}
   if(!writeStoredJSON("storyMatchStudent",next)){setError("ブラウザに学習情報を保存できません。");return;}
   setStudent(next);setEditing(false);setError("");emitStudyChange();
 };
 return <div className="th-analytics">
  <section className="th-analytics-hero">
   <ShareAppQR/>
   <div className="th-analytics-intro"><span className="th-analytics-kicker">LEARNING ANALYTICS · UNIT {unit}</span>
    <h2>Learning Progress</h2>
    <p>11の学習スキルを分析。カードから練習へ進めます。</p>
    {validStudent(student)?<div className="th-learner-name">● {student.name} <span>{student.class} · {student.number}番</span><button className="th-switch-learner" onClick={()=>{setDraft({class:"",number:"",name:""});setEditing(true);}}>変更</button></div>:
      <span className="th-learner-name">学習記録を保存するには登録してください</span>}
   </div>
   <Ring value={details.overall} size="large"/>
   <div className="th-analytics-summary">
    <span>COMPLETED</span><strong>{details.complete}<small> / {details.total}</small></strong>
    <p>11項目の達成度を均等集計</p>
    <button type="button" onClick={()=>onOpen("script")}>本文から学ぶ →</button>
   </div>
  </section>
  {(!validStudent(student)||editing)&&<form className="th-analytics-register" onSubmit={register} aria-label="学習者を登録">
    <strong>学習記録を開始</strong>
    <input aria-label="クラス" placeholder="クラス" value={draft.class} onChange={e=>setDraft({...draft,class:e.target.value})} required maxLength={40}/>
    <input aria-label="番号" placeholder="番号" value={draft.number} onChange={e=>setDraft({...draft,number:e.target.value})} required type="number" min="1"/>
    <input aria-label="氏名" placeholder="氏名" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} required maxLength={50}/>
    <button type="submit">記録を開始</button>
    {error&&<small role="alert">{error}</small>}
   </form>}
  <div className="th-analytics-sections">
   {details.groups.map(group=><section className="th-analytics-group" key={group.name} data-tone={group.tone}>
     <h3>{group.name}</h3>
     <div className="th-analytics-cards">{group.items.map(item=><button type="button"
        className="th-analytics-card" key={item.key} onClick={()=>onOpen(item.panel,item.variant)} aria-label={item.name+" "+clamp(item.value)+"% 練習へ"}>
        <span className="th-activity-icon"><ActivityIcon name={item.key}/></span>
        <span className="th-analytics-card-info"><strong>{item.name}</strong><small>{item.meta}</small></span>
        <Ring value={item.value}/>
      </button>)}</div>
    </section>)}
  </div>
  {unit>=10&&<section className="th-wb-dashboard">
    <h3>WORKBOOK PRACTICE · READING / GRAMMAR / VARIOUS</h3>
    <div className="th-wb-dashboard-row">
      {workbookSections.map(section=>{
        const record=readUnitStudy(student,unit)[section.metric]?.complete||{};
        const percent=record.best||0;
        return <button type="button" key={section.id} className="th-wb-dashboard-card"
          aria-label={section.name+" "+percent+"% 練習へ"} onClick={()=>onOpen(section.id)}>
          <Ring value={percent}/>
          <span><strong>{section.icon} {section.name}</strong>
            <small>{getWorkbookQuestions(unit,section.id).length}問 · {record.attempts||0}回 · Best {percent}%</small>
          </span>
          <span aria-hidden="true">↗</span>
        </button>;
      })}
    </div>
  </section>}
  <p className="th-analytics-footnote">現在の端末・ブラウザに個人別で保存。過去の記録がない項目は0%、旧形式にない回数は0回として表示します。Story Matchの既存ベスト記録は引き継ぎます。</p>
 </div>;
}


export function ListeningMissionPanel({unit,scope,onScope}) {
 const [,setRevision]=useState(0);
 useEffect(()=>{const refresh=()=>setRevision(n=>n+1);window.addEventListener(STUDY_CHANGED,refresh);return()=>window.removeEventListener(STUDY_CHANGED,refresh);},[]);
 const student=getStudent(),progress=readUnitStudy(student,unit).listening||{};
 const scopes=paragraphOptions(unit).map(x=>x.value);
 const items=scopes.length?scopes:["full"];
 return <section className="th-panel th-listening-missions">
  <header className="th-panel-heading"><span className="th-kicker">UNIT {unit} · LISTENING</span>
   <h2>Listening Mission</h2><p>各段落を最後まで3回聞いてクリア。右のAudio Playerで再生してください。</p></header>
  <div className="th-listening-mission-grid">{items.map(key=>{
    const count=Number(progress[key])||0;
    return <button type="button" key={key} className={"th-listening-part "+(key===scope?"active":"")} onClick={()=>onScope(key)}>
      <span>{key==="full"?"Full Text":key.toUpperCase()}</span>
      <Ring value={Math.min(100,count/3*100)}/>
      <strong>{count} / 3 回</strong>
      <small>{count>=3?"✓ CLEAR":key===scope?"右の▶で再生":"この段落を選ぶ"}</small>
    </button>;
  })}</div>
  <p className="th-note">※途中停止・5秒移動だけではカウントしません。完全に再生を終えたときに1回加算します。</p>
 </section>;
}
