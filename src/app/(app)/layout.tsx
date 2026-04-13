import AppShell from "@/components/AppShell";
import PrivateRouteGuard from "@/components/auth/PrivateRouteGuard";
import { getCurrentServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function PrivateAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <PrivateRouteGuard>
      <AppShell>{children}</AppShell>
    </PrivateRouteGuard>
  );
}
