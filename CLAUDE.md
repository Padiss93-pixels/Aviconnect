# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**AviConnect** — marketplace avicole sénégalaise (React Native + Expo SDK 54, TypeScript). Connecte éleveurs, acheteurs, couvoirs et vétérinaires dans les 14 régions du Sénégal.

**Backend : Supabase** (`https://ctnmflsyueqtwvhcksqz.supabase.co`, clé anon dans `.env` et dans `eas.json` pour les builds, guide dans `SUPABASE.md`). La migration est **terminée** : tous les contextes de `hooks/` lisent et écrivent dans Supabase (auth, profils, annonces, besoins, commandes, catalogues vétérinaires, pubs, actualités, boosts, favoris, notifications). Seul `RewardsContext` conserve un cache local en complément.

## Commandes

```bash
npx expo start          # Démarrer (QR code → Expo Go)
npx expo start --web    # Web uniquement (localhost:8081)
npx expo start --android
npx expo start --ios

eas build --platform android --profile preview   # APK preview
eas build --platform ios --profile production    # TestFlight
eas submit --platform android                    # Google Play
eas submit --platform ios                        # App Store
```

**Authentification (Supabase Auth, juillet 2026) :**
- Email + mot de passe via Supabase (`signIn`/`signUp` dans `AuthContext`). Confirmation d'email exigée à l'inscription. L'écran OTP téléphone a été supprimé (pas de fournisseur SMS pour l'instant).
- Mot de passe oublié : `resetPasswordForEmail` → lien email → écran `app/reset-password.tsx`.
- Admin : impossible depuis l'app — promotion via SQL uniquement (`update profiles set role='admin' where email='...'`). Les colonnes `role/blocked/verified/statuts` sont verrouillées côté serveur par trigger.
- Le rôle demandé à l'inscription passe par les métadonnées ; le trigger `handle_new_user` crée la ligne `profiles` (statut `pending` pour couvoir/vétérinaire) et `notify_admins_on_signup` notifie les admins en base.
- Voir `SECURITY.md` et `SUPABASE.md`.

## Architecture

### Persistance (Supabase)

Chaque contexte de `hooks/` interroge directement `lib/supabase.ts`. Le schéma de référence est
`supabase/schema.sql`, complété par les migrations `add_*.sql` et `migrate_to_supabase.sql` du même
dossier.

> ⚠️ Le fichier `schema.sql` a divergé de la base réellement déployée sur plusieurs tables
> (`annonces` notamment : les colonnes en production sont `eleveur`, `eleveur_id`, `produit`, `qte`,
> `dispo`, `photos`… et l'`id` est un entier, pas un uuid). En cas de doute, se fier aux requêtes des
> contextes et aux fichiers de migration, pas à `schema.sql`.

La sécurité repose entièrement sur les politiques RLS : voir `SECURITY.md`.

### Contextes (providers imbriqués dans `app/_layout.tsx`)

```
AuthProvider → ModerationProvider → AnnoncesProvider → OrdersProvider → PubProvider
→ BesoinProvider → ActualitesProvider → VetProvider → RewardsProvider
→ BoostProvider → FavoritesProvider → DrawerProvider
```

`ModerationProvider` doit rester **au-dessus** d'`AnnoncesProvider` et de `BesoinProvider` : ces
deux contextes l'utilisent pour masquer les contenus des utilisateurs bloqués.

| Contexte | Fichier | Rôle |
|---|---|---|
| `AuthContext` | `hooks/AuthContext.tsx` | Auth, block/unblock/delete user, statuts certification |
| `ModerationContext` | `hooks/ModerationContext.tsx` | Signalement de contenu et blocage entre utilisateurs (Apple 1.2) |
| `AnnoncesContext` | `hooks/AnnoncesContext.tsx` | Annonces + notifications (fusion clé admin fixe au login) |
| `VetContext` | `hooks/VetContext.tsx` | Profils et catalogues vétérinaires |
| `DrawerContext` | `hooks/DrawerContext.tsx` | Ouverture/fermeture du menu burger (overlay global) |
| `PubContext` | `hooks/PubContext.tsx` | Bannières publicitaires carousel |
| `BesoinContext` | `hooks/BesoinContext.tsx` | Demandes d'achat des acheteurs |
| `ActualitesContext` | `hooks/ActualitesContext.tsx` | Articles actualités |

### Rôles utilisateurs

```typescript
role: 'eleveur' | 'acheteur' | 'couvoir' | 'admin' | 'veterinaire'
```

- **eleveur** : publie toutes catégories d'annonces
- **acheteur** : publie uniquement des besoins (pas d'annonces de vente)
- **couvoir** : publie poussins/aliments, doit être certifié par l'admin (`couvoirStatus`)
- **veterinaire** : pas d'annonces, gère son catalogue via `/mon-catalogue` (`vetStatus`), visible dans `/veterinaires` seulement si `certified`
- **admin** : accès complet à `/admin/*`

Le bouton central de la tab bar affiche `+` (publier) pour eleveur/couvoir, `📖 Catalogue` pour vétérinaire.

### Navigation (Expo Router file-based)

- `app/(auth)/` — login, OTP, register (non authentifié)
- `app/(tabs)/` — onglets principaux (authentifié)
- `app/admin/` — panel admin (couvoirs, vétérinaires, pubs, actualités, modération, boosts, utilisateurs, analytics, `annonceurs` = kit média)
- `app/mes-blocages/` — liste des utilisateurs bloqués, avec déblocage
- `app/veterinaires/` — liste publique des vétérinaires certifiés
- `app/veterinaire/[id].tsx` — profil public vétérinaire + catalogue
- `app/mon-catalogue/` — gestion catalogue par le vétérinaire lui-même
- Pages légales : `confidentialite/`, `conditions/`, `mentions-legales/`, `dpa/`, `mes-droits/`, `cookies/`

Toutes les nouvelles routes doivent être déclarées dans `app/_layout.tsx`.

### Retour arrière (important)

Sur le web, `router.back()` plante si aucun historique. Toujours utiliser :
```typescript
router.canGoBack() ? router.back() : router.replace('/(tabs)')
```

### DrawerMenu

Le `DrawerMenu` est un overlay global rendu dans `app/_layout.tsx` au-dessus du Stack. Il s'ouvre via `DrawerContext`. Les liens légaux ont été retirés du drawer et placés dans `components/LegalFooter.tsx` en bas de la page d'accueil.

### Notifications admin

Les notifications admin sont générées **côté serveur**, par trigger PostgreSQL, et insérées dans la
table `notifications` pour chaque compte ayant le rôle `admin` :

- inscription d'un couvoir ou d'un vétérinaire → `notify_admins_on_signup` (`schema.sql`)
- nouveau signalement de contenu → `notify_admins_on_report` (`add_moderation.sql`)

Conséquence : un admin créé **après** l'événement ne recevra pas les notifications passées.

### Notifications push (répartition client / serveur)

Deux émetteurs distincts, à ne pas faire se recouvrir sous peine de double notification :

| Origine | Types | Qui envoie le push |
|---|---|---|
| App (`sendNotification`) | `nouvelle_commande`, `commande_acceptee`, `commande_refusee` | Le client, directement vers l'API Expo |
| Trigger PostgreSQL | `signalement`, `couvoir_inscription`, `vet_inscription`, autres | Edge Function `notify-push`, via Database Webhook sur INSERT dans `notifications` |

Les notifications de commande partent du client parce qu'elles seules connaissent `otherUserId`
(deep-link vers la conversation) — la table `notifications` ne stocke pas cet identifiant. La liste
`SKIP_TYPES` de `supabase/functions/notify-push/index.ts` doit rester le miroir exact de la colonne
« App » ci-dessus.

La destination du tap vient de `constants/notifRoutes.ts`, partagée par la liste in-app, la bannière
web et le listener mobile. `notify-push` en garde une copie (runtime Deno séparé) : toute route
ajoutée doit être reportée dans les deux.

Déploiement : `supabase functions deploy notify-push`, puis le webhook décrit dans
`supabase/setup_push_webhook.sql`.

### Header pattern

Toutes les pages utilisent un header custom (pas le header Expo Router). Pattern standard :
```typescript
paddingTop: Platform.OS === 'ios' ? 56 : 42,
```

### Encodage (historique)

Les fichiers `.tsx` ont subi une corruption d'encodage double (UTF-8 bytes lus comme Windows-1252 puis ré-encodés). Tous ont été restaurés. **Ne jamais utiliser PowerShell `Set-Content` ou `Get-Content` sans `-Encoding utf8` explicite** sur ces fichiers — préférer Node.js ou les outils Read/Write de Claude Code.

## Droit applicable (pages légales)

Pages conformes au droit sénégalais :
- Loi n°2008-12 (protection des données personnelles) — CDP
- Loi n°2008-08 (transactions électroniques)
- Loi n°2008-11 (cybercriminalité)
