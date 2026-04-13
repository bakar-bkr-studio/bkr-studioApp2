interface SettingsStatusBadgeProps {
  label: string;
  tone?: "neutral" | "accent" | "green" | "amber";
}

const toneClassMap: Record<NonNullable<SettingsStatusBadgeProps["tone"]>, string> = {
  neutral: "badge--neutral",
  accent: "badge--accent",
  green: "badge--green",
  amber: "badge--amber",
};

export default function SettingsStatusBadge({
  label,
  tone = "neutral",
}: SettingsStatusBadgeProps) {
  return <span className={`badge ${toneClassMap[tone]}`}>{label}</span>;
}
