import { useLayoutEffect, useRef, useState } from "react";
import { createReadingSpeechController } from "./readingSpeechController";

// React only displays controller state. Recognition starts in the button event,
// never in an effect, a render or a timer after a scene change.
export function useReadingSpeech(
  sentence,
  onScore,
  calculate,
  sceneId,
  threshold = 80,
) {
  const [view, setView] = useState({
    phase: "idle",
    transcript: "",
    status: "音読スタートを押して、英文を最後まで読みましょう。",
    signals: { audio: false, voice: false, text: false },
  });
  const callback = useRef(onScore),
    activeScene = useRef(sceneId),
    engine = useRef(null);
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  callback.current = onScore;
  activeScene.current = sceneId;
  if (!engine.current)
    engine.current = createReadingSpeechController({
      onChange: setView,
      calculate,
      getThreshold: () => thresholdRef.current,
      onScore: (percent, spoken, id) => {
        if (id === activeScene.current) callback.current(percent, spoken);
      },
    });
  useLayoutEffect(() => {
    const controller = engine.current;
    controller.setItem({ id: sceneId, sentence });
    return () => controller.cancel();
  }, [sceneId, sentence]);
  return { ...view, ...engine.current };
}
