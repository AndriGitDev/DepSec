"use client";

import { useEffect, useState } from "react";
import { getGradeLabel } from "@/lib/scoring/weights";

interface ScoreGaugeProps {
  score: number;
  grade: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#00ff41";
  if (score >= 60) return "#ffaa00";
  if (score >= 40) return "#ff8800";
  return "#ff3333";
}

export function ScoreGauge({ score, grade }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getScoreColor(score);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1500;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  // SVG arc path
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference - (circumference * animatedScore) / 100;

  return (
    <div className="flex flex-col items-center" aria-label={`Security score: ${score} out of 100, grade ${grade}`}>
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#0d1a0f"
          strokeWidth="8"
          strokeLinecap="square"
        />

        {/* Score arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="square"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter="url(#glow)"
          style={{ transition: "stroke 0.3s" }}
        />

        {/* Score number */}
        <text
          x="100"
          y="85"
          textAnchor="middle"
          fill={color}
          fontSize="36"
          fontFamily="var(--font-orbitron)"
          fontWeight="700"
          filter="url(#glow)"
        >
          {animatedScore}
        </text>

        {/* /100 */}
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fill="#00aa2a"
          fontSize="12"
          fontFamily="var(--font-share-tech-mono)"
        >
          / 100
        </text>
      </svg>

      {/* Grade badge */}
      <div className="mt-2 flex flex-col items-center gap-1">
        <span
          className="font-display text-2xl font-bold tracking-widest"
          style={{ color, textShadow: `0 0 10px ${color}40` }}
        >
          {grade}
        </span>
        <span className="font-mono text-xs text-phosphor-dim">
          {getGradeLabel(grade)}
        </span>
      </div>
    </div>
  );
}
