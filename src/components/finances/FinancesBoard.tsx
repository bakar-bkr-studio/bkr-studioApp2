"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import EmptyState from "@/components/EmptyState";
import SectionCard from "@/components/SectionCard";
import {
  createTransaction,
  deleteTransaction,
  listUserTransactions,
  updateTransaction,
} from "@/features/finances/api/transactions";
import type {
  Transaction,
  UpsertTransactionInput,
} from "@/features/finances/types";
import { listUserProjects } from "@/features/projects/api/projects";
import type { Project } from "@/features/projects/types";
import {
  getFinanceSummary,
  getMonthlyFinanceData,
  getRecentTransactions,
} from "@/lib/finance-utils";
import { useAuth } from "@/lib/auth/use-auth";
import FinanceForecast from "@/components/finances/FinanceForecast";
import FinanceSummary from "@/components/finances/FinanceSummary";
import TransactionRow from "@/components/finances/TransactionRow";
import TransactionModal, {
  NO_PROJECT_VALUE,
  type TransactionFormData,
} from "@/components/finances/TransactionModal";
import TransactionsToolbar, {
  type TransactionProjectFilter,
  type TransactionStatusFilter,
  type TransactionTypeFilter,
} from "@/components/finances/TransactionsToolbar";

const FinanceChart = dynamic(() => import("@/components/finances/FinanceChart"), {
  ssr: false,
  loading: () => (
    <div className="finance-chart-shell finance-chart-shell--loading">
      <p className="finance-empty-inline">Chargement du graphique...</p>
    </div>
  ),
});

interface FinancesBoardProps {
  prefillProjectIdForCreate?: string;
}

const TRANSACTIONS_PER_PAGE = 10;

function toDateTime(value: string): number {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  return timestamp;
}

function sortTransactions(items: Transaction[]): Transaction[] {
  return [...items].sort((a, b) => {
    const byDate = toDateTime(b.date) - toDateTime(a.date);

    if (byDate !== 0) {
      return byDate;
    }

    const byCreatedAt = toDateTime(b.createdAt) - toDateTime(a.createdAt);

    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }

    return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
  });
}

function toTransactionPayload(form: TransactionFormData): UpsertTransactionInput {
  return {
    type: form.type,
    status: form.status,
    title: form.title.trim(),
    category: form.category.trim(),
    amount: Number(form.amount),
    date: form.date,
    paymentMethod: form.paymentMethod,
    projectId:
      form.projectId && form.projectId !== NO_PROJECT_VALUE ? form.projectId : null,
    notes: form.notes.trim() || null,
  };
}

function logFinancesError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Finances] ${context}`, error);
  }
}

export default function FinancesBoard({
  prefillProjectIdForCreate,
}: FinancesBoardProps) {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] =
    useState<TransactionProjectFilter>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [createModalPrefillProjectId, setCreateModalPrefillProjectId] = useState<
    string | undefined
  >(prefillProjectIdForCreate);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTransactionsAndProjects() {
      if (!user?.id) {
        if (isMounted) {
          setTransactions([]);
          setProjectsData([]);
          setErrorMessage("Session utilisateur introuvable.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [loadedTransactions, loadedProjects] = await Promise.all([
          listUserTransactions(),
          listUserProjects(),
        ]);

        if (!isMounted) {
          return;
        }

        setTransactions(loadedTransactions);
        setProjectsData(loadedProjects);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logFinancesError("Échec du chargement des transactions Firestore.", error);
        setTransactions([]);
        setProjectsData([]);
        setErrorMessage("Impossible de charger les finances depuis Firestore.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTransactionsAndProjects();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const summary = useMemo(() => getFinanceSummary(transactions), [transactions]);

  const monthlyData = useMemo(
    () => getMonthlyFinanceData(transactions),
    [transactions]
  );

  const sortedTransactions = useMemo(
    () => getRecentTransactions(transactions, transactions.length),
    [transactions]
  );

  const editingTransaction = useMemo(
    () =>
      editingTransactionId
        ? transactions.find((transaction) => transaction.id === editingTransactionId) ??
          null
        : null,
    [editingTransactionId, transactions]
  );

  const projectNameById = useMemo(
    () =>
      projectsData.reduce<Record<string, string>>((acc, project) => {
        acc[project.id] = project.title;
        return acc;
      }, {}),
    [projectsData]
  );

  const projectOptions = useMemo(
    () => [
      { value: "all", label: "Tous" },
      { value: "without_project", label: "Sans projet" },
      ...projectsData
        .map((project) => ({ value: project.id, label: project.title }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    ],
    [projectsData]
  );

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Toutes" },
      ...Array.from(
        new Set(
          transactions
            .map((transaction) => transaction.category.trim())
            .filter((category) => category.length > 0)
        )
      )
        .sort((a, b) => a.localeCompare(b, "fr"))
        .map((category) => ({ value: category, label: category })),
    ],
    [transactions]
  );

  const plannedIncome = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.status === "planned" && transaction.type === "income"
        )
        .sort((a, b) => toDateTime(a.date) - toDateTime(b.date)),
    [transactions]
  );

  const plannedExpense = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.status === "planned" && transaction.type === "expense"
        )
        .sort((a, b) => toDateTime(a.date) - toDateTime(b.date)),
    [transactions]
  );

  const handleOpenCreateModal = (projectId?: string) => {
    setCreateModalPrefillProjectId(projectId ?? prefillProjectIdForCreate);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateModalPrefillProjectId(undefined);
  };

  const handleOpenEditModal = (transactionId: string) => {
    setEditingTransactionId(transactionId);
  };

  const handleCloseEditModal = () => {
    setEditingTransactionId(null);
  };

  const handleCreateTransaction = (form: TransactionFormData) => {
    if (!user?.id || isSaving) {
      return;
    }

    const parsedAmount = Number(form.amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    void (async () => {
      try {
        const createdTransaction = await createTransaction(toTransactionPayload(form));

        setTransactions((prev) =>
          sortTransactions([createdTransaction, ...prev])
        );
        setCurrentPage(1);
        handleCloseCreateModal();
      } catch (error) {
        logFinancesError("Échec de création d'une transaction Firestore.", error);
        setErrorMessage("Impossible de créer la transaction.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleUpdateTransaction = (form: TransactionFormData) => {
    if (!user?.id || isSaving || !editingTransaction) {
      return;
    }

    const parsedAmount = Number(form.amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    void (async () => {
      try {
        const updatedTransaction = await updateTransaction(
          editingTransaction.id,
          toTransactionPayload(form)
        );

        setTransactions((prev) =>
          sortTransactions(
            prev.map((transaction) =>
              transaction.id === updatedTransaction.id
                ? updatedTransaction
                : transaction
            )
          )
        );
        handleCloseEditModal();
      } catch (error) {
        logFinancesError("Échec de mise à jour d'une transaction Firestore.", error);
        setErrorMessage("Impossible d'enregistrer la transaction.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (!user?.id || isSaving) {
      return;
    }

    const confirmed = window.confirm(
      "Supprimer cette transaction ? Cette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    void (async () => {
      try {
        await deleteTransaction(transactionId);
        setTransactions((prev) =>
          prev.filter((transaction) => transaction.id !== transactionId)
        );

        if (editingTransactionId === transactionId) {
          handleCloseEditModal();
        }
      } catch (error) {
        logFinancesError("Échec de suppression d'une transaction Firestore.", error);
        setErrorMessage("Impossible de supprimer la transaction.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedTransactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) {
        return false;
      }

      if (statusFilter !== "all" && transaction.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
        return false;
      }

      if (projectFilter === "without_project" && transaction.projectId) {
        return false;
      }

      if (
        projectFilter !== "all" &&
        projectFilter !== "without_project" &&
        transaction.projectId !== projectFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        transaction.title.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query) ||
        (transaction.notes?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [
    categoryFilter,
    projectFilter,
    searchQuery,
    sortedTransactions,
    statusFilter,
    typeFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE)
  );
  const activePage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (activePage - 1) * TRANSACTIONS_PER_PAGE;
    return filteredTransactions.slice(
      startIndex,
      startIndex + TRANSACTIONS_PER_PAGE
    );
  }, [activePage, filteredTransactions]);

  const pageStartIndex = filteredTransactions.length
    ? (activePage - 1) * TRANSACTIONS_PER_PAGE + 1
    : 0;
  const pageEndIndex = Math.min(
    activePage * TRANSACTIONS_PER_PAGE,
    filteredTransactions.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter, categoryFilter, projectFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const isFiltered =
    searchQuery.trim().length > 0 ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    projectFilter !== "all";

  if (isLoading) {
    return (
      <>
        <div className="page-header">
          <h1>Finances</h1>
          <p>
            Pilotez revenus, dépenses et flux prévus avec une vue mensuelle claire.
          </p>
        </div>

        <div className="section-card">
          <div className="section-card__body">
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Chargement des transactions...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finances</h1>
          <p className="page-desc">
            Pilotez revenus, dépenses et flux prévus avec une vue mensuelle claire.
          </p>
        </div>

        <button
          className="btn btn--primary"
          onClick={() => handleOpenCreateModal()}
          disabled={isSaving}
        >
          + Ajouter une transaction
        </button>
      </div>

      {isSaving && (
        <p
          style={{
            marginBottom: "12px",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}
        >
          Enregistrement de la transaction...
        </p>
      )}

      {errorMessage && (
        <div className="modal-error" role="alert">
          {errorMessage}
        </div>
      )}

      <FinanceSummary summary={summary} />

      <div className="finance-main-grid">
        <SectionCard title="Évolution mensuelle">
          <FinanceChart data={monthlyData} />
        </SectionCard>

        <SectionCard title="Prévisions">
          <FinanceForecast
            plannedIncome={plannedIncome}
            plannedExpense={plannedExpense}
            projectNameById={projectNameById}
          />
        </SectionCard>
      </div>

      <div className="finance-block">
        <TransactionsToolbar
          searchQuery={searchQuery}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          projectFilter={projectFilter}
          categoryOptions={categoryOptions}
          projectOptions={projectOptions}
          onSearchChange={setSearchQuery}
          onTypeFilterChange={setTypeFilter}
          onStatusFilterChange={setStatusFilter}
          onCategoryFilterChange={setCategoryFilter}
          onProjectFilterChange={setProjectFilter}
        />
      </div>

      <SectionCard
        title={`Transactions (${filteredTransactions.length})`}
        action={
          <span className="finance-section-meta">
            {pageStartIndex}-{pageEndIndex} / {filteredTransactions.length} (sur{" "}
            {sortedTransactions.length})
          </span>
        }
      >
        {filteredTransactions.length === 0 ? (
          <EmptyState
            title="Aucune transaction trouvée"
            description={
              isFiltered
                ? "Essayez d'élargir la recherche ou de réinitialiser les filtres."
                : "Les transactions apparaîtront ici dès qu'elles seront disponibles."
            }
          />
        ) : (
          <div className="finance-transactions-list">
            {paginatedTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                projectName={
                  transaction.projectId
                    ? projectNameById[transaction.projectId] ?? "Sans projet"
                    : undefined
                }
                isSaving={isSaving}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTransaction}
              />
            ))}
          </div>
        )}

        {filteredTransactions.length > TRANSACTIONS_PER_PAGE && (
          <div className="finance-pagination">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={activePage === 1}
              aria-label="Page précédente"
            >
              Précédente
            </button>

            <p className="finance-pagination__label">
              Page {activePage} / {totalPages}
            </p>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={activePage === totalPages}
              aria-label="Page suivante"
            >
              Suivante
            </button>
          </div>
        )}
      </SectionCard>

      <TransactionModal
        isOpen={isCreateModalOpen}
        projects={projectsData}
        prefillProjectId={createModalPrefillProjectId}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateTransaction}
      />

      <TransactionModal
        isOpen={editingTransaction !== null}
        initialData={editingTransaction}
        projects={projectsData}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateTransaction}
      />
    </>
  );
}
