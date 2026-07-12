# Guide de publication sur les stores — AviConnect

Ce guide liste tout ce qui est exigé par Google Play et l'App Store côté légal/confidentialité, avec les réponses exactes à donner dans les formulaires, basées sur le fonctionnement réel de l'app (stockage 100 % local, pas de backend, pas de tracking).

---

## 1. Héberger les documents légaux (OBLIGATOIRE avant soumission)

Les stores exigent des **URL publiques** — les pages in-app ne suffisent pas. Le dossier `legal/` contient 4 pages HTML autonomes prêtes à héberger :

| Fichier | URL cible recommandée |
|---|---|
| `index.html` | `https://aviconnect.sn/legal/` |
| `confidentialite.html` | `https://aviconnect.sn/legal/confidentialite.html` |
| `cgu.html` | `https://aviconnect.sn/legal/cgu.html` |
| `suppression-compte.html` | `https://aviconnect.sn/legal/suppression-compte.html` |
| `mentions-legales.html` | `https://aviconnect.sn/legal/mentions-legales.html` |

**Options d'hébergement gratuit** si le domaine aviconnect.sn n'est pas encore actif :
- **Netlify Drop** (drag & drop du dossier `legal/`, 2 minutes) → `https://aviconnect-legal.netlify.app/...`
- **GitHub Pages** (repo public `aviconnect-legal`)
- **Vercel**

> ⚠️ L'URL doit rester stable et accessible en permanence. Un lien mort = rejet ou retrait de l'app.

---

## 2. Google Play Console

### Fiche « Contenu de l'application » (App content)

| Rubrique | Réponse |
|---|---|
| **URL de la politique de confidentialité** | `https://.../confidentialite.html` (obligatoire) |
| **Compte requis ?** | Oui → l'URL de suppression de compte est obligatoire |
| **URL de suppression de compte** | `https://.../suppression-compte.html` |
| **Public cible** | 18 ans et plus |
| **Application d'actualités ?** | Non |
| **Appli COVID-19 ?** | Non |
| **Annonces (ads) ?** | Non (pas de SDK publicitaire — les « pubs » du carousel sont du contenu interne) |

### Formulaire « Sécurité des données » (Data Safety)

L'app n'a **pas de backend** : les données restent sur l'appareil (AsyncStorage). Au sens de Google, « collecter » = transmettre hors de l'appareil. Réponses :

| Question | Réponse |
|---|---|
| Votre appli collecte-t-elle ou partage-t-elle des données utilisateur ? | **Non** (aucune donnée ne quitte l'appareil) |
| Les données sont-elles chiffrées en transit ? | Sans objet (rien n'est transmis) |
| Les utilisateurs peuvent-ils demander la suppression ? | Oui — via `suppression-compte.html` |

> ⚠️ **Le jour où vous ajoutez un backend** (Supabase, Firebase, API...), ce formulaire devra être refait : déclarer Identité (nom, téléphone, e-mail), Messages, Photos, avec finalité « Fonctionnalité de l'appli », chiffrement en transit = Oui.

### Permissions déclarées dans app.json
`CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` — justification à donner si demandé : « Prise et sélection de photos pour illustrer les annonces avicoles ».

---

## 3. App Store Connect (Apple)

### Informations obligatoires

| Rubrique | Réponse |
|---|---|
| **Privacy Policy URL** | `https://.../confidentialite.html` |
| **Support URL** | `https://aviconnect.sn` ou page d'aide, sinon `https://.../index.html` |
| **Classification d'âge** | 17+ recommandé (marketplace non modérée en temps réel, contact entre utilisateurs) — 4+ refusé car génère du contenu utilisateur |
| **EULA** | L'EULA standard d'Apple suffit ; les CGU hébergées la complètent |

### App Privacy (étiquette de confidentialité)

Avec le stockage 100 % local : sélectionner **« Data Not Collected »** (aucune donnée collectée). C'est exact tant qu'aucune donnée ne quitte l'appareil et qu'aucun SDK tiers de tracking n'est intégré.

### Règle 5.1.1(v) — Suppression de compte
Apple **exige depuis 2022 que la suppression de compte soit possible DANS l'app** (pas seulement par e-mail). À prévoir avant soumission iOS : un bouton « Supprimer mon compte » dans le profil qui efface `@aviconnect_user`, l'entrée du registre `@aviconnect_users_registry` et le mot de passe associé. La page web reste utile pour Google Play et pour les demandes hors app.

### Comptes de démo pour la review Apple
Fournir dans « App Review Information » : numéro `770000000` + OTP `12345` (n'importe quel numéro 9+ chiffres / OTP 5 chiffres fonctionne — le préciser dans les notes de review).

---

## 4. Contenu utilisateur (exigence commune aux deux stores)

Les apps avec contenu généré par les utilisateurs (annonces, chat) doivent avoir :
- ✅ Des CGU interdisant les contenus abusifs (fait — CGU §8)
- ✅ Un mécanisme de modération (fait — panel admin)
- ⚠️ **Un moyen de signaler un contenu ou bloquer un utilisateur dans l'app** — à vérifier/ajouter avant soumission iOS (Apple 1.2)

---

## 5. Checklist finale avant soumission

- [ ] Héberger le dossier `legal/` et noter les URL définitives
- [ ] Renseigner l'URL de confidentialité dans Google Play Console ET App Store Connect
- [ ] Renseigner l'URL de suppression de compte dans Google Play Console
- [ ] Remplir Data Safety (Google) : « aucune donnée collectée »
- [ ] Remplir App Privacy (Apple) : « Data Not Collected »
- [ ] Ajouter le bouton « Supprimer mon compte » dans l'app (exigence Apple)
- [ ] Vérifier la présence d'un bouton « Signaler » sur les annonces (exigence Apple UGC)
- [ ] Créer les adresses e-mail contact@/support@aviconnect.sn (elles figurent dans tous les documents)
- [ ] Compte développeur Google Play (25 $ une fois) et Apple Developer (99 $/an)
