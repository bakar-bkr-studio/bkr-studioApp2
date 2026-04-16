"use client";

import type { CalendarEvent } from "./calendarHelpers";
import {
  buildMonthGrid,
  formatDateKey,
  WEEKDAY_LABELS,
  MONTH_LABELS,
} from "./calendarHelpers";
import type { CalendarFiltersState } from "./CalendarFilters";

interface CalendarGridProps {
  currentMonth: Date;
  onMonthChange: (direction: -1 | 1) => void;
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  activeFilters: CalendarFiltersState;
}

function getTodayKey(): string {
  const now = new Date();
  return formatDateKey(now);
}

/** Returns up to 3 unique source types for dot rendering (dedup by sourceType) */
function getDotsForDay(
  events: CalendarEvent[] | undefined,
  filters: CalendarFiltersState
): CalendarEvent["sourceType"][] {
  if (!events) return [];
  const seen = new Set<CalendarEvent["sourceType"]>();
  for (const e of events) {
    if (filters[e.sourceType]) seen.add(e.sourceType);
  }
  return Array.from(seen);
}

export default function CalendarGrid({
  currentMonth,
  onMonthChange,
  eventsByDate,
  selectedDate,
  onSelectDate,
  activeFilters,
}: CalendarGridProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const cells = buildMonthGrid(year, month);
  const todayKey = getTodayKey();

  const monthLabel = `${MONTH_LABELS[month] ?? ""} ${year}`;

  return (
    <div className="cal-card">
      {/* Header */}
      <div className="cal-header">
        <button
          id="cal-prev-month"
          type="button"
          className="cal-nav-btn"
          onClick={() => onMonthChange(-1)}
          aria-label="Mois précédent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="cal-month-label" aria-live="polite">
          {monthLabel}
        </span>

        <button
          id="cal-next-month"
          type="button"
          className="cal-nav-btn"
          onClick={() => onMonthChange(1)}
          aria-label="Mois suivant"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="cal-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="cal-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="cal-grid" role="grid" aria-label={`Calendrier ${monthLabel}`}>
        {cells.map((cellDate) => {
          const dateKey = formatDateKey(cellDate);
          const isCurrentMonth = cellDate.getMonth() === month;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const dots = getDotsForDay(eventsByDate.get(dateKey), activeFilters);
          const hasVisibleEvents = dots.length > 0;

          const classNames = [
            "cal-day",
            !isCurrentMonth && "cal-day--other-month",
            isToday && "cal-day--today",
            isSelected && "cal-day--selected",
            hasVisibleEvents && "cal-day--has-events",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={dateKey}
              type="button"
              id={`cal-day-${dateKey}`}
              className={classNames}
              onClick={() => onSelectDate(dateKey)}
              aria-label={`${cellDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}${hasVisibleEvents ? `, ${dots.length} type(s) d'échéance` : ""}`}
              aria-pressed={isSelected}
              role="gridcell"
              tabIndex={isCurrentMonth ? 0 : -1}
            >
              <span className="cal-day__num">{cellDate.getDate()}</span>
              {dots.length > 0 && (
                <span className="cal-day__dots" aria-hidden="true">
                  {dots.map((type) => (
                    <span key={type} className={`cal-dot cal-dot--${type}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
