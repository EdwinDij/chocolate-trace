#  Chocolaterie — Traçabilité Vrac

Application mobile-first de gestion de la traçabilité des chocolats en vrac pour **À la Mère de Famille — Levis**. Permet de suivre chaque boîte de la réception à la vente, avec calcul automatique des dates de retrait et alertes de péremption.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS |
| Base de données | Supabase (PostgreSQL) |
| Scan code-barres | @zxing/browser |
| Déploiement | Vercel |
| PWA | vite-plugin-pwa |

---

## Fonctionnalités

- **Suivi des lots** — ajout, recherche, filtres par statut, scan de code-barres EAN
- **Alertes** — dashboard KPI avec urgences critiques (à retirer / à surveiller / OK)
- **Historique** — traçabilité complète des lots retirés, groupés par date
- **Catalogue** — gestion des types de chocolat, durées de vie et codes-barres
- **PWA** — installable sur iOS et Android sans passer par l'App Store
- **Annulation** — bouton retour sur chaque action via colonne `last_status`

---

## Règles métier

- **Retrait** = semaine de réception + durée de vie − 2 semaines (géré dans le code)
- **Ganaches** : durée de vie 5 semaines
- **Pralinés / Pâtes d'amandes** : durée de vie 6 semaines
- Statuts possibles : `stock` → `ouvert` → `perime` / `non_conforme` / `epuise`

---

## Schéma de base de données

### `chocolate_type`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| name | text | Nom du type (ex. Ganache, Praliné) |
| week_lifetime | int2 | Durée de vie en semaines |
| barcode | text | Code EAN de la boîte fournisseur |
| created_at | timestamptz | Date de création |

### `batches`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| reference | text | Référence de la boîte |
| type_id | uuid | FK → chocolate_type |
| week_receiving | text | Semaine de réception (ex. S21-2025) |
| week_opening | text | Semaine d'ouverture (nullable) |
| quantity | int4 | Nombre de boîtes |
| status | text | Statut du lot |
| last_status | text | Statut précédent (pour annulation) |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de mise à jour |

### `historic`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| batch_id | uuid | Référence du lot archivé (nullable) |
| type_name | text | Nom du chocolat au moment de l'archivage |
| reference | text | Référence de la boîte |
| status | text | Raison du retrait (perime / non_conforme / epuise) |
| reason | text | Détail de non-conformité (nullable) |
| week_receiving | text | Semaine de réception |
| created_at | timestamptz | Date d'archivage |

---

## Installation

### Prérequis
- Node.js 18+
- Un projet Supabase avec les tables ci-dessus

### Démarrage

```bash
git clone https://github.com/ton-repo/chocolat-tracabilite
cd chocolat-tracabilite
npm install
```

Crée un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Lance le serveur de développement :

```bash
npm run dev
```

### Build et preview

```bash
npm run build
npm run preview -- --host  # accessible sur le réseau local
```

---

## Structure du projet

```
src/
├── components/
│   ├── barcodeScanner/   # Composant scan caméra (@zxing)
│   └── Toast.tsx         # Notifications
├── hooks/
│   └── useToast.ts
├── pages/
│   ├── tracking/         # Page Suivi
│   ├── alertes/          # Page Alertes
│   ├── historic/         # Page Historique
│   └── management/       # Page Gérer
├── types/
│   └── chocolateType.ts
└── utils/
    ├── supabase.ts        # Client Supabase
    ├── dates.js           # Calculs semaines ISO et péremption
    ├── historic.ts        # Fonction d'archivage
    └── chocolateList.ts   # Liste des types de chocolat
```

---

## Déploiement

L'app est déployée automatiquement sur **Vercel** à chaque push sur `main`.

Variables d'environnement à configurer dans Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## PWA — Installation mobile

### iPhone (Safari uniquement)
1. Ouvrez l'URL dans Safari
2. Appuyez sur l'icône Partager
3. Sélectionnez **Sur l'écran d'accueil**
4. Confirmez avec **Ajouter**

### Android (Chrome)
1. Ouvrez l'URL dans Chrome
2. Appuyez sur la bannière **Ajouter à l'écran d'accueil**
3. Ou via les 3 points → **Ajouter à l'écran d'accueil**

---

## Accès

Pas d'authentification — accès par URL partagée entre les membres de l'équipe. Prévu pour une boutique unique.

> Si le besoin de comptes nominatifs apparaît, Supabase Auth peut être intégré ultérieurement sans modifier le schéma BDD.

---

## Évolutions prévues

- [ ] Alertes email hebdomadaires (Supabase Edge Functions + Resend)
- [ ] Auth Supabase si extension à d'autres boutiques
- [ ] Tests unitaires sur `utils/dates.js`

---

© 2026 Edwin Dijeont. Tous droits réservés.
