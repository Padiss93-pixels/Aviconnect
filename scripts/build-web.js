#!/usr/bin/env node
// Build du site aviconnect.sn.
//
// `expo export` efface entièrement dist/ à chaque exécution : ce script relance
// l'export puis y recopie les fichiers qui ne viennent pas du bundle
// (pages légales, .htaccess, robots.txt, sitemap.xml).
//
// Utilisé aussi bien en local que par Vercel (buildCommand dans vercel.json).

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function copyDir(src, destDir, { filter } = {}) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(destDir, { recursive: true });
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      n += copyDir(from, to, { filter });
    } else if (!filter || filter(entry.name)) {
      fs.copyFileSync(from, to);
      n++;
    }
  }
  return n;
}

console.log('› Export web (expo)…');
execSync('npx expo export --platform web --output-dir dist', { cwd: root, stdio: 'inherit' });

if (!fs.existsSync(dist)) {
  console.error('✗ dist/ absent : l’export a échoué.');
  process.exit(1);
}

// Expo Router insère un <title> vide géré par react-helmet dans chaque page
// exportée. Le composant <Head> d'expo-router ne peut pas le remplir depuis le
// layout racine (il dépend de useIsFocused, donc d'un écran de navigation), et
// deux balises <title> laisseraient la première — vide — l'emporter pour les
// moteurs de recherche et les aperçus de lien. On la remplit ici.
const TITRE = 'AviConnect — La marketplace avicole du Sénégal';
const DESCRIPTION =
  'AviConnect met en relation éleveurs, acheteurs, couvoirs et vétérinaires de la ' +
  'filière avicole dans les 14 régions du Sénégal. Poulets, poussins, œufs et ' +
  'aliments, en direct des producteurs.';

function remplirTitres(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { n += remplirTitres(p); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf8');
    if (!html.includes('<title data-rh="true"></title>')) continue;
    fs.writeFileSync(
      p,
      html.replace(
        '<title data-rh="true"></title>',
        `<title data-rh="true">${TITRE}</title>` +
        `<meta data-rh="true" name="description" content="${DESCRIPTION}"/>`
      )
    );
    n++;
  }
  return n;
}

const legal = copyDir(path.join(root, 'legal'), path.join(dist, 'legal'), {
  filter: (name) => name.endsWith('.html'),
});
console.log(`› ${legal} page(s) légale(s) copiée(s) dans dist/legal/`);

const statics = copyDir(path.join(root, 'web-static'), dist);
console.log(`› ${statics} fichier(s) statique(s) copié(s) (.htaccess, robots.txt, sitemap.xml)`);

console.log(`› Titre et description posés sur ${remplirTitres(dist)} page(s)`);

// Garde-fou : sans les clés Supabase dans le bundle, le site se charge mais
// l'authentification et toutes les données sont mortes. Mieux vaut échouer ici.
const jsDir = path.join(dist, '_expo', 'static', 'js', 'web');
const bundles = fs.existsSync(jsDir) ? fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')) : [];
const hasSupabase = bundles.some((f) =>
  fs.readFileSync(path.join(jsDir, f), 'utf8').includes('.supabase.co')
);
if (!hasSupabase) {
  console.error(
    '\n✗ EXPO_PUBLIC_SUPABASE_URL absent du bundle.\n' +
    '  En local : vérifier .env. Sur Vercel : vérifier les variables du projet.\n'
  );
  process.exit(1);
}

console.log('\n✓ Site prêt dans dist/ — clés Supabase présentes dans le bundle.');
