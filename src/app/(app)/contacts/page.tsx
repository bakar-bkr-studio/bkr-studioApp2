"use client";

import { useEffect, useMemo, useState } from "react";
import ContactsList from "@/components/contacts/ContactsList";
import ContactModal from "@/components/contacts/ContactModal";
import ContactDetailsModal from "@/components/contacts/ContactDetailsModal";
import {
  createContact,
  deleteContact,
  listUserContacts,
  updateContact,
} from "@/features/contacts/api/contacts";
import type { Contact, UpsertContactInput } from "@/features/contacts/types";
import { useAuth } from "@/lib/auth/use-auth";

// -------------------------------------------------------
// Filter types
// -------------------------------------------------------
type FilterType = "all" | Contact["type"];

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "client", label: "Clients" },
  { value: "prospect", label: "Prospects" },
  { value: "partner", label: "Partenaires" },
];

// -------------------------------------------------------
// Icon: Search
// -------------------------------------------------------
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

function toDateTime(value: string): number {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  return timestamp;
}

function sortContactsByCreatedAt(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    const byDate = toDateTime(b.createdAt) - toDateTime(a.createdAt);

    if (byDate !== 0) {
      return byDate;
    }

    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });
}

function logContactsError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Contacts] ${context}`, error);
  }
}

// -------------------------------------------------------
// Page (client component for interactivity)
// -------------------------------------------------------
export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadContacts() {
      if (!user?.id) {
        if (isMounted) {
          setContacts([]);
          setErrorMessage("Session utilisateur introuvable.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const loadedContacts = await listUserContacts();

        if (!isMounted) {
          return;
        }

        setContacts(loadedContacts);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logContactsError("Échec du chargement des contacts Firestore.", error);
        setContacts([]);
        setErrorMessage("Impossible de charger les contacts depuis Firestore.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadContacts();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Filtrage + recherche
  const filtered = useMemo(() => {
    let result = contacts;

    if (filter !== "all") {
      result = result.filter((c) => c.type === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.organization?.toLowerCase().includes(q) ?? false)
      );
    }

    return result;
  }, [contacts, filter, search]);

  // Compteurs par type
  const counts = useMemo(
    () => ({
      all: contacts.length,
      client: contacts.filter((c) => c.type === "client").length,
      prospect: contacts.filter((c) => c.type === "prospect").length,
      partner: contacts.filter((c) => c.type === "partner").length,
    }),
    [contacts]
  );

  // Ajout ou modification d'un contact via le modal
  const handleSaveContact = (data: UpsertContactInput) => {
    if (!user?.id || isSaving) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    void (async () => {
      try {
        if (contactToEdit) {
          const updatedContact = await updateContact(contactToEdit.id, data);

          setContacts((prev) =>
            sortContactsByCreatedAt(prev.map((contact) => (
              contact.id === updatedContact.id ? updatedContact : contact
            )))
          );

          if (selectedContact?.id === updatedContact.id) {
            setSelectedContact(updatedContact);
          }
        } else {
          const createdContact = await createContact(data);
          setContacts((prev) => sortContactsByCreatedAt([createdContact, ...prev]));
        }
      } catch (error) {
        logContactsError("Échec de l'enregistrement d'un contact Firestore.", error);
        setErrorMessage(
          contactToEdit
            ? "Impossible d'enregistrer les modifications du contact."
            : "Impossible de créer le contact."
        );
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleDeleteContact = (id: string) => {
    if (!user?.id) {
      return;
    }

    setErrorMessage("");

    void (async () => {
      try {
        await deleteContact(id);
        setContacts((prev) => prev.filter((c) => c.id !== id));

        if (selectedContact?.id === id) {
          setSelectedContact(null);
        }
      } catch (error) {
        logContactsError("Échec de suppression d'un contact Firestore.", error);
        setErrorMessage("Impossible de supprimer le contact.");
      }
    })();
  };

  if (isLoading) {
    return (
      <>
        <div className="page-header">
          <h1>Contacts</h1>
          <p>Gérez vos clients, prospects et partenaires.</p>
        </div>

        <div className="section-card">
          <div className="section-card__body">
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Chargement des contacts...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ---- Page Header ---- */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-desc">
            Gérez vos clients, prospects et partenaires.
          </p>
        </div>
        <button
          id="btn-add-contact"
          className="btn btn--primary"
          onClick={() => {
            setContactToEdit(null);
            setIsModalOpen(true);
          }}
          disabled={isSaving}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ajouter un contact
        </button>
      </div>

      {isSaving && (
        <p
          style={{
            marginBottom: "12px",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}
        >
          Enregistrement du contact...
        </p>
      )}

      {errorMessage && (
        <div className="modal-error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* ---- Search + Filters bar ---- */}
      <div className="contacts-toolbar">
        {/* Search */}
        <div className="contacts-search-wrap">
          <SearchIcon />
          <input
            id="contact-search"
            type="search"
            className="contacts-search"
            placeholder="Rechercher par nom ou organisation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher un contact"
          />
        </div>

        {/* Filter tabs */}
        <div className="contacts-filters" role="group" aria-label="Filtrer les contacts">
          {filters.map((f) => (
            <button
              key={f.value}
              id={`filter-${f.value}`}
              className={`contacts-filter-btn${filter === f.value ? " active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="contacts-filter-count">
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Contacts list ---- */}
      <ContactsList
        contacts={filtered}
        searchQuery={search}
        onContactClick={(contact) => setSelectedContact(contact)}
      />

      {/* ---- Modals ---- */}
      <ContactModal
        isOpen={isModalOpen}
        contactToEdit={contactToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setContactToEdit(null);
        }}
        onSubmit={handleSaveContact}
      />
      <ContactDetailsModal
        contact={selectedContact}
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={(contact) => {
          setContactToEdit(contact);
          setSelectedContact(null);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteContact}
      />
    </>
  );
}
