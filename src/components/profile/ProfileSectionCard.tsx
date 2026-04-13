import type { ReactNode } from "react";

export type ProfileSectionTone = "identity" | "contact" | "activity" | "account";

interface ProfileSectionCardProps {
  title: string;
  description?: string;
  tone: ProfileSectionTone;
  children: ReactNode;
}

export default function ProfileSectionCard({
  title,
  description,
  tone,
  children,
}: ProfileSectionCardProps) {
  return (
    <section className={`profile-section-card profile-section-card--${tone}`} aria-label={title}>
      <header className="profile-section-card__header">
        <h2 className="profile-section-card__title">{title}</h2>
        {description && <p className="profile-section-card__description">{description}</p>}
      </header>

      <div className="profile-section-card__body">{children}</div>
    </section>
  );
}
