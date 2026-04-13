import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingPage from "@/components/public/OnboardingPage";
import { getCurrentServerSession } from "@/lib/auth/server-session";
import {
  AUTHENTICATED_HOME_ROUTE,
  VERIFY_EMAIL_ROUTE,
} from "@/lib/auth/route-access";
import { getOrCreateUserProfileForUser } from "@/lib/server/profile-doc";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default async function PublicOnboardingPage() {
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

  if (profile.onboardingCompleted) {
    redirect(AUTHENTICATED_HOME_ROUTE);
  }

  return (
    <OnboardingPage
      initialProfile={{
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        businessName: profile.businessName,
        role: profile.role,
        specialty: profile.specialty,
        country: profile.country,
        city: profile.city,
        phone: profile.phone,
      }}
    />
  );
}
