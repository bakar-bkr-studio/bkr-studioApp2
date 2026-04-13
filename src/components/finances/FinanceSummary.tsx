import type { FinanceSummary as FinanceSummaryData } from "@/lib/finance-utils";

interface FinanceSummaryProps {
  summary: FinanceSummaryData;
}

const formatEuro = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatSignedEuro = (amount: number) => {
  if (amount === 0) {
    return formatEuro(0);
  }

  return `${amount > 0 ? "+" : "−"}${formatEuro(Math.abs(amount))}`;
};

const kpis = (summary: FinanceSummaryData) => [
  {
    label: "Revenus encaissés",
    value: formatEuro(summary.totalIncomeCompleted),
    hint: "Flux income réalisés",
    tone: "positive",
  },
  {
    label: "Dépenses réalisées",
    value: formatEuro(summary.totalExpenseCompleted),
    hint: "Flux expense réalisés",
    tone: "negative",
  },
  {
    label: "Solde net réalisé",
    value: formatSignedEuro(summary.netCompleted),
    hint: "Revenus réalisés − dépenses réalisées",
    tone: summary.netCompleted >= 0 ? "positive" : "negative",
  },
  {
    label: "Flux à venir net",
    value: formatSignedEuro(summary.netPlanned),
    hint: "Prévisions: à encaisser − à payer",
    tone: summary.netPlanned >= 0 ? "accent" : "warning",
  },
] as const;

export default function FinanceSummary({ summary }: FinanceSummaryProps) {
  return (
    <div className="finance-kpi-grid">
      {kpis(summary).map((kpi) => (
        <article key={kpi.label} className="finance-kpi-card">
          <p className="finance-kpi-card__label">{kpi.label}</p>
          <p className={`finance-kpi-card__value finance-kpi-card__value--${kpi.tone}`}>
            {kpi.value}
          </p>
          <p className="finance-kpi-card__hint">{kpi.hint}</p>
        </article>
      ))}
    </div>
  );
}
