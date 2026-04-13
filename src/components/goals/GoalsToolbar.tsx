"use client";

import type { GoalHorizon, GoalStatus } from "@/features/goals/types";

interface GoalsToolbarProps {
  searchQuery: string;
  statusFilter: GoalStatus | "all";
  horizonFilter: GoalHorizon | "all";
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: GoalStatus | "all") => void;
  onHorizonFilterChange: (value: GoalHorizon | "all") => void;
}

const statusOptions: { value: GoalStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "completed", label: "Terminé" },
  { value: "at_risk", label: "À risque" },
  { value: "paused", label: "En pause" },
];

const horizonOptions: { value: GoalHorizon | "all"; label: string }[] = [
  { value: "all", label: "Tous les horizons" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
];

export default function GoalsToolbar({
  searchQuery,
  statusFilter,
  horizonFilter,
  onSearchChange,
  onStatusFilterChange,
  onHorizonFilterChange,
}: GoalsToolbarProps) {
  return (
    <div className="goals-toolbar">
      <div className="goals-search-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          className="goals-search"
          placeholder="Rechercher par titre ou description…"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Rechercher un objectif"
        />
      </div>

      <div className="goals-toolbar__filters">
        <label className="goals-toolbar__field">
          <span>Statut</span>
          <select
            className="form-input goals-select"
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as GoalStatus | "all")
            }
            aria-label="Filtrer par statut"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="goals-toolbar__field">
          <span>Horizon</span>
          <select
            className="form-input goals-select"
            value={horizonFilter}
            onChange={(event) =>
              onHorizonFilterChange(event.target.value as GoalHorizon | "all")
            }
            aria-label="Filtrer par horizon"
          >
            {horizonOptions.map((option) => (
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
