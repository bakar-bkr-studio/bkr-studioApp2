interface ProfileAvatarProps {
  displayName: string;
  avatarUrl?: string;
}

function getInitials(displayName: string): string {
  const tokens = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (tokens.length === 0) {
    return "BK";
  }

  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("");
}

export default function ProfileAvatar({ displayName, avatarUrl }: ProfileAvatarProps) {
  const hasAvatar = typeof avatarUrl === "string" && avatarUrl.trim().length > 0;

  if (hasAvatar) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar de ${displayName}`}
        className="profile-avatar profile-avatar--image"
      />
    );
  }

  return (
    <div className="profile-avatar profile-avatar--fallback" aria-label="Avatar utilisateur">
      {getInitials(displayName)}
    </div>
  );
}
