import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <div className="section-card">
      <div className="section-card__header">
        <span className="section-card__title">{title}</span>
        {action}
      </div>
      <div className="section-card__body">{children}</div>
    </div>
  );
}
