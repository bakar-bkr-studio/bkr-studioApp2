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
  console.log("[Layout] Private layout SSR starting");
  const session = await getCurrentServerSession();

  if (!session) {
    console.log("[Layout] Invalid session, redirecting to login");
    redirect("/login");
  }

  if (!session.email_verified) {
    console.log("[Layout] Email unverified, redirecting");
    redirect(VERIFY_EMAIL_ROUTE);
  }

  console.log(`[Layout] Server session valid: uid=${session.uid}`);

  let profile;
  try {
    profile = await getOrCreateUserProfileForUser(
      session.uid,
      typeof session.email === "string" ? session.email : null
    );
    console.log(`[Layout] Profile checked for uid=${session.uid}. OnboardingCompleted=${profile.onboardingCompleted}`);
  } catch (error) {
    console.error(`[Layout] ERROR FETCHING PROFILE FOR UID=${session.uid}:`, error);
    throw error;
  }

  if (!profile.onboardingCompleted) {
    redirect(ONBOARDING_ROUTE);
  }

  return (
    <PrivateRouteGuard>
      <AppShell>{children}</AppShell>
    </PrivateRouteGuard>
  );
}
