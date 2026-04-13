import type { UserProfile } from "@/types";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileStatusBadge from "@/components/profile/ProfileStatusBadge";

interface ProfileHeaderProps {
  profile: UserProfile;
  onEdit?: () => void;
}

function getHeadlineDetails(profile: UserProfile): string {
  const details = [profile.role, profile.specialty].filter(Boolean);
  return details.join(" • ");
}

export default function ProfileHeader({ profile, onEdit }: ProfileHeaderProps) {
  const headlineDetails = getHeadlineDetails(profile);
  const canEdit = typeof onEdit === "function";

  return (
    <section className="profile-header-card" aria-label="Résumé du profil">
      <div className="profile-header-card__identity">
        <ProfileAvatar displayName={profile.displayName} avatarUrl={profile.avatarUrl} />

        <div className="profile-header-card__meta">
          <h2 className="profile-header-card__name">{profile.displayName}</h2>

          {profile.businessName && (
            <p className="profile-header-card__business">{profile.businessName}</p>
          )}

          {headlineDetails && (
            <p className="profile-header-card__details">{headlineDetails}</p>
          )}

          <div className="profile-header-card__badges">
            <ProfileStatusBadge status={profile.accountStatus} />
            <span
              className={`badge ${profile.accountStatus === "firebase" ? "badge--green" : "badge--neutral"}`}
            >
              {profile.accountStatus === "firebase" ? "Données cloud" : "Mode mock"}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-header-card__actions">
        <button
          type="button"
          className={`btn btn--ghost ${canEdit ? "" : "btn--disabled"}`}
          disabled={!canEdit}
          aria-disabled={!canEdit}
          onClick={canEdit ? onEdit : undefined}
          title={canEdit ? "Modifier les informations du profil" : "Disponible dans une prochaine version"}
        >
          Modifier le profil
        </button>
      </div>
    </section>
  );
}
