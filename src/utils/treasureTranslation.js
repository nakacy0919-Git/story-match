import { allUnitsData } from "../unitsData";
import { unitScripts, unitTranslations } from "../treasureData";

// Preserve sentence order, text, and paragraph whitespace so the visible
// passage is still the teacher's original Treasure Hunt English text.
export function sentenceParts(text) {
  const source = String(text || "");
  const fragments = source.match(/[^.!?]+[.!?]+(?:["”’'])?|[^.!?]+$/g) || [];
  return fragments.map((raw) => ({
    prefix: (raw.match(/^\s*/) || [""])[0],
    text: raw.trim(),
  })).filter((item) => item.text);
}
export function normalizeEnglish(text) {
  return String(text || "").replace(/<br\s*\/?>/gi," ").replace(/<[^>]*>/g," ").toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/(\d)\s*%/g, "$1 percent")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function japaneseSentences(value) {
  return (String(value || "").match(/[^。！？]+[。！？]?/g) || [])
    .map((item) => item.trim()).filter(Boolean);
}
function tokenOverlap(a, b) {
  const target = normalizeEnglish(a).split(" ").filter(Boolean);
  const available = normalizeEnglish(b).split(" ").filter(Boolean);
  if (!target.length || !available.length) return 0;
  const counts = new Map();
  for (const word of available) counts.set(word, (counts.get(word) || 0) + 1);
  let shared = 0;
  for (const word of target) {
    if (counts.get(word)) {
      shared++;
      counts.set(word, counts.get(word) - 1);
    }
  }
  return shared / target.length;
}
const manualUnit15 = [
  "私たちは集団の中にいると、困っている人に何もしないことがよくあります。",
  "私たちは「誰かほかの人が助けるだろう。だから、なぜ自分がしなければならないのだろう」と考えます。",
  "自分がそんなに冷たい人間だとは思わないかもしれません。",
  "しかし研究によって、私たちは誰もが冷酷な傍観者になり得ることが示されています。",
  "ある研究で、研究者たちは誰かが助けを求めたときに学生がどのように行動するかを調べました。",
  "学生たちはそれぞれ別の部屋に案内され、インターコムを通して話し合いに参加するよう求められました。",
  "学生たちは2人、3人、または6人のグループで話しました。",
  "話し合いの途中、グループの一人が突然、とても具合が悪いと言いました。",
  "その人の声はだんだん弱くなり、ついには学生たちはその人が倒れる音を聞きました。",
  "実は、この具合の悪い学生は研究チームの一員でしたが、ほかの学生たちはそれを知りませんでした。",
  "研究者たちは、何人の学生が助けを呼ぶために部屋を出るのかを知りたかったのです。",
  "学生が2人のグループにいたとき、実際に85％の学生が助けを呼びました。",
  "学生たちは自分だけが助けを呼びに行けると思ったため、そうしなければならないとわかっていました。",
  "一方、3人のグループでは62％、6人のグループではわずか31％の学生が助けを呼びました。",
  "明らかに、グループの人数が少ないほど、学生たちは助けを呼ぶ傾向が強かったのです。",
  "どうすれば、私たちは冷酷な傍観者になることを避けられるのでしょうか。",
  "いくつかの研究によると、傍観者についての事実を知っているだけで、集団の中でもよりよく行動できるそうです。",
  "ですから、この記事を読んだ今、もし誰かが助けを必要としていたら、きっと助けようとしますよね。"
];
const manualUnit1 = [
  "Eメールとインターネットは世界をより小さくしました。",
  "今日では、家やオフィスから世界中のニュースや番組を見ることができます。",
  "また、インターネットを使って外国の人々と話すこともできます。",
  "しかし、この新しい技術には何か悪い点があるのでしょうか。",
  "はい、あります。",
  "最近では、人々は以前よりはるかに多くの時間をインターネットに費やしています。",
  "一日中コンピューターの前に座っている人もいます。",
  "そのような人々は、ほかの人に会おうとしません。",
  "しかしもちろん、対面でのコミュニケーションが必要なこともあります。",
  "例えば、友達が落ち込んでいるとき、あなたならどうしますか。",
  "友達を元気づけるのに言葉は必要ありません。",
  "ただ抱きしめてあげればよいのです。",
  "Eメールを送るだけでは、そうすることはできません。",
  "文字のメッセージだけで相手の心に触れるのは、難しいことがよくあります。",
  "Eメールとインターネットのおかげで、コミュニケーションはより簡単になりました。",
  "しかし、その便利さゆえに、ほかのコミュニケーション方法があることを忘れがちです。",
  "笑顔でさえ、Eメールよりずっと効果的な場合があることを忘れないでください。"
];
const manualUnit2 = [
  "コリンは、病気のふりをして1,000ドルを手に入れようと思いつきました。",
  "彼は診療所に行き、医者に自分の問題を話しました。",
  "コリン：「味覚を失ってしまいました。」",
  "医者：「看護師さん、22番の箱から薬を持ってきて、患者の口に3滴入れてください。」",
  "コリン：「うえっ！」",
  "「これはガソリンじゃないか！」",
  "医者：「おめでとうございます！」",
  "「味覚が戻りましたね。」",
  "「診察代は500ドルです。」",
  "1週間後、コリンはまた診療所に行きました。",
  "コリン：「記憶を失ってしまいました。」",
  "「何も思い出せません。」",
  "医者：「看護師さん、22番の箱から薬を持ってきて、それから……。」",
  "コリン：「でも、それはガソリンですよ！」",
  "医者：「おめでとうございます！」",
  "「記憶が戻りましたね。」",
  "「診察代は500ドルです。」",
  "コリンは諦めませんでした。",
  "彼はその翌週、再び診療所を訪れました。",
  "コリン：「目がとても見えにくくなりました。」",
  "「ほとんど何も見えません。」",
  "医者：「それには薬がありませんね。」",
  "「この1,000ドル札を受け取ってください。」",
  "コリン：「でも、これは500ドルですよ！」",
  "医者：「おめでとうございます！」",
  "「視力が戻りましたね。」",
  "「診察代は500ドルです。」"
];
const manualTranslations = {1: manualUnit1, 2: manualUnit2, 15: manualUnit15};
const expectedLengths = {1:17, 2:27, 15:18};

function translationFromScenes(unit, target) {
  const normal = normalizeEnglish(target);
  if (!normal) return null;
  let best = null;
  for (const row of allUnitsData[unit] || []) {
    const source = normalizeEnglish(row.en);
    const tokens = normal.split(" ").length;
    const contains = source.includes(normal);
    const closeness = tokenOverlap(target, row.en);
    const reverse = tokenOverlap(row.en, target);
    const isSafe = contains || (tokens >= 5 && closeness >= 0.86 && reverse >= 0.42);
    if (!isSafe) continue;
    const score = contains ? 2 + normal.length / 1000 : closeness + reverse;
    if (!best || score > best.score) best = {row, score};
  }
  if (!best) return null;
  const enPieces = sentenceParts(best.row.en);
  const jaPieces = japaneseSentences(best.row.ja);
  if (enPieces.length === jaPieces.length && enPieces.length > 0) {
    const index = enPieces.findIndex(({text}) => {
      const source = normalizeEnglish(text);
      return source === normal || source.includes(normal) ||
        (tokenOverlap(target,text) >= 0.86 && tokenOverlap(text,target) >= 0.7);
    });
    if (index !== -1 && jaPieces[index]) {
      return {text:jaPieces[index], kind:"sentence", label:"一文の日本語訳"};
    }
  }
  return {text:best.row.ja, kind:"scene", label:"対応する複数文の日本語訳"};
}

function paragraphTranslation(unit, scope, target) {
  const base = "U" + String(unit).padStart(2,"0") + "_P1_";
  if (scope !== "full" && unitTranslations[base + scope]) {
    return {text:unitTranslations[base + scope], kind:"paragraph", label:"該当段落の訳（参考）"};
  }
  const normTarget=normalizeEnglish(target);
  for(let index=1;index<=8;index++){
    const key=base+"p"+index;
    if (unitScripts[key] && normalizeEnglish(unitScripts[key]).includes(normTarget)) {
      return {text:unitTranslations[key] || "",kind:"paragraph",label:"該当段落の訳（参考）"};
    }
  }
  return {text:unitTranslations[base+"full"] || "",kind:"paragraph",label:"本文の日本語訳（参考）"};
}

// Do not claim a paragraph or group translation is a sentence translation.
// The legacy Story Match scene text and Treasure Hunt originals sometimes differ.
export function lookupTranslation(unit, scope, sentenceIndex, sentence, allSentences) {
  const manual=manualTranslations[unit];
  if (manual && allSentences.length === expectedLengths[unit]) {
    const normalizedFull = normalizeEnglish((unitScripts["U"+String(unit).padStart(2,"0")+"_P1_full"] || ""));
    const normalizedDisplay = normalizeEnglish(allSentences.join(" "));
    // Manual translations are indexed against the canonical full-text only.
    if(scope==="full" && normalizedDisplay===normalizedFull && manual[sentenceIndex]){
      return {text:manual[sentenceIndex],kind:"sentence",label:"一文の日本語訳"};
    }
  }
  return translationFromScenes(unit,sentence) || paragraphTranslation(unit,scope,sentence);
}
