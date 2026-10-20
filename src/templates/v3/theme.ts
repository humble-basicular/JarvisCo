/* Theme card for template v3 (design plan 2026-10-20, "Theme system").
   Every site = fixed rules (section order, hero form, call bar, one heading font,
   one divider style, filled icons) + one theme card chosen from the client's trade
   archetype and feel. The card lives in previews/<slug>.json under `v3.theme`.
   Uniqueness comes from the card: palette, heading font, divider, badge shape and
   glyph, hero layout and service layout. Pick a combination no other client has. */

export type Archetype = 'water' | 'heat' | 'outdoor' | 'heavy' | 'electric' | 'clean' | 'craft';
export type Divider = 'angle' | 'wave';
export type LogoShape = 'round' | 'shield';
export type LogoGlyph = 'flame' | 'drop';
export type HeadingFont = 'archivo-black' | 'barlow-condensed';
/** photo = full-bleed photo behind copy + form (needs a sharp ≥1400 px photo);
 *  panel = tinted photo texture, copy + pinned real work photos + form (phone photos). */
export type HeroLayout = 'photo' | 'panel';
/** tiles = one photo per service (needs a matching photo each); cards = filled icon cards. */
export type ServiceLayout = 'tiles' | 'cards';

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
  hero: HeroLayout;
  services: ServiceLayout;
  logo: { shape: LogoShape; glyph: LogoGlyph; ring: string; line: string };
}

export const HEADING_STACK: Record<HeadingFont, string> = {
  'archivo-black': "'V3 Head','V3 Head Fallback',Impact,'Arial Black',sans-serif",
  'barlow-condensed': "'V3 Head','V3 Head Fallback','Arial Narrow',Impact,sans-serif",
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
