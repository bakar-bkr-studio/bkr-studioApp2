import type { ReactNode } from "react";

interface SettingsSectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  showEditButton?: boolean;
}

export default function SettingsSectionCard({
  title,
  description,
  children,
  showEditButton = false,
}: SettingsSectionCardProps) {
  return (
    <section className="settings-section-card" aria-label={title}>
      <header className="settings-section-card__header">
        <div>
          <h2 className="settings-section-card__title">{title}</h2>
          {description && (
            <p className="settings-section-card__description">{description}</p>
          )}
        </div>

        {showEditButton && (
          <button
            type="button"
            className="settings-section-card__edit-btn"
            disabled
            aria-disabled="true"
            title="Disponible dans une prochaine version"
          >
            Modifier
          </button>
        )}
      </header>

      <div className="settings-section-card__body">{children}</div>
    </section>
  );
}
