import { choice, short, written } from "./workbookReading";
// Various Questions is kept separate from both Reading and Grammar & Writing.
// Listening problems need original audio; only documented stems are shown as pending.
export const workbookVarious={
10:[
 choice(43,"Vocabulary 1","“Red sky at night, shepherd's delight.” This is an old proverb. 下線部 proverb の意味は？",["気候","占い","ことわざ","願望"],2,"proverb＝ことわざ。"),
 choice(43,"Vocabulary 2","I am a crow. My family lived in the forest. 下線部 crow の意味は？",["キツネ","タヌキ","カモメ","カラス"],3,"crow＝カラス。")
],
11:[
 choice(47,"Main Topic 1","Chitose の漢字には『千年』の意味があり、名前に親の願いが込められているという文章の主題は？",["What our names mean","Chitose's favorite name","Good names and bad names","Names of Japanese and people overseas"],0,"親が込める名前の意味・願いについて書かれている。"),
 choice(47,"Main Topic 2","米国の25セント硬貨には州ごとに異なるデザインがある。主題として最適なものは？",["The history of 25 cent coins","The designs of 25 cent coins","The use of 25 cent coins","Differences between New York and Hawaii coins only"],1,"硬貨表面の州ごとのデザインの説明。")
],
12:[
 choice(51,"Personal Concerns 1","Nancy found a little dog, but her parents may say no to keeping it. What does she want advice about?",["How to give milk to a dog","How to play with dogs in a park","How to convince her parents to keep the dog","How to make up with her parents"],2,"Nancyは犬を飼うことを両親に認めてもらう方法を相談している。"),
 choice(51,"Personal Concerns 2","Lily and Joe have been friends for a long time, but Joe now avoids her at school. What is Lily's main problem?",["Joe cannot come to school","Lily argued with Joe yesterday","She does not understand why Joe avoids her","They no longer attend the same school"],2,"LilyはJoeが突然自分を避ける理由が分からない。")
],
13:[
 choice(55,"Information 1","East High School Volunteer Club の案内で募集している活動は？",["歌を録音する","East Townの清掃","老人ホーム訪問と犬の散歩","大学の世話をする"],2,"高齢者施設で話をしたり、犬と散歩したりする活動。"),
 short(55,"Information 2","広告で次回の活動日はMay (　　) と示されている。数字で入力。",["15"],"Our next visit is ... Sunday, May 15th."),
 written(55,"Information 3","ボランティアに参加したい人は、どのように応募すればよいですか？","案内に掲載された担当者Mark Smithへメールを送る。","広告の連絡方法はE-mail。")
],
14:[
 choice(59,"Review 1：Fact","学習アプリWordBoostに関して、レビューで確認できる『事実』として最も適切なのは？",["The app covers over 1,000 English words.","The app is only useful for beginners.","The app should include more easy words.","There are no pictures in the app."],0,"1,000語以上の練習ができるという機能についての具体的情報。"),
 choice(59,"Review 2：Opinion","WordBoostのレビューに書かれている『意見』として最も適切なのは？",["Each unit is followed by a review quiz.","Soyoon has not used the app yet.","The app is helpful for beginners.","It always takes a long time to download."],2,"アプリが初心者に役立つという主観的評価。")
],
15:[
 choice(63,"Proverbs 1","Actions speak louder than words. の意味として最も近いものは？",["Talking a lot makes you smarter.","What you do is more important than what you say.","You should listen carefully to others.","Words are more powerful than actions."],1,"行動は言葉より雄弁である。"),
 choice(63,"Proverbs 2","Better late than never. の意味として最も近いものは？",["It's always better to be early.","It's OK to give up if you're late.","It's better to do something late than not at all.","Time is money."],2,"遅くなってもやらないよりよい。"),
 choice(63,"Proverbs 3","You can't judge a book by its cover. の意味として最も近いものは？",["Always buy the newest books.","You need to read quickly.","People should not read in public.","The outside is not always the same as the inside."],3,"見た目だけでは中身はわからない。"),
 choice(63,"Proverbs 4","Practice makes perfect. の意味として最も近いものは？",["If you study a little, that's good enough.","You should rest more than practice.","You will improve if you practice many times.","You do not need to try hard if you are talented."],2,"練習を重ねれば上達する。")
]
};
export const workbookListeningPending={
 10:{page:43,title:"Information",details:["How many people are there in the picture?","How many people are there in the living room?"],reason:"人数を答えるための録音音声が未提供"},
 11:{page:47,title:"News",details:["スペインとアルゼンチンの試合日時・場所・チケット情報のメモ補充"],reason:"サッカーニュースの音源が未提供"},
 12:{page:51,title:"Graph",details:["棒グラフのA・B・Cが表す食べ物の聞き取り"],reason:"グラフ用の録音音声が未提供"},
 13:{page:55,title:"Announcement",details:["学園祭の英語スピーチコンテストとロックコンサートの案内"],reason:"学園祭アナウンス音源が未提供"},
 14:{page:59,title:"News",details:["The Battle of the Oranges の場所・時期・祭りの内容のメモ補充"],reason:"ニュース原音源が未提供"},
 15:{page:63,title:"Announcement",details:["迷子案内のイラスト・階数選択","クリスマスキャンペーンの条件と日数"],reason:"原音源が未提供で、イラスト選択の正答も確定できない"}
};
