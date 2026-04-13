import Link from "next/link";

const valuePoints = [
  {
    title: "Centraliser l'activité",
    description:
      "Rassemblez vos opérations dans un seul espace pour éviter la dispersion entre outils.",
  },
  {
    title: "Garder une vision claire",
    description:
      "Suivez l'état de vos projets, vos priorités et vos échéances sans perdre le cap.",
  },
  {
    title: "Piloter avec méthode",
    description:
      "Structurez vos décisions avec des indicateurs concrets sur les tâches, objectifs et finances.",
  },
];

const features = [
  {
    title: "Dashboard",
    description:
      "Une vue synthétique pour suivre les signaux clés de votre activité au quotidien.",
  },
  {
    title: "Projets",
    description:
      "Organisez vos missions et gardez une lecture claire de leur avancement.",
  },
  {
    title: "Tâches",
    description:
      "Priorisez l'exécution avec un suivi simple des actions à faire, en cours et terminées.",
  },
  {
    title: "Objectifs",
    description:
      "Fixez des cibles claires et maintenez une trajectoire cohérente dans le temps.",
  },
  {
    title: "Finances",
    description:
      "Visualisez vos flux financiers et pilotez votre rentabilité avec plus de précision.",
  },
  {
    title: "Contacts",
    description:
      "Conservez un suivi propre de vos clients, prospects et partenaires clés.",
  },
];

const audience = [
  "Freelances photo et vidéo",
  "Entrepreneurs créatifs indépendants",
  "Studios en phase de structuration",
];

export default function LandingPage() {
  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20">
      <section className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(160deg,rgba(17,17,17,1)_0%,rgba(22,22,22,1)_55%,rgba(31,31,31,1)_100%)] p-6 sm:p-8 lg:p-12">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          BKR Studio App
        </p>

        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
          Pilotez votre activité créative avec une structure claire et durable.
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          BKR Studio App vous aide à organiser vos projets, vos tâches, vos objectifs et vos
          finances dans un environnement cohérent, pensé pour les entrepreneurs photo et vidéo.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)]"
          >
            Créer un compte
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
          >
            Se connecter
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Pourquoi cette app
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            L'objectif est simple : offrir un cadre de pilotage propre, sans surcharge, pour garder
            la maîtrise de votre activité et avancer avec constance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {valuePoints.map((point) => (
            <article
              key={point.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5"
            >
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{point.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {point.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Fonctionnalités
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Les modules essentiels pour structurer votre exécution et garder une vision opérationnelle
            de votre activité.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5"
            >
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Pour qui
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            BKR Studio App s'adresse aux indépendants qui veulent une base de pilotage sérieuse :
            claire dans l'organisation, solide dans le suivi, et adaptée à une activité créative.
          </p>
        </div>

        <ul className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          {audience.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center sm:p-8">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          Une base solide pour faire grandir votre activité
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          Commencez avec une structure claire dès maintenant, puis faites évoluer votre organisation
          avec vos besoins.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)]"
          >
            Créer un compte
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
          >
            Se connecter
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] pt-6">
        <p className="text-xs text-[var(--text-secondary)] sm:text-sm">
          © {new Date().getFullYear()} BKR Studio App. Outil de pilotage pour entrepreneurs créatifs.
        </p>
      </footer>
    </div>
  );
}
