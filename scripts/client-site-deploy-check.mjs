#!/usr/bin/env node
/* Run before uploading a generated client site anywhere (runbook: client-site.md).
   node scripts/client-site-deploy-check.mjs client-sites/<slug>
   Refuses a folder that is a local test build (marker file from client-site.mjs
   --test), is noindex, or still points the form/beacons at localhost. Read-only. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? '');
const problems = [];
if (!process.argv[2] || !existsSync(join(dir, 'index.html'))) problems.push(`no built site at ${dir}`);
else {
  if (existsSync(join(dir, 'TEST-BUILD-DO-NOT-DEPLOY.txt'))) problems.push('TEST-BUILD-DO-NOT-DEPLOY.txt present: this is a local test build');
  const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  for (const file of walk(dir).filter((f) => /\.(html|js|txt|xml)$/.test(f))) {
    const text = readFileSync(file, 'utf8');
    if (/localhost|127\.0\.0\.1/.test(text)) problems.push(`${file.slice(dir.length + 1)}: points at a local endpoint`);
  }
  if (/name="robots" content="noindex/.test(readFileSync(join(dir, 'index.html'), 'utf8'))) problems.push('index.html is noindex');
}
if (problems.length) { console.error(`NOT DEPLOYABLE: ${dir}\n- ${problems.join('\n- ')}`); process.exit(1); }
console.log(`deploy-check OK: ${dir}`);
