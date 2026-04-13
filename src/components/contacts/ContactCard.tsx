import type { Contact } from "@/features/contacts/types";

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
const typeConfig: Record<
  Contact["type"],
  { label: string; badgeClass: string }
> = {
  client: { label: "Client", badgeClass: "badge badge--green" },
  prospect: { label: "Prospect", badgeClass: "badge badge--amber" },
  partner: { label: "Partenaire", badgeClass: "badge badge--accent" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

// -------------------------------------------------------
// Icons (inline SVG, no external dep)
// -------------------------------------------------------
const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 01.05 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);

// -------------------------------------------------------
// Props
// -------------------------------------------------------
interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------
export default function ContactCard({ contact, onClick }: ContactCardProps) {
  const { label, badgeClass } = typeConfig[contact.type];
  const fullName = contact.name.trim() || "Sans nom";
  const initials = getInitials(fullName);

  return (
    <div
      className={`contact-card ${onClick ? "contact-card--clickable" : ""}`}
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
      {/* Avatar */}
      <div className="contact-card__avatar" aria-hidden="true">
        {initials}
      </div>

      {/* Main info */}
      <div className="contact-card__body">
        <div className="contact-card__header">
          <span className="contact-card__name">{fullName}</span>
          <span className={badgeClass}>{label}</span>
        </div>

        {contact.organization && (
          <div className="contact-card__row">
            <BuildingIcon />
            <span>{contact.organization}</span>
          </div>
        )}

        {contact.email && (
          <div className="contact-card__row">
            <MailIcon />
            <a href={`mailto:${contact.email}`} className="contact-card__link">
              {contact.email}
            </a>
          </div>
        )}

        {contact.phone && !contact.email && (
          <div className="contact-card__row">
            <PhoneIcon />
            <a href={`tel:${contact.phone}`} className="contact-card__link">
              {contact.phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
