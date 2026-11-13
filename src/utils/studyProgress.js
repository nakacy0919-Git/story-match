import { readStoredJSON, writeStoredJSON } from "./storage";
import { profileKey } from "./progress";
export const STUDY_CHANGED="treasure-study-progress-changed";
export const validStudent=s=>!!(s&&typeof s.class==="string"&&s.class.trim()&&String(s.number||"").trim()&&typeof s.name==="string"&&s.name.trim());
export const studyKey=s=>validStudent(s)?"treasureStudy:v1:"+profileKey(s):null;
export function readStudy(s){const k=studyKey(s);if(!k)return {};const x=readStoredJSON(k,{});return x&&!Array.isArray(x)&&typeof x==="object"?x:{};}
export const readUnitStudy=(s,unit)=>readStudy(s)[unit]||{};
export const emitStudyChange=()=>window.dispatchEvent(new Event(STUDY_CHANGED));
export function updateStudy(unit,category,fn){
 const s=readStoredJSON("storyMatchStudent",null),key=studyKey(s);if(!key)return false;
 const all=readStudy(s),old=all[unit]||{};
 const next={...all,[unit]:{...old,[category]:fn(old[category]||{}),updatedAt:new Date().toISOString()}};
 if(!writeStoredJSON(key,next))return false;emitStudyChange();return true;
}
const pct=x=>Number.isFinite(x)?Math.max(0,Math.min(100,Math.round(x))):0;
export function saveQuizResult(unit,category,direction,score){
 return updateStudy(unit,category,old=>{const prior=old[direction]||{};
 return {...old,[direction]:{attempts:(prior.attempts||0)+1,best:Math.max(prior.best||0,pct(score)),last:pct(score)}};});
}
export function saveReadingResult(unit,scope,accuracy){
 return updateStudy(unit,"reading",old=>{const prior=old[scope]||{};
 return {...old,[scope]:{attempts:(prior.attempts||0)+1,best:Math.max(prior.best||0,pct(accuracy)),last:pct(accuracy)}};});
}
export function saveGrammarAnswer(unit,index,correct,count){
 return updateStudy(unit,"grammar",old=>{const solved=Array.isArray(old.solved)?old.solved.filter(x=>Number.isInteger(x)&&x>=0&&x<count):[];
 if(correct&&!solved.includes(index))solved.push(index);
 return {attempts:(old.attempts||0)+1,solved,total:count};});
}
export const saveListeningCompletion=(unit,scope)=>updateStudy(unit,"listening",old=>({...old,[scope]:(Number(old[scope])||0)+1}));
export function completedListening(record,scopes){
 const keys=scopes.length?scopes:["full"];
 return {count:keys.filter(k=>(Number(record?.listening?.[k])||0)>=3).length,total:keys.length,
 percent:Math.round(keys.reduce((n,k)=>n+Math.min(3,Number(record?.listening?.[k])||0),0)*100/(keys.length*3))};
}
