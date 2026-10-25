/* Theme card for template v3 (design plan 2026-10-20, "Theme system").
   Every site = fixed rules (section order, hero form, call bar, one heading font,
   one divider style, filled icons) + one theme card chosen from the client's trade
   archetype and feel. The card lives in previews/<slug>.json under `v3.theme`.
   Uniqueness comes from the card: palette, heading font, divider, badge shape and
   glyph, hero layout and service layout. Pick a combination no other client has. */

export type Archetype = 'water' | 'heat' | 'outdoor' | 'heavy' | 'electric' | 'clean' | 'craft';
export type Divider = 'angle' | 'wave' | 'zigzag' | 'notch' | 'grass';
export type LogoShape = 'round' | 'shield' | 'square';
export type LogoGlyph = 'flame' | 'drop' | 'bolt' | 'lens' | 'rope';
export type HeadingFont = 'archivo-black' | 'barlow-condensed' | 'space-grotesk';
/** photo = full-bleed photo behind copy + form (needs a sharp ≥1400 px photo);
 *  panel = tinted photo texture, copy + pinned real work photos + form (phone photos). */
export type HeroLayout = 'photo' | 'panel';
/** tiles = one photo per service (needs a matching photo each); cards = filled icon cards. */
export type ServiceLayout = 'tiles' | 'cards';
/** "Kaip dirbame" layout: line = icon circles + dashed arrows (default); chevron = icon on a stem above
 *  arrow ribbons; frames = numbered cards with camera-frame corners. Pick one no recent site used. */
export type ProcessLayout = 'line' | 'chevron' | 'frames';

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
  process?: ProcessLayout;
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
  /** Lawn edge: a row of grass blades (lawn and garden care). */
  grass: 'M0 64 L0 46 L1 27 L10 44 L17 19 L23 47 L35 32 L39 44 L42 23 L49 47 L58 16 L62 44 L66 30 L78 47 L83 21 L88 44 L99 34 L101 47 L107 25 L117 44 L124 14 L127 47 L130 29 L140 44 L148 22 L156 47 L165 27 L166 44 L171 19 L179 47 L189 32 L195 44 L196 23 L205 47 L212 16 L218 44 L230 30 L234 47 L237 21 L244 44 L253 34 L257 47 L261 25 L273 44 L278 14 L283 47 L294 29 L296 44 L302 22 L312 47 L319 27 L322 44 L325 19 L335 47 L343 32 L351 44 L360 23 L361 47 L366 16 L374 44 L384 30 L390 47 L391 21 L400 44 L407 34 L413 47 L425 25 L429 44 L432 14 L439 47 L448 29 L452 44 L456 22 L468 47 L473 27 L478 44 L489 19 L491 47 L497 32 L507 44 L514 23 L517 47 L520 16 L530 44 L538 30 L546 47 L555 21 L556 44 L561 34 L569 47 L579 25 L585 44 L586 14 L595 47 L602 29 L608 44 L620 22 L624 47 L627 27 L634 44 L643 19 L647 47 L651 32 L663 44 L668 23 L673 47 L684 16 L686 44 L692 30 L702 47 L709 21 L712 44 L715 34 L725 47 L733 25 L741 44 L750 14 L751 47 L756 29 L764 44 L774 22 L780 47 L781 27 L790 44 L797 19 L803 47 L815 32 L819 44 L822 23 L829 47 L838 16 L842 44 L846 30 L858 47 L863 21 L868 44 L879 34 L881 47 L887 25 L897 44 L904 14 L907 47 L910 29 L920 44 L928 22 L936 47 L945 27 L946 44 L951 19 L959 47 L969 32 L975 44 L976 23 L985 47 L992 16 L998 44 L1010 30 L1014 47 L1017 21 L1024 44 L1033 34 L1037 47 L1041 25 L1053 44 L1058 14 L1063 47 L1074 29 L1076 44 L1082 22 L1092 47 L1099 27 L1102 44 L1105 19 L1115 47 L1123 32 L1131 44 L1140 23 L1141 47 L1146 16 L1154 44 L1164 30 L1170 47 L1171 21 L1180 44 L1187 34 L1193 47 L1205 25 L1209 44 L1212 14 L1219 47 L1228 29 L1232 44 L1236 22 L1248 47 L1253 27 L1258 44 L1269 19 L1271 47 L1277 32 L1287 44 L1294 23 L1297 47 L1300 16 L1310 44 L1318 30 L1326 47 L1335 21 L1336 44 L1341 34 L1349 47 L1359 25 L1365 44 L1366 14 L1375 47 L1382 29 L1388 44 L1400 22 L1404 47 L1407 27 L1414 44 L1423 19 L1427 47 L1440 44 L1440 64 Z',
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
  /* Rope access: a block of flats with a rope from the roof and a climber on it. */
  rope: {
    main: 'M17 19H35V50H17ZM21 24h4v4h-4zM27 24h4v4h-4zM21 32h4v4h-4zM27 32h4v4h-4zM21 40h4v4h-4zM27 40h4v4h-4zM35 15.5H45.5V33H43.3V17.7H35ZM44.4 34.2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    inner: 'M44.4 36.4a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z',
  },
};
