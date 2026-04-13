export type GoalType = "quantitative" | "qualitative";
export type GoalStatus = "active" | "completed" | "at_risk" | "paused";
export type GoalHorizon = "week" | "month" | "quarter" | "year";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: GoalType;
  horizon: GoalHorizon;
  status: GoalStatus;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertGoalInput {
  title: string;
  description?: string | null;
  type: GoalType;
  horizon: GoalHorizon;
  status: GoalStatus;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}
