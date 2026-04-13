"use client";

import { useEffect, useRef, useState } from "react";
import type { Contact, UpsertContactInput } from "@/features/contacts/types";

// -------------------------------------------------------
// Types
// -------------------------------------------------------
interface ContactFormData {
  firstName: string;
  lastName: string;
  type: Contact["type"];
  organization: string;
  email: string;
  phone: string;
  notes: string;
}

const defaultForm: ContactFormData = {
  firstName: "",
  lastName: "",
  type: "prospect",
  organization: "",
  email: "",
  phone: "",
  notes: "",
};

interface ContactModalProps {
  isOpen: boolean;
  contactToEdit?: Contact | null;
  onClose: () => void;
  onSubmit: (data: UpsertContactInput) => void;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function composeName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------
export default function ContactModal({ isOpen, contactToEdit, onClose, onSubmit }: ContactModalProps) {
  const [form, setForm] = useState<ContactFormData>(defaultForm);
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Initialisation du form quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (contactToEdit) {
        const { firstName, lastName } = splitName(contactToEdit.name);

        setForm({
          firstName,
          lastName,
          type: contactToEdit.type,
          organization: contactToEdit.organization ?? "",
          email: contactToEdit.email ?? "",
          phone: contactToEdit.phone ?? "",
          notes: contactToEdit.notes ?? "",
        });
      } else {
        setForm(defaultForm);
      }
      setError("");
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [isOpen, contactToEdit]);

  // Fermer avec Echap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = composeName(form.firstName, form.lastName);

    if (!name) {
      setError("Le nom ou le prénom est obligatoire.");
      firstFieldRef.current?.focus();
      return;
    }

    onSubmit({
      name,
      type: form.type,
      organization: form.organization,
      email: form.email,
      phone: form.phone,
      notes: form.notes,
    });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un contact"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{contactToEdit ? "Modifier le contact" : "Nouveau contact"}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="modal-error" role="alert">{error}</div>}

          {/* Prénom et Nom */}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="contact-firstName" className="form-label">
                Prénom <span className="form-required">*</span>
              </label>
              <input
                ref={firstFieldRef}
                id="contact-firstName"
                name="firstName"
                type="text"
                className="form-input"
                placeholder="Ex: Thomas"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
            <div className="form-field">
              <label htmlFor="contact-lastName" className="form-label">
                Nom <span className="form-required">*</span>
              </label>
              <input
                id="contact-lastName"
                name="lastName"
                type="text"
                className="form-input"
                placeholder="Ex: Bertin"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Type */}
          <div className="form-field">
            <label htmlFor="contact-type" className="form-label">Type</label>
            <select
              id="contact-type"
              name="type"
              className="form-input"
              value={form.type}
              onChange={handleChange}
            >
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
              <option value="partner">Partenaire</option>
            </select>
          </div>

          {/* Organisation */}
          <div className="form-field">
            <label htmlFor="contact-organization" className="form-label">Organisation</label>
            <input
              id="contact-organization"
              name="organization"
              type="text"
              className="form-input"
              placeholder="Ex: AS Monaco FC"
              value={form.organization}
              onChange={handleChange}
            />
          </div>

          {/* Email + Téléphone côte à côte */}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="contact-email" className="form-label">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="email@exemple.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-field">
              <label htmlFor="contact-phone" className="form-label">Téléphone</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="+33 6 …"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-field">
            <label htmlFor="contact-notes" className="form-label">Notes</label>
            <textarea
              id="contact-notes"
              name="notes"
              className="form-input form-textarea"
              placeholder="Informations complémentaires…"
              rows={3}
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary">
              {contactToEdit ? "Enregistrer" : "Ajouter le contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
