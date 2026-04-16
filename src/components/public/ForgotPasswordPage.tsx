"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { AUTHENTICATED_HOME_ROUTE, VERIFY_EMAIL_ROUTE } from "@/lib/auth/route-access";
import { useAuth } from "@/lib/auth/use-auth";

const NEUTRAL_SUCCESS_MESSAGE =
  "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.";

function getErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const {
    isReady,
    isAuthenticated,
    isEmailVerified,
    isServerSessionSynced,
    sendPasswordReset,
    isAuthAvailable,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !isServerSessionSynced) {
      return;
    }

    const destination = isEmailVerified ? AUTHENTICATED_HOME_ROUTE : VERIFY_EMAIL_ROUTE;
    router.replace(destination);
  }, [isAuthenticated, isEmailVerified, isReady, isServerSessionSynced, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setSubmitError("Adresse email invalide.");
      return;
    }

    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await sendPasswordReset(trimmedEmail);
      setSuccessMessage(NEUTRAL_SUCCESS_MESSAGE);
    } catch (error) {
      const code = getErrorCode(error);

      if (code === "auth/user-not-found") {
        setSubmitError(null);
        setSuccessMessage(NEUTRAL_SUCCESS_MESSAGE);
      } else {
        setSuccessMessage(null);
        setSubmitError(getAuthErrorMessage(error, "password-reset"));
      }
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
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Mot de passe oublié
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Réinitialiser votre mot de passe
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Entrez l&apos;adresse email utilisée pour votre compte. Vous recevrez un lien pour définir
            un nouveau mot de passe.
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </button>

            {successMessage && (
              <div
                className="rounded-lg border border-[var(--green)]/40 bg-[var(--green-subtle)] px-3 py-2"
                role="status"
              >
                <p className="text-xs text-[var(--green)]">{successMessage}</p>
                <p className="mt-2 text-xs font-semibold text-[var(--amber)] underline decoration-[var(--amber)]/60 underline-offset-2">
                  ⚠️ Pensez à vérifier vos spams (courriers indésirables), l&apos;email peut s&apos;y trouver.
                </p>
              </div>
            )}

            {submitError && (
              <p className="text-xs text-[var(--red)]" role="alert">
                {submitError}
              </p>
            )}
          </form>

          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            <Link href="/login" className="text-[var(--text-primary)] underline underline-offset-4">
              Retour à la connexion
            </Link>
          </p>
        </section>

        <aside className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(165deg,rgba(17,17,17,1)_0%,rgba(24,24,24,1)_100%)] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Sécurité de compte
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            Accès protégé avec Firebase Authentication
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Le message de confirmation reste volontairement neutre afin de ne pas exposer
            l&apos;existence d&apos;un compte.
          </p>
        </aside>
      </div>
    </div>
  );
}
