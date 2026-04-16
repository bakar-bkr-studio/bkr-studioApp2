/**
 * PageLoader — skeleton shimmer animé pour les états de chargement
 *
 * Variantes disponibles :
 *  - "dashboard"  : 6 stat-cards + 3 section-cards
 *  - "list"       : header + barre d'outils + liste de lignes
 *  - "kanban"     : header + 3 colonnes kanban
 *  - "cards"      : header + grille de cartes (contacts, projets, objectifs)
 *  - "profile"    : en-tête profil + champs de formulaire
 *  - "default"    : bloc unique simple
 */

type PageLoaderVariant =
  | "dashboard"
  | "list"
  | "kanban"
  | "cards"
  | "profile"
  | "default";

interface PageLoaderProps {
  variant?: PageLoaderVariant;
  title?: string;
  description?: string;
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function Shimmer({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton-shimmer ${className}`} style={style} aria-hidden="true" />;}

function SkeletonLine({ width = "100%", height = "14px" }: { width?: string; height?: string }) {
  return (
    <div
      className="skeleton-shimmer skeleton-line"
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

function SkeletonPageHeader({ title, description }: { title?: string; description?: string }) {
  return (
    <div className="page-header" aria-hidden="true">
      {title ? (
        <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700 }}>
          {title}
        </h1>
      ) : (
        <SkeletonLine width="160px" height="24px" />
      )}
      <div style={{ marginTop: "6px" }}>
        {description ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{description}</p>
        ) : (
          <SkeletonLine width="260px" height="14px" />
        )}
      </div>
    </div>
  );
}

// ─── Variants ────────────────────────────────────────────────────────────────

function DashboardLoader({ title, description }: { title?: string; description?: string }) {
  return (
    <>
      <SkeletonPageHeader title={title} description={description} />

      {/* Quick actions */}
      <div className="quick-actions" style={{ marginBottom: "24px" }}>
        {[120, 150, 130].map((w, i) => (
          <Shimmer key={i} className="skeleton-btn" style={{ width: w }} />
        ))}
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stat-card">
            <Shimmer className="skeleton-icon" />
            <SkeletonLine width="70%" height="12px" />
            <SkeletonLine width="90px" height="28px" />
            <SkeletonLine width="50%" height="11px" />
          </div>
        ))}
      </div>

      {/* Section cards */}
      <div className="dashboard-grid" style={{ marginTop: "20px" }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="section-card">
            <div className="section-card__header">
              <SkeletonLine width="120px" height="14px" />
            </div>
            <div className="section-card__body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                    <SkeletonLine width="70%" height="13px" />
                    <SkeletonLine width="40%" height="11px" />
                  </div>
                  <Shimmer className="skeleton-badge" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ListLoader({ title, description }: { title?: string; description?: string }) {
  return (
    <>
      <SkeletonPageHeader title={title} description={description} />

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
        <Shimmer className="skeleton-input" style={{ flex: 1, maxWidth: "280px" }} />
        <Shimmer className="skeleton-btn" style={{ width: "110px" }} />
        <Shimmer className="skeleton-btn" style={{ width: "110px" }} />
      </div>

      {/* List rows */}
      <div className="section-card">
        <div className="section-card__header">
          <SkeletonLine width="150px" height="14px" />
        </div>
        <div className="section-card__body" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: i < 5 ? "1px solid var(--border)" : "none",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                <SkeletonLine width={`${55 + (i % 3) * 15}%`} height="13px" />
                <SkeletonLine width={`${30 + (i % 2) * 20}%`} height="11px" />
              </div>
              <Shimmer className="skeleton-badge" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function KanbanLoader({ title, description }: { title?: string; description?: string }) {
  return (
    <>
      <SkeletonPageHeader title={title} description={description} />

      {/* Summary strip */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Shimmer key={i} className="skeleton-badge" style={{ height: "32px", borderRadius: "8px", flex: 1 }} />
        ))}
      </div>

      {/* 3 kanban columns */}
      <div className="kanban-grid">
        {["À faire", "En cours", "Terminé"].map((label, col) => (
          <div key={col} className="section-card">
            <div className="section-card__header">
              <SkeletonLine width="80px" height="13px" />
              <Shimmer className="skeleton-badge" style={{ width: "24px", height: "20px" }} />
            </div>
            <div
              className="section-card__body"
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {Array.from({ length: 2 + (col % 2) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-elevated)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <SkeletonLine width={`${60 + i * 10}%`} height="13px" />
                  <SkeletonLine width="45%" height="11px" />
                  <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                    <Shimmer className="skeleton-badge" />
                    <Shimmer className="skeleton-badge" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CardsLoader({ title, description }: { title?: string; description?: string }) {
  return (
    <>
      <SkeletonPageHeader title={title} description={description} />

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <Shimmer className="skeleton-input" style={{ flex: 1, maxWidth: "280px" }} />
        <Shimmer className="skeleton-btn" style={{ width: "130px" }} />
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Shimmer className="skeleton-avatar" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <SkeletonLine width="65%" height="14px" />
                <SkeletonLine width="40%" height="11px" />
              </div>
              <Shimmer className="skeleton-badge" />
            </div>
            <SkeletonLine width="90%" height="11px" />
            <SkeletonLine width="55%" height="11px" />
          </div>
        ))}
      </div>
    </>
  );
}

function ProfileLoader({ title, description }: { title?: string; description?: string }) {
  return (
    <>
      <SkeletonPageHeader title={title} description={description} />

      {/* Profile header card */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <Shimmer className="skeleton-avatar" style={{ width: "60px", height: "60px" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkeletonLine width="180px" height="20px" />
          <SkeletonLine width="120px" height="13px" />
          <SkeletonLine width="90px" height="11px" />
        </div>
      </div>

      {/* Form-like sections */}
      {Array.from({ length: 2 }).map((_, section) => (
        <div key={section} className="section-card" style={{ marginBottom: "16px" }}>
          <div className="section-card__header">
            <SkeletonLine width="140px" height="14px" />
          </div>
          <div className="section-card__body" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                }}
              >
                <SkeletonLine width="120px" height="13px" />
                <SkeletonLine width="150px" height="13px" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function DefaultLoader({ title, description }: { title?: string; description?: string }) {
  return (
    <>
      <SkeletonPageHeader title={title} description={description} />
      <div className="section-card">
        <div className="section-card__body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} width={`${80 - i * 10}%`} height="14px" />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function PageLoader({
  variant = "default",
  title,
  description,
}: PageLoaderProps) {
  const props = { title, description };

  return (
    <div
      role="status"
      aria-label="Chargement en cours…"
      aria-busy="true"
      className="page-loader"
    >
      {variant === "dashboard" && <DashboardLoader {...props} />}
      {variant === "list" && <ListLoader {...props} />}
      {variant === "kanban" && <KanbanLoader {...props} />}
      {variant === "cards" && <CardsLoader {...props} />}
      {variant === "profile" && <ProfileLoader {...props} />}
      {variant === "default" && <DefaultLoader {...props} />}
    </div>
  );
}
