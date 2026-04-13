"use client";

import { useEffect } from "react";
import type { Contact } from "@/features/contacts/types";

interface ContactDetailsModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ContactDetailsModal({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ContactDetailsModalProps) {
  // Fermer avec Echap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen || !contact) return null;

  const fullName = contact.name.trim() || "Sans nom";
  const initials = getInitials(fullName);

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "client": return "badge badge--green";
      case "prospect": return "badge badge--amber";
      case "partner": return "badge badge--accent";
      default: return "badge badge--neutral";
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case "client": return "Client";
      case "prospect": return "Prospect";
      case "partner": return "Partenaire";
      default: return type;
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Détails du contact"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel" style={{ maxWidth: "420px" }}>
        {/* Actions top right */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
             <span className={getBadgeClass(contact.type)}>{getLabel(contact.type)}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
             <button
              onClick={() => onEdit(contact)}
              className="btn-quick"
              title="Modifier"
              aria-label="Modifier le contact"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (confirm(`Voulez-vous vraiment supprimer ${fullName} ?`)) {
                  onDelete(contact.id);
                  onClose();
                }
              }}
              className="btn-quick"
              style={{ color: "var(--red)", borderColor: "var(--border)" }}
              title="Supprimer"
              aria-label="Supprimer le contact"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="btn-quick"
              title="Fermer"
              aria-label="Fermer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
          <div className="contact-card__avatar" style={{ width: "64px", height: "64px", fontSize: "20px", marginBottom: "12px" }}>
            {initials}
          </div>
          <h2 className="modal-title" style={{ fontSize: "20px", marginBottom: "4px" }}>{fullName}</h2>
          {contact.organization && (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{contact.organization}</p>
          )}
        </div>

        {/* Info detail list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
          {contact.email && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Email</span>
              <a href={`mailto:${contact.email}`} className="text-secondary" style={{ fontSize: "14px", textDecoration: "none" }}>{contact.email}</a>
            </div>
          )}
          {contact.phone && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Téléphone</span>
              <a href={`tel:${contact.phone}`} className="text-secondary" style={{ fontSize: "14px", textDecoration: "none" }}>{contact.phone}</a>
            </div>
          )}
          {contact.notes && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Notes</span>
              <p className="text-secondary" style={{ fontSize: "14px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {contact.notes}
              </p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Ajouté le</span>
              <span className="text-muted" style={{ fontSize: "12px" }}>{new Date(contact.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
