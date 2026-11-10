// Questions reconstructed from user-supplied Treasure Hunt workbook photos, pp.40–63.
// These are practice adaptations and teacher-written answer keys, NOT publisher answer sheets.
// No audio-dependent questions are graded without source audio.
export const choice=(page,section,prompt,options,answer,explanation="",paragraph="")=>({
  type:"choice",page,section,prompt,options,answer,explanation,paragraph
});
export const multi=(page,section,prompt,options,answer,explanation="",paragraph="")=>({
  type:"multi",page,section,prompt,options,answer,explanation,paragraph
});
export const short=(page,section,prompt,answers,explanation="",paragraph="")=>({
  type:"short",page,section,prompt,answers:Array.isArray(answers)?answers:[answers],explanation,paragraph
});
export const order=(page,section,prompt,tokens,answer,explanation="")=>({
  type:"order",page,section,prompt,tokens,answer,explanation
});
export const written=(page,section,prompt,answer,explanation="",paragraph="")=>({
  type:"written",page,section,prompt,answer,explanation,paragraph
});
export const tf=(page,section,prompt,correct,explanation="",paragraph="")=>choice(
  page,section,prompt,["○ 正しい","× 正しくない"],correct?0:1,explanation,paragraph
);

export const workbookReading={
10:[
 choice(41,"話題把握","本文で多くの国のラッキーナンバーとして挙げられている数字は？",["3","6","7","8"],2,"第1段落では多くの国で7が人気と説明している。","1"),
 multi(41,"内容理解①","下線部 Do you know why? の答えになる段落をすべて選びましょう。",["第1段落","第2段落","第3段落","第4段落"],[1,2],"野球と聖書を説明する第2・3段落。","2–3"),
 short(41,"内容理解②","Seven is seen as (　　) or perfect. 1語で入力。",["complete"],"第3段落のcomplete or perfectの前半。","3"),
 short(41,"内容理解②","Seven is considered complete or (　　). 1語で入力。",["perfect"],"complete or perfect が本文第3段落の表現。","3"),
 short(41,"内容理解②","God (　　) on the 7th day. 1語で入力。",["rested"],"God ... rested on the 7th day.","3"),
 short(41,"内容理解②","God created the heavens and earth in (　　) days. 英語で入力。",["six","6"],"創造はsix days（6日間）。","3"),
 written(41,"内容理解③","中国で8が幸運と考えられる理由を日本語で説明してください。","中国語の8（bā）の音が「財産を得る」を意味する語（fā）に似ているため。","第4段落の発音と財運の説明が根拠。","4"),
 written(41,"内容理解④","次を日本語に訳しましょう。But knowing about these customs can help you understand the people of each country.","しかし、こうした習慣を知ることは、それぞれの国の人々を理解する助けになる。","動名詞 knowing が主語。「can help you understand」に注目。","5"),
 tf(41,"内容一致(a)","Many people use lucky numbers in their phone numbers because they hope for good luck.",true,"第1段落で電話番号に使う例が示される。","1"),
 tf(41,"内容一致(b)","Baseball games turn in the 7th inning because seven is the world's most popular lucky number.",false,"本文では7回に試合の流れが変わることが7を特別とする説明であり、原因と結果が逆。","2"),
 tf(41,"内容一致(c)","In Major League Baseball, fans stand and sing together before the game begins.",false,"歌うのは試合開始前でなく7回の休憩時間。","2"),
 tf(41,"内容一致(d)","Knowing a country's lucky-number customs can help you understand its people.",true,"第5段落で習慣を理解する意義が明記されている。","5")
],
11:[
 choice(45,"話題把握","Little Red Riding Hood に当たる日本語のおとぎ話は？",["赤ずきん","三匹の子ぶた","オオカミと七匹の子ヤギ","白雪姫"],0,"Little Red Riding Hood＝赤ずきん。"),
 choice(45,"話題把握","The Three Little Pigs に当たるおとぎ話は？",["赤ずきん","三匹の子ぶた","オオカミと七匹の子ヤギ","シンデレラ"],1,"The Three Little Pigs＝三匹の子ぶた。"),
 choice(45,"話題把握","The Wolf and the Seven Young Kids に当たるおとぎ話は？",["赤ずきん","三匹の子ぶた","オオカミと七匹の子ヤギ","美女と野獣"],2,"kids はここでは子ヤギの意味。"),
 written(45,"内容理解①","18世紀より前、日本でオオカミが神として敬われた理由を答えましょう。","オオカミがネズミやシカなど、稲を食べて農家に害を与える動物を食べたから。","第3段落。","3"),
 written(45,"内容理解①","18世紀にオオカミのイメージが変化した理由を答えましょう。","オオカミが恐ろしい病気にかかり、その病気が人間も死なせたため、神から怪物へと見方が変わった。","第3段落の病気の説明。","3"),
 choice(45,"内容理解②","本文中の farmers' 'enemy' は主にどの動物を指しますか？",["ネズミやシカ","オオカミだけ","ライオンやトラ","犬や猫"],0,"稲を食べるネズミやシカが農家にとっての敵。","3"),
 short(45,"内容理解③","筆者の考えでは、本当に 'bad animals' と言えるのは誰？ 英語2語で入力。",["human beings","we humans"],"筆者は人間がオオカミの悪いイメージを作り出したと主張。","4"),
 tf(45,"内容一致(a)","People cleared forests partly to create farmland.",true,"人々は農業のため木を切り森を開いた。","2"),
 tf(45,"内容一致(b)","Wolves were seen as bad because their activities were inconvenient to some people.",true,"第4段落で人間の都合によって見られ方が変わると述べる。","4"),
 tf(45,"内容一致(c)","Wild wolves can still be found in Japan today according to the passage.",false,"第3段落では日本のオオカミは絶滅したとある。","3")
],
12:[
 choice(49,"話題把握","グラフによると清潔な水を得られる人が最も少ない国は？",["Japan","Angola","Afghanistan","Zambia"],2,"アフガニスタンは13％と示されている。","1"),
 short(49,"内容理解①","In (　　), everyone can get clean water. 国名を英語で入力。",["Japan"],"グラフでは日本100％。","1"),
 short(49,"内容理解②","Getting water from the river could be sometimes very d______. 適語を入力。",["dangerous"],"ワニの近くで水をくむ危険な状況を述べる。","2"),
 written(49,"内容理解②","セリナが子どもを亡くした原因となった問題を日本語で答えましょう。","川の水が清潔でなく、その水を飲むと病気になることがあったため。","第3段落。","3"),
 multi(49,"内容理解③","本文で説明されるUNICEFの活動をすべて選びましょう。",["水を運ぶパイプラインを建設","井戸を建設","安全な飲み水の作り方を教える","地域に野球場を建てる"],[0,1,2],"第4段落に3つの活動が挙げられている。","4"),
 tf(49,"内容一致(a)","The graph shows that all African countries have equally good access to clean water.",false,"アフリカの国でも22％・50％・55％など差がある。","1"),
 tf(49,"内容一致(b)","Some of Celina's children died because they drank unsafe water.",true,"第3段落で飲料水による病気と子どもの死が述べられる。","3"),
 tf(49,"内容一致(c)","By the end of the passage, everyone in the world has clean water.",false,"第4段落末でまだ多くの人に安全な水がないと述べる。","4")
],
13:[
 choice(53,"話題把握","本文のクッキーの実験は何の分野の研究ですか？",["心理学","物理学","地質学","生態学"],0,"A psychologist ... と第1段落にある。","1"),
 short(53,"内容理解①","最初のグループにはクッキーが何枚ありましたか？ 半角数字で入力。",["10"],"第1段落の10 cookies。","1"),
 short(53,"内容理解①","より高く評価したグループは何枚のクッキーを渡されましたか？",["2"],"少ない2枚のグループが高評価。","1"),
 written(53,"内容理解②","the rule of rarity を日本語で説明しましょう。","数が少ないものほど、価値が高く魅力的に見えるという希少性の法則。","第1段落の the rarer ... the more ... に注目。","1"),
 choice(53,"内容理解③","『特別限定モデルのスニーカー』はどの希少性？",["数量","時間","両方","どちらでもない"],0,"limited edition は数量の希少性の例。","2"),
 choice(53,"内容理解③","ホテルの『残り1室』の表示はどの希少性？",["数量","時間","両方","どちらでもない"],0,"残り部屋数が少ない例。","2"),
 choice(53,"内容理解③","季節限定のコーヒーはどの希少性？",["数量","時間","両方","どちらでもない"],1,"特定の季節だけ販売される。","2"),
 choice(53,"内容理解③","2日間だけ配布されるゲームキャラクターはどの希少性？",["数量","時間","両方","どちらでもない"],1,"期限が2日間に限られている。","2"),
 choice(53,"内容理解③","新年の福袋はどの希少性？",["数量","時間","両方","どちらでもない"],2,"本文では数と時間の両方を利用するとされる。","2"),
 choice(53,"内容理解③","珍しい人気トレーディングカードの数量限定出品はどの希少性？",["数量","時間","両方","どちらでもない"],0,"出品数・供給数が限られた例。","2"),
 choice(53,"内容理解③","『今から1時間だけ20％OFF』というタイムセールはどの希少性？",["数量","時間","両方","どちらでもない"],1,"1時間だけという時間制限。","2"),
 written(53,"内容理解④","things labeled 'limited' or 'only now' can make it hard for us to think rationally. を和訳しましょう。","「限定」「今だけ」と表示された物は、私たちが合理的に考えることを難しくする場合がある。","第3段落の結論部分。","3"),
 choice(53,"内容理解⑤","We should be careful. の後につながる筆者の意図は？",["買うものを選ぶとき","寝る前に本を読むとき","心理学の実験をするとき","他人と異なる意見を持つとき"],0,"希少性によって購入判断が影響を受けることへの警告。","3")
],
14:[
 choice(57,"話題把握","本文の『細菌』を表す英語は？",["cell","virus","bacteria","parasite"],2,"bacteria＝細菌。","1"),
 written(57,"内容理解①","They are as important for our mental health as for our physical health. を、Theyの内容を明示して訳しましょう。","腸内の細菌は、体の健康にとってと同じくらい心の健康にとっても重要だ。","They は前文の腸内細菌を指す。","1"),
 choice(57,"内容理解②","実験でグループAに与えたものは？",["善玉菌を多く含むサプリメント","偽薬","眠気を覚ます薬","糖分の多い飲料"],0,"第2段落のone group ... supplement。","2"),
 choice(57,"内容理解②","グループBに与えたものは？",["善玉菌を多く含むサプリメント","偽薬","抗生物質","睡眠薬"],1,"第2段落のother group ... placebo。","2"),
 short(57,"内容理解②","2グループの服用期間は何週間ですか？ 数字で入力。",["3"],"every day for three weeks。","2"),
 choice(57,"内容理解②","3週間後に調べたのは何に対する反応？",["肯定的・否定的な言葉","温かい・冷たい飲み物","速い・遅い音楽","赤と青の文字だけ"],0,"joy / anger などの言葉への反応。","2"),
 choice(57,"内容理解②","善玉菌サプリメント群はどのような言葉により注目した？",["肯定的な言葉","否定的な言葉","動物の名前","国名"],0,"positive words に注目。","2"),
 choice(57,"内容理解②","偽薬群はどのような言葉により注目した？",["肯定的な言葉","否定的な言葉","数字","曜日"],1,"negative words に注目。","2"),
 written(57,"内容理解③","腸の働きがよいと幸福感が得られる理由を、セロトニンに触れて説明しましょう。","幸福感を与えるホルモンのセロトニンが腸で多く作られ、善玉菌がその働きを助けると考えられるため。","本文第3段落。","3"),
 tf(57,"内容一致(a)","Gut bacteria are less important for mental health than for physical health.",false,"心の健康にとっても体の健康と同じくらい重要。","1"),
 tf(57,"内容一致(b)","The researchers argue that happiness can influence the way our guts work in the same direction described in the passage.",false,"本文の説明は腸の働きが幸福感に関わるという方向であり、逆向きの因果を断定していない。","3"),
 tf(57,"内容一致(c)","Some researchers hope bacteria can help with mental-health problems.",true,"最終段落で細菌を利用して心の健康問題を解決しようとしている。","4")
],
15:[
 choice(61,"話題把握","A friend in need is a friend indeed. の意味として最も近いのは？",["困ったとき助けてくれる友人こそ本当の友人","人生には友情が必要","本当に困るのは友人がいないこと","友人は必ず助けを求める"],0,"困難なときに助けてくれる人が真の友人。"),
 written(61,"内容理解①","第1段落の such a cruel person はどのような人か説明しましょう。","困っている人が目の前にいても、ほかの誰かが助けると思って自分では何もしない人。","第1段落の傍観者の行動。","1"),
 short(61,"内容理解②","2人のグループで助けを呼んだ人の割合（%）を数字で入力。",["85","85%"],"第3段落、2人→85％。","3"),
 short(61,"内容理解②","3人のグループで助けを呼んだ割合（%）を入力。",["62","62%"],"第3段落、3人→62％。","3"),
 short(61,"内容理解②","6人のグループで助けを呼んだ割合（%）を入力。",["31","31%"],"第3段落、6人→31％。","3"),
 choice(61,"内容理解③","there were (　　) people in a group の空所に適切な語は？",["more","less","fewer","bigger"],2,"people は数えられる名詞。人数が少ないほど援助行動が増えたので fewer。","3"),
 written(61,"内容理解④","Now that you've read this article, if someone needs help, you are sure to offer it, aren't you? を日本語に訳しましょう。","この記事を読んだ今、誰かが助けを必要としていたら、きっとあなたは助けるでしょうね。","now that＝今や～なので、付加疑問は確認・呼びかけ。","4"),
 tf(61,"内容一致(a)","Each student joined the discussion from an individual room.",true,"個別の部屋からインターコムを通して話した。","2"),
 tf(61,"内容一致(b)","Many students left the room to call for help because they actually felt ill.",false,"具合が悪いと言ったのは研究チームの一員で、ほかの学生は助けを呼ぶか観察された。","2"),
 tf(61,"内容一致(c)","Learning about bystander behavior may help us act more positively in a crowd.",true,"第4段落の結論。","4")
]
};
