"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { AUTHENTICATED_HOME_ROUTE, FORGOT_PASSWORD_ROUTE, VERIFY_EMAIL_ROUTE } from "@/lib/auth/route-access";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady, isAuthenticated, isEmailVerified, login, isAuthAvailable } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nextPathFromQuery = searchParams.get("next");
  const nextPath =
    typeof nextPathFromQuery === "string" && nextPathFromQuery.startsWith("/")
      ? nextPathFromQuery
      : AUTHENTICATED_HOME_ROUTE;

  useEffect(() => {
    if (isReady && isAuthenticated) {
      const destination = isEmailVerified ? nextPath : VERIFY_EMAIL_ROUTE;
      router.replace(destination);
    }
  }, [isAuthenticated, isEmailVerified, isReady, nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || !email.trim() || typeof password !== "string") {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, "login"));
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
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Connexion
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Accédez à votre espace BKR Studio App
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Retrouvez votre espace de pilotage pour suivre vos projets, vos tâches et votre activité
            au même endroit.
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
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Link
                href={FORGOT_PASSWORD_ROUTE}
                className="text-sm text-[var(--text-secondary)] underline decoration-[var(--border-light)] underline-offset-4 transition hover:text-[var(--text-primary)]"
              >
                Mot de passe oublié ?
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Connexion..." : "Se connecter"}
              </button>
            </div>

            {submitError && (
              <p className="text-xs text-[var(--red)]" role="alert">
                {submitError}
              </p>
            )}

          </form>

          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-[var(--text-primary)] underline underline-offset-4">
              Créer un compte
            </Link>
          </p>
        </section>

        <aside className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(165deg,rgba(17,17,17,1)_0%,rgba(24,24,24,1)_100%)] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            BKR Studio App
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            Votre base de pilotage, sans dispersion
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Une interface claire pour centraliser votre activité et garder une vision opérationnelle
            sur l&apos;ensemble de vos priorités.
          </p>

          <ul className="mt-6 space-y-2">
            <li className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
              Projets, tâches et objectifs alignés
            </li>
            <li className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
              Suivi financier lisible et structuré
            </li>
            <li className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
              Contacts et activité dans un seul espace
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
