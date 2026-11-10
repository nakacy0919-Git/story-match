describe("shared iPad-friendly quiz effects",()=>{
 let instances,oscillators,frequencyValues,gainValues,context;
 beforeEach(()=>{
  jest.resetModules();
  instances=0;oscillators=[];frequencyValues=[];gainValues=[];
  context={
   state:"running",currentTime:1,destination:{},
   resume:jest.fn(()=>Promise.resolve()),
   createOscillator:jest.fn(()=>{
     const oscillator={type:"",
       frequency:{setValueAtTime:jest.fn(freq=>frequencyValues.push(freq))},
       connect:jest.fn(),start:jest.fn(),stop:jest.fn()};
     oscillators.push(oscillator);return oscillator;
   }),
   createGain:jest.fn(()=>({
     gain:{
       setValueAtTime:jest.fn(),
       exponentialRampToValueAtTime:jest.fn(level=>gainValues.push(level))
     },connect:jest.fn()
   }))
  };
  window.AudioContext=jest.fn(()=>{instances++;return context;});
 });
 afterEach(()=>{delete window.AudioContext;});
 test("correct feedback is a gentle ascending high-register chime",()=>{
  const {playSound}=require("./sound");
  playSound("correct");
  expect(frequencyValues).toEqual([523.25,659.25,783.99,1046.5]);
  expect(oscillators).toHaveLength(4);
  expect(oscillators.every(osc=>osc.type==="sine")).toBe(true);
  expect(gainValues.every(level=>level<=0.051)).toBe(true);
 });
 test("incorrect feedback has a descending low-register bass with smooth envelope",()=>{
  const {playSound}=require("./sound");
  playSound("wrong");
  expect(frequencyValues).toEqual([220,164.81]);
  expect(oscillators).toHaveLength(2);
  expect(oscillators.every(osc=>osc.type==="triangle")).toBe(true);
  expect(gainValues.every(level=>level>0&&level<0.08)).toBe(true);
 });
 test("reuses an AudioContext across repeated attempts",()=>{
  const {playSound}=require("./sound");
  playSound("correct");playSound("wrong");playSound("puzzle-correct");
  expect(instances).toBe(1);
  expect(oscillators).toHaveLength(9);
 });
 test("mute prevents creating audio and unsupported audio never interrupts scoring",()=>{
  const {playSound}=require("./sound");
  playSound("wrong",false);
  expect(instances).toBe(0);
  delete window.AudioContext;
  expect(()=>playSound("correct")).not.toThrow();
 });
 test("audio can resume after iPad Safari suspends its context",()=>{
  context.state="suspended";
  const {playSound}=require("./sound");
  playSound("correct");
  expect(context.resume).toHaveBeenCalledTimes(1);
 });
});
