"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import ProjectModal, { type ProjectFormData } from "@/components/projects/ProjectModal";
import { listUserContacts } from "@/features/contacts/api/contacts";
import type { Contact } from "@/features/contacts/types";
import {
  deleteProject,
  listUserProjects,
  updateProject,
} from "@/features/projects/api/projects";
import type { Project } from "@/features/projects/types";
import { listUserTasks } from "@/features/tasks/api/tasks";
import type { Task } from "@/features/tasks/types";
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

  const linkedTasks = useMemo(
    () => tasks.filter((task) => task.projectId === projectId),
    [tasks, projectId]
  );

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
          <button className="btn btn--ghost" onClick={() => setIsEditModalOpen(true)} disabled={isSaving}>
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

      <ProjectModal
        isOpen={isEditModalOpen}
        projectToEdit={project}
        contacts={contacts}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSubmitEdit}
      />
    </>
  );
}
