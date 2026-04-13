"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import AppTopBar from "@/components/AppTopBar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const updateViewportState = () => {
      setIsMobileViewport(window.innerWidth <= 768);
    };

    updateViewportState();

    const handleResize = () => {
      updateViewportState();
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

  function handleToggleSidebar() {
    if (isMobileViewport) {
      setIsMobileSidebarOpen((currentValue) => !currentValue);
      return;
    }

    setIsSidebarCollapsed((currentValue) => !currentValue);
  }

  return (
    <div className={`app-shell ${isSidebarCollapsed ? "is-collapsed" : ""}`}>
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

      <main className="app-main">
        <AppTopBar
          isSidebarCollapsed={isSidebarCollapsed}
          isMobileSidebarOpen={isMobileSidebarOpen}
          isMobileViewport={isMobileViewport}
          onToggleSidebar={handleToggleSidebar}
        />

        <div className="app-main-content">{children}</div>
      </main>
    </div>
  );
}
