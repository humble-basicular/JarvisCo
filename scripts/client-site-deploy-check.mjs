#!/usr/bin/env node
/* Run before uploading a generated client site anywhere (runbook: client-site.md).
   node scripts/client-site-deploy-check.mjs client-sites/<slug>
   Refuses a folder that is a local test build (marker file from client-site.mjs
   --test), is noindex, or still points the form/beacons at localhost. Read-only.
   A v3 launch candidate (--pending-worker) fails until its Worker site is registered;
   --allow-pending-worker reports that one gate as PENDING so the rest can be verified. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? '');
const allowPending = process.argv.includes('--allow-pending-worker');
const problems = [];
const pending = [];
if (!process.argv[2] || !existsSync(join(dir, 'index.html'))) problems.push(`no built site at ${dir}`);
else {
  if (existsSync(join(dir, 'TEST-BUILD-DO-NOT-DEPLOY.txt'))) problems.push('TEST-BUILD-DO-NOT-DEPLOY.txt present: this is a local test build');
  const index = readFileSync(join(dir, 'index.html'), 'utf8');
  if (/data-build-mode=/.test(index)) {
    try {
      const manifest = JSON.parse(readFileSync(join(dir, 'build-manifest.json'), 'utf8'));
      if (manifest.version !== 1 || manifest.template !== 'v3' || manifest.mode !== 'production' || manifest.configurationValidated !== true || !['consent', 'disabled'].includes(manifest.mapMode) || manifest.formEndpoint !== 'https://www.jarvisweb.lt/t/form') problems.push('v3 manifest: unresolved or non-production configuration');
      if (manifest.workerRegistered !== true) (allowPending ? pending : problems).push(`Worker site "${manifest.code}" not registered yet (launch candidate): register it with origins https://${manifest.domain} and https://www.${manifest.domain}, then rebuild without --pending-worker`);
      if (!index.includes(`href="https://${manifest.domain}/"`) || !index.includes(`data-site="${manifest.code}"`) || !index.includes('data-build-mode="production"')) problems.push('v3 manifest does not match the built page');
      if (!index.includes(`action="${manifest.formEndpoint}"`) || !index.includes('name="kind" value="site_inquiry"') || !index.includes('name="phone" required') || /<form[^>]*data-inert-form/.test(index)) problems.push('v3 form is not wired for the Worker');
    } catch { problems.push('v3 build-manifest.json missing or invalid'); }
  }
  const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  for (const file of walk(dir).filter((f) => /\.(html|js|txt|xml|json)$/.test(f))) {
    const text = readFileSync(file, 'utf8');
    if (/localhost|127\.0\.0\.1/.test(text)) problems.push(`${file.slice(dir.length + 1)}: points at a local endpoint`);
  }
  if (/name="robots" content="noindex/.test(readFileSync(join(dir, 'index.html'), 'utf8'))) problems.push('index.html is noindex');
}
if (problems.length) { console.error(`NOT DEPLOYABLE: ${dir}\n- ${problems.join('\n- ')}`); process.exit(1); }
console.log(`deploy-check OK${pending.length ? ' except PENDING' : ''}: ${dir}${pending.map((p) => `\n- PENDING ${p}`).join('')}`);
