import type { Goal } from "@/features/goals/types";
import { getGoalProgress } from "@/lib/goal-utils";
import GoalProgressBar from "@/components/goals/GoalProgressBar";

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

const horizonLabel: Record<Goal["horizon"], string> = {
  week: "Semaine",
  month: "Mois",
  quarter: "Trimestre",
  year: "Année",
};

const statusConfig: Record<Goal["status"], { label: string; badgeClass: string }> = {
  active: { label: "Actif", badgeClass: "badge badge--accent" },
  completed: { label: "Terminé", badgeClass: "badge badge--green" },
  at_risk: { label: "À risque", badgeClass: "badge badge--amber" },
  paused: { label: "En pause", badgeClass: "badge badge--neutral" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function GoalCard({ goal, onClick }: GoalCardProps) {
  const status = statusConfig[goal.status];
  const isQuantitative = goal.type === "quantitative";
  const hasTarget = typeof goal.targetValue === "number" && goal.targetValue > 0;
  const progress = getGoalProgress(goal);

  return (
    <article
      className={`goal-card ${onClick ? "goal-card--clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="goal-card__header">
        <div>
          <h3 className="goal-card__title">{goal.title}</h3>
          {goal.description && (
            <p className="goal-card__description">{goal.description}</p>
          )}
        </div>
        <div className="goal-card__badges">
          <span className="badge badge--neutral">{horizonLabel[goal.horizon]}</span>
          <span className={status.badgeClass}>{status.label}</span>
        </div>
      </div>

      <div className="goal-card__meta">
        {goal.dueDate && (
          <span className="goal-card__meta-item">
            Échéance : {formatDate(goal.dueDate)}
          </span>
        )}
        <span className="goal-card__meta-item">
          {isQuantitative ? "Objectif quantitatif" : "Objectif qualitatif"}
        </span>
      </div>

      {isQuantitative ? (
        hasTarget ? (
          <div className="goal-card__quantitative">
            <div className="goal-card__metrics">
              <span>
                {goal.currentValue ?? 0} / {goal.targetValue}
                {goal.unit ? ` ${goal.unit}` : ""}
              </span>
              <span>{progress}%</span>
            </div>
            <GoalProgressBar progress={progress} />
          </div>
        ) : (
          <p className="goal-card__hint">Cible quantitative à définir.</p>
        )
      ) : (
        <p className="goal-card__hint">
          Suivi qualitatif en cours. {goal.notes ? goal.notes : "Pas de note pour le moment."}
        </p>
      )}
    </article>
  );
}
