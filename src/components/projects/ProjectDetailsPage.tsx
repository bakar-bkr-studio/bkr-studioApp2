"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import ProjectModal, {
  type ProjectFormData,
  type ProjectTaskDraftData,
} from "@/components/projects/ProjectModal";
import { listUserContacts } from "@/features/contacts/api/contacts";
import type { Contact } from "@/features/contacts/types";
import {
  deleteProject,
  listUserProjects,
  updateProject,
} from "@/features/projects/api/projects";
import type { Project } from "@/features/projects/types";
import {
  createTask,
  deleteTask,
  listUserTasks,
  updateTask,
} from "@/features/tasks/api/tasks";
import type { Task, UpsertTaskInput } from "@/features/tasks/types";
import { useAuth } from "@/lib/auth/use-auth";

interface ProjectDetailsPageProps {
  projectId: string;
}

const statusLabel: Record<string, string> = {
  lead: "Lead",
  confirmed: "Confirmé",
  in_progress: "En cours",
  editing: "Post-prod",
  delivered: "Livré",
  completed: "Terminé",
  cancelled: "Annulé",
};

const statusBadgeClass: Record<string, string> = {
  lead: "badge badge--neutral",
  confirmed: "badge badge--accent",
  in_progress: "badge badge--amber",
  editing: "badge badge--purple",
  delivered: "badge badge--green",
  completed: "badge badge--green",
  cancelled: "badge badge--red",
};

function formatEuro(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return "Non définie";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toDateTime(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function toProjectTaskPayload(
  draft: ProjectTaskDraftData,
  projectId: string
): UpsertTaskInput {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    status: draft.status,
    priority: draft.priority,
    dueDate: draft.dueDate || null,
    projectId,
  };
}

function logProjectDetailsError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ProjectDetails] ${context}`, error);
  }
}

export default function ProjectDetailsPage({ projectId }: ProjectDetailsPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProjectTaskSaving, setIsProjectTaskSaving] = useState(false);
  const [isRefreshingTasks, setIsRefreshingTasks] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProjectAndContacts() {
      if (!user?.id) {
        if (isMounted) {
          setProject(null);
          setContacts([]);
          setErrorMessage("Session utilisateur introuvable.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [projects, loadedContacts, loadedTasks] = await Promise.all([
          listUserProjects(),
          listUserContacts(),
          listUserTasks(),
        ]);

        if (!isMounted) {
          return;
        }

        setProject(projects.find((item) => item.id === projectId) ?? null);
        setContacts(loadedContacts);
        setTasks(loadedTasks);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logProjectDetailsError("Échec du chargement du détail projet Firestore.", error);
        setProject(null);
        setContacts([]);
        setTasks([]);
        setErrorMessage("Impossible de charger le projet depuis Firestore.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjectAndContacts();

    return () => {
      isMounted = false;
    };
  }, [projectId, user?.id]);

  const contact = useMemo(() => {
    if (!project?.contactId) {
      return null;
    }

    return contacts.find((item) => item.id === project.contactId) ?? null;
  }, [contacts, project?.contactId]);

  const linkedTasks = useMemo(() => {
    if (!project) {
      return [];
    }

    return [...tasks]
      .filter((task) => task.projectId === project.id)
      .sort((a, b) => toDateTime(b.createdAt) - toDateTime(a.createdAt));
  }, [project, tasks]);

  const refreshTasksFromFirestore = async () => {
    if (!user?.id) {
      return;
    }

    setIsRefreshingTasks(true);
    try {
      const loadedTasks = await listUserTasks();
      setTasks(loadedTasks);
    } catch (error) {
      logProjectDetailsError("Échec du rechargement des tâches liées.", error);
      setErrorMessage("Impossible de recharger les tâches liées au projet.");
    } finally {
      setIsRefreshingTasks(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="page-header">
          <h1>Détail projet</h1>
          <p>Chargement du projet...</p>
        </div>

        <div className="section-card">
          <div className="section-card__body">
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Chargement des informations du projet...</p>
          </div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <div className="card">
        <EmptyState
          title={errorMessage ? "Erreur de chargement" : "Projet introuvable"}
          description={errorMessage || "Ce projet n'existe plus ou a été supprimé."}
        />
        <div style={{ marginTop: "14px", display: "flex", justifyContent: "center" }}>
          <Link href="/projects" className="btn btn--ghost">
            Retour aux projets
          </Link>
        </div>
      </div>
    );
  }

  const paymentRatio =
    project.amountQuoted > 0
      ? Math.min(100, Math.round((project.amountPaid / project.amountQuoted) * 100))
      : 0;

  const handleSubmitEdit = (data: ProjectFormData) => {
    if (!user?.id || !project || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    void (async () => {
      try {
        const { initialTasks: _initialTasks, ...projectFields } = data;
        const updated = await updateProject(project.id, projectFields);
        setProject(updated);
      } catch (error) {
        logProjectDetailsError("Échec de mise à jour d'un projet Firestore.", error);
        setErrorMessage("Impossible d'enregistrer les modifications du projet.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleDeleteProject = () => {
    if (!project || !user?.id || isSaving) {
      return;
    }

    const confirmed = window.confirm("Supprimer ce projet ? Cette action est irréversible.");

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    void (async () => {
      try {
        await deleteProject(project.id);
        router.push("/projects");
      } catch (error) {
        logProjectDetailsError("Échec de suppression d'un projet Firestore.", error);
        setErrorMessage("Impossible de supprimer le projet.");
        setIsSaving(false);
      }
    })();
  };

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
    void refreshTasksFromFirestore();
  };

  const handleCreateProjectTask = async (taskDraft: ProjectTaskDraftData) => {
    if (!user?.id || !project || isProjectTaskSaving) {
      return;
    }

    setIsProjectTaskSaving(true);
    setErrorMessage("");
    try {
      const createdTask = await createTask(toProjectTaskPayload(taskDraft, project.id));
      setTasks((prev) => [createdTask, ...prev]);
    } catch (error) {
      logProjectDetailsError("Échec d'ajout d'une tâche liée au projet.", error);
      setErrorMessage("Impossible d'ajouter la tâche au projet.");
      throw error;
    } finally {
      setIsProjectTaskSaving(false);
    }
  };

  const handleUpdateProjectTask = async (taskId: string, taskDraft: ProjectTaskDraftData) => {
    if (!user?.id || !project || isProjectTaskSaving) {
      return;
    }

    setIsProjectTaskSaving(true);
    setErrorMessage("");
    try {
      const updatedTask = await updateTask(taskId, toProjectTaskPayload(taskDraft, project.id));
      setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    } catch (error) {
      logProjectDetailsError("Échec de modification d'une tâche liée au projet.", error);
      setErrorMessage("Impossible de modifier la tâche du projet.");
      throw error;
    } finally {
      setIsProjectTaskSaving(false);
    }
  };

  const handleDeleteProjectTask = async (taskId: string) => {
    if (!user?.id || isProjectTaskSaving) {
      return;
    }

    setIsProjectTaskSaving(true);
    setErrorMessage("");
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      logProjectDetailsError("Échec de suppression d'une tâche liée au projet.", error);
      setErrorMessage("Impossible de supprimer la tâche du projet.");
      throw error;
    } finally {
      setIsProjectTaskSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Link href="/projects" className="project-details__back-link">
            ← Retour aux projets
          </Link>
          <h1 className="page-title">{project.title}</h1>
          <p className="page-desc">Aperçu complet du projet et actions rapides.</p>
        </div>
        <div className="project-details__actions">
          <button className="btn btn--ghost" onClick={handleOpenEditModal} disabled={isSaving}>
            Modifier
          </button>
          <button className="btn btn--danger" onClick={handleDeleteProject} disabled={isSaving}>
            Supprimer
          </button>
        </div>
      </div>

      {isSaving && (
        <p
          style={{
            marginBottom: "12px",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}
        >
          Enregistrement du projet...
        </p>
      )}

      {errorMessage && (
        <div className="modal-error" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="project-details__kpis">
        <div className="project-details__kpi">
          <p className="project-details__kpi-label">Statut</p>
          <span className={statusBadgeClass[project.status] ?? "badge badge--neutral"}>
            {statusLabel[project.status] ?? project.status}
          </span>
        </div>
        <div className="project-details__kpi">
          <p className="project-details__kpi-label">Devis</p>
          <p className="project-details__kpi-value">{formatEuro(project.amountQuoted)}</p>
        </div>
        <div className="project-details__kpi">
          <p className="project-details__kpi-label">Encaissé</p>
          <p className="project-details__kpi-value">{formatEuro(project.amountPaid)}</p>
        </div>
        <div className="project-details__kpi">
          <p className="project-details__kpi-label">Tâches liées</p>
          <p className="project-details__kpi-value">{linkedTasks.length}</p>
        </div>
      </div>

      <div className="project-details__grid">
        <section className="card">
          <h2 className="project-details__section-title">Informations</h2>
          <div className="project-details__info-list">
            <div className="project-details__info-item">
              <span>Contact</span>
              <strong>
                {!project.contactId
                  ? "Sans contact"
                  : contact
                    ? `${contact.name}${contact.organization ? ` (${contact.organization})` : ""}`
                    : "Sans contact"}
              </strong>
            </div>
            <div className="project-details__info-item">
              <span>Type de service</span>
              <strong>{project.serviceType || "Non défini"}</strong>
            </div>
            <div className="project-details__info-item">
              <span>Date de shooting</span>
              <strong>{formatDate(project.shootDate)}</strong>
            </div>
            <div className="project-details__info-item">
              <span>Date de livraison</span>
              <strong>{formatDate(project.deliveryDate)}</strong>
            </div>
            <div className="project-details__info-item">
              <span>Créé le</span>
              <strong>{formatDate(project.createdAt)}</strong>
            </div>
            <div className="project-details__info-item">
              <span>Mise à jour</span>
              <strong>{formatDate(project.updatedAt)}</strong>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="project-details__section-title">Finances</h2>
          {project.amountQuoted <= 0 ? (
            <p className="project-details__free-text">
              Projet sans devis (partenariat / gratuit).
            </p>
          ) : (
            <div className="project-details__finance">
              <div className="project-details__finance-row">
                <span>Progression de paiement</span>
                <strong>{paymentRatio}%</strong>
              </div>
              <div className="project-details__finance-bar">
                <div
                  className="project-details__finance-bar-value"
                  style={{ width: `${paymentRatio}%` }}
                />
              </div>
              <div className="project-details__finance-row">
                <span>Reste à encaisser</span>
                <strong>{formatEuro(Math.max(0, project.amountQuoted - project.amountPaid))}</strong>
              </div>
            </div>
          )}

          <h2 className="project-details__section-title" style={{ marginTop: "18px" }}>
            Notes
          </h2>
          <p className="project-details__notes">
            {project.notes?.trim() || "Aucune note pour ce projet."}
          </p>
        </section>
      </div>

      <section className="card" style={{ marginTop: "18px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <h2 className="project-details__section-title" style={{ margin: 0 }}>
            Tâches liées
          </h2>
          <Link href="/tasks" className="btn btn--ghost">
            Ouvrir les tâches
          </Link>
        </div>

        {isRefreshingTasks && (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            Actualisation des tâches...
          </p>
        )}

        {linkedTasks.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Aucune tâche liée à ce projet pour le moment.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {linkedTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                  background: "var(--bg-elevated)",
                }}
              >
                <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{task.title}</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {task.status} · {task.priority}
                  {task.dueDate ? ` · Échéance: ${formatDate(task.dueDate)}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <ProjectModal
        isOpen={isEditModalOpen}
        projectToEdit={project}
        projectTasks={linkedTasks}
        isProjectTasksLoading={isRefreshingTasks}
        isProjectTaskSaving={isProjectTaskSaving}
        onCreateProjectTask={handleCreateProjectTask}
        onUpdateProjectTask={handleUpdateProjectTask}
        onDeleteProjectTask={handleDeleteProjectTask}
        contacts={contacts}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSubmitEdit}
      />
    </>
  );
}
