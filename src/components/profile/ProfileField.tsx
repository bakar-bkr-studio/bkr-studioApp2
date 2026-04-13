import type { ReactNode } from "react";

interface ProfileFieldProps {
  label: string;
  value?: string;
  valueNode?: ReactNode;
  monospace?: boolean;
}

export default function ProfileField({
  label,
  value,
  valueNode,
  monospace = false,
}: ProfileFieldProps) {
  const hasValueNode = Boolean(valueNode);
  const cleanedValue = value?.trim();
  const hasTextValue = Boolean(cleanedValue);

  return (
    <div className="profile-field">
      <p className="profile-field__label">{label}</p>

      <div className="profile-field__value-wrap">
        {hasValueNode ? (
          valueNode
        ) : (
          <span
            className={`profile-field__value ${monospace ? "profile-field__value--mono" : ""} ${hasTextValue ? "" : "profile-field__value--empty"}`}
          >
            {hasTextValue ? cleanedValue : "Non renseigné"}
          </span>
        )}
      </div>
    </div>
  );
}
