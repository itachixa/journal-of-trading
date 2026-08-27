# ProTrade Journal

SaaS de journal de trading avec Supabase. Suivez vos trades, calculez vos positions, analysez vos performances et gérez vos notes de marché.

## Stack technique

- **Frontend** : React 19 + Vite 8 (SPA)
- **Backend** : Express (API REST)
- **Base de données** : Supabase (PostgreSQL + Auth + RLS)
- **Déploiement** : Vercel (frontend) + Railway/Render (backend) + Supabase (DB)

## Installation locale

### 1. Prérequis

- Node.js >= 18
- Un projet Supabase

### 2. Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Dans l'éditeur SQL de Supabase, exécutez le fichier `supabase-schema.sql`
3. Récupérez votre **URL du projet** et votre **clé anonyme** (Project Settings > API)

### 3. Variables d'environnement

Copiez `.env.example` vers `.env.local` et remplissez les valeurs :

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
```

Pour le déploiement du backend, ajoutez aussi :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anonyme
FRONTEND_URL=https://votre-app.vercel.app
```

### 4. Installation des dépendances

```bash
npm install
```

### 5. Lancer le projet

Terminal 1 - Backend API :
```bash
npm run serve
```

Terminal 2 - Frontend (optionnel, pour dev) :
```bash
npm run dev
```

Ouverture : [http://localhost:3000](http://localhost:3000) (backend sert aussi le frontend en production)

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur Vite en mode dev (port 5173) |
| `npm run build` | Build le frontend pour la production |
| `npm run preview` | Prévisualise le build de production |
| `npm run serve` | Démarre le serveur Express en production |
| `npm run lint` | Lance le linting ESLint |

## Déploiement SaaS

### Frontend (Vercel)

1. Importez le repo sur GitHub
2. Créez un nouveau projet Vercel lié au repo
3. **Root Directory** : `protrade-journal`
4. Ajoutez les variables d'environnement :
   - `VITE_API_URL` : URL de votre backend (ex: `https://votre-app.up.railway.app/api`)
   - `VITE_SUPABASE_URL` : URL Supabase
   - `VITE_SUPABASE_ANON_KEY` : clé anonyme Supabase
5. Build Command : `npm run build`
6. Output Directory : `dist`

### Backend (Railway ou Render)

#### Option A : Railway

1. Créez un nouveau projet sur [railway.app](https://railway.app)
2. Connectez votre repo GitHub
3. **Root Directory** : `protrade-journal`
4. Ajoutez les variables d'environnement :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `FRONTEND_URL`
   - `PORT` (Railway assigne ce port automatiquement)
5. Railway utilisera `nixpacks.toml` pour détecter le build/start

#### Option B : Render

1. Créez un nouveau Web Service sur [render.com](https://render.com)
2. Connectez votre repo
3. **Root Directory** : `protrade-journal`
4. Build Command : `npm install && npm run build`
5. Start Command : `node server.js`
6. Ajoutez les variables d'environnement Supabase

### Base de données (Supabase)

1. Déployez le schéma `supabase-schema.sql` dans l'éditeur SQL Supabase
2. Activez l'authentification par email dans Supabase Auth
3. Configurez les redirections email dans Supabase Auth :
   - Redirect URL : `https://votre-app.vercel.app/auth/callback`

## Fonctionnalités

- Journal de trades complet (buy/sell, stop loss, take profit, tags)
- Calculateur de taille de position
- Statistiques détaillées (winrate, profit factor, courbe d'équité)
- Surveillance de setups de marché
- Checklist pré-trade
- Notes de marché par catégorie
- Gestionnaire de tags personnalisés
- Export des données (JSON)
- Thème sombre/clair
- Multilingue (FR/EN)
- Authentification sécurisée (Supabase Auth)

## Licence

MIT
