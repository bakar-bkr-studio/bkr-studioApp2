"use client";

import { useEffect, useMemo, useState } from "react";
import { NO_PROJECT_VALUE, type TaskFormData } from "@/components/tasks/TaskModal";
import type { Project } from "@/features/projects/types";
import type { Task } from "@/features/tasks/types";

interface TaskPreviewModalProps {
  isOpen: boolean;
  task: Task | null;
  projects: Project[];
  getProjectName: (projectId: string | null) => string;
  onClose: () => void;
  onUpdate: (taskId: string, data: TaskFormData) => void;
  onDelete: (taskId: string) => void;
}

const statusLabel: Record<Task["status"], string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

const priorityLabel: Record<Task["priority"], string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Urgente",
};

const statusBadgeClass: Record<Task["status"], string> = {
  todo: "badge badge--neutral",
  in_progress: "badge badge--amber",
  done: "badge badge--green",
};

const priorityBadgeClass: Record<Task["priority"], string> = {
  low: "badge badge--neutral",
  medium: "badge badge--amber",
  high: "badge badge--red",
};

function toFormData(task: Task): TaskFormData {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? "",
    projectId: task.projectId ?? NO_PROJECT_VALUE,
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function TaskPreviewModal({
  isOpen,
  task,
  projects,
  getProjectName,
  onClose,
  onUpdate,
  onDelete,
}: TaskPreviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<TaskFormData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && task) {
      setIsEditing(false);
      setForm(toFormData(task));
      setError("");
    }
  }, [isOpen, task]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const projectName = useMemo(
    () => getProjectName(task?.projectId ?? null),
    [getProjectName, task?.projectId]
  );

  if (!isOpen || !task || !form) return null;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Le titre de la tâche est obligatoire.");
      return;
    }

    onUpdate(task.id, form);
    onClose();
  };

  const handleDelete = () => {
    const confirmed = window.confirm("Supprimer définitivement cette tâche ?");
    if (!confirmed) return;

    onDelete(task.id);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu de la tâche"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-panel task-preview-modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "Modifier la tâche" : "Aperçu de la tâche"}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} noValidate>
            {error && (
              <div className="modal-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="task-preview-title" className="form-label">
                Titre <span className="form-required">*</span>
              </label>
              <input
                id="task-preview-title"
                name="title"
                type="text"
                className="form-input"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="task-preview-description" className="form-label">
                Description
              </label>
              <textarea
                id="task-preview-description"
                name="description"
                className="form-input form-textarea"
                rows={2}
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="task-preview-status" className="form-label">
                  Statut
                </label>
                <select
                  id="task-preview-status"
                  name="status"
                  className="form-input"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Terminé</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="task-preview-priority" className="form-label">
                  Priorité
                </label>
                <select
                  id="task-preview-priority"
                  name="priority"
                  className="form-input"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Urgente</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="task-preview-dueDate" className="form-label">
                  Échéance
                </label>
                <input
                  id="task-preview-dueDate"
                  name="dueDate"
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="task-preview-project" className="form-label">
                  Projet lié
                </label>
                <select
                  id="task-preview-project"
                  name="projectId"
                  className="form-input"
                  value={form.projectId}
                  onChange={handleChange}
                >
                  <option value={NO_PROJECT_VALUE}>Sans projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setIsEditing(false)}
              >
                Retour
              </button>
              <div className="task-preview__actions-right">
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={handleDelete}
                >
                  Supprimer
                </button>
                <button type="submit" className="btn btn--primary">
                  Enregistrer
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="task-preview">
            <h3 className="task-preview__title">{task.title}</h3>

            {task.description ? (
              <p className="task-preview__description">{task.description}</p>
            ) : (
              <p className="task-preview__description task-preview__description--empty">
                Aucune description
              </p>
            )}

            <div className="task-preview__chips">
              <span className={statusBadgeClass[task.status]}>{statusLabel[task.status]}</span>
              <span className={priorityBadgeClass[task.priority]}>
                {priorityLabel[task.priority]}
              </span>
              <span className="badge badge--accent">{projectName}</span>
              {task.dueDate && (
                <span className="badge badge--neutral">{formatDate(task.dueDate)}</span>
              )}
            </div>

            <div
              className="task-preview__meta-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "10px",
              }}
            >
              <div className="task-preview__meta-item">
                <p className="task-preview__meta-label">Statut</p>
                <p className="task-preview__meta-value">{statusLabel[task.status]}</p>
              </div>
              <div className="task-preview__meta-item">
                <p className="task-preview__meta-label">Priorité</p>
                <p className="task-preview__meta-value">{priorityLabel[task.priority]}</p>
              </div>
              <div className="task-preview__meta-item">
                <p className="task-preview__meta-label">Projet</p>
                <p className="task-preview__meta-value">{projectName}</p>
              </div>
              <div className="task-preview__meta-item">
                <p className="task-preview__meta-label">Échéance</p>
                <p className="task-preview__meta-value">
                  {task.dueDate ? formatDate(task.dueDate) : "Non définie"}
                </p>
              </div>
              <div className="task-preview__meta-item">
                <p className="task-preview__meta-label">Créée le</p>
                <p className="task-preview__meta-value">{formatDate(task.createdAt)}</p>
              </div>
              <div className="task-preview__meta-item">
                <p className="task-preview__meta-label">Mise à jour</p>
                <p className="task-preview__meta-value">{formatDate(task.updatedAt)}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                Fermer
              </button>
              <div className="task-preview__actions-right">
                <button type="button" className="btn btn--danger" onClick={handleDelete}>
                  Supprimer
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setIsEditing(true)}
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
