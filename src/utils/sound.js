// A single context avoids Safari/iPad's limit on simultaneous AudioContexts.
// Chimes are synthesized on-device: no downloads, external audio, or latency.
let audioContext;
const notesByType = {
  // Gentle, rising major chord: pleasant success with a soft high-note tail.
  correct: [[523.25,0,.24,.042],[659.25,.085,.26,.042],[783.99,.17,.30,.044],[1046.5,.265,.46,.047]],
  "puzzle-correct": [[440,0,.23,.042],[554.37,.095,.27,.044],[659.25,.19,.40,.046]],
  // Low, descending two-note bass motif, still audible on small iPad speakers.
  wrong: [[220,0,.35,.075],[164.81,.16,.47,.077]],
  fanfare: [[392,0,.24,.046],[523.25,.11,.28,.048],[659.25,.22,.31,.048],[783.99,.33,.48,.051]],
};
export function playSound(type, enabled=true) {
  if(!enabled || !notesByType[type]) return;
  try {
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context) return;
    if(!audioContext || audioContext.state==="closed") audioContext=new Context();
    if(audioContext.state==="suspended") Promise.resolve(audioContext.resume()).catch(()=>{});
    const startAt=audioContext.currentTime+.012;
    notesByType[type].forEach(([frequency,offset,duration,peak])=>{
      const start=startAt+offset,end=start+duration;
      const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
      oscillator.type=type==="wrong"?"triangle":"sine";
      oscillator.frequency.setValueAtTime(frequency,start);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(peak,start+.024);
      gain.gain.exponentialRampToValueAtTime(peak*.45,start+duration*.42);
      gain.gain.exponentialRampToValueAtTime(.0001,end);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);oscillator.stop(end+.01);
    });
  } catch (_) {
    // Silence is preferable to interrupting an activity if sound is blocked.
  }
}
