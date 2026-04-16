"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

type IconProps = {
  className?: string;
};

type Feature = {
  title: string;
  benefit: string;
  icon: (props: IconProps) => ReactNode;
};

type PreviewSection = {
  title: string;
  description: string;
  points: string[];
  tag: string;
  image: string;
  imageAlt: string;
};

const credibilityBadges = [
  "Adopté par 1 200+ créateurs",
  "95% de rétention à 3 mois",
  "Onboarding en moins de 7 minutes",
  "Support humain 7j/7",
];

const trustMarks = [
  "Studio Nova",
  "Atelier Lumen",
  "Collectif Frame",
  "North Pixel",
  "Origin Motion",
  "Bold Narrative",
];

const features: Feature[] = [
  {
    title: "Vision instantanée",
    benefit: "Tous vos indicateurs critiques sur une seule vue, sans changer d'outil.",
    icon: DashboardIcon,
  },
  {
    title: "Pipeline projets",
    benefit: "Passez du brief à la livraison avec un suivi clair des étapes et priorités.",
    icon: WorkflowIcon,
  },
  {
    title: "Exécution équipe",
    benefit: "Assignez, suivez et débloquez vos tâches en temps réel, sans friction.",
    icon: TaskIcon,
  },
  {
    title: "Pilotage finances",
    benefit: "Suivez marge, trésorerie et prévisions pour décider plus vite et mieux.",
    icon: FinanceIcon,
  },
  {
    title: "CRM simplifié",
    benefit: "Regroupez clients, prospects et échanges importants dans un espace propre.",
    icon: ContactsIcon,
  },
  {
    title: "Objectifs actionnables",
    benefit: "Transformez vos ambitions en objectifs mesurables connectés à l'exécution.",
    icon: TargetIcon,
  },
];

const previewSections: PreviewSection[] = [
  {
    title: "Dashboard de pilotage",
    description:
      "Une vue priorisée de votre activité avec les signaux clés: charge, revenu prévisionnel, objectifs et deadlines.",
    points: [
      "Widgets modulables selon votre façon de travailler",
      "Alerte visuelle sur les projets à risque",
      "Résumé hebdo automatique prêt à partager",
    ],
    tag: "Vue globale",
    image:
      "https://i.imgur.com/tX7vyqo.jpeg",
    imageAlt: "Equipe créative qui analyse un dashboard sur écran",
  },
  {
    title: "Projets et tâches alignés",
    description:
      "Chaque projet garde son contexte: livrables, jalons, tâches, responsables et communication client au même endroit.",
    points: [
      "Timeline lisible avec dépendances",
      "Vues Kanban, liste et calendrier",
      "Notes et pièces jointes par mission",
    ],
    tag: "Exécution",
    image:
      "https://i.imgur.com/pktOG5L.jpeg",
    imageAlt: "Freelance qui organise ses projets sur un bureau",
  },
  {
    title: "Finances sans angle mort",
    description:
      "Transformez vos données financières en décisions concrètes avec des projections fiables et des vues orientées rentabilité.",
    points: [
      "Prévision de trésorerie sur 90 jours",
      "Suivi revenus, charges et marge par projet",
      "Vision claire des paiements en attente",
    ],
    tag: "Rentabilité",
    image:
      "https://i.imgur.com/kkpwFOF.jpeg",
    imageAlt: "Créateur qui consulte des graphiques financiers sur ordinateur",
  },
];

const audienceCards = [
  {
    title: "Freelances",
    description:
      "Pour garder une cadence solide entre production, administratif et croissance, sans multiplier les apps.",
  },
  {
    title: "Entrepreneurs",
    description:
      "Pour piloter une activité en expansion avec une structure opérationnelle claire et adaptable.",
  },
  {
    title: "Studios",
    description:
      "Pour harmoniser l'exécution d'équipe, la relation client et la performance financière au quotidien.",
  },
];

const differentiationItems = [
  {
    title: "Tout en un, vraiment utile",
    description:
      "Projets, tâches, finances, contacts et objectifs sont connectés entre eux pour éviter les doubles saisies.",
  },
  {
    title: "Simple en surface, puissant en profondeur",
    description:
      "Une interface claire pour démarrer vite, avec assez de profondeur pour scaler votre organisation.",
  },
  {
    title: "Pensé pour les métiers créatifs",
    description:
      "La logique du produit suit vos réalités: deadlines mouvantes, production, retours clients et arbitrages rapides.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative isolate overflow-hidden pb-16 sm:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-240px] h-[660px] bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.23)_0%,rgba(6,182,212,0)_50%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.22)_0%,rgba(14,165,233,0)_45%),radial-gradient(circle_at_50%_45%,rgba(251,146,60,0.12)_0%,rgba(251,146,60,0)_35%)]"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 sm:gap-24 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
          className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(130deg,rgba(2,6,23,0.88)_0%,rgba(3,7,18,0.84)_45%,rgba(12,18,36,0.92)_100%)] px-6 py-9 shadow-[0_35px_120px_-40px_rgba(14,165,233,0.4)] backdrop-blur-xl sm:px-8 sm:py-12 lg:px-12 lg:py-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-16 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.98fr] lg:items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-100/90">
                BKR Studio App
              </span>

              <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Passez du chaos opérationnel à une activité créative pilotée avec précision.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Centralisez projets, tâches, finances, contacts et objectifs dans une expérience
                claire, rapide et pensée pour convertir votre effort en croissance.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                >
                  Créer un compte
                </Link>
                <Link
                  href="#demo"
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:scale-[1.02] hover:border-cyan-300/60 hover:bg-white/10"
                >
                  Voir la démo
                </Link>
              </div>

              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                <KpiChip label="Projets actifs" value="+32%" />
                <KpiChip label="Temps gagné" value="8h/sem" />
                <KpiChip label="Marge moyenne" value="+19%" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.95, ease, delay: 0.12 }}
              className="relative"
            >
              <div className="rounded-3xl border border-white/15 bg-slate-950/60 p-3 shadow-[0_28px_80px_-35px_rgba(34,211,238,0.75)] backdrop-blur-xl">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Workspace</p>
                      <p className="text-sm font-semibold text-white">BKR Studio Production</p>
                    </div>
                    <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                      Temps réel
                    </span>
                  </div>

                  <div className="grid gap-3 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MockMetric title="Missions" value="14" delta="+2 cette semaine" />
                      <MockMetric title="Revenus mois" value="18.4k€" delta="+11%" />
                      <MockMetric title="Tâches urgentes" value="7" delta="2 en retard" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Charge production
                        </p>
                        <div className="mt-4 flex h-28 items-end gap-2">
                          {[42, 70, 58, 76, 64, 88, 72].map((value) => (
                            <div
                              key={value}
                              className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-500/60 to-blue-400/80"
                              style={{ height: `${value}%` }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Deadlines</p>
                        <ul className="mt-3 space-y-2 text-xs text-slate-300">
                          {[
                            "Campagne Nox - demain",
                            "Montage Reel V3 - jeudi",
                            "Closing client Aria - vendredi",
                          ].map((item) => (
                            <li key={item} className="rounded-lg border border-white/10 px-2 py-1.5">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-7 -right-6 hidden w-52 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 shadow-2xl backdrop-blur-lg sm:block">
                <Image
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
                  alt="Equipe créative en réunion"
                  width={420}
                  height={280}
                  className="h-24 w-full object-cover"
                  sizes="208px"
                />
                <div className="space-y-1.5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Sprint client</p>
                  <p className="text-sm font-semibold text-white">Livraison dans 36h</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <Reveal>
          <section className="space-y-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Ils structurent déjà leur activité avec BKR Studio App
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {credibilityBadges.map((badge) => (
                <motion.div
                  key={badge}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-slate-200"
                >
                  {badge}
                </motion.div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
              <div className="grid gap-3 text-center sm:grid-cols-2 lg:grid-cols-6">
                {trustMarks.map((mark) => (
                  <div key={mark} className="text-sm font-medium tracking-wide text-slate-400">
                    {mark}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <section>
          <Reveal>
            <SectionHeading
              eyebrow="Fonctionnalités"
              title="Le cockpit complet pour piloter votre business créatif"
              description="Chaque module est conçu pour être visuel, actionnable et orienté résultat. Vous passez moins de temps à organiser, plus de temps à produire."
            />
          </Reveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
              hidden: { opacity: 1 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.12,
                },
              },
            }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
                }}
                whileHover={{ y: -7, scale: 1.01 }}
                transition={{ duration: 0.22 }}
                className="group rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(15,23,42,0.72),rgba(2,6,23,0.88))] p-6 shadow-[0_20px_50px_-30px_rgba(14,165,233,0.35)]"
              >
                <div className="inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2.5 text-cyan-200 transition group-hover:border-cyan-200/45 group-hover:bg-cyan-300/20">
                  {feature.icon({ className: "h-5 w-5" })}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.benefit}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section id="demo" className="space-y-8 scroll-mt-28">
          <Reveal>
            <SectionHeading
              eyebrow="Preview produit"
              title="Voyez exactement comment l'app vous fait gagner en clarté"
              description="Chaque vue est pensée pour connecter stratégie et opérationnel, sans casser votre rythme de production."
            />
          </Reveal>

          <div className="space-y-8">
            {previewSections.map((section, index) => (
              <Reveal key={section.title} delay={0.05 * index}>
                <article className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
                  {index % 2 === 0 ? (
                    <>
                      <PreviewImageCard section={section} />
                      <PreviewCopy section={section} />
                    </>
                  ) : (
                    <>
                      <PreviewCopy section={section} />
                      <PreviewImageCard section={section} />
                    </>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal>
            <SectionHeading
              eyebrow="Pour qui"
              title="Conçu pour les profils qui veulent de la rigueur sans lourdeur"
              description="Que vous soyez solo ou en équipe, vous gardez un cadre net pour produire, livrer et rentabiliser."
            />
          </Reveal>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {audienceCards.map((item, index) => (
              <Reveal key={item.title} delay={0.08 * index}>
                <motion.article
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.22 }}
                  className="h-full rounded-2xl border border-white/10 bg-[linear-gradient(170deg,rgba(15,23,42,0.55),rgba(10,10,10,0.82))] p-6 backdrop-blur-md"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-cyan-200/80">
                    Segment
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[linear-gradient(120deg,rgba(2,6,23,0.85),rgba(15,23,42,0.7),rgba(8,47,73,0.38))] p-6 sm:p-8 lg:p-10">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/75">
                  Différenciation
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Pourquoi BKR Studio App est différent
                </h2>

                <div className="mt-7 space-y-4">
                  {differentiationItems.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-200">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold text-white">{item.title}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Impact observé</p>
                <p className="mt-4 text-4xl font-semibold text-white">+27%</p>
                <p className="mt-2 text-sm text-slate-300">de capacité de production en moyenne après 6 semaines.</p>

                <div className="mt-6 space-y-2 text-sm text-slate-300">
                  <p className="rounded-lg border border-white/10 px-3 py-2">Moins d'outils fragmentés</p>
                  <p className="rounded-lg border border-white/10 px-3 py-2">Décisions plus rapides</p>
                  <p className="rounded-lg border border-white/10 px-3 py-2">Meilleure visibilité équipe/client</p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.85, ease }}
          className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.28),rgba(3,7,18,0.96)_52%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.25),rgba(3,7,18,0)_50%)] px-6 py-14 text-center sm:px-10"
        >
          <div className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-1/3 h-52 w-52 rounded-full bg-blue-500/25 blur-3xl" />

          <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
            Expérience premium
          </p>
          <h2 className="relative mx-auto mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Une interface qui donne immédiatement confiance, et qui convertit en action.
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
            Chaque écran a été pensé pour réduire la friction cognitive et accélérer les décisions.
          </p>
        </motion.section>

        <Reveal>
          <section className="rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-10 text-center shadow-[0_30px_80px_-50px_rgba(56,189,248,0.55)] sm:px-10">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Prêt à piloter votre activité comme une vraie structure pro ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Créez votre compte maintenant et mettez en place une organisation solide dès cette
              semaine.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]"
              >
                Créer un compte
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition duration-300 hover:border-cyan-300/60 hover:bg-white/10"
              >
                Voir la plateforme
              </Link>
            </div>
          </section>
        </Reveal>

        <footer className="border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} BKR Studio App. Plateforme de pilotage pour freelances,
            créateurs et studios.
          </p>
        </footer>
      </div>
    </div>
  );
}

function KpiChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MockMetric({
  title,
  value,
  delta,
}: {
  title: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{title}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-300">{delta}</p>
    </div>
  );
}

function PreviewImageCard({ section }: { section: PreviewSection }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
      <Image
        src={section.image}
        alt={section.imageAlt}
        width={960}
        height={640}
        className="h-[280px] w-full object-cover sm:h-[360px]"
        sizes="(max-width: 1024px) 100vw, 56vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
      <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/65 px-3 py-1 text-xs font-medium text-cyan-100">
        {section.tag}
      </span>
    </div>
  );
}

function PreviewCopy({ section }: { section: PreviewSection }) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-white sm:text-3xl">{section.title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">{section.description}</p>
      <ul className="mt-5 space-y-2 text-sm text-slate-200">
        {section.points.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <span className="mt-1 text-cyan-300">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3" y="3" width="7" height="8" rx="1.6" />
      <rect x="14" y="3" width="7" height="5" rx="1.6" />
      <rect x="14" y="10" width="7" height="11" rx="1.6" />
      <rect x="3" y="13" width="7" height="8" rx="1.6" />
    </svg>
  );
}

function WorkflowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3" y="4" width="7" height="5" rx="1.4" />
      <rect x="14" y="4" width="7" height="5" rx="1.4" />
      <rect x="8.5" y="15" width="7" height="5" rx="1.4" />
      <path d="M10 6.5h4M17.5 9v3.5M6.5 9v3.5M6.5 12.5h11" />
    </svg>
  );
}

function TaskIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 6h12M4 12h8M4 18h10" />
      <path d="M18 5l2 2 3-3M16.5 17.5l1.8 1.8L22 15.8" />
    </svg>
  );
}

function FinanceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 19h16" />
      <path d="M6 16V9M11 16V5M16 16v-3M21 16V7" />
    </svg>
  );
}

function ContactsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 18.5c0-3 2.4-5.5 5.5-5.5s5.5 2.4 5.5 5.5" />
      <path d="M16.5 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M14.5 18.5c.2-2 1.8-3.7 3.9-4" />
    </svg>
  );
}

function TargetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
