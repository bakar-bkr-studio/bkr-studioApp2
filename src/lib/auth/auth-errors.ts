type AuthAction = "login" | "signup" | "logout" | "password-reset" | "email-verification";

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
    case "auth/no-current-user":
      return "Votre session a expiré. Reconnectez-vous pour continuer.";
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
    case "auth/network-request-failed":
      return "Réseau indisponible. Vérifiez votre connexion puis réessayez.";
    case "auth/missing-continue-uri":
    case "auth/invalid-continue-uri":
    case "auth/unauthorized-continue-uri":
      return "Configuration du lien de redirection invalide.";
    default:
      break;
  }

  if (action === "logout") {
    return "Impossible de vous déconnecter pour le moment.";
  }

  if (action === "password-reset") {
    return "Impossible d'envoyer le lien de réinitialisation pour le moment.";
  }

  if (action === "email-verification") {
    return "Impossible de gérer la vérification email pour le moment.";
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}
