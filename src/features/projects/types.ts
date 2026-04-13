export type ProjectStatus =
  | "lead"
  | "confirmed"
  | "in_progress"
  | "editing"
  | "delivered"
  | "completed"
  | "cancelled";

export interface Project {
  id: string;
  userId: string;
  title: string;
  contactId: string | null;
  serviceType: string;
  status: ProjectStatus;
  shootDate: string | null;
  deliveryDate: string | null;
  amountQuoted: number;
  amountPaid: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProjectInput {
  title: string;
  contactId?: string | null;
  serviceType: string;
  status: ProjectStatus;
  shootDate?: string | null;
  deliveryDate?: string | null;
  amountQuoted: number;
  amountPaid: number;
  notes?: string | null;
}
