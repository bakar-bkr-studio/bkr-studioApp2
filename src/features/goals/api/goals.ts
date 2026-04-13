import { apiRequest } from "@/lib/api-client";
import type { Goal, UpsertGoalInput } from "@/features/goals/types";

interface GoalsListResponse {
  items: Goal[];
}

interface GoalItemResponse {
  item: Goal;
}

export async function listUserGoals(): Promise<Goal[]> {
  const response = await apiRequest<GoalsListResponse>("/api/v1/goals", {
    method: "GET",
  });

  return response.items;
}

export async function createGoal(data: UpsertGoalInput): Promise<Goal> {
  const response = await apiRequest<GoalItemResponse>("/api/v1/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response.item;
}

export async function updateGoal(
  goalId: string,
  data: Partial<UpsertGoalInput>
): Promise<Goal> {
  const normalizedGoalId = goalId.trim();

  if (!normalizedGoalId) {
    throw new Error("Objectif invalide: id manquant.");
  }

  const response = await apiRequest<GoalItemResponse>(
    `/api/v1/goals/${encodeURIComponent(normalizedGoalId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return response.item;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const normalizedGoalId = goalId.trim();

  if (!normalizedGoalId) {
    throw new Error("Objectif invalide: id manquant.");
  }

  await apiRequest<{ success: boolean }>(
    `/api/v1/goals/${encodeURIComponent(normalizedGoalId)}`,
    {
      method: "DELETE",
    }
  );
}
