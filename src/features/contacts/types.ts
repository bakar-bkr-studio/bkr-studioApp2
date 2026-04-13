export type ContactType = "client" | "prospect" | "partner";

export interface Contact {
  id: string;
  userId: string;
  name: string;
  type: ContactType;
  organization: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertContactInput {
  name: string;
  type: ContactType;
  organization?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}
