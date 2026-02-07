"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CategoryScore } from "@/types";

function getBarColor(score: number): string {
  if (score >= 80) return "#00ff41";
  if (score >= 60) return "#ffaa00";
  if (score >= 40) return "#ff8800";
  return "#ff3333";
}

function getLetterGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

interface CategoryCardProps {
  category: CategoryScore;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getBarColor(category.score);
  const letterGrade = getLetterGrade(category.score);
  const flaggedDeps = category.details.filter((d) => d.issues.length > 0);

  return (
    <div className="border border-phosphor-dim/20 bg-card p-4 transition-all hover:border-phosphor-dim/40">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-mono text-sm text-phosphor mb-1">
            {category.label}
          </h3>
          <p className="font-sans text-xs text-phosphor-dim/70 leading-relaxed">
            {category.summary}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span
            className="font-display text-lg font-bold"
            style={{ color }}
          >
            {letterGrade}
          </span>
          <p className="font-mono text-xs text-phosphor-dim">
            {category.score}/100
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-secondary overflow-hidden mb-3">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${category.score}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>

      {/* Weight indicator */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-phosphor-dim/50 uppercase tracking-wider">
          Weight: {Math.round(category.weight * 100)}%
        </span>
        {flaggedDeps.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 font-mono text-[10px] text-phosphor-dim hover:text-phosphor transition-colors"
          >
            {flaggedDeps.length} issue(s)
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && flaggedDeps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-phosphor-dim/10 space-y-2">
          {flaggedDeps.map((dep) => (
            <div key={dep.name} className="flex items-start gap-2">
              <span className="font-mono text-xs text-phosphor shrink-0">
                {dep.name}
              </span>
              <span className="font-sans text-xs text-phosphor-dim/60">
                {dep.issues.join("; ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
