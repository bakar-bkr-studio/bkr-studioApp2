"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getOrCreateUserProfile,
} from "@/features/profile/api/profile";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { useAuth } from "@/lib/auth/use-auth";
import { PUBLIC_HOME_ROUTE } from "@/lib/auth/route-access";
import type { UserProfile } from "@/types";

interface AppTopBarProps {
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  isMobileViewport: boolean;
  onToggleSidebar: () => void;
}

const pageLabelMap: Array<{ prefix: string; label: string }> = [
  { prefix: "/dashboard", label: "Dashboard" },
  { prefix: "/projects", label: "Projets" },
  { prefix: "/tasks", label: "Tâches" },
  { prefix: "/contacts", label: "Contacts" },
  { prefix: "/finances", label: "Finances" },
  { prefix: "/goals", label: "Objectifs" },
  { prefix: "/profile", label: "Profil" },
  { prefix: "/settings", label: "Paramètres" },
];

const quickActions = [
  { href: "/projects", label: "Nouveau projet" },
  { href: "/tasks", label: "Nouvelle tâche" },
  { href: "/contacts", label: "Nouveau contact" },
  { href: "/finances", label: "Nouvelle transaction" },
] as const;

function getCurrentPageLabel(pathname: string): string {
  const matched = pageLabelMap.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)
  );

  return matched?.label ?? "Espace privé";
}

function getInitials(value: string): string {
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (tokens.length === 0) {
    return "BK";
  }

  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("");
}

function toSafeDisplayName(profile: UserProfile | null, email?: string): string {
  const profileName = profile?.displayName?.trim();
  if (profileName) {
    return profileName;
  }

  if (typeof email === "string" && email.includes("@")) {
    return email.split("@")[0] ?? "Utilisateur";
  }

  return "Utilisateur";
}

function toBusinessName(profile: UserProfile | null): string {
  const businessName = profile?.businessName?.trim();
  if (businessName) {
    return businessName;
  }

  const displayName = profile?.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  return "BKR Studio App";
}

function logTopBarError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[TopBar] ${context}`, error);
  }
}

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function AppTopBar({
  isSidebarCollapsed,
  isMobileSidebarOpen,
  isMobileViewport,
  onToggleSidebar,
}: AppTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const quickMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const pageLabel = useMemo(() => getCurrentPageLabel(pathname), [pathname]);
  const businessLabel = useMemo(
    () => toBusinessName(profile),
    [profile]
  );
  const userDisplayName = useMemo(
    () => toSafeDisplayName(profile, user?.email),
    [profile, user?.email]
  );

  const userInitials = useMemo(
    () => getInitials(userDisplayName),
    [userDisplayName]
  );

  const sidebarToggleLabel = useMemo(() => {
    if (isMobileViewport) {
      return isMobileSidebarOpen ? "Fermer le menu" : "Ouvrir le menu";
    }

    return isSidebarCollapsed ? "Déplier la sidebar" : "Replier la sidebar";
  }, [isMobileSidebarOpen, isMobileViewport, isSidebarCollapsed]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user?.id) {
        if (isMounted) {
          setProfile(null);
        }
        return;
      }

      try {
        const loadedProfile = await getOrCreateUserProfile();
        if (isMounted) {
          setProfile(loadedProfile);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logTopBarError("Impossible de charger le profil pour la top bar.", error);
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    setIsQuickMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (quickMenuRef.current && !quickMenuRef.current.contains(target)) {
        setIsQuickMenuOpen(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsQuickMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace(PUBLIC_HOME_ROUTE);
    } catch (error) {
      setLogoutError(getAuthErrorMessage(error, "logout"));
    } finally {
      setIsLoggingOut(false);
    }
  }

  function renderSidebarIcon() {
    if (isMobileViewport) {
      return isMobileSidebarOpen ? <CloseIcon /> : <MenuIcon />;
    }

    return isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />;
  }

  return (
    <header className="app-topbar" role="banner">
      <div className="app-topbar__left">
        <button
          type="button"
          className="app-topbar__toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarToggleLabel}
          title={sidebarToggleLabel}
        >
          {renderSidebarIcon()}
        </button>

        <span className="app-topbar__context">{pageLabel}</span>
      </div>

      <div className="app-topbar__center" title={businessLabel}>
        {businessLabel}
      </div>

      <div className="app-topbar__right">
        <div className="app-topbar__menu-wrap" ref={quickMenuRef}>
          <button
            type="button"
            className="app-topbar__action-btn"
            aria-haspopup="menu"
            aria-expanded={isQuickMenuOpen}
            onClick={() => {
              setIsQuickMenuOpen((current) => !current);
              setIsProfileMenuOpen(false);
            }}
          >
            + Créer
          </button>

          {isQuickMenuOpen && (
            <div className="app-topbar__menu" role="menu" aria-label="Actions rapides">
              {quickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="app-topbar__menu-link"
                  role="menuitem"
                  onClick={() => setIsQuickMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="app-topbar__menu-wrap" ref={profileMenuRef}>
          <button
            type="button"
            className="app-topbar__profile-btn"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => {
              setIsProfileMenuOpen((current) => !current);
              setIsQuickMenuOpen(false);
            }}
          >
            <span className="app-topbar__avatar" aria-hidden="true">
              {userInitials}
            </span>
            <span className="app-topbar__profile-name">{userDisplayName}</span>
          </button>

          {isProfileMenuOpen && (
            <div className="app-topbar__menu" role="menu" aria-label="Menu profil">
              <Link
                href="/profile"
                className="app-topbar__menu-link"
                role="menuitem"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                Profil
              </Link>
              <Link
                href="/settings"
                className="app-topbar__menu-link"
                role="menuitem"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                Paramètres
              </Link>
              <button
                type="button"
                className="app-topbar__menu-link app-topbar__menu-link--danger"
                role="menuitem"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
              </button>

              {logoutError && (
                <p className="app-topbar__menu-error" role="alert">
                  {logoutError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
