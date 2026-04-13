import type { AppSettings } from "@/types";

export type SettingsSectionKey =
  | "appearance"
  | "region"
  | "notifications"
  | "data"
  | "about";

export interface SettingsSectionItem {
  key: keyof AppSettings;
  label: string;
  value: string | boolean;
}

export type SettingsSections = Record<SettingsSectionKey, SettingsSectionItem[]>;

export function getSettingsSections(settings: AppSettings): SettingsSections {
  return {
    appearance: [
      { key: "theme", label: "Thème", value: settings.theme },
    ],
    region: [
      { key: "language", label: "Langue", value: settings.language },
      { key: "currency", label: "Devise", value: settings.currency },
      { key: "dateFormat", label: "Format de date", value: settings.dateFormat },
    ],
    notifications: [
      {
        key: "taskRemindersEnabled",
        label: "Rappels des tâches",
        value: settings.taskRemindersEnabled,
      },
      {
        key: "goalRemindersEnabled",
        label: "Rappels des objectifs",
        value: settings.goalRemindersEnabled,
      },
      {
        key: "financeRemindersEnabled",
        label: "Rappels des finances",
        value: settings.financeRemindersEnabled,
      },
    ],
    data: [
      { key: "dataMode", label: "Mode de données", value: settings.dataMode },
      { key: "updatedAt", label: "Dernière mise à jour", value: settings.updatedAt },
    ],
    about: [
      { key: "appVersion", label: "Version de l'application", value: settings.appVersion },
    ],
  };
}
