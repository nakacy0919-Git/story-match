import { readingWords, readingOffsetAt, estimatedReadingSeconds } from "./readingKaraoke";

// PCM WAV Model recordings currently checked into public/audio (12 scenes per unit).
// Units without a recording use the device's speech synthesizer immediately,
// preserving the user gesture needed by Safari/iPad for speech playback.
export const MODEL_AUDIO_COUNTS = Object.freeze({ 7: 12, 8: 12, 11: 12, 12: 12 });
export const PLAYBACK_RATES = Object.freeze([0.75, 0.85, 1, 1.25]);

export function hasModelAudio(unit, index) {
  return Number.isInteger(index) &&
    index >= 0 &&
    index < (MODEL_AUDIO_COUNTS[Number(unit)] || 0);
}

export function modelAudioUrl(unit, index) {
  return `${process.env.PUBLIC_URL || ""}/audio/unit${unit}/${index + 1}.wav`;
}

export function createModelAudioPlayer(win = window, {reuseAudio = false} = {}) {
  let playbackId = 0;
  let audio = null;
  let sharedAudio = null;
  let utterance = null;
  let progressTimer = null;
  const clearProgress = () => {
    if (progressTimer !== null) win.clearInterval?.(progressTimer);
    progressTimer = null;
  };
  const watchProgress = (callback) => {
    clearProgress();
    if (typeof win.setInterval === "function") progressTimer = win.setInterval(callback, 60);
  };
  const failedUrls = new Set();
  const stop = () => {
    playbackId += 1;
    clearProgress();
    if (audio) {
      audio.onplaying = null;
      audio.onerror = null;
      audio.onended = null;
      audio.ontimeupdate = null;
      try { audio.pause(); } catch (_) { /* not playing */ }
      audio = null;
    }
    if (utterance) {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
      utterance.onboundary = null;
      utterance = null;
    }
    try { win.speechSynthesis?.cancel(); } catch (_) { /* unavailable */ }
  };

  const setRate = (rate) => {
    if (audio && PLAYBACK_RATES.includes(rate)) audio.playbackRate = rate;
  };

  const play = ({ unit, index, text, rate = 0.85, onSource, onEnd, onError, onProgress }) => {
    stop();
    const id = playbackId;
    const current = () => id === playbackId;
    const words = onProgress ? readingWords(text) : [];
    let lastOffset = null;
    const emit = (offset) => {
      if (!current() || !onProgress || !Number.isInteger(offset) || offset === lastOffset) return;
      lastOffset = offset;
      onProgress(offset);
    };
    const fail = () => {
      if (current()) {
        clearProgress();
        onError?.("音声を再生できません。もう一度「お手本を聞く」を押してください。");
      }
    };
    const finish = () => {
      if (current()) {
        clearProgress();
        onEnd?.();
      }
    };
    const speak = () => {
      if (!current()) return;
      const synth = win.speechSynthesis;
      const Utterance = win.SpeechSynthesisUtterance;
      if (!synth || !Utterance) { fail(); return; }
      try {
        const u = new Utterance(text);
        utterance = u;
        u.lang = "en-US";
        u.rate = rate;
        const voices = synth.getVoices?.() || [];
        u.voice =
          voices.find((v) => v.name?.includes("Google US English")) ||
          voices.find((v) => v.name?.includes("Samantha")) ||
          voices.find((v) => v.lang === "en-US") ||
          voices.find((v) => v.lang?.startsWith("en")) ||
          null;
        let boundarySeen = false;
        u.onstart = () => {
          if (!current()) return;
          onSource?.("speech");
          if (!words.length) return;
          const startedAt = Date.now();
          const seconds = estimatedReadingSeconds(words, rate);
          emit(words[0].start);
          watchProgress(() => {
            if (current() && !boundarySeen)
              emit(readingOffsetAt(words, (Date.now() - startedAt) / 1000 / seconds));
          });
        };
        u.onboundary = (event) => {
          if (!current() || !words.length || (event.name && event.name !== "word")) return;
          if (!Number.isInteger(event.charIndex) || event.charIndex < 0) return;
          boundarySeen = true;
          const word = words.find(w => event.charIndex >= w.start && event.charIndex < w.end)
            || words.find(w => w.start >= event.charIndex);
          if (word) emit(word.start);
        };
        u.onend = finish;
        u.onerror = (event) => {
          if (event?.error !== "canceled" && event?.error !== "interrupted") fail();
        };
        // Both calls need to start in the original click when no MP3 exists.
        try { synth.resume?.(); } catch (_) { /* best effort */ }
        synth.speak(u);
        onSource?.("speech");
      } catch (_) {
        fail();
      }
    };

    const url = modelAudioUrl(unit, index);
    if (!hasModelAudio(unit, index) || failedUrls.has(url)) {
      speak();
      return;
    }
    try {
      // Reuse the user-activated media element for sequential story playback.
      const a = reuseAudio && sharedAudio ? sharedAudio : new win.Audio(url);
      if (reuseAudio) {
        if (sharedAudio) a.src = url;
        sharedAudio = a;
      }
      audio = a;
      a.preload = "auto";
      a.playbackRate = rate;
      let triedFallback = false;
      const fallback = () => {
        if (!current() || triedFallback || audio !== a) return;
        triedFallback = true;
        clearProgress();
        lastOffset = null;
        failedUrls.add(url);
        a.onplaying = null;
        a.onended = null;
        a.onerror = null;
        a.ontimeupdate = null;
        try { a.pause(); } catch (_) { /* not playing */ }
        audio = null;
        speak();
      };
      const updateProgress = () => {
        if (current() && audio === a && words.length && a.duration > 0)
          emit(readingOffsetAt(words, a.currentTime / a.duration));
      };
      a.onplaying = () => {
        if (!current()) return;
        onSource?.("model");
        if (words.length) {
          emit(words[0].start);
          updateProgress();
          watchProgress(updateProgress);
        }
      };
      if (words.length) a.ontimeupdate = updateProgress;
      a.onended = finish;
      a.onerror = fallback;
      const result = a.play();
      if (result && typeof result.catch === "function") result.catch(fallback);
    } catch (_) {
      audio = null;
      speak();
    }
  };

  return { play, stop, setRate };
}
