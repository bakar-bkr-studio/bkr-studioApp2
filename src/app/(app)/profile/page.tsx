import type { Metadata } from "next";
import ProfilePageClient from "@/components/profile/ProfilePageClient";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilePage() {
  return <ProfilePageClient />;
}
