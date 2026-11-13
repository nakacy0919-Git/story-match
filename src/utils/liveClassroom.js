import { readStoredJSON } from "./storage";
import { loadProgress } from "./progress";
import { readUnitStudy, validStudent } from "./studyProgress";
import { summarize } from "../components/LearningDashboard";
import { workbookSections } from "../components/WorkbookQuizPanel";

export const LIVE_JOIN_STORAGE="treasure-live-join:v1";
export const LIVE_PROGRESS_EVENT="treasure-story-progress-changed";
export const LIVE_METRICS=[
  ["reading","本文音読"],["compEn","内容理解 EN"],["compJa","内容理解 JP"],
  ["listen","段落リスニング"],
  ["vocabE","単語 EN→JP"],["vocabJ","単語 JP→EN"],["grammar","英文並び替え"],
  ["storyRead","じっくり学習"],["puzzle","パズル"],["random","ランダム"],["storyListen","ゲームリスニング"],
];
export function parseJoinCode(hash) {
  if(!/^#\/join(?:\?|$)/.test(hash||""))return "";
  const params=new URLSearchParams((hash||"").split("?")[1]||"");
  return String(params.get("code")||"").trim().toUpperCase().slice(0,30);
}
export function parseObserverToken(hash) {
  if(!/^#\/observe(?:\?|$)/.test(hash||""))return "";
  return String(new URLSearchParams((hash||"").split("?")[1]||"").get("token")||"").slice(0,160);
}
export function readLocalLiveRecord() {
  const student=readStoredJSON("storyMatchStudent",null);
  if(!validStudent(student))return null;
  const story=loadProgress(student);
  const units={};
  const dates=[];
  for(const unit of [11,12]){
    const study=readUnitStudy(student,unit);
    const history=story[unit]||{};
    const summary=summarize(unit,study,history);
    const metrics={};
    for(const group of summary.groups)for(const item of group.items)metrics[item.key]=Math.round(item.value||0);
    const workbook={};
    for(const section of workbookSections){
      workbook[section.metric]=Number(study[section.metric]?.complete?.best||0);
    }
    units[String(unit)]={metrics,workbook};
    for(const iso of [study.updatedAt,history.updated]){
      if(iso && Number.isFinite(Date.parse(iso)))dates.push(Date.parse(iso));
    }
  }
  return {student,units,activityAt:dates.length?new Date(Math.max(...dates)).toISOString():null};
}
export async function classroomRequest(payload,{signal}={}){
  const response=await fetch("/api/classroom-live",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    cache:"no-store",
    body:JSON.stringify(payload),
    signal,
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(data.error||"通信に失敗しました。"),{status:response.status});
  return data;
}
