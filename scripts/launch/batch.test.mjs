import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { runBatch } from './batch.mjs';
import { acceptedFrontend, clients, gateNames } from './clients.mjs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const write = (path, data) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, typeof data === 'string' ? data : JSON.stringify(data)); };
// The tooling checkout intentionally lacks the accepted frontend; read the real validator from its git object.
const validatorRead = spawnSync('git', ['show', `${acceptedFrontend}:src/templates/v3/build-config.mjs`],
  { cwd: fileURLToPath(new URL('../..', import.meta.url)), encoding: 'utf8' });
assert.equal(validatorRead.status, 0, 'accepted frontend commit must exist locally');
// Synthetic executables deliberately prove cwd, client identity, partial failures and argument mode.
const builder = `import {appendFileSync,existsSync,mkdirSync,readFileSync,renameSync,unlinkSync,writeFileSync} from 'node:fs';
import {join,basename,dirname} from 'node:path';
const a=process.argv.slice(2), flag=n=>a[a.indexOf(n)+1], site=flag('--site');
if (!existsSync('FRONTEND-SENTINEL') || process.env.INIT_CWD !== process.cwd()) process.exit(8);
appendFileSync('build-invocations',site+'\\n');
if (existsSync('remove-lock-'+site)) unlinkSync(join(dirname(flag('--config')),'batch-orchestration/active.lock'));
if (existsSync('replace-lock-'+site)) {
 const lock=join(dirname(flag('--config')),'batch-orchestration/active.lock');
 renameSync(lock,lock+'.preserved'); writeFileSync(lock,'unknown replacement lock');
}
if (existsSync('fail-'+site)) { console.error('PRIVATE-DO-NOT-LEAK'); process.exit(7); }
if (existsSync('mutate-'+site)) writeFileSync(a[0],readFileSync(a[0],'utf8')+' ');
const output=join('client-sites',basename(a[0],'.json')); mkdirSync(output,{recursive:true});
writeFileSync(join(output,'artifact.json'),JSON.stringify({site,domain:flag('--domain'),pending:a.includes('--pending-worker')}));
`;
const checker = `import {existsSync,readFileSync} from 'node:fs'; import {join} from 'node:path';
try {const d=JSON.parse(readFileSync(join(process.argv[2],'artifact.json')));
if(existsSync('check-fail-'+d.site)) process.exit(5);
if(d.pending&&!process.argv.includes('--allow-pending-worker')) process.exit(1);
} catch { process.exit(4); }
`;

async function fixture(fn) {
  const root = mkdtempSync(join(tmpdir(), 'client-launch-test-'));
  try {
  const frontend = join(root, 'selected-frontend');
  const privateRoot = join(root, 'private');
  mkdirSync(frontend); mkdirSync(privateRoot);
  write(join(frontend, 'package.json'), { type: 'module' });
  write(join(frontend, '.gitignore'), 'previews/\npublic/previews/\nclient-sites/\nnode_modules/\n');
  write(join(frontend, 'package-lock.json'), { lockfileVersion: 3 });
  write(join(frontend, 'scripts/client-site.mjs'), builder);
  write(join(frontend, 'scripts/client-site-deploy-check.mjs'), checker);
  write(join(frontend, 'src/templates/v3/build-config.mjs'), validatorRead.stdout);
  write(join(frontend, 'FRONTEND-SENTINEL'), 'yes');
  const path = (client, file) => join(privateRoot, client.folder, file);
  for (const client of clients) {
    write(join(frontend, `previews/${client.slug}.json`), { slug: client.slug, v3: {} });
    write(join(frontend, `public/previews/${client.slug}/1.jpg`), 'synthetic media');
    const origins = [`https://${client.domain}`, `https://www.${client.domain}`];
    write(path(client, client.config), { mapMode: 'disabled', privacy: {
      controller: { name: 'Synthetic Controller', email: 'client@example.com' }, processor: { name: 'Synthetic Processor', email: 'processor@example.com' },
      retention: '30 days', legalBasis: 'Consent', rights: 'Contact controller', hosting: 'Synthetic hosting', updatedAt: '2026-10-25',
    }, worker: { configured: false, site: client.site, origins, recipients: ['client@example.com', 'matas@jarvisweb.lt'] } });
    write(path(client, 'launch/hosting-preparation-2026-10-25.json'), { projectId: client.projectId, name: client.project, pagesHostname: `${client.project}.pages.dev`, productionBranch: 'main' });
  }
  for (const args of [['init', '-q'], ['add', '.'], ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'synthetic frontend']]) {
    assert.equal(spawnSync('git', args, { cwd: frontend }).status, 0);
  }
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: frontend, encoding: 'utf8' }).stdout.trim();
  const options = { frontend, privateRoot, expectCommit: commit };
  const run = (extra = {}) => runBatch({ ...options, ...extra }, { requiredAncestor: commit });
  await fn({ root, frontend, privateRoot, path, options, run, commit }); }
  finally { rmSync(root, { recursive: true, force: true }); }
}

test('default plan is read-only, resolves all known identities and never infers gates', () => fixture(async ({ run, frontend, path }) => {
  const result = await run();
  assert.equal(result.exitCode, 2);
  assert.equal(result.clients.length, 4);
  for (const c of result.clients) {
    assert.equal(c.config, 'schema-valid-worker-pending');
    assert.ok(Object.values(c.gates).every(g => g === 'pending'));
    assert.equal(existsSync(path(clients.find(x => x.site === c.site), 'launch/batch-orchestration')), false);
  }
  assert.equal(existsSync(join(frontend, 'build-invocations')), false);
}));

test('missing config stays pending; malformed private config fails without leaking values', () => fixture(async ({ run, path }) => {
  rmSync(path(clients[0], clients[0].config));
  write(path(clients[1], clients[1].config), '{PRIVATE-DO-NOT-LEAK');
  const result = await run();
  assert.equal(result.exitCode, 1);
  assert.equal(result.clients[0].status, 'pending');
  assert.deepEqual(result.clients[0].issues, ['launch-config-missing']);
  assert.equal(result.clients[1].status, 'failed');
  assert.equal(result.clients[2].config, 'schema-valid-worker-pending');
  assert.ok(!JSON.stringify(result).includes('PRIVATE-DO-NOT-LEAK'));
}));

test('batch failure is isolated and resume retries failed client while rechecking successes', () => fixture(async ({ run, frontend, path }) => {
  write(join(frontend, 'fail-meselektra'), 'fail');
  const first = await run({ mode: 'build' });
  assert.equal(first.exitCode, 1);
  assert.equal(first.clients[0].status, 'failed');
  for (const c of first.clients.slice(1)) assert.equal(c.local, 'candidate-checked-worker-pending');
  assert.equal(read(path(clients[0], 'launch/batch-orchestration/state.json')).build.status, 'failed');
  assert.equal(statSync(path(clients[1], 'launch/batch-orchestration/state.json')).mode & 0o777, 0o600);
  rmSync(join(frontend, 'fail-meselektra'));
  const resumed = await run({ mode: 'build', resume: true });
  assert.equal(resumed.exitCode, 2);
  assert.equal(resumed.clients[0].resumed, undefined);
  assert.ok(resumed.clients.slice(1).every(c => c.resumed));
  assert.equal(readFileSync(join(frontend, 'build-invocations'), 'utf8').trim().split('\n').length, 5);
  assert.ok(!JSON.stringify(first).includes('PRIVATE-DO-NOT-LEAK'));
}));

for (const change of ['config', 'source', 'preview', 'media', 'output']) {
  test(`resume invalidates changed ${change} bytes`, () => fixture(async ({ run, frontend, path }) => {
    await run({ mode: 'build', selection: 'meselektra' });
    const file = change === 'config' ? path(clients[0], clients[0].config) : join(frontend, {
      source: 'scripts/client-site.mjs', preview: `previews/${clients[0].slug}.json`, media: `public/previews/${clients[0].slug}/1.jpg`, output: `client-sites/${clients[0].slug}/artifact.json`,
    }[change]);
    writeFileSync(file, readFileSync(file, 'utf8') + ' ');
    const result = await run({ mode: 'build', resume: true, selection: 'meselektra', allowDirty: change === 'source' });
    assert.equal(result.clients[0].resumed, undefined);
    assert.equal(result.clients[0].local, 'candidate-checked-worker-pending');
    assert.equal(readFileSync(join(frontend, 'build-invocations'), 'utf8').trim().split('\n').length, 2);
  }));
}

test('check never labels unbound existing artifacts as a current build', () => fixture(async ({ run, frontend }) => {
  write(join(frontend, `client-sites/${clients[0].slug}/artifact.json`), { site: 'meselektra', pending: false });
  const result = await run({ mode: 'check', selection: 'meselektra' });
  assert.equal(result.clients[0].local, 'checked-unbound-output');
  assert.equal(result.exitCode, 2);
  assert.equal(existsSync(join(frontend, 'build-invocations')), false);
}));

test('check failure invalidates resume, and mid-build input changes cannot become success', () => fixture(async ({ run, frontend, path }) => {
  await run({ mode: 'build', selection: 'meselektra' });
  write(join(frontend, 'check-fail-meselektra'), 'fail');
  assert.equal((await run({ mode: 'check', selection: 'meselektra' })).exitCode, 1);
  rmSync(join(frontend, 'check-fail-meselektra'));
  assert.equal((await run({ mode: 'build', resume: true, selection: 'meselektra' })).clients[0].resumed, undefined);
  write(join(frontend, 'mutate-meselektra'), 'mutate');
  const changed = await run({ mode: 'build', selection: 'meselektra' });
  assert.ok(changed.clients[0].issues.includes('inputs-changed-during-run'));
  assert.equal(read(path(clients[0], 'launch/batch-orchestration/state.json')).build.status, 'stale');
}));

test('explicit commit and approved lineage are required; CLI refuses divergent integration checkout', () => fixture(async ({ run, options, commit }) => {
  await assert.rejects(run({ expectCommit: '0000000' }));
  await assert.rejects(run({ frontend: undefined }), /explicit-frontend/);
  await assert.rejects(run({ selection: 'meselektra,unknown' }), /unknown-or-duplicate/);
  await assert.rejects(run({ selection: 'laikam,laikam' }), /unknown-or-duplicate/);
  await assert.rejects(runBatch(options), /frontend-lineage-mismatch/); // fixture lacks accepted frontend ancestor
  const cli = spawnSync(process.execPath, [fileURLToPath(new URL('../client-launch.mjs', import.meta.url)),
    '--frontend', options.frontend, '--expect-commit', commit, '--private-root', options.privateRoot], { encoding: 'utf8' });
  assert.equal(cli.status, 1);
  assert.ok(!cli.stderr.includes(options.privateRoot));
}));

test('dirty scoped source is visible; build/check require explicit opt-in and receipts expose hashes/count', () => fixture(async ({ run, frontend, path }) => {
  write(join(frontend, 'src/new-private-name.mjs'), '// synthetic untracked source');
  writeFileSync(join(frontend, 'scripts/client-site.mjs'), builder + '\n// dirty tracked source');
  const plan = await run({ selection: 'meselektra' });
  assert.equal(plan.frontendDirty, true);
  assert.equal(plan.frontendDirtyCount, 2);
  assert.match(plan.clients[0].inputsHash, /^[a-f0-9]{64}$/);
  assert.equal(plan.clients[0].outputHash, null);
  assert.ok(!JSON.stringify(plan).includes('new-private-name'));
  for (const mode of ['build', 'check']) await assert.rejects(run({ mode }), /frontend-dirty-requires-allow-dirty/);
  assert.equal(existsSync(path(clients[0], 'launch/batch-orchestration')), false);
  const built = await run({ mode: 'build', allowDirty: true, selection: 'meselektra' });
  assert.equal(built.clients[0].local, 'candidate-checked-worker-pending');
  const receipt = read(path(clients[0], 'launch/batch-orchestration/state.json'));
  assert.equal(receipt.frontendDirty, true); assert.equal(receipt.frontendDirtyCount, 2);
  assert.equal(receipt.allowDirty, true);
  assert.equal(receipt.inputsHash, built.clients[0].inputsHash);
  assert.equal(receipt.outputHash, built.clients[0].outputHash);
  assert.match(receipt.outputHash, /^[a-f0-9]{64}$/);
}));

test('ignored generated preview/media/output and node_modules do not dirty scoped source', () => fixture(async ({ run, frontend }) => {
  write(join(frontend, 'node_modules/synthetic-package/index.js'), '// generated');
  writeFileSync(join(frontend, `previews/${clients[0].slug}.json`), JSON.stringify({ slug: clients[0].slug, v3: {}, generated: true }));
  const result = await run({ mode: 'build', selection: 'meselektra' });
  assert.equal(result.frontendDirty, false); assert.equal(result.frontendDirtyCount, 0);
  assert.equal(result.clients[0].local, 'candidate-checked-worker-pending');
  assert.equal((await run()).frontendDirtyCount, 0);
}));

test('normalized/case-alias runner files and factual inputs cannot attest external gates', () => fixture(async ({ run, path }) => {
  // MAS keeps the config under launch, MesElektra under launch-2026-10-24.
  for (const client of [clients[0], clients[2]]) {
    const first = (await run({ mode: 'build', selection: client.site })).clients[0];
    const identity = Object.fromEntries(['site', 'slug', 'domain', 'project', 'projectId'].map(k => [k, first[k]]));
    const stateDir = path(client, 'launch/batch-orchestration');
    const log = readdirSync(stateDir).find(name => name.endsWith('-build.log'));
    write(join(stateDir, 'active.lock'), 'synthetic removed-by-operator lock');
    write(path(client, 'client-sites/synthetic-output.html'), 'synthetic build output');
    const evidencePath = path(client, 'launch/gate-evidence.json');
    write(evidencePath, '{}');
    const references = [
      ['launch/batch-orchestration/state.json', 'launch/batch-orchestration/state.json'],
      [`launch/batch-orchestration/${log}`, `launch/batch-orchestration/${log}`],
      ['launch/batch-orchestration/active.lock', 'launch/batch-orchestration/active.lock'],
      ['launch/../launch/./batch-orchestration/state.json', 'launch/batch-orchestration/state.json'],
      ['LAUNCH/BATCH-ORCHESTRATION/STATE.JSON', 'launch/batch-orchestration/state.json'],
      [client.config, client.config],
      [`launch/../${client.config}`, client.config],
      [client.config.toUpperCase(), client.config],
      ['launch/hosting-preparation-2026-10-25.json', 'launch/hosting-preparation-2026-10-25.json'],
      ['launch/./hosting-preparation-2026-10-25.json', 'launch/hosting-preparation-2026-10-25.json'],
      ['LAUNCH/HOSTING-PREPARATION-2026-10-25.JSON', 'launch/hosting-preparation-2026-10-25.json'],
      ['launch/gate-evidence.json', 'launch/gate-evidence.json'],
      ['launch/../LAUNCH/GATE-EVIDENCE.JSON', 'launch/gate-evidence.json'],
      ['client-sites/synthetic-output.html', 'client-sites/synthetic-output.html'],
    ];
    for (const [reference, actual] of references) {
      write(evidencePath, { version: 1, identity, fingerprint: first.fingerprint, gates: { workerLiveRegistration: {
        status: 'confirmed', checkedAt: '2026-10-24T12:00:00Z', files: [{ path: reference,
          sha256: createHash('sha256').update(readFileSync(path(client, actual))).digest('hex') }],
      } } });
      const result = (await run({ selection: client.site })).clients[0];
      assert.equal(result.status, 'failed', reference);
      assert.ok(result.issues.includes('runner-file-not-external-evidence'), reference);
      assert.equal(result.gates.workerLiveRegistration, 'pending');
    }
  }
}));

for (const action of ['remove', 'replace']) {
  test(`${action}d owned lock cannot abort other clients or delete a replacement lock`, () => fixture(async ({ run, path, frontend }) => {
    // MAS's config is in launch/, so the synthetic builder can locate its receipt lock.
    write(join(frontend, `${action}-lock-masaukstalipiai`), 'simulate operator intervention');
    const result = await run({ mode: 'build', selection: 'masaukstalipiai,vensland' });
    assert.equal(result.exitCode, 1);
    assert.ok(result.clients[0].issues.includes('client-lock-lost-during-run'));
    assert.equal(read(path(clients[2], 'launch/batch-orchestration/state.json')).status, 'failed');
    assert.equal(result.clients[1].local, 'candidate-checked-worker-pending');
    const lock = path(clients[2], 'launch/batch-orchestration/active.lock');
    if (action === 'replace') assert.equal(readFileSync(lock, 'utf8'), 'unknown replacement lock');
    else assert.equal(existsSync(lock), false);
  }));
}

test('CLI help describes review-only exit zero, dirty override and no inferred launch', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../client-launch.mjs', import.meta.url)), '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--allow-dirty/);
  assert.match(result.stdout, /awaiting lead review/);
  assert.match(result.stdout, /GBP verification may be pending; no live launch inferred/);
});

test('mismatched identities, symlinks, active locks and corrupt receipts fail per client', () => fixture(async ({ run, path, frontend }) => {
  const hosting = path(clients[0], 'launch/hosting-preparation-2026-10-25.json');
  const record = read(hosting); record.projectId = clients[1].projectId; write(hosting, record);
  const config = path(clients[1], clients[1].config); rmSync(config); symlinkSync(path(clients[2], clients[2].config), config);
  write(path(clients[2], 'launch/batch-orchestration/active.lock'), 'operator must inspect');
  write(path(clients[3], 'launch/batch-orchestration/state.json'), 'broken');
  const result = await run({ mode: 'build' });
  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.clients.map(c => c.issues[0]), ['hosting-identity-mismatch', 'symlink-refused', 'client-already-running', 'invalid-receipt']);
  assert.equal(existsSync(join(frontend, 'build-invocations')), false);
  assert.ok(existsSync(path(clients[2], 'launch/batch-orchestration/active.lock')));
}));

test('external gates need hash-bound evidence; pending GBP verification does not block working-launch evidence', () => fixture(async ({ run, path, frontend }) => {
  const configFile = path(clients[0], clients[0].config);
  const config = read(configFile); config.worker.configured = true; write(configFile, config);
  const first = await run({ mode: 'build', selection: 'meselektra' });
  const c = first.clients[0];
  const identity = Object.fromEntries(['site', 'slug', 'domain', 'project', 'projectId'].map(k => [k, c[k]]));
  const proof = 'Synthetic human-reviewed evidence, not a real gate receipt';
  write(path(clients[0], 'launch/synthetic-proof.txt'), proof);
  const evidence = { version: 1, identity, fingerprint: c.fingerprint, gates: Object.fromEntries(gateNames.filter(n => n !== 'gbpExternalVerification').map(n => [n, {
    status: 'confirmed', checkedAt: '2026-10-24T12:00:00Z', files: [{ path: 'launch/synthetic-proof.txt', sha256: createHash('sha256').update(proof).digest('hex') }],
  }])) };
  const evidencePath = path(clients[0], 'launch/gate-evidence.json'); write(evidencePath, evidence);
  const ready = await run({ selection: 'meselektra' });
  assert.equal(ready.exitCode, 0);
  assert.equal(ready.clients[0].status, 'evidence-recorded-awaiting-lead-review');
  assert.equal(ready.clients[0].gates.gbpExternalVerification, 'pending');
  const scriptPath = join(frontend, 'scripts/client-site.mjs');
  const originalScript = readFileSync(scriptPath, 'utf8');
  write(scriptPath, originalScript + '\n// actual source change invalidates every gate');
  const sourceStale = await run({ selection: 'meselektra' });
  assert.equal(sourceStale.frontendDirty, true);
  assert.ok(Object.values(sourceStale.clients[0].gates).every(s => s === 'stale'));
  write(scriptPath, originalScript);
  evidence.fingerprint = 'old'; write(evidencePath, evidence);
  const stale = await run({ selection: 'meselektra' });
  assert.equal(stale.exitCode, 2);
  assert.ok(Object.values(stale.clients[0].gates).every(s => s === 'stale'));
  evidence.fingerprint = c.fingerprint; write(evidencePath, evidence);
  write(path(clients[0], 'launch/synthetic-proof.txt'), 'changed');
  assert.equal((await run({ selection: 'meselektra' })).clients[0].issues[0], 'gate-evidence-hash-mismatch');
}));
