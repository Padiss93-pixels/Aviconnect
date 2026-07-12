# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**AviConnect** — marketplace avicole sénégalaise (React Native + Expo SDK 54, TypeScript). Connecte éleveurs, acheteurs, couvoirs et vétérinaires dans les 14 régions du Sénégal. Pas de backend — toutes les données sont persistées localement via AsyncStorage (mobile) ou localStorage (web).

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

**Compte de démo :**
- N'importe quel numéro à 9+ chiffres + n'importe quel code OTP à 5 chiffres
- Admin : numéro `000000000` + n'importe quel code OTP

## Architecture

### Persistance (pas de backend)

Tout est dans `hooks/useAuth.ts` via une fonction `storage()` qui bascule automatiquement entre `localStorage` (web) et `AsyncStorage` (mobile). Ce pattern est répété dans chaque contexte.

Clés de stockage importantes :
- `@aviconnect_user` — utilisateur connecté
- `@aviconnect_users_registry` — registre global de tous les comptes
- `@aviconnect_passwords` — map `{ [userId]: password }`
- `@aviconnect_notifs_admin` — clé fixe pour les notifications admin (indépendante du compte)
- `@aviconnect_notifs_${userId}` — notifications par utilisateur
- `@aviconnect_vet_profiles` — profils et catalogues vétérinaires

### Contextes (providers imbriqués dans `app/_layout.tsx`)

```
AuthProvider → AnnoncesProvider → OrdersProvider → PubProvider
→ BesoinProvider → ActualitesProvider → VetProvider → DrawerProvider
```

| Contexte | Fichier | Rôle |
|---|---|---|
| `AuthContext` | `hooks/AuthContext.tsx` | Auth, block/unblock/delete user, statuts certification |
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
- `app/admin/` — panel admin (eleveur, couvoirs, vétérinaires, pubs, actualités, modération, utilisateurs)
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

À l'inscription d'un couvoir/vétérinaire, la notif est stockée dans deux clés :
1. `@aviconnect_notifs_admin` (clé fixe, fonctionne même sans compte admin créé)
2. `@aviconnect_notifs_${adminId}` (si un admin existe déjà)

Au login admin, `AnnoncesContext` fusionne les deux sources et vide la clé fixe.

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
