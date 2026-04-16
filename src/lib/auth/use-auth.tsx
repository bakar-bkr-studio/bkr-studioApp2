"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  getEmailVerificationActionCodeSettings,
  getPasswordResetActionCodeSettings,
} from "@/lib/auth/action-code-settings";
import { getFirebaseAuth } from "@/lib/firebase";

export interface AuthUser {
  id: string;
  email?: string;
  emailVerified: boolean;
}

interface AuthContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isServerSessionSynced: boolean;
  serverSessionSyncErrorCode: string | null;
  isAuthAvailable: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.uid,
    email: user.email ?? undefined,
    emailVerified: user.emailVerified,
  };
}

function createAuthNotConfiguredError() {
  const error = new Error(
    "Firebase Authentication n'est pas configuré. Vérifiez les variables NEXT_PUBLIC_FIREBASE_*."
  ) as Error & { code?: string };
  error.code = "auth/not-configured";
  return error;
}

function createNoCurrentUserError() {
  const error = new Error("Aucune session utilisateur active.") as Error & { code?: string };
  error.code = "auth/no-current-user";
  return error;
}

function createServerSessionSyncError(code = "auth/session-sync-failed") {
  const error = new Error(
    `Impossible de synchroniser la session serveur (${code}). Réessayez dans quelques instants.`
  ) as Error & { code?: string };
  error.code = code;
  return error;
}

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

async function syncServerSessionFromIdToken(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    let responseCode = "auth/session-sync-failed";

    try {
      const payload = (await response.json()) as { code?: unknown };
      if (typeof payload.code === "string") {
        responseCode = payload.code;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw createServerSessionSyncError(responseCode);
  }
}

async function clearServerSession(idToken?: string) {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    let responseCode = "auth/session-sync-failed";

    try {
      const payload = (await response.json()) as { code?: unknown };
      if (typeof payload.code === "string") {
        responseCode = payload.code;
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw createServerSessionSyncError(responseCode);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isServerSessionSynced, setIsServerSessionSynced] = useState(true);
  const [serverSessionSyncErrorCode, setServerSessionSyncErrorCode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasResolvedInitialAuthRef = useRef(false);
  const lastSyncedTokenRef = useRef<string | null>(null);

  function logAuthError(context: string, error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[Auth] ${context}`, error);
    }
  }

  useEffect(() => {
    function markAuthReady() {
      if (hasResolvedInitialAuthRef.current) {
        return;
      }

      hasResolvedInitialAuthRef.current = true;
      setIsReady(true);
    }

    if (!auth) {
      markAuthReady();
      return;
    }

    let isMounted = true;
    const fallbackTimeout = window.setTimeout(() => {
      if (!isMounted || hasResolvedInitialAuthRef.current) {
        return;
      }

      logAuthError("Timeout de résolution de session, fallback ready déclenché.", null);
      markAuthReady();
    }, 6000);

    let unsubscribe = () => {};

    try {
      unsubscribe = onIdTokenChanged(
        auth,
        (nextUser) => {
          if (!isMounted) {
            return;
          }

          try {
            setAuthUser(mapAuthUser(nextUser));

            if (nextUser) {
              setIsServerSessionSynced(false);
              setServerSessionSyncErrorCode(null);
              void (async () => {
                try {
                  const idToken = await nextUser.getIdToken();
                  if (!isMounted) {
                    return;
                  }

                  if (lastSyncedTokenRef.current === idToken) {
                    setIsServerSessionSynced(true);
                    setServerSessionSyncErrorCode(null);
                    return;
                  }

                  await syncServerSessionFromIdToken(idToken);
                  if (!isMounted) {
                    return;
                  }
                  lastSyncedTokenRef.current = idToken;
                  setIsServerSessionSynced(true);
                  setServerSessionSyncErrorCode(null);
                } catch (error) {
                  if (!isMounted) {
                    return;
                  }
                  setIsServerSessionSynced(false);
                  setServerSessionSyncErrorCode(
                    getErrorCode(error) ?? "auth/session-sync-failed"
                  );
                  logAuthError("Impossible de synchroniser la session serveur.", error);
                }
              })();
            } else {
              setIsServerSessionSynced(true);
              setServerSessionSyncErrorCode(null);
              lastSyncedTokenRef.current = null;
              void clearServerSession().catch((error) => {
                logAuthError("Impossible de supprimer la session serveur.", error);
              });
            }
          } catch (error) {
            logAuthError("Erreur pendant la mise à jour de l'état utilisateur.", error);
            setAuthUser(null);
            setIsServerSessionSynced(false);
            setServerSessionSyncErrorCode(
              getErrorCode(error) ?? "auth/session-sync-failed"
            );
          } finally {
            clearTimeout(fallbackTimeout);
            markAuthReady();
          }
        },
        (error) => {
          if (!isMounted) {
            return;
          }

          logAuthError("Erreur dans onIdTokenChanged.", error);
          setAuthUser(null);
          setIsServerSessionSynced(false);
          setServerSessionSyncErrorCode(getErrorCode(error) ?? "auth/session-sync-failed");
          clearTimeout(fallbackTimeout);
          markAuthReady();
        }
      );
    } catch (error) {
      logAuthError("Échec d'initialisation du listener onIdTokenChanged.", error);
      setAuthUser(null);
      setIsServerSessionSynced(false);
      setServerSessionSyncErrorCode(getErrorCode(error) ?? "auth/session-sync-failed");
      clearTimeout(fallbackTimeout);
      markAuthReady();
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, [auth]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!auth) {
        throw createAuthNotConfiguredError();
      }

      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credentials.user.getIdToken();
      await syncServerSessionFromIdToken(idToken);
      lastSyncedTokenRef.current = idToken;
      setIsServerSessionSynced(true);
      setServerSessionSyncErrorCode(null);
    },
    [auth]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      if (!auth) {
        throw createAuthNotConfiguredError();
      }

      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await credentials.user.getIdToken();
      await syncServerSessionFromIdToken(idToken);
      lastSyncedTokenRef.current = idToken;
      setIsServerSessionSynced(true);
      setServerSessionSyncErrorCode(null);

      try {
        const actionCodeSettings = getEmailVerificationActionCodeSettings();
        await sendEmailVerification(credentials.user, actionCodeSettings);
      } catch (error) {
        logAuthError("Impossible d'envoyer automatiquement l'email de vérification.", error);
      }
    },
    [auth]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (!auth) {
        throw createAuthNotConfiguredError();
      }

      const actionCodeSettings = getPasswordResetActionCodeSettings();
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    },
    [auth]
  );

  const sendVerificationEmail = useCallback(async () => {
    if (!auth) {
      throw createAuthNotConfiguredError();
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw createNoCurrentUserError();
    }

    const actionCodeSettings = getEmailVerificationActionCodeSettings();
    await sendEmailVerification(currentUser, actionCodeSettings);
  }, [auth]);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    if (!auth) {
      throw createAuthNotConfiguredError();
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setAuthUser(null);
      lastSyncedTokenRef.current = null;
      setIsServerSessionSynced(true);
      setServerSessionSyncErrorCode(null);
      return null;
    }

    await currentUser.reload();

    const refreshedUser = auth.currentUser;

    if (!refreshedUser) {
      setAuthUser(null);
      lastSyncedTokenRef.current = null;
      await clearServerSession();
      setIsServerSessionSynced(true);
      setServerSessionSyncErrorCode(null);
      return null;
    }

    const idToken = await refreshedUser.getIdToken(true);
    await syncServerSessionFromIdToken(idToken);
    lastSyncedTokenRef.current = idToken;
    setIsServerSessionSynced(true);
    setServerSessionSyncErrorCode(null);

    const mappedUser = mapAuthUser(refreshedUser);
    setAuthUser(mappedUser);
    return mappedUser;
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) {
      throw createAuthNotConfiguredError();
    }

    const currentUser = auth.currentUser;
    let idToken: string | undefined;

    if (currentUser) {
      try {
        idToken = await currentUser.getIdToken();
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[Auth] Impossible de récupérer le token avant logout.", error);
        }
      }
    }

    await clearServerSession(idToken);
    await signOut(auth);
    setAuthUser(null);
    lastSyncedTokenRef.current = null;
    setIsServerSessionSynced(true);
    setServerSessionSyncErrorCode(null);
  }, [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated: Boolean(authUser),
      isEmailVerified: Boolean(authUser?.emailVerified),
      isServerSessionSynced,
      serverSessionSyncErrorCode,
      isAuthAvailable: Boolean(auth),
      user: authUser,
      login,
      signup,
      logout,
      sendPasswordReset,
      sendVerificationEmail,
      refreshUser,
    }),
    [
      auth,
      authUser,
      isReady,
      isServerSessionSynced,
      login,
      logout,
      refreshUser,
      serverSessionSyncErrorCode,
      sendPasswordReset,
      sendVerificationEmail,
      signup,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.");
  }

  return context;
}
