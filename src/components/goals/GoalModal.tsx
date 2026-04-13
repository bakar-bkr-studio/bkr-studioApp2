"use client";

import { useEffect, useRef, useState } from "react";
import type { Goal, GoalHorizon, GoalStatus, GoalType } from "@/features/goals/types";

export interface GoalFormData {
  title: string;
  description: string;
  type: GoalType;
  horizon: GoalHorizon;
  status: GoalStatus;
  dueDate: string;
  unit: string;
  targetValue: string;
  currentValue: string;
  notes: string;
}

const defaultForm: GoalFormData = {
  title: "",
  description: "",
  type: "quantitative",
  horizon: "month",
  status: "active",
  dueDate: "",
  unit: "",
  targetValue: "",
  currentValue: "",
  notes: "",
};

interface GoalModalProps {
  isOpen: boolean;
  goalToEdit?: Goal | null;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
}

export default function GoalModal({
  isOpen,
  goalToEdit,
  onClose,
  onSubmit,
}: GoalModalProps) {
  const [form, setForm] = useState<GoalFormData>(defaultForm);
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setForm({
          title: goalToEdit.title,
          description: goalToEdit.description || "",
          type: goalToEdit.type,
          horizon: goalToEdit.horizon,
          status: goalToEdit.status,
          dueDate: goalToEdit.dueDate || "",
          unit: goalToEdit.unit || "",
          targetValue:
            typeof goalToEdit.targetValue === "number"
              ? String(goalToEdit.targetValue)
              : "",
          currentValue:
            typeof goalToEdit.currentValue === "number"
              ? String(goalToEdit.currentValue)
              : "",
          notes: goalToEdit.notes || "",
        });
      } else {
        setForm(defaultForm);
      }
      setError("");
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [isOpen, goalToEdit]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parseOptionalNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    if (name === "type" && value === "qualitative") {
      setForm((prev) => ({
        ...prev,
        type: "qualitative",
        unit: "",
        targetValue: "",
        currentValue: "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Le titre de l'objectif est obligatoire.");
      firstFieldRef.current?.focus();
      return;
    }

    if (!form.type || !form.horizon || !form.status) {
      setError("Type, horizon et statut sont requis.");
      return;
    }

    if (form.type === "quantitative") {
      const parsedTarget = parseOptionalNumber(form.targetValue);
      const parsedCurrent = parseOptionalNumber(form.currentValue);

      if (parsedTarget === null || parsedCurrent === null) {
        setError("Les valeurs quantitatives doivent être des nombres valides.");
        return;
      }

      if (
        (typeof parsedTarget === "number" && parsedTarget < 0) ||
        (typeof parsedCurrent === "number" && parsedCurrent < 0)
      ) {
        setError("Les valeurs quantitatives doivent être positives.");
        return;
      }
    }

    onSubmit(form);
    setForm(defaultForm);
    setError("");
    onClose();
  };

  const isQuantitative = form.type === "quantitative";

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={goalToEdit ? "Modifier un objectif" : "Créer un objectif"}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">
            {goalToEdit ? "Modifier l'objectif" : "Nouvel objectif"}
          </h2>
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

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="goal-title" className="form-label">
              Titre <span className="form-required">*</span>
            </label>
            <input
              ref={firstFieldRef}
              id="goal-title"
              name="title"
              type="text"
              className="form-input"
              placeholder="Ex: Atteindre 8 000 € de CA mensuel"
              value={form.title}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="goal-description" className="form-label">Description</label>
            <textarea
              id="goal-description"
              name="description"
              className="form-input form-textarea"
              placeholder="Contexte ou détail de l'objectif..."
              rows={2}
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="goal-type" className="form-label">
                Type <span className="form-required">*</span>
              </label>
              <select
                id="goal-type"
                name="type"
                className="form-input"
                value={form.type}
                onChange={handleChange}
              >
                <option value="quantitative">Quantitatif</option>
                <option value="qualitative">Qualitatif</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="goal-horizon" className="form-label">
                Horizon <span className="form-required">*</span>
              </label>
              <select
                id="goal-horizon"
                name="horizon"
                className="form-input"
                value={form.horizon}
                onChange={handleChange}
              >
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Année</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="goal-status" className="form-label">
                Statut <span className="form-required">*</span>
              </label>
              <select
                id="goal-status"
                name="status"
                className="form-input"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Actif</option>
                <option value="completed">Terminé</option>
                <option value="at_risk">À risque</option>
                <option value="paused">En pause</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="goal-dueDate" className="form-label">Date d'échéance</label>
              <input
                id="goal-dueDate"
                name="dueDate"
                type="date"
                className="form-input"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {isQuantitative && (
            <>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="goal-targetValue" className="form-label">Valeur cible</label>
                  <input
                    id="goal-targetValue"
                    name="targetValue"
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="Ex: 5000"
                    value={form.targetValue}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="goal-currentValue" className="form-label">Valeur actuelle</label>
                  <input
                    id="goal-currentValue"
                    name="currentValue"
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="Ex: 1800"
                    value={form.currentValue}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="goal-unit" className="form-label">Unité</label>
                <input
                  id="goal-unit"
                  name="unit"
                  type="text"
                  className="form-input"
                  placeholder="Ex: EUR, clients, contenus"
                  value={form.unit}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-field">
            <label htmlFor="goal-notes" className="form-label">Notes</label>
            <textarea
              id="goal-notes"
              name="notes"
              className="form-input form-textarea"
              placeholder="Notes de suivi..."
              rows={2}
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary">
              {goalToEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
