# BKR Studio App

Outil de gestion d'activité pour Aboubakar — photographe et vidéaste indépendant.

## Stack
- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Firebase Auth** + **Cloud Firestore** (à brancher en V1)
- Déploiement prévu sur **Vercel**

## Modules V1
Dashboard · Projets · Tâches · Objectifs · Finances · Paramètres

## Démarrer en local

```bash
npm install
cp .env.local.example .env.local
# Remplir .env.local avec vos clés Firebase
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Sécurité (P0 → P3)
- Secrets uniquement via `.env.local` (jamais commité)
- Règles Firestore restrictives (owner-only + schéma validé)
- Session serveur Firebase (cookie `HttpOnly`, `SameSite=Strict`, `Secure` en prod)
- API server-side avec validation/sanitation, CORS allowlist (`ALLOWED_ORIGINS`) et rate limiting
- Headers de sécurité activés globalement (`CSP`, `X-Frame-Options`, `HSTS`, etc.)
- Messages d’erreur masqués en production (pas de stack trace côté UI)

## Vérifications Sécurité
```bash
# Audit complet des dépendances
npm run security:audit

# Audit production (sans devDependencies)
npm run security:audit:prod

# Pipeline sécurité recommandé avant release
npm run security:check
```

## Structure

```
src/
  app/          → Pages et routes Next.js
  components/   → Composants UI réutilisables
  features/     → Logique par module (dashboard, projects…)
  lib/          → Utilitaires et config Firebase
  types/        → Types TypeScript partagés
  styles/       → CSS global
```
