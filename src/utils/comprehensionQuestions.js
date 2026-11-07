import { allUnitsData } from "../unitsData";
const curated={
10:[
["Why do people use lucky numbers on phone numbers?","電話番号にラッキーナンバーを使うのはなぜ？","To bring good luck.","To identify their home.","To show their age.","To call internationally.","幸運を呼ぶため。","住む場所を示すため。","年齢を表すため。","国際電話をかけるため。"],
["Why is seven special in baseball?","野球で数字の7が特別な理由は？","The seventh inning often changes a game.","A game has seven innings.","Seven players are on every team.","The ball is worth seven points.","7回に試合の流れが変わることが多い。","試合は必ず7回で終わる。","各チームの選手は7人。","ボールが7点に相当する。"],
["What happened on the seventh day in the Bible story?","聖書の話で神が7日目にしたことは？","God rested.","God started creating the earth.","God invented baseball.","God gave people money.","神は休んだ。","地球の創造を始めた。","野球を発明した。","人にお金を与えた。"],
["Why is eight considered lucky in China?","中国で8が縁起のよい数字とされる理由は？","It sounds like a word related to getting rich.","There are eight continents.","Every week has eight days.","Eight is used only for trains.","金持ちになることに関係する語と発音が似ている。","大陸が8つある。","1週間が8日ある。","電車だけに使われる。"]
],
15:[
["What is the passage mainly about?","本文の主なテーマは？","People may not help when others are present.","People cannot hear each other in crowds.","Students dislike discussions.","People always call for help.","周囲に人がいると助けない場合がある。","人混みでは互いの声が聞こえない。","学生は話し合いが嫌い。","人は必ず助けを求める。"],
["How many students called for help in two-person groups?","2人グループで助けを呼んだ割合は？","85%","62%","31%","15%","85％","62％","31％","15％"],
["Which group was least likely to call for help?","最も助けを呼びにくかったのは？","Six-person groups.","Two-person groups.","Three-person groups.","All were equal.","6人グループ。","2人グループ。","3人グループ。","すべて同じ。"],
["How can we avoid being cruel bystanders?","冷酷な傍観者を避けるための方法は？","Learn about the bystander effect.","Always wait for others.","Avoid helping people.","Leave every group immediately.","傍観者効果について学ぶ。","常に他人を待つ。","人助けを避ける。","すぐに集団から離れる。"]
]};
function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function comprehensionQuestions(unit,lang){
 if(curated[unit])return curated[unit].map((r,i)=>{const choices=lang==="en"?r.slice(2,6):r.slice(6,10);
 return {id:i,prompt:lang==="en"?r[0]:r[1],correct:choices[0],options:shuffle(choices),type:"fact"};});
 const scenes=(allUnitsData[unit]||[]).filter(x=>x.en&&x.ja);
 if(scenes.length<4)return [];
 const ids=[0,Math.floor(scenes.length/3),Math.floor(scenes.length*2/3),scenes.length-1];
 return ids.map((index,i)=>{
 const match=scenes[index],choices=shuffle(scenes.filter((_,j)=>j!==index)).slice(0,3);
 const english=lang==="en";
 const correct=english?match.ja:match.en;
 return {id:i,prompt:english?"Choose the Japanese meaning of this passage:\n"+match.en:
 "次の内容を正しく表す英文はどれですか？\n"+match.ja,
 correct,options:shuffle([correct,...choices.map(x=>english?x.ja:x.en)]),type:"meaning"};
 });
}
