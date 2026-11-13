import React,{useCallback,useEffect,useMemo,useRef,useState} from "react";
import { classroomRequest, LIVE_JOIN_STORAGE, LIVE_METRICS, LIVE_PROGRESS_EVENT, parseJoinCode, parseObserverToken, readLocalLiveRecord } from "../utils/liveClassroom";
import { STUDY_CHANGED } from "../utils/studyProgress";
import "../ClassroomLive.css";

const showTime=value=>{
  if(!value)return "—";
  const t=Date.parse(value);
  return Number.isFinite(t)?new Date(t).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit",second:"2-digit"}):"—";
};
const score=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
const mean=n=>n.length?Math.round(n.reduce((s,x)=>s+x,0)/n.length):0;
const averageStudent=s=>mean([s.units?.["11"]?.overall||0,s.units?.["12"]?.overall||0]);
const linkFor=(type,secret)=>window.location.origin+window.location.pathname+"#/"+type+"?"+(type==="observe"?"token":"code")+"="+encodeURIComponent(secret);
function QrCard({url,title,description}){
  const target=useRef(null);
  const [error,setError]=useState("");
  useEffect(()=>{
    let mounted=true;
    const render=()=>{
      if(!mounted||!target.current||!window.QRCode)return;
      try{
        target.current.textContent="";
        new window.QRCode(target.current,{text:url,width:184,height:184,
          colorDark:"#16395c",colorLight:"#ffffff",correctLevel:window.QRCode.CorrectLevel.M});
        setError("");
      }catch(_){setError("QRを作成できません。下のリンクを共有してください。");}
    };
    if(!url)return undefined;
    if(window.QRCode){render();return()=>{mounted=false;};}
    let script=document.querySelector('script[data-classroom-qr="true"]');
    if(!script){
      script=document.createElement("script");script.src="/vendor/qrcode.min.js";
      script.async=true;script.dataset.classroomQr="true";document.head.appendChild(script);
    }
    script.addEventListener("load",render);
    script.addEventListener("error",()=>setError("QR読み込みに失敗しました。"));
    return()=>{mounted=false;script.removeEventListener("load",render);};
  },[url]);
  return <div className="th-live-qr-card">
    <h3>{title}</h3>
    <p>{description}</p>
    <div className="th-live-qr-frame" ref={target} aria-label={title+"のQRコード"}/>
    {error&&<small role="alert">{error}</small>}
    <button type="button" className="th-live-btn" onClick={()=>navigator.clipboard?.writeText(url)}>リンクをコピー</button>
    <input type="text" value={url} readOnly aria-label={title+"のリンク"} onFocus={e=>e.target.select()}/>
  </div>;
}

export function ClassroomJoinSync(){
  const [code,setCode]=useState(()=>parseJoinCode(window.location.hash)||localStorage.getItem(LIVE_JOIN_STORAGE)||"");
  const [draftCode,setDraftCode]=useState(()=>parseJoinCode(window.location.hash)||localStorage.getItem(LIVE_JOIN_STORAGE)||"");
  const [open,setOpen]=useState(()=>!!parseJoinCode(window.location.hash));
  const [status,setStatus]=useState("");
  const [connected,setConnected]=useState(false);
  const busy=useRef(false);
  const sync=useCallback(async()=>{
    if(!code||busy.current)return;
    const record=readLocalLiveRecord();
    if(!record){setStatus("Learning Progressでクラス・番号・氏名を登録すると自動で同期されます。");return;}
    busy.current=true;
    try{
      await classroomRequest({action:"join",code:code.trim().toUpperCase(),...record});
      setConnected(true);setStatus("授業進捗を共有中 · 自動更新");
    }catch(e){
      setConnected(false);setStatus(e.message);
      if(e.status===410){localStorage.removeItem(LIVE_JOIN_STORAGE);setCode("");}
    }finally{busy.current=false;}
  },[code]);
  useEffect(()=>{
    if(!code)return undefined;
    sync();
    const events=[STUDY_CHANGED,LIVE_PROGRESS_EVENT,"treasure-student-changed","visibilitychange"];
    let timer;
    const onChange=()=>{clearTimeout(timer);timer=setTimeout(sync,850);};
    for(const event of events)window.addEventListener(event,onChange);
    const interval=window.setInterval(sync,45000);
    return()=>{
      clearTimeout(timer);clearInterval(interval);
      for(const event of events)window.removeEventListener(event,onChange);
    };
  },[code,sync]);
  useEffect(()=>{
    const onHash=()=>{
      const next=parseJoinCode(window.location.hash);
      if(next){setCode(next);setDraftCode(next);setOpen(true);localStorage.setItem(LIVE_JOIN_STORAGE,next);}
    };
    window.addEventListener("hashchange",onHash);return()=>window.removeEventListener("hashchange",onHash);
  },[]);
  const join=event=>{
    event.preventDefault();
    const normalized=draftCode.trim().toUpperCase();
    if(!/^[A-F0-9]{12}$/.test(normalized)){setStatus("12桁の授業参加コードを入力してください。");return;}
    localStorage.setItem(LIVE_JOIN_STORAGE,normalized);
    setCode(normalized);setOpen(false);setStatus("授業の参加情報を確認しています。");
    sync();
  };
  const leave=()=>{localStorage.removeItem(LIVE_JOIN_STORAGE);setCode("");setDraftCode("");setConnected(false);setStatus("");setOpen(false);};
  return <div className={"th-live-join "+(connected?"is-connected":"")}>
    <div className="th-live-join-line">
      <span aria-hidden="true">{connected?"🟢":"📡"}</span>
      <strong>{connected?"ライブ授業：進捗共有中":"授業観察ライブ"}</strong>
      {connected?<small>Unit 11・12を約45秒ごと＋学習時に同期</small>:null}
      <button type="button" onClick={()=>setOpen(v=>!v)}>{open?"閉じる":connected?"参加情報":"授業コードで参加"}</button>
    </div>
    {open&&<form onSubmit={join} className="th-live-join-form">
      <label>授業参加コード（生徒用）
        <input value={draftCode} onChange={e=>setDraftCode(e.target.value.toUpperCase())} maxLength={12}
          autoCapitalize="characters" autoComplete="off" aria-label="授業参加コード"/>
      </label>
      <button type="submit" className="th-live-btn">進捗共有を開始</button>
      {code&&<button type="button" onClick={leave}>参加解除</button>}
    </form>}
    {status&&<p className="th-live-status" role="status">{status}</p>}
  </div>;
}

function StatusMeter({value}) {
 const v=score(value);
 return <div className="th-live-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
    <div className="th-live-meter-track"><div style={{width:v+"%"}}/></div><b>{v}%</b>
  </div>;
}
export function ObserverDashboard({token:propToken,embedded=false}){
  const token=propToken||parseObserverToken(window.location.hash);
  const [result,setResult]=useState(null),[error,setError]=useState("");
  const [filter,setFilter]=useState("all"),[sort,setSort]=useState("slow"),[unit,setUnit]=useState("both");
  const [lastFetch,setLastFetch]=useState("");
  const refresh=useCallback(async()=>{
    if(!token)return;
    try{
      const res=await classroomRequest({action:"snapshot",token});
      setResult(res);setError("");setLastFetch(new Date().toISOString());
    }catch(e){setError(e.message);}
  },[token]);
  useEffect(()=>{
    refresh();
    const interval=setInterval(refresh,15000);
    return()=>clearInterval(interval);
  },[refresh]);
  const students=useMemo(()=>result?.students||[],[result]);
  const getPercent=useCallback(row=>unit==="both"?averageStudent(row):score(row.units?.[unit]?.overall),[unit]);
  const classAverage=mean(students.map(getPercent));
  const ranked=useMemo(()=>{
    return students.filter(row=>{
      if(filter==="all")return true;
      const v=getPercent(row);
      if(filter==="support")return v<classAverage-15;
      if(filter==="ahead")return v>classAverage+15;
      if(filter==="online")return Date.now()-Date.parse(row.seenAt)<90000;
      return true;
    }).sort((a,b)=>sort==="slow"?getPercent(a)-getPercent(b):sort==="ahead"?getPercent(b)-getPercent(a):
      a.student.class.localeCompare(b.student.class,"ja")||a.student.number.localeCompare(b.student.number,"ja",{numeric:true}));
  },[students,filter,sort,getPercent,classAverage]);
  const online=students.filter(s=>Date.now()-Date.parse(s.seenAt)<90000).length;
  const needHelp=students.filter(s=>getPercent(s)<classAverage-15).length;
  return <main className={"th-live-observer "+(embedded?"is-embedded":"")}>
    <header className="th-live-header">
      <div><small>TREASURE HUNT · LIVE CLASSROOM</small><h1>公開授業｜学習進捗ダッシュボード</h1>
        <p>Unit 11・12 / 生徒別ラーニングプログレス · 約15秒ごとに更新</p></div>
      <div className="th-live-refresh"><span>{lastFetch?"最終更新 "+showTime(lastFetch):"接続中…"}</span>
        <button type="button" onClick={refresh}>↻ 更新</button></div>
    </header>
    {error&&<div className="th-live-error" role="alert">{error}</div>}
    {result&&<><div className="th-live-summary">
      <div><small>登録済み / 予定</small><strong>{students.length}<span> / {result.session.expected}名</span></strong></div>
      <div><small>直近90秒に接続</small><strong>{online}<span>名</span></strong></div>
      <div><small>クラス平均進捗</small><strong>{classAverage}<span>%</span></strong></div>
      <div><small>平均より15pt以上遅れ</small><strong>{needHelp}<span>名</span></strong></div>
    </div>
    <div className="th-live-toolbar">
      <label>表示するUnit<select value={unit} onChange={e=>setUnit(e.target.value)}>
        <option value="both">Unit 11 ＋ 12</option><option value="11">Unit 11</option><option value="12">Unit 12</option>
      </select></label>
      <label>絞り込み<select value={filter} onChange={e=>setFilter(e.target.value)}>
        <option value="all">全員</option><option value="support">フォローが必要</option>
        <option value="ahead">進んでいる生徒</option><option value="online">オンライン</option>
      </select></label>
      <label>並び順<select value={sort} onChange={e=>setSort(e.target.value)}>
        <option value="slow">進捗が遅い順</option><option value="ahead">進捗が進んだ順</option><option value="number">出席番号順</option>
      </select></label>
    </div>
    {!students.length?<div className="th-live-empty">まだ進捗が届いていません。生徒が「授業参加コード」で参加すると一覧に表示されます。</div>:
      <div className="th-live-table-wrap"><table className="th-live-table">
        <thead><tr><th>生徒</th><th>接続</th><th>Unit 11</th><th>Unit 12</th><th>平均</th><th>学習状況</th></tr></thead>
        <tbody>{ranked.map(row=>{
          const avg=getPercent(row),support=avg<classAverage-15,ahead=avg>classAverage+15;
          const connected=Date.now()-Date.parse(row.seenAt)<90000;
          return <tr key={row.student.class+":"+row.student.number}>
            <td><strong>{row.student.class} · {row.student.number}番</strong>
              {row.student.name&&<small>{row.student.name}</small>}
              <details className="th-live-detail"><summary>11項目を詳しく見る</summary>
                {[11,12].map(n=><div key={n} className="th-live-detail-unit"><b>UNIT {n}</b>
                  {LIVE_METRICS.map(([key,label])=><div key={key} className="th-live-detail-line">
                    <span>{label}</span><StatusMeter value={row.units?.[String(n)]?.metrics?.[key]}/></div>)}
                  <p>問題集（読解/文法/総合）：
                    {["workbookReading","workbookGrammar","workbookVarious"].map(k=>score(row.units?.[String(n)]?.workbook?.[k])+"%").join(" / ")}
                  </p>
                </div>)}
              </details>
            </td>
            <td><span className={connected?"th-live-online":"th-live-offline"}>{connected?"● 同期中":"○ 未接続"}</span>
              <small>{showTime(row.seenAt)}</small></td>
            <td><StatusMeter value={row.units?.["11"]?.overall}/></td>
            <td><StatusMeter value={row.units?.["12"]?.overall}/></td>
            <td><strong>{avg}%</strong></td>
            <td><span className={"th-live-tag "+(support?"needs-help":ahead?"ahead":"normal")}>
              {support?"フォロー候補":ahead?"先行":"平均付近"}</span></td>
          </tr>;
        })}</tbody>
      </table></div>}
    <footer className="th-live-footer">
      <p>進捗は登録済みの生徒端末から送られます。未参加の生徒は表示されません。「フォロー候補」はクラス平均との差による目安で、能力や成績の評価ではありません。</p>
      <p>授業終了後は教師画面から公開を終了してください。QRコード・リンクの再配布は控えてください。</p>
    </footer></>}
    {!embedded&&<button type="button" className="th-live-home" onClick={()=>window.location.hash="#/"}>← 学習画面へ</button>}
  </main>;
}

export function TeacherLiveDashboard(){
  const [password,setPassword]=useState("");
  const [session,setSession]=useState(null);
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  const [title,setTitle]=useState("Treasure Hunt 公開授業");
  const [expected,setExpected]=useState(26);
  const logged=!!session;
  const call=async(action,options={})=>{
    setBusy(true);setStatus("");
    try{
      const result=await classroomRequest({action,password,...options});
      if(action==="close"){setSession(null);setStatus("授業を終了しました。閲覧QRと参加コードは無効になりました。");}
      else if(result.session?.status==="active"){setSession(result.session);setStatus(action==="create"?"授業を作成しました。生徒用の参加リンクも配布してください。":"");}
      else{setSession(null);setStatus("開催中の授業はありません。新しい授業を作成できます。");}
    }catch(e){setStatus(e.message);}finally{setBusy(false);}
  };
  const observationLink=session?.observerToken?linkFor("observe",session.observerToken):"";
  const studentLink=session?.joinCode?linkFor("join",session.joinCode):"";
  return <main className="th-live-teacher">
    <header className="th-live-header">
      <div><small>TREASURE HUNT · TEACHER</small><h1>授業観察ライブ｜管理画面</h1>
        <p>Unit 11・12の学習進捗を、招待した先生方へ閲覧専用で共有します。</p></div>
      <button type="button" onClick={()=>window.location.hash="#/"}>← 学習画面へ</button>
    </header>
    <section className="th-live-teacher-card">
      <h2>1. 教師の認証</h2>
      <div className="th-live-login">
        <label>管理者パスワード
          <input type="password" autoComplete="current-password" value={password}
            onChange={e=>setPassword(e.target.value)} placeholder="管理者パスワード"/>
        </label>
        <button className="th-live-btn" type="button" disabled={busy||!password} onClick={()=>call("admin")}>
          開催中の授業を確認</button>
      </div>
      {status&&<p role="status" className="th-live-status">{status}</p>}
    </section>
    {!logged&&<section className="th-live-teacher-card">
      <h2>2. 公開授業を開始</h2>
      <div className="th-live-login">
        <label>授業名<input value={title} maxLength={80} onChange={e=>setTitle(e.target.value)}/></label>
        <label>予定生徒数<input type="number" min="1" max="80" value={expected} onChange={e=>setExpected(e.target.value)}/></label>
        <button className="th-live-btn" type="button" disabled={busy||!password} onClick={()=>call("create",{title,expected:Number(expected)})}>
          新しい公開授業を作成</button>
      </div>
      <p className="th-live-footnote">共有は開始から12時間、または教師が終了するまで有効です。閲覧者は学習記録を変更できません。</p>
    </section>}
    {logged&&<section className="th-live-teacher-card">
      <h2>2. 見学者と生徒へQRコードを共有</h2>
      <p>生徒と見学者でQRコードが異なります。見学者は閲覧専用、生徒は自分の端末の進捗を共有します。</p>
      <div className="th-live-qr-grid">
        <QrCard title="見学の先生用 QR" description="閲覧専用。授業進捗一覧を15秒間隔で確認。" url={observationLink}/>
        <QrCard title="生徒用 QR" description="授業参加用。Learning Progressで名前を登録後、自動で同期。" url={studentLink}/>
      </div>
      <p className="th-live-code">生徒用参加コード：<strong>{session.joinCode}</strong></p>
      <label className="th-live-checkbox"><input type="checkbox" checked={!!session.showNames}
         onChange={e=>call("visibility",{showNames:e.target.checked})} disabled={busy}/>
         閲覧者に生徒の氏名も表示する（通常はクラス・番号のみ）</label>
      <p>有効期限：{new Date(session.expiresAt).toLocaleString("ja-JP")}</p>
      <button type="button" className="th-live-danger" disabled={busy} onClick={()=>{
        if(window.confirm("公開授業を終了し、QRコードを無効にしますか？"))call("close");
      }}>この授業の共有を終了</button>
      <h2>3. 見学者の画面</h2>
      {observationLink&&<ObserverDashboard token={session.observerToken} embedded/>}
    </section>}
  </main>;
}
