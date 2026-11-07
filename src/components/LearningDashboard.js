import React, { useEffect, useMemo, useState } from "react";
import { readStoredJSON, writeStoredJSON } from "../utils/storage";
import { loadProgress, profileKey } from "../utils/progress";
import { STUDY_CHANGED, validStudent, readUnitStudy, completedListening, emitStudyChange } from "../utils/studyProgress";
import { paragraphOptions } from "./TreasurePanels";
import { allUnitsData } from "../unitsData";
import { comprehensionQuestions } from "../utils/comprehensionQuestions";

const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
function Ring({value,size="small"}) {
 return <div className={"th-progress-ring "+size} role="img" aria-label={"進捗 "+clamp(value)+"%"}
  style={{"--value":clamp(value)+"%"}}>
  <div><strong>{clamp(value)}</strong><span>%</span></div>
 </div>;
}
function getStudent(){return readStoredJSON("storyMatchStudent",null);}
function formatSeconds(v){return Number.isFinite(v)?v.toFixed(1)+"s":"—";}
function summarize(unit,study,story){
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
 {name:"READING & LISTENING",items:[
 {key:"reading",name:"本文音読",value:study.reading?.full?.best||0,meta:"Best "+(study.reading?.full?.best||0)+"% · "+(study.reading?.full?.attempts||0)+"回",panel:"reading"},
 {key:"compEn",name:"内容把握 EN",value:study.comprehension?.en?.best||0,meta:(study.comprehension?.en?.attempts||0)+"回 · 英語の設問",panel:"comprehension",variant:"en"},
 {key:"compJa",name:"内容把握 JP",value:study.comprehension?.ja?.best||0,meta:(study.comprehension?.ja?.attempts||0)+"回 · 日本語の設問",panel:"comprehension",variant:"ja"},
 {key:"shadow",name:"シャドーイング",value:study.shadowing?.full?.best||0,meta:"Best "+(study.shadowing?.full?.best||0)+"% · "+(study.shadowing?.full?.attempts||0)+"回",panel:"shadowing"},
 {key:"listen",name:"段落リスニング",value:listen.percent,meta:listen.count+" / "+listen.total+" 段落で3回達成",panel:"listening-study"}
 ]},
 {name:"VOCABULARY & GRAMMAR",items:[
 {key:"vocabE",name:"英語 → 日本語",value:study.vocabulary?.enJa?.best||0,meta:(study.vocabulary?.enJa?.attempts||0)+"回 · 意味の4択",panel:"vocabulary",variant:"enJa"},
 {key:"vocabJ",name:"日本語 → 英語",value:study.vocabulary?.jaEn?.best||0,meta:(study.vocabulary?.jaEn?.attempts||0)+"回 · 単語の4択",panel:"vocabulary",variant:"jaEn"},
 {key:"grammar",name:"英文並び替え",value:grammarTotal?100*(gram.solved?.length||0)/grammarTotal:0,meta:(gram.solved?.length||0)+" / "+grammarTotal+" 文完成",panel:"grammar"}
 ]},
 {name:"STORY MATCH",items:[
 {key:"storyRead",name:"じっくり学習",value:scenes.length?passed*100/scenes.length:0,meta:passed+" / "+scenes.length+" シーン達成",panel:"story"},
 {key:"puzzle",name:"パズル",value:fastest===null?0:Math.min(100,30/Math.max(1,fastest)*100),meta:"Best "+formatSeconds(fastest)+" · 目標30秒",panel:"story"},
 {key:"random",name:"ランダム",value:story?.random?.fullClear?100:0,meta:formatSeconds(randomTime)+" · "+(storyRandomPoints===null?"—":storyRandomPoints)+" pts",panel:"story"},
 {key:"storyListen",name:"ゲームリスニング",value:storyPoints===null?0:Math.min(100,storyPoints/800*100),meta:(storyPoints===null?"—":storyPoints)+" pts · 目標800点",panel:"story"}
 ]}
 ];
 const all=groups.flatMap(x=>x.items);
 const overall=Math.round(all.reduce((n,x)=>n+clamp(x.value),0)/all.length);
 return {groups,overall,complete:all.filter(x=>clamp(x.value)===100).length,total:all.length,listen,scopes};
}
export default function LearningDashboard({unit,onOpen}) {
 const [student,setStudent]=useState(getStudent);
 const [draft,setDraft]=useState({class:"",number:"",name:""});
 const [revision,setRevision]=useState(0);
 const [error,setError]=useState("");
 useEffect(()=>{
   const update=()=>setRevision(v=>v+1);
   window.addEventListener(STUDY_CHANGED,update);
   window.addEventListener("storage",update);
   return ()=>{window.removeEventListener(STUDY_CHANGED,update);window.removeEventListener("storage",update);};
 },[]);
 const details=useMemo(()=>{
   const record=validStudent(student)?readUnitStudy(student,unit):{};
   const story=validStudent(student)?(loadProgress(student)[unit]||{}):{};
   return summarize(unit,record,story);
 },[unit,student,revision]);
 const register=(event)=>{
   event.preventDefault();
   const next={class:draft.class.trim(),number:draft.number.trim(),name:draft.name.trim()};
   if(!validStudent(next)){setError("クラス・番号・氏名を入力してください。");return;}
   if(!writeStoredJSON("storyMatchStudent",next)){setError("ブラウザに学習情報を保存できません。");return;}
   setStudent(next);setError("");emitStudyChange();
 };
 return <div className="th-analytics">
  <section className="th-analytics-hero">
   <div className="th-analytics-intro"><span className="th-analytics-kicker">LEARNING ANALYTICS · UNIT {unit}</span>
    <h2>Learning Progress</h2>
    <p>取り組みを数字で確認。リングを押すと練習に進めます。</p>
    {validStudent(student)?<div className="th-learner-name">● {student.name} <span>{student.class} · {student.number}番</span></div>:
      <span className="th-learner-name">学習記録を保存するには登録してください</span>}
   </div>
   <Ring value={details.overall} size="large"/>
   <div className="th-analytics-summary">
    <span>COMPLETED</span><strong>{details.complete}<small> / {details.total}</small></strong>
    <p>12項目の達成度を均等集計</p>
    <button type="button" onClick={()=>onOpen("script")}>本文から学ぶ →</button>
   </div>
  </section>
  {!validStudent(student)&&<form className="th-analytics-register" onSubmit={register} aria-label="学習者を登録">
    <strong>学習記録を開始</strong>
    <input aria-label="クラス" placeholder="クラス" value={draft.class} onChange={e=>setDraft({...draft,class:e.target.value})} required maxLength={40}/>
    <input aria-label="番号" placeholder="番号" value={draft.number} onChange={e=>setDraft({...draft,number:e.target.value})} required type="number" min="1"/>
    <input aria-label="氏名" placeholder="氏名" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} required maxLength={50}/>
    <button type="submit">記録を開始</button>
    {error&&<small role="alert">{error}</small>}
   </form>}
  <div className="th-analytics-sections">
   {details.groups.map(group=><section className="th-analytics-group" key={group.name}>
     <h3>{group.name}</h3>
     <div className="th-analytics-cards">{group.items.map(item=><button type="button"
        className="th-analytics-card" key={item.key} onClick={()=>onOpen(item.panel,item.variant)} aria-label={item.name+" "+clamp(item.value)+"% 練習へ"}>
        <Ring value={item.value}/>
        <span className="th-analytics-card-info"><strong>{item.name}</strong><small>{item.meta}</small></span>
        <span className="th-analytics-go">↗</span>
      </button>)}</div>
    </section>)}
  </div>
  <div className="th-analytics-listening">
    <span>🎧 段落ごとの完了回数（各3回が目標）</span>
    <div>{details.scopes.length?details.scopes.map(scope=><span key={scope} className="th-listen-chip">{scope.toUpperCase()} · {readUnitStudy(student,unit).listening?.[scope]||0}/3</span>):<span className="th-listen-chip">全文を3回聞きましょう</span>}</div>
  </div>
  <p className="th-analytics-footnote">現在の端末・ブラウザに個人別で保存。過去の記録がない項目は0%、旧形式にない回数は0回として表示します。Story Matchの既存ベスト記録は引き継ぎます。</p>
 </div>;
}


export function ListeningMissionPanel({unit,scope,onScope}) {
 const [revision,setRevision]=useState(0);
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
