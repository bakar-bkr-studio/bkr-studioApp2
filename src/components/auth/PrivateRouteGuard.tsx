"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { AUTH_ROUTES } from "@/lib/auth/route-access";

interface PrivateRouteGuardProps {
  children: React.ReactNode;
}

export default function PrivateRouteGuard({ children }: PrivateRouteGuardProps) {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuth();
  const hasRequestedRedirectRef = useRef(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (isAuthenticated) {
      hasRequestedRedirectRef.current = false;
      return;
    }

    if (!hasRequestedRedirectRef.current) {
      hasRequestedRedirectRef.current = true;
      router.replace(AUTH_ROUTES[0]);
    }
  }, [isAuthenticated, isReady, router]);

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

  return <>{children}</>;
}
