import Link from "next/link";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  iconBg?: string;
  href?: string; // rend la carte cliquable
}

export default function StatCard({ label, value, sub, icon, iconBg, href }: StatCardProps) {
  const content = (
    <>
      {icon && (
        <div
          className="stat-card__icon"
          style={{ background: iconBg ?? "var(--bg-elevated)" }}
        >
          {icon}
        </div>
      )}
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="stat-card stat-card--link">
        {content}
      </Link>
    );
  }

  return <div className="stat-card">{content}</div>;
}
