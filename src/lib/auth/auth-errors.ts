type AuthAction = "login" | "signup" | "logout";

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

export function getAuthErrorMessage(error: unknown, action: AuthAction): string {
  const code = getErrorCode(error);

  switch (code) {
    case "auth/not-configured":
      return "Configuration Firebase incomplète. Vérifiez les variables d'environnement.";
    case "auth/admin-not-configured":
      return "Configuration sécurité serveur incomplète. Vérifiez les variables FIREBASE_* côté serveur.";
    case "auth/session-sync-failed":
      return "Impossible de synchroniser la session sécurisée. Veuillez réessayer.";
    case "auth/invalid-id-token":
      return "Session invalide. Veuillez vous reconnecter.";
    case "auth/invalid-email":
      return "Adresse email invalide.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Identifiants invalides.";
    case "auth/email-already-in-use":
      return "Cet email est déjà utilisé.";
    case "auth/weak-password":
      return "Mot de passe trop faible (6 caractères minimum).";
    case "auth/too-many-requests":
      return "Trop de tentatives. Réessayez dans quelques instants.";
    default:
      break;
  }

  if (action === "logout") {
    return "Impossible de vous déconnecter pour le moment.";
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}
