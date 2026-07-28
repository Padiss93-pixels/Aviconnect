#!/usr/bin/env node
// Petit serveur statique pour vérifier le contenu de dist/ avant de le mettre
// en ligne. Reproduit les règles de réécriture d'Apache et de Vercel :
// fichier réel > /route.html > /index.html.

const http = require('http');
const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const candidates = [
    path.join(dist, clean),
    path.join(dist, clean, 'index.html'),
    path.join(dist, `${clean}.html`),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return path.join(dist, 'index.html');
}

http
  .createServer((req, res) => {
    const file = resolve(req.url === '/' ? 'index.html' : req.url);
    const type = MIME[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`dist/ servi sur http://localhost:${port}`));
