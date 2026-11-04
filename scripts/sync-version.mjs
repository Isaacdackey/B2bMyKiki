/**
 * Aligne le numéro de version de l'application sur package.json.
 *
 * Trois fichiers doivent porter la MÊME version, sans quoi le cache du
 * service worker se désynchronise et l'application installée continue de
 * servir un ancien bundle :
 *
 *   package.json        source unique de vérité
 *   public/version.json lu par le bandeau « nouvelle version disponible »
 *   public/sw.js        CACHE_VERSION — décide de la purge des anciens caches
 *
 * Le navigateur ne remplace un service worker que si le FICHIER sw.js change
 * d'octets. Réécrire CACHE_VERSION à chaque build est donc ce qui déclenche
 * réellement la mise à jour chez les utilisateurs.
 *
 * Exécuté automatiquement avant `npm start` et `npm run build`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

const pkg = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf8'));
const version = pkg.version;

if (!version || version === '0.0.0') {
  console.error('[sync-version] package.json ne porte pas de version exploitable.');
  process.exit(1);
}

// 1. version.json — consulté par l'application pour détecter une mise à jour
const cheminVersion = join(racine, 'public', 'version.json');
writeFileSync(cheminVersion, JSON.stringify({
  version,
  buildTime: Date.now(),
  description: 'Kiki Traiteur - Application Mykiki'
}, null, 2) + '\n', 'utf8');

// 2. sw.js — CACHE_VERSION, réécrit en place
const cheminSw = join(racine, 'public', 'sw.js');
let sw = readFileSync(cheminSw, 'utf8');
const avant = sw;
sw = sw.replace(
  /^const CACHE_VERSION = '[^']*';/m,
  `const CACHE_VERSION = 'v${version}';`
);

if (sw === avant && !sw.includes(`'v${version}'`)) {
  console.error("[sync-version] Ligne CACHE_VERSION introuvable dans public/sw.js.");
  process.exit(1);
}
writeFileSync(cheminSw, sw, 'utf8');

console.log(`[sync-version] Application alignée sur la version ${version}.`);
