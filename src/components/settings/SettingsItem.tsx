import type { ReactNode } from "react";

interface SettingsItemProps {
  label: string;
  value?: string;
  helperText?: string;
  suffix?: ReactNode;
  children?: ReactNode;
}

export default function SettingsItem({
  label,
  value,
  helperText,
  suffix,
  children,
}: SettingsItemProps) {
  const hasControl = Boolean(children);

  return (
    <div className="settings-item">
      <div className="settings-item__meta">
        <p className="settings-item__label">{label}</p>
        {helperText && <p className="settings-item__helper">{helperText}</p>}
      </div>

      <div className={`settings-item__value-wrap ${hasControl ? "settings-item__value-wrap--control" : ""}`}>
        {hasControl ? (
          children
        ) : (
          <>
            {value && <span className="settings-item__value">{value}</span>}
            {suffix}
          </>
        )}
      </div>
    </div>
  );
}
