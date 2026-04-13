"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/features/projects/types";
import type { TaskPriority, TaskStatus } from "@/features/tasks/types";

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId: string;
}

interface TaskModalProps {
  isOpen: boolean;
  projects: Project[];
  prefillProjectId?: string;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
}

const NO_PROJECT_VALUE = "__none__";

function getDefaultForm(prefillProjectId?: string): TaskFormData {
  return {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    projectId: prefillProjectId ?? NO_PROJECT_VALUE,
  };
}

export default function TaskModal({
  isOpen,
  projects,
  prefillProjectId,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [form, setForm] = useState<TaskFormData>(getDefaultForm(prefillProjectId));
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(getDefaultForm(prefillProjectId));
      setError("");
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [isOpen, prefillProjectId]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Le titre de la tâche est obligatoire.");
      firstFieldRef.current?.focus();
      return;
    }

    if (!form.status || !form.priority) {
      setError("Le statut et la priorité sont obligatoires.");
      return;
    }

    onSubmit(form);
    setForm(getDefaultForm(prefillProjectId));
    setError("");
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Créer une tâche"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">Nouvelle tâche</h2>
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

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="task-title" className="form-label">
              Titre <span className="form-required">*</span>
            </label>
            <input
              ref={firstFieldRef}
              id="task-title"
              name="title"
              type="text"
              className="form-input"
              placeholder="Ex: Envoyer devis événement corporate"
              value={form.title}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="task-description" className="form-label">Description</label>
            <textarea
              id="task-description"
              name="description"
              className="form-input form-textarea"
              placeholder="Détail optionnel de la tâche..."
              rows={2}
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="task-status" className="form-label">
                Statut <span className="form-required">*</span>
              </label>
              <select
                id="task-status"
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
              <label htmlFor="task-priority" className="form-label">
                Priorité <span className="form-required">*</span>
              </label>
              <select
                id="task-priority"
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
              <label htmlFor="task-dueDate" className="form-label">Échéance</label>
              <input
                id="task-dueDate"
                name="dueDate"
                type="date"
                className="form-input"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="task-projectId" className="form-label">Projet lié</label>
              <select
                id="task-projectId"
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
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary">
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { NO_PROJECT_VALUE };
