import { allUnitsData } from "../unitsData";
import { unitScripts } from "../treasureData";
import { sentenceParts, lookupTranslation } from "./treasureTranslation";
import { comprehensionCuratedA } from "./comprehensionCuratedA";
import { comprehensionCuratedB } from "./comprehensionCuratedB";
import { comprehensionCuratedC } from "./comprehensionCuratedC";

const curated={...comprehensionCuratedA,...comprehensionCuratedB,...comprehensionCuratedC};
function shuffle(items) {
 const list=[...items];
 for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 return list;
}
function sourcePair(unit,index) {
 if(unit===15){
   const text=unitScripts.U15_P1_full||"";
   const sentences=sentenceParts(text).map(x=>x.text);
   const en=sentences[index]||"";
   const translation=lookupTranslation(15,"full",index,en,sentences);
   return {en,ja:translation.kind==="sentence"?translation.text:"",reference:"本文・文"+(index+1)};
 }
 const scene=allUnitsData[unit]?.[index];
 return {en:scene?.en||"",ja:scene?.ja||"",reference:"本文・場面"+(index+1)};
}
function uniqueChoiceSet(items) {
 const seen=new Set();
 return items.filter(row=>{
   const text=row.en.trim().replace(/\s+/g," ").toLowerCase();
   if(!text||seen.has(text))return false;
   seen.add(text);return true;
 });
}
function sourceChecks(unit,language) {
 const scenes=allUnitsData[unit]||[];
 if(scenes.length<4)return [];
 const positions=[0,2,4,6,8,scenes.length-1].filter((i)=>i<scenes.length);
 return positions.map((position,n)=>{
   const correct=scenes[position];
   const distractors=shuffle(scenes.filter((row,i)=>i!==position
     &&row.en!==correct.en&&row.ja!==correct.ja)).slice(0,3);
   const choices=uniqueChoiceSet([correct,...distractors].map((row)=>({
     en:language==="en"?row.en:row.ja,
     ja:language==="en"?row.ja:row.en
   })));
   if(choices.length!==4)return null;
   return {
     id:"sentence-"+position,
     prompt:language==="en"
       ?"Which English sentence best expresses this meaning?\n"+correct.ja
       :"次の英文を正しく表す日本語訳を選んでください。\n"+correct.en,
     correct:choices[0].en,
     options:shuffle(choices.map(x=>x.en)),
     type:"sentence",
     source:{en:correct.en,ja:correct.ja,reference:"本文・重要文"+(position+1)}
   };
 }).filter(Boolean);
}
export function comprehensionQuestions(unit,language="en") {
 const isEnglish=language==="en";
 const original=(curated[unit]||[]);
 const knowledge=original.map(([sourceIndex,enPrompt,jaPrompt,choices],index)=>{
   const source=sourcePair(unit,sourceIndex);
   const options=choices.map(pair=>isEnglish?pair[0]:pair[1]);
   return {
     id:"understand-"+index,
     prompt:isEnglish?enPrompt:jaPrompt,
     correct:options[0],
     options:shuffle(options),
     type:"fact",
     source
   };
 });
 return [...knowledge,...sourceChecks(unit,language)].map((question,index)=>({
   ...question,index,
   total:knowledge.length+sourceChecksCount(unit),
 }));
}
function sourceChecksCount(unit){
 const total=(allUnitsData[unit]||[]).length;
 return [0,2,4,6,8,total-1].filter((v)=>v<total).length;
}
export const curatedQuestionCount=(unit)=>(curated[unit]||[]).length;
