import type { Contact } from "@/features/contacts/types";
import ContactCard from "./ContactCard";

interface ContactsListProps {
  contacts: Contact[];
  searchQuery: string;
  onContactClick: (contact: Contact) => void;
}

const EmptyContacts = ({ filtered }: { filtered: boolean }) => (
  <div className="contacts-empty">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
    <p className="contacts-empty__title">
      {filtered ? "Aucun résultat" : "Aucun contact"}
    </p>
    <p className="contacts-empty__desc">
      {filtered
        ? "Essayez de modifier votre recherche ou vos filtres."
        : "Ajoutez votre premier contact en cliquant sur « + Ajouter un contact »."}
    </p>
  </div>
);

export default function ContactsList({ contacts, searchQuery, onContactClick }: ContactsListProps) {
  if (contacts.length === 0) {
    return <EmptyContacts filtered={searchQuery.length > 0} />;
  }

  return (
    <div className="contacts-grid">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onClick={() => onContactClick(contact)}
        />
      ))}
    </div>
  );
}
