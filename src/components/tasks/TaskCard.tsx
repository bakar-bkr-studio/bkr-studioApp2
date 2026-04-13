"use client";

import type { DragEvent } from "react";
import type { Task } from "@/features/tasks/types";
import { isTaskOverdue } from "@/lib/task-utils";

interface TaskCardProps {
  task: Task;
  projectName: string;
  isDragging?: boolean;
  onClick: () => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}

const priorityLabel: Record<Task["priority"], string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Urgente",
};

const priorityClass: Record<Task["priority"], string> = {
  low: "badge badge--neutral",
  medium: "badge badge--amber",
  high: "badge badge--red",
};

function formatDueDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function truncate(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export default function TaskCard({
  task,
  projectName,
  isDragging = false,
  onClick,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const overdue = isTaskOverdue(task);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
    onDragStart(task.id);
  };

  return (
    <button
      type="button"
      className={`task-card task-card--button ${overdue ? "task-card--overdue" : ""} ${
        isDragging ? "task-card--dragging" : ""
      }`}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      aria-label={`Ouvrir la tâche ${task.title}`}
    >
      <div className="task-card__top">
        <h3 className="task-card__title">{task.title}</h3>
        <span className={`${priorityClass[task.priority]} task-card__priority`}>
          {priorityLabel[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="task-card__description">{truncate(task.description)}</p>
      )}

      <div className="task-card__meta">
        <span className="badge badge--neutral task-card__project">{projectName}</span>

        {task.dueDate && (
          <span className={`task-card__due ${overdue ? "task-card__due--overdue" : ""}`}>
            {overdue ? "En retard" : "Échéance"}: {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </button>
  );
}
