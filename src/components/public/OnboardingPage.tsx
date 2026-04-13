"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  updateUserProfile,
  type UpdateUserProfileInput,
} from "@/features/profile/api/profile";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { useAuth } from "@/lib/auth/use-auth";
import type { UserProfile } from "@/types";

type OnboardingProfile = Pick<
  UserProfile,
  | "firstName"
  | "lastName"
  | "displayName"
  | "businessName"
  | "role"
  | "specialty"
  | "country"
  | "city"
  | "phone"
>;

interface OnboardingPageProps {
  initialProfile: OnboardingProfile;
}

interface OnboardingFormData {
  firstName: string;
  lastName: string;
  businessName: string;
  role: string;
  specialty: string;
  country: string;
  city: string;
  phone: string;
}

function splitDisplayName(displayName: string) {
  const tokens = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0] ?? "", lastName: "" };
  }

  return {
    firstName: tokens[0] ?? "",
    lastName: tokens.slice(1).join(" "),
  };
}

function normalizeRequired(value: string) {
  return value.trim();
}

function normalizeOptional(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toApiErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Impossible de finaliser le profil pour le moment.";
}

function buildDisplayName(firstName: string, lastName: string, fallback: string) {
  const fromNames = `${firstName} ${lastName}`.trim();
  if (fromNames) {
    return fromNames;
  }

  const normalizedFallback = fallback.trim();
  if (normalizedFallback) {
    return normalizedFallback;
  }

  return "Utilisateur";
}

function createInitialForm(profile: OnboardingProfile): OnboardingFormData {
  const displayNameParts = splitDisplayName(profile.displayName ?? "");

  return {
    firstName: profile.firstName.trim() || displayNameParts.firstName,
    lastName: profile.lastName.trim() || displayNameParts.lastName,
    businessName: profile.businessName?.trim() ?? "",
    role: profile.role?.trim() ?? "",
    specialty: profile.specialty?.trim() ?? "",
    country: profile.country?.trim() ?? "",
    city: profile.city?.trim() ?? "",
    phone: profile.phone?.trim() ?? "",
  };
}

export default function OnboardingPage({ initialProfile }: OnboardingPageProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const [form, setForm] = useState<OnboardingFormData>(() => createInitialForm(initialProfile));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    const requiredFields = [
      form.firstName,
      form.lastName,
      form.businessName,
      form.country,
    ];

    return requiredFields.some((value) => value.trim().length === 0) || isSubmitting;
  }, [form.businessName, form.country, form.firstName, form.lastName, isSubmitting]);

  function handleInputChange<K extends keyof OnboardingFormData>(
    field: K,
    value: OnboardingFormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    const firstName = normalizeRequired(form.firstName);
    const lastName = normalizeRequired(form.lastName);
    const businessName = normalizeRequired(form.businessName);
    const country = normalizeRequired(form.country);

    const payload: UpdateUserProfileInput = {
      firstName,
      lastName,
      displayName: buildDisplayName(firstName, lastName, initialProfile.displayName),
      businessName,
      role: normalizeOptional(form.role),
      specialty: normalizeOptional(form.specialty),
      country,
      city: normalizeOptional(form.city),
      phone: normalizeOptional(form.phone),
      onboardingCompleted: true,
    };

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await updateUserProfile(payload);
      router.replace("/dashboard");
    } catch (error) {
      setSubmitError(toApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setLogoutError(null);
    setIsSigningOut(true);

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setLogoutError(getAuthErrorMessage(error, "logout"));
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)] sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Onboarding
        </p>

        <h1 className="mt-3 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          Complétez votre profil
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          Quelques informations suffisent pour personnaliser votre espace avant d&apos;accéder à
          l&apos;application.
        </p>

        <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="onboarding-firstName" className="text-sm font-medium text-[var(--text-primary)]">
              Prénom *
            </label>
            <input
              id="onboarding-firstName"
              name="firstName"
              type="text"
              required
              autoComplete="given-name"
              value={form.firstName}
              onChange={(event) => handleInputChange("firstName", event.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="onboarding-lastName" className="text-sm font-medium text-[var(--text-primary)]">
              Nom *
            </label>
            <input
              id="onboarding-lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              value={form.lastName}
              onChange={(event) => handleInputChange("lastName", event.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="onboarding-businessName" className="text-sm font-medium text-[var(--text-primary)]">
              Nom d&apos;activité *
            </label>
            <input
              id="onboarding-businessName"
              name="businessName"
              type="text"
              required
              autoComplete="organization"
              value={form.businessName}
              onChange={(event) => handleInputChange("businessName", event.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="onboarding-role" className="text-sm font-medium text-[var(--text-primary)]">
              Rôle
            </label>
            <input
              id="onboarding-role"
              name="role"
              type="text"
              autoComplete="organization-title"
              value={form.role}
              onChange={(event) => handleInputChange("role", event.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="onboarding-specialty" className="text-sm font-medium text-[var(--text-primary)]">
              Spécialité
            </label>
            <input
              id="onboarding-specialty"
              name="specialty"
              type="text"
              value={form.specialty}
              onChange={(event) => handleInputChange("specialty", event.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="onboarding-country" className="text-sm font-medium text-[var(--text-primary)]">
              Pays *
            </label>
            <input
              id="onboarding-country"
              name="country"
              type="text"
              required
              autoComplete="country-name"
              value={form.country}
              onChange={(event) => handleInputChange("country", event.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="onboarding-city" className="text-sm font-medium text-[var(--text-primary)]">
              Ville
            </label>
            <input
              id="onboarding-city"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={form.city}
              onChange={(event) => handleInputChange("city", event.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="onboarding-phone" className="text-sm font-medium text-[var(--text-primary)]">
              Téléphone
            </label>
            <input
              id="onboarding-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => handleInputChange("phone", event.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-3 sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enregistrement..." : "Continuer"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="w-full rounded-lg border border-[var(--border-light)] bg-transparent px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--red)]/40 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>

          {submitError && (
            <p className="sm:col-span-2 text-xs text-[var(--red)]" role="alert">
              {submitError}
            </p>
          )}

          {logoutError && (
            <p className="sm:col-span-2 text-xs text-[var(--red)]" role="alert">
              {logoutError}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
