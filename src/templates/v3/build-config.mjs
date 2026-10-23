/* Explicit private configuration for v3 standalone builds. Preview data cannot
   authorize a controller identity, retention policy, Worker site, or recipients. */
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pending = /\b(?:todo|tbd|pending|unknown|unresolved|placeholder)\b|(?:^|\s)\?+(?:$|\s)/i;
const fact = (value, field, max = 2000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || pending.test(value)) throw new Error(`launch config: ${field} is required and must be resolved`);
  return value.trim();
};
const mail = (value, field) => { const out = fact(value, field, 254); if (!email.test(out)) throw new Error(`launch config: ${field} must be an email`); return out; };
export function validateLaunchConfig(raw, { code, domain, test = false }) {
  if (!raw) {
    if (test) return { mapMode: 'disabled' };
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
    if (!w || w.configured !== true || w.site !== code || !Array.isArray(w.origins) || !w.origins.includes(`https://${domain}`) || !w.origins.every((x) => { try { const u = new URL(x); return u.protocol === 'https:' && u.origin === x; } catch { return false; } })) throw new Error('launch config: confirmed Worker site/origins must match this build');
    if (!Array.isArray(w.recipients) || !w.recipients.length || !w.recipients.every((x) => typeof x === 'string' && email.test(x) && !pending.test(x))) throw new Error('launch config: confirmed notification recipients are required');
  }
  return { privacy, mapMode: raw.mapMode };
}
