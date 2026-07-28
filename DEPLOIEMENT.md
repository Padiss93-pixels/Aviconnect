# Déploiement web — aviconnect.sn

Deux hébergements sont disponibles : **Vercel** (recommandé) et **Nindohost/cPanel** (déjà payé,
utile en secours). Le domaine `aviconnect.sn` est acheté chez Nindohost, propagé, HTTPS actif.

> ⚠️ **Change le mot de passe cPanel / FTP.** Celui envoyé par Nindohost a circulé en clair par
> e-mail et dans une conversation. cPanel → *Mot de passe et sécurité*. Le mot de passe FTP est le
> même : le changer met les deux à jour.

---

## 1. Construire le site

```bash
npm run build:web
```

Une seule commande produit tout : export Expo, copie des pages légales dans `dist/legal/`, copie de
`.htaccess`, `robots.txt` et `sitemap.xml`, insertion du titre et de la description dans les 57
pages, et vérification que les clés Supabase sont bien présentes dans le bundle. Le script échoue
volontairement si elles manquent, plutôt que de publier un site à l'authentification morte.

Pour inspecter le résultat avant publication :

```bash
node scripts/serve-dist.js
```

---

## 2. Vercel — recommandé

### Pourquoi

Chaque `git push` redéploie automatiquement, le HTTPS et le CDN sont inclus, et il n'y a plus de
téléversement manuel. Les e-mails `@aviconnect.sn` restent chez Nindohost : seul le site bouge.

### 2.1 Publier le code sur GitHub

Le dépôt `Padiss93-pixels/Aviconnect` ne contient **qu'un README** : c'est pour cela que Vercel n'a
rien trouvé à construire et a échoué avec `vite: command not found`. Il faut y pousser le projet.

> Le dépôt est **public**. Y pousser le code rend l'intégralité du projet visible par tout le monde.
> Les secrets sont protégés (`.env`, `credentials/` sont exclus par `.gitignore`, et la clé Supabase
> `anon` présente dans `eas.json` et `vercel.json` est publique par conception), mais si tu ne
> souhaites pas exposer le code, passe le dépôt en **privé** avant de pousser : Vercel fonctionne
> aussi bien avec un dépôt privé sur l'offre Hobby.

```bash
git remote add origin https://github.com/Padiss93-pixels/Aviconnect.git
```

```bash
git add -A
```

```bash
git commit -m "AviConnect: modération, espace annonceurs, config stores et déploiement web"
```

```bash
git push -u origin main --force-with-lease
```

Le `--force-with-lease` est nécessaire car le dépôt distant a un historique différent (son commit
initial contenant le README).

### 2.2 Corriger la configuration Vercel

Le fichier [`vercel.json`](vercel.json) est maintenant dans le projet et fixe tout : commande de
build, dossier de sortie, réécritures d'URL, en-têtes de sécurité et variables Supabase. Dans le
tableau de bord Vercel, il reste à corriger le préréglage détecté :

**Settings → General → Framework Preset** : passer de **Vite** à **Other**.

Puis **Deployments → Redeploy**. Les réglages attendus, que `vercel.json` impose déjà :

| Champ | Valeur |
|---|---|
| Framework Preset | Other |
| Build Command | `npm run build:web` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Root Directory | `./` |

### 2.3 Brancher le domaine

Vercel → **Settings → Domains** → ajouter `aviconnect.sn` et `www.aviconnect.sn`.

Vercel affichera les enregistrements DNS à créer. **Ne change pas les serveurs de noms** : ils
doivent rester chez Nindohost, sinon les e-mails `@aviconnect.sn` cesseront de fonctionner.
Il suffit de modifier deux enregistrements dans cPanel → **Zone Editor** :

| Type | Nom | Valeur actuelle | Nouvelle valeur |
|---|---|---|---|
| A | `aviconnect.sn` | `46.4.4.202` | l'adresse IP indiquée par Vercel (généralement `76.76.21.21`) |
| CNAME | `www` | — | `cname.vercel-dns.com` |

**Ne touche à rien d'autre** : les enregistrements `MX`, `mail`, `ftp` et `cpanel` doivent rester
tels quels pour que la messagerie et le panneau d'administration continuent de fonctionner.

La propagation prend de quelques minutes à quelques heures. Vercel émettra ensuite le certificat
SSL automatiquement.

---

## 3. Nindohost / cPanel — alternative sans GitHub

L'archive [`aviconnect-web.zip`](aviconnect-web.zip) (5 Mo, 137 fichiers) est prête.

1. Se connecter à `https://ichibi.nindohost.net/cpanel` (identifiant `aviconne`).
2. **File Manager** → dossier `public_html`, vider son contenu (`cgi-bin` peut rester).
3. **Upload** → envoyer `aviconnect-web.zip`.
4. Clic droit sur l'archive → **Extract** dans `public_html`, puis supprimer l'archive.
5. **Settings → Show Hidden Files** doit être coché : vérifier que `.htaccess` est bien à la racine.
   Sans lui, `/marches` et les autres routes renverront une erreur 404.
6. cPanel → **SSL/TLS Status** → sélectionner les deux domaines → **Run AutoSSL**.

Pour republier après une modification : relancer `npm run build:web`, recompresser `dist/` puis
répéter les étapes 2 à 5. C'est manuel à chaque fois — d'où la recommandation Vercel.

---

## 4. Créer les adresses e-mail (dans tous les cas)

cPanel → **Email Accounts** → créer `contact@aviconnect.sn` et `support@aviconnect.sn`.
Ces adresses figurent dans les pages légales et servent de contact éditeur et support pour les stores.

---

## 5. Déclarer le domaine dans Supabase

Dashboard Supabase → **Authentication → URL Configuration** :

- **Site URL** : `https://aviconnect.sn`
- **Redirect URLs** : ajouter `https://aviconnect.sn/reset-password` et `aviconnect://reset-password`

Sans cela, la confirmation d'e-mail à l'inscription et la réinitialisation de mot de passe échouent.

---

## 6. Vérifier

| URL | Attendu |
|---|---|
| `https://aviconnect.sn/` | Accueil de l'app, titre « AviConnect — La marketplace avicole du Sénégal » |
| `https://aviconnect.sn/marches` | Le marché (teste la réécriture d'URL) |
| `https://aviconnect.sn/legal/confidentialite.html` | Politique de confidentialité |
| `https://aviconnect.sn/legal/cgu.html` | Conditions générales |
| `https://aviconnect.sn/legal/suppression-compte.html` | Suppression de compte |
| `https://aviconnect.sn/robots.txt` | Fichier robots |
| `http://aviconnect.sn/` | Redirection vers HTTPS |

---

## 7. URL à renseigner dans les consoles des stores

| Champ | Valeur |
|---|---|
| Politique de confidentialité (Google Play + App Store) | `https://aviconnect.sn/legal/confidentialite.html` |
| Suppression de compte (Google Play) | `https://aviconnect.sn/legal/suppression-compte.html` |
| Support URL (App Store) | `https://aviconnect.sn/legal/` |
| Site web de l'éditeur | `https://aviconnect.sn` |
| E-mail de contact | `contact@aviconnect.sn` |

---

## 8. Plus tard : liens universels

Une fois les applications publiées, deux fichiers permettront d'ouvrir l'app native depuis un lien
`https://aviconnect.sn/...` plutôt que le navigateur. Les déposer dans `web-static/.well-known/`
pour qu'ils soient inclus automatiquement au prochain build :

- `apple-app-site-association` (nécessite l'Apple Team ID)
- `assetlinks.json` (nécessite l'empreinte SHA-256 du certificat Android, via `eas credentials`)

Ce n'est pas bloquant pour la soumission.
