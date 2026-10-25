#!/usr/bin/env node
import { homedir } from 'node:os';
import { join } from 'node:path';
import { runBatch, LaunchError } from './launch/batch.mjs';

const help = `Usage: node scripts/client-launch.mjs [plan|check|build] --frontend <checkout> --expect-commit <commit>
  [--clients meselektra,laikam,masaukstalipiai,vensland] [--private-root <Drive previews folder>] [--resume]
plan is the read-only default: no commands, receipts or directories are created (git reads only).
check runs the existing local deploy checker; build runs the existing local builder then checker.
check/build write private per-client receipts/logs; --resume reuses only hash-matching successful builds.
No remote actions, sending, deployment, purchase, trial start or offline action are implemented.
Exit: 0 all launch evidence confirmed; 2 pending gates; 1 invalid input/client failure.
JSON stdout contains only public identities, hashes, statuses and fixed issue codes.`;

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') { console.log(help); process.exit(0); }
  const options = { mode: 'plan', privateRoot: join(homedir(), 'Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews') };
  if (args[0] && !args[0].startsWith('--')) options.mode = args.shift();
  const flags = { '--frontend': 'frontend', '--expect-commit': 'expectCommit', '--private-root': 'privateRoot', '--clients': 'selection' };
  const seen = new Set();
  while (args.length) {
    const arg = args.shift();
    if (seen.has(arg)) throw new LaunchError('duplicate-option');
    seen.add(arg);
    if (arg === '--resume') { options.resume = true; continue; }
    if (!flags[arg] || !args[0] || args[0].startsWith('--')) throw new LaunchError('invalid-option');
    options[flags[arg]] = args.shift();
  }
  const result = await runBatch(options);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.exitCode;
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', issue: error instanceof LaunchError ? error.code : 'unexpected-error' }));
  process.exitCode = 1;
}
