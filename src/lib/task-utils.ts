import type { Task, TaskStatus } from "@/features/tasks/types";

export type TasksByStatus = Record<TaskStatus, Task[]>;

export interface TaskCounts {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  highPriority: number;
  overdue: number;
}

export function getTasksByStatus(tasks: Task[]): TasksByStatus {
  return tasks.reduce<TasksByStatus>(
    (groups, task) => {
      groups[task.status].push(task);
      return groups;
    },
    {
      todo: [],
      in_progress: [],
      done: [],
    }
  );
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") {
    return false;
  }

  const dueDate = task.dueDate.includes("T")
    ? new Date(task.dueDate)
    : new Date(`${task.dueDate}T23:59:59`);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate.getTime() < Date.now();
}

export function getTaskCounts(tasks: Task[]): TaskCounts {
  const groupedTasks = getTasksByStatus(tasks);

  return {
    total: tasks.length,
    todo: groupedTasks.todo.length,
    in_progress: groupedTasks.in_progress.length,
    done: groupedTasks.done.length,
    highPriority: tasks.filter((task) => task.priority === "high").length,
    overdue: tasks.filter((task) => isTaskOverdue(task)).length,
  };
}
