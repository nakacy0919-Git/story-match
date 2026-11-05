import React from "react";
const colors = ["#3cbda0", "#e6ae52", "#738de5", "#ed8794", "#8ccfcc"];
export default function ReadingCelebration({ id }) {
  return (
    <div
      className="reading-confetti"
      aria-hidden="true"
      key={id}
      data-testid="reading-confetti"
    >
      {Array.from({ length: 52 }, (_, i) => (
        <i
          key={i}
          style={{
            left: ((i * 37) % 100) + "%",
            backgroundColor: colors[i % colors.length],
            animationDelay: (i % 9) * 0.045 + "s",
            "--drift": ((i % 7) - 3) * 32 + "px",
            "--turn": (i % 2 ? 1 : -1) * 540 + "deg",
          }}
        />
      ))}
    </div>
  );
}
