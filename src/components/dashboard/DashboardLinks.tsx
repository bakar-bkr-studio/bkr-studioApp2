"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { updateUserDashboardData } from "@/features/profile/api/profile";
import type { DashboardUsefulLink } from "@/types";

interface DashboardLinksProps {
  userId: string | null;
  initialLinks: DashboardUsefulLink[];
  profileErrorMessage?: string;
}

interface DashboardLinkItem {
  id: string;
  label: string;
  url: string;
  category?: string;
  isPinned: boolean;
  openCount: number;
  lastOpenedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const SUGGESTED_LINKS = [
  { name: "Adobe", url: "https://adobe.com", category: "Outils" },
  { name: "Google Drive", url: "https://drive.google.com", category: "Stockage" },
  { name: "Notion", url: "https://notion.so", category: "Organisation" },
] as const;

const EMPTY_FORM = {
  label: "",
  url: "",
  category: "",
  isPinned: false,
};

function normalizeUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function formatOpenedAt(date?: string) {
  if (!date) {
    return "Jamais ouvert";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Dernière ouverture inconnue";
  }

  return `Ouvert le ${parsed.toLocaleDateString("fr-FR")}`;
}

function normalizeLink(input: DashboardUsefulLink, index: number): DashboardLinkItem | null {
  const id = input.id?.trim() || `link-${Date.now()}-${index}`;
  const label = input.label?.trim() ?? "";
  const normalizedUrl = normalizeUrl(input.url ?? "");

  if (!label || !normalizedUrl) {
    return null;
  }

  const nowIso = new Date().toISOString();

  return {
    id,
    label,
    url: normalizedUrl,
    category: input.category?.trim() || undefined,
    isPinned: Boolean(input.isPinned),
    openCount:
      typeof input.openCount === "number" && Number.isFinite(input.openCount)
        ? Math.max(0, Math.round(input.openCount))
        : 0,
    lastOpenedAt: input.lastOpenedAt,
    createdAt: input.createdAt ?? nowIso,
    updatedAt: input.updatedAt ?? input.createdAt ?? nowIso,
  };
}

function normalizeLinks(links: DashboardUsefulLink[]): DashboardLinkItem[] {
  return links.reduce<DashboardLinkItem[]>((accumulator, link, index) => {
    const normalizedLink = normalizeLink(link, index);

    if (normalizedLink) {
      accumulator.push(normalizedLink);
    }

    return accumulator;
  }, []);
}

function mapLinksForFirestore(links: DashboardLinkItem[]): DashboardUsefulLink[] {
  return links.map((link) => ({
    id: link.id,
    label: link.label,
    url: link.url,
    category: link.category,
    isPinned: link.isPinned,
    openCount: link.openCount,
    lastOpenedAt: link.lastOpenedAt,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  }));
}

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconExternal = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14L21 3" />
  </svg>
);

const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 17v5" />
    <path d="M7 3l10 10" />
    <path d="M14 4l6 6-3 3-6-6z" />
    <path d="M3 21l7-7" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

export default function DashboardLinks({
  userId,
  initialLinks,
  profileErrorMessage,
}: DashboardLinksProps) {
  const [links, setLinks] = useState<DashboardLinkItem[]>(normalizeLinks(initialLinks));
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);

  useEffect(() => {
    setLinks(normalizeLinks(initialLinks));
  }, [initialLinks]);

  useEffect(() => {
    if (profileErrorMessage) {
      setStatusMessage(profileErrorMessage);
    }
  }, [profileErrorMessage]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        links
          .map((link) => link.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b, "fr"));
  }, [links]);

  const filteredLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...links]
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return Number(b.isPinned) - Number(a.isPinned);
        }

        return b.updatedAt.localeCompare(a.updatedAt);
      })
      .filter((link) => {
        if (categoryFilter !== "all" && (link.category ?? "") !== categoryFilter) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          link.label.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          (link.category?.toLowerCase().includes(query) ?? false)
        );
      });
  }, [categoryFilter, links, searchQuery]);

  async function persistLinks(nextLinks: DashboardLinkItem[], successMessage?: string) {
    if (!userId) {
      setStatusMessage("Session utilisateur introuvable.");
      return;
    }

    const previousLinks = links;

    setLinks(nextLinks);
    setIsPersisting(true);

    try {
      const updated = await updateUserDashboardData({
        usefulLinks: mapLinksForFirestore(nextLinks),
      });

      setLinks(normalizeLinks(updated.usefulLinks));

      if (successMessage) {
        setStatusMessage(successMessage);
      }
    } catch {
      setLinks(previousLinks);
      setStatusMessage("Impossible de sauvegarder les liens utiles.");
    } finally {
      setIsPersisting(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingLinkId(null);
    setFormError("");
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormError("");
  }

  function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setStatusMessage("");

    const trimmedLabel = form.label.trim();
    const normalizedUrl = normalizeUrl(form.url);
    const category = form.category.trim();

    if (!trimmedLabel) {
      setFormError("Le nom du lien est requis.");
      return;
    }

    if (!isValidHttpUrl(normalizedUrl)) {
      setFormError("URL invalide. Utilisez un format de type https://...");
      return;
    }

    const duplicate = links.find(
      (link) =>
        link.url.toLowerCase() === normalizedUrl.toLowerCase() &&
        link.id !== editingLinkId
    );

    if (duplicate) {
      setFormError("Ce lien existe déjà dans votre liste.");
      return;
    }

    const now = new Date().toISOString();

    if (editingLinkId) {
      const nextLinks = links.map((link) =>
        link.id === editingLinkId
          ? {
              ...link,
              label: trimmedLabel,
              url: normalizedUrl,
              category: category || undefined,
              isPinned: form.isPinned,
              updatedAt: now,
            }
          : link
      );

      void persistLinks(nextLinks, "Lien mis à jour.");
      closeModal();
      resetForm();
      return;
    }

    const newLink: DashboardLinkItem = {
      id: `link-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: trimmedLabel,
      url: normalizedUrl,
      category: category || undefined,
      isPinned: form.isPinned,
      openCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    void persistLinks([newLink, ...links], "Lien ajouté.");
    closeModal();
    resetForm();
  }

  function startEdit(link: DashboardLinkItem) {
    setEditingLinkId(link.id);
    setForm({
      label: link.label,
      url: link.url,
      category: link.category ?? "",
      isPinned: link.isPinned,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function removeLink(linkId: string) {
    const nextLinks = links.filter((link) => link.id !== linkId);

    void persistLinks(nextLinks, "Lien supprimé.");

    if (editingLinkId === linkId) {
      closeModal();
      resetForm();
    }
  }

  function togglePin(linkId: string) {
    const now = new Date().toISOString();

    const nextLinks = links.map((link) =>
      link.id === linkId
        ? { ...link, isPinned: !link.isPinned, updatedAt: now }
        : link
    );

    void persistLinks(nextLinks);
  }

  function registerOpen(linkId: string) {
    const now = new Date().toISOString();

    const nextLinks = links.map((link) =>
      link.id === linkId
        ? {
            ...link,
            openCount: link.openCount + 1,
            lastOpenedAt: now,
            updatedAt: now,
          }
        : link
    );

    void persistLinks(nextLinks);
  }

  function addSuggestedLink(name: string, url: string, category: string) {
    const alreadyExists = links.some(
      (link) => link.url.toLowerCase() === url.toLowerCase()
    );

    if (alreadyExists) {
      setStatusMessage("Ce lien suggéré est déjà présent.");
      return;
    }

    const now = new Date().toISOString();
    const newLink: DashboardLinkItem = {
      id: `link-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: name,
      url,
      category,
      isPinned: false,
      openCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    void persistLinks([newLink, ...links], `Lien ajouté: ${name}`);
  }

  const pinnedCount = links.filter((link) => link.isPinned).length;

  return (
    <div className="dashboard-links">
      <div className="dashboard-links__header">
        <div className="dashboard-links__summary">
          <span>{links.length} lien(s)</span>
          <span>{pinnedCount} épinglé(s)</span>
        </div>
        <button
          type="button"
          className="dashboard-links__add-btn"
          onClick={openCreateModal}
          disabled={!userId || isPersisting}
        >
          <IconPlus />
          Ajouter
        </button>
      </div>

      <div className="dashboard-links__toolbar">
        <input
          className="dashboard-links__input"
          type="search"
          placeholder="Rechercher un lien..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <select
          className="dashboard-links__select"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {statusMessage && <p className="dashboard-links__status">{statusMessage}</p>}

      {links.length === 0 && (
        <div className="dashboard-links__suggestions">
          <p className="dashboard-links__suggestions-label">Ajouts rapides</p>
          <div className="dashboard-links__suggestion-list">
            {SUGGESTED_LINKS.map((suggestion) => (
              <button
                key={suggestion.url}
                type="button"
                className="dashboard-links__suggestion"
                onClick={() =>
                  addSuggestedLink(suggestion.name, suggestion.url, suggestion.category)
                }
                disabled={!userId || isPersisting}
              >
                {suggestion.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredLinks.length === 0 ? (
        <p className="dashboard-links__empty">
          {links.length === 0
            ? "Aucun lien enregistré pour le moment."
            : "Aucun résultat pour ce filtre."}
        </p>
      ) : (
        <div className="dashboard-links__list">
          {filteredLinks.map((link) => (
            <article key={link.id} className="dashboard-links__item">
              <div className="dashboard-links__item-main">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="dashboard-links__item-link"
                  onClick={() => registerOpen(link.id)}
                >
                  {link.label}
                  <IconExternal />
                </a>
                <p className="dashboard-links__item-sub">
                  {getHostname(link.url)}
                  {link.category ? ` · ${link.category}` : ""}
                </p>
                <p className="dashboard-links__item-meta">
                  {link.openCount} ouverture(s) · {formatOpenedAt(link.lastOpenedAt)}
                </p>
              </div>

              <div className="dashboard-links__item-actions">
                <button
                  type="button"
                  className={`dashboard-links__icon-btn ${link.isPinned ? "is-active" : ""}`}
                  onClick={() => togglePin(link.id)}
                  title={link.isPinned ? "Désépingler" : "Épingler"}
                  aria-label={link.isPinned ? "Désépingler" : "Épingler"}
                  disabled={!userId || isPersisting}
                >
                  <IconPin />
                </button>
                <button
                  type="button"
                  className="dashboard-links__icon-btn"
                  onClick={() => startEdit(link)}
                  title="Modifier"
                  aria-label="Modifier"
                  disabled={!userId || isPersisting}
                >
                  <IconEdit />
                </button>
                <button
                  type="button"
                  className="dashboard-links__icon-btn dashboard-links__icon-btn--danger"
                  onClick={() => removeLink(link.id)}
                  title="Supprimer"
                  aria-label="Supprimer"
                  disabled={!userId || isPersisting}
                >
                  <IconTrash />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={editingLinkId ? "Modifier le lien" : "Ajouter un lien"}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modal-panel dashboard-links-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingLinkId ? "Modifier le lien" : "Ajouter un lien utile"}
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
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

            <form onSubmit={submitLink} noValidate>
              {formError && (
                <div className="modal-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="link-label" className="form-label">
                    Nom <span className="form-required">*</span>
                  </label>
                  <input
                    id="link-label"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Adobe"
                    value={form.label}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, label: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="link-url" className="form-label">
                    URL <span className="form-required">*</span>
                  </label>
                  <input
                    id="link-url"
                    type="text"
                    className="form-input"
                    placeholder="Ex: adobe.com"
                    value={form.url}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, url: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="link-category" className="form-label">Catégorie</label>
                <input
                  id="link-category"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Outils"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                />
              </div>

              <label className="dashboard-links__modal-pin">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, isPinned: event.target.checked }))
                  }
                />
                Épingler ce lien dans la liste
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={closeModal}
                  disabled={isPersisting}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn--primary" disabled={isPersisting}>
                  {editingLinkId ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
