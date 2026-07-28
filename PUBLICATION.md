# Publication sur les stores — marche à suivre

Runbook chronologique. Les données de référence (réponses aux formulaires, textes de la fiche)
sont dans [`legal/GUIDE-STORES.md`](legal/GUIDE-STORES.md) et [`legal/FICHE-STORES.md`](legal/FICHE-STORES.md).

**Ordre conseillé :** commencer Google Play immédiatement à cause des 14 jours de test fermé
obligatoires, et mener Apple en parallèle.

---

## Étape 0 — Préalables communs

| | Fait | Étape |
|---|---|---|
| 0.1 | ✅ | Site en ligne sur `https://aviconnect.sn` avec les pages légales |
| 0.2 | ✅ | Tables de modération créées dans Supabase |
| 0.3 | ⬜ | Compte de démonstration : s'inscrire sur le site avec `demo@aviconnect.sn`, rôle **Éleveur**, puis exécuter [`supabase/create_demo_account.sql`](supabase/create_demo_account.sql) |
| 0.4 | ⬜ | Captures d'écran de l'app (4 minimum) et feature graphic 1024 × 500 |
| 0.5 | ⬜ | Installer l'outil de build : `npm install -g eas-cli` puis `npx eas login` |

Pour les captures, le plus simple est d'ouvrir `https://aviconnect.sn` dans un navigateur en mode
mobile (F12 → icône téléphone → format iPhone) et de capturer l'accueil, le marché, une fiche
annonce et le profil.

---

## PARTIE A — Google Play

### A1. Créer le compte développeur

Va sur `play.google.com/console`, paie les **25 $** (une seule fois, à vie) et choisis un compte
**personnel**. Google vérifie ton identité avec une pièce officielle : compte 1 à 3 jours, parfois
plus. Rien ne peut avancer tant que ce n'est pas validé.

### A2. Créer l'application

Console → **Créer une application**.

| Champ | Valeur |
|---|---|
| Nom | `AviConnect` |
| Langue par défaut | Français |
| Type | Application |
| Gratuite ou payante | Gratuite |

### A3. Remplir « Contenu de l'application »

Menu **Règles et programmes → Contenu de l'application**. Chaque section doit passer au vert.

| Section | Réponse |
|---|---|
| Politique de confidentialité | `https://aviconnect.sn/legal/confidentialite` |
| Accès à l'application | Identifiants de `demo@aviconnect.sn` |
| Annonces | Non, l'app ne contient pas d'annonces tierces |
| Contenu soumis à restrictions d'âge | 18 ans et plus |
| Application d'actualités | Non |
| Suppression de compte | `https://aviconnect.sn/legal/suppression-compte` |
| Sécurité des données | Voir le tableau détaillé du §2 de `legal/GUIDE-STORES.md` |
| Questionnaire IARC | Réseau social **oui**, contenu utilisateur **oui**, partage de position **non**, achats **non** |

> ⚠️ Sur « Sécurité des données », ne réponds **pas** « aucune donnée collectée ». L'app envoie
> nom, e-mail, téléphone, photos et messages vers Supabase. Recopie le tableau du guide.

### A4. Remplir la fiche du store

Menu **Développer la présence → Fiche Play Store principale**. Les textes sont dans
[`legal/FICHE-STORES.md`](legal/FICHE-STORES.md) : nom, description courte (80 caractères),
description longue. Ajoute l'icône 512 × 512, le **feature graphic 1024 × 500** (obligatoire, c'est
celui qu'on oublie) et au moins 4 captures téléphone.

### A5. Créer la clé de service pour la soumission automatique

Cette clé permet à `eas submit` d'envoyer les builds sans passer par l'interface.

1. Play Console → **Configuration → Accès à l'API** → associer un projet Google Cloud.
2. Dans Google Cloud → **IAM → Comptes de service** → créer un compte de service.
3. Créer une clé au format **JSON** et la télécharger.
4. Enregistrer le fichier dans le projet sous `credentials/google-play-service-account.json`
   (le dossier est déjà exclu de git).
5. Retour dans Play Console → **Utilisateurs et autorisations** → inviter ce compte de service
   avec le droit « Administrateur des versions ».

### A6. Construire l'application

```bash
cd "C:/Users/padis/Downloads/AviConnect" && npx eas build --platform android --profile production
```

Le build tourne sur les serveurs d'Expo, compte 15 à 30 minutes. Il produit un fichier `.aab`.
Avant celui-ci, tu peux produire un `.apk` installable sur ton téléphone pour vérifier que tout
fonctionne en conditions réelles :

```bash
cd "C:/Users/padis/Downloads/AviConnect" && npx eas build --platform android --profile preview
```

### A7. Envoyer sur la piste de test fermé

```bash
cd "C:/Users/padis/Downloads/AviConnect" && npx eas submit --platform android
```

Puis dans Play Console → **Tests → Test fermé** → créer une version, y attacher le build.

### A8. Les 14 jours de test fermé

Google exige, pour les comptes personnels créés après novembre 2023, **12 testeurs inscrits et
actifs pendant 14 jours consécutifs**. Crée une liste de diffusion avec 12 adresses e-mail
(éleveurs, proches, collègues), envoie-leur le lien d'inscription au test, et vérifie qu'ils
installent bien l'app. Le compteur ne démarre qu'une fois les 12 inscrits.

C'est le chemin critique de tout le projet : lance cette étape dès que le compte est validé, même
si la fiche n'est pas terminée.

### A9. Demander l'accès à la production

Au bout des 14 jours, Play Console affiche un bouton **Demander l'accès à la production**. Google
examine la demande sous quelques jours. Une fois accordé : **Production → Créer une version**,
attacher le build, publier. La revue finale prend de quelques heures à 7 jours.

---

## PARTIE B — Apple App Store

### B1. Créer le compte développeur

`developer.apple.com/programs` → adhésion **99 $ par an**. En tant que personne physique, l'identité
est vérifiée sous 24 à 48 heures. Un Mac n'est pas nécessaire : EAS compile dans le cloud.

### B2. Créer l'application dans App Store Connect

`appstoreconnect.apple.com` → **Mes apps → +** → Nouvelle app.

| Champ | Valeur |
|---|---|
| Plateforme | iOS |
| Nom | `AviConnect` |
| Langue principale | Français |
| Identifiant de bundle | `sn.aviconnect.app` |
| SKU | `aviconnect-001` |

### B3. Identifiants de l'app

| | Valeur |
|---|---|
| Bundle identifier | `sn.aviconnect.app` |
| Identifiant Apple de l'app (`ascAppId`) | `6795640729` |
| Apple Team ID | `PJLF66C88B` |
| UGS / SKU | `aviconnect-001` |

Ces valeurs sont déjà renseignées dans [`eas.json`](eas.json), rien à saisir à la main.

> Ne pas confondre l'**identifiant Apple de l'app** (`6795640729`, un numéro interne) avec
> l'**Apple ID du compte** (une adresse e-mail), que le terminal réclame au moment de la connexion.
> Apple emploie le même mot pour les deux.

### B3 bis. Compléter la page « Informations sur l'app »

| Champ | Valeur |
|---|---|
| Nom | `AviConnect` (avec un C majuscule) |
| Sous-titre | `Marché avicole du Sénégal` |
| Catégorie principale | Shopping |
| Catégorie secondaire | Économie et entreprise |
| Contrat de licence | EULA standard d'Apple — ne rien changer |
| Documents sur le chiffrement | Rien à charger : `ITSAppUsesNonExemptEncryption: false` est déjà déclaré dans `app.json` |

**Classifications par âge** — répondre *oui* à : contenu généré par les utilisateurs, réseaux
sociaux, messagerie et chat. Répondre *non* à tout le reste, en particulier accès au Web sans
restrictions, publicité, jeux de hasard, thèmes matures et violence. Le résultat attendu est 17+/18+.

**Législation sur les services numériques (DSA)** — obligatoire uniquement si l'app est distribuée
dans l'Union européenne. Si la diffusion se limite au Sénégal et à l'Afrique de l'Ouest, cette
section peut rester vide ; sinon il faut déclarer les coordonnées de l'éditeur dans la section
Business.

### B4. Construire l'application

```bash
cd "C:/Users/padis/Downloads/AviConnect" && npx eas build --platform ios --profile production
```

EAS demandera tes identifiants Apple et générera seul les certificats et la clé APNs pour les
notifications. Compte 20 à 40 minutes.

### B5. Envoyer sur TestFlight

```bash
cd "C:/Users/padis/Downloads/AviConnect" && npx eas submit --platform ios
```

Le build apparaît dans TestFlight après 10 à 30 minutes de traitement. Installe-le sur un iPhone
pour vérifier avant de soumettre.

### B6. Remplir la fiche App Store

Textes dans [`legal/FICHE-STORES.md`](legal/FICHE-STORES.md) : nom, sous-titre (30 caractères),
description, mots-clés (100 caractères). Ajoute les captures d'écran au format **6,9 pouces**
(obligatoire) et renseigne :

| Champ | Valeur |
|---|---|
| Privacy Policy URL | `https://aviconnect.sn/legal/confidentialite` |
| Support URL | `https://aviconnect.sn/legal` |
| Catégorie | Shopping (secondaire : Business) |
| Classification | 17+ |

### B7. Remplir l'étiquette App Privacy

Section **Confidentialité de l'app**. Ne coche **pas** « Data Not Collected ». Déclare coordonnées,
contenu utilisateur, identifiants et données d'utilisation, chacun avec « lié à l'utilisateur =
oui » et « utilisé pour le suivi = non ». Détail au §3 de `legal/GUIDE-STORES.md`.

### B8. Renseigner les informations de review

Section **Informations pour la vérification de l'app** : identifiants de `demo@aviconnect.sn`, et
dans le champ Notes, le texte prêt à coller au chapitre « Notes pour la review Apple » de
[`legal/FICHE-STORES.md`](legal/FICHE-STORES.md). Il explique où trouver le signalement de contenu,
le blocage d'utilisateur et la suppression de compte — les trois points sur lesquels Apple rejette
les marketplaces.

### B9. Soumettre

Bouton **Ajouter à la vérification** puis **Soumettre**. La revue Apple prend 24 à 48 heures en
général. En cas de rejet, la réponse arrive dans App Store Connect avec le motif précis : corrige,
reconstruis, resoumets — c'est courant et sans conséquence sur la suite.

---

## Calendrier réaliste

| Semaine | Google Play | Apple |
|---|---|---|
| 1 | Compte validé, app créée, test fermé lancé | Compte validé, app créée, build sur TestFlight |
| 2 | Test fermé en cours, fiche complétée | Fiche complétée, soumission, revue |
| 3 | Fin des 14 jours, demande d'accès production | En ligne |
| 4 | Publication | — |

Le seul délai incompressible est celui des 14 jours de test fermé côté Google.
