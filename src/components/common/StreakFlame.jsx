import React, { useState, useEffect, useRef } from 'react';
import './StreakFlame.css';

const MILESTONES = [7, 14, 30, 60, 100, 365];

export default function StreakFlame({
  streak = 0,
  showLabel = true,
  compact = false,
  className = '',
  isIncremented = false
}) {
  const [animationState, setAnimationState] = useState('idle');
  const prevStreakRef = useRef(streak);
  const timerRef = useRef(null);

  const isMilestone = MILESTONES.includes(streak);

  useEffect(() => {
    if (streak > prevStreakRef.current || isIncremented) {
      const nextState = isMilestone ? 'milestone' : 'increment';
      setAnimationState(nextState);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setAnimationState('idle');
      }, isMilestone ? 750 : 600);
    }
    prevStreakRef.current = streak;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [streak, isIncremented, isMilestone]);

  const flameColor = streak >= 30
    ? '#ef4444' // Rose flame for 30+ days
    : streak >= 7
    ? '#f59e0b' // Amber/Gold flame for 7+ days
    : '#f97316'; // Orange flame for standard days

  return (
    <div
      className={`v-streak-flame-container ${className}`}
      aria-label={`Chuỗi ngày học liên tục: ${streak} ngày`}
      title={`Chuỗi ngày học liên tục: ${streak} ngày`}
    >
      <div className={`v-streak-flame-icon state-${animationState}`}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flame Base Vector */}
          <path
            d="M12 2C10.5 4.5 10 6.5 10 8.5C10 7.5 9 6.5 8 6C7.5 8 7 10 7 12C7 16.4183 9.23858 20 12 20C14.7614 20 17 16.4183 17 12C17 7.5 14.5 4.5 12 2Z"
            fill={flameColor}
            fillOpacity="0.85"
          />
          {/* Inner Flame Core */}
          <path
            d="M12 9C11 10.5 10.5 12 10.5 13.5C10.5 15.433 11.1716 17 12 17C12.8284 17 13.5 15.433 13.5 13.5C13.5 11.5 12.5 10 12 9Z"
            fill="#fef08a"
          />
        </svg>
      </div>

      <span className={`v-streak-count ${animationState !== 'idle' ? 'highlight' : ''}`}>
        {streak}
      </span>

      {showLabel && (
        <span className="v-streak-label">
          {compact ? 'ngày' : 'ngày liên tục'}
        </span>
      )}
    </div>
  );
}
