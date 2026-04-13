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
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  isAuthAvailable: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.uid,
    email: user.email ?? undefined,
  };
}

function createAuthNotConfiguredError() {
  const error = new Error(
    "Firebase Authentication n'est pas configuré. Vérifiez les variables NEXT_PUBLIC_FIREBASE_*."
  ) as Error & { code?: string };
  error.code = "auth/not-configured";
  return error;
}

function createServerSessionSyncError(code = "auth/session-sync-failed") {
  const error = new Error(
    "Impossible de synchroniser la session serveur. Réessayez dans quelques instants."
  ) as Error & { code?: string };
  error.code = code;
  return error;
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
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
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
            setFirebaseUser(nextUser);

            if (nextUser) {
              void (async () => {
                try {
                  const idToken = await nextUser.getIdToken();

                  if (lastSyncedTokenRef.current === idToken) {
                    return;
                  }

                  await syncServerSessionFromIdToken(idToken);
                  lastSyncedTokenRef.current = idToken;
                } catch (error) {
                  logAuthError("Impossible de synchroniser la session serveur.", error);
                }
              })();
            } else {
              lastSyncedTokenRef.current = null;
              void clearServerSession().catch((error) => {
                logAuthError("Impossible de supprimer la session serveur.", error);
              });
            }
          } catch (error) {
            logAuthError("Erreur pendant la mise à jour de l'état utilisateur.", error);
            setFirebaseUser(null);
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
          setFirebaseUser(null);
          clearTimeout(fallbackTimeout);
          markAuthReady();
        }
      );
    } catch (error) {
      logAuthError("Échec d'initialisation du listener onIdTokenChanged.", error);
      setFirebaseUser(null);
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
    },
    [auth]
  );

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
    lastSyncedTokenRef.current = null;
  }, [auth]);

  const user = useMemo(() => mapAuthUser(firebaseUser), [firebaseUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated: Boolean(firebaseUser),
      isAuthAvailable: Boolean(auth),
      user,
      login,
      signup,
      logout,
    }),
    [auth, firebaseUser, isReady, login, logout, signup, user]
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
