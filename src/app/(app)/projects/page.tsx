"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectModal, {
  type ProjectFormData,
  type ProjectTaskDraftData,
} from "@/components/projects/ProjectModal";
import ProjectsToolbar from "@/components/projects/ProjectsToolbar";
import StatCard from "@/components/StatCard";
import { listUserContacts } from "@/features/contacts/api/contacts";
import type { Contact } from "@/features/contacts/types";
import { createProject, listUserProjects } from "@/features/projects/api/projects";
import type { Project, ProjectStatus } from "@/features/projects/types";
import { createTask } from "@/features/tasks/api/tasks";
import type { UpsertTaskInput } from "@/features/tasks/types";
import { useAuth } from "@/lib/auth/use-auth";

function buildInitialTaskPayloads(
  drafts: ProjectTaskDraftData[],
  projectId: string
): UpsertTaskInput[] {
  return drafts.reduce<UpsertTaskInput[]>((payloads, draft) => {
    const title = draft.title.trim();

    if (!title) {
      return payloads;
    }

    payloads.push({
      title,
      description: draft.description.trim() || null,
      status: draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate || null,
      projectId,
    });

    return payloads;
  }, []);
}

function toDateTime(value: string): number {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  return timestamp;
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const byDate = toDateTime(b.createdAt) - toDateTime(a.createdAt);

    if (byDate !== 0) {
      return byDate;
    }

    return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
  });
}

function logProjectsError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Projects] ${context}`, error);
  }
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProjectsAndContacts() {
      if (!user?.id) {
        if (isMounted) {
          setProjects([]);
          setContacts([]);
          setErrorMessage("Session utilisateur introuvable.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [loadedProjects, loadedContacts] = await Promise.all([
          listUserProjects(),
          listUserContacts(),
        ]);

        if (!isMounted) {
          return;
        }

        setProjects(loadedProjects);
        setContacts(loadedContacts);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logProjectsError("Échec du chargement des projets Firestore.", error);
        setProjects([]);
        setContacts([]);
        setErrorMessage("Impossible de charger les projets depuis Firestore.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjectsAndContacts();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const contactsById = useMemo(() => {
    return new Map(contacts.map((contact) => [contact.id, contact]));
  }, [contacts]);

  const getContactName = (contactId: string | null) => {
    if (!contactId) {
      return "Sans contact";
    }

    const contact = contactsById.get(contactId);

    if (!contact) {
      return "Sans contact";
    }

    return contact.name || "Sans contact";
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }

      if (!searchQuery.trim()) {
        return true;
      }

      const query = searchQuery.toLowerCase();
      const contactName = getContactName(project.contactId).toLowerCase();
      const matchesTitle = project.title.toLowerCase().includes(query);
      const matchesContact = contactName.includes(query);
      const matchesService = project.serviceType.toLowerCase().includes(query);

      return matchesTitle || matchesContact || matchesService;
    });
  }, [projects, searchQuery, statusFilter, contactsById]);

  const handleOpenPreview = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleSubmitModal = (data: ProjectFormData) => {
    if (!user?.id || isSaving) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    void (async () => {
      try {
        const { initialTasks, ...projectFields } = data;
        const createdProject = await createProject(projectFields);

        if (initialTasks?.length) {
          const taskPayloads = buildInitialTaskPayloads(initialTasks, createdProject.id);
          if (taskPayloads.length > 0) {
            // userId/createdAt/updatedAt sont ajoutés côté API Firestore.
            const taskCreations = await Promise.allSettled(
              taskPayloads.map((taskPayload) => createTask(taskPayload))
            );
            const hasTaskCreationError = taskCreations.some(
              (result) => result.status === "rejected"
            );

            if (hasTaskCreationError) {
              logProjectsError(
                "Certaines tâches initiales du projet n'ont pas pu être créées.",
                taskCreations
              );
              setErrorMessage("Projet créé, mais certaines tâches initiales n'ont pas pu être enregistrées.");
            }
          }
        }

        setProjects((prev) => sortProjects([createdProject, ...prev]));
      } catch (error) {
        logProjectsError("Échec de la création d'un projet Firestore.", error);
        setErrorMessage("Impossible de créer le projet.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  if (isLoading) {
    return (
      <>
        <div className="page-header">
          <h1>Projets</h1>
          <p>Gérez vos missions clients : devis, suivi, livraison.</p>
        </div>

        <div className="section-card">
          <div className="section-card__body">
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Chargement des projets...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projets</h1>
          <p className="page-desc">Gérez vos missions clients : devis, suivi, livraison.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setIsModalOpen(true)} disabled={isSaving}>
          + Nouveau projet
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
          Enregistrement du projet...
        </p>
      )}

      {errorMessage && (
        <div className="modal-error" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "24px" }}>
        <StatCard
          label="Projets total"
          value={projects.length.toString()}
        />
        <StatCard
          label="Leads"
          value={projects.filter((project) => project.status === "lead").length.toString()}
        />
        <StatCard
          label="Confirmés"
          value={projects.filter((project) => project.status === "confirmed").length.toString()}
        />
        <StatCard
          label="En cours"
          value={projects.filter((project) => project.status === "in_progress").length.toString()}
        />
        <StatCard
          label="Sans devis"
          value={projects.filter((project) => project.amountQuoted <= 0).length.toString()}
        />
      </div>

      <ProjectsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {filteredProjects.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Aucun projet trouvé"
            description="Modifiez vos filtres ou ajoutez une nouvelle mission pour commencer."
          />
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              contactName={getContactName(project.contactId)}
              onClick={() => handleOpenPreview(project.id)}
            />
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        projectToEdit={null}
        contacts={contacts}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
      />
    </>
  );
}
