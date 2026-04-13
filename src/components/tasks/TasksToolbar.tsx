"use client";

import type { TaskPriority, TaskStatus } from "@/features/tasks/types";

type StatusFilter = TaskStatus | "all";
type PriorityFilter = TaskPriority | "all";
type ProjectFilter = "all" | "without_project" | string;

interface ProjectFilterOption {
  value: ProjectFilter;
  label: string;
}

interface TasksToolbarProps {
  searchQuery: string;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  projectFilter: ProjectFilter;
  projectOptions: ProjectFilterOption[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  onProjectFilterChange: (value: ProjectFilter) => void;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

const priorityOptions: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Urgente" },
];

export default function TasksToolbar({
  searchQuery,
  statusFilter,
  priorityFilter,
  projectFilter,
  projectOptions,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onProjectFilterChange,
}: TasksToolbarProps) {
  return (
    <div className="tasks-toolbar">
      <div className="tasks-search-wrap">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          className="tasks-search"
          placeholder="Rechercher par titre ou description..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Rechercher une tâche"
        />
      </div>

      <div className="tasks-toolbar__filters">
        <label className="tasks-toolbar__field">
          <span>Statut</span>
          <select
            className="form-input tasks-select"
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as StatusFilter)
            }
            aria-label="Filtrer les tâches par statut"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="tasks-toolbar__field">
          <span>Priorité</span>
          <select
            className="form-input tasks-select"
            value={priorityFilter}
            onChange={(event) =>
              onPriorityFilterChange(event.target.value as PriorityFilter)
            }
            aria-label="Filtrer les tâches par priorité"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="tasks-toolbar__field">
          <span>Projet</span>
          <select
            className="form-input tasks-select"
            value={projectFilter}
            onChange={(event) => onProjectFilterChange(event.target.value)}
            aria-label="Filtrer les tâches par projet"
          >
            {projectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
