## Nom du projet
BKR Studio App

## Objectif
Créer une web app responsive pour gérer l’activité de BKR STUDIO depuis Mac et téléphone.

## Utilisateur principal
Aboubakar, entrepreneur solo, photographe et vidéaste.

## But métier
Centraliser la gestion de l’auto-entreprise dans une seule application :
- suivi du chiffre d’affaires
- suivi des dépenses
- gestion des projets clients
- gestion des tâches
- suivi des objectifs

## Périmètre V1
La V1 doit inclure uniquement :

1. Dashboard
2. Projets
3. Tâches
4. Objectifs
5. Finances
6. Paramètres

## Stack technique imposée
- Next.js
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Déploiement futur sur Vercel

## Contraintes importantes
- Code clair et maintenable par un débutant assisté par IA
- Architecture simple et propre
- Responsive mobile + desktop
- Pas de backend custom
- Pas de complexité inutile
- Pas de dépendances exotiques sans vraie nécessité
- Pas de fonctionnalités hors périmètre V1

## Modules V1

### Dashboard
Afficher :
- chiffre d’affaires du mois
- dépenses du mois
- bénéfice estimé
- projets actifs
- tâches urgentes
- objectifs en cours

### Projets
Chaque projet contient :
- title
- clientName
- serviceType
- status
- shootDate
- deliveryDate
- amountQuoted
- amountPaid
- notes

### Tâches
Chaque tâche contient :
- title
- description
- priority
- status
- dueDate
- projectId nullable

### Objectifs
Chaque objectif contient :
- title
- description
- horizon
- status
- targetValue nullable
- currentValue nullable
- dueDate nullable

### Finances
Chaque transaction contient :
- type
- category
- amount
- date
- paymentMethod
- notes
- projectId nullable

## Structure Firestore prévue
Collections :
- users
- projects
- tasks
- goals
- transactions

Chaque document métier doit inclure :
- userId
- createdAt
- updatedAt

## Arborescence cible
```text
app-bkr-studio-2/
  docs/
    SECURITY.md
  src/
    app/
    components/
    features/
    lib/
    types/
    styles/
  public/
  .env.local
  .gitignore
  package.json
  tsconfig.json
  README.md