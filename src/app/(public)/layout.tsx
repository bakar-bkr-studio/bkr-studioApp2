import Link from "next/link";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/login", label: "Connexion" },
  { href: "/signup", label: "Inscription" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(6,182,212,0.14)_0%,rgba(6,182,212,0)_35%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.14)_0%,rgba(59,130,246,0)_33%)]"
      />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(2,6,23,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-white"
          >
            <span className="rounded-md border border-cyan-300/45 bg-cyan-300/10 px-2 py-1 text-[11px] tracking-[0.2em] text-cyan-100">
              BKR
            </span>
            STUDIO
          </Link>

          <nav className="flex items-center gap-1 text-sm text-slate-300 sm:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-transparent px-3 py-1.5 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative w-full pb-16 pt-8 sm:pb-24 sm:pt-12">{children}</main>
    </div>
  );
}
