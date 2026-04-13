interface SettingsToggleProps {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
}

export default function SettingsToggle({ checked, onChange }: SettingsToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`settings-toggle ${checked ? "is-on" : "is-off"}`}
    >
      <span className="settings-toggle__track" aria-hidden="true">
        <span className="settings-toggle__thumb" />
      </span>
      <span className="settings-toggle__state">{checked ? "Activés" : "Désactivés"}</span>
    </button>
  );
}
