import type { TaskCounts } from "@/lib/task-utils";
import StatCard from "@/components/StatCard";

interface TasksSummaryProps {
  counts: TaskCounts;
}

export default function TasksSummary({ counts }: TasksSummaryProps) {
  return (
    <div className="tasks-summary-grid">
      <StatCard label="Total tâches" value={String(counts.total)} sub="résultats affichés" />
      <StatCard label="Tâches urgentes" value={String(counts.highPriority)} sub="priorité haute" />
      <StatCard label="En retard" value={String(counts.overdue)} sub="échéance dépassée" />
      <StatCard label="Terminées" value={String(counts.done)} sub="statut done" />
    </div>
  );
}
