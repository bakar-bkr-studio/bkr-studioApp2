"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className={`app-shell ${isSidebarCollapsed ? "is-collapsed" : ""}`}>
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-header__menu-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <span className="mobile-header__brand">BKR STUDIO</span>
      </header>

      <button
        type="button"
        className={`sidebar-backdrop ${isMobileSidebarOpen ? "is-open" : ""}`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-label="Fermer le menu"
      />

      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="app-main">{children}</main>
    </div>
  );
}
