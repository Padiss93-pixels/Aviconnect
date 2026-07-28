# Sécurité — AviConnect

Mis à jour le 28 juillet 2026, après la migration complète vers Supabase.

> La version précédente de ce document décrivait l'architecture 100 % locale (hachage des mots de
> passe dans l'app, OTP affiché en mode démo, registre d'utilisateurs en AsyncStorage). Cette
> architecture n'existe plus : **l'authentification et toutes les données sont sur Supabase**.

## Architecture de sécurité

Le modèle est simple : le client n'est pas de confiance, **toute la sécurité est côté serveur**,
appliquée par les politiques Row Level Security de PostgreSQL.

- La clé `anon` embarquée dans l'app est **publique par conception**. Elle ne donne accès à rien
  d'autre que ce que les politiques RLS autorisent pour l'utilisateur connecté.
- La clé `service_role` n'est **jamais** dans l'app, ni dans le dépôt, ni dans `eas.json`.
- Les mots de passe ne transitent ni ne sont stockés par le code applicatif : Supabase Auth les
  hache (bcrypt) et gère les sessions. Le client ne manipule qu'un JWT à durée limitée.

## Protections côté serveur (`supabase/schema.sql`)

- **Impossible de s'inscrire administrateur** : le trigger `handle_new_user` force le rôle demandé
  dans la liste autorisée (`eleveur`, `acheteur`, `couvoir`, `veterinaire`).
- **Impossible de s'auto-certifier ou de se débloquer** : le trigger `protect_profile_columns`
  restaure les colonnes `role`, `blocked`, `verified`, `couvoir_status`, `vet_status` pour tout
  utilisateur non admin.
- **Un couvoir non certifié ne peut pas publier** : condition inscrite dans la politique d'insertion
  des annonces.
- **Un utilisateur bloqué ne peut plus rien publier** : condition présente dans toutes les
  politiques d'insertion.
- **Les commandes ne sont visibles que par l'acheteur, le vendeur et l'admin.**
- **Les notifications sont strictement privées** par utilisateur.
- **Le stockage des photos** est cloisonné : chaque utilisateur n'écrit que dans son dossier `<uid>/`.
- **Suppression de compte** : `delete_user()` supprime `auth.users`, ce qui cascade sur le profil et
  toutes les données liées (exigence Apple 5.1.1).

## Modération (`supabase/add_moderation.sql`)

- **Signalement** : table `reports`, un signalement par utilisateur et par contenu (index unique),
  insertion réservée à l'auteur du signalement, lecture et traitement réservés aux admins.
  Chaque signalement notifie automatiquement tous les administrateurs.
- **Blocage entre utilisateurs** : table `user_blocks`, chacun ne gère que sa propre liste. Les
  annonces et besoins des comptes bloqués sont filtrés côté client dans `AnnoncesContext` et
  `BesoinContext`.
- Ces deux mécanismes sont exigés par la règle Apple 1.2 sur le contenu généré par les utilisateurs.

## Configuration des stores (`app.json`)

- **Android** : `allowBackup: false`, `usesCleartextTraffic: false`, aucune permission déclarée,
  blocage explicite de `CAMERA`, `RECORD_AUDIO`, `READ/WRITE_EXTERNAL_STORAGE`.
- **iOS** : texte de permission photos en français via le plugin `expo-image-picker` (caméra et
  micro désactivés), `ITSAppUsesNonExemptEncryption: false`.

## Limites connues

1. **Le jeton de session est stocké dans AsyncStorage** sur mobile, pas dans le coffre système.
   Il est protégé par le sandbox applicatif et `allowBackup: false`, mais un appareil rooté ou
   jailbreaké permettrait de le lire. Le passage à `expo-secure-store` comme adaptateur de stockage
   du client Supabase est le durcissement suivant (la dépendance est déjà installée).
2. **Pas de vérification du numéro de téléphone.** L'e-mail est confirmé, le téléphone est déclaratif.
   Un vendeur peut donc saisir un numéro qui n'est pas le sien. Un fournisseur SMS (Orange SMS API,
   Twilio) reste à brancher.
3. **Le filtrage des utilisateurs bloqués est côté client.** Un utilisateur bloqué ne peut pas
   contacter son bloqueur via l'interface, mais les données restent lisibles par l'API pour tout
   compte authentifié. Un filtrage côté serveur (politique RLS croisée avec `user_blocks`) serait
   plus robuste.
4. **Les paiements se font hors application** (Wave, Orange Money, espèces) : aucune donnée bancaire
   n'est saisie ni stockée. C'est un choix assumé, qui évite tout enjeu PCI-DSS.

## Dépendances

`npm audit` remonte 17 vulnérabilités (15 modérées, 2 élevées), toutes dans l'outillage de build
Expo — rien n'est embarqué dans le binaire livré. Le correctif impose une montée de version majeure
du SDK, à traiter lors du prochain cycle.

## Checklist avant soumission

- [x] Aucun secret ni backdoor codé en dur
- [x] Mots de passe gérés par Supabase Auth (jamais par le code applicatif)
- [x] Rôles, certifications et blocages verrouillés côté serveur par trigger
- [x] Permissions minimales déclarées, textes de permission iOS présents
- [x] `ITSAppUsesNonExemptEncryption` déclaré, backup Android désactivé
- [x] Pages légales conformes au droit sénégalais (loi n°2008-12, CDP)
- [x] Suppression de compte disponible dans l'app (Apple 5.1.1)
- [x] Signalement de contenu et blocage d'utilisateur (Apple 1.2)
- [ ] `supabase/add_moderation.sql` exécuté en production
- [ ] Redirect URLs configurées dans le dashboard Supabase
- [ ] Vérification du numéro de téléphone par SMS
