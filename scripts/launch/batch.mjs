import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync,
  realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { acceptedFrontend, clients, gateNames } from './clients.mjs';

export class LaunchError extends Error { constructor(code) { super(code); this.code = code; } }
const fail = code => { throw new LaunchError(code); };
const sha = value => createHash('sha256').update(value).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const inside = (root, path) => path === root || path.startsWith(root + sep);

// Reject symlinks below the explicitly selected root, including absent output components.
function safePath(root, rel, kind) {
  const path = resolve(root, rel);
  if (!inside(root, path) || path === root) fail('path-outside-root');
  let current = root;
  for (const part of relative(root, path).split(sep)) {
    current = join(current, part);
    if (existsSync(current) || (() => { try { return lstatSync(current).isSymbolicLink(); } catch { return false; } })()) {
      if (lstatSync(current).isSymbolicLink()) fail('symlink-refused');
    }
  }
  if (kind && (!existsSync(path) || (kind === 'file' ? !lstatSync(path).isFile() : !lstatSync(path).isDirectory()))) fail('required-path-missing');
  return path;
}

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 15000, maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0 || result.error) fail('frontend-git-check-failed');
  return result.stdout.trim();
}

// Includes untracked source, preview data/media and dirty tracked bytes, not just HEAD.
function treeHash(root, paths) {
  const hash = createHash('sha256');
  const visit = rel => {
    const path = safePath(root, rel);
    hash.update(JSON.stringify(rel));
    if (!existsSync(path)) { hash.update('missing'); return; }
    const stat = lstatSync(path);
    if (stat.isDirectory()) for (const name of readdirSync(path).sort()) visit(join(rel, name));
    else if (stat.isFile()) hash.update(sha(readFileSync(path)));
    else fail('unsupported-file-type');
  };
  for (const path of paths) visit(path);
  return hash.digest('hex');
}

function atomicJson(path, data) {
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  renameSync(temp, path);
}

function loadState(path) {
  if (!existsSync(path)) return null;
  try { const value = json(path); if (value.version !== 1) fail('invalid-receipt'); return value; }
  catch { fail('invalid-receipt'); }
}

function evidenceGates(root, path, identity, fingerprint) {
  const gates = Object.fromEntries(gateNames.map(name => [name, 'pending']));
  if (!existsSync(path)) return gates;
  let evidence;
  try { evidence = json(path); } catch { fail('invalid-gate-evidence'); }
  if (evidence.version !== 1 || JSON.stringify(evidence.identity) !== JSON.stringify(identity)) fail('gate-evidence-identity-mismatch');
  if (evidence.fingerprint !== fingerprint) return Object.fromEntries(gateNames.map(name => [name, 'stale']));
  for (const [name, item] of Object.entries(evidence.gates ?? {})) {
    if (!gateNames.includes(name)) fail('unknown-evidence-gate');
    if (item.status !== 'confirmed') continue;
    if (!Number.isFinite(Date.parse(item.checkedAt)) || Date.parse(item.checkedAt) > Date.now() ||
        !Array.isArray(item.files) || !item.files.length) fail('invalid-gate-evidence');
    for (const file of item.files) {
      if (typeof file.path !== 'string' || isAbsolute(file.path) || file.path.startsWith('batch-orchestration/')) fail('invalid-evidence-path');
      const ref = safePath(root, file.path, 'file');
      if (!lstatSync(ref).size || sha(readFileSync(ref)) !== file.sha256) fail('gate-evidence-hash-mismatch');
    }
    gates[name] = 'operator-attested';
  }
  return gates;
}

function execute(frontend, script, args, log) {
  // Never relay builder diagnostics/config/recipient values to public stdout.
  const fd = openSync(log, 'wx', 0o600);
  try {
    const env = { ...process.env, INIT_CWD: frontend };
    delete env.CLIENT_SITE_BUILD;
    const result = spawnSync(process.execPath, [join(frontend, script), ...args], {
      cwd: frontend, env, stdio: ['ignore', fd, fd], timeout: 5 * 60 * 1000,
    });
    return result.status === 0 && !result.error;
  } finally { closeSync(fd); }
}

export async function runBatch(options, { requiredAncestor = acceptedFrontend } = {}) {
  const { mode = 'plan', resume = false } = options;
  if (!['plan', 'check', 'build'].includes(mode) || (resume && mode !== 'build')) fail('invalid-mode');
  if (!options.frontend || !/^[a-f0-9]{7,40}$/.test(options.expectCommit ?? '')) fail('explicit-frontend-and-commit-required');
  const frontend = realpathSync(resolve(options.frontend));
  if (git(frontend, ['rev-parse', '--show-toplevel']) !== frontend) fail('frontend-must-be-checkout-root');
  const commit = git(frontend, ['rev-parse', 'HEAD']);
  if (git(frontend, ['rev-parse', `${options.expectCommit}^{commit}`]) !== commit) fail('frontend-commit-mismatch');
  git(frontend, ['merge-base', '--is-ancestor', requiredAncestor, commit]);
  const privateRoot = realpathSync(resolve(options.privateRoot));
  const toolingRoot = realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
  // Receipts/configs must never be inside either git checkout.
  if (inside(frontend, privateRoot) || inside(toolingRoot, privateRoot)) fail('private-root-inside-source');
  const selection = options.selection ? options.selection.split(',') : clients.map(c => c.site);
  if (!selection.length || new Set(selection).size !== selection.length || selection.some(s => !clients.some(c => c.site === s))) fail('unknown-or-duplicate-client');
  const sourceHash = treeHash(frontend, ['src', 'scripts', 'package.json', 'package-lock.json', 'astro.config.mjs']);
  const toolHash = treeHash(toolingRoot, ['scripts/client-launch.mjs', 'scripts/launch/batch.mjs', 'scripts/launch/clients.mjs', 'tracking/config/client-sites.json']);
  safePath(frontend, 'scripts/client-site.mjs', 'file');
  safePath(frontend, 'scripts/client-site-deploy-check.mjs', 'file');
  const validatorPath = safePath(frontend, 'src/templates/v3/build-config.mjs', 'file');
  const { validateLaunchConfig } = await import(pathToFileURL(validatorPath).href + `?hash=${sourceHash}`);
  const additions = json(join(toolingRoot, 'tracking/config/client-sites.json'));
  const results = [];
  for (const client of clients.filter(c => selection.includes(c.site))) {
    const { site, folder, slug, domain, project, projectId } = client;
    const identity = { site, slug, domain, project, projectId };
    const result = { ...identity, status: 'pending', issues: [], config: 'pending', hosting: 'pending', local: 'not-run', gates: Object.fromEntries(gateNames.map(g => [g, 'pending'])) };
    let lock;
    try {
      const root = safePath(privateRoot, folder, 'dir');
      const launch = safePath(root, 'launch', 'dir');
      const config = safePath(root, client.config);
      if (!existsSync(config)) { result.issues.push('launch-config-missing'); results.push(result); continue; }
      safePath(root, client.config, 'file');
      const preview = safePath(frontend, `previews/${slug}.json`, 'file');
      const data = json(preview);
      if (data.slug !== slug || !data.v3 || data.site?.code && data.site.code !== site) fail('preview-identity-mismatch');
      const origins = [`https://${domain}`, `https://www.${domain}`];
      if (additions[site]?.kind !== 'client' || JSON.stringify(additions[site].origins) !== JSON.stringify(origins)) fail('site-registration-identity-mismatch');
      const raw = json(config);
      if (raw.worker?.site !== site || JSON.stringify(raw.worker.origins?.slice().sort()) !== JSON.stringify(origins.slice().sort())) fail('config-identity-mismatch');
      if (raw.worker.recipients?.length !== 2 || !raw.worker.recipients.includes('matas@jarvisweb.lt') || new Set(raw.worker.recipients.map(s => s.toLowerCase())).size !== 2) fail('recipient-pair-unresolved');
      try { validateLaunchConfig(raw, { code: site, domain, pendingWorker: raw.worker.configured === false }); }
      catch { fail('launch-config-invalid'); }
      result.config = raw.worker.configured ? 'schema-valid-live-claim-unverified' : 'schema-valid-worker-pending';
      const hostingPath = safePath(root, 'launch/hosting-preparation-2026-10-25.json', 'file');
      const hosting = json(hostingPath);
      if (hosting.projectId !== projectId || hosting.name !== project || hosting.pagesHostname !== `${project}.pages.dev` || hosting.productionBranch !== 'main') fail('hosting-identity-mismatch');
      result.hosting = 'existing-project-record-only';
      const inputsHash = treeHash(frontend, [`previews/${slug}.json`, `public/previews/${slug}`]);
      const fingerprintNow = () => sha(JSON.stringify({ version: 1, identity, frontend, commit, sourceHash: treeHash(frontend, ['src', 'scripts', 'package.json', 'package-lock.json', 'astro.config.mjs']), toolHash,
        inputsHash: treeHash(frontend, [`previews/${slug}.json`, `public/previews/${slug}`]), configHash: sha(readFileSync(config)), hostingHash: sha(readFileSync(hostingPath)), node: process.version }));
      const fingerprint = sha(JSON.stringify({ version: 1, identity, frontend, commit, sourceHash, toolHash, inputsHash, configHash: sha(readFileSync(config)), hostingHash: sha(readFileSync(hostingPath)), node: process.version }));
      result.fingerprint = fingerprint;
      result.gates = evidenceGates(root, safePath(root, 'launch/gate-evidence.json'), identity, fingerprint);
      const stateDir = safePath(root, 'launch/batch-orchestration');
      const statePath = safePath(root, 'launch/batch-orchestration/state.json');
      const outputRel = `client-sites/${slug}`;
      const output = safePath(frontend, outputRel);
      const previous = loadState(statePath);
      const matching = previous?.fingerprint === fingerprint && JSON.stringify(previous.identity) === JSON.stringify(identity);
      const reusable = matching && previous.status === 'checked' && previous.check?.candidate === true && previous.build?.status === 'success' && existsSync(output) && previous.build.outputHash === treeHash(frontend, [outputRel]);
      result.receipt = previous ? (reusable ? 'current' : 'stale-or-unsuccessful') : 'absent';
      if (mode !== 'plan') {
        mkdirSync(stateDir, { recursive: true, mode: 0o700 });
        lock = safePath(root, 'launch/batch-orchestration/active.lock');
        try { const fd = openSync(lock, 'wx', 0o600); writeFileSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString() })); closeSync(fd); }
        catch { lock = undefined; fail('client-already-running'); }
        // Re-read state after acquiring the lock. If another run replaced it, retry explicitly.
        if (JSON.stringify(loadState(statePath)) !== JSON.stringify(previous)) fail('receipt-changed-during-preflight');
        const runId = `${Date.now()}-${randomUUID()}`;
        const state = { version: 1, identity, fingerprint, at: new Date().toISOString(), mode, status: 'running',
          build: reusable ? previous.build : { status: 'unbound' }, gates: result.gates };
        // Keep each run's receipt as well as the resumable latest pointer.
        const save = () => { atomicJson(join(stateDir, `${runId}.json`), state); atomicJson(statePath, state); };
        save();
        if (mode === 'build' && !(resume && reusable)) {
          state.build = { status: 'running' }; save();
          const ok = execute(frontend, 'scripts/client-site.mjs', [preview, '--site', site, '--domain', domain, '--config', config,
            ...(raw.worker.configured === false ? ['--pending-worker'] : [])], join(stateDir, `${runId}-build.log`));
          if (!ok) { state.build = { status: 'failed' }; state.status = 'failed'; save(); fail('local-build-failed'); }
          state.build = { status: 'success', outputHash: treeHash(frontend, [outputRel]) }; save();
        }
        const candidate = execute(frontend, 'scripts/client-site-deploy-check.mjs', [output, '--allow-pending-worker'], join(stateDir, `${runId}-candidate.log`));
        const production = execute(frontend, 'scripts/client-site-deploy-check.mjs', [output], join(stateDir, `${runId}-production.log`));
        state.check = { candidate, production };
        if (fingerprintNow() !== fingerprint) { state.status = 'failed'; state.build = { status: 'stale' }; save(); fail('inputs-changed-during-run'); }
        state.status = candidate ? 'checked' : 'failed'; save();
        if (!candidate) fail('local-artifact-check-failed');
        result.local = state.build.status !== 'success' ? 'checked-unbound-output' : production ? 'production-artifact-checked' : 'candidate-checked-worker-pending';
        if (resume && reusable) result.resumed = true;
        result.receipt = 'written';
      } else if (reusable) result.local = previous.check.production ? 'hash-bound-production-artifact-record' : 'hash-bound-candidate-record';
      // Local production output is still not proof of deployment, inbox delivery or approval.
      if (result.gates.gbpExternalVerification !== 'operator-attested') result.issues.push('gbp-external-verification-pending-separate-from-trial');
      if (!result.local.includes('production') || Object.entries(result.gates).some(([name, status]) => name !== 'gbpExternalVerification' && status !== 'operator-attested')) result.issues.push('launch-gates-pending');
      else result.status = 'evidence-recorded-awaiting-lead-review';
    } catch (error) {
      result.status = 'failed';
      result.issues.push(error instanceof LaunchError ? error.code : 'client-input-or-io-error');
    } finally { if (lock) unlinkSync(lock); }
    results.push(result);
  }
  return { version: 1, mode, frontendCommit: commit, sourceHash, toolHash, clients: results,
    exitCode: results.some(r => r.status === 'failed') ? 1 : results.some(r => r.status === 'pending') ? 2 : 0 };
}
