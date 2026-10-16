#!/usr/bin/env node
/*
  Build del sitio Lumina (sin dependencias, Node 16+).

    node build.js            -> dist/index.html  (UN solo HTML autocontenido, todo en base64; es lo que se publica)
    node build.js --dev      -> preview.html     (misma página, pero apunta a los archivos del repo; para editar rápido)
    node build.js --index    -> permite indexación en Google (por defecto: noindex)

  Marcadores que entiende la plantilla (src/html/index.html):
    <!--css-->  <!--js-->            estilos y script
    <!--svg:ruta.svg-->             SVG inline (logos/iconos, toman el color con currentColor)
    asset:ruta/archivo.ext          recurso del repo -> data URI (o ruta relativa en --dev)
    {{link:clave}}                  valor de links/links.json
    data:obra / data:unidades / data:links (entre barra-asterisco)   JSON de src/data y links
*/
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DEV = process.argv.includes('--dev');
const INDEX = process.argv.includes('--index');
const LIMIT = 30 * 1024 * 1024; // límite de subida de GitHub web

const MIME = {
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.woff2': 'font/woff2'
};
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const cache = new Map();
const used = new Map();
const hits = new Map();

function asset(rel) {
  rel = rel.replace(/^\.?\//, '');
  if (!exists(rel)) throw new Error('Falta el recurso: ' + rel);
  hits.set(rel, (hits.get(rel) || 0) + 1);
  if (DEV) return rel;
  if (!cache.has(rel)) {
    const buf = fs.readFileSync(path.join(ROOT, rel));
    const mime = MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream';
    cache.set(rel, 'data:' + mime + ';base64,' + buf.toString('base64'));
    used.set(rel, buf.length);
  }
  return cache.get(rel);
}

function svgInline(rel) {
  let s = read(rel).replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[\s\S]*?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  if (!/aria-hidden|role=/.test(s.slice(0, 300))) s = s.replace('<svg', '<svg aria-hidden="true" focusable="false"');
  s = s.replace(/<svg\b[^>]*>/, (tag) => tag.replace(/\s(width|height)="[\d.]+(pt|px)?"/g, '')); // solo en la etiqueta raíz: el tamaño lo da el CSS
  return s;
}

function resolveData(obj) {
  if (Array.isArray(obj)) return obj.map(resolveData);
  if (obj && typeof obj === 'object') {
    const o = {};
    for (const k of Object.keys(obj)) if (!k.startsWith('_')) o[k] = resolveData(obj[k]);
    return o;
  }
  if (typeof obj === 'string' && /^(fotos|videos|brochures|logos|iconos)\//.test(obj) && exists(obj)) return asset(obj);
  return obj;
}

const links = JSON.parse(read('links/links.json'));
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

let html = read('src/html/index.html');
html = html.replace(/<!--svg:([^>]+?)-->/g, (_, p) => svgInline(p.trim()));
html = html.replace('<!--css-->', () => read('src/css/styles.css'));
html = html.replace('<!--js-->', () => read('src/js/main.js'));
html = html.replace(/\/\*data:(\w+)\*\//g, (_, k) => {
  const src = k === 'links' ? links : JSON.parse(read('src/data/' + k + '.json'));
  return JSON.stringify(resolveData(src)).replace(/</g, '\\u003c');
});
html = html.replace(/\{\{link:(\w+)\}\}/g, (_, k) => {
  if (!(k in links)) throw new Error('Link inexistente: ' + k);
  return esc(links[k]);
});
html = html.replace(/asset:([\w\-./]+\.(?:webp|jpe?g|png|svg|mp4|pdf|woff2))/g, (_, p) => asset(p));
html = html.replace('<!--robots-->', INDEX ? '<meta name="robots" content="index,follow">' : '<meta name="robots" content="noindex,nofollow">');

const left = html.match(/asset:|\{\{link:|<!--svg:|\/\*data:/);
if (left) throw new Error('Quedó un marcador sin resolver cerca de: ' + html.substr(left.index, 80));

const out = DEV ? path.join(ROOT, 'preview.html') : path.join(ROOT, 'dist', 'index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);

const size = Buffer.byteLength(html);
const mb = (b) => (b / 1048576).toFixed(2) + ' MB';
console.log((DEV ? 'preview.html' : 'dist/index.html') + ' · ' + mb(size) + (INDEX ? ' · indexable' : ' · noindex'));
if (!DEV) {
  [...used.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([p, b]) => console.log('  ' + mb(b).padStart(9) + '  ' + p));
  [...hits.entries()].filter(([p, n]) => n > 1 && used.get(p) > 50 * 1024).forEach(([p, n]) => console.warn('  aviso: ' + p + ' se embebe ' + n + ' veces (duplica peso)'));
  if (size > LIMIT) { console.error('ATENCIÓN: supera 30 MB (límite de subida). Bajá peso de fotos/videos.'); process.exitCode = 1; }
}
