"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import KanbanColumn from "@/components/tasks/KanbanColumn";
import TaskModal, { NO_PROJECT_VALUE, type TaskFormData } from "@/components/tasks/TaskModal";
import TaskPreviewModal from "@/components/tasks/TaskPreviewModal";
import TasksSummary from "@/components/tasks/TasksSummary";
import TasksToolbar from "@/components/tasks/TasksToolbar";
import { listUserProjects } from "@/features/projects/api/projects";
import type { Project } from "@/features/projects/types";
import {
  createTask,
  deleteTask,
  listUserTasks,
  updateTask,
} from "@/features/tasks/api/tasks";
import type { Task, TaskPriority, TaskStatus, UpsertTaskInput } from "@/features/tasks/types";
import { useAuth } from "@/lib/auth/use-auth";
import { getTaskCounts, getTasksByStatus } from "@/lib/task-utils";

type StatusFilter = TaskStatus | "all";
type PriorityFilter = TaskPriority | "all";
type ProjectFilter = "all" | "without_project" | string;

interface TasksBoardProps {
  prefillProjectId?: string;
}

function toDateTime(value: string): number {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  return timestamp;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const byDate = toDateTime(b.createdAt) - toDateTime(a.createdAt);

    if (byDate !== 0) {
      return byDate;
    }

    return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
  });
}

function toTaskPayload(form: TaskFormData): UpsertTaskInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate || null,
    projectId: form.projectId && form.projectId !== NO_PROJECT_VALUE ? form.projectId : null,
  };
}

function logTasksError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Tasks] ${context}`, error);
  }
}

export default function TasksBoard({ prefillProjectId }: TasksBoardProps) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTasksAndProjects() {
      if (!user?.id) {
        if (isMounted) {
          setTasks([]);
          setProjectsData([]);
          setErrorMessage("Session utilisateur introuvable.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [loadedTasks, loadedProjects] = await Promise.all([
          listUserTasks(),
          listUserProjects(),
        ]);

        if (!isMounted) {
          return;
        }

        setTasks(loadedTasks);
        setProjectsData(loadedProjects);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logTasksError("Échec du chargement des tâches Firestore.", error);
        setTasks([]);
        setProjectsData([]);
        setErrorMessage("Impossible de charger les tâches depuis Firestore.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTasksAndProjects();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const projectNameById = useMemo(() => {
    return new Map(projectsData.map((project) => [project.id, project.title]));
  }, [projectsData]);

  const projectOptions = useMemo(
    () => [
      { value: "all" as const, label: "Tous les projets" },
      { value: "without_project" as const, label: "Sans projet" },
      ...projectsData
        .map((project) => ({ value: project.id, label: project.title }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    ],
    [projectsData]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      if (projectFilter === "without_project" && task.projectId) {
        return false;
      }

      if (
        projectFilter !== "all" &&
        projectFilter !== "without_project" &&
        task.projectId !== projectFilter
      ) {
        return false;
      }

      if (!searchQuery.trim()) {
        return true;
      }

      const query = searchQuery.trim().toLowerCase();
      const title = task.title.toLowerCase();
      const description = task.description?.toLowerCase() ?? "";

      return title.includes(query) || description.includes(query);
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter]);

  const counts = useMemo(() => getTaskCounts(filteredTasks), [filteredTasks]);
  const groupedTasks = useMemo(
    () => getTasksByStatus(filteredTasks),
    [filteredTasks]
  );

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    projectFilter !== "all";

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const getProjectName = (projectId: string | null) => {
    if (!projectId) {
      return "Sans projet";
    }

    return projectNameById.get(projectId) ?? "Sans projet";
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleOpenTaskPreview = (task: Task) => setSelectedTaskId(task.id);
  const handleCloseTaskPreview = () => setSelectedTaskId(null);

  const handleCreateTask = (form: TaskFormData) => {
    if (!user?.id || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    void (async () => {
      try {
        const createdTask = await createTask(toTaskPayload(form));
        setTasks((prev) => sortTasks([createdTask, ...prev]));
      } catch (error) {
        logTasksError("Échec de création d'une tâche Firestore.", error);
        setErrorMessage("Impossible de créer la tâche.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleUpdateTask = (taskId: string, form: TaskFormData) => {
    if (!user?.id || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    void (async () => {
      try {
        const updatedTask = await updateTask(taskId, toTaskPayload(form));
        setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
      } catch (error) {
        logTasksError("Échec de mise à jour d'une tâche Firestore.", error);
        setErrorMessage("Impossible d'enregistrer la tâche.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleDeleteTask = (taskId: string) => {
    if (!user?.id || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    void (async () => {
      try {
        await deleteTask(taskId);
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        setSelectedTaskId(null);
      } catch (error) {
        logTasksError("Échec de suppression d'une tâche Firestore.", error);
        setErrorMessage("Impossible de supprimer la tâche.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const moveTaskToStatus = (taskId: string, status: TaskStatus) => {
    if (!user?.id) {
      return;
    }

    let previousTasksSnapshot: Task[] = [];

    setTasks((prev) => {
      previousTasksSnapshot = prev;

      const draggedTask = prev.find((task) => task.id === taskId);
      if (!draggedTask || draggedTask.status === status) {
        return prev;
      }

      const updatedTask: Task = {
        ...draggedTask,
        status,
        updatedAt: new Date().toISOString(),
      };

      const tasksWithoutDragged = prev.filter((task) => task.id !== taskId);
      const insertionIndex = tasksWithoutDragged.findIndex(
        (task) => task.status === status
      );

      const nextTasks = [...tasksWithoutDragged];
      if (insertionIndex === -1) {
        nextTasks.push(updatedTask);
      } else {
        nextTasks.splice(insertionIndex, 0, updatedTask);
      }

      return nextTasks;
    });

    void (async () => {
      try {
        const persistedTask = await updateTask(taskId, { status });
        setTasks((prev) => prev.map((task) => (task.id === taskId ? persistedTask : task)));
      } catch (error) {
        logTasksError("Échec de changement de statut en Kanban.", error);
        setTasks(previousTasksSnapshot);
        setErrorMessage("Impossible de déplacer la tâche pour le moment.");
      }
    })();
  };

  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleColumnDragOver = (status: TaskStatus) => {
    setDragOverStatus((prev) => (prev === status ? prev : status));
  };

  const handleTaskDrop = (taskId: string, status: TaskStatus) => {
    moveTaskToStatus(taskId, status);
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  if (isLoading) {
    return (
      <>
        <div className="page-header">
          <h1>Tâches</h1>
          <p>Organisez votre workflow en vue Kanban par priorité, échéance et projet.</p>
        </div>

        <div className="section-card">
          <div className="section-card__body">
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Chargement des tâches...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tâches</h1>
          <p className="page-desc">
            Organisez votre workflow en vue Kanban par priorité, échéance et projet.
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenModal}>
          + Nouvelle tâche
        </button>
      </div>

      {isSaving && (
        <p
          style={{
            marginBottom: "12px",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}
        >
          Enregistrement de la tâche...
        </p>
      )}

      {errorMessage && (
        <div className="modal-error" role="alert">
          {errorMessage}
        </div>
      )}

      <TasksSummary counts={counts} />

      <TasksToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        projectFilter={projectFilter}
        projectOptions={projectOptions}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
        onProjectFilterChange={setProjectFilter}
      />

      {filteredTasks.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Aucune tâche trouvée"
            description={
              hasActiveFilters
                ? "Ajustez la recherche ou les filtres pour afficher des tâches."
                : "Aucune tâche disponible pour le moment."
            }
          />
        </div>
      ) : (
        <div className="kanban-grid">
          <KanbanColumn
            title="À faire"
            status="todo"
            tasks={groupedTasks.todo}
            draggedTaskId={draggedTaskId}
            dragOverStatus={dragOverStatus}
            getProjectName={getProjectName}
            onTaskClick={handleOpenTaskPreview}
            onTaskDragStart={handleTaskDragStart}
            onTaskDragEnd={handleTaskDragEnd}
            onColumnDragOver={handleColumnDragOver}
            onTaskDrop={handleTaskDrop}
          />
          <KanbanColumn
            title="En cours"
            status="in_progress"
            tasks={groupedTasks.in_progress}
            draggedTaskId={draggedTaskId}
            dragOverStatus={dragOverStatus}
            getProjectName={getProjectName}
            onTaskClick={handleOpenTaskPreview}
            onTaskDragStart={handleTaskDragStart}
            onTaskDragEnd={handleTaskDragEnd}
            onColumnDragOver={handleColumnDragOver}
            onTaskDrop={handleTaskDrop}
          />
          <KanbanColumn
            title="Terminé"
            status="done"
            tasks={groupedTasks.done}
            draggedTaskId={draggedTaskId}
            dragOverStatus={dragOverStatus}
            getProjectName={getProjectName}
            onTaskClick={handleOpenTaskPreview}
            onTaskDragStart={handleTaskDragStart}
            onTaskDragEnd={handleTaskDragEnd}
            onColumnDragOver={handleColumnDragOver}
            onTaskDrop={handleTaskDrop}
          />
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        projects={projectsData}
        prefillProjectId={prefillProjectId}
        onClose={handleCloseModal}
        onSubmit={handleCreateTask}
      />

      <TaskPreviewModal
        isOpen={selectedTask !== null}
        task={selectedTask}
        projects={projectsData}
        getProjectName={getProjectName}
        onClose={handleCloseTaskPreview}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </>
  );
}
