import type { AppSettings, Goal, Project, Task, Transaction, UsefulLink } from "@/types";

const STORAGE_KEYS = {
  tasks: "bkr_studio_tasks_v1",
  projects: "bkr_studio_projects_v1",
  goals: "bkr_studio_goals_v1",
  transactions: "bkr_studio_transactions_v1",
  usefulLinks: "bkr_studio_useful_links_v1",
  settings: "bkr_studio_settings_v1",
} as const;

type StorageKey = keyof typeof STORAGE_KEYS;

const inMemoryStore: Partial<Record<StorageKey, unknown>> = {};

function cloneData<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data)) as T;
  } catch {
    return data;
  }
}

function readArrayFromStore<T>(key: StorageKey, fallback: T[]): T[] {
  const raw = inMemoryStore[key];
  if (!Array.isArray(raw)) return cloneData(fallback);
  return cloneData(raw as T[]);
}

function readObjectFromStore<T extends object>(key: StorageKey, fallback: T): T {
  const raw = inMemoryStore[key];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return cloneData(fallback);
  }
  return { ...cloneData(fallback), ...(raw as T) };
}

function writeArrayToStore<T>(key: StorageKey, data: T[]) {
  inMemoryStore[key] = cloneData(data);
}

function writeObjectToStore<T extends object>(key: StorageKey, data: T) {
  inMemoryStore[key] = cloneData(data);
}

export function loadTasks(fallback: Task[]): Task[] {
  return readArrayFromStore<Task>("tasks", fallback);
}

export function saveTasks(tasks: Task[]) {
  writeArrayToStore<Task>("tasks", tasks);
}

export function appendTasks(tasksToAppend: Task[], fallback: Task[]): Task[] {
  const currentTasks = loadTasks(fallback);
  const nextTasks = [...tasksToAppend, ...currentTasks];
  saveTasks(nextTasks);
  return nextTasks;
}

export function loadProjects(fallback: Project[]): Project[] {
  return readArrayFromStore<Project>("projects", fallback);
}

export function saveProjects(projects: Project[]) {
  writeArrayToStore<Project>("projects", projects);
}

export function loadGoals(fallback: Goal[]): Goal[] {
  return readArrayFromStore<Goal>("goals", fallback);
}

export function saveGoals(goals: Goal[]) {
  writeArrayToStore<Goal>("goals", goals);
}

export function loadTransactions(fallback: Transaction[]): Transaction[] {
  return readArrayFromStore<Transaction>("transactions", fallback);
}

export function saveTransactions(transactions: Transaction[]) {
  writeArrayToStore<Transaction>("transactions", transactions);
}

export function loadUsefulLinks(fallback: UsefulLink[]): UsefulLink[] {
  return readArrayFromStore<UsefulLink>("usefulLinks", fallback);
}

export function saveUsefulLinks(links: UsefulLink[]) {
  writeArrayToStore<UsefulLink>("usefulLinks", links);
}

export function loadSettings(fallback: AppSettings): AppSettings {
  return readObjectFromStore<AppSettings>("settings", fallback);
}

export function saveSettings(settings: AppSettings) {
  writeObjectToStore<AppSettings>("settings", settings);
}
