import { choice, short, order, written } from "./workbookReading";
// Grammar & Writing — workbook-aligned, separate from the existing Sentence Builder.
export const workbookGrammar={
10:[
 short(42,"1(1) 動名詞","(　　) pictures is fun for Tom. [draw]",["Drawing"],"主語として「絵を描くこと」= Drawing pictures。"),
 short(42,"1(2) 動名詞","His job is (　　) imported cars. [sell]",["selling"],"補語として動名詞 selling。"),
 short(42,"1(3) 動名詞","The most important thing for you is (　　) too much. [eat を使って否定]",["not eating"],"動名詞の否定形は not + 動詞ing。"),
 written(42,"2(1) 意味上の主語","I like singing the song. の下線の動名詞に [Jack] を意味上の主語として追加。全文を書きましょう。","I like Jack's singing the song.","意味上の主語に所有格 Jack's を使う。"),
 written(42,"2(2) 意味上の主語","We were afraid of arriving late. の下線の動名詞に [she] を意味上の主語として追加。","We were afraid of her arriving late.","動名詞の意味上の主語には所有格 her を使用できる。"),
 written(42,"3(1) 和文英訳","私は彼らが試合に勝つことを確信している。","I am sure of their winning the game.","be sure of + 所有格 + 動名詞。"),
 written(42,"3(2) 和文英訳","私たちは彼が私たちのチームに入ることを確信している。[join]","We are sure of his joining our team.","be sure of his joining ... と表せる。")
],
11:[
 choice(46,"1(1) 等位・従属接続詞","Tom went to the library. の後に続く適切な文は？",["if it is fine tomorrow","and he borrowed two books there","when I called her","because she had a cold"],1,"図書館に行き、そこで2冊借りたという自然なつながり。"),
 choice(46,"1(2) 等位・従属接続詞","He visited me at 10:00 yesterday, の後につなぐ文は？",["but I wasn't at home at that time","and he borrowed two books there","when I called her","if it is fine tomorrow"],0,"訪ねて来たが、私は不在だったという対比。"),
 choice(46,"1(3) 等位・従属接続詞","We will go fishing の後につながるのは？",["and he borrowed two books there","but I wasn't at home","if it is fine tomorrow","when I called her"],2,"未来の条件：if it is fine tomorrow。"),
 choice(46,"1(4) 等位・従属接続詞","Yuki was studying の後につながるのは？",["when I called her","if it is fine tomorrow","because she had a cold","and he borrowed two books there"],0,"私が電話したときユキは勉強中だった。"),
 choice(46,"1(5) 等位・従属接続詞","She was absent from school yesterday の後につながるのは？",["if it is fine tomorrow","and he borrowed two books there","when I called her","because she had a cold"],3,"欠席の理由をbecauseで説明。"),
 written(46,"2(1) 和訳","Although he was hungry, he didn't eat anything. を訳しましょう。","彼はおなかがすいていたけれど、何も食べなかった。","although は逆接「～だけれども」。"),
 written(46,"2(2) 和訳","She loves cheesecake, though she doesn't like cheese. を訳しましょう。","彼女はチーズが好きではないけれど、チーズケーキは大好きだ。","though は although と同様に譲歩を表す。"),
 written(46,"3(1) 和文英訳","彼女はとても疲れていたが、そのコンサートに行った。","Although she was very tired, she went to the concert.","Though she was very tired, she went to the concert. も可能。"),
 written(46,"3(2) 和文英訳","天気は悪かったが、私たちは旅を楽しんだ。[the weather, our trip]","Although the weather was bad, we enjoyed our trip.","Though the weather was bad, we enjoyed our trip. も可能。")
],
12:[
 short(50,"1(1) 現在分詞","a (　　) girl [dance]",["dancing"],"踊っている少女＝dancing girl。"),
 short(50,"1(2) 過去分詞","a (　　) glass [break]",["broken"],"割れたコップ＝broken glass。"),
 short(50,"1(3) 現在分詞","a (　　) baby [cry]",["crying"],"泣いている赤ちゃん＝crying baby。"),
 short(50,"1(4) 過去分詞","a (　　) egg [boil]",["boiled"],"ゆでた卵＝boiled egg。"),
 short(50,"1(5) 現在分詞","a dog (　　) on the sofa [sleep]",["sleeping"],"名詞の後ろから修飾する現在分詞。"),
 short(50,"1(6) 過去分詞","a house (　　) in 1962 [build]",["built"],"1962年に建てられた家。"),
 order(50,"2(1) 語順整序","その盗まれた宝石はとても高価だ。",["is","jewelry","expensive","very","stolen","the"],"The stolen jewelry is very expensive.","過去分詞 stolen が名詞 jewelry を修飾。"),
 order(50,"2(2) 語順整序","その巣を見ている鳥はカッコウだ。",["is","a cuckoo","bird","watching","the nest","the"],"The bird watching the nest is a cuckoo.","現在分詞 watching が後ろから bird を修飾。"),
 order(50,"2(3) 語順整序","彼女は夏目漱石が書いた本を読んだ。",["a book","she","by Natsume Soseki","written","read"],"She read a book written by Natsume Soseki.","written by Natsume Soseki が book を後置修飾。"),
 written(50,"3(1) 和文英訳","私はドイツ製のカメラを持っている。[a camera, Germany]","I have a camera made in Germany.","過去分詞 made が後ろから a camera を修飾。"),
 written(50,"3(2) 和文英訳","彼は有名な画家によって描かれた絵を買った。[a picture, a famous artist]","He bought a picture painted by a famous artist.","painted by ... は過去分詞による後置修飾。")
],
13:[
 short(54,"1(1) 主格関係代名詞","I have a friend (　　) (　　) in New York. [live の活用形]",["who lives","that lives"],"先行詞は人、主格 who/that + lives。"),
 short(54,"1(2) 主格関係代名詞","The building (　　) (　　) next to the library is the City Hall. [stand]",["which stands","that stands"],"先行詞は物、主格 which/that + stands。"),
 short(54,"1(3) 目的格関係代名詞","Do you know anyone (　　) (　　) French? [understand]",["who understands","that understands"],"この文脈では理解する人が主語のため主格 who/that。"),
 short(54,"1(4) 主格関係代名詞","Susan works for a company (　　) (　　) cars. [make]",["which makes","that makes"],"先行詞 company を主格関係代名詞で修飾。"),
 written(54,"2(1) 和訳","My aunt gave me the dress which she made.","叔母は、彼女が作ったドレスを私にくれた。","which she made が dress を修飾。"),
 written(54,"2(2) 和訳","The person who I respect is my teacher.","私が尊敬している人は私の先生です。","who I respect は person を修飾し、who は目的格。"),
 written(54,"2(3) 和訳","I saw the pictures he took in London.","私は彼がロンドンで撮った写真を見ました。","関係代名詞の省略を見抜く。"),
 written(54,"3(1) 和文英訳","こちらが、私たちが沖縄で会った女の子です。","This is the girl we met in Okinawa.","目的格の関係代名詞を省略した文。"),
 written(54,"3(2) 和文英訳","これらが、彼女が昨年書いた小説です。[the novels]","These are the novels she wrote last year.","the novels (that/which) she wrote last year。")
],
14:[
 short(58,"1(1) 比較級","This question is (　　) than that one. [easy]",["easier"],"easy → easier（y を i に変えて -er）。"),
 short(58,"1(2) 比較級","I think lilies are (　　) (　　) than roses. [beautiful]",["more beautiful"],"長い形容詞の比較級は more beautiful。"),
 short(58,"1(3) 最上級","She is (　　) (　　) tennis player among us. [good]",["the best"],"good の最上級は best。"),
 short(58,"1(4) 最上級","Soccer is (　　) (　　) (　　) (　　) popular sports in Japan.",["one of the most"],"one of the most popular sports。"),
 order(58,"2(1) 原級比較","私は彼と同じくらい速く泳ぐことができる。",["swim","can","as","as","I","him","fast"],"I can swim as fast as him.","as + 副詞 + as の原級比較。"),
 order(58,"2(2) 原級比較","私の腕時計は彼女のほど高価ではない。",["as","expensive","is","as","hers","not","my watch"],"My watch is not as expensive as hers.","not as + 形容詞 + as は「～ほど～でない」。"),
 written(58,"3(1a) 和文英訳","あなたのかばんは私のと同じくらい大きい。","Your bag is as big as mine.","as big as mine と表す。"),
 written(58,"3(1b) 和文英訳","あなたのかばんは私のほど大きくはない。","Your bag is not as big as mine.","not as big as mine と表す。"),
 written(58,"3(2a) 和文英訳","この本はあの本と同じくらい面白い。","This book is as interesting as that one.","as interesting as that one。"),
 written(58,"3(2b) 和文英訳","この本はあの本ほど面白くはない。","This book is not as interesting as that one.","not as interesting as that one。")
],
15:[
 order(62,"1(1) 形容詞句","赤いドレスを着た女性はメアリーだ。",["the woman","is","Mary","in","the red dress"],"The woman in the red dress is Mary.","前置詞句 in the red dress が woman を修飾。"),
 order(62,"1(2) 形容詞句","エミリーは茶色い目をした少女だ。",["Emily","is","a girl","with","brown eyes"],"Emily is a girl with brown eyes.","with brown eyes が名詞を修飾。"),
 order(62,"1(3) 形容詞節","私は昨年買ったコートを探している。",["I'm looking for","the coat","which","I","bought","last year"],"I'm looking for the coat which I bought last year.","which I bought last year は関係代名詞節。"),
 choice(62,"2(1) 副詞句・副詞節","Jim and I arrived at Haneda Airport. で『場所』を示す副詞句は？",["Jim and I","arrived","at Haneda Airport","Haneda"],2,"at Haneda Airport が副詞句。"),
 written(62,"2(1) 和訳","Jim and I arrived at Haneda Airport. を訳しましょう。","ジムと私は羽田空港に到着した。","at Haneda Airport は場所を表す副詞句。"),
 choice(62,"2(2) 副詞句・副詞節","He was cooking when I visited him. で『時』を示す副詞節は？",["He was cooking","when I visited him","was cooking","I visited"],1,"when I visited him は主語・動詞を含む副詞節。"),
 written(62,"2(2) 和訳","He was cooking when I visited him. を訳しましょう。","私が彼を訪ねたとき、彼は料理をしていた。","when + S + V が時を表す。"),
 written(62,"3(1) 和文英訳","彼女が電話してきたとき、私はバスに乗っていた。[on the bus]","I was on the bus when she called me.","When she called me, I was on the bus. もよい。"),
 written(62,"3(2) 和文英訳","彼がテレビを見ている間に、私は宿題を終えた。[while]","I finished my homework while he was watching TV.","while + S + V。")
]
};
