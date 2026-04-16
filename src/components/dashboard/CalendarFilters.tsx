"use client";

export type CalendarFilterKey = "task" | "project" | "goal";

export interface CalendarFiltersState {
  task: boolean;
  project: boolean;
  goal: boolean;
}

interface CalendarFiltersProps {
  filters: CalendarFiltersState;
  onChange: (key: CalendarFilterKey) => void;
}

const FILTER_CONFIG: {
  key: CalendarFilterKey;
  label: string;
  dotClass: string;
}[] = [
  { key: "task", label: "Tâches", dotClass: "cal-dot--task" },
  { key: "project", label: "Projets", dotClass: "cal-dot--project" },
  { key: "goal", label: "Objectifs", dotClass: "cal-dot--goal" },
];

export default function CalendarFilters({
  filters,
  onChange,
}: CalendarFiltersProps) {
  return (
    <div className="cal-filters" role="group" aria-label="Filtres d'événements">
      {FILTER_CONFIG.map(({ key, label, dotClass }) => (
        <button
          key={key}
          type="button"
          id={`cal-filter-${key}`}
          className={`cal-filter-btn${filters[key] ? " cal-filter-btn--active" : ""}`}
          onClick={() => onChange(key)}
          aria-pressed={filters[key]}
        >
          <span className={`cal-dot ${dotClass}`} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
