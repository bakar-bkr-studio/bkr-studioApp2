import type { Metadata } from "next";
import SettingsPageClient from "@/components/settings/SettingsPageClient";
import { mockSettings } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return <SettingsPageClient initialSettings={mockSettings} />;
}
