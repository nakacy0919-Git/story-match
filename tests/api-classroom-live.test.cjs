const test=require("node:test");
const assert=require("node:assert/strict");
const {createHandler,cleanSnapshot}=require("../api/classroom-live");

function fixture(){
  const files=new Map();
  const blob={
    async get(path){
      if(!files.has(path))return null;
      return {statusCode:200,stream:new Response(files.get(path)).body};
    },
    async put(path,data){files.set(path,data);return {pathname:path,url:"https://example.invalid/"+path};},
    async list({prefix}){
      const blobs=[...files.keys()].filter(path=>path.startsWith(prefix)).map(path=>({pathname:path,url:path}));
      return {blobs,hasMore:false,cursor:undefined};
    },
    async del(paths){for(const path of (Array.isArray(paths)?paths:[paths]))files.delete(path);}
  };
  const handler=createHandler({getBlob:async()=>blob});
  async function post(body){
    const headers={},res={
      statusCode:200,
      setHeader(key,value){headers[key]=value;},
      status(code){this.statusCode=code;return this;},
      json(data){this.body=data;return this;}
    };
    await handler({method:"POST",headers:{},body},res);
    return {status:res.statusCode,...res.body,headers};
  }
  return {post,files};
}
const student=(number,name)=>({class:"3-6",number:String(number),name});
const units={
  11:{metrics:{reading:88,compEn:65,compJa:100,vocabE:100,storyRead:75},
      workbook:{workbookReading:70}},
  12:{metrics:{reading:70,vocabJ:95},workbook:{workbookGrammar:40}},
};
test("progress payload is constrained to Units 11 and 12 and 12 valid numeric metrics",()=>{
  const result=cleanSnapshot({units:{"11":{metrics:{reading:200,compEn:-5,shadow:"bad"},workbook:{workbookReading:999}},"99":{}}});
  assert.deepEqual(Object.keys(result),["11","12"]);
  assert.equal(result["11"].metrics.reading,100);
  assert.equal(result["11"].metrics.compEn,0);
  assert.equal(result["11"].workbook.workbookReading,100);
  assert.equal(Object.keys(result["11"].metrics).length,12);
});
test("create is admin only, observer is read only, names masked, join is controlled and close revokes",async()=>{
  const oldAdmin=process.env.STORY_MATCH_ADMIN_PASSWORD;
  const oldEnv=process.env.VERCEL_ENV;
  const oldBranch=process.env.VERCEL_GIT_COMMIT_REF;
  process.env.STORY_MATCH_ADMIN_PASSWORD="24681";
  process.env.VERCEL_ENV="preview";
  process.env.VERCEL_GIT_COMMIT_REF="feature-observer-testing";
  try{
    const {post,files}=fixture();
    const denied=await post({action:"create",password:"no"});
    assert.equal(denied.status,401);
    const created=await post({action:"create",password:"24681",title:"授業テスト",expected:26});
    assert.equal(created.status,200);
    assert.equal(created.session.expected,26);
    assert.equal(created.session.units.join(","),"11,12");
    assert.ok(created.session.observerToken.length>=24);
    const second=await post({action:"create",password:"24681"});
    assert.equal(second.status,409);
    const deniedRead=await post({action:"snapshot",token:"guessed"});
    assert.equal(deniedRead.status,403);
    const badJoin=await post({action:"join",code:"123456789012",student:student(1,"Test"),units});
    assert.equal(badJoin.status,403);
    assert.equal(files.size,1);
    const goodJoin=await post({action:"join",code:created.session.joinCode,student:student(2,"Sample B"),units,activityAt:new Date().toISOString()});
    assert.equal(goodJoin.status,200);
    await post({action:"join",code:created.session.joinCode,student:student(1,"Sample A"),units});
    const viewer=await post({action:"snapshot",token:created.session.observerToken});
    assert.equal(viewer.status,200);
    assert.equal(viewer.students.length,2);
    assert.deepEqual(viewer.students.map(s=>s.student.number),["1","2"]);
    assert.ok(viewer.students.every(s=>!Object.hasOwn(s.student,"name")));
    assert.equal(viewer.students[0].units["11"].metrics.reading,88);
    assert.equal(viewer.students[0].units["12"].metrics.vocabJ,95);
    const noEdit=await post({action:"visibility",showNames:true,password:"wrong"});
    assert.equal(noEdit.status,401);
    const enabled=await post({action:"visibility",showNames:true,password:"24681"});
    assert.equal(enabled.session.showNames,true);
    const named=await post({action:"snapshot",token:created.session.observerToken});
    assert.equal(named.students[0].student.name,"Sample A");
    const closed=await post({action:"close",password:"24681"});
    assert.equal(closed.status,200);
    const revoked=await post({action:"snapshot",token:created.session.observerToken});
    assert.equal(revoked.status,410);
    assert.equal(files.size,1,"closing the lesson removes student records from the private store");
  }finally {
    if(oldAdmin===undefined)delete process.env.STORY_MATCH_ADMIN_PASSWORD;else process.env.STORY_MATCH_ADMIN_PASSWORD=oldAdmin;
    if(oldEnv===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=oldEnv;
    if(oldBranch===undefined)delete process.env.VERCEL_GIT_COMMIT_REF;else process.env.VERCEL_GIT_COMMIT_REF=oldBranch;
  }
});
