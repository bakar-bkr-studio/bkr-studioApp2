"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageLoader from "@/components/PageLoader";
import StatCard from "@/components/StatCard";
import SectionCard from "@/components/SectionCard";
import DashboardNotes from "@/components/dashboard/DashboardNotes";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import DashboardLinks from "@/components/dashboard/DashboardLinks";
import { listUserTransactions } from "@/features/finances/api/transactions";
import type { Transaction } from "@/features/finances/types";
import { listUserGoals } from "@/features/goals/api/goals";
import type { Goal } from "@/features/goals/types";
import {
  getUserDashboardData,
  type UserDashboardData,
} from "@/features/profile/api/profile";
import { listUserProjects } from "@/features/projects/api/projects";
import type { Project, ProjectStatus } from "@/features/projects/types";
import { listUserTasks } from "@/features/tasks/api/tasks";
import type { Task } from "@/features/tasks/types";
import { useAuth } from "@/lib/auth/use-auth";
import { getGoalProgress } from "@/lib/goal-utils";

const EMPTY_DASHBOARD_DATA: UserDashboardData = {
  dashboardNotes: null,
  usefulLinks: [],
};

const formatEuro = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const statusLabel: Record<ProjectStatus, string> = {
  lead: "Lead",
  confirmed: "Confirmé",
  in_progress: "En cours",
  editing: "Montage",
  delivered: "Livré",
  completed: "Terminé",
  cancelled: "Annulé",
};

const statusBadgeClass: Record<ProjectStatus, string> = {
  lead: "badge badge--neutral",
  confirmed: "badge badge--accent",
  in_progress: "badge badge--amber",
  editing: "badge badge--amber",
  delivered: "badge badge--green",
  completed: "badge badge--green",
  cancelled: "badge badge--red",
};

const priorityBadgeClass: Record<Task["priority"], string> = {
  high: "badge badge--red",
  medium: "badge badge--amber",
  low: "badge badge--neutral",
};

const priorityLabel: Record<Task["priority"], string> = {
  high: "Urgent",
  medium: "Moyen",
  low: "Faible",
};

function getMonthKey(date: string) {
  const datePart = date.split("T")[0] ?? "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart.slice(0, 7);
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function isProjectActive(status: ProjectStatus) {
  return status !== "completed" && status !== "cancelled";
}

// Icônes StatCards
const IconRevenue = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const IconExpense = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);

const IconProfit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconProjects = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6h20M2 12h20M2 18h20" />
  </svg>
);

const IconTasks = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const IconGoals = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export default function DashboardPageClient() {
  const { isReady, user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardData, setDashboardData] = useState<UserDashboardData>(
    EMPTY_DASHBOARD_DATA
  );

  const [isLoading, setIsLoading] = useState(true);
  const [globalErrorMessage, setGlobalErrorMessage] = useState("");
  const [profileErrorMessage, setProfileErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!isReady) {
        return;
      }

      if (!user?.id) {
        if (isMounted) {
          setProjects([]);
          setTasks([]);
          setGoals([]);
          setTransactions([]);
          setDashboardData(EMPTY_DASHBOARD_DATA);
          setGlobalErrorMessage("Session utilisateur introuvable.");
          setProfileErrorMessage(
            "Profil indisponible. Le bloc-notes et les liens utiles restent en mode vide."
          );
          setIsLoading(false);
        }

        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setGlobalErrorMessage("");
        setProfileErrorMessage("");
      }

      const [projectsResult, tasksResult, transactionsResult, goalsResult, profileResult] =
        await Promise.allSettled([
          listUserProjects(),
          listUserTasks(),
          listUserTransactions(),
          listUserGoals(),
          getUserDashboardData(),
        ]);

      if (!isMounted) {
        return;
      }

      const failedMainBlocks: string[] = [];

      if (projectsResult.status === "fulfilled") {
        setProjects(projectsResult.value);
      } else {
        setProjects([]);
        failedMainBlocks.push("projets");
      }

      if (tasksResult.status === "fulfilled") {
        setTasks(tasksResult.value);
      } else {
        setTasks([]);
        failedMainBlocks.push("tâches");
      }

      if (transactionsResult.status === "fulfilled") {
        setTransactions(transactionsResult.value);
      } else {
        setTransactions([]);
        failedMainBlocks.push("finances");
      }

      if (goalsResult.status === "fulfilled") {
        setGoals(goalsResult.value);
      } else {
        setGoals([]);
        failedMainBlocks.push("objectifs");
      }

      if (profileResult.status === "fulfilled") {
        setDashboardData(profileResult.value);
      } else {
        setDashboardData(EMPTY_DASHBOARD_DATA);
        setProfileErrorMessage(
          "Impossible de charger le profil Firestore (bloc-notes et liens utiles indisponibles)."
        );
      }

      if (failedMainBlocks.length > 0) {
        setGlobalErrorMessage(
          `Certaines données du dashboard n'ont pas pu être chargées: ${failedMainBlocks.join(", ")}.`
        );
      }

      setIsLoading(false);
    }

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [isReady, user?.email, user?.id]);

  const dashboardAggregates = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((project) =>
      isProjectActive(project.status)
    ).length;
    const completedProjects = projects.filter(
      (project) => project.status === "completed"
    ).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "done").length;
    const inProgressTasks = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;

    const completedTransactions = transactions.filter(
      (transaction) => transaction.status === "completed"
    );

    const totalIncome = completedTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpenses = completedTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const currentMonthKey = getCurrentMonthKey();
    const monthlyIncome = completedTransactions
      .filter(
        (transaction) =>
          transaction.type === "income" &&
          getMonthKey(transaction.date) === currentMonthKey
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalGoals = goals.length;
    const activeGoals = goals.filter((goal) => goal.status === "active").length;
    const completedGoals = goals.filter(
      (goal) => goal.status === "completed"
    ).length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      monthlyIncome,
      totalGoals,
      activeGoals,
      completedGoals,
    };
  }, [goals, projects, tasks, transactions]);

  const urgentTasks = useMemo(
    () => tasks.filter((task) => task.priority === "high" && task.status !== "done"),
    [tasks]
  );

  const activeProjectsList = useMemo(
    () => projects.filter((project) => isProjectActive(project.status)),
    [projects]
  );

  const activeGoalsList = useMemo(
    () => goals.filter((goal) => goal.status === "active"),
    [goals]
  );

  if (!isReady || isLoading) {
    return <PageLoader variant="dashboard" title="Dashboard" description="Aperçu de votre activité" />;
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Aperçu de votre activité" />

      {globalErrorMessage && (
        <div className="modal-error" role="alert" style={{ marginBottom: "12px" }}>
          {globalErrorMessage}
        </div>
      )}

      <div className="quick-actions">
        <Link href="/projects" className="btn-quick btn-quick--primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau projet
        </Link>
        <Link href="/finances" className="btn-quick">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter une dépense
        </Link>
        <Link href="/tasks" className="btn-quick">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouvelle tâche
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Revenus du mois"
          value={formatEuro(dashboardAggregates.monthlyIncome)}
          sub="transactions income complétées"
          icon={<IconRevenue />}
          iconBg="var(--green-subtle)"
          href="/finances"
        />
        <StatCard
          label="Dépenses totales"
          value={formatEuro(dashboardAggregates.totalExpenses)}
          sub="transactions expense complétées"
          icon={<IconExpense />}
          iconBg="var(--red-subtle)"
          href="/finances"
        />
        <StatCard
          label="Solde"
          value={formatEuro(dashboardAggregates.balance)}
          sub="revenus - dépenses"
          icon={<IconProfit />}
          iconBg="var(--accent-subtle)"
          href="/finances"
        />
        <StatCard
          label="Projets actifs"
          value={String(dashboardAggregates.activeProjects)}
          sub={`${dashboardAggregates.completedProjects} terminés / ${dashboardAggregates.totalProjects} total`}
          icon={<IconProjects />}
          iconBg="var(--amber-subtle)"
          href="/projects"
        />
        <StatCard
          label="Tâches terminées"
          value={String(dashboardAggregates.completedTasks)}
          sub={`${dashboardAggregates.inProgressTasks} en cours / ${dashboardAggregates.totalTasks} total`}
          icon={<IconTasks />}
          iconBg="var(--red-subtle)"
          href="/tasks"
        />
        <StatCard
          label="Objectifs actifs"
          value={String(dashboardAggregates.activeGoals)}
          sub={`${dashboardAggregates.completedGoals} terminés / ${dashboardAggregates.totalGoals} total`}
          icon={<IconGoals />}
          iconBg="var(--accent-subtle)"
          href="/goals"
        />
      </div>

      {/* ── Calendrier de pilotage ── */}
      <div className="dashboard-calendar-section">
        <div className="dashboard-calendar-section__header">
          <h2 className="dashboard-calendar-section__title">Calendrier</h2>
          <p className="dashboard-calendar-section__sub">
            Échéances et événements de votre activité
          </p>
        </div>
        <DashboardCalendar
          tasks={tasks}
          projects={projects}
          goals={goals}
        />
      </div>

      <div className="dashboard-utility-grid">
        <div className="dashboard-notes-card">
          <SectionCard title="Bloc-notes">
            <DashboardNotes
              userId={user?.id ?? null}
              initialNotes={dashboardData.dashboardNotes}
              profileErrorMessage={profileErrorMessage}
            />
          </SectionCard>
        </div>
        <div className="dashboard-links-card">
          <SectionCard title="Liens utiles">
            <DashboardLinks
              userId={user?.id ?? null}
              initialLinks={dashboardData.usefulLinks}
              profileErrorMessage={profileErrorMessage}
            />
          </SectionCard>
        </div>
      </div>

      <div className="dashboard-grid">
        <SectionCard
          title="Tâches urgentes"
          action={<Link href="/tasks" className="section-link">Voir tout →</Link>}
        >
          {urgentTasks.length === 0 ? (
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Aucune tâche urgente.
            </p>
          ) : (
            urgentTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className="list-item"
                style={{ display: "flex", textDecoration: "none" }}
              >
                <div>
                  <div className="list-item__title">{task.title}</div>
                  {task.dueDate && (
                    <div className="list-item__sub" suppressHydrationWarning>
                      Échéance : {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                </div>
                <span className={priorityBadgeClass[task.priority]}>
                  {priorityLabel[task.priority]}
                </span>
              </Link>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Projets actifs"
          action={<Link href="/projects" className="section-link">Voir tout →</Link>}
        >
          {activeProjectsList.length === 0 ? (
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Aucun projet actif pour le moment.
            </p>
          ) : (
            activeProjectsList.map((project) => (
              <Link
                key={project.id}
                href="/projects"
                className="list-item"
                style={{ display: "flex", textDecoration: "none" }}
              >
                <div>
                  <div className="list-item__title">{project.title}</div>
                  <div className="list-item__sub">
                    {project.serviceType || "Service non défini"}
                  </div>
                </div>
                <span className={statusBadgeClass[project.status]}>
                  {statusLabel[project.status]}
                </span>
              </Link>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Objectifs en cours"
          action={<Link href="/goals" className="section-link">Voir tout →</Link>}
        >
          {activeGoalsList.length === 0 ? (
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Aucun objectif actif.
            </p>
          ) : (
            activeGoalsList.map((goal) => {
              const showProgress =
                goal.type === "quantitative" && typeof goal.targetValue === "number";
              const progress = getGoalProgress(goal);

              return (
                <div
                  key={goal.id}
                  style={{
                    paddingBottom: "14px",
                    borderBottom: "1px solid var(--border)",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span className="list-item__title">{goal.title}</span>
                    {showProgress && (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {progress}%
                      </span>
                    )}
                  </div>
                  {showProgress && (
                    <div
                      style={{
                        height: "4px",
                        background: "var(--bg-elevated)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: "100%",
                          background: progress >= 80 ? "var(--green)" : "var(--accent)",
                          borderRadius: "2px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </SectionCard>
      </div>
    </>
  );
}
