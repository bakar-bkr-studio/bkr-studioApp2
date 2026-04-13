"use client";

import { useEffect } from "react";
import type { Goal } from "@/features/goals/types";
import { getGoalProgress } from "@/lib/goal-utils";
import GoalProgressBar from "@/components/goals/GoalProgressBar";

interface GoalDetailsModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const horizonLabel: Record<Goal["horizon"], string> = {
  week: "Semaine",
  month: "Mois",
  quarter: "Trimestre",
  year: "Année",
};

const statusConfig: Record<Goal["status"], { label: string; badgeClass: string }> = {
  active: { label: "Actif", badgeClass: "badge badge--accent" },
  completed: { label: "Terminé", badgeClass: "badge badge--green" },
  at_risk: { label: "À risque", badgeClass: "badge badge--amber" },
  paused: { label: "En pause", badgeClass: "badge badge--neutral" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function GoalDetailsModal({
  goal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: GoalDetailsModalProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen || !goal) return null;

  const isQuantitative = goal.type === "quantitative";
  const hasTarget = typeof goal.targetValue === "number" && goal.targetValue > 0;
  const progress = getGoalProgress(goal);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu de l'objectif"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: "520px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span className="badge badge--neutral">{horizonLabel[goal.horizon]}</span>
            <span className={statusConfig[goal.status].badgeClass}>{statusConfig[goal.status].label}</span>
            <span className="badge badge--neutral">
              {isQuantitative ? "Quantitatif" : "Qualitatif"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => onEdit(goal)}
              className="btn-quick"
              title="Modifier"
              aria-label="Modifier l'objectif"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (confirm(`Voulez-vous vraiment supprimer "${goal.title}" ?`)) {
                  onDelete(goal.id);
                  onClose();
                }
              }}
              className="btn-quick"
              style={{ color: "var(--red)", borderColor: "var(--border)" }}
              title="Supprimer"
              aria-label="Supprimer l'objectif"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="btn-quick"
              title="Fermer"
              aria-label="Fermer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <h2 className="modal-title" style={{ fontSize: "20px", marginBottom: "6px" }}>
            {goal.title}
          </h2>
          {goal.description && (
            <p className="text-secondary" style={{ fontSize: "14px", lineHeight: 1.6 }}>
              {goal.description}
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          {goal.dueDate && (
            <div>
              <span className="form-label" style={{ marginBottom: 0 }}>Échéance</span>
              <div className="text-secondary" style={{ fontSize: "14px", marginTop: "4px" }}>
                {formatDate(goal.dueDate)}
              </div>
            </div>
          )}

          {isQuantitative ? (
            <div>
              <span className="form-label" style={{ marginBottom: 0 }}>Progression</span>
              {hasTarget ? (
                <div style={{ marginTop: "8px" }}>
                  <div className="goal-card__metrics" style={{ marginBottom: "8px" }}>
                    <span>
                      {goal.currentValue ?? 0} / {goal.targetValue}
                      {goal.unit ? ` ${goal.unit}` : ""}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <GoalProgressBar progress={progress} />
                </div>
              ) : (
                <p className="text-secondary" style={{ marginTop: "4px", fontSize: "14px" }}>
                  Cible quantitative non définie.
                </p>
              )}
            </div>
          ) : (
            <div>
              <span className="form-label" style={{ marginBottom: 0 }}>Suivi qualitatif</span>
              <p className="text-secondary" style={{ marginTop: "4px", fontSize: "14px", lineHeight: 1.6 }}>
                {goal.notes || "Aucune note de suivi pour le moment."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
