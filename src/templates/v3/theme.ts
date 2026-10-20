/* Theme card for template v3 (design plan 2026-10-20, "Theme system").
   Every site = fixed rules (section order, hero form, call bar, one heading font,
   one divider style, filled icons) + one theme card chosen from the client's trade
   archetype and feel. The card lives in previews/<slug>.json as `theme`; the human
   copy is Drive Business/JarvisWeb/previews/<slug>/THEME.md. */

export type Archetype = 'water' | 'heat' | 'outdoor' | 'heavy' | 'electric' | 'clean' | 'craft';
export type Divider = 'angle' | 'wave';
export type LogoShape = 'round' | 'shield';
export type HeadingFont = 'archivo-black';

export interface Theme {
  archetype: Archetype;
  /** Darkest section colour (hero overlay, process, footer). */
  base: string;
  /** Slightly lighter dark (top bar, cards on dark). */
  base2: string;
  /** CTA colour; white text must pass 4.5:1 on it. */
  accent: string;
  /** Accent for text/icons on the dark base (brighter, >= 4.5:1 on base). */
  accentHi: string;
  /** Light section tint. */
  paper: string;
  heading: HeadingFont;
  divider: Divider;
  logo: { shape: LogoShape; ring: string; line: string };
}

const HEADING_STACK: Record<HeadingFont, string> = {
  'archivo-black': "'V3 Head','V3 Head Fallback',Impact,'Arial Black',sans-serif",
};

export function themeCss(t: Theme): string {
  return [
    `--v3-base:${t.base}`,
    `--v3-base2:${t.base2}`,
    `--v3-accent:${t.accent}`,
    `--v3-accent-hi:${t.accentHi}`,
    `--v3-paper:${t.paper}`,
    `--v3-head:${HEADING_STACK[t.heading]}`,
  ].join(';');
}

/** Divider shapes, drawn on a 1440×64 box; the fill is the colour of the section below. */
export const DIVIDER_PATH: Record<Divider, string> = {
  angle: 'M0 64 L1440 0 L1440 64 Z',
  wave: 'M0 40 C240 0 480 0 720 28 C960 56 1200 60 1440 24 L1440 64 L0 64 Z',
};
