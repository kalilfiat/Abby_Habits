#!/usr/bin/env node
/**
 * Recover files from agent transcript Write tool calls.
 * Usage: node scripts/restore-from-transcript.mjs [path-to.jsonl]
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const WORKSPACE = path.resolve('c:\\Users\\Kalil\\Desktop\\Habitos');
const DEFAULT_TRANSCRIPT =
  'C:\\Users\\Kalil\\.cursor\\projects\\c-Users-Kalil-Desktop-Habitos\\agent-transcripts\\a42f09b4-3aff-4b61-a98e-4a73ea562fa5\\a42f09b4-3aff-4b61-a98e-4a73ea562fa5.jsonl';

const transcriptPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_TRANSCRIPT;

function normalizeWorkspacePath(filePath) {
  const resolved = path.resolve(filePath.replace(/\//g, path.sep));
  const workspaceLower = WORKSPACE.toLowerCase();
  if (!resolved.toLowerCase().startsWith(workspaceLower)) return null;
  return resolved;
}

function isUnderHabitos(filePath) {
  return normalizeWorkspacePath(filePath) !== null;
}

function isRedactedOrInvalid(contents, rawLine) {
  const reasons = [];
  if (contents == null || typeof contents !== 'string') {
    reasons.push('missing-contents');
    return reasons;
  }
  if (contents.includes('[REDACTED]')) reasons.push('redacted');
  if (rawLine.includes('[REDACTED]') && contents.length < 80) {
    reasons.push('line-redacted');
  }
  // Grep/UI truncation marker sometimes leaked into stored content
  if (contents.includes('... omitted end of long line')) {
    reasons.push('truncated-marker');
  }
  return reasons;
}

/** Heuristic: incomplete TS/TSX (unbalanced braces) — often truncated in export */
function looksTruncated(contents, ext) {
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return false;
  let braces = 0;
  let parens = 0;
  for (const ch of contents) {
    if (ch === '{') braces++;
    if (ch === '}') braces--;
    if (ch === '(') parens++;
    if (ch === ')') parens--;
  }
  if (braces !== 0 || parens !== 0) return true;
  const trimmed = contents.trimEnd();
  if (trimmed.endsWith(',') || trimmed.endsWith('(') || trimmed.endsWith('{')) return true;
  return false;
}

function collectWrites(obj, lineNum, rawLine, writes) {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) collectWrites(item, lineNum, rawLine, writes);
    return;
  }

  if (obj.type === 'tool_use' && obj.name === 'Write' && obj.input?.path) {
    const abs = normalizeWorkspacePath(obj.input.path);
    if (abs) {
      writes.push({
        lineNum,
        abs,
        rel: path.relative(WORKSPACE, abs),
        contents: obj.input.contents,
        rawLine,
      });
    }
    return;
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') collectWrites(value, lineNum, rawLine, writes);
  }
}

async function main() {
  if (!fs.existsSync(transcriptPath)) {
    console.error('Transcript not found:', transcriptPath);
    process.exit(1);
  }

  const writes = [];
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
      collectWrites(row, lineNum, line, writes);
    } catch (e) {
      parseErrors.push({ lineNum, error: String(e) });
    }
  }

  // Latest write per path (order in file = chronological)
  const latestByPath = new Map();
  for (const w of writes) {
    latestByPath.set(w.abs, w);
  }

  const recovered = [];
  const failed = [];
  const skippedDuplicates = writes.length - latestByPath.size;

  for (const w of latestByPath.values()) {
    const reasons = isRedactedOrInvalid(w.contents, w.rawLine);
    const ext = path.extname(w.abs);
    if (!reasons.length && looksTruncated(w.contents, ext)) {
      reasons.push('unbalanced-syntax');
    }

    if (reasons.length) {
      failed.push({ path: w.rel, abs: w.abs, lineNum: w.lineNum, reasons });
      continue;
    }

    fs.mkdirSync(path.dirname(w.abs), { recursive: true });
    fs.writeFileSync(w.abs, w.contents, 'utf8');
    recovered.push({ path: w.rel, abs: w.abs, lineNum: w.lineNum, bytes: Buffer.byteLength(w.contents, 'utf8') });
  }

  recovered.sort((a, b) => a.path.localeCompare(b.path));
  failed.sort((a, b) => a.path.localeCompare(b.path));

  const report = {
    transcript: transcriptPath,
    workspace: WORKSPACE,
    totalWriteCalls: writes.length,
    uniquePaths: latestByPath.size,
    skippedOlderWrites: skippedDuplicates,
    parseErrors,
    recoveredCount: recovered.length,
    failedCount: failed.length,
    recovered,
    failed,
  };

  const reportPath = path.join(WORKSPACE, 'scripts', 'restore-from-transcript-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('=== Restore from transcript ===\n');
  console.log(`Transcript: ${transcriptPath}`);
  console.log(`Write calls found: ${writes.length} (${latestByPath.size} unique paths)`);
  console.log(`Recovered: ${recovered.length}`);
  console.log(`Failed: ${failed.length}`);
  if (parseErrors.length) console.log(`JSON parse errors: ${parseErrors.length}`);
  console.log(`\nReport: ${reportPath}\n`);

  if (recovered.length) {
    console.log('--- Recovered files ---');
    for (const r of recovered) {
      console.log(`  ${r.path} (${r.bytes} bytes, line ${r.lineNum})`);
    }
  }

  if (failed.length) {
    console.log('\n--- Failed (redacted/truncation/invalid) ---');
    for (const f of failed) {
      console.log(`  ${f.path} [${f.reasons.join(', ')}] (line ${f.lineNum})`);
    }
  }

  // Paths only touched via StrReplace (not full Write) — hint for parent
  const writtenPaths = new Set([...latestByPath.keys()]);
  console.log('\n--- Note ---');
  console.log(
    'Files changed only via StrReplace in the transcript are NOT restored by this script.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
