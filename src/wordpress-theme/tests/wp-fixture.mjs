/* Helpers for the LOCAL synthetic WordPress fixture (127.0.0.1 only). Reads runtime.json/auth.json from the private
   acceptance folder and never prints cookies, passwords or nonces. Refuses any non-loopback base URL. */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const ACCEPTANCE = process.env.VENSLAND_WP_ACCEPTANCE ?? join(homedir(), 'Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews/vensland/wordpress-trial-20261025/acceptance');
export const rt = JSON.parse(readFileSync(join(ACCEPTANCE, 'runtime.json'), 'utf8'));
export const auth = JSON.parse(readFileSync(join(ACCEPTANCE, 'auth.json'), 'utf8'));
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(rt.baseUrl)) throw new Error('fixture must be loopback');
export const BASE = rt.baseUrl;
export const THEME = rt.theme;
export const CORE = rt.core;
export const UUID = auth.changesetUuid;

export const cookieHeader = () => Object.entries(auth.cookies).map(([k, v]) => `${k}=${v}`).join('; ');

/** Raw HTTP to the fixture. opts.auth=true sends the synthetic admin cookies; opts.nonce adds the preview nonce as a field. */
export async function req(path, opts = {}) {
  const headers = { ...(opts.headers ?? {}) };
  if (opts.auth) headers.cookie = cookieHeader();
  let body;
  if (opts.form) { const f = new URLSearchParams(opts.form); if (opts.nonceField) f.set(opts.nonceField, opts.nonceValue ?? auth.previewNonce); body = f.toString(); headers['content-type'] = 'application/x-www-form-urlencoded'; }
  const r = await fetch(BASE + path, { method: opts.method ?? 'GET', headers, body, redirect: 'manual' });
  const text = await r.text();
  return { status: r.status, headers: r.headers, text, location: r.headers.get('location') };
}

export const previewQuery = (extra = {}) => new URLSearchParams({ customize_changeset_uuid: UUID, customize_theme: THEME, ...extra }).toString();
/** Core "wp_customize=on" shape (what customize-controls.js sends). */
export const coreQuery = () => new URLSearchParams({ wp_customize: 'on', customize_theme: THEME, nonce: auth.previewNonce, customize_changeset_uuid: UUID }).toString();

export function sql(query) {
  return execFileSync('mysql', ['-S', rt.socket, '-uroot', 'vensland_trial', '-N', '-B', '-e', query], { encoding: 'utf8' });
}
