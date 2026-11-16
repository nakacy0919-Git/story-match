import { unitVocab } from "../treasureData";
import { glossaryFor } from "../components/ComprehensionHelpers";

const basics = [
["the","その（定冠詞）","ðə / ði"],["a","一つの（不定冠詞）","ə / eɪ"],["an","一つの（不定冠詞）","ən / æn"],
["i","私","aɪ"],["you","あなた、あなたたち","juː"],["he","彼","hiː"],["she","彼女","ʃiː"],["it","それ","ɪt"],["we","私たち","wiː"],["they","彼ら、それら","ðeɪ"],
["my","私の","maɪ"],["your","あなたの","jʊr"],["his","彼の","hɪz"],["her","彼女の、彼女を","hɜːr"],["their","彼らの","ðer"],["our","私たちの","aʊər"],["me","私を、私に","miː"],["him","彼を、彼に","hɪm"],["them","彼らを、それらを","ðem"],["us","私たちを","ʌs"],
["is","～である、いる","ɪz"],["am","～である","æm"],["are","～である、いる","ɑːr"],["was","～だった、いた","wɑːz"],["were","～だった、いた","wɜːr"],["be","～である、いる","biː"],["been","be の過去分詞","bɪn"],["being","be の ing 形","ˈbiːɪŋ"],
["have","持っている、～したことがある","hæv"],["has","have の三人称単数形","hæz"],["had","have の過去形・過去分詞","hæd"],["do","する","duː"],["does","do の三人称単数形","dʌz"],["did","do の過去形","dɪd"],
["can","～できる","kæn"],["could","～できた、～できるだろう","kʊd"],["will","～するだろう","wɪl"],["would","～だろう、～したものだった","wʊd"],["should","～すべき","ʃʊd"],["must","～しなければならない","mʌst"],["may","～かもしれない","meɪ"],["might","～かもしれない","maɪt"],["not","～ない","nɑːt"],
["to","～へ、～するために","tuː"],["of","～の","əv"],["in","～の中に、～で","ɪn"],["on","～の上に、～に","ɑːn"],["at","～で、～に","æt"],["from","～から","frʌm"],["for","～のために、～の間","fɔːr"],["with","～と一緒に、～を使って","wɪð"],["by","～によって、～のそばに","baɪ"],["as","～として、～のように","æz"],["about","～について、約","əˈbaʊt"],["into","～の中へ","ˈɪntuː"],["over","～の上を、～を超えて","ˈoʊvər"],["out","外へ","aʊt"],["up","上へ","ʌp"],["down","下へ","daʊn"],["off","離れて","ɔːf"],["through","～を通して","θruː"],
["and","そして、～と","ænd"],["or","または","ɔːr"],["but","しかし","bʌt"],["if","もし～なら","ɪf"],["so","だから、とても","soʊ"],["that","その、～ということ","ðæt"],["this","これ、この","ðɪs"],["these","これらの","ðiːz"],["those","それらの","ðoʊz"],["there","そこに、～がある","ðer"],["here","ここに","hɪr"],["then","その時、それから","ðen"],["than","～よりも","ðæn"],["very","とても","ˈveri"],["also","～もまた","ˈɔːlsoʊ"],["only","～だけ","ˈoʊnli"],["even","～でさえ","ˈiːvən"],["just","ちょうど、ただ","dʒʌst"],["all","すべての","ɔːl"],["every","すべての、毎～","ˈevri"],["each","それぞれの","iːtʃ"],["some","いくつかの","sʌm"],["any","いくらかの、どんな～でも","ˈeni"],["no","いいえ、～がない","noʊ"],["one","一つ、一人","wʌn"],["two","二つ、二人","tuː"],["first","最初の","fɜːrst"],["last","最後の、前の","læst"],["new","新しい","nuː"],["old","古い、年を取った","oʊld"],["other","ほかの","ˈʌðər"],
["child","子ども","tʃaɪld"],["children","子どもたち","ˈtʃɪldrən"],["walk","歩く","wɔːk"],["walked","歩いた","wɔːkt"],["school","学校","skuːl"],["morning","朝","ˈmɔːrnɪŋ"],["day","日、一日","deɪ"],["time","時間、時","taɪm"],["year","年","jɪr"],["years","年（複数）","jɪrz"],["life","人生、生活、命","laɪf"],["make","作る、～させる","meɪk"],["made","作った、～させた","meɪd"],["get","得る、～になる","ɡet"],["got","得た、～になった","ɡɑːt"],["go","行く","ɡoʊ"],["went","行った","went"],["come","来る","kʌm"],["came","来た","keɪm"],["take","取る、連れて行く","teɪk"],["took","取った、連れて行った","tʊk"],["see","見る、会う","siː"],["saw","見た","sɔː"],["say","言う","seɪ"],["said","言った","sed"],["tell","伝える、話す","tel"],["told","伝えた","toʊld"],["know","知っている","noʊ"],["knew","知っていた","nuː"],["think","考える、思う","θɪŋk"],["thought","考えた、思った","θɔːt"],["want","欲しい、～したい","wɑːnt"],["wanted","欲しかった、～したかった","ˈwɑːntɪd"],["look","見る、～に見える","lʊk"],["feel","感じる","fiːl"],["felt","感じた","felt"],["find","見つける","faɪnd"],["found","見つけた","faʊnd"],["work","働く、機能する、仕事","wɜːrk"],["live","住む、生きる","lɪv"],["home","家、故郷","hoʊm"],["house","家","haʊs"],["family","家族","ˈfæməli"],["man","男性","mæn"],["woman","女性","ˈwʊmən"],["men","男性たち","men"],["women","女性たち","ˈwɪmɪn"],["friend","友人","frend"],["many","多くの","ˈmeni"],["much","多くの","mʌtʃ"],["more","もっと多い","mɔːr"],["most","最も多い、大部分","moʊst"],["little","小さい、少しの","ˈlɪtəl"],["small","小さい","smɔːl"],["big","大きい","bɪɡ"],["long","長い","lɔːŋ"],["great","すばらしい、大きな","ɡreɪt"],["good","良い","ɡʊd"],["bad","悪い","bæd"],["best","最も良い","best"],["better","より良い","ˈbetər"],["how","どのように","haʊ"],["what","何","wɑːt"],["when","いつ、～する時","wen"],["where","どこ","wer"],["why","なぜ","waɪ"],["who","誰","huː"],["which","どれ、どの","wɪtʃ"],["before","～の前に","bɪˈfɔːr"],["after","～の後に","ˈæftər"],["because","なぜなら","bɪˈkɔːz"],["while","～する間","waɪl"],["again","再び","əˈɡen"],["still","まだ、依然として","stɪl"],["never","決して～ない","ˈnevər"],["always","いつも","ˈɔːlweɪz"],["often","しばしば","ˈɔːfən"],["sometimes","時々","ˈsʌmtaɪmz"],["very","とても","ˈveri"]
];
const phrases = [
["look at","～を見る"],["look like","～のように見える"],["look for","～を探す"],["look after","～の世話をする"],["take care of","～の世話をする"],["take part in","～に参加する"],["take place","起こる、開催される"],["take a look at","～をちょっと見る"],["find out","～を知る、見つけ出す"],["give up","あきらめる"],["grow up","成長する"],["pick up","拾う、迎えに行く"],["wake up","目を覚ます"],["stand up","立ち上がる"],["sit down","座る"],["come back","戻る"],["go back","戻る"],["get up","起きる"],["get to","～に着く、～するようになる"],["be able to","～できる"],["want to","～したい"],["have to","～しなければならない"],["used to","以前は～したものだった"],["try to","～しようとする"],["in front of","～の前に"],["in order to","～するために"],["because of","～のために"],["instead of","～の代わりに"],["such as","例えば～のような"],["for example","例えば"],["of course","もちろん"],["as well as","～だけでなく"],["as soon as","～するとすぐに"],["at first","最初は"],["at last","ついに"],["at least","少なくとも"],["at the same time","同時に"],["on the other hand","一方で"],["a lot of","たくさんの"],["lots of","たくさんの"],["one of","～のうちの一つ"],["all over the world","世界中で"],["around the world","世界中で"],["each other","お互いに"],["every day","毎日"],["every morning","毎朝"],["all day","一日中"],["go to school","学校に行く"],["walk to school","歩いて学校へ行く"],["walked to school","歩いて学校へ行った"],["and so on","など"],["sense of taste","味覚"],["wait a minute","ちょっと待って"],["cheer up","元気づける"],["feel down","落ち込む"],["feeling down","落ち込んでいる"],["pay attention to","～に注意を払う"],["depend on","～に依存する、～次第である"],["be interested in","～に興味がある"],["in fact","実際に"],["in addition","さらに"],["more than","～より多く"],["less than","～より少なく"],["no longer","もはや～ない"],["so that","～するために"]
];
const norm = s => String(s || "").toLowerCase().replace(/[’‘]/g,"'").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,"");
const tokenPattern = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const tokens = s => Array.from(String(s || "").matchAll(tokenPattern), m=>({key:norm(m[0]),start:m.index,end:m.index+m[0].length}));
const basicMap = new Map(basics.map(([word,meaning,pronunciation])=>[word,{word,meaning,pronunciation}]));
const allEntries = Object.values(unitVocab).flat();
const commonMap = glossaryFor(allEntries);
function keyFor(unit){ return "U"+String(unit).padStart(2,"0")+"_P1"; }
function entriesFor(unit){ return unitVocab[keyFor(unit)] || []; }
function forms(entry){return [entry.word,...(entry.targetStrings||[])].filter(Boolean);}
function lookupSingle(word,unit) {
  const key=norm(word);
  const local=entriesFor(unit).find(e=>forms(e).some(f=>norm(f)===key && tokens(f).length===1));
  const entry=local||basicMap.get(key)||commonMap.get(key);
  if(!entry)return null;
  return {...entry, pronunciation:norm(entry.word)===key?(entry.pronunciation||entry.pron||""):""};
}
export function lookupReadingWord(unit, text, offset, clicked) {
  const list=tokens(text);
  const selected=list.findIndex(t=>t.start>=offset && t.start<offset+clicked.length);
  const word=selected>=0?text.slice(list[selected].start,list[selected].end):norm(clicked);
  if(!word)return null;
  const single=lookupSingle(word,unit);
  const candidates=[...entriesFor(unit),...phrases.map(([word,meaning])=>({word,meaning})),...allEntries];
  let match=null;
  for(const entry of candidates){
    for(const form of forms(entry)){
      const keys=tokens(form).map(t=>t.key);
      if(keys.length<2 || selected<0)continue;
      for(let start=Math.max(0,selected-keys.length+1); start<=selected;start++){
        const end=start+keys.length-1;
        if(end>=list.length || !keys.every((k,j)=>list[start+j].key===k))continue;
        if(/[.!?;:]/.test(text.slice(list[start].start,list[end].end)))continue;
        if(!match||keys.length>match.count) match={word:text.slice(list[start].start,list[end].end),meaning:entry.meaning,pronunciation:norm(entry.word)===norm(form)?(entry.pronunciation||entry.pron||""):"",count:keys.length};
      }
    }
  }
  return {word,meaning:single?.meaning||"",pronunciation:single?.pronunciation||"",base:single?.word||"",phrase:match};
}
