import type { Transaction } from "@/features/finances/types";

interface TransactionRowProps {
  transaction: Transaction;
  projectName?: string;
  isSaving?: boolean;
  onEdit?: (transactionId: string) => void;
  onDelete?: (transactionId: string) => void;
}

const typeLabel: Record<Transaction["type"], string> = {
  income: "Revenu",
  expense: "Dépense",
};

const statusLabel: Record<Transaction["status"], string> = {
  completed: "Réalisé",
  planned: "Prévu",
};

const paymentMethodLabel: Record<Transaction["paymentMethod"], string> = {
  transfer: "Virement",
  cash: "Espèces",
  card: "Carte",
  mobile_money: "Mobile money",
  other: "Autre",
};

const formatEuro = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date non définie";
  }

  return parsedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function TransactionRow({
  transaction,
  projectName,
  isSaving = false,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const amountPrefix = transaction.type === "income" ? "+" : "−";

  return (
    <article className="finance-transaction-row">
      <div className="finance-transaction-row__left">
        <div className="finance-transaction-row__head">
          <p className="finance-transaction-row__title">{transaction.title}</p>
          <div className="finance-transaction-row__chips">
            <span
              className={`badge ${
                transaction.type === "income" ? "badge--green" : "badge--red"
              }`}
            >
              {typeLabel[transaction.type]}
            </span>
            <span
              className={`badge ${
                transaction.status === "completed" ? "badge--neutral" : "badge--amber"
              }`}
            >
              {statusLabel[transaction.status]}
            </span>
            <span className="badge badge--neutral">{transaction.category}</span>
          </div>
        </div>

        <p className="finance-transaction-row__meta">
          {formatDate(transaction.date)} · {paymentMethodLabel[transaction.paymentMethod]}
          {projectName ? ` · ${projectName}` : " · Sans projet"}
        </p>

        {transaction.notes && (
          <p className="finance-transaction-row__notes">{transaction.notes}</p>
        )}
      </div>

      <div className="finance-transaction-row__right">
        <p
          className={`finance-transaction-row__amount ${
            transaction.type === "income" ? "text-green" : "text-red"
          }`}
        >
          {amountPrefix}
          {formatEuro(transaction.amount)}
        </p>

        {(onEdit || onDelete) && (
          <div className="finance-transaction-row__actions">
            {onEdit && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onEdit(transaction.id)}
                disabled={isSaving}
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => onDelete(transaction.id)}
                disabled={isSaving}
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
