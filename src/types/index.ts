// ===========================================
// Types TypeScript — Modules V1 BKR Studio
// Conformes au masterplan PROJET_MASTERPLAN.md
// ===========================================

// --- Champs communs à tous les documents Firestore ---
interface FirestoreBase {
  id: string;
  userId: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// --- Types Particuliers ---
export type ProjectStatus = "lead" | "confirmed" | "in_progress" | "editing" | "delivered" | "completed" | "cancelled";

// --- Paramètres application ---
export type AppTheme = "dark" | "light" | "system";
export type AppLanguage = "fr" | "en";
export type CurrencyCode = "EUR" | "USD" | "NGN";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type DataMode = "mock" | "firebase";

export interface AppSettings {
  userId: string;
  theme: AppTheme;
  language: AppLanguage;
  currency: CurrencyCode;
  dateFormat: DateFormat;
  taskRemindersEnabled: boolean;
  goalRemindersEnabled: boolean;
  financeRemindersEnabled: boolean;
  dataMode: DataMode;
  appVersion: string;
  updatedAt: string; // ISO 8601
}

// --- Profil utilisateur (identité + activité) ---
export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  onboardingCompleted: boolean;
  businessName?: string;
  role?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  currency: CurrencyCode;
  bio?: string;
  avatarUrl?: string;
  dashboardNotes: string | null;
  usefulLinks: DashboardUsefulLink[];
  accountStatus: DataMode;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface DashboardUsefulLink {
  id: string;
  label: string;
  url: string;
  category: string | null;
  isPinned: boolean;
  openCount: number;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Projet ---
export interface Project extends FirestoreBase {
  title: string;
  contactId: string;
  serviceType: string;
  status: ProjectStatus;
  shootDate?: string;
  deliveryDate?: string;
  amountQuoted: number;
  amountPaid: number;
  notes?: string;
  isFree?: boolean;
}

// --- Tâche ---
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task extends FirestoreBase {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId?: string; // optionnel : liée à un projet
}

// --- Objectif ---
export type GoalType = "quantitative" | "qualitative";
export type GoalStatus = "active" | "completed" | "at_risk" | "paused";
export type GoalHorizon = "week" | "month" | "quarter" | "year";

export interface Goal extends FirestoreBase {
  title: string;
  description?: string;
  type: GoalType;
  horizon: GoalHorizon;
  status: GoalStatus;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  dueDate?: string;
  notes?: string;
}

// --- Transaction financière ---
export type TransactionType = "income" | "expense";
export type TransactionStatus = "completed" | "planned";
export type PaymentMethod =
  | "transfer"
  | "cash"
  | "card"
  | "mobile_money"
  | "other";

export interface Transaction extends FirestoreBase {
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  projectId?: string; // optionnel : liée à un projet
}

// --- Contact ---
export interface Contact extends FirestoreBase {
  firstName: string;
  lastName: string;
  type: "client" | "prospect" | "partner";
  organization?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

// --- Lien utile dashboard ---
export interface UsefulLink extends FirestoreBase {
  name: string;
  url: string;
  category?: string;
  isPinned: boolean;
  openCount: number;
  lastOpenedAt?: string;
}
