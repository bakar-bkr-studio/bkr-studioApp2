"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PaymentMethod,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/features/finances/types";
import type { Project } from "@/features/projects/types";

export interface TransactionFormData {
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  category: string;
  amount: string;
  date: string;
  paymentMethod: PaymentMethod;
  projectId: string;
  notes: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  projects: Project[];
  prefillProjectId?: string;
  initialData?: Transaction | null;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
}

const NO_PROJECT_VALUE = "__none__";

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Revenu" },
  { value: "expense", label: "Dépense" },
];

const statusOptions: { value: TransactionStatus; label: string }[] = [
  { value: "completed", label: "Réalisé" },
  { value: "planned", label: "Prévu" },
];

const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
  { value: "transfer", label: "Virement" },
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "other", label: "Autre" },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultForm(prefillProjectId?: string): TransactionFormData {
  return {
    type: "income",
    status: "completed",
    title: "",
    category: "",
    amount: "",
    date: getTodayDate(),
    paymentMethod: "transfer",
    projectId: prefillProjectId ?? NO_PROJECT_VALUE,
    notes: "",
  };
}

function toFormData(
  transaction: Transaction,
  availableProjectIds: Set<string>
): TransactionFormData {
  const safeProjectId =
    transaction.projectId && availableProjectIds.has(transaction.projectId)
      ? transaction.projectId
      : NO_PROJECT_VALUE;

  return {
    type: transaction.type,
    status: transaction.status,
    title: transaction.title,
    category: transaction.category,
    amount: String(transaction.amount),
    date: transaction.date,
    paymentMethod: transaction.paymentMethod,
    projectId: safeProjectId,
    notes: transaction.notes ?? "",
  };
}

export default function TransactionModal({
  isOpen,
  projects,
  prefillProjectId,
  initialData,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const availableProjectIds = useMemo(
    () => new Set(projects.map((project) => project.id)),
    [projects]
  );

  const safePrefillProjectId =
    prefillProjectId && availableProjectIds.has(prefillProjectId)
      ? prefillProjectId
      : undefined;

  const isEditing = Boolean(initialData);

  const [form, setForm] = useState<TransactionFormData>(
    getDefaultForm(safePrefillProjectId)
  );
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm(toFormData(initialData, availableProjectIds));
      } else {
        setForm(getDefaultForm(safePrefillProjectId));
      }

      setError("");
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [
    availableProjectIds,
    initialData,
    isOpen,
    safePrefillProjectId,
  ]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handler);
    }

    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.type || !form.status || !form.paymentMethod) {
      setError("Type, statut et méthode de paiement sont obligatoires.");
      return;
    }

    if (!form.title.trim()) {
      setError("Le titre est obligatoire.");
      firstFieldRef.current?.focus();
      return;
    }

    if (!form.category.trim()) {
      setError("La catégorie est obligatoire.");
      return;
    }

    const parsedAmount = Number(form.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Le montant est obligatoire et doit être un nombre valide.");
      return;
    }

    if (!form.date) {
      setError("La date est obligatoire.");
      return;
    }

    onSubmit(form);
    setError("");
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "Modifier une transaction" : "Ajouter une transaction"}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? "Modifier la transaction" : "Nouvelle transaction"}
          </h2>
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

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="transaction-type" className="form-label">
                Type <span className="form-required">*</span>
              </label>
              <select
                id="transaction-type"
                name="type"
                className="form-input"
                value={form.type}
                onChange={handleChange}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="transaction-status" className="form-label">
                Statut <span className="form-required">*</span>
              </label>
              <select
                id="transaction-status"
                name="status"
                className="form-input"
                value={form.status}
                onChange={handleChange}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="transaction-title" className="form-label">
                Titre <span className="form-required">*</span>
              </label>
              <input
                ref={firstFieldRef}
                id="transaction-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="Ex: Acompte client matchday"
                value={form.title}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>

            <div className="form-field">
              <label htmlFor="transaction-category" className="form-label">
                Catégorie <span className="form-required">*</span>
              </label>
              <input
                id="transaction-category"
                name="category"
                type="text"
                className="form-input"
                placeholder="Ex: Prestation sportive"
                value={form.category}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="transaction-amount" className="form-label">
                Montant <span className="form-required">*</span>
              </label>
              <input
                id="transaction-amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="Ex: 450"
                value={form.amount}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="transaction-date" className="form-label">
                Date <span className="form-required">*</span>
              </label>
              <input
                id="transaction-date"
                name="date"
                type="date"
                className="form-input"
                value={form.date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="transaction-paymentMethod" className="form-label">
                Méthode de paiement <span className="form-required">*</span>
              </label>
              <select
                id="transaction-paymentMethod"
                name="paymentMethod"
                className="form-input"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="transaction-projectId" className="form-label">
                Projet lié
              </label>
              <select
                id="transaction-projectId"
                name="projectId"
                className="form-input"
                value={form.projectId}
                onChange={handleChange}
              >
                <option value={NO_PROJECT_VALUE}>Sans projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="transaction-notes" className="form-label">
              Notes
            </label>
            <textarea
              id="transaction-notes"
              name="notes"
              className="form-input form-textarea"
              placeholder="Détails optionnels..."
              rows={3}
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary">
              {isEditing ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { NO_PROJECT_VALUE };
