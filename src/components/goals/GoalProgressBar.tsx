interface GoalProgressBarProps {
  progress: number;
}

export default function GoalProgressBar({ progress }: GoalProgressBarProps) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const barClass =
    safeProgress >= 100
      ? "goal-progress__value goal-progress__value--completed"
      : safeProgress >= 70
        ? "goal-progress__value goal-progress__value--good"
        : safeProgress >= 40
          ? "goal-progress__value goal-progress__value--medium"
          : "goal-progress__value goal-progress__value--low";

  return (
    <div className="goal-progress" aria-hidden="true">
      <div className={barClass} style={{ width: `${safeProgress}%` }} />
    </div>
  );
}
