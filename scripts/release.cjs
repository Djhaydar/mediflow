/**
 * Script de publication d'une nouvelle version de MediFlow
 * Usage : node scripts/release.cjs [patch|minor|major] ["Note 1" "Note 2" ...]
 * Exemple : node scripts/release.cjs patch "Correction bug ordonnance" "Nouveaux médicaments"
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Lire le type de bump (patch, minor, major) ──────────────
const bump = process.argv[2] || 'patch';  // par défaut : patch (2.0.0 → 2.0.1)
const notes = process.argv.slice(3);

// ── Lire package.json ──────────────────────────────────────
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);

let newVersion;
if (bump === 'major') newVersion = `${major+1}.0.0`;
else if (bump === 'minor') newVersion = `${major}.${minor+1}.0`;
else newVersion = `${major}.${minor}.${patch+1}`;

console.log(`\n🚀 MediFlow Release v${pkg.version} → v${newVersion}\n`);

// ── Mettre à jour package.json ─────────────────────────────
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`✅ package.json → v${newVersion}`);

// ── Mettre à jour latest.json ──────────────────────────────
const latestPath = path.join(__dirname, '..', 'latest.json');
const latest = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
latest.version = newVersion;
latest.date    = new Date().toISOString().slice(0,10);
if (notes.length > 0) latest.notes = notes;
fs.writeFileSync(latestPath, JSON.stringify(latest, null, 2));
console.log(`✅ latest.json → v${newVersion}`);

// ── Build ──────────────────────────────────────────────────
console.log('\n📦 Build en cours...\n');
try {
  execSync('npm run electron:build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build terminé !');
} catch (e) {
  console.error('❌ Erreur build:', e.message);
  process.exit(1);
}

// ── Résumé ─────────────────────────────────────────────────
const distDir = path.join(__dirname, '..', 'dist_electron');
const files = fs.existsSync(distDir)
  ? fs.readdirSync(distDir).filter(f => f.endsWith('.exe') && !f.endsWith('.blockmap'))
  : [];

console.log(`
╔══════════════════════════════════════════════════════════╗
║           ✅ MediFlow v${newVersion} prêt à distribuer          ║
╠══════════════════════════════════════════════════════════╣
║  Fichiers générés dans dist_electron/ :                  ║`);
files.forEach(f => console.log(`║    📦 ${f.padEnd(52)}║`));
console.log(`╠══════════════════════════════════════════════════════════╣
║  Étapes suivantes :                                      ║
║  1. Ouvrir GitHub → Releases → "Draft a new release"    ║
║  2. Tag : v${newVersion.padEnd(48)}║
║  3. Uploader les .exe de dist_electron/                  ║
║  4. Publier → les utilisateurs seront notifiés !        ║
╚══════════════════════════════════════════════════════════╝
`);
