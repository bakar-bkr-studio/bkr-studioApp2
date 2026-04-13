interface GoalProgressInput {
  type: "quantitative" | "qualitative";
  targetValue?: number | null;
  currentValue?: number | null;
}

export function getGoalProgress(goal: GoalProgressInput): number {
  if (goal.type !== "quantitative") {
    return 0;
  }

  if (typeof goal.targetValue !== "number" || goal.targetValue <= 0) {
    return 0;
  }

  if (typeof goal.currentValue !== "number") {
    return 0;
  }

  const progress = (goal.currentValue / goal.targetValue) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}
