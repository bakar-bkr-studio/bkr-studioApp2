"use client";

import type { CalendarEvent } from "./calendarHelpers";
import type { CalendarFiltersState } from "./CalendarFilters";

interface CalendarEventListProps {
  date: string | null;
  events: CalendarEvent[];
  activeFilters: CalendarFiltersState;
}

// ─── Labels ────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<CalendarEvent["sourceType"], string> = {
  task: "Tâche",
  project: "Projet",
  goal: "Objectif",
};

const SOURCE_BADGE_CLASS: Record<CalendarEvent["sourceType"], string> = {
  task: "cal-event-item__badge cal-event-item__badge--task",
  project: "cal-event-item__badge cal-event-item__badge--project",
  goal: "cal-event-item__badge cal-event-item__badge--goal",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Urgent",
  medium: "Moyen",
  low: "Faible",
};

const DEADLINE_KIND_LABELS: Record<string, string> = {
  shootDate: "Date de tournage",
  deliveryDate: "Date de livraison",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  completed: "Terminé",
  at_risk: "À risque",
  paused: "En pause",
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
  lead: "Lead",
  confirmed: "Confirmé",
  editing: "Montage",
  delivered: "Livré",
  cancelled: "Annulé",
};

const HORIZON_LABELS: Record<string, string> = {
  week: "Semaine",
  month: "Mois",
  quarter: "Trimestre",
  year: "Année",
};

// ─── Meta info resolver ────────────────────────────────────────────────────

function getSecondaryInfo(event: CalendarEvent): string {
  if (event.sourceType === "task") {
    const parts: string[] = [];
    if (event.meta?.priority) parts.push(PRIORITY_LABELS[event.meta.priority] ?? event.meta.priority);
    if (event.status) parts.push(STATUS_LABELS[event.status] ?? event.status);
    return parts.join(" · ");
  }
  if (event.sourceType === "project") {
    const parts: string[] = [];
    if (event.meta?.deadlineKind) {
      parts.push(DEADLINE_KIND_LABELS[event.meta.deadlineKind] ?? event.meta.deadlineKind);
    }
    if (event.status) parts.push(STATUS_LABELS[event.status] ?? event.status);
    return parts.join(" · ");
  }
  if (event.sourceType === "goal") {
    const parts: string[] = [];
    if (event.meta?.horizon) parts.push(`Horizon : ${HORIZON_LABELS[event.meta.horizon] ?? event.meta.horizon}`);
    if (event.status) parts.push(STATUS_LABELS[event.status] ?? event.status);
    return parts.join(" · ");
  }
  return "";
}

// ─── Date formatter ────────────────────────────────────────────────────────

function formatDisplayDate(dateKey: string): string {
  // dateKey is "YYYY-MM-DD"
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, (m ?? 1) - 1, d);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CalendarEventList({
  date,
  events,
  activeFilters,
}: CalendarEventListProps) {
  if (!date) {
    return (
      <div className="cal-event-list cal-event-list--empty">
        <span className="cal-event-list__hint">
          Sélectionnez un jour pour voir les échéances.
        </span>
      </div>
    );
  }

  const visibleEvents = events.filter((e) => activeFilters[e.sourceType]);

  return (
    <div className="cal-event-list" aria-label="Événements du jour sélectionné">
      <div className="cal-event-list__date" suppressHydrationWarning>
        {formatDisplayDate(date)}
      </div>

      {visibleEvents.length === 0 ? (
        <div className="cal-event-list__empty">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>Aucune échéance ce jour.</p>
        </div>
      ) : (
        <ul className="cal-event-items" role="list">
          {visibleEvents.map((event) => (
            <li key={event.id} className="cal-event-item">
              <span className={SOURCE_BADGE_CLASS[event.sourceType]}>
                {SOURCE_LABELS[event.sourceType]}
              </span>
              <span className="cal-event-item__title">{event.title}</span>
              <span className="cal-event-item__meta">{getSecondaryInfo(event)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
