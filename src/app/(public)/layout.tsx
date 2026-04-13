import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-[var(--text-primary)]">
            BKR STUDIO
          </Link>

          <nav className="flex items-center gap-2 text-sm text-[var(--text-secondary)] sm:gap-4">
            <Link href="/" className="rounded-md px-2 py-1 transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
              Accueil
            </Link>
            <Link href="/login" className="rounded-md px-2 py-1 transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
              Connexion
            </Link>
            <Link href="/signup" className="rounded-md px-2 py-1 transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
              Inscription
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
