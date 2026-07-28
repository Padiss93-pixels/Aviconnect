# Guide de publication sur les stores — AviConnect

Mis à jour le 28 juillet 2026, après la migration vers Supabase.

> ⚠️ **Ce guide a été entièrement réécrit.** La version précédente décrivait une application
> 100 % locale, sans backend. Ce n'est plus le cas : **toutes les données transitent désormais
> par Supabase**. Répondre « aucune donnée collectée » aux formulaires des stores serait
> aujourd'hui une **fausse déclaration**, sanctionnée par le retrait de l'application.

---

## 1. Héberger les documents légaux (obligatoire avant soumission)

Les stores exigent des **URL publiques** ; les pages in-app ne suffisent pas.

Le domaine **aviconnect.sn** est acheté et actif (hébergement Nindohost, cPanel). La procédure de
mise en ligne complète est dans [`DEPLOIEMENT.md`](../DEPLOIEMENT.md) : elle publie l'application
web **et** les pages légales en une seule opération.

| Fichier | URL une fois déployé |
|---|---|
| `index.html` | `https://aviconnect.sn/legal/` |
| `confidentialite.html` | `https://aviconnect.sn/legal/confidentialite.html` |
| `cgu.html` | `https://aviconnect.sn/legal/cgu.html` |
| `suppression-compte.html` | `https://aviconnect.sn/legal/suppression-compte.html` |
| `mentions-legales.html` | `https://aviconnect.sn/legal/mentions-legales.html` |

> Ces URL doivent rester accessibles en permanence. Un lien mort = rejet ou retrait de l'app.

**À faire aussi :** créer les boîtes `contact@aviconnect.sn` et `support@aviconnect.sn` dans cPanel,
citées dans tous les documents légaux.

---

## 2. Google Play Console

### Fiche « Contenu de l'application »

| Rubrique | Réponse |
|---|---|
| URL de la politique de confidentialité | `https://aviconnect.sn/legal/confidentialite.html` |
| Compte utilisateur requis ? | Oui |
| URL de suppression de compte | `https://aviconnect.sn/legal/suppression-compte.html` |
| Public cible | 18 ans et plus |
| Application d'actualités ? | Non |
| Contient des annonces (SDK publicitaire tiers) ? | **Non** — les bannières sont du contenu interne vendu en direct, sans régie ni SDK |
| Contenu généré par les utilisateurs ? | **Oui** — annonces, besoins, avis, messages |

### Formulaire « Sécurité des données » (Data Safety) — version Supabase

L'application transmet des données vers un serveur : il faut donc déclarer **oui, l'app collecte
des données**. Réponses exactes, alignées sur `supabase/schema.sql` :

| Type de donnée | Collectée | Partagée | Finalité | Obligatoire |
|---|---|---|---|---|
| Nom et prénom | Oui | Non | Fonctionnalité de l'app | Oui |
| Adresse e-mail | Oui | Non | Fonctionnalité, authentification | Oui |
| Numéro de téléphone | Oui | Non | Fonctionnalité (mise en relation acheteur/vendeur) | Oui |
| Photos | Oui | Non | Fonctionnalité (illustration des annonces) | Non |
| Messages in-app | Oui | Non | Fonctionnalité | Non |
| Localisation approximative (région déclarée) | Oui | Non | Fonctionnalité (filtrage par région) | Oui |
| Identifiants push | Oui | Non | Notifications | Non |
| Actions dans l'app (visites, annonces consultées) | Oui | Non | Analyse d'audience | Non |

Questions transversales :

| Question | Réponse |
|---|---|
| Les données sont-elles chiffrées en transit ? | **Oui** (HTTPS/TLS vers Supabase) |
| L'utilisateur peut-il demander la suppression de ses données ? | **Oui** — bouton in-app + page web |
| Les données sont-elles partagées avec des tiers ? | **Non** — Supabase est un sous-traitant, pas un tiers destinataire |
| Collecte de données auprès d'enfants ? | Non (18 ans et plus) |

### Test fermé obligatoire

Pour un **compte développeur personnel** créé après novembre 2023, Google impose un test fermé
avec **12 testeurs inscrits pendant 14 jours consécutifs** avant d'autoriser la production.
C'est le poste le plus long : à lancer en premier, avant même de finaliser la fiche.

### Permissions

`app.json` ne déclare **aucune permission** et bloque explicitement `CAMERA`, `RECORD_AUDIO`,
`READ/WRITE_EXTERNAL_STORAGE`. Le sélecteur de photos système n'exige aucune permission sur
Android 13+. Rien à justifier.

---

## 3. App Store Connect (Apple)

### Informations obligatoires

| Rubrique | Réponse |
|---|---|
| Privacy Policy URL | `https://aviconnect.sn/legal/confidentialite.html` |
| Support URL | `https://aviconnect.sn/legal/` |
| Classification d'âge | 17+ (marketplace avec contenu utilisateur et mise en relation) |
| EULA | L'EULA standard d'Apple suffit ; les CGU hébergées la complètent |

### App Privacy (étiquette de confidentialité)

**Ne pas cocher « Data Not Collected ».** Déclarer, avec l'option « Utilisé pour la
fonctionnalité de l'app » et **sans suivi publicitaire** (pas d'App Tracking Transparency
puisque aucune donnée n'est partagée à des fins publicitaires) :

- Coordonnées : nom, adresse e-mail, numéro de téléphone
- Contenu utilisateur : photos, messages, autres contenus
- Identifiants : identifiant utilisateur
- Données d'utilisation : interactions avec le produit

Pour chaque catégorie : **liée à l'identité de l'utilisateur = Oui**, **utilisée pour le suivi = Non**.

### Règle 5.1.1(v) — Suppression de compte

✅ Implémentée : bouton « Supprimer mon compte » dans l'onglet Profil, qui appelle la fonction
serveur `delete_user()` (suppression en cascade de `auth.users` et de toutes les données liées).

### Règle 1.2 — Contenu généré par les utilisateurs

Apple exige quatre mécanismes. État actuel :

- ✅ CGU interdisant les contenus abusifs (CGU §8)
- ✅ **Signalement de contenu** : bouton « Signaler » sur chaque annonce et chaque profil vendeur
- ✅ **Blocage d'utilisateur** : depuis l'annonce, le profil vendeur ou l'écran « Utilisateurs bloqués » du profil
- ✅ **Modération** : onglet « Signalements » dans le panel admin, avec notification des admins à chaque signalement

Tables et politiques : `supabase/add_moderation.sql` (à exécuter avant la soumission).

> Dans les notes de review, préciser : « Les annonces peuvent être signalées via le lien
> "Signaler cette annonce" en bas de chaque fiche produit, et les utilisateurs bloqués via le
> profil vendeur. Les signalements sont traités sous 24 h dans le panel d'administration. »

### Compte de démonstration pour la review

**Indispensable** : l'inscription exige une confirmation par e-mail que le testeur d'Apple ne
pourra pas valider. Créer un compte dédié, confirmer son e-mail soi-même, et fournir dans
« App Review Information » :

- Identifiant : `demo@aviconnect.sn` (à créer)
- Mot de passe : à définir
- Note : « Compte de démonstration avec des annonces de test. Rôle éleveur. »

---

## 4. Notifications push

L'app enregistre un token Expo (`hooks/usePushNotifications.ts`). En production, les push ne
fonctionneront pas sans identifiants :

- **Android** : créer un projet Firebase, télécharger la clé de compte de service (FCM v1) et
  l'envoyer avec `eas credentials` → Android → push notifications.
- **iOS** : EAS génère la clé APNs automatiquement lors du premier build de production, à
  condition que le compte Apple Developer soit connecté.

---

## 5. Configuration Supabase avant soumission

- **Site URL** : `https://aviconnect.sn`
- **Authentication → URL Configuration → Redirect URLs** : ajouter `aviconnect://reset-password`
  et `https://aviconnect.sn/reset-password`, sinon le lien de réinitialisation de mot de passe ne
  rouvre ni l'app ni le site.
- Exécuter `supabase/add_moderation.sql` (tables `reports` et `user_blocks`).

---

## 6. Assets de la fiche store

| Store | Asset | Spécification | État |
|---|---|---|---|
| Play | Icône | 512 × 512 PNG | à produire |
| Play | Feature graphic | **1024 × 500** — obligatoire | à produire |
| Play | Captures téléphone | min. 2, 4 recommandées, ≥ 1080 px | à produire |
| Play | Description courte | 80 caractères | à rédiger |
| Play | Description longue | 4 000 caractères | à rédiger |
| Apple | Icône | 1024 × 1024 | ✅ `assets/icon.png` |
| Apple | Captures 6,9″ | obligatoires | à produire |
| Apple | Sous-titre, mots-clés, catégorie | — | à rédiger |

---

## 7. Checklist finale

- [ ] Déployer le site sur aviconnect.sn (voir `DEPLOIEMENT.md`) et activer AutoSSL
- [ ] Créer `contact@` et `support@aviconnect.sn` dans cPanel
- [ ] Changer le mot de passe cPanel/FTP fourni par Nindohost
- [ ] Exécuter `supabase/add_moderation.sql`
- [ ] Configurer les Redirect URLs Supabase
- [ ] Renseigner l'URL de confidentialité dans les deux consoles
- [ ] Renseigner l'URL de suppression de compte (Google Play)
- [ ] Remplir Data Safety avec le tableau du §2 (**pas** « aucune donnée collectée »)
- [ ] Remplir App Privacy avec les catégories du §3 (**pas** « Data Not Collected »)
- [ ] Créer et confirmer le compte de démonstration pour Apple
- [ ] Déposer la clé FCM v1 dans EAS credentials
- [ ] Lancer le test fermé Google Play (12 testeurs × 14 jours)
- [ ] Produire les captures d'écran et le feature graphic
- [x] Bouton « Supprimer mon compte » (Apple 5.1.1)
- [x] Signalement de contenu et blocage d'utilisateur (Apple 1.2)
- [ ] Compte Google Play (25 $ une fois) et Apple Developer (99 $/an)
