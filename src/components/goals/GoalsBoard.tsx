"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import GoalCard from "@/components/goals/GoalCard";
import GoalDetailsModal from "@/components/goals/GoalDetailsModal";
import GoalModal, { type GoalFormData } from "@/components/goals/GoalModal";
import GoalsSummary from "@/components/goals/GoalsSummary";
import GoalsToolbar from "@/components/goals/GoalsToolbar";
import {
  createGoal,
  deleteGoal,
  listUserGoals,
  updateGoal,
} from "@/features/goals/api/goals";
import type {
  Goal,
  GoalHorizon,
  GoalStatus,
  UpsertGoalInput,
} from "@/features/goals/types";
import { useAuth } from "@/lib/auth/use-auth";

function toDateTime(value: string): number {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  return timestamp;
}

function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const byDate = toDateTime(b.createdAt) - toDateTime(a.createdAt);

    if (byDate !== 0) {
      return byDate;
    }

    return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
  });
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toGoalPayload(form: GoalFormData): UpsertGoalInput {
  const isQuantitative = form.type === "quantitative";

  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    type: form.type,
    horizon: form.horizon,
    status: form.status,
    targetValue: isQuantitative ? parseOptionalNumber(form.targetValue) : null,
    currentValue: isQuantitative ? parseOptionalNumber(form.currentValue) : null,
    unit: isQuantitative ? form.unit.trim() || null : null,
    dueDate: form.dueDate || null,
    notes: form.notes.trim() || null,
  };
}

function logGoalsError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Goals] ${context}`, error);
  }
}

export default function GoalsBoard() {
  const { user } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GoalStatus | "all">("all");
  const [horizonFilter, setHorizonFilter] = useState<GoalHorizon | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadGoalsFromFirestore() {
      if (!user?.id) {
        if (isMounted) {
          setGoals([]);
          setErrorMessage("Session utilisateur introuvable.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const loadedGoals = await listUserGoals();

        if (!isMounted) {
          return;
        }

        setGoals(loadedGoals);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logGoalsError("Échec du chargement des objectifs Firestore.", error);
        setGoals([]);
        setErrorMessage("Impossible de charger les objectifs depuis Firestore.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadGoalsFromFirestore();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const filteredGoals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return goals.filter((goal) => {
      if (statusFilter !== "all" && goal.status !== statusFilter) {
        return false;
      }

      if (horizonFilter !== "all" && goal.horizon !== horizonFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const inTitle = goal.title.toLowerCase().includes(query);
      const inDescription = goal.description?.toLowerCase().includes(query) ?? false;
      return inTitle || inDescription;
    });
  }, [goals, searchQuery, statusFilter, horizonFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || statusFilter !== "all" || horizonFilter !== "all";

  const handleSubmitGoal = (form: GoalFormData) => {
    if (!user?.id || isSaving) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    void (async () => {
      try {
        const payload = toGoalPayload(form);

        if (goalToEdit) {
          const updatedGoal = await updateGoal(goalToEdit.id, payload);

          setGoals((prev) => prev.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal)));
          setSelectedGoal((prev) => (prev?.id === updatedGoal.id ? updatedGoal : prev));
          setGoalToEdit(null);
          return;
        }

        const createdGoal = await createGoal(payload);
        setGoals((prev) => sortGoals([createdGoal, ...prev]));
      } catch (error) {
        logGoalsError("Échec de création/mise à jour d'un objectif Firestore.", error);
        setErrorMessage("Impossible d'enregistrer l'objectif.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!user?.id || isSaving) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    void (async () => {
      try {
        await deleteGoal(goalId);

        setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
        setSelectedGoal((prev) => (prev?.id === goalId ? null : prev));
        setGoalToEdit((prev) => (prev?.id === goalId ? null : prev));
      } catch (error) {
        logGoalsError("Échec de suppression d'un objectif Firestore.", error);
        setErrorMessage("Impossible de supprimer l'objectif.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleOpenCreate = () => {
    setGoalToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setSelectedGoal(null);
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <>
        <div className="page-header">
          <h1>Objectifs</h1>
          <p>Suivez vos priorités business et créatives avec une vue claire par horizon.</p>
        </div>

        <div className="section-card">
          <div className="section-card__body">
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Chargement des objectifs...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Objectifs</h1>
          <p className="page-desc">
            Suivez vos priorités business et créatives avec une vue claire par horizon.
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenCreate} disabled={isSaving}>
          + Nouvel objectif
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
          Enregistrement de l'objectif...
        </p>
      )}

      {errorMessage && (
        <div className="modal-error" role="alert">
          {errorMessage}
        </div>
      )}

      <GoalsSummary goals={goals} />

      <GoalsToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        horizonFilter={horizonFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onHorizonFilterChange={setHorizonFilter}
      />

      {filteredGoals.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Aucun objectif trouvé"
            description={
              hasActiveFilters
                ? "Aucun objectif ne correspond à votre recherche ou vos filtres."
                : "Aucun objectif disponible pour le moment."
            }
          />
        </div>
      ) : (
        <div className="goals-grid">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => setSelectedGoal(goal)}
            />
          ))}
        </div>
      )}

      <GoalModal
        isOpen={isModalOpen}
        goalToEdit={goalToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setGoalToEdit(null);
        }}
        onSubmit={handleSubmitGoal}
      />

      <GoalDetailsModal
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteGoal}
      />
    </>
  );
}
