// Private, time-limited classroom observation API.
// Never expose BLOB_READ_WRITE_TOKEN or student records directly to the browser.
const { randomBytes, createHash, timingSafeEqual } = require("node:crypto");
const PATH = "treasure-live/v1/";
const METRIC_KEYS = ["reading","compEn","compJa","shadow","listen","vocabE","vocabJ","grammar","storyRead","puzzle","random","storyListen"];
const WORKBOOK_KEYS = ["workbookReading","workbookGrammar","workbookVarious"];
const attempts = new Map();
const snapshotCache = new Map();
const safeText = (value, max = 60) =>
  typeof value === "string" ? value.normalize("NFKC").trim().slice(0, max) : "";
const equalSecret = (a,b) => {
  if(typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const x=createHash("sha256").update(a).digest();
  const y=createHash("sha256").update(b).digest();
  return timingSafeEqual(x,y);
};
const safeScore = value => Number.isFinite(value) ? Math.max(0,Math.min(100,Math.round(value))) : 0;
const envPrefix = () => {
  const env=process.env.VERCEL_ENV==="production"?"production":"preview";
  const branch=env==="preview"?safeText(process.env.VERCEL_GIT_COMMIT_REF || "local",70).replace(/[^a-zA-Z0-9_-]/g,"-"):"main";
  return PATH+env+"/"+branch+"/";
};
const sessionPath = () => envPrefix()+"active.json";
const studentPrefix = session => envPrefix()+"sessions/"+session.id+"/students/";
const active = session => !!(session && session.status==="active" && Date.parse(session.expiresAt)>Date.now());
function adminAllowed(req, password){
  const actual=process.env.STORY_MATCH_ADMIN_PASSWORD;
  if(!actual) return {ok:false,code:503,error:"管理者パスワードが設定されていません。"};
  const ip=safeText(String(req.headers["x-forwarded-for"]||req.headers["x-real-ip"]||"unknown").split(",")[0],80);
  let count=attempts.get(ip);
  if(!count || count.until<Date.now())count={n:0,until:Date.now()+60000};
  if(count.n>=12)return {ok:false,code:429,error:"認証試行が多すぎます。少し経ってからお試しください。"};
  if(equalSecret(safeText(password,200),actual.normalize("NFKC").trim())) {attempts.delete(ip);return {ok:true};}
  attempts.set(ip,{n:count.n+1,until:count.until});
  if(attempts.size>2000)attempts.clear();
  return {ok:false,code:401,error:"管理者パスワードが違います。"};
}
function validateStudent(input){
  const classroom=safeText(input?.class,50);
  const number=safeText(String(input?.number??""),20);
  const name=safeText(input?.name,70);
  if(!classroom||!number||!name||!/^[-\w一-龯ぁ-んァ-ヶー 　]+$/u.test(classroom+number))return null;
  return {class:classroom,number,name};
}
function cleanSnapshot(body){
  const units={};
  for(const unit of ["11","12"]){
    const raw=body?.units?.[unit]||{};
    const metrics={};
    for(const key of METRIC_KEYS)metrics[key]=safeScore(raw.metrics?.[key]);
    const workbook={};
    for(const key of WORKBOOK_KEYS)workbook[key]=safeScore(raw.workbook?.[key]);
    const overall=Math.round(METRIC_KEYS.reduce((n,k)=>n+metrics[k],0)/METRIC_KEYS.length);
    units[unit]={metrics,workbook,overall,complete:METRIC_KEYS.filter(k=>metrics[k]>=100).length};
  }
  return units;
}
async function readJson(blob, path){
  const file=await blob.get(path,{access:"private",useCache:false});
  if(!file) return null;
  if(file.statusCode!==200 || !file.stream)throw Error("Unable to read stored data.");
  return new Response(file.stream).json();
}
async function writeJson(blob,path,obj){
  await blob.put(path,JSON.stringify(obj),{access:"private",contentType:"application/json",
    addRandomSuffix:false,allowOverwrite:true,cacheControlMaxAge:60});
}
async function studentRows(blob, session){
  const path=studentPrefix(session);
  let cursor, rows=[];
  do {
    const page=await blob.list({prefix:path,limit:1000,...(cursor?{cursor}:{})});
    const objects=page.blobs||[];
    for(let n=0;n<objects.length;n+=12){
      const values=await Promise.all(objects.slice(n,n+12).map(async(item)=>{
        try{return await readJson(blob,item.pathname);}
        catch(_){return null;} // A partial upload must not break the lesson view.
      }));
      rows.push(...values.filter(value=>value?.sessionId===session.id && value.student));
    }
    cursor=page.hasMore?page.cursor:null;
  }while(cursor && rows.length<1000);
  return rows.sort((a,b)=>a.student.class.localeCompare(b.student.class,"ja")||
    a.student.number.localeCompare(b.student.number,"ja",{numeric:true}));
}
async function discardOldSession(blob,session){
  if(!session?.id)return;
  const prefix=studentPrefix(session);
  let cursor;
  do{
    const page=await blob.list({prefix,limit:1000,...(cursor?{cursor}:{})});
    const paths=(page.blobs||[]).map(x=>x.url||x.pathname).filter(Boolean);
    if(paths.length)await blob.del(paths);
    cursor=page.hasMore?page.cursor:null;
  }while(cursor);
}
function projectRow(item,{showNames=false}={}){
  return {student:{class:item.student.class,number:item.student.number,...(showNames?{name:item.student.name}:{})},
    units:item.units,seenAt:item.seenAt,activityAt:item.activityAt};
}
async function cachedSnapshot(blob,session,showNames){
  const key=session.id+":"+Boolean(showNames);
  const cached=snapshotCache.get(key);
  if(cached && cached.expires>Date.now())return cached.value;
  const value=await snapshot(blob,session,showNames);
  snapshotCache.set(key,{value,expires:Date.now()+8000});
  if(snapshotCache.size>20)snapshotCache.clear();
  return value;
}
async function snapshot(blob, session, showNames){
  const rows=await studentRows(blob,session);
  return {session:{id:session.id,title:session.title,createdAt:session.createdAt,expiresAt:session.expiresAt,
      expected:session.expected,status:session.status,units:session.units,showNames:!!session.showNames},
    students:rows.map(row=>projectRow(row,{showNames})),polledAt:new Date().toISOString()};
}
function createHandler({getBlob = () => import("@vercel/blob")}={}) {
  return async (req,res) => {
    res.setHeader("Cache-Control","private, no-store");
    res.setHeader("X-Content-Type-Options","nosniff");
    if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"POSTのみ受け付けます。"});}
    const length=Number(req.headers["content-length"]||0);
    if(length>25000)return res.status(413).json({error:"送信内容が大きすぎます。"});
    let body=req.body;
    if(typeof body==="string"){if(body.length>25000)return res.status(413).json({error:"送信内容が大きすぎます。"});
      try{body=JSON.parse(body);}catch(_){return res.status(400).json({error:"JSON形式が不正です。"});}}
    if(!body||typeof body!=="object"||Array.isArray(body))return res.status(400).json({error:"リクエスト形式が不正です。"});
    const action=body.action;
    const needsAdmin=["create","admin","close","visibility"].includes(action);
    if(needsAdmin){
      const auth=adminAllowed(req,body.password);
      if(!auth.ok)return res.status(auth.code).json({error:auth.error});
    }
    if(!["create","admin","close","visibility","join","snapshot"].includes(action))
      return res.status(400).json({error:"操作が不正です。"});
    try {
      const blob=await getBlob();
      let session=await readJson(blob,sessionPath());
      if(action==="create"){
        if(active(session))return res.status(409).json({error:"開催中の授業があります。先に終了してください。"});
        // Remove previous lesson records before starting a fresh observation window.
        if(session)await discardOldSession(blob,session);
        const expected=Math.max(1,Math.min(80,Math.floor(Number(body.expected)||26)));
        session={id:randomBytes(12).toString("hex"),title:safeText(body.title,80)||"Treasure Hunt 公開授業",
          units:[11,12],expected,status:"active",showNames:false,
          observerToken:randomBytes(24).toString("base64url"),
          joinCode:randomBytes(6).toString("hex").toUpperCase(),
          createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+12*60*60*1000).toISOString()};
        await writeJson(blob,sessionPath(),session);
        snapshotCache.clear();
        return res.status(200).json({session});
      }
      if(!session)return res.status(404).json({error:"公開授業はまだ作成されていません。"});
      if(!active(session) && action!=="admin" && action!=="close")
        return res.status(410).json({error:"授業の共有は終了しました。"});
      if(action==="admin"){
        return res.status(200).json({session});
      }
      if(action==="close"){
        session={...session,status:"closed",observerToken:"",joinCode:""};
        await writeJson(blob,sessionPath(),session);
        snapshotCache.clear();
        try{await discardOldSession(blob,session);}catch(_){/* Session is revoked even if cleanup needs retry. */}
        return res.status(200).json({ok:true});
      }
      if(action==="visibility"){
        session={...session,showNames:body.showNames===true};
        await writeJson(blob,sessionPath(),session);
        return res.status(200).json({session});
      }
      if(action==="join"){
        if(!equalSecret(safeText(body.code,50),session.joinCode))
          return res.status(403).json({error:"授業参加コードが違います。"});
        const student=validateStudent(body.student);
        if(!student)return res.status(400).json({error:"生徒のクラス・番号・氏名を登録してください。"});
        const units=cleanSnapshot(body);
        const activityCandidate=Date.parse(body.activityAt);
        const now=Date.now();
        const activityAt=Number.isFinite(activityCandidate)&&activityCandidate<=now&&activityCandidate>now-30*86400000
          ?new Date(activityCandidate).toISOString():null;
        const key=createHash("sha256").update(JSON.stringify([student.class,student.number])).digest("hex");
        await writeJson(blob,studentPrefix(session)+key+".json",{sessionId:session.id,student,
          units,seenAt:new Date().toISOString(),activityAt});
        snapshotCache.clear();
        return res.status(200).json({ok:true,sessionId:session.id,expiresAt:session.expiresAt});
      }
      if(action==="snapshot"){
        const observer=equalSecret(safeText(body.token,160),session.observerToken);
        if(!observer)return res.status(403).json({error:"この授業の閲覧権限がありません。"});
        const result=await cachedSnapshot(blob,session,session.showNames);
        return res.status(200).json(result);
      }
    }catch(error){
      return res.status(503).json({error:"進捗共有サービスに接続できませんでした。時間をおいて再試行してください。"});
    }
  };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
module.exports.cleanSnapshot=cleanSnapshot;
module.exports.validateStudent=validateStudent;
module.exports.METRIC_KEYS=METRIC_KEYS;
