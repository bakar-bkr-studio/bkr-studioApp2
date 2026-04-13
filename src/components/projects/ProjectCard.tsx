import { Fragment } from "react";
import type { Project } from "@/features/projects/types";

// -------------------------------------------------------
// Icons
// -------------------------------------------------------
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);

// -------------------------------------------------------
// Config statuts
// -------------------------------------------------------
const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  lead: { label: "Lead", badgeClass: "badge badge--neutral" },
  confirmed: { label: "Confirmé", badgeClass: "badge badge--accent" },
  in_progress: { label: "En cours", badgeClass: "badge badge--amber" },
  editing: { label: "Post-prod", badgeClass: "badge badge--purple" },
  delivered: { label: "Livré", badgeClass: "badge badge--green" },
  completed: { label: "Terminé", badgeClass: "badge badge--green" },
  cancelled: { label: "Annulé", badgeClass: "badge badge--red" },
};

// -------------------------------------------------------
// Helper format monétaire
// -------------------------------------------------------
const formatEuro = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// -------------------------------------------------------
// Composant Timeline
// -------------------------------------------------------
const TIMELINE_STEPS = ["lead", "confirmed", "in_progress", "editing", "delivered", "completed"];

function ProjectTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="project-timeline" aria-label="Projet annulé">
        <div className="timeline-node timeline-node--cancelled" title="Annulé" />
        <div className="timeline-line timeline-line--cancelled" />
        <div className="timeline-node timeline-node--cancelled" />
      </div>
    );
  }

  const currentIndex = TIMELINE_STEPS.indexOf(status);

  return (
    <div className="project-timeline" aria-label="Progression du projet">
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index <= currentIndex;
        const isActive = index === currentIndex;
        const isLast = index === TIMELINE_STEPS.length - 1;

        let nodeClass = "timeline-node";
        if (isActive) nodeClass += " timeline-node--active";
        else if (isDone) nodeClass += " timeline-node--done";

        let lineClass = "timeline-line";
        if (index < currentIndex) lineClass += " timeline-line--done";

        return (
          <Fragment key={step}>
            <div className={nodeClass} title={statusConfig[step]?.label || step} />
            {!isLast && <div className={lineClass} />}
          </Fragment>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------
// Component ProjectCard
// -------------------------------------------------------
interface ProjectCardProps {
  project: Project;
  contactName: string;
  onClick?: () => void;
}

export default function ProjectCard({ project, contactName, onClick }: ProjectCardProps) {
  const statusInfo = statusConfig[project.status] || { label: project.status, badgeClass: "badge badge--neutral" };
  const isFreeProject = project.amountQuoted <= 0;

  // Date de référence (shoot ou livraison)
  let dateText = "";
  if (project.shootDate) {
    dateText = `Shoot : ${new Date(project.shootDate).toLocaleDateString("fr-FR")}`;
  } else if (project.deliveryDate) {
    dateText = `Livraison : ${new Date(project.deliveryDate).toLocaleDateString("fr-FR")}`;
  }

  // Paiement
  let paymentLabel = "Non payé";
  let paymentColor = "var(--red)";

  if (isFreeProject) {
    paymentLabel = "Sans devis";
    paymentColor = "var(--accent)";
  } else if (project.amountPaid >= project.amountQuoted && project.amountQuoted > 0) {
    paymentLabel = "Payé";
    paymentColor = "var(--green)";
  } else if (project.amountPaid > 0) {
    paymentLabel = "Partiel";
    paymentColor = "var(--amber)";
  }

  return (
    <div
      className={`project-card ${onClick ? "project-card--clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="project-card__header">
        <div>
          <div className="project-card__title">{project.title}</div>
          <div className="project-card__contact">
            <UserIcon />
            {contactName}
          </div>
        </div>
        <span className={statusInfo.badgeClass}>{statusInfo.label}</span>
      </div>

      <div className="project-card__body">
        <div className="project-card__row">
          <BriefcaseIcon />
          <span>{project.serviceType || "Service non défini"}</span>
        </div>
        {dateText && (
          <div className="project-card__row">
            <CalendarIcon />
            <span>{dateText}</span>
          </div>
        )}
      </div>

      <ProjectTimeline status={project.status} />

      <div className="project-card__footer">
        {isFreeProject ? (
          <div className="project-card__finances">
            <span className="project-card__amount" style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Sans devis
            </span>
            <span className="project-card__paid" style={{ color: paymentColor }}>
              {paymentLabel}
            </span>
          </div>
        ) : (
          <div className="project-card__finances">
            <span className="project-card__amount">{formatEuro(project.amountQuoted)}</span>
            <span className="project-card__paid" style={{ color: paymentColor }}>
              {paymentLabel} ({formatEuro(project.amountPaid)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
