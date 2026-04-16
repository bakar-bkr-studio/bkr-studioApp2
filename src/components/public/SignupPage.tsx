"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { AUTHENTICATED_HOME_ROUTE, VERIFY_EMAIL_ROUTE } from "@/lib/auth/route-access";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";

export default function SignupPage() {
  const router = useRouter();
  const {
    isReady,
    isAuthenticated,
    isEmailVerified,
    isServerSessionSynced,
    signup,
    isAuthAvailable,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const passwordsMatch = useMemo(() => {
    if (!password || !confirmPassword) {
      return true;
    }

    return password === confirmPassword;
  }, [password, confirmPassword]);

  useEffect(() => {
    if (isReady && isAuthenticated && isServerSessionSynced) {
      const destination = isEmailVerified ? AUTHENTICATED_HOME_ROUTE : VERIFY_EMAIL_ROUTE;
      router.replace(destination);
    }
  }, [isAuthenticated, isEmailVerified, isReady, isServerSessionSynced, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordsMatch) {
      setSubmitError("Les mots de passe ne correspondent pas.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    if (typeof email !== "string" || !email.trim()) {
      setSubmitError("Adresse email invalide.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await signup(email.trim(), password);
      router.replace(VERIFY_EMAIL_ROUTE);
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, "signup"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <p className="mx-auto w-full max-w-5xl text-sm text-[var(--text-secondary)]">
        Vérification de la session...
      </p>
    );
  }

  if (isAuthenticated && !isServerSessionSynced) {
    return (
      <p className="mx-auto w-full max-w-5xl text-sm text-[var(--text-secondary)]">
        Validation en cours...
      </p>
    );
  }

  if (isAuthenticated) {
    return (
      <p className="mx-auto w-full max-w-5xl text-sm text-[var(--text-secondary)]">
        Redirection vers {isEmailVerified ? "votre dashboard" : "la vérification de votre email"}...
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Inscription rapide
          </p>

          <h1 className="mt-4 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Créer un compte
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Créez votre espace pour gérer vos projets, tâches et finances dans une interface claire
            et structurée.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {!isAuthAvailable && (
              <p className="rounded-lg border border-[var(--amber)]/40 bg-[var(--amber-subtle)] px-3 py-2 text-xs text-[var(--amber)]">
                Firebase Auth n&apos;est pas configuré. Complétez vos variables
                `NEXT_PUBLIC_FIREBASE_*`.
              </p>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[var(--text-primary)]">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Choisissez un mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={!passwordsMatch}
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
              />

              {!passwordsMatch && (
                <p className="text-xs text-[var(--red)]" role="alert">
                  Les mots de passe ne correspondent pas.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Création..." : "Créer un compte"}
            </button>

            {submitError && (
              <p className="text-xs text-[var(--red)]" role="alert">
                {submitError}
              </p>
            )}
          </form>

          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-[var(--text-primary)] underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </section>

        <aside className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(165deg,rgba(17,17,17,1)_0%,rgba(24,24,24,1)_100%)] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Configuration en quelques secondes
          </p>

          <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            Commencez avec une base solide
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            L&apos;inscription reste volontairement rapide. Vous pourrez compléter votre profil plus
            tard dans l&apos;application.
          </p>

          <ul className="mt-6 space-y-2">
            <li className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
              Accès immédiat à votre espace de pilotage
            </li>
            <li className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
              Profil détaillé à compléter ensuite
            </li>
            <li className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
              Structure pensée pour entrepreneurs créatifs
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
