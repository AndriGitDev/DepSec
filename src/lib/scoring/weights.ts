export const WEIGHTS = {
  vulnerabilities: 0.35,
  hygiene: 0.15,
  license: 0.10,
  maintainer: 0.15,
  popularity: 0.10,
  typosquat: 0.15,
} as const;

export function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function getGradeLabel(grade: string): string {
  switch (grade) {
    case "A+": return "Excellent";
    case "A": return "Good";
    case "B": return "Fair";
    case "C": return "Needs Attention";
    case "D": return "Poor";
    case "F": return "Critical";
    default: return "Unknown";
  }
}
