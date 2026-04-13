import { apiRequest } from "@/lib/api-client";
import type { Contact, UpsertContactInput } from "@/features/contacts/types";

interface ContactsListResponse {
  items: Contact[];
}

interface ContactItemResponse {
  item: Contact;
}

export async function listUserContacts(): Promise<Contact[]> {
  const response = await apiRequest<ContactsListResponse>("/api/v1/contacts", {
    method: "GET",
  });

  return response.items;
}

export async function createContact(data: UpsertContactInput): Promise<Contact> {
  const response = await apiRequest<ContactItemResponse>("/api/v1/contacts", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response.item;
}

export async function updateContact(
  contactId: string,
  data: Partial<UpsertContactInput>
): Promise<Contact> {
  const normalizedContactId = contactId.trim();

  if (!normalizedContactId) {
    throw new Error("Contact invalide: id manquant.");
  }

  const response = await apiRequest<ContactItemResponse>(
    `/api/v1/contacts/${encodeURIComponent(normalizedContactId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return response.item;
}

export async function deleteContact(contactId: string): Promise<void> {
  const normalizedContactId = contactId.trim();

  if (!normalizedContactId) {
    throw new Error("Contact invalide: id manquant.");
  }

  await apiRequest<{ success: boolean }>(
    `/api/v1/contacts/${encodeURIComponent(normalizedContactId)}`,
    {
      method: "DELETE",
    }
  );
}
