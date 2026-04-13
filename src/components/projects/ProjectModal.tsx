"use client";

import { useEffect, useRef, useState } from "react";
import type { Contact } from "@/features/contacts/types";
import type { Project, ProjectStatus, UpsertProjectInput } from "@/features/projects/types";
import type { TaskPriority, TaskStatus } from "@/features/tasks/types";

// -------------------------------------------------------
// Types
// -------------------------------------------------------
interface ProjectFormState {
  title: string;
  contactId: string;
  serviceType: string;
  status: ProjectStatus;
  shootDate: string;
  deliveryDate: string;
  amountQuoted: number;
  amountPaid: number;
  notes: string;
  isFree: boolean;
}

export interface ProjectFormData extends UpsertProjectInput {
  initialTasks?: ProjectTaskDraftData[];
}

export interface ProjectTaskDraftData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

const defaultFormState: ProjectFormState = {
  title: "",
  contactId: "",
  serviceType: "",
  status: "lead",
  shootDate: "",
  deliveryDate: "",
  amountQuoted: 0,
  amountPaid: 0,
  notes: "",
  isFree: false,
};

interface ProjectModalProps {
  isOpen: boolean;
  projectToEdit?: Project | null;
  contacts: Contact[];
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
}

const defaultTaskDraft: ProjectTaskDraftData = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
};

// -------------------------------------------------------
// Component
// -------------------------------------------------------
export default function ProjectModal({
  isOpen,
  projectToEdit,
  contacts,
  onClose,
  onSubmit,
}: ProjectModalProps) {
  const [form, setForm] = useState<ProjectFormState>(defaultFormState);
  const [initialTasks, setInitialTasks] = useState<ProjectTaskDraftData[]>([]);
  const [taskDraft, setTaskDraft] = useState<ProjectTaskDraftData>(defaultTaskDraft);
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Initialisation du form quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        const isFree = projectToEdit.amountQuoted <= 0 && projectToEdit.amountPaid <= 0;

        setForm({
          title: projectToEdit.title,
          contactId: projectToEdit.contactId ?? "",
          serviceType: projectToEdit.serviceType,
          status: projectToEdit.status,
          shootDate: projectToEdit.shootDate ?? "",
          deliveryDate: projectToEdit.deliveryDate ?? "",
          amountQuoted: projectToEdit.amountQuoted,
          amountPaid: projectToEdit.amountPaid,
          notes: projectToEdit.notes ?? "",
          isFree,
        });
        setInitialTasks([]);
        setTaskDraft(defaultTaskDraft);
      } else {
        setForm(defaultFormState);
        setInitialTasks([]);
        setTaskDraft(defaultTaskDraft);
      }
      setError("");
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [isOpen, projectToEdit]);

  // Fermer avec Echap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
        amountQuoted: checked ? 0 : prev.amountQuoted,
        amountPaid: checked ? 0 : prev.amountPaid,
      }));
    } else if (name === "amountQuoted" || name === "amountPaid") {
      setForm((prev) => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTaskDraftChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTaskDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInitialTask = () => {
    if (!taskDraft.title.trim()) {
      setError("Le titre d'une tâche initiale est obligatoire.");
      return;
    }

    const nextTask: ProjectTaskDraftData = {
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim(),
      status: taskDraft.status,
      priority: taskDraft.priority,
      dueDate: taskDraft.dueDate,
    };

    setInitialTasks((prev) => [...prev, nextTask]);
    setTaskDraft(defaultTaskDraft);
    setError("");
  };

  const handleRemoveInitialTask = (indexToRemove: number) => {
    setInitialTasks((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setError("Le titre du projet est obligatoire.");
      firstFieldRef.current?.focus();
      return;
    }

    const payload: ProjectFormData = {
      title,
      contactId: form.contactId.trim() || null,
      serviceType: form.serviceType.trim(),
      status: form.status,
      shootDate: form.shootDate.trim() || null,
      deliveryDate: form.deliveryDate.trim() || null,
      amountQuoted: form.isFree ? 0 : Math.max(0, form.amountQuoted),
      amountPaid: form.isFree ? 0 : Math.max(0, form.amountPaid),
      notes: form.notes.trim() || null,
    };

    if (!projectToEdit && initialTasks.length > 0) {
      payload.initialTasks = initialTasks;
    }

    onSubmit(payload);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un projet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">
            {projectToEdit ? "Modifier le projet" : "Nouveau projet"}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

          {/* Titre */}
          <div className="form-field">
            <label htmlFor="project-title" className="form-label">
              Titre du projet <span className="form-required">*</span>
            </label>
            <input
              ref={firstFieldRef}
              id="project-title"
              name="title"
              type="text"
              className="form-input"
              placeholder="Ex: Shooting Collection SS26"
              value={form.title}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>

          <div className="form-row">
            {/* Contact */}
            <div className="form-field">
              <label htmlFor="project-contact" className="form-label">Contact lié</label>
              <select
                id="project-contact"
                name="contactId"
                className="form-input"
                value={form.contactId}
                onChange={handleChange}
              >
                <option value="">Sans contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.organization ? `(${contact.organization})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="form-field">
              <label htmlFor="project-service" className="form-label">Type de service</label>
              <input
                id="project-service"
                name="serviceType"
                type="text"
                className="form-input"
                placeholder="Ex: Matchday, Corporate..."
                value={form.serviceType}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Statut */}
          <div className="form-field">
            <label htmlFor="project-status" className="form-label">Statut</label>
            <select
              id="project-status"
              name="status"
              className="form-input"
              value={form.status}
              onChange={handleChange}
            >
              <option value="lead">Lead</option>
              <option value="confirmed">Confirmé</option>
              <option value="in_progress">En cours</option>
              <option value="editing">Post-production</option>
              <option value="delivered">Livré</option>
              <option value="completed">Terminé / Payé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="project-shootDate" className="form-label">Date du shooting</label>
              <input
                id="project-shootDate"
                name="shootDate"
                type="date"
                className="form-input"
                value={form.shootDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-field">
              <label htmlFor="project-deliveryDate" className="form-label">Date de livraison</label>
              <input
                id="project-deliveryDate"
                name="deliveryDate"
                type="date"
                className="form-input"
                value={form.deliveryDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", marginBottom: "16px" }}>
            <input
              id="project-isFree"
              name="isFree"
              type="checkbox"
              checked={form.isFree}
              onChange={handleChange}
              style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }}
            />
            <label htmlFor="project-isFree" className="form-label" style={{ marginBottom: 0 }}>
              Projet non rémunéré (Partenariat, gratuit...)
            </label>
          </div>

          {/* Finances */}
          {!form.isFree && (
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="project-amountQuoted" className="form-label">Devis total (€)</label>
                <input
                  id="project-amountQuoted"
                  name="amountQuoted"
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.amountQuoted}
                  onChange={handleChange}
                />
              </div>
              <div className="form-field">
                <label htmlFor="project-amountPaid" className="form-label">Montant encaissé (€)</label>
                <input
                  id="project-amountPaid"
                  name="amountPaid"
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.amountPaid}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-field">
            <label htmlFor="project-notes" className="form-label">Notes</label>
            <textarea
              id="project-notes"
              name="notes"
              className="form-input form-textarea"
              placeholder="Informations supplémentaires..."
              rows={2}
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          {!projectToEdit && (
            <div
              className="form-field"
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "16px",
                marginTop: "16px",
              }}
            >
              <label className="form-label">Tâches initiales (optionnel)</label>

              <div className="form-field">
                <input
                  name="title"
                  type="text"
                  className="form-input"
                  placeholder="Titre de la tâche"
                  value={taskDraft.title}
                  onChange={handleTaskDraftChange}
                />
              </div>

              <div className="form-field">
                <textarea
                  name="description"
                  className="form-input form-textarea"
                  placeholder="Description (optionnel)"
                  rows={2}
                  value={taskDraft.description}
                  onChange={handleTaskDraftChange}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Statut</label>
                  <select
                    name="status"
                    className="form-input"
                    value={taskDraft.status}
                    onChange={handleTaskDraftChange}
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Priorité</label>
                  <select
                    name="priority"
                    className="form-input"
                    value={taskDraft.priority}
                    onChange={handleTaskDraftChange}
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Échéance</label>
                  <input
                    name="dueDate"
                    type="date"
                    className="form-input"
                    value={taskDraft.dueDate}
                    onChange={handleTaskDraftChange}
                  />
                </div>
                <div
                  className="form-field"
                  style={{ display: "flex", alignItems: "flex-end" }}
                >
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={handleAddInitialTask}
                    style={{ width: "100%" }}
                  >
                    + Ajouter la tâche
                  </button>
                </div>
              </div>

              {initialTasks.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {initialTasks.map((task, index) => (
                    <div
                      key={`${task.title}-${index}`}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 12px",
                        background: "var(--bg-elevated)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.title}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {task.status} · {task.priority}
                          {task.dueDate ? ` · ${task.dueDate}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => handleRemoveInitialTask(index)}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary">
              {projectToEdit ? "Enregistrer" : "Créer le projet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
