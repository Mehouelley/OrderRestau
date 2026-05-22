# CAHIER DE CHARGE - OrderResto

## Plateforme de commande en ligne pour restaurants

> Note de mise a jour (20/05/2026)
> L'implementation en production repose sur un backend Laravel (API REST) avec authentification par token API et paiement Fedapay.
> Les references historiques a Supabase, RLS, Wave/MTN/Especes restent des elements de specification legacy.

---

## 1. PRESENTATION GENERALE

### 1.1 Contexte

OrderResto est une plateforme web permettant aux clients de commander dans des restaurants a l'avance, sans attendre sur place. Le client choisit un restaurant, reserve une table (ou commande a emporter), passe sa commande et paie en ligne. Quand il arrive au restaurant, sa commande est en preparation et sa table l'attend.

### 1.2 Objectifs

- Eliminer le temps d'attente au restaurant pour le client
- Permettre la commande a distance (depuis chez soi, le bureau, etc.)
- Offrir une visibilite en temps reel sur la disponibilite des tables
- Digitaliser la gestion des commandes pour le restaurateur
- Fournir un ecran cuisine dedie pour le suivi des preparations

### 1.3 Public cible

| Acteur | Description | Besoin |
|--------|-------------|--------|
| Client | Particulier qui veut manger | Commander sans attendre, voir les tables disponibles |
| Restaurateur | Gerant du restaurant | Gerer menu, commandes, tables, voir les statistiques |
| Cuisine | Chef / equipe en cuisine | Voir les commandes en temps reel, les preparer dans l'ordre |
| Serveur | Personnel de service | Servir les commandes pretes aux tables |

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Style | Tailwind CSS 3 |
| Routing | React Router DOM 7 |
| State | Zustand 5 |
| Charts | Chart.js 4 + react-chartjs-2 |
| QR Code | qrcode.react 4 |
| Icones | Lucide React |
| Backend API | Laravel 13 (orderresto-backend) |
| Base de donnees | MySQL/PostgreSQL via Laravel migrations |
| Auth | Token API personnalise (Bearer + SHA-256) |

### 2.2 Structure du projet

```
src/
  App.tsx                    # Routage principal
  main.tsx                   # Point d'entree
  index.css                  # Styles globaux + Tailwind
  components/
    CardProduit.tsx          # Carte d'un plat
    LayoutClient.tsx         # Layout menu digital
    LayoutCuisine.tsx        # Layout ecran cuisine
    LayoutResto.tsx          # Layout dashboard restaurateur
    PanierFloating.tsx       # Panier flottant + sidebar
    ProtectedRoute.tsx       # Guard d'authentification
    StatutBadge.tsx          # Badge de statut commande
    TableCommandes.tsx       # Tableau des commandes
  contexts/
    AuthContext.tsx           # Store auth (Zustand)
    CartContext.tsx           # Store panier (Zustand)
  data/
    mock.ts                  # Donnees de demonstration (legacy)
  pages/
    Landing.tsx              # Page d'accueil
    auth/
      Login.tsx              # Connexion restaurateur
      Register.tsx           # Inscription restaurateur
    client/
      Restaurants.tsx        # Liste des restaurants
      RestaurantDetail.tsx   # Detail + choix table/emporter
      MenuDigital.tsx        # Menu digital + commande
      Paiement.tsx           # Page de paiement
    cuisine/
      KitchenAccess.tsx      # Acces ecran cuisine
      KitchenDisplay.tsx     # Ecran cuisine Kanban
    resto/
      Dashboard.tsx          # Tableau de bord
      Commandes.tsx          # Gestion des commandes
      MenuManagement.tsx     # Gestion du menu
      TablesQR.tsx           # Gestion tables + QR codes
      Statistiques.tsx       # Statistiques avancees
      Parametres.tsx         # Parametres restaurant
  services/
    api.ts                   # Couche API HTTP vers /api
supabase/
  migrations/
    20260505121149_create_restaurant_platform_schema.sql   # Legacy (non source de verite runtime)
```

---

## 3. PARCOURS UTILISATEUR

### 3.1 Parcours Client (PUBLIC - pas de compte requis)

```
Page d'accueil (/)
  |
  v
Liste des restaurants (/restaurants)
  |  Recherche par nom, cuisine, adresse
  |  Indicateur tables libres / occupees
  |  Note, temps de preparation moyen
  |
  v
Detail restaurant (/restaurant/:slug)
  |  Choix du mode :
  |  - Sur place : grille des tables (vert=libre, rouge=occupee)
  |  - A emporter : pas de table necessaire
  |
  v
Menu digital (/menu/:slug/:tableId)
  |  Badge contextuel : "Table 2" ou "A emporter"
  |  Recherche + filtres par categorie
  |  Grille de plats avec photos, prix, temps
  |  Panier flottant avec :
  |    - Liste des articles + quantites
  |    - Choix sur place / a emporter
  |    - Instructions speciales
  |    - Temps de preparation estime
  |    - Bouton "Passer la commande"
  |
  v
Paiement (/paiement/:commandeId)
  |  Recapitulatif de la commande
  |  Temps de preparation estime (encart jaune)
  |  Paiement en ligne via Fedapay
  |  Saisie des informations client (telephone, nom, email)
  |
  v
Confirmation
   Message : "Commande confirmee !"
   Temps estime en gros : "20 min"
   Reference de la commande
   Bouton "Retour aux restaurants"
```

**Acces alternatif via QR code :**
Le client scanne le QR code pose sur sa table -> arrive directement sur `/menu/:slug/:tableId` avec la table pre-selectionnee. Il n'a pas besoin de passer par la liste des restaurants.

### 3.2 Parcours Restaurateur (COMPTE REQUIS)

```
Inscription (/register)
  |  Nom du restaurant, email, telephone, mot de passe
  |
  v
Connexion (/login)
  |  Email + mot de passe
  |
  v
Dashboard (/resto/dashboard)
  |  4 cartes : CA du jour, commandes, clients actifs, temps d'attente moyen
  |  Graphique des commandes sur 24h
  |  Commandes actives
  |  Tables occupees
  |
  +---> Commandes (/resto/commandes)
  |      Onglets : Toutes, Nouvelles, En cours, Pretes, Servies
  |      Tableau avec actions (Accepter, Preparer, Servir)
  |
  +---> Menu (/resto/menu)
  |      Categories avec produits
  |      Ajout/Modification/Suppression de plats
  |      Toggle disponibilite
  |
  +---> Tables (/resto/tables)
  |      Liste des tables avec statut
  |      Ajout/Modification/Suppression
  |      Generation de QR codes par table
  |      Telechargement QR en PNG
  |
  +---> Statistiques (/resto/stats)
  |      Filtre : Aujourd'hui / Semaine / Mois
  |      CA evolution (courbe)
  |      Top 5 produits (barres)
  |      Repartition sur place / emporter (camembert)
  |      Commandes par heure (barres)
  |
  +---> Parametres (/resto/parametres)
         Nom, telephone, email, adresse
         Sauvegarde
```

### 3.3 Parcours Cuisine (ACCES PAR CODE OU COMPTE)

```
Ecran d'acces (/cuisine/access)
  |  Saisie du code d'acces (defaut : 1234)
  |  Ou connexion avec compte restaurateur
  |
  v
Ecran cuisine (/cuisine/:slug)
   Affichage plein ecran, theme sombre
   3 colonnes Kanban :
     - NOUVELLE (ambre) : commandes recues
     - EN COURS (orange) : commandes en preparation
     - PRETE (vert) : commandes pretes a servir
   Chaque carte affiche :
     - Numero de table (en gros)
     - Liste des plats avec quantites
     - Temps ecoule depuis la commande
     - Instructions speciales du client
     - Alerte rouge si > 15 minutes
     - Bouton d'action pour faire avancer
   Rafraichissement automatique toutes les 30 secondes
   Horloge en temps reel dans le header
```

---

## 4. FONCTIONNALITES DETAILLEES

### 4.1 Page d'accueil

- Hero avec slogan "Commandez a l'avance, mangez sans attendre"
- Section "Comment ca marche" en 4 etapes
- Section "2 facons de commander" : Sur place vs A emporter
- Apercu des restaurants avec tables disponibles
- CTA "Commander maintenant" -> /restaurants
- Lien discret "J'ai un restaurant" -> /login
- Aucune mention de l'ecran cuisine ou du dashboard (centree 100% client)

### 4.2 Liste des restaurants

- Barre de recherche (nom, cuisine, adresse)
- Cartes restaurant avec : photo, nom, adresse, cuisine, note, temps moyen, tables libres
- Badge "FERME" si restaurant ferme
- Indicateur visuel : vert = tables libres, rouge = complet

### 4.3 Detail restaurant + choix table

- En-tete avec photo, nom, adresse, note, statut ouvert/ferme
- 2 boutons de mode : "Sur place" et "A emporter"
- Si "Sur place" : grille des tables avec statut (libre/occupee)
  - Tables libres : vert, cliquable, selectionnable
  - Tables occupees : rouge, non cliquable
  - Table selectionnee : bleu avec coche
  - Resume : "5 tables libres / 5 occupees"
  - Encart info : temps estime de liberation des tables occupees
- Si "A emporter" : pas de selection de table, encart explicatif
- Bouton "Voir le menu et commander" (desactive si sur place sans table)

### 4.4 Menu digital

- En-tete avec nom du restaurant et badge contextuel :
  - "Table 2" si commande sur place
  - "A emporter" si emporter
  - "Commande a distance" si acces sans table
  - Temps de preparation moyen
- Barre de recherche
- Filtres par categorie (Chawarmas, Grills, Boissons, Desserts, Accompagnements)
- Grille de cartes produits :
  - Photo avec zoom au survol
  - Badge temps de preparation
  - Prix en FCFA
  - Description (2 lignes max)
  - Overlay "Indisponible" si non disponible
  - Bouton "Ajouter"
- Boutons fixes en bas : panier et passage de commande

### 4.5 Panier flottant

- Mobile : barre fixe en bas avec nombre d'articles et total
- Desktop : bouton flottant en bas a droite avec badge
- Panneau lateral coulissant :
  - Contexte : table selectionnee ou "A emporter"
  - Toggle sur place / a emporter
  - Liste des articles avec controles +/-
  - Suppression d'article
  - Champ instructions speciales
  - Total et temps de preparation estime
  - Bouton "Passer la commande" avec spinner

### 4.6 Page de paiement

- Recapitulatif de la commande (plats, quantites, prix, total)
- Contexte : table ou emporter
- Encart temps de preparation estime
- Paiement principal : Fedapay (redirection checkout)
- Champs client : numero de telephone, nom, email
- Bouton "Confirmer le paiement" avec spinner
- Ecran de confirmation :
  - Message de succes
  - Temps estime en gros
  - Message adapte au mode :
    - Sur place : "Votre commande sera apportee a votre table"
    - Emporter : "Arrivez au restaurant, votre commande sera prete"
  - Reference de la commande
  - Bouton "Retour aux restaurants"

### 4.7 Dashboard restaurateur

- 4 cartes statistiques : CA du jour, commandes du jour, clients actifs, temps d'attente moyen
- Graphique en courbe : commandes sur 24h
- Tableau des commandes actives
- Liste des tables occupees

### 4.8 Gestion des commandes

- Onglets de filtre : Toutes, Nouvelles, En cours, Pretes, Servies
- Tableau avec colonnes : Table, Plats, Heure, Statut, Actions
- Actions contextuelles selon le statut :
  - Nouvelle : "Accepter"
  - En cours : "Marquer prete"
  - Prete : "Marquer servie"
- Menu deroulant pour changement direct de statut
- Badge "Emporter" pour les commandes a emporter
- Affichage des instructions speciales

### 4.9 Gestion du menu

- Liste des categories avec produits expandables
- Ajout de categorie (nom, ordre)
- Ajout de produit (nom, categorie, description, prix, temps de preparation, image, disponibilite)
- Modification de produit
- Suppression de produit
- Toggle disponibilite (on/off) en un clic

### 4.10 Gestion des tables + QR codes

- Liste des tables avec statut (libre/occupee)
- Ajout de table (nom)
- Modification de table
- Suppression de table
- Pour chaque table :
  - Apercu du QR code
  - URL du QR code : `{baseUrl}/menu/{restaurantSlug}/{tableId}`
  - Telechargement du QR en PNG
  - Badge de statut

### 4.11 Statistiques

- Filtre temporel : Aujourd'hui / Cette semaine / Ce mois
- 4 graphiques :
  - Evolution du CA (courbe)
  - Top 5 des produits vendus (barres)
  - Repartition sur place / emporter (camembert)
  - Commandes par heure (barres)

### 4.12 Parametres restaurant

- Formulaire : nom, telephone, email, adresse
- Bouton sauvegarder avec message de confirmation

### 4.13 Ecran cuisine

- Theme sombre (optimise pour la cuisine)
- 3 colonnes Kanban : Nouvelle, En Cours, Prete
- Cartes de commande avec :
  - Numero de table en gros
  - Liste des plats avec quantites
  - Temps ecoule depuis la commande
  - Instructions speciales
  - Alerte rouge si commande > 15 minutes
  - Bouton d'action pour avancer le statut
- Horloge en temps reel
- Rafraichissement automatique toutes les 30 secondes

### 4.14 Authentification

- Inscription : nom du restaurant, email, telephone, mot de passe, confirmation
- Connexion : email, mot de passe
- Protection des routes restaurateur (redirection vers /login si non authentifie)
- Deconnexion

---

## 5. BASE DE DONNEES

### 5.1 Schema

#### restaurants
| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| owner_id | uuid | FK auth.users, NOT NULL |
| name | text | NOT NULL |
| slug | text | UNIQUE, NOT NULL |
| phone | text | |
| email | text | |
| address | text | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

#### categories
| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| restaurant_id | uuid | FK restaurants, NOT NULL |
| name | text | NOT NULL |
| sort_order | integer | DEFAULT 0 |
| created_at | timestamptz | DEFAULT now() |

#### products
| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| category_id | uuid | FK categories, NOT NULL |
| restaurant_id | uuid | FK restaurants, NOT NULL |
| name | text | NOT NULL |
| description | text | DEFAULT '' |
| price | decimal(10,2) | NOT NULL |
| prep_time_minutes | integer | DEFAULT 15 |
| image_url | text | DEFAULT '' |
| available | boolean | DEFAULT true |
| sort_order | integer | DEFAULT 0 |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

#### tables
| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| restaurant_id | uuid | FK restaurants, NOT NULL |
| name | text | NOT NULL |
| status | text | CHECK ('libre', 'occupee'), DEFAULT 'libre' |
| created_at | timestamptz | DEFAULT now() |

#### orders
| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| restaurant_id | uuid | FK restaurants, NOT NULL |
| table_id | uuid | FK tables, ON DELETE SET NULL |
| status | text | CHECK ('nouvelle','en_cours','prete','servie'), DEFAULT 'nouvelle' |
| order_type | text | CHECK ('sur_place','emporter'), DEFAULT 'sur_place' |
| special_instructions | text | DEFAULT '' |
| customer_phone | text | |
| total | decimal(10,2) | NOT NULL |
| estimated_prep_minutes | integer | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

#### order_items
| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| order_id | uuid | FK orders, ON DELETE CASCADE, NOT NULL |
| product_id | uuid | FK products, ON DELETE SET NULL |
| product_name | text | NOT NULL |
| quantity | integer | CHECK > 0, NOT NULL |
| unit_price | decimal(10,2) | NOT NULL |
| created_at | timestamptz | DEFAULT now() |

#### payments
| Colonne | Type | Contraintes |
|---------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| order_id | uuid | FK orders, NOT NULL |
| method | text | ex: 'fedapay' |
| amount | decimal(10,2) | NOT NULL |
| status | text | DEFAULT 'en_attente' |
| customer_phone | text | |
| created_at | timestamptz | DEFAULT now() |

### 5.2 Securite - Isolation des donnees (etat reel)

L'isolation est implemente au niveau applicatif Laravel (middlewares + filtrage par `restaurant_id`) et non via RLS Supabase.

| Ressource | Lecture | Ecriture |
|----------|---------|----------|
| restaurants | Public (listing/detail) + Proprietaire (gestion) | Proprietaire uniquement |
| categories/products/tables | Public en lecture par slug + Proprietaire en CRUD | Proprietaire uniquement |
| orders | Public (creation + suivi par id) + Proprietaire (listing/maj statut) | Client (creation), Proprietaire/Cuisine (statut) |
| payments | Creation/confirmation via endpoints API (Fedapay callback/webhook) | API backend |

### 5.3 Index

- Index sur toutes les cles etrangeres
- Index sur orders(restaurant_id, status)
- Index sur products(category_id, restaurant_id)

---

## 6. SYSTEME DE STATE

### 6.1 Auth Store (Zustand)

```typescript
{
  user: { id: string; email: string; restaurantName: string } | null;
  isAuthenticated: boolean;
  login(email, password): Promise<void>;
  register(data): Promise<void>;
  logout(): void;
}
```

### 6.2 Cart Store (Zustand)

```typescript
{
  items: CartItem[];
  orderType: 'sur_place' | 'emporter';
  specialInstructions: string;
  addItem(item): void;
  removeItem(id): void;
  updateQuantity(id, qty): void;
  clearCart(): void;
  setOrderType(type): void;
  setSpecialInstructions(text): void;
  total(): number;
  totalItems(): number;
  maxPrepTime(): number;
}

CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  prepTime: number;
  image_url: string;
}
```

---

## 7. DESIGN ET UX

### 7.1 Chartes graphique

- Couleur primaire : brand (orange)
- Couleur secondaire : ocean (bleu)
- Couleur accent : kitchen (vert)
- Couleurs paiement : Fedapay (couleur marque) + neutres interface
- Theme clair pour client et restaurateur
- Theme sombre pour l'ecran cuisine

### 7.2 Principes UX

- Le client ne cree jamais de compte
- Le client ne voit jamais l'ecran cuisine ou le dashboard
- La landing page est centree 100% sur l'experience client
- Le restaurateur a un lien discret "J'ai un restaurant" pour acceder a son espace
- Le panier est toujours accessible (flottant)
- Le temps de preparation estime est affiche a chaque etape
- Les tables disponibles sont visibles en temps reel
- Le parcours paiement est simplifie autour de Fedapay (checkout externe)

### 7.3 Responsive

- Mobile-first
- Grilles adaptatives : 1 colonne mobile, 2 tablette, 3-4 desktop
- Panier : barre fixe en bas (mobile), bouton flottant (desktop)
- Sidebar restaurateur : collapse a 64px sur petit ecran

---

## 8. DONNEES DE DEMONSTRATION

### 8.1 Restaurant

- Le Jardin Gourmand, Plateau Dakar, slug: le-jardin-gourmand

### 8.2 Categories (5)

Chawarmas, Grills, Boissons, Desserts, Accompagnements

### 8.3 Produits (12)

| Produit | Categorie | Prix (FCFA) | Temps | Disponible |
|---------|-----------|-------------|-------|------------|
| Chawarma Poulet | Chawarmas | 2 500 | 15 min | Oui |
| Chawarma Boeuf | Chawarmas | 3 000 | 18 min | Oui |
| Chawarma Mixte | Chawarmas | 3 500 | 20 min | Oui |
| Brochettes Merguez | Grills | 2 800 | 20 min | Oui |
| Poulet Yassa Grille | Grills | 3 500 | 25 min | Oui |
| Bissap | Boissons | 500 | 2 min | Oui |
| Gingembre | Boissons | 500 | 2 min | Oui |
| Coca-Cola 33cl | Boissons | 600 | 1 min | Oui |
| Thiakry | Desserts | 1 000 | 5 min | Oui |
| Glace Artisanale | Desserts | 1 200 | 3 min | Non |
| Frites Maison | Accompagnements | 800 | 10 min | Oui |
| Salade Fraicheur | Accompagnements | 1 000 | 5 min | Oui |

### 8.4 Tables (10)

Table 1-5, Terrasse 1-3, VIP 1-2 (melange libre/occupee)

### 8.5 Commandes (exemples)

Jeu d'exemples en differents statuts (nouvelle, en_cours, prete, servie) pour demo/tests.

---

## 9. ROUTING COMPLET

| Route | Page | Acces | Layout |
|-------|------|-------|--------|
| `/` | Landing | Public | Aucun |
| `/restaurants` | Liste restaurants | Public | Aucun |
| `/restaurant/:slug` | Detail + choix table | Public | Aucun |
| `/menu/:restaurantSlug/:tableId` | Menu digital | Public | LayoutClient |
| `/paiement/:commandeId` | Paiement | Public | Aucun |
| `/login` | Connexion | Public | Aucun |
| `/register` | Inscription | Public | Aucun |
| `/resto/dashboard` | Dashboard | Protege | LayoutResto |
| `/resto/commandes` | Commandes | Protege | LayoutResto |
| `/resto/menu` | Gestion menu | Protege | LayoutResto |
| `/resto/tables` | Tables + QR | Protege | LayoutResto |
| `/resto/stats` | Statistiques | Protege | LayoutResto |
| `/resto/parametres` | Parametres | Protege | LayoutResto |
| `/cuisine/access` | Acces cuisine | Public | Aucun |
| `/cuisine/:restaurantSlug` | Ecran cuisine | Public | LayoutCuisine |

---

## 10. MOYENS DE PAIEMENT

| Moyen | Code | Couleur | Telephone requis |
|-------|------|---------|-----------------|
| Fedapay | fedapay | Couleur marque | Oui (selon canal) |

---

## 11. STATUTS DE COMMANDE

| Statut | Code | Couleur | Action suivante |
|--------|------|---------|-----------------|
| Nouvelle | nouvelle | Ambre | Accepter -> en_cours |
| En cours | en_cours | Orange | Marquer prete -> prete |
| Prete | prete | Vert | Marquer servie -> servie |
| Servie | servie | Gris | Aucune |

---

## 12. ETAT ACTUEL ET POINTS RESTANTS

### 12.1 Implemente

- Toutes les pages et composants frontend
- Systeme de routing complet
- Stores auth et panier (Zustand)
- API backend Laravel branchée au frontend (`src/services/api.ts`)
- Authentification par token API (`Authorization: Bearer`)
- Paiement Fedapay (create, callback, webhook)
- Dashboard, cuisine Kanban, QR tables, factures/tickets imprimables
- Design responsive
- Generation de QR codes
- Graphiques statistiques

### 12.2 A renforcer

- Ajouter des tests automatises backend/frontend (coverage)
- Renforcer l'observabilite des paiements (logs, retries webhook, alerting)
- Ajouter du temps reel (WebSocket/SSE) pour cuisine et salle
- Completer la documentation OpenAPI et examples d'integration
- Durcir la validation metier et la gestion d'erreurs produit
