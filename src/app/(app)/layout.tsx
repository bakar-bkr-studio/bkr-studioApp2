import AppShell from "@/components/AppShell";
import PrivateRouteGuard from "@/components/auth/PrivateRouteGuard";
import { getCurrentServerSession } from "@/lib/auth/server-session";
import { getOrCreateUserProfileForUser } from "@/lib/server/profile-doc";
import { ONBOARDING_ROUTE, VERIFY_EMAIL_ROUTE } from "@/lib/auth/route-access";
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

  if (!session.email_verified) {
    redirect(VERIFY_EMAIL_ROUTE);
  }

  const profile = await getOrCreateUserProfileForUser(
    session.uid,
    typeof session.email === "string" ? session.email : null
  );

  if (!profile.onboardingCompleted) {
    redirect(ONBOARDING_ROUTE);
  }

  return (
    <PrivateRouteGuard>
      <AppShell>{children}</AppShell>
    </PrivateRouteGuard>
  );
}
