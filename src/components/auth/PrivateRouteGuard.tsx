"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { AUTH_ROUTES, VERIFY_EMAIL_ROUTE } from "@/lib/auth/route-access";

interface PrivateRouteGuardProps {
  children: React.ReactNode;
}

export default function PrivateRouteGuard({ children }: PrivateRouteGuardProps) {
  const router = useRouter();
  const { isReady, isAuthenticated, isEmailVerified } = useAuth();
  const lastRedirectTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let redirectTarget: string | null = null;

    if (!isAuthenticated) {
      redirectTarget = AUTH_ROUTES[0];
    } else if (!isEmailVerified) {
      redirectTarget = VERIFY_EMAIL_ROUTE;
    }

    if (!redirectTarget) {
      lastRedirectTargetRef.current = null;
      return;
    }

    if (lastRedirectTargetRef.current === redirectTarget) {
      return;
    }

    lastRedirectTargetRef.current = redirectTarget;
    router.replace(redirectTarget);
  }, [isAuthenticated, isEmailVerified, isReady, router]);

  if (!isReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: "14px",
          padding: "24px",
        }}
      >
        Vérification de la session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: "14px",
          padding: "24px",
        }}
      >
        Redirection vers la connexion...
      </div>
    );
  }

  if (!isEmailVerified) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: "14px",
          padding: "24px",
        }}
      >
        Redirection vers la vérification email...
      </div>
    );
  }

  return <>{children}</>;
}
