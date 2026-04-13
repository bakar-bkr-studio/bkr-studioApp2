import type { Goal } from "@/features/goals/types";

interface GoalsSummaryProps {
  goals: Goal[];
}

export default function GoalsSummary({ goals }: GoalsSummaryProps) {
  const activeCount = goals.filter((goal) => goal.status === "active").length;
  const atRiskCount = goals.filter((goal) => goal.status === "at_risk").length;
  const completedCount = goals.filter((goal) => goal.status === "completed").length;

  return (
    <div className="goals-summary-grid">
      <div className="stat-card">
        <div className="stat-card__label">Objectifs actifs</div>
        <div className="stat-card__value">{activeCount}</div>
        <div className="stat-card__sub">en cours de suivi</div>
      </div>

      <div className="stat-card">
        <div className="stat-card__label">Objectifs à risque</div>
        <div className="stat-card__value">{atRiskCount}</div>
        <div className="stat-card__sub">nécessitent une action</div>
      </div>

      <div className="stat-card">
        <div className="stat-card__label">Objectifs terminés</div>
        <div className="stat-card__value">{completedCount}</div>
        <div className="stat-card__sub">validés sur la période</div>
      </div>
    </div>
  );
}
