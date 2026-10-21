/* Theme card for template v3 (design plan 2026-10-20, "Theme system").
   Every site = fixed rules (section order, hero form, call bar, one heading font,
   one divider style, filled icons) + one theme card chosen from the client's trade
   archetype and feel. The card lives in previews/<slug>.json under `v3.theme`.
   Uniqueness comes from the card: palette, heading font, divider, badge shape and
   glyph, hero layout and service layout. Pick a combination no other client has. */

export type Archetype = 'water' | 'heat' | 'outdoor' | 'heavy' | 'electric' | 'clean' | 'craft';
export type Divider = 'angle' | 'wave' | 'zigzag' | 'notch';
export type LogoShape = 'round' | 'shield';
export type LogoGlyph = 'flame' | 'drop' | 'bolt' | 'lens';
export type HeadingFont = 'archivo-black' | 'barlow-condensed' | 'space-grotesk';
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
  'space-grotesk': "'V3 Head','V3 Head Fallback','Helvetica Neue',Arial,sans-serif",
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
  /** Current trace: a low zigzag (electric). */
  zigzag: 'M0 40 L180 16 L360 44 L540 12 L720 40 L900 14 L1080 42 L1260 18 L1440 36 L1440 64 L0 64 Z',
  /** Camera-frame notch: a flat edge with one stepped cut (security, tech). */
  notch: 'M0 28 L940 28 L990 4 L1440 4 L1440 64 L0 64 Z',
};

/** Badge / favicon glyphs on a 64×64 box: `main` in white, `inner` in the accent colour. */
export const GLYPH: Record<LogoGlyph, { main: string; inner: string }> = {
  flame: {
    main: 'M32.6 17c1.6 6 9.4 9.4 9.4 18a10 10 0 0 1-20 0c0-4.6 2.3-7.7 4.8-10.5.3 2.6 1.4 4.4 3.3 5.4-.6-5.2.2-9.6 2.5-12.9z',
    inner: 'M32 31.5c2.3 2.6 4.2 4.6 4.2 7.4a4.2 4.2 0 0 1-8.4 0c0-2.8 1.9-4.8 4.2-7.4z',
  },
  drop: {
    main: 'M32 13C26 21 20.5 27.5 20.5 35a11.5 11.5 0 0 0 23 0C43.5 27.5 38 21 32 13z',
    inner: 'M32.5 26.5c.8 3 4.7 4.7 4.7 9a5.2 5.2 0 0 1-10.4 0c0-2.4 1.2-4 2.5-5.4.2 1.3.7 2.2 1.7 2.7-.3-2.6.2-4.9 1.5-6.3z',
  },
  bolt: {
    main: 'M36.5 12 L20 35.5 H30.5 L26.5 52 L44 27.5 H33.5 Z',
    inner: 'M33.4 24.6 L28.2 32 H31.6 L30.4 37.4 L35.8 30 H32.3 Z',
  },
  lens: {
    main: 'M32 14a18 18 0 1 0 0 36 18 18 0 0 0 0-36zm0 7a11 11 0 1 1 0 22 11 11 0 0 1 0-22z',
    inner: 'M32 25.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z',
  },
};
