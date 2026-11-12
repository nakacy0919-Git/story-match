import React, { useCallback, useEffect, useRef } from "react";
import "./OpeningSequence.css";

const INTRO_DURATION_MS = 5600;
const REDUCED_MOTION_DURATION_MS = 200;

/**
 * A one-time opening on each page load. The screen underneath stays mounted,
 * so no lesson state or Learning Progress data is reset on exit.
 */
export default function OpeningSequence({ onFinish }) {
  const finished = useRef(false);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish();
  }, [finish]);
  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      finish,
      reducedMotion ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS,
    );
    const onKeyDown = (event) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onFinish]);

  return (
    <div className="pso-screen" role="dialog" aria-modal="true" aria-label="POWER SLIDE オープニング">
      <div className="pso-vignette" aria-hidden="true" />
      <div className="pso-light-beam" aria-hidden="true" />
      <div className="pso-halo pso-halo-one" aria-hidden="true" />
      <div className="pso-halo pso-halo-two" aria-hidden="true" />
      <div className="pso-glow" aria-hidden="true" />
      <div className="pso-logo-wrap">
        <img
          className="pso-logo"
          src="/power-slide-emblem.avif"
          alt="POWER SLIDE"
          width="300"
          height="300"
          fetchPriority="high"
        />
      </div>
      <div className="pso-title-block" aria-label="TREASURE HUNT">
        <span className="pso-overline">POWER SLIDE PRESENTS</span>
        <strong className="pso-title"><span>TREASURE</span><span>HUNT</span></strong>
        <span className="pso-title-rule" aria-hidden="true" />
        <span className="pso-subtitle">YOUR LEARNING ADVENTURE BEGINS</span>
      </div>
      <button className="pso-skip" type="button" onClick={finish}>
        スキップ <span aria-hidden="true">→</span>
      </button>
      <span className="pso-progress-label" aria-hidden="true">LEARNING PROGRESS</span>
    </div>
  );
}
