import { apiRequest } from "@/lib/api-client";
import type { Task, UpsertTaskInput } from "@/features/tasks/types";

interface TasksListResponse {
  items: Task[];
}

interface TaskItemResponse {
  item: Task;
}

export async function listUserTasks(): Promise<Task[]> {
  const response = await apiRequest<TasksListResponse>("/api/v1/tasks", {
    method: "GET",
  });

  return response.items;
}

export async function createTask(data: UpsertTaskInput): Promise<Task> {
  const response = await apiRequest<TaskItemResponse>("/api/v1/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response.item;
}

export async function updateTask(
  taskId: string,
  data: Partial<UpsertTaskInput>
): Promise<Task> {
  const normalizedTaskId = taskId.trim();

  if (!normalizedTaskId) {
    throw new Error("Tâche invalide: id manquant.");
  }

  const response = await apiRequest<TaskItemResponse>(
    `/api/v1/tasks/${encodeURIComponent(normalizedTaskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return response.item;
}

export async function deleteTask(taskId: string): Promise<void> {
  const normalizedTaskId = taskId.trim();

  if (!normalizedTaskId) {
    throw new Error("Tâche invalide: id manquant.");
  }

  await apiRequest<{ success: boolean }>(
    `/api/v1/tasks/${encodeURIComponent(normalizedTaskId)}`,
    {
      method: "DELETE",
    }
  );
}
