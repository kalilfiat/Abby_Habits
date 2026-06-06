/**
 * Sanity checks before release builds — catches scaffold/regression regressions.
 * Run: node scripts/verify-app.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function mustExist(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) errors.push(`Falta archivo crítico: ${rel}`);
  return abs;
}

function mustInclude(rel, needle, label) {
  const abs = mustExist(rel);
  const text = fs.readFileSync(abs, 'utf8');
  if (!text.includes(needle)) errors.push(`${label ?? rel}: no contiene "${needle}"`);
}

// — Core app (not Expo template-only) —
const criticalFiles = [
  'src/store/useStore.ts',
  'src/core/habit-engine/engine.ts',
  'src/core/mascot/conversation.ts',
  'src/ui/screens/TodayScreen.tsx',
  'src/ui/components/HabitProgressCard.tsx',
  'src/ui/components/AbbyAvatar.tsx',
  'src/ui/mascotAssets.ts',
  'src/ui/components/PeriodHistoryStrip.tsx',
];

for (const f of criticalFiles) mustExist(f);

// — Mascot PNGs wired for Metro bundle (APK) —
const poses = ['Abby_hi.png', 'Abby_worried.png', 'Abby_nice.png', 'Abby_happy.png'];
for (const png of poses) mustExist(path.join('assets', 'abby', png));

mustInclude('src/ui/mascotAssets.ts', "require('../../assets/abby/Abby_hi.png')", 'mascotAssets');
mustInclude('src/ui/components/AbbyAvatar.tsx', 'MASCOT_POSE_IMAGES', 'AbbyAvatar');

// — Layout regressions (Progreso tab) —
mustInclude('src/ui/components/HabitProgressCard.tsx', "justifyContent: 'flex-start'", 'HabitProgressCard header');
mustInclude('src/ui/components/HabitProgressCard.tsx', 'headerTrailing', 'HabitProgressCard trailing');
mustInclude('src/ui/components/PeriodHistoryStrip.tsx', "alignItems: 'stretch'", 'PeriodHistoryStrip cells');

const strip = fs.readFileSync(path.join(root, 'src/ui/components/PeriodHistoryStrip.tsx'), 'utf8');
if (strip.includes('maxWidth: 28')) {
  errors.push('PeriodHistoryStrip: maxWidth: 28 vuelve a centrar las celdas');
}

// — Expo config —
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
if (!appJson.expo?.android?.package?.includes('abby')) {
  errors.push('app.json: package Android no es com.abby.habits');
}
const patterns = appJson.expo?.assetBundlePatterns ?? [];
if (!patterns.some((p) => String(p).includes('assets'))) {
  errors.push('app.json: falta assetBundlePatterns para assets/**/*');
}

// — No volver al ícono gato del template en entry —
mustInclude('App.tsx', 'AbbyAvatar', 'App entry mascot');

if (errors.length) {
  console.error('verify-app: FALLÓ\n');
  for (const e of errors) console.error('  •', e);
  process.exit(1);
}

console.log('verify-app: OK');
console.log(`  • ${criticalFiles.length} módulos críticos`);
console.log(`  • ${poses.length} poses Abby en assets/abby/`);
console.log('  • layout Progreso + assetBundlePatterns');
