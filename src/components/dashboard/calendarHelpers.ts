import type { Task } from "@/features/tasks/types";
import type { Project } from "@/features/projects/types";
import type { Goal } from "@/features/goals/types";

// ─── CalendarEvent unified model ────────────────────────────────────────────

export type CalendarEventSourceType = "task" | "project" | "goal";
export type CalendarEventType = "due" | "shoot" | "delivery";

export interface CalendarEvent {
  /** Unique id (sourceType + relatedId + eventType) */
  id: string;
  sourceType: CalendarEventSourceType;
  /** Semantic type of the deadline */
  eventType: CalendarEventType;
  title: string;
  /** ISO date string YYYY-MM-DD */
  date: string;
  status?: string;
  relatedId: string;
  meta?: {
    priority?: Task["priority"];        // for tasks
    deadlineKind?: "shootDate" | "deliveryDate"; // for projects
    horizon?: Goal["horizon"];           // for goals
  };
}

// ─── Date normalisation ──────────────────────────────────────────────────────

/**
 * Converts any date string (ISO, YYYY-MM-DD…) to "YYYY-MM-DD". Returns null if invalid.
 */
export function toDateKey(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  // Already in YYYY-MM-DD form
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Builders ────────────────────────────────────────────────────────────────

function eventsFromTasks(tasks: Task[]): CalendarEvent[] {
  return tasks.flatMap((task) => {
    const date = toDateKey(task.dueDate);
    if (!date) return [];
    return [
      {
        id: `task-${task.id}-due`,
        sourceType: "task" as const,
        eventType: "due" as const,
        title: task.title,
        date,
        status: task.status,
        relatedId: task.id,
        meta: { priority: task.priority },
      },
    ];
  });
}

function eventsFromProjects(projects: Project[]): CalendarEvent[] {
  return projects.flatMap((project) => {
    const events: CalendarEvent[] = [];
    const shootDate = toDateKey(project.shootDate);
    if (shootDate) {
      events.push({
        id: `project-${project.id}-shoot`,
        sourceType: "project" as const,
        eventType: "shoot" as const,
        title: project.title,
        date: shootDate,
        status: project.status,
        relatedId: project.id,
        meta: { deadlineKind: "shootDate" },
      });
    }
    const deliveryDate = toDateKey(project.deliveryDate);
    if (deliveryDate) {
      events.push({
        id: `project-${project.id}-delivery`,
        sourceType: "project" as const,
        eventType: "delivery" as const,
        title: project.title,
        date: deliveryDate,
        status: project.status,
        relatedId: project.id,
        meta: { deadlineKind: "deliveryDate" },
      });
    }
    return events;
  });
}

function eventsFromGoals(goals: Goal[]): CalendarEvent[] {
  return goals.flatMap((goal) => {
    const date = toDateKey(goal.dueDate);
    if (!date) return [];
    return [
      {
        id: `goal-${goal.id}-due`,
        sourceType: "goal" as const,
        eventType: "due" as const,
        title: goal.title,
        date,
        status: goal.status,
        relatedId: goal.id,
        meta: { horizon: goal.horizon },
      },
    ];
  });
}

// ─── Main aggregation ────────────────────────────────────────────────────────

export function buildCalendarEvents(
  tasks: Task[],
  projects: Project[],
  goals: Goal[]
): CalendarEvent[] {
  return [
    ...eventsFromTasks(tasks),
    ...eventsFromProjects(projects),
    ...eventsFromGoals(goals),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

/** Index events by date key "YYYY-MM-DD" → CalendarEvent[] */
export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = map.get(event.date);
    if (existing) {
      existing.push(event);
    } else {
      map.set(event.date, [event]);
    }
  }
  return map;
}

// ─── Calendar grid helpers ────────────────────────────────────────────────────

/** Returns an array of {date: Date, isCurrentMonth: boolean} for the full 6-week grid. */
export function buildMonthGrid(year: number, month: number): Date[] {
  // month is 0-indexed (JS Date)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start on Monday (ISO week)
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0

  const cells: Date[] = [];
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDow);

  // Always render 6 rows × 7 cols = 42 cells
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }

  // Trim trailing rows that are entirely outside the month
  // Keep at least enough rows to show the full month
  const minCells = lastDay.getDate() + startDow;
  const rows = Math.ceil(minCells / 7);
  return cells.slice(0, rows * 7);
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const WEEKDAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
