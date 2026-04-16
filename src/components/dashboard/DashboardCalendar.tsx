"use client";

import { useMemo, useState, useCallback } from "react";
import type { Task } from "@/features/tasks/types";
import type { Project } from "@/features/projects/types";
import type { Goal } from "@/features/goals/types";
import {
  buildCalendarEvents,
  groupEventsByDate,
} from "./calendarHelpers";
import CalendarGrid from "./CalendarGrid";
import CalendarEventList from "./CalendarEventList";
import CalendarFilters, {
  type CalendarFiltersState,
  type CalendarFilterKey,
} from "./CalendarFilters";

interface DashboardCalendarProps {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
}

const DEFAULT_FILTERS: CalendarFiltersState = {
  task: true,
  project: true,
  goal: true,
};

export default function DashboardCalendar({
  tasks,
  projects,
  goals,
}: DashboardCalendarProps) {
  // Current month displayed
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Selected date key "YYYY-MM-DD"
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Active filters
  const [filters, setFilters] = useState<CalendarFiltersState>(DEFAULT_FILTERS);

  // Aggregate all events from the 3 sources
  const calendarEvents = useMemo(
    () => buildCalendarEvents(tasks, projects, goals),
    [tasks, projects, goals]
  );

  // Index by date key
  const eventsByDate = useMemo(
    () => groupEventsByDate(calendarEvents),
    [calendarEvents]
  );

  // Events for the selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(selectedDate) ?? [];
  }, [eventsByDate, selectedDate]);

  const handleMonthChange = useCallback((direction: -1 | 1) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
  }, []);

  const handleFilterToggle = useCallback((key: CalendarFilterKey) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const hasAnyEvent = calendarEvents.length > 0;

  return (
    <div className="dashboard-cal">
      {/* Filters bar */}
      <CalendarFilters filters={filters} onChange={handleFilterToggle} />

      {!hasAnyEvent ? (
        /* Global empty state */
        <div className="cal-global-empty">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>Aucune échéance à afficher.</p>
          <span>
            Ajoutez des dates de tâches, projets ou objectifs pour les voir
            apparaître ici.
          </span>
        </div>
      ) : (
        /* Calendar layout: grid + event list side by side */
        <div className="cal-layout">
          <CalendarGrid
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            eventsByDate={eventsByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            activeFilters={filters}
          />
          <CalendarEventList
            date={selectedDate}
            events={selectedDayEvents}
            activeFilters={filters}
          />
        </div>
      )}
    </div>
  );
}
