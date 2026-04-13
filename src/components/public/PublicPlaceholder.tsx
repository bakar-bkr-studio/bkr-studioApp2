import Link from "next/link";

type PlaceholderLink = {
  href: string;
  label: string;
};

interface PublicPlaceholderProps {
  title: string;
  description: string;
  links: PlaceholderLink[];
}

export default function PublicPlaceholder({
  title,
  description,
  links,
}: PublicPlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:p-8">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
        BKR Studio App
      </p>

      <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-light)] hover:bg-[var(--bg-hover)]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
