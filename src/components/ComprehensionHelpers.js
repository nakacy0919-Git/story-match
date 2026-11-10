import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { playSound } from "../utils/sound";

const common=[
"why|なぜ","what|何","who|誰","which|どちら・どの","where|どこ","when|いつ",
"how|どのように","many|多くの","much|どれくらい","most|最も多い","least|最も少ない",
"according|～によれば","passage|本文、文章","article|記事","sentence|文",
"statement|記述","correct|正しい","meaning|意味","mean|意味する",
"describe|説明する","explain|説明する","main|主な","idea|考え","reason|理由",
"because|なぜなら","result|結果","happen|起こる","happened|起きた",
"change|変化する","different|異なる","similar|似ている","special|特別な",
"important|重要な","popular|人気の","country|国","countries|国々",
"number|数字・数","numbers|数字・数","lucky|幸運な","luck|幸運","bring|もたらす",
"good|よい","phone|電話","license|許可・免許","plates|ナンバープレート",
"people|人々","often|しばしば","sometimes|ときどき","always|いつも",
"never|決して～ない","use|使う","used|使われた","help|助ける",
"need|必要とする","student|学生","students|学生たち","group|集団","groups|集団",
"someone|誰か","another|別の","together|一緒に","world|世界",
"considered|考えられている","believe|信じる","thought|考えた","compare|比較する",
"compared|比較した","researchers|研究者","study|研究","experiment|実験",
"percentage|割合","percent|パーセント","cause|原因","caused|引き起こした",
"effect|効果・影響","avoid|避ける","encourage|励ます","author|筆者",
"writer|筆者","reader|読者","support|支援する","without|～なしで",
"instead|代わりに","more|より多く","less|より少ない","fewer|より少ない（数）",
"give|与える","gave|与えた","offered|差し出した","offer|提供する",
"decide|決める","decided|決めた","communicate|交流する","communication|コミュニケーション",
"internet|インターネット","e-mail|Eメール","friend|友人","friends|友人たち",
"feeling|気持ち","feelings|感情","money|お金","fortune|財産・幸運",
"wealth|富","prosperity|繁栄","bible|聖書","baseball|野球",
"inning|（野球の）回","innings|（野球の）回","rested|休んだ","creation|創造",
"perfect|完全な","custom|習慣","customs|習慣","superstition|迷信",
"china|中国","chinese|中国の","japan|日本","japanese|日本の",
"wolves|オオカミ","wolf|オオカミ","forest|森","forests|森","farming|農業",
"farmers|農民","disease|病気","died|死んだ","danger|危険","dangerous|危険な",
"water|水","clean|清潔な","river|川","crocodiles|ワニ","unicef|ユニセフ",
"pipeline|水道管","wells|井戸","safe|安全な","cookies|クッキー",
"rare|珍しい","rarer|より珍しい","rarity|希少性","limited|限定された",
"advertising|広告","rational|合理的な","valuable|価値のある","desirable|魅力的な",
"bacteria|細菌","gut|腸","guts|腸","mental|精神的な","physical|身体的な",
"health|健康","supplement|サプリメント","placebo|偽薬",
"positive|肯定的な","negative|否定的な","serotonin|セロトニン",
"hormone|ホルモン","crowd|人混み","bystander|傍観者","bystanders|傍観者たち",
"cruel|冷酷な","intercom|インターコム","discussion|話し合い",
"emergency|緊急事態","proverb|ことわざ","sailors|船員","scurvy|壊血病",
"vitamin|ビタミン","taste|味覚","eyesight|視力","memory|記憶",
"gasoline|ガソリン","vending|自動販売の","machine|機械","machines|機械",
"tower|塔","bell|鐘","ringer|鐘を鳴らす人","artificial|人工の",
"cancer|がん","hope|希望","traffic|交通","signal|信号","signals|信号",
"glass|ガラス","green|緑の","white|白い","red|赤い","beauty|美容",
"treatment|ケア・治療","patients|患者","appearance|外見","makeup|化粧"
];
const definitions=Object.fromEntries(common.map(v=>v.split("|")));
const escapeRegex=(v)=>v.replace(/[|\\{}()[\]^$+*?.]/g,"\\$&");
const normalize=(v)=>String(v||"").toLowerCase().replace(/[’‘]/g,"'");
export function glossaryFor(words=[]) {
 const map=new Map(Object.entries(definitions).map(([word,meaning])=>[word,{word,meaning}]));
 for(const item of words)for(const term of [item.word,...(item.targetStrings||[])]) {
  if(term&&item.meaning)map.set(normalize(term),{word:item.word,meaning:item.meaning,
    pronunciation:item.pronunciation||item.pron||""});
 }
 return map;
}
export function GlossaryText({text,words,onOpen}) {
 const entries=useMemo(()=>glossaryFor(words),[words]);
 const pattern=useMemo(()=>{
  const terms=[...entries.keys()].sort((a,b)=>b.length-a.length);
  return terms.length?new RegExp("(?<![A-Za-z])("+terms.map(escapeRegex).join("|")+")(?![A-Za-z])","gi"):null;
 },[entries]);
 if(!pattern)return <>{text}</>;
 return <>{String(text||"").split(pattern).map((piece,index)=>{
  const entry=entries.get(normalize(piece));
  return entry?<button type="button" key={index} className="th-comp-word"
    aria-label={piece+" の意味"} title="タップして意味を確認"
    onClick={event=>{event.stopPropagation();onOpen({...entry,word:piece});}}>{piece}</button>
    :<React.Fragment key={index}>{piece}</React.Fragment>;
 })}</>;
}
export function WordHelpModal({word,onClose}) {
 if(!word)return null;
 const speak=()=>{
  try{
   const Synth=window.SpeechSynthesisUtterance;
   if(!Synth||!window.speechSynthesis)return;
   window.speechSynthesis.cancel();
   const utterance=new Synth(word.word);
   utterance.lang="en-US";utterance.rate=.85;window.speechSynthesis.speak(utterance);
  }catch(_){}
 };
 return createPortal(<div className="th-comp-word-shade"
  onPointerDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div className="th-comp-word-dialog" role="dialog" aria-modal="true" aria-label="単語の意味">
   <button type="button" className="th-comp-word-close" aria-label="単語カードを閉じる" onClick={onClose}>×</button>
   <span className="th-kicker">WORD SUPPORT</span>
   <strong>{word.word}</strong>
   {word.pronunciation&&<small>/{word.pronunciation}/</small>}
   <p>{word.meaning}</p>
   <button type="button" className="th-comp-speak" onClick={speak}>🔊 発音を聞く</button>
  </div>
 </div>,document.body);
}
export function playAnswerSound(correct, enabled=true) {
 playSound(correct?"correct":"wrong",enabled);
}

export function AnswerCelebration({result}) {
 if(!result)return null;
 const confetti=Array.from({length:18},(_,i)=>i);
 return createPortal(<div className={"th-answer-overlay "+(result.correct?"is-correct":"is-incorrect")}
  role="status" aria-live="assertive">
   {result.correct&&<div className="th-answer-confetti" aria-hidden="true">
    {confetti.map(i=><span key={i} style={{"--i":i,"--r":(i*137.5)+"deg","--distance":(100+i%5*36)+"px"}}/>)}
   </div>}
   <div className="th-answer-emblem" aria-hidden="true">{result.correct?"✓":"×"}</div>
   <div className="th-answer-main">{result.correct?"CORRECT!":"NOT QUITE"}</div>
   <div className="th-answer-sub">{result.correct?"正解！ よくできました！":"不正解。答えを確認して次へ！"}</div>
  </div>,document.body);
}
