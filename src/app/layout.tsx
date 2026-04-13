import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/use-auth";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s — BKR Studio",
    default: "BKR Studio App",
  },
  description: "Gérez votre activité photo/vidéo : projets, tâches, finances, objectifs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
