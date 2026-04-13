import type { UserProfile } from "@/types";

interface ProfileStatusBadgeProps {
  status: UserProfile["accountStatus"];
}

const statusConfig: Record<UserProfile["accountStatus"], { label: string; toneClass: string }> = {
  mock: { label: "Mock", toneClass: "badge--amber" },
  firebase: { label: "Firebase", toneClass: "badge--green" },
};

export default function ProfileStatusBadge({ status }: ProfileStatusBadgeProps) {
  const config = statusConfig[status];
  return <span className={`badge ${config.toneClass}`}>{config.label}</span>;
}
