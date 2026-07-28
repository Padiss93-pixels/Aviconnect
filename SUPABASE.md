# Supabase — Guide de mise en place

Projet : `https://ctnmflsyueqtwvhcksqz.supabase.co`

## 1. Récupérer la clé anon

Dashboard Supabase → **Settings → API Keys** → copier la clé **anon public**, puis la coller dans [.env](.env) :

```
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> La clé anon est **publique par conception** (elle sera embarquée dans l'app). La vraie sécurité vient des politiques RLS du schéma. Ne jamais mettre la clé `service_role` dans l'app.

## 2. Exécuter le schéma

Dashboard → **SQL Editor** → New query → coller tout le contenu de [supabase/schema.sql](supabase/schema.sql) → **Run**.

Le script est idempotent (rejouable sans danger). Il crée :

| Élément | Rôle |
|---|---|
| `profiles` | Profil 1:1 avec `auth.users`, créé automatiquement à l'inscription |
| `annonces`, `besoins`, `orders` | Marketplace (RLS : lecture authentifiée, écriture propriétaire) |
| `vet_catalogue` | Catalogue vétérinaire |
| `actualites`, `pubs` | Contenu admin uniquement |
| `notifications` | Privées par utilisateur ; les admins sont notifiés des inscriptions couvoir/vétérinaire |
| Bucket `photos` | Lecture publique, écriture dans son propre dossier `<uid>/` |
| `delete_user()` | Suppression de compte par l'utilisateur (règle Apple 5.1.1) |

Garanties de sécurité côté serveur :
- **Impossible de s'inscrire admin** : le trigger force le rôle dans la liste autorisée.
- **Impossible de s'auto-certifier / débloquer** : les colonnes `role`, `blocked`, `verified`, `couvoir_status`, `vet_status` sont verrouillées pour les non-admins par trigger.
- Un couvoir non certifié ne peut pas publier d'annonces (politique RLS).
- Un utilisateur bloqué ne peut plus rien publier.

## 3. Créer le compte admin

L'admin ne peut PAS être créé depuis l'app (c'est voulu). S'inscrire normalement dans l'app avec ton email, puis dans le SQL Editor :

```sql
update public.profiles set role = 'admin', verified = true
where email = 'ton-email@exemple.sn';
```

## 4. Réglages d'authentification recommandés

Dashboard → **Authentication → Sign In / Up → Email** :
- ✅ Confirm email (activé)
- Minimum password length : **8**

Dashboard → **Authentication → Attack Protection** :
- ✅ Enable leaked password protection (si disponible sur ton plan)

## 5. OTP SMS (plus tard)

L'auth téléphone Supabase nécessite un fournisseur SMS payant (Twilio, Vonage…).
Pour le Sénégal, l'option la plus simple à terme : Twilio Verify. En attendant, l'app utilise email + mot de passe via Supabase Auth.
