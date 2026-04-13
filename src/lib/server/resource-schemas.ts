import "server-only";

import type {
  Contact,
  ContactType,
  UpsertContactInput,
} from "@/features/contacts/types";
import type {
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  UpsertTransactionInput,
} from "@/features/finances/types";
import type {
  Goal,
  GoalHorizon,
  GoalStatus,
  GoalType,
  UpsertGoalInput,
} from "@/features/goals/types";
import type {
  Project,
  ProjectStatus,
  UpsertProjectInput,
} from "@/features/projects/types";
import type {
  Task,
  TaskPriority,
  TaskStatus,
  UpsertTaskInput,
} from "@/features/tasks/types";
import type {
  CurrencyCode,
  DashboardUsefulLink,
  UserProfile,
} from "@/types";
import { ValidationError } from "@/lib/server/errors";

type AnyRecord = Record<string, unknown>;
type NullableText = string | null;

const CONTACT_TYPES: ContactType[] = ["client", "prospect", "partner"];
const PROJECT_STATUS: ProjectStatus[] = [
  "lead",
  "confirmed",
  "in_progress",
  "editing",
  "delivered",
  "completed",
  "cancelled",
];
const TASK_STATUS: TaskStatus[] = ["todo", "in_progress", "done"];
const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
const GOAL_TYPES: GoalType[] = ["quantitative", "qualitative"];
const GOAL_HORIZONS: GoalHorizon[] = ["week", "month", "quarter", "year"];
const GOAL_STATUS: GoalStatus[] = ["active", "completed", "at_risk", "paused"];
const TRANSACTION_TYPES: TransactionType[] = ["income", "expense"];
const TRANSACTION_STATUS: TransactionStatus[] = ["completed", "planned"];
const PAYMENT_METHODS: PaymentMethod[] = [
  "transfer",
  "cash",
  "card",
  "mobile_money",
  "other",
];
const SUPPORTED_CURRENCIES: CurrencyCode[] = ["EUR", "USD", "NGN"];

export const RESOURCE_NAMES = [
  "contacts",
  "projects",
  "tasks",
  "goals",
  "transactions",
] as const;

export type ResourceName = (typeof RESOURCE_NAMES)[number];

function ensureObject(value: unknown, context: string): AnyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`Payload invalide (${context}).`);
  }

  return value as AnyRecord;
}

function hasOwn(source: AnyRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function assertAllowedKeys(source: AnyRecord, allowedKeys: readonly string[]) {
  const unexpected = Object.keys(source).filter((key) => !allowedKeys.includes(key));
  if (unexpected.length > 0) {
    throw new ValidationError(
      `Champs non autorisés: ${unexpected.join(", ")}.`,
      "validation/unexpected-field"
    );
  }
}

function toRequiredString(
  value: unknown,
  field: string,
  maxLen = 300
): string {
  if (typeof value !== "string") {
    throw new ValidationError(`Le champ "${field}" est requis.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new ValidationError(`Le champ "${field}" est requis.`);
  }

  if (normalized.length > maxLen) {
    throw new ValidationError(`Le champ "${field}" dépasse ${maxLen} caractères.`);
  }

  return normalized;
}

function toNullableString(
  value: unknown,
  field: string,
  maxLen = 4000
): NullableText {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`Le champ "${field}" doit être une chaîne.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLen) {
    throw new ValidationError(`Le champ "${field}" dépasse ${maxLen} caractères.`);
  }

  return normalized;
}

function safeNullableString(value: unknown): NullableText {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toRequiredNumber(value: unknown, field: string, min?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`Le champ "${field}" doit être un nombre.`);
  }

  if (typeof min === "number" && value < min) {
    throw new ValidationError(`Le champ "${field}" doit être >= ${min}.`);
  }

  return value;
}

function toNullableNumber(value: unknown, field: string): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`Le champ "${field}" doit être un nombre.`);
  }

  return value;
}

function toRequiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError(`Le champ "${field}" doit être un booléen.`);
  }

  return value;
}

function toEnumValue<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(
      `Valeur invalide pour "${field}". Valeurs autorisées: ${allowed.join(", ")}.`
    );
  }

  return value as T;
}

function toOptionalDateString(value: unknown, field: string): string | null {
  const normalized = toNullableString(value, field, 120);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`Le champ "${field}" doit être une date valide.`);
  }

  return normalized;
}

function isoFromUnknown(value: unknown, fallback: string) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return date.toISOString();
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function normalizeContactLikeRecord(data: AnyRecord, id: string): Contact {
  const nowIso = new Date().toISOString();
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    name: typeof data.name === "string" ? data.name : "",
    type: CONTACT_TYPES.includes(data.type as ContactType)
      ? (data.type as ContactType)
      : "prospect",
    organization: safeNullableString(data.organization),
    email: safeNullableString(data.email),
    phone: safeNullableString(data.phone),
    notes: safeNullableString(data.notes),
    createdAt: isoFromUnknown(data.createdAt, nowIso),
    updatedAt: isoFromUnknown(data.updatedAt, nowIso),
  };
}

function normalizeProjectLikeRecord(data: AnyRecord, id: string): Project {
  const nowIso = new Date().toISOString();
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    title: typeof data.title === "string" ? data.title : "",
    contactId: safeNullableString(data.contactId),
    serviceType: typeof data.serviceType === "string" ? data.serviceType : "",
    status: PROJECT_STATUS.includes(data.status as ProjectStatus)
      ? (data.status as ProjectStatus)
      : "lead",
    shootDate: safeNullableString(data.shootDate),
    deliveryDate: safeNullableString(data.deliveryDate),
    amountQuoted:
      typeof data.amountQuoted === "number" && Number.isFinite(data.amountQuoted)
        ? data.amountQuoted
        : 0,
    amountPaid:
      typeof data.amountPaid === "number" && Number.isFinite(data.amountPaid)
        ? data.amountPaid
        : 0,
    notes: safeNullableString(data.notes),
    createdAt: isoFromUnknown(data.createdAt, nowIso),
    updatedAt: isoFromUnknown(data.updatedAt, nowIso),
  };
}

function normalizeTaskLikeRecord(data: AnyRecord, id: string): Task {
  const nowIso = new Date().toISOString();
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    title: typeof data.title === "string" ? data.title : "",
    description: safeNullableString(data.description),
    status: TASK_STATUS.includes(data.status as TaskStatus)
      ? (data.status as TaskStatus)
      : "todo",
    priority: TASK_PRIORITIES.includes(data.priority as TaskPriority)
      ? (data.priority as TaskPriority)
      : "medium",
    dueDate: safeNullableString(data.dueDate),
    projectId: safeNullableString(data.projectId),
    createdAt: isoFromUnknown(data.createdAt, nowIso),
    updatedAt: isoFromUnknown(data.updatedAt, nowIso),
  };
}

function normalizeGoalLikeRecord(data: AnyRecord, id: string): Goal {
  const nowIso = new Date().toISOString();
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    title: typeof data.title === "string" ? data.title : "",
    description: safeNullableString(data.description),
    type: GOAL_TYPES.includes(data.type as GoalType)
      ? (data.type as GoalType)
      : "quantitative",
    horizon: GOAL_HORIZONS.includes(data.horizon as GoalHorizon)
      ? (data.horizon as GoalHorizon)
      : "month",
    status: GOAL_STATUS.includes(data.status as GoalStatus)
      ? (data.status as GoalStatus)
      : "active",
    targetValue: toNullableNumber(data.targetValue, "targetValue"),
    currentValue: toNullableNumber(data.currentValue, "currentValue"),
    unit: safeNullableString(data.unit),
    dueDate: safeNullableString(data.dueDate),
    notes: safeNullableString(data.notes),
    createdAt: isoFromUnknown(data.createdAt, nowIso),
    updatedAt: isoFromUnknown(data.updatedAt, nowIso),
  };
}

function normalizeTransactionLikeRecord(data: AnyRecord, id: string): Transaction {
  const nowIso = new Date().toISOString();
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    type: TRANSACTION_TYPES.includes(data.type as TransactionType)
      ? (data.type as TransactionType)
      : "income",
    status: TRANSACTION_STATUS.includes(data.status as TransactionStatus)
      ? (data.status as TransactionStatus)
      : "completed",
    title: typeof data.title === "string" ? data.title : "",
    category: typeof data.category === "string" ? data.category : "",
    amount: typeof data.amount === "number" && Number.isFinite(data.amount) ? data.amount : 0,
    date: typeof data.date === "string" ? data.date : "",
    paymentMethod: PAYMENT_METHODS.includes(data.paymentMethod as PaymentMethod)
      ? (data.paymentMethod as PaymentMethod)
      : "transfer",
    projectId: safeNullableString(data.projectId),
    notes: safeNullableString(data.notes),
    createdAt: isoFromUnknown(data.createdAt, nowIso),
    updatedAt: isoFromUnknown(data.updatedAt, nowIso),
  };
}

export function mapResourceRecord(
  resource: ResourceName,
  id: string,
  data: AnyRecord
): Contact | Project | Task | Goal | Transaction {
  switch (resource) {
    case "contacts":
      return normalizeContactLikeRecord(data, id);
    case "projects":
      return normalizeProjectLikeRecord(data, id);
    case "tasks":
      return normalizeTaskLikeRecord(data, id);
    case "goals":
      return normalizeGoalLikeRecord(data, id);
    case "transactions":
      return normalizeTransactionLikeRecord(data, id);
    default:
      throw new ValidationError("Ressource non supportée.");
  }
}

export function getResourceSortField(resource: ResourceName) {
  switch (resource) {
    case "transactions":
      return "date";
    default:
      return "createdAt";
  }
}

export function getCollectionName(resource: ResourceName) {
  return resource;
}

export function sanitizeResourceCreate(
  resource: ResourceName,
  payload: unknown
): AnyRecord {
  const data = ensureObject(payload, `create:${resource}`);

  switch (resource) {
    case "contacts": {
      assertAllowedKeys(data, ["name", "type", "organization", "email", "phone", "notes"]);
      const parsed: UpsertContactInput = {
        name: toRequiredString(data.name, "name", 160),
        type: toEnumValue(data.type, "type", CONTACT_TYPES),
        organization: toNullableString(data.organization, "organization", 240),
        email: toNullableString(data.email, "email", 240),
        phone: toNullableString(data.phone, "phone", 80),
        notes: toNullableString(data.notes, "notes", 2000),
      };

      return {
        name: parsed.name,
        type: parsed.type,
        organization: parsed.organization ?? null,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        notes: parsed.notes ?? null,
      };
    }

    case "projects": {
      assertAllowedKeys(data, [
        "title",
        "contactId",
        "serviceType",
        "status",
        "shootDate",
        "deliveryDate",
        "amountQuoted",
        "amountPaid",
        "notes",
      ]);

      const parsed: UpsertProjectInput = {
        title: toRequiredString(data.title, "title", 200),
        contactId: toNullableString(data.contactId, "contactId", 120),
        serviceType: toRequiredString(data.serviceType, "serviceType", 200),
        status: toEnumValue(data.status, "status", PROJECT_STATUS),
        shootDate: toOptionalDateString(data.shootDate, "shootDate"),
        deliveryDate: toOptionalDateString(data.deliveryDate, "deliveryDate"),
        amountQuoted: toRequiredNumber(data.amountQuoted, "amountQuoted", 0),
        amountPaid: toRequiredNumber(data.amountPaid, "amountPaid", 0),
        notes: toNullableString(data.notes, "notes", 2000),
      };

      return {
        title: parsed.title,
        contactId: parsed.contactId ?? null,
        serviceType: parsed.serviceType,
        status: parsed.status,
        shootDate: parsed.shootDate ?? null,
        deliveryDate: parsed.deliveryDate ?? null,
        amountQuoted: parsed.amountQuoted,
        amountPaid: parsed.amountPaid,
        notes: parsed.notes ?? null,
      };
    }

    case "tasks": {
      assertAllowedKeys(data, [
        "title",
        "description",
        "status",
        "priority",
        "dueDate",
        "projectId",
      ]);

      const parsed: UpsertTaskInput = {
        title: toRequiredString(data.title, "title", 200),
        description: toNullableString(data.description, "description", 2000),
        status: toEnumValue(data.status, "status", TASK_STATUS),
        priority: toEnumValue(data.priority, "priority", TASK_PRIORITIES),
        dueDate: toOptionalDateString(data.dueDate, "dueDate"),
        projectId: toNullableString(data.projectId, "projectId", 120),
      };

      return {
        title: parsed.title,
        description: parsed.description ?? null,
        status: parsed.status,
        priority: parsed.priority,
        dueDate: parsed.dueDate ?? null,
        projectId: parsed.projectId ?? null,
      };
    }

    case "goals": {
      assertAllowedKeys(data, [
        "title",
        "description",
        "type",
        "horizon",
        "status",
        "targetValue",
        "currentValue",
        "unit",
        "dueDate",
        "notes",
      ]);

      const type = toEnumValue(data.type, "type", GOAL_TYPES);
      const targetValue = type === "quantitative"
        ? toNullableNumber(data.targetValue, "targetValue")
        : null;
      const currentValue = type === "quantitative"
        ? toNullableNumber(data.currentValue, "currentValue")
        : null;
      const unit = type === "quantitative"
        ? toNullableString(data.unit, "unit", 120)
        : null;

      const parsed: UpsertGoalInput = {
        title: toRequiredString(data.title, "title", 200),
        description: toNullableString(data.description, "description", 2000),
        type,
        horizon: toEnumValue(data.horizon, "horizon", GOAL_HORIZONS),
        status: toEnumValue(data.status, "status", GOAL_STATUS),
        targetValue,
        currentValue,
        unit,
        dueDate: toOptionalDateString(data.dueDate, "dueDate"),
        notes: toNullableString(data.notes, "notes", 2000),
      };

      return {
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type,
        horizon: parsed.horizon,
        status: parsed.status,
        targetValue: parsed.targetValue ?? null,
        currentValue: parsed.currentValue ?? null,
        unit: parsed.unit ?? null,
        dueDate: parsed.dueDate ?? null,
        notes: parsed.notes ?? null,
      };
    }

    case "transactions": {
      assertAllowedKeys(data, [
        "type",
        "status",
        "title",
        "category",
        "amount",
        "date",
        "paymentMethod",
        "projectId",
        "notes",
      ]);

      const parsed: UpsertTransactionInput = {
        type: toEnumValue(data.type, "type", TRANSACTION_TYPES),
        status: toEnumValue(data.status, "status", TRANSACTION_STATUS),
        title: toRequiredString(data.title, "title", 200),
        category: toRequiredString(data.category, "category", 120),
        amount: toRequiredNumber(data.amount, "amount", 0),
        date: toRequiredString(data.date, "date", 120),
        paymentMethod: toEnumValue(data.paymentMethod, "paymentMethod", PAYMENT_METHODS),
        projectId: toNullableString(data.projectId, "projectId", 120),
        notes: toNullableString(data.notes, "notes", 2000),
      };

      const parsedDate = new Date(parsed.date);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new ValidationError('Le champ "date" doit être une date valide.');
      }

      return {
        type: parsed.type,
        status: parsed.status,
        title: parsed.title,
        category: parsed.category,
        amount: parsed.amount,
        date: parsed.date,
        paymentMethod: parsed.paymentMethod,
        projectId: parsed.projectId ?? null,
        notes: parsed.notes ?? null,
      };
    }
  }
}

function sanitizePatch(data: AnyRecord, allowedKeys: readonly string[]) {
  assertAllowedKeys(data, allowedKeys);

  if (Object.keys(data).length === 0) {
    throw new ValidationError("Aucune modification à appliquer.");
  }
}

export function sanitizeResourceUpdate(
  resource: ResourceName,
  payload: unknown
): AnyRecord {
  const data = ensureObject(payload, `update:${resource}`);

  switch (resource) {
    case "contacts": {
      sanitizePatch(data, ["name", "type", "organization", "email", "phone", "notes"]);
      const patch: AnyRecord = {};
      if (hasOwn(data, "name")) patch.name = toRequiredString(data.name, "name", 160);
      if (hasOwn(data, "type")) patch.type = toEnumValue(data.type, "type", CONTACT_TYPES);
      if (hasOwn(data, "organization")) patch.organization = toNullableString(data.organization, "organization", 240);
      if (hasOwn(data, "email")) patch.email = toNullableString(data.email, "email", 240);
      if (hasOwn(data, "phone")) patch.phone = toNullableString(data.phone, "phone", 80);
      if (hasOwn(data, "notes")) patch.notes = toNullableString(data.notes, "notes", 2000);
      return patch;
    }

    case "projects": {
      sanitizePatch(data, [
        "title",
        "contactId",
        "serviceType",
        "status",
        "shootDate",
        "deliveryDate",
        "amountQuoted",
        "amountPaid",
        "notes",
      ]);
      const patch: AnyRecord = {};
      if (hasOwn(data, "title")) patch.title = toRequiredString(data.title, "title", 200);
      if (hasOwn(data, "contactId")) patch.contactId = toNullableString(data.contactId, "contactId", 120);
      if (hasOwn(data, "serviceType")) patch.serviceType = toRequiredString(data.serviceType, "serviceType", 200);
      if (hasOwn(data, "status")) patch.status = toEnumValue(data.status, "status", PROJECT_STATUS);
      if (hasOwn(data, "shootDate")) patch.shootDate = toOptionalDateString(data.shootDate, "shootDate");
      if (hasOwn(data, "deliveryDate")) patch.deliveryDate = toOptionalDateString(data.deliveryDate, "deliveryDate");
      if (hasOwn(data, "amountQuoted")) patch.amountQuoted = toRequiredNumber(data.amountQuoted, "amountQuoted", 0);
      if (hasOwn(data, "amountPaid")) patch.amountPaid = toRequiredNumber(data.amountPaid, "amountPaid", 0);
      if (hasOwn(data, "notes")) patch.notes = toNullableString(data.notes, "notes", 2000);
      return patch;
    }

    case "tasks": {
      sanitizePatch(data, [
        "title",
        "description",
        "status",
        "priority",
        "dueDate",
        "projectId",
      ]);
      const patch: AnyRecord = {};
      if (hasOwn(data, "title")) patch.title = toRequiredString(data.title, "title", 200);
      if (hasOwn(data, "description")) patch.description = toNullableString(data.description, "description", 2000);
      if (hasOwn(data, "status")) patch.status = toEnumValue(data.status, "status", TASK_STATUS);
      if (hasOwn(data, "priority")) patch.priority = toEnumValue(data.priority, "priority", TASK_PRIORITIES);
      if (hasOwn(data, "dueDate")) patch.dueDate = toOptionalDateString(data.dueDate, "dueDate");
      if (hasOwn(data, "projectId")) patch.projectId = toNullableString(data.projectId, "projectId", 120);
      return patch;
    }

    case "goals": {
      sanitizePatch(data, [
        "title",
        "description",
        "type",
        "horizon",
        "status",
        "targetValue",
        "currentValue",
        "unit",
        "dueDate",
        "notes",
      ]);
      const patch: AnyRecord = {};
      if (hasOwn(data, "title")) patch.title = toRequiredString(data.title, "title", 200);
      if (hasOwn(data, "description")) patch.description = toNullableString(data.description, "description", 2000);
      if (hasOwn(data, "type")) patch.type = toEnumValue(data.type, "type", GOAL_TYPES);
      if (hasOwn(data, "horizon")) patch.horizon = toEnumValue(data.horizon, "horizon", GOAL_HORIZONS);
      if (hasOwn(data, "status")) patch.status = toEnumValue(data.status, "status", GOAL_STATUS);
      if (hasOwn(data, "targetValue")) patch.targetValue = toNullableNumber(data.targetValue, "targetValue");
      if (hasOwn(data, "currentValue")) patch.currentValue = toNullableNumber(data.currentValue, "currentValue");
      if (hasOwn(data, "unit")) patch.unit = toNullableString(data.unit, "unit", 120);
      if (hasOwn(data, "dueDate")) patch.dueDate = toOptionalDateString(data.dueDate, "dueDate");
      if (hasOwn(data, "notes")) patch.notes = toNullableString(data.notes, "notes", 2000);

      const nextType = patch.type;
      if (nextType === "qualitative") {
        patch.targetValue = null;
        patch.currentValue = null;
        patch.unit = null;
      }

      return patch;
    }

    case "transactions": {
      sanitizePatch(data, [
        "type",
        "status",
        "title",
        "category",
        "amount",
        "date",
        "paymentMethod",
        "projectId",
        "notes",
      ]);
      const patch: AnyRecord = {};
      if (hasOwn(data, "type")) patch.type = toEnumValue(data.type, "type", TRANSACTION_TYPES);
      if (hasOwn(data, "status")) patch.status = toEnumValue(data.status, "status", TRANSACTION_STATUS);
      if (hasOwn(data, "title")) patch.title = toRequiredString(data.title, "title", 200);
      if (hasOwn(data, "category")) patch.category = toRequiredString(data.category, "category", 120);
      if (hasOwn(data, "amount")) patch.amount = toRequiredNumber(data.amount, "amount", 0);
      if (hasOwn(data, "date")) {
        const parsedDate = toRequiredString(data.date, "date", 120);
        const parsed = new Date(parsedDate);
        if (Number.isNaN(parsed.getTime())) {
          throw new ValidationError('Le champ "date" doit être une date valide.');
        }
        patch.date = parsedDate;
      }
      if (hasOwn(data, "paymentMethod")) patch.paymentMethod = toEnumValue(data.paymentMethod, "paymentMethod", PAYMENT_METHODS);
      if (hasOwn(data, "projectId")) patch.projectId = toNullableString(data.projectId, "projectId", 120);
      if (hasOwn(data, "notes")) patch.notes = toNullableString(data.notes, "notes", 2000);
      return patch;
    }
  }
}

function normalizeLinksFromProfile(value: unknown): DashboardUsefulLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const nowIso = new Date().toISOString();

  return value.reduce<DashboardUsefulLink[]>((accumulator, item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return accumulator;
    }

    const record = item as AnyRecord;
    const id = toRequiredString(record.id ?? `link-${Date.now()}-${index}`, "id", 120);
    const label = toRequiredString(record.label, "label", 120);
    const url = toRequiredString(record.url, "url", 2000);
    const category = toNullableString(record.category, "category", 120) ?? undefined;
    const isPinned = Boolean(record.isPinned);
    const openCount =
      typeof record.openCount === "number" && Number.isFinite(record.openCount)
        ? Math.max(0, Math.round(record.openCount))
        : 0;
    const lastOpenedAt = toNullableString(record.lastOpenedAt, "lastOpenedAt", 120) ?? undefined;
    const createdAt = isoFromUnknown(record.createdAt, nowIso);
    const updatedAt = isoFromUnknown(record.updatedAt, createdAt);

    accumulator.push({
      id,
      label,
      url,
      category,
      isPinned,
      openCount,
      lastOpenedAt,
      createdAt,
      updatedAt,
    });

    return accumulator;
  }, []);
}

export interface UserProfilePatch {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  onboardingCompleted?: boolean;
  businessName?: NullableText;
  role?: NullableText;
  specialty?: NullableText;
  email?: NullableText;
  phone?: NullableText;
  city?: NullableText;
  country?: NullableText;
  currency?: CurrencyCode;
  bio?: NullableText;
  avatarUrl?: NullableText;
  dashboardNotes?: NullableText;
  usefulLinks?: DashboardUsefulLink[];
}

export function sanitizeProfilePatch(payload: unknown): UserProfilePatch {
  const data = ensureObject(payload, "profile:update");
  sanitizePatch(data, [
    "firstName",
    "lastName",
    "displayName",
    "onboardingCompleted",
    "businessName",
    "role",
    "specialty",
    "email",
    "phone",
    "city",
    "country",
    "currency",
    "bio",
    "avatarUrl",
    "dashboardNotes",
    "usefulLinks",
  ]);

  const patch: UserProfilePatch = {};
  if (hasOwn(data, "firstName")) patch.firstName = toRequiredString(data.firstName, "firstName", 120);
  if (hasOwn(data, "lastName")) patch.lastName = toRequiredString(data.lastName, "lastName", 120);
  if (hasOwn(data, "displayName")) patch.displayName = toRequiredString(data.displayName, "displayName", 160);
  if (hasOwn(data, "onboardingCompleted")) {
    patch.onboardingCompleted = toRequiredBoolean(data.onboardingCompleted, "onboardingCompleted");
  }
  if (hasOwn(data, "businessName")) patch.businessName = toNullableString(data.businessName, "businessName", 160);
  if (hasOwn(data, "role")) patch.role = toNullableString(data.role, "role", 160);
  if (hasOwn(data, "specialty")) patch.specialty = toNullableString(data.specialty, "specialty", 160);
  if (hasOwn(data, "email")) patch.email = toNullableString(data.email, "email", 240);
  if (hasOwn(data, "phone")) patch.phone = toNullableString(data.phone, "phone", 80);
  if (hasOwn(data, "city")) patch.city = toNullableString(data.city, "city", 120);
  if (hasOwn(data, "country")) patch.country = toNullableString(data.country, "country", 120);
  if (hasOwn(data, "currency")) patch.currency = toEnumValue(data.currency, "currency", SUPPORTED_CURRENCIES);
  if (hasOwn(data, "bio")) patch.bio = toNullableString(data.bio, "bio", 2000);
  if (hasOwn(data, "avatarUrl")) patch.avatarUrl = toNullableString(data.avatarUrl, "avatarUrl", 2000);
  if (hasOwn(data, "dashboardNotes")) patch.dashboardNotes = toNullableString(data.dashboardNotes, "dashboardNotes", 10000);
  if (hasOwn(data, "usefulLinks")) patch.usefulLinks = normalizeLinksFromProfile(data.usefulLinks);

  return patch;
}

export function buildDefaultUserProfile(uid: string, email: string | null): AnyRecord {
  const normalizedEmail = toNullableString(email, "email", 240);
  const displayName =
    normalizedEmail && normalizedEmail.includes("@")
      ? normalizedEmail.split("@")[0] ?? uid
      : uid;

  return {
    userId: uid,
    firstName: "",
    lastName: "",
    displayName,
    onboardingCompleted: false,
    businessName: null,
    role: null,
    specialty: null,
    email: normalizedEmail,
    phone: null,
    city: null,
    country: null,
    currency: "EUR",
    bio: null,
    avatarUrl: null,
    dashboardNotes: null,
    usefulLinks: [],
    accountStatus: "firebase",
  };
}

export function mapUserProfile(id: string, rawData: AnyRecord): UserProfile {
  const nowIso = new Date().toISOString();
  return {
    userId: id,
    firstName: typeof rawData.firstName === "string" ? rawData.firstName : "",
    lastName: typeof rawData.lastName === "string" ? rawData.lastName : "",
    displayName: typeof rawData.displayName === "string" ? rawData.displayName : id,
    onboardingCompleted: rawData.onboardingCompleted === true,
    businessName: safeNullableString(rawData.businessName) ?? undefined,
    role: safeNullableString(rawData.role) ?? undefined,
    specialty: safeNullableString(rawData.specialty) ?? undefined,
    email: safeNullableString(rawData.email) ?? undefined,
    phone: safeNullableString(rawData.phone) ?? undefined,
    city: safeNullableString(rawData.city) ?? undefined,
    country: safeNullableString(rawData.country) ?? undefined,
    currency: SUPPORTED_CURRENCIES.includes(rawData.currency as CurrencyCode)
      ? (rawData.currency as CurrencyCode)
      : "EUR",
    bio: safeNullableString(rawData.bio) ?? undefined,
    avatarUrl: safeNullableString(rawData.avatarUrl) ?? undefined,
    dashboardNotes: safeNullableString(rawData.dashboardNotes),
    usefulLinks: normalizeLinksFromProfile(rawData.usefulLinks),
    accountStatus: "firebase",
    createdAt: isoFromUnknown(rawData.createdAt, nowIso),
    updatedAt: isoFromUnknown(rawData.updatedAt, nowIso),
  };
}
