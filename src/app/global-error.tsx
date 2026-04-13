"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isProduction = process.env.NODE_ENV === "production";
  const displayMessage = isProduction
    ? "Une erreur critique est survenue. Veuillez recharger l'application."
    : error.message || "Une erreur inattendue s'est produite lors du rendu.";

  return (
    <html lang="fr">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center", fontFamily: "sans-serif", backgroundColor: "#000", color: "#fff" }}>
          <h2>Erreur Critique</h2>
          <p style={{ color: "#ff4d4f", marginBottom: "2rem" }}>
            {displayMessage}
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: "0.75rem 1.5rem", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "0.25rem", cursor: "pointer" }}
          >
            Recharger l'application
          </button>
        </div>
      </body>
    </html>
  );
}
