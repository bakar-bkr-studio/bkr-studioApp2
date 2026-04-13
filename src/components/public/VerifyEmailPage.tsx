"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { AUTHENTICATED_HOME_ROUTE } from "@/lib/auth/route-access";
import { useAuth } from "@/lib/auth/use-auth";

interface SessionStatusPayload {
  authenticated: boolean;
  emailVerified: boolean;
}

const SERVER_SESSION_POLL_ATTEMPTS = 3;
const SERVER_SESSION_POLL_DELAY_MS = 450;

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const {
    isReady,
    isAuthenticated,
    isEmailVerified,
    user,
    refreshUser,
    sendVerificationEmail,
    logout,
  } = useAuth();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [isFinalizingVerification, setIsFinalizingVerification] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const hasRequestedLoginRedirectRef = useRef(false);
  const hasRequestedDashboardRedirectRef = useRef(false);
  const hasAutoSyncAttemptedRef = useRef(false);
  const isFinalizingVerificationRef = useRef(false);

  const logDebug = useCallback((message: string, extra?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      if (typeof extra === "undefined") {
        console.debug(`[VerifyEmail] ${message}`);
      } else {
        console.debug(`[VerifyEmail] ${message}`, extra);
      }
    }
  }, []);

  const redirectToLoginOnce = useCallback(() => {
    if (hasRequestedLoginRedirectRef.current) {
      return;
    }

    hasRequestedLoginRedirectRef.current = true;
    logDebug("Redirection vers /login.");
    router.replace("/login");
  }, [logDebug, router]);

  const redirectToDashboardOnce = useCallback(
    (reason: string) => {
      if (hasRequestedDashboardRedirectRef.current) {
        return;
      }

      hasRequestedDashboardRedirectRef.current = true;
      logDebug(`Redirection vers ${AUTHENTICATED_HOME_ROUTE}.`, { reason });
      router.replace(AUTHENTICATED_HOME_ROUTE);
    },
    [logDebug, router]
  );

  const getServerSessionStatus = useCallback(async (): Promise<SessionStatusPayload> => {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (!response.ok) {
      const code = `http_${response.status}`;
      throw new Error(`auth/session-status-failed:${code}`);
    }

    const payload = (await response.json()) as Partial<SessionStatusPayload>;
    return {
      authenticated: payload.authenticated === true,
      emailVerified: payload.emailVerified === true,
    };
  }, []);

  const syncVerifiedSessionAndRedirect = useCallback(
    async (source: "auto" | "manual") => {
      if (isFinalizingVerificationRef.current) {
        return;
      }

      isFinalizingVerificationRef.current = true;
      setActionError(null);
      setStatusMessage("Validation en cours...");
      setIsFinalizingVerification(true);
      logDebug("Début de synchronisation post-vérification.", { source });

      try {
        const refreshedUser = await refreshUser();

        if (!refreshedUser?.emailVerified) {
          setStatusMessage(
            "Votre email n'est pas encore vérifié. Vérifiez votre boîte mail puis réessayez."
          );
          logDebug("Email toujours non vérifié après refresh.", { source });
          return;
        }

        let serverSessionIsVerified = false;

        for (let attempt = 1; attempt <= SERVER_SESSION_POLL_ATTEMPTS; attempt += 1) {
          const sessionStatus = await getServerSessionStatus();
          logDebug("Statut session serveur récupéré.", { attempt, sessionStatus });

          if (sessionStatus.authenticated && sessionStatus.emailVerified) {
            serverSessionIsVerified = true;
            break;
          }

          if (attempt < SERVER_SESSION_POLL_ATTEMPTS) {
            await wait(SERVER_SESSION_POLL_DELAY_MS);
            await refreshUser();
          }
        }

        if (!serverSessionIsVerified) {
          setStatusMessage(null);
          setActionError(
            "Votre email est vérifié, mais la session serveur n'est pas encore à jour. Réessayez dans quelques secondes."
          );
          logDebug("Session serveur non synchronisée après plusieurs tentatives.");
          return;
        }

        setStatusMessage("Validation en cours...");
        redirectToDashboardOnce("session-verified");
      } catch (error) {
        logDebug("Erreur pendant la synchronisation post-vérification.", error);
        setStatusMessage(null);
        setActionError(getAuthErrorMessage(error, "email-verification"));
      } finally {
        setIsFinalizingVerification(false);
        isFinalizingVerificationRef.current = false;
      }
    },
    [
      getServerSessionStatus,
      logDebug,
      redirectToDashboardOnce,
      refreshUser,
    ]
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      redirectToLoginOnce();
      return;
    }

    hasRequestedLoginRedirectRef.current = false;

    if (!isEmailVerified) {
      hasAutoSyncAttemptedRef.current = false;
      hasRequestedDashboardRedirectRef.current = false;
      return;
    }

    if (hasAutoSyncAttemptedRef.current) {
      return;
    }

    hasAutoSyncAttemptedRef.current = true;
    void syncVerifiedSessionAndRedirect("auto");
  }, [
    isAuthenticated,
    isEmailVerified,
    isReady,
    redirectToLoginOnce,
    syncVerifiedSessionAndRedirect,
  ]);

  async function handleCheckVerification() {
    setActionError(null);
    setStatusMessage(null);
    setIsCheckingVerification(true);

    try {
      await syncVerifiedSessionAndRedirect("manual");
    } finally {
      setIsCheckingVerification(false);
    }
  }

  async function handleResendEmail() {
    setActionError(null);
    setStatusMessage(null);
    setIsResendingEmail(true);

    try {
      await sendVerificationEmail();
      setStatusMessage("Un nouvel email de vérification a été envoyé.");
    } catch (error) {
      setActionError(getAuthErrorMessage(error, "email-verification"));
    } finally {
      setIsResendingEmail(false);
    }
  }

  async function handleLogout() {
    setActionError(null);
    setStatusMessage(null);
    setIsSigningOut(true);

    try {
      await logout();
      redirectToLoginOnce();
    } catch (error) {
      setActionError(getAuthErrorMessage(error, "logout"));
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!isReady) {
    return (
      <p className="mx-auto w-full max-w-5xl text-sm text-[var(--text-secondary)]">
        Vérification de la session...
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p className="mx-auto w-full max-w-5xl text-sm text-[var(--text-secondary)]">
        Redirection vers la connexion...
      </p>
    );
  }

  const isPrimaryActionLoading = isCheckingVerification || isFinalizingVerification;
  const isEmailFlowCompleted = isEmailVerified;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Vérification d&apos;email
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            {isEmailFlowCompleted ? "Email confirmé" : "Confirmez votre adresse email"}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            {isEmailFlowCompleted
              ? "Votre adresse email est validée. Nous finalisons maintenant la synchronisation de session."
              : "Un email de confirmation vient d&apos;être envoyé. Ouvrez ce message puis cliquez sur le lien de validation."}
          </p>

          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            Adresse en cours :{" "}
            <span className="font-medium text-[var(--text-primary)]">{user?.email ?? "indisponible"}</span>
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleCheckVerification}
              disabled={isPrimaryActionLoading}
              className="w-full rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPrimaryActionLoading
                ? "Validation en cours..."
                : isEmailFlowCompleted
                  ? "Continuer vers le dashboard"
                  : "J'ai confirmé mon email"}
            </button>

            {!isEmailFlowCompleted && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isResendingEmail}
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isResendingEmail ? "Envoi..." : "Renvoyer l'email"}
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="w-full rounded-lg border border-[var(--border-light)] bg-transparent px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--red)]/40 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>

          {statusMessage && (
            <p
              className="mt-4 rounded-lg border border-[var(--green)]/40 bg-[var(--green-subtle)] px-3 py-2 text-xs text-[var(--green)]"
              role="status"
            >
              {statusMessage}
            </p>
          )}

          {actionError && (
            <p className="mt-4 text-xs text-[var(--red)]" role="alert">
              {actionError}
            </p>
          )}

          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Besoin d&apos;aide ?{" "}
            <Link href="/login" className="text-[var(--text-primary)] underline underline-offset-4">
              Retour à la connexion
            </Link>
          </p>
        </section>

        <aside className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(165deg,rgba(17,17,17,1)_0%,rgba(24,24,24,1)_100%)] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Étape requise
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            {isEmailFlowCompleted
              ? "Synchronisation de session en cours"
              : "Validation email avant accès complet"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {isEmailFlowCompleted
              ? "Nous alignons la session serveur avec votre statut vérifié avant de vous rediriger vers le dashboard."
              : "Tant que l&apos;adresse email n&apos;est pas validée, l&apos;accès aux pages privées est bloqué pour protéger votre compte."}
          </p>
        </aside>
      </div>
    </div>
  );
}
