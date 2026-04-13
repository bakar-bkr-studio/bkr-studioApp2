"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import SettingsItem from "@/components/settings/SettingsItem";
import SettingsSectionCard from "@/components/settings/SettingsSectionCard";
import SettingsStatusBadge from "@/components/settings/SettingsStatusBadge";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { loadSettings, saveSettings } from "@/lib/local-storage";
import { getSettingsSections } from "@/lib/settings-utils";
import type {
  AppLanguage,
  AppSettings,
  AppTheme,
  CurrencyCode,
  DateFormat,
} from "@/types";

type EditableSettingKey =
  | "theme"
  | "language"
  | "currency"
  | "dateFormat"
  | "taskRemindersEnabled"
  | "goalRemindersEnabled"
  | "financeRemindersEnabled";

interface SettingsPageClientProps {
  initialSettings: AppSettings;
}

const themeOptions: Array<{ value: AppTheme; label: string }> = [
  { value: "dark", label: "Sombre" },
  { value: "light", label: "Clair" },
  { value: "system", label: "Système" },
];

const languageOptions: Array<{ value: AppLanguage; label: string }> = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const currencyOptions: Array<{ value: CurrencyCode; label: string }> = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "NGN", label: "NGN (₦)" },
];

const dateFormatOptions: Array<{ value: DateFormat; label: string }> = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

function formatUpdatedAt(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsPageClient({ initialSettings }: SettingsPageClientProps) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings(initialSettings));
    setIsStorageReady(true);
  }, [initialSettings]);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    saveSettings(settings);
  }, [settings, isStorageReady]);

  const sections = getSettingsSections(settings);

  function updateSetting<K extends EditableSettingKey>(key: K, value: AppSettings[K]) {
    setSettings((currentSettings) => {
      if (currentSettings[key] === value) {
        return currentSettings;
      }

      return {
        ...currentSettings,
        [key]: value,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Configuration de l'application et préférences utilisateur. Les informations d'identité restent séparées dans le profil."
      />

      <div className="settings-grid">
        <SettingsSectionCard
          title="Apparence"
          description="Préférences visuelles de l'application."
        >
          <SettingsItem
            label={sections.appearance[0].label}
            helperText="Mode d'affichage utilisé dans l'interface."
          >
            <select
              className="settings-select"
              value={settings.theme}
              onChange={(event) => updateSetting("theme", event.target.value as AppTheme)}
              aria-label="Thème"
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingsItem>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Région"
          description="Langue, devise et format de date."
        >
          <SettingsItem
            label={sections.region[0].label}
            helperText="Langue principale de l'application."
          >
            <select
              className="settings-select"
              value={settings.language}
              onChange={(event) => updateSetting("language", event.target.value as AppLanguage)}
              aria-label="Langue"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingsItem>

          <SettingsItem
            label={sections.region[1].label}
            helperText="Devise de référence pour les montants."
          >
            <select
              className="settings-select"
              value={settings.currency}
              onChange={(event) => updateSetting("currency", event.target.value as CurrencyCode)}
              aria-label="Devise"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingsItem>

          <SettingsItem
            label={sections.region[2].label}
            helperText="Format utilisé dans les dates affichées."
          >
            <select
              className="settings-select"
              value={settings.dateFormat}
              onChange={(event) => updateSetting("dateFormat", event.target.value as DateFormat)}
              aria-label="Format de date"
            >
              {dateFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingsItem>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Notifications"
          description="Rappels des modules clés de votre activité."
        >
          <SettingsItem
            label={sections.notifications[0].label}
            helperText="Recevoir des rappels pour vos tâches à traiter."
          >
            <SettingsToggle
              checked={settings.taskRemindersEnabled}
              onChange={(nextValue) => updateSetting("taskRemindersEnabled", nextValue)}
            />
          </SettingsItem>

          <SettingsItem
            label={sections.notifications[1].label}
            helperText="Activer les rappels liés au suivi des objectifs."
          >
            <SettingsToggle
              checked={settings.goalRemindersEnabled}
              onChange={(nextValue) => updateSetting("goalRemindersEnabled", nextValue)}
            />
          </SettingsItem>

          <SettingsItem
            label={sections.notifications[2].label}
            helperText="Activer les rappels pour les flux financiers."
          >
            <SettingsToggle
              checked={settings.financeRemindersEnabled}
              onChange={(nextValue) => updateSetting("financeRemindersEnabled", nextValue)}
            />
          </SettingsItem>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Données"
          description="État actuel du mode de stockage et synchronisation."
        >
          <SettingsItem
            label={sections.data[0].label}
            value={settings.dataMode === "mock" ? "Mock" : "Firebase"}
            suffix={
              <SettingsStatusBadge
                label={settings.dataMode === "mock" ? "Actif" : "Connecté"}
                tone={settings.dataMode === "mock" ? "amber" : "green"}
              />
            }
          />

          <SettingsItem
            label="Statut"
            value={settings.dataMode === "mock" ? "Jeu de données mock actif" : "Synchronisation cloud prête"}
            helperText="Les préférences restent en mémoire de session en mode mock."
            suffix={
              <SettingsStatusBadge
                label={settings.dataMode === "mock" ? "Mock" : "Cloud"}
                tone={settings.dataMode === "mock" ? "neutral" : "green"}
              />
            }
          />

          <SettingsItem
            label={sections.data[1].label}
            value={formatUpdatedAt(settings.updatedAt)}
            helperText="Mis à jour automatiquement à chaque modification de la session."
          />
        </SettingsSectionCard>

        <SettingsSectionCard
          title="À propos"
          description="Informations de version et environnement de l'app."
        >
          <SettingsItem
            label={sections.about[0].label}
            value={`v${settings.appVersion}`}
            suffix={<SettingsStatusBadge label="Stable" tone="accent" />}
          />

          <p className="settings-footnote">
            Environnement actuel: preview mock. Firebase sera branché dans une prochaine étape.
          </p>
        </SettingsSectionCard>
      </div>
    </>
  );
}
