"use client";

import { useEffect, useRef, useState } from "react";
import type { CurrencyCode, UserProfile } from "@/types";

interface ProfileModalFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  businessName: string;
  role: string;
  specialty: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  currency: CurrencyCode;
  bio: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSubmit: (data: ProfileModalFormData) => void;
}

const currencyOptions: Array<{ value: CurrencyCode; label: string }> = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "NGN", label: "NGN (₦)" },
];

function getFormFromProfile(profile: UserProfile): ProfileModalFormData {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    displayName: profile.displayName,
    businessName: profile.businessName ?? "",
    role: profile.role ?? "",
    specialty: profile.specialty ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "",
    currency: profile.currency,
    bio: profile.bio ?? "",
  };
}

export type { ProfileModalFormData };

export default function ProfileModal({
  isOpen,
  profile,
  onClose,
  onSubmit,
}: ProfileModalProps) {
  const [form, setForm] = useState<ProfileModalFormData>(getFormFromProfile(profile));
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(getFormFromProfile(profile));
      setError("");
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [isOpen, profile]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handler);
    }

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.firstName.trim()) {
      setError("Le prénom est obligatoire.");
      firstFieldRef.current?.focus();
      return;
    }

    if (!form.lastName.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }

    if (!form.displayName.trim()) {
      setError("Le nom affiché est obligatoire.");
      return;
    }

    if (!form.currency) {
      setError("La devise est obligatoire.");
      return;
    }

    onSubmit(form);
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Modifier le profil"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-panel profile-modal">
        <div className="modal-header">
          <h2 className="modal-title">Modifier le profil</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="profile-modal__intro">
          Les modifications sont enregistrées dans votre profil Firebase.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="profile-firstName" className="form-label">
                Prénom <span className="form-required">*</span>
              </label>
              <input
                ref={firstFieldRef}
                id="profile-firstName"
                name="firstName"
                type="text"
                className="form-input"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>

            <div className="form-field">
              <label htmlFor="profile-lastName" className="form-label">
                Nom <span className="form-required">*</span>
              </label>
              <input
                id="profile-lastName"
                name="lastName"
                type="text"
                className="form-input"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="profile-displayName" className="form-label">
                Nom affiché <span className="form-required">*</span>
              </label>
              <input
                id="profile-displayName"
                name="displayName"
                type="text"
                className="form-input"
                value={form.displayName}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="profile-businessName" className="form-label">Nom d'activité</label>
              <input
                id="profile-businessName"
                name="businessName"
                type="text"
                className="form-input"
                value={form.businessName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="profile-role" className="form-label">Rôle</label>
              <input
                id="profile-role"
                name="role"
                type="text"
                className="form-input"
                value={form.role}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="profile-specialty" className="form-label">Spécialité</label>
              <input
                id="profile-specialty"
                name="specialty"
                type="text"
                className="form-input"
                value={form.specialty}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="profile-email" className="form-label">Email</label>
              <input
                id="profile-email"
                name="email"
                type="email"
                className="form-input"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="profile-phone" className="form-label">Téléphone</label>
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                className="form-input"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="profile-city" className="form-label">Ville</label>
              <input
                id="profile-city"
                name="city"
                type="text"
                className="form-input"
                value={form.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="profile-country" className="form-label">Pays</label>
              <input
                id="profile-country"
                name="country"
                type="text"
                className="form-input"
                value={form.country}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="profile-currency" className="form-label">
                Devise <span className="form-required">*</span>
              </label>
              <select
                id="profile-currency"
                name="currency"
                className="form-input"
                value={form.currency}
                onChange={handleChange}
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Champs en lecture seule</label>
              <div className="profile-modal__readonly">
                <p>ID utilisateur, statut du compte, dates et avatar non modifiables ici.</p>
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="profile-bio" className="form-label">Bio</label>
            <textarea
              id="profile-bio"
              name="bio"
              className="form-input form-textarea"
              rows={3}
              value={form.bio}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
