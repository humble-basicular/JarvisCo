/* Client accent → the colours the template actually paints, computed at build
   time so every client colour stays readable (WCAG 2.2 AA, 4.5:1 for text):
   - field / on: the accent as a colour field (hero, buttons, inquiry section)
     and the text on it. White when white reaches 4.5:1, else ink when ink
     does (light accents such as yellow keep their colour), else the accent is
     darkened until white text passes.
   - text: the accent as small text on paper (links, numbers, prices).
   - onInk: the accent on the dark process band and footer (big numerals).
   The contract test renders one dark, one light and one mid accent and
   measures the result in a browser. */

/** Base colours shared with heating.css (set as --hs-ink / --hs-bg by HeatingLayout). */
export const INK = '#1c2124';
export const BG = '#f5f0e8';
export const WHITE = '#ffffff';

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const hex = (c: Rgb) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const lin = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminance = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** `a` moved towards `b` by `t` (0–1) in sRGB, like color-mix(in srgb, …). */
export const mix = (a: string, b: string, t: number) => { const x = rgb(a); const y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t) as Rgb); };
/** The first step from `a` towards `b` that passes `ok` (the target itself at worst). */
function towards(a: string, b: string, ok: (c: string) => boolean): { color: string; t: number } {
  for (let i = 0; i <= 40; i++) { const color = mix(a, b, i / 40); if (ok(color)) return { color, t: i / 40 }; }
  return { color: b, t: 1 };
}

export interface AccentTokens {
  accent: string; field: string; on: string; hover: string; text: string; onInk: string;
  /** The main button on the colour field: white with ink text, or ink with white text on light accents. */
  fieldBtn: { bg: string; fg: string; num: string };
}

export function accentTokens(accent: string): AccentTokens {
  const a = accent.toLowerCase();
  let field = a;
  let on = WHITE;
  if (contrast(WHITE, a) < 4.5) {
    if (contrast(INK, a) >= 4.5) on = INK;
    else field = towards(a, '#000000', (c) => contrast(WHITE, c) >= 4.5).color;
  }
  // Hover moves away from the text colour, so it never lowers contrast.
  const hover = on === WHITE ? mix(field, '#000000', 0.14) : mix(field, WHITE, 0.24);
  // As text on paper: darkened towards ink; past halfway it turns muddy, so plain ink instead.
  const step = towards(a, INK, (c) => contrast(c, BG) >= 4.5);
  const text = step.t > 0.5 ? INK : step.color;
  const onInk = towards(a, WHITE, (c) => contrast(c, INK) >= 4.5).color;
  const fieldBtn = on === WHITE ? { bg: WHITE, fg: INK, num: text } : { bg: INK, fg: WHITE, num: field };
  return { accent: a, field, on, hover, text, onInk, fieldBtn };
}

/** CSS custom properties for :root. */
export const accentCss = (t: AccentTokens) =>
  `--hs-accent:${t.field};--hs-on-accent:${t.on};--hs-accent-hover:${t.hover};--hs-accent-text:${t.text};--hs-accent-on-ink:${t.onInk};--hs-field-btn:${t.fieldBtn.bg};--hs-field-btn-text:${t.fieldBtn.fg};--hs-field-btn-num:${t.fieldBtn.num};--hs-ink:${INK};--hs-bg:${BG}`;
