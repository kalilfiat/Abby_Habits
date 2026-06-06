#!/usr/bin/env node
/**
 * Replay StrReplace tool calls from an agent transcript onto the workspace.
 * Usage: node scripts/restore-strreplace-from-transcript.mjs [path-to.jsonl]
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawnSync } from 'child_process';

const WORKSPACE = path.resolve('c:\\Users\\Kalil\\Desktop\\Habitos');
const DEFAULT_TRANSCRIPT =
  'C:\\Users\\Kalil\\.cursor\\projects\\c-Users-Kalil-Desktop-Habitos\\agent-transcripts\\a42f09b4-3aff-4b61-a98e-4a73ea562fa5\\a42f09b4-3aff-4b61-a98e-4a73ea562fa5.jsonl';

const PRIORITY_HINTS = [
  'TodayScreen.tsx',
  'App.tsx',
  'useStore.ts',
  'engine.ts',
  'types.ts',
  'HabitCard.tsx',
  'theme.ts',
  'navigation.ts',
  'package.json',
  'rules.ts',
  'index.ts',
];

const transcriptPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_TRANSCRIPT;

function normalizeWorkspacePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const resolved = path.resolve(filePath.replace(/\//g, path.sep));
  const workspaceLower = WORKSPACE.toLowerCase();
  if (!resolved.toLowerCase().startsWith(workspaceLower)) return null;
  return resolved;
}

function collectStrReplaces(obj, lineNum, replaces) {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) collectStrReplaces(item, lineNum, replaces);
    return;
  }

  if (obj.type === 'tool_use' && obj.name === 'StrReplace' && obj.input?.path) {
    const abs = normalizeWorkspacePath(obj.input.path);
    if (abs) {
      replaces.push({
        lineNum,
        abs,
        rel: path.relative(WORKSPACE, abs),
        old_string: obj.input.old_string,
        new_string: obj.input.new_string,
        replace_all: Boolean(obj.input.replace_all),
      });
    }
    return;
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') collectStrReplaces(value, lineNum, replaces);
  }
}

function isPriority(rel) {
  return PRIORITY_HINTS.some((hint) => rel.replace(/\\/g, '/').endsWith(hint));
}

function applyReplace(content, op) {
  const { old_string, new_string, replace_all } = op;
  if (old_string == null || new_string == null) {
    return { ok: false, reason: 'missing-strings', content };
  }
  if (!content.includes(old_string)) {
    return { ok: false, reason: 'old_string-not-found', content };
  }
  const next = replace_all
    ? content.split(old_string).join(new_string)
    : content.replace(old_string, new_string);
  return { ok: true, content: next };
}

async function main() {
  if (!fs.existsSync(transcriptPath)) {
    console.error('Transcript not found:', transcriptPath);
    process.exit(1);
  }

  const replaces = [];
  const parseErrors = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(transcriptPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      collectStrReplaces(row, lineNum, replaces);
    } catch (e) {
      parseErrors.push({ lineNum, error: String(e) });
    }
  }

  let applied = 0;
  let skipped = 0;
  const appliedOps = [];
  const skippedOps = [];

  for (const op of replaces) {
    if (!fs.existsSync(op.abs)) {
      skipped++;
      skippedOps.push({ ...op, reason: 'file-missing' });
      continue;
    }

    const content = fs.readFileSync(op.abs, 'utf8');
    const result = applyReplace(content, op);
    if (!result.ok) {
      skipped++;
      skippedOps.push({ ...op, reason: result.reason });
      continue;
    }

    fs.writeFileSync(op.abs, result.content, 'utf8');
    applied++;
    appliedOps.push(op);
  }

  const byFile = new Map();
  for (const op of appliedOps) {
    byFile.set(op.rel, (byFile.get(op.rel) ?? 0) + 1);
  }
  const skippedByFile = new Map();
  for (const op of skippedOps) {
    skippedByFile.set(op.rel, (skippedByFile.get(op.rel) ?? 0) + 1);
  }

  const report = {
    transcript: transcriptPath,
    workspace: WORKSPACE,
    totalStrReplaceCalls: replaces.length,
    applied,
    skipped,
    parseErrors,
    appliedByFile: Object.fromEntries([...byFile.entries()].sort()),
    skippedByFile: Object.fromEntries([...skippedByFile.entries()].sort()),
    appliedOps: appliedOps.map(({ rel, lineNum }) => ({ rel, lineNum })),
    skippedOps: skippedOps.map(({ rel, lineNum, reason }) => ({ rel, lineNum, reason })),
  };

  const reportPath = path.join(WORKSPACE, 'scripts', 'restore-strreplace-from-transcript-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('=== Restore StrReplace from transcript ===\n');
  console.log(`Transcript: ${transcriptPath}`);
  console.log(`StrReplace calls found: ${replaces.length}`);
  console.log(`Applied: ${applied}`);
  console.log(`Skipped: ${skipped}`);
  if (parseErrors.length) console.log(`JSON parse errors: ${parseErrors.length}`);
  console.log(`\nReport: ${reportPath}\n`);

  console.log('--- Priority files ---');
  for (const hint of PRIORITY_HINTS) {
    const appliedCount = [...byFile.entries()]
      .filter(([rel]) => rel.replace(/\\/g, '/').endsWith(hint))
      .reduce((sum, [, n]) => sum + n, 0);
    const skippedCount = [...skippedByFile.entries()]
      .filter(([rel]) => rel.replace(/\\/g, '/').endsWith(hint))
      .reduce((sum, [, n]) => sum + n, 0);
    if (appliedCount || skippedCount) {
      console.log(`  ${hint}: applied ${appliedCount}, skipped ${skippedCount}`);
    }
  }

  if (skippedOps.length) {
    console.log('\n--- Skipped (first 30) ---');
    for (const s of skippedOps.slice(0, 30)) {
      console.log(`  ${s.rel} [${s.reason}] (line ${s.lineNum})`);
    }
    if (skippedOps.length > 30) {
      console.log(`  ... and ${skippedOps.length - 30} more`);
    }
  }

  console.log('\n--- Type-check ---');
  const tsc = spawnSync('npx', ['tsc', '--noEmit'], {
    cwd: WORKSPACE,
    shell: true,
    encoding: 'utf8',
  });
  const tscOk = tsc.status === 0;
  if (tscOk) {
    console.log('tsc: PASS');
  } else {
    console.log('tsc: FAIL');
    const out = (tsc.stdout || '') + (tsc.stderr || '');
    console.log(out.trim().slice(0, 4000));
  }

  process.exit(tscOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
