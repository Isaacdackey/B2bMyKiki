/**
 * Génère dynamiquement les fichiers d'environnement Angular :
 *  - src/environments/environment.ts (Développement)
 *  - src/environments/environment.prod.ts (Production)
 * à partir des variables déclarées dans le fichier .env (.env.local ou process.env).
 *
 * Exécuté automatiquement avant `npm start` et `npm run build`.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const envDir = join(racine, 'src', 'environments');

/**
 * Lit et parse un fichier .env simple (clé=valeur).
 */
function parseEnvFile(filePath) {
  const result = {};
  if (!existsSync(filePath)) return result;

  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Supprimer les guillemets englobants s'il y en a
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    result[key] = val;
  }

  return result;
}

// 1. Charger .env puis .env.local
const envFromDotEnv = parseEnvFile(join(racine, '.env'));
const envFromDotEnvLocal = parseEnvFile(join(racine, '.env.local'));

// Fusion avec process.env (prioritaire pour Vercel, Docker, CI/CD)
const envVars = {
  ...envFromDotEnv,
  ...envFromDotEnvLocal,
};

function getVar(key, defaultValue = '') {
  return process.env[key] || envVars[key] || defaultValue;
}

// Variables pour le développement (API_URL en priorité)
const devApiUrl = getVar('API_URL') || getVar('DEV_API_URL') || 'http://localhost:8080';

// Variables pour la production (PROD_API_URL en priorité)
const prodApiUrl = getVar('PROD_API_URL') || getVar('API_URL') || 'https://kiki-backend-iuyo.onrender.com';

// Variables partagées Cloudinary avec valeurs de secours pour le build Vercel
const cloudinaryCloudName = getVar('CLOUDINARY_CLOUD_NAME', 'dx2imkeka');
const cloudinaryApiKey = getVar('CLOUDINARY_API_KEY', '516674256915647');
const cloudinaryUploadPreset = getVar('CLOUDINARY_UPLOAD_PRESET', 'kikitraiteur');
const cloudinaryFolder = getVar('CLOUDINARY_FOLDER', 'kikitraiteur');
const cloudinaryApiUrl = getVar('CLOUDINARY_API_URL', 'https://api.cloudinary.com/v1_1');

if (!existsSync(envDir)) {
  mkdirSync(envDir, { recursive: true });
}

// 2. Générer src/environments/environment.ts (Développement)
const devContent = `/**
 * Environnement de DÉVELOPPEMENT — généré automatiquement par scripts/set-env.mjs
 * Modifiez les variables dans le fichier .env à la racine du projet.
 */
export const environment = {
  production: false,
  apiUrl: '${devApiUrl}',
  cloudinary: {
    cloudName: '${cloudinaryCloudName}',
    apiKey: '${cloudinaryApiKey}',
    uploadPreset: '${cloudinaryUploadPreset}',
    folder: '${cloudinaryFolder}',
    apiUrl: '${cloudinaryApiUrl}'
  }
};
`;

// 3. Générer src/environments/environment.prod.ts (Production)
const prodContent = `/**
 * Environnement de PRODUCTION — généré automatiquement par scripts/set-env.mjs
 * Modifiez les variables dans le fichier .env ou les variables d'environnement du serveur (Vercel/CI).
 */
export const environment = {
  production: true,
  apiUrl: '${prodApiUrl}',
  cloudinary: {
    cloudName: '${cloudinaryCloudName}',
    apiKey: '${cloudinaryApiKey}',
    uploadPreset: '${cloudinaryUploadPreset}',
    folder: '${cloudinaryFolder}',
    apiUrl: '${cloudinaryApiUrl}'
  }
};
`;

writeFileSync(join(envDir, 'environment.ts'), devContent, 'utf8');
writeFileSync(join(envDir, 'environment.prod.ts'), prodContent, 'utf8');

console.log(`[set-env] Fichiers d'environnement générés avec succès :`);
console.log(`  - DÉVELOPPEMENT (environment.ts)      -> API: ${devApiUrl}`);
console.log(`  - PRODUCTION    (environment.prod.ts) -> API: ${prodApiUrl}`);
