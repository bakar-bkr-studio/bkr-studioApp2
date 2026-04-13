import type { Transaction } from "@/features/finances/types";

interface FinanceForecastProps {
  plannedIncome: Transaction[];
  plannedExpense: Transaction[];
  projectNameById: Record<string, string>;
}

const formatEuro = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

function ForecastList({
  items,
  projectNameById,
  emptyMessage,
  amountClass,
}: {
  items: Transaction[];
  projectNameById: Record<string, string>;
  emptyMessage: string;
  amountClass: string;
}) {
  if (items.length === 0) {
    return <p className="finance-empty-inline">{emptyMessage}</p>;
  }

  return (
    <div className="finance-forecast__list">
      {items.map((transaction) => {
        const projectName = transaction.projectId
          ? projectNameById[transaction.projectId]
          : undefined;

        return (
          <div key={transaction.id} className="finance-forecast__item">
            <div>
              <p className="finance-forecast__title">{transaction.title}</p>
              <p className="finance-forecast__meta">
                {formatDate(transaction.date)}
                {projectName ? ` · ${projectName}` : " · Sans projet"}
              </p>
            </div>
            <p className={`finance-forecast__amount ${amountClass}`}>
              {formatEuro(transaction.amount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ForecastBlock({
  title,
  badgeClass,
  total,
  items,
  projectNameById,
  emptyMessage,
  amountClass,
}: {
  title: string;
  badgeClass: string;
  total: number;
  items: Transaction[];
  projectNameById: Record<string, string>;
  emptyMessage: string;
  amountClass: string;
}) {
  return (
    <section className="finance-forecast-block">
      <div className="finance-forecast-block__head">
        <div>
          <h3>{title}</h3>
          <p className="finance-forecast-block__total">{formatEuro(total)}</p>
        </div>
        <span className={`badge ${badgeClass}`}>Prévu</span>
      </div>

      <ForecastList
        items={items}
        projectNameById={projectNameById}
        emptyMessage={emptyMessage}
        amountClass={amountClass}
      />
    </section>
  );
}

export default function FinanceForecast({
  plannedIncome,
  plannedExpense,
  projectNameById,
}: FinanceForecastProps) {
  const totalIncome = plannedIncome.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = plannedExpense.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="finance-forecast-grid">
      <ForecastBlock
        title="À encaisser"
        badgeClass="badge--accent"
        total={totalIncome}
        items={plannedIncome}
        projectNameById={projectNameById}
        emptyMessage="Aucun encaissement prévu."
        amountClass="text-green"
      />

      <ForecastBlock
        title="À payer"
        badgeClass="badge--amber"
        total={totalExpense}
        items={plannedExpense}
        projectNameById={projectNameById}
        emptyMessage="Aucune dépense prévue."
        amountClass="text-red"
      />
    </div>
  );
}
