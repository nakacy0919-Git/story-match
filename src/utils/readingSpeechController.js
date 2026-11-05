// Microphone lifecycle ported from nakacy0919-Git/copeak grammar-training.js
// (beginSpeech, endSpeech, cancelRecognition, finalizeSpeechSession).
// GCC PracticePageV170 supplies the same new-recognizer / 250ms restart flow.
// Keep manual start synchronous with the tap: no cached recognizer or cooldown.
export function createReadingSpeechController({
  host = window,
  onChange,
  onScore,
  calculate,
  getThreshold = () => 80,
}) {
  const state = {
    item: null,
    recognition: null,
    token: 0,
    recording: false,
    stopRequested: false,
    transcript: "",
    interimTranscript: "",
    recoveries: 0,
    signals: { audio: false, voice: false, text: false },
    healthTimer: null,
    stopTimer: null,
    restartTimer: null,
  };
  let view = {
    phase: "idle",
    transcript: "",
    status: "音読スタートを押して、英文を最後まで読みましょう。",
    signals: { ...state.signals },
  };
  const paint = (patch) => {
    view = { ...view, ...patch, signals: { ...state.signals } };
    onChange(view);
  };
  const clearTimers = () => {
    for (const key of ["healthTimer", "stopTimer", "restartTimer"]) {
      host.clearTimeout(state[key]);
      state[key] = null;
    }
  };
  const detach = (r) => {
    if (r)
      r.onstart =
        r.onaudiostart =
        r.onspeechstart =
        r.onresult =
        r.onerror =
        r.onend =
          null;
  };
  function cancel() {
    state.token++;
    clearTimers();
    const r = state.recognition;
    state.recognition = null;
    state.recording = false;
    state.stopRequested = false;
    state.interimTranscript = "";
    detach(r);
    if (r)
      try {
        r.abort();
      } catch (_) {}
    paint({ phase: "idle" });
  }
  function setItem(item) {
    cancel();
    state.item = item;
    state.transcript = "";
    state.interimTranscript = "";
    state.signals = { audio: false, voice: false, text: false };
    paint({
      phase: "idle",
      transcript: "",
      status: "音読スタートを押して、英文を最後まで読みましょう。",
    });
  }
  function finalize(token, item, timeout = false) {
    if (
      token !== state.token ||
      !state.stopRequested ||
      state.item?.id !== item.id
    )
      return;
    const recognizer = state.recognition;
    clearTimers();
    const spoken = [state.transcript, state.interimTranscript]
      .filter(Boolean)
      .join(" ")
      .trim();
    state.token++;
    state.recognition = null;
    state.recording = false;
    state.stopRequested = false;
    detach(recognizer);
    if (timeout && recognizer)
      try {
        recognizer.abort();
      } catch (_) {}
    if (!spoken) {
      paint({
        phase: "idle",
        transcript: "",
        status:
          "文字起こしを受信できませんでした。「音読スタート」で再挑戦してください。",
      });
      return;
    }
    const result = calculate(item.sentence, spoken).percent;
    paint({
      phase: "idle",
      transcript: spoken,
      status:
        result >= getThreshold()
          ? "✓ 合格！次のシーンに進めます。"
          : `${getThreshold()}%以上で合格です。もう一度挑戦しましょう。`,
    });
    onScore(result, spoken, item.id);
  }
  function begin() {
    const Speech = host.SpeechRecognition || host.webkitSpeechRecognition,
      item = state.item;
    if (!item || state.recording) return;
    if (!Speech) {
      paint({
        status:
          "音声認識を利用できません。ブラウザーのマイク設定を確認してください。",
      });
      return;
    }
    host.speechSynthesis?.cancel();
    cancel();
    state.recording = true;
    state.stopRequested = false;
    state.recoveries = 0;
    state.transcript = "";
    state.interimTranscript = "";
    state.signals = { audio: false, voice: false, text: false };
    const token = state.token;
    paint({
      phase: "listening",
      transcript: "",
      status: "🔴 音読中です。読み終えたら「終了・判定」を押してください。",
    });
    const listen = () => {
      if (
        !state.recording ||
        state.stopRequested ||
        token !== state.token ||
        state.item?.id !== item.id
      )
        return;
      state.restartTimer = null;
      let r;
      try {
        r = new Speech();
        state.recognition = r;
        r.lang = "en-US";
        r.continuous = true;
        r.interimResults = true;
        r.maxAlternatives = 1;
      } catch (e) {
        cancel();
        paint({ status: "マイクを準備できませんでした：" + e.message });
        return;
      }
      const current = () =>
        token === state.token &&
        state.recognition === r &&
        state.item?.id === item.id;
      const previousTranscript = state.transcript;
      state.healthTimer = host.setTimeout(() => {
        state.healthTimer = null;
        if (!current() || state.stopRequested || state.signals.text) return;
        if (state.recoveries >= 1) {
          cancel();
          paint({
            status:
              "文字起こしが応答していません。「マイクを再接続」を押してください。",
          });
          return;
        }
        state.recoveries++;
        state.recognition = null;
        detach(r);
        try {
          r.abort();
        } catch (_) {}
        paint({
          status:
            "文字起こしを再接続しています。接続後にもう一度読んでください。",
        });
        state.restartTimer = host.setTimeout(listen, 500);
      }, 8000);
      r.onstart = () => {
        if (current() && state.recording)
          paint({
            status:
              "音声認識サービスが開始しました。マイク入力・文字起こしを確認中です。",
          });
      };
      r.onaudiostart = () => {
        if (current() && state.recording) {
          state.signals.audio = true;
          paint({});
        }
      };
      r.onspeechstart = () => {
        if (current() && state.recording) {
          state.signals.voice = true;
          paint({});
        }
      };
      r.onresult = (event) => {
        if (!current() || !state.recording) return;
        const finals = [],
          interims = [];
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i],
            text = String(result?.[0]?.transcript || "").trim();
          if (text) (result.isFinal ? finals : interims).push(text);
        }
        if (!finals.length && !interims.length) return;
        host.clearTimeout(state.healthTimer);
        state.healthTimer = null;
        state.transcript = [previousTranscript, ...finals]
          .filter(Boolean)
          .join(" ")
          .trim();
        state.interimTranscript = interims.join(" ");
        state.signals = { audio: true, voice: true, text: true };
        paint({
          transcript: [state.transcript, state.interimTranscript]
            .filter(Boolean)
            .join(" "),
        });
      };
      r.onerror = (event) => {
        if (!current()) return;
        const error = event.error || "unknown";
        if (
          [
            "not-allowed",
            "service-not-allowed",
            "audio-capture",
            "language-not-supported",
          ].includes(error)
        ) {
          cancel();
          paint({
            status:
              "マイクを利用できません（" +
              error +
              "）。ブラウザーの権限と入力設定を確認してください。",
          });
        } else if (error !== "no-speech" && error !== "aborted")
          paint({
            status:
              "音声認識が中断されました（" + error + "）。自動で再接続します。",
          });
      };
      r.onend = () => {
        if (!current()) return;
        host.clearTimeout(state.healthTimer);
        state.healthTimer = null;
        state.recognition = null;
        detach(r);
        if (state.recording && !state.stopRequested) {
          if (state.interimTranscript) {
            state.transcript = [state.transcript, state.interimTranscript]
              .filter(Boolean)
              .join(" ");
            state.interimTranscript = "";
          }
          state.restartTimer = host.setTimeout(listen, 250);
        } else if (state.stopRequested) finalize(token, item);
      };
      try {
        r.start();
      } catch (e) {
        cancel();
        paint({ status: "マイクを開始できませんでした：" + e.message });
      }
    };
    // Deliberately synchronous: this preserves the user activation on iPad.
    listen();
  }
  function stop() {
    if (!state.recording || state.stopRequested) return;
    const item = state.item,
      token = state.token,
      r = state.recognition;
    state.stopRequested = true;
    paint({
      phase: "scoring",
      status: "文字起こしの最終結果を取得して判定しています…",
    });
    host.clearTimeout(state.restartTimer);
    state.restartTimer = null;
    if (r) {
      state.stopTimer = host.setTimeout(
        () => finalize(token, item, true),
        1600,
      );
      try {
        r.stop();
      } catch (_) {
        finalize(token, item, true);
      }
    } else finalize(token, item);
  }
  function reconnect() {
    cancel();
    begin();
  }
  return { begin, stop, cancel, setItem, reconnect };
}
