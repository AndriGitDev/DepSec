"use client";

import type { CategoryScore } from "@/types";
import { CategoryCard } from "./CategoryCard";

interface ScoreBreakdownProps {
  categories: CategoryScore[];
}

export function ScoreBreakdown({ categories }: ScoreBreakdownProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat) => (
        <CategoryCard key={cat.category} category={cat} />
      ))}
    </div>
  );
}
