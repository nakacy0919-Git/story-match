import { useEffect, useRef, useState } from "react";
// Port of Copeak grammar-training / GCC Practice English lifecycle:
// a service end reconnects; only the learner's End & Score finalizes.
export function useReadingSpeech(sentence, onScore, calculate) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState(
    "音読スタートを押して、英文を最後まで読みましょう。",
  );
  const session = useRef(null),
    scoreRef = useRef(onScore);
  scoreRef.current = onScore;
  const dispose = () => {
    const s = session.current;
    session.current = null;
    if (!s) return;
    clearTimeout(s.restart);
    clearTimeout(s.health);
    clearTimeout(s.finishTimer);
    if (s.rec) {
      s.rec.onend = s.rec.onresult = s.rec.onerror = null;
      try {
        s.rec.abort();
      } catch (_) {}
    }
  };
  useEffect(() => () => dispose(), [sentence]);
  const begin = () => {
    if (session.current) return;
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      setStatus(
        "音声認識に対応していません。Chrome・Edge・Safariで開いてください。",
      );
      return;
    }
    window.speechSynthesis?.cancel();
    const s = {
      rec: null,
      final: "",
      interim: "",
      stopping: false,
      recoveries: 0,
    };
    session.current = s;
    setTranscript("");
    setPhase("listening");
    setStatus("🔴 音読中です。読み終えたら「終了・判定」を押してください。");
    const finish = () => {
      if (session.current !== s) return;
      const spoken = [s.final, s.interim].filter(Boolean).join(" ").trim();
      const result = calculate(sentence, spoken).percent;
      dispose();
      setPhase("idle");
      setTranscript(spoken);
      setStatus(
        !spoken
          ? "音声を認識できませんでした。マイク設定を確認して、もう一度読みましょう。"
          : result >= 80
            ? "✓ 合格！次のシーンに進めます。"
            : "80%以上で合格です。もう一度挑戦しましょう。",
      );
      scoreRef.current(result, spoken);
    };
    s.finish = finish;
    const listen = () => {
      if (session.current !== s || s.stopping) return;
      let r;
      try {
        r = new Speech();
      } catch (_) {
        dispose();
        setPhase("idle");
        setStatus("マイクを準備できませんでした。もう一度お試しください。");
        return;
      }
      s.rec = r;
      r.lang = "en-US";
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      const previous = s.final;
      const current = () => session.current === s && s.rec === r;
      s.health = setTimeout(() => {
        if (!current() || s.stopping) return;
        r.onresult = r.onend = r.onerror = null;
        try {
          r.abort();
        } catch (_) {}
        if (s.recoveries++ >= 1) {
          dispose();
          setPhase("idle");
          setStatus(
            "文字起こしが応答しません。「音読スタート」で再接続してください。",
          );
          return;
        }
        setStatus(
          "文字起こしを再接続しています。接続後にもう一度読んでください。",
        );
        s.restart = setTimeout(listen, 500);
      }, 8000);
      r.onresult = (e) => {
        if (!current()) return;
        const finals = [],
          interims = [];
        for (let i = 0; i < e.results.length; i++) {
          const result = e.results[i],
            text = String(result?.[0]?.transcript || "").trim();
          if (text) (result.isFinal ? finals : interims).push(text);
        }
        if (!finals.length && !interims.length) return;
        clearTimeout(s.health);
        s.final = [previous, ...finals].filter(Boolean).join(" ");
        s.interim = interims.join(" ");
        setTranscript([s.final, s.interim].filter(Boolean).join(" "));
      };
      r.onerror = (e) => {
        if (!current()) return;
        if (
          [
            "not-allowed",
            "service-not-allowed",
            "audio-capture",
            "language-not-supported",
          ].includes(e.error)
        ) {
          dispose();
          setPhase("idle");
          setStatus(
            "マイクを利用できません。ブラウザのマイク権限・入力設定を確認してください。",
          );
        } else if (e.error !== "no-speech" && e.error !== "aborted")
          setStatus("接続が中断されました。音声認識を再接続します。");
      };
      r.onend = () => {
        if (!current()) return;
        clearTimeout(s.health);
        s.rec = null;
        if (s.stopping) {
          finish();
          return;
        }
        s.final = [s.final, s.interim].filter(Boolean).join(" ");
        s.interim = "";
        s.restart = setTimeout(listen, 250);
      };
      try {
        r.start();
      } catch (_) {
        dispose();
        setPhase("idle");
        setStatus("音声認識を開始できませんでした。もう一度お試しください。");
      }
    };
    listen();
  };
  const stop = () => {
    const s = session.current;
    if (!s || s.stopping) return;
    s.stopping = true;
    clearTimeout(s.restart);
    clearTimeout(s.health);
    setPhase("scoring");
    s.finishTimer = setTimeout(s.finish, 1600);
    if (s.rec) {
      try {
        s.rec.stop();
      } catch (_) {
        s.finish();
      }
    } else s.finish();
  };
  return { phase, transcript, status, begin, stop };
}
