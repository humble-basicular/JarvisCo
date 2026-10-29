// Opt-in only. Never extend the legacy CRM feed with these fields.
export interface SecurityConfig {
  TWO_SITE_SECURITY?: string;
  TURNSTILE_SECRET_MESELEKTRA?: string;
  TURNSTILE_SECRET_VENSLAND?: string;
}
export const SECURITY_SITES = ['meselektra', 'vensland'] as const;
export function securityMode(config: SecurityConfig, site: string | null): 'off' | 'observe' | 'enforce' {
  if (!site || !SECURITY_SITES.includes(site as typeof SECURITY_SITES[number])) return 'off';
  if (!config.TWO_SITE_SECURITY) return 'off';
  const modes: unknown = JSON.parse(config.TWO_SITE_SECURITY);
  if (!modes || typeof modes !== 'object' || Array.isArray(modes)
    || Object.entries(modes).some(([key, mode]) => !SECURITY_SITES.includes(key as typeof SECURITY_SITES[number]) || !['observe', 'enforce'].includes(mode))) throw new Error('Invalid security config');
  return (modes as Record<string, 'observe' | 'enforce'>)[site] ?? 'off';
}
export const SOURCES = ['GoogleAds', 'organicGoogle', 'Bing', 'ChatGPT', 'Perplexity', 'Copilot', 'Gemini', 'Claude', 'social', 'utm', 'directunknown', 'otherhost'] as const;
export interface InquiryContext { source: string; page: string | null; landing_path: string | null; elapsed_ms: number | null }
// Restrict to path characters; exclude encoded queries, controls, URLs and double slash.
export function safePath(value: string | null): string | null {
  if (!value || value.length > 120 || !/^\/(?!\/)[a-zA-Z0-9/_~.%-]*$/.test(value)) return null;
  try {
    const decoded = decodeURIComponent(value);
    return /[%?#\\\s\p{Cc}\p{Cf}:]/u.test(decoded) || decoded.startsWith('//') ? null : value;
  } catch { return null; }
}
export function inquiryContext(text: (key: string) => string | null): InquiryContext {
  const source = text('source');
  const elapsed = text('elapsed_ms');
  return { source: source && (SOURCES as readonly string[]).includes(source) ? source : 'directunknown',
    page: safePath(text('page')), landing_path: safePath(text('landing_path')),
    elapsed_ms: elapsed && /^\d{1,8}$/.test(elapsed) && Number(elapsed) <= 86400000 ? Number(elapsed) : null };
}
export type Verification = 'valid' | 'invalid' | 'unavailable' | 'hostname';
export async function verifyTurnstile(token: string | null, secret: string | undefined, origin: string,
  transport: typeof fetch = fetch): Promise<Verification> {
  if (!secret?.trim()) return 'unavailable';
  if (!token || token.length > 2048) return 'invalid';
  try {
    const response = await transport('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return 'unavailable';
    const result = await response.json() as { success?: unknown; hostname?: unknown; 'error-codes'?: unknown };
    if (typeof result.success !== 'boolean') return 'unavailable';
    if (!result.success) {
      const codes = result['error-codes'];
      return Array.isArray(codes) && codes.some(code => ['internal-error', 'missing-input-secret', 'invalid-input-secret', 'bad-request'].includes(code)) ? 'unavailable' : 'invalid';
    }
    return result.hostname === new URL(origin).hostname ? 'valid' : 'hostname';
  } catch { return 'unavailable'; }
}
export async function recordSecurity(db: D1Database, site: string, outcome: string, reason: string): Promise<void> {
  await db.prepare('INSERT INTO inquiry_security(site, outcome, reason) VALUES (?, ?, ?)').bind(site, outcome, reason).run();
}
