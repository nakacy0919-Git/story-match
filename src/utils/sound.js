// Keep one AudioContext per page. Creating a new context for every answer can
// exhaust the context limit on Safari/iPad and crash otherwise functional games.
let audioContext;

export function playSound(type) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  try {
    if (!audioContext || audioContext.state === "closed")
      audioContext = new Context();
    if (audioContext.state === "suspended") {
      Promise.resolve(audioContext.resume()).catch(() => {});
    }
    const notes =
      type === "puzzle-correct"
        ? [349.23, 440, 523.25]
        : type === "correct"
          ? [523.25, 659.25, 783.99]
          : type === "wrong"
            ? [196]
            : type === "fanfare"
              ? [392, 523.25, 659.25, 783.99]
              : [];
    notes.forEach((frequency, index) => {
      const start =
        audioContext.currentTime +
        index * (type === "puzzle-correct" ? 0.09 : 0.12);
      const duration = type === "wrong" ? 0.25 : 0.3;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type === "wrong" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        type === "wrong" ? 0.08 : type === "puzzle-correct" ? 0.025 : 0.07,
        start + 0.025,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    });
  } catch (error) {
    // Sound is optional: never block game progress when audio is unsupported.
    console.warn("Sound playback unavailable:", error);
  }
}
