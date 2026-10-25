import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const runbook = await readFile(new URL('../../docs/launch/RUNBOOK.md', import.meta.url), 'utf8');
// Execute the documented validator itself, against synthetic local TOML/JSON.
const validator = runbook.match(/node --input-type=module - "\$LAUNCH_PRIVATE" "\$PROD" <<'JS'\n([\s\S]*?)\nJS/)[1];
const requestedOwner = 'matas@jarvisweb.lt'; // Public requested alias, no private client addresses.

async function validate(change = () => {}) {
  const dir = await mkdtemp(join(tmpdir(), 'launch-runbook-'));
  try {
    const routes = Object.fromEntries(['meselektra', 'laikam', 'masaukstalipiai', 'vensland']
      .map(site => [site, [`${site}@example.com`, requestedOwner]]));
    const fixture = { routes, owner: 'legacy-owner@example.com', ownerSecret: false,
      allowed: [...new Set(Object.values(routes).flat()), 'legacy-owner@example.com'] };
    change(fixture);
    const config = join(dir, 'production.toml');
    await writeFile(config, [
      'name = "local-validator-test"', 'send_metrics = false',
      '[[send_email]]', 'name = "FORM_EMAIL"',
      `allowed_destination_addresses = ${JSON.stringify(fixture.allowed)}`,
      ...(fixture.ownerSecret ? [] : ['[vars]', `FORM_ALERT_TO = ${JSON.stringify(fixture.owner)}`]), '',
    ].join('\n'));
    await writeFile(join(dir, 'site-recipients.json'), JSON.stringify(fixture.routes));
    if (fixture.ownerSecret) await writeFile(join(dir, 'owner-recipient.json'), JSON.stringify(fixture.owner));
    const result = spawnSync(process.execPath, ['--input-type=module', '-', dir, config], {
      input: validator, cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 10_000,
    });
    assert.ifError(result.error);
    if (result.status === 0) {
      const secret = JSON.parse(await readFile(join(dir, 'recipient-secret.json'), 'utf8'));
      assert.deepEqual(JSON.parse(secret.FORM_SITE_RECIPIENTS), fixture.routes);
    } else {
      await assert.rejects(readFile(join(dir, 'recipient-secret.json')), { code: 'ENOENT' });
    }
    return result;
  } finally { await rm(dir, { recursive: true, force: true }); }
}

test('runbook validator accepts actual allowlist TOML and owner variable', async () => {
  const result = await validate();
  assert.equal(result.status, 0, result.stderr);
});

test('runbook validator accepts the private owner-secret fallback', async () => {
  const result = await validate(fixture => { fixture.ownerSecret = true; });
  assert.equal(result.status, 0, result.stderr);
});

for (const [label, mailbox] of [['quotes', '"client"@example.com'], ['non-ASCII', 'žmogus@example.com'],
  ['missing TLD', 'client@localhost'], ['over 254 characters', `${'a'.repeat(243)}@example.com`]]) {
  test(`runbook validator rejects ${label} in a routed mailbox`, async () => {
    const result = await validate(fixture => { fixture.routes.meselektra[0] = mailbox; });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid route mailboxes/);
    assert.ok(!result.stderr.includes(mailbox));
  });
}

test('runbook validator rejects a routed client absent from the binding allowlist', async () => {
  const result = await validate(fixture => { fixture.allowed = fixture.allowed.filter(to => to !== fixture.routes.meselektra[0]); });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Every routed recipient must be explicitly allowlisted/);
});

test('runbook validator checks retained routes outside the launch subset', async () => {
  const result = await validate(fixture => { fixture.routes.arbcut = ['retained-client@example.com']; });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Every routed recipient must be explicitly allowlisted/);
});

test('runbook validator rejects the legacy owner absent from the binding allowlist', async () => {
  const result = await validate(fixture => { fixture.allowed = fixture.allowed.filter(to => to !== fixture.owner); });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Owner must be valid and explicitly allowlisted/);
});
