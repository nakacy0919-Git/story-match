import React, { useEffect, useRef, useState } from 'react';

// Use the wall-clock rather than incrementing a counter. Backgrounded iPads
// throttle intervals, but the actual elapsed time must still be correct.
const Timer = ({ isStarted, isCleared, setFinalTime, penaltySeconds = 0 }) => {
  const startedAtRef = useRef(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isStarted) {
      startedAtRef.current = null;
      setElapsedSeconds(0);
      return;
    }

    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const update = () => {
      const elapsed = Math.floor(Math.max(0, Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(elapsed);
      if (isCleared) setFinalTime(elapsed + penaltySeconds);
    };
    update();

    if (isCleared) return;
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [isStarted, isCleared, setFinalTime, penaltySeconds]);

  return (
    <div style={{
      fontSize: '1.5rem', fontWeight: 'bold', color: '#ff5722',
      backgroundColor: '#fff', padding: '5px 20px', borderRadius: '20px',
      border: '3px solid #ff5722', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      ⏱ Time: {elapsedSeconds + penaltySeconds}s
    </div>
  );
};

export default Timer;
