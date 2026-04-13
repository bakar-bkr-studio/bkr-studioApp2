import type { Transaction } from "@/features/finances/types";

export type TransactionTypeFilter = "all" | Transaction["type"];
export type TransactionStatusFilter = "all" | Transaction["status"];
export type TransactionProjectFilter = "all" | "without_project" | string;

interface Option {
  value: string;
  label: string;
}

interface TransactionsToolbarProps {
  searchQuery: string;
  typeFilter: TransactionTypeFilter;
  statusFilter: TransactionStatusFilter;
  categoryFilter: string;
  projectFilter: TransactionProjectFilter;
  categoryOptions: Option[];
  projectOptions: Option[];
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: TransactionTypeFilter) => void;
  onStatusFilterChange: (value: TransactionStatusFilter) => void;
  onCategoryFilterChange: (value: string) => void;
  onProjectFilterChange: (value: TransactionProjectFilter) => void;
}

const typeOptions: Option[] = [
  { value: "all", label: "Tous" },
  { value: "income", label: "Revenus" },
  { value: "expense", label: "Dépenses" },
];

const statusOptions: Option[] = [
  { value: "all", label: "Tous" },
  { value: "completed", label: "Réalisé" },
  { value: "planned", label: "Prévu" },
];

export default function TransactionsToolbar({
  searchQuery,
  typeFilter,
  statusFilter,
  categoryFilter,
  projectFilter,
  categoryOptions,
  projectOptions,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onProjectFilterChange,
}: TransactionsToolbarProps) {
  return (
    <div className="finance-toolbar">
      <div className="finance-toolbar__search-wrap">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          className="finance-toolbar__search"
          placeholder="Rechercher par titre, catégorie ou note..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Rechercher une transaction"
        />
      </div>

      <div className="finance-toolbar__filters">
        <label className="finance-toolbar__field">
          <span>Type</span>
          <select
            className="form-input finance-toolbar__select"
            value={typeFilter}
            onChange={(event) =>
              onTypeFilterChange(event.target.value as TransactionTypeFilter)
            }
            aria-label="Filtrer les transactions par type"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="finance-toolbar__field">
          <span>Statut</span>
          <select
            className="form-input finance-toolbar__select"
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as TransactionStatusFilter)
            }
            aria-label="Filtrer les transactions par statut"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="finance-toolbar__field">
          <span>Catégorie</span>
          <select
            className="form-input finance-toolbar__select"
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            aria-label="Filtrer les transactions par catégorie"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="finance-toolbar__field">
          <span>Projet</span>
          <select
            className="form-input finance-toolbar__select"
            value={projectFilter}
            onChange={(event) => onProjectFilterChange(event.target.value)}
            aria-label="Filtrer les transactions par projet"
          >
            {projectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
