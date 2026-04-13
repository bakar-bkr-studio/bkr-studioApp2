"use client";

import { memo } from "react";
import type { ProjectStatus } from "@/features/projects/types";

interface ProjectsToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: ProjectStatus | "all";
  onStatusFilterChange: (status: ProjectStatus | "all") => void;
}

const statusOptions: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "lead", label: "Lead" },
  { value: "confirmed", label: "Confirmés" },
  { value: "in_progress", label: "En cours" },
  { value: "editing", label: "Post-prod" },
  { value: "delivered", label: "Livrés" },
  { value: "completed", label: "Terminés" },
];

export default memo(function ProjectsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ProjectsToolbarProps) {
  return (
    <div className="contacts-toolbar">
      {/* Search Input (reusing contact classes for styling) */}
      <div className="contacts-search-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="contacts-search"
          placeholder="Rechercher (titre, client, type)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Status Filters */}
      <div className="contacts-filters">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            className={`contacts-filter-btn ${statusFilter === opt.value ? "active" : ""}`}
            onClick={() => onStatusFilterChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
});
