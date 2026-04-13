"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isProduction = process.env.NODE_ENV === "production";
  const displayMessage = isProduction
    ? "Une erreur inattendue est survenue. Réessayez."
    : error.message || "Erreur inconnue.";

  useEffect(() => {
    if (!isProduction) {
      console.error(error);
    }
  }, [error, isProduction]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", padding: "2rem", textAlign: "center" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "var(--text-primary)" }}>
        Une erreur s'est produite !
      </h2>
      <p style={{ color: "var(--red)", marginBottom: "2rem", maxWidth: "600px", wordBreak: "break-word" }}>
        {displayMessage}
      </p>
      <button
        onClick={() => reset()}
        className="btn btn--primary"
      >
        Réessayer
      </button>
    </div>
  );
}
