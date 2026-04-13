"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  isLoading: boolean;
  errorMessage: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DELETE_CONFIRMATION_KEYWORD = "SUPPRIMER";

export default function DeleteAccountModal({
  isOpen,
  isLoading,
  errorMessage,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isConfirmationValid = useMemo(
    () => confirmationText === DELETE_CONFIRMATION_KEYWORD,
    [confirmationText]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setConfirmationText("");
    setConfirmationError("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLoading, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isConfirmationValid) {
      setConfirmationError(
        `Confirmation incorrecte. Tapez exactement ${DELETE_CONFIRMATION_KEYWORD}.`
      );
      inputRef.current?.focus();
      return;
    }

    setConfirmationError("");
    await onConfirm();
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Supprimer définitivement le compte"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="modal-panel account-delete-modal">
        <div className="modal-header">
          <h2 className="modal-title">Supprimer mon compte</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isLoading}
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

        <p className="account-delete-modal__intro">
          Cette action est irréversible. Votre compte et toutes vos données seront supprimés
          définitivement.
        </p>

        <ul className="account-delete-modal__list">
          <li>
            Suppression des documents Firestore dans <code>contacts</code>, <code>projects</code>,{" "}
            <code>tasks</code>, <code>transactions</code> et <code>goals</code>.
          </li>
          <li>Suppression de votre document utilisateur dans <code>users/{"{uid}"}</code>.</li>
          <li>Suppression de votre compte Firebase Authentication.</li>
        </ul>

        <p className="account-delete-modal__warning">
          Pour confirmer, saisissez exactement <strong>{DELETE_CONFIRMATION_KEYWORD}</strong>.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="delete-account-confirmation" className="form-label">
              Confirmation
            </label>
            <input
              ref={inputRef}
              id="delete-account-confirmation"
              className="form-input"
              type="text"
              value={confirmationText}
              onChange={(event) => {
                setConfirmationText(event.target.value);
                if (confirmationError) {
                  setConfirmationError("");
                }
              }}
              placeholder={DELETE_CONFIRMATION_KEYWORD}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={isLoading}
            />
          </div>

          {confirmationText.length > 0 && !isConfirmationValid && !confirmationError && (
            <div className="account-delete-modal__hint" role="status" aria-live="polite">
              La confirmation doit être exactement {DELETE_CONFIRMATION_KEYWORD}.
            </div>
          )}

          {confirmationError && (
            <div className="modal-error" role="alert">
              {confirmationError}
            </div>
          )}

          {errorMessage && (
            <div className="modal-error" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn--danger"
              disabled={isLoading || !isConfirmationValid}
            >
              {isLoading ? "Suppression en cours..." : "Supprimer définitivement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
