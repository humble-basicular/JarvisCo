/* Explicit private configuration for v3 standalone builds. Preview data cannot
   authorize a controller identity, retention policy, Worker site, or recipients. */
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pending = /\b(?:todo|tbd|pending|unknown|unresolved|placeholder)\b|(?:^|\s)\?+(?:$|\s)/i;
const fact = (value, field, max = 2000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || pending.test(value)) throw new Error(`launch config: ${field} is required and must be resolved`);
  return value.trim();
};
const mail = (value, field) => { const out = fact(value, field, 254); if (!email.test(out)) throw new Error(`launch config: ${field} must be an email`); return out; };
/* pendingWorker: a launch candidate built before the infra stage registers the Worker site.
   The config must say worker.configured=false; the manifest records it and the deploy check refuses it. */
export function validateLaunchConfig(raw, { code, domain, test = false, pendingWorker = false }) {
  const enabled = ['meselektra', 'vensland'].includes(code);
  const key = raw?.publicWidget?.sitekey;
  if (raw?.publicWidget && !enabled) throw new Error('publicWidget only supports meselektra/vensland');
  if (enabled && !test && (typeof key !== 'string' || !/^[A-Za-z0-9_-]{20,100}$/.test(key) || /^1x|^2x|^3x/.test(key))) throw new Error('production requires a real publicWidget.sitekey');
  const publicWidget = enabled ? { sitekey: test ? '1x00000000000000000000AA' : key } : undefined;
  if (!raw) {
    if (test) return { mapMode: 'disabled', ...(publicWidget ? { publicWidget } : {}) };
    throw new Error('v3 production requires --config <private-launch-config.json> (privacy, map mode, Worker configuration and recipients)');
  }
  if (!['consent', 'disabled'].includes(raw.mapMode)) throw new Error('launch config: mapMode must be consent or disabled');
  const p = raw.privacy;
  if (!p) throw new Error('launch config: privacy is required');
  const privacy = {
    controller: { name: fact(p.controller?.name, 'privacy.controller.name', 160), email: mail(p.controller?.email, 'privacy.controller.email'), ...(p.controller?.code ? { code: fact(p.controller.code, 'privacy.controller.code', 40) } : {}) },
    processor: { name: fact(p.processor?.name, 'privacy.processor.name', 200), email: mail(p.processor?.email, 'privacy.processor.email') },
    ...Object.fromEntries(['retention', 'legalBasis', 'rights', 'hosting', 'updatedAt'].map((key) => [key, fact(p[key], `privacy.${key}`)])),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(privacy.updatedAt) || !Number.isFinite(Date.parse(privacy.updatedAt))) throw new Error('launch config: privacy.updatedAt must be YYYY-MM-DD');
  // Addresses are deliberately outside the publication interface. Never publish a home address from legal/address input.
  if (p.controller?.address != null || p.processor?.address != null) throw new Error('launch config: address publication is not supported; omit private addresses');
  if (!test) {
    const w = raw.worker;
    // Both hosts serve the site (www redirects can't be assumed), so the Worker must accept both origins.
    const hosts = domain.startsWith('www.') ? [domain, domain.slice(4)] : [domain, `www.${domain}`];
    if (!w || w.configured !== !pendingWorker || w.site !== code || !Array.isArray(w.origins) || !hosts.every((h) => w.origins.includes(`https://${h}`)) || !w.origins.every((x) => { try { const u = new URL(x); return u.protocol === 'https:' && u.origin === x; } catch { return false; } })) throw new Error('launch config: confirmed Worker site/origins must match this build');
    if (!Array.isArray(w.recipients) || !w.recipients.length || !w.recipients.every((x) => typeof x === 'string' && email.test(x) && !pending.test(x))) throw new Error('launch config: confirmed notification recipients are required');
  }
  return { ...(publicWidget ? { publicWidget } : {}), privacy, mapMode: raw.mapMode, workerRegistered: !test && !pendingWorker };
}
