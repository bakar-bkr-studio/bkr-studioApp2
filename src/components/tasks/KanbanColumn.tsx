import type { DragEvent } from "react";
import type { Task, TaskStatus } from "@/features/tasks/types";
import TaskCard from "@/components/tasks/TaskCard";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  draggedTaskId: string | null;
  dragOverStatus: TaskStatus | null;
  getProjectName: (projectId: string | null) => string;
  onTaskClick: (task: Task) => void;
  onTaskDragStart: (taskId: string) => void;
  onTaskDragEnd: () => void;
  onColumnDragOver: (status: TaskStatus) => void;
  onTaskDrop: (taskId: string, status: TaskStatus) => void;
}

export default function KanbanColumn({
  title,
  status,
  tasks,
  draggedTaskId,
  dragOverStatus,
  getProjectName,
  onTaskClick,
  onTaskDragStart,
  onTaskDragEnd,
  onColumnDragOver,
  onTaskDrop,
}: KanbanColumnProps) {
  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onColumnDragOver(status);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain").trim();
    if (!taskId) return;
    onTaskDrop(taskId, status);
  };

  const isDropTarget = dragOverStatus === status && draggedTaskId !== null;

  return (
    <section
      className={`kanban-column ${isDropTarget ? "kanban-column--drop-target" : ""}`}
      aria-label={`Colonne ${title}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="kanban-column__header">
        <h2 className="kanban-column__title">{title}</h2>
        <span className="badge badge--accent">{tasks.length}</span>
      </div>

      <div className="kanban-column__body">
        {tasks.length === 0 ? (
          <p className="kanban-column__empty">Aucune tâche {status === "done" ? "terminée" : "dans cette colonne"}.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectName={getProjectName(task.projectId)}
              isDragging={draggedTaskId === task.id}
              onClick={() => onTaskClick(task)}
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
            />
          ))
        )}
      </div>
    </section>
  );
}
