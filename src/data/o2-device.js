/* Perspective mapping for the approved blank iPhone frame (kit v4 website/feature-phone-1080x1336.png).
   Glass corners were measured from the frame's own pixels on the 1080×1336 canvas (inner edge of the
   black bezel line, 2026-11-07): TL, TR, BR, BL. The screen element is SCREEN_W×SCREEN_H CSS px and is
   projected onto that quad with matrix3d (square→quad homography, Heckbert). Dynamic Island box is a
   pixel copy of the same frame drawn above the overlay. */
export const CANVAS = { w: 1080, h: 1336 };
/* Glass quads measured 2026-11-07 by fitting the inner black bezel line of each frame's own pixels
   (TL, TR, BR, BL on the 1080×1336 canvas). "right" is the separately generated opposite-angle
   sibling (docs/jarvis-stone-lt-review/opposite-phone-provenance.md), not a mirror. */
export const FRAMES = {
  left: { src: '/jarvis-systems/phone.webp', mask: '/jarvis-systems/device/phone-left-glass.webp', quad: [[322.6, 88.4], [790.4, 77.9], [880.2, 1121.9], [434.3, 1198.6]] },
  right: { src: '/jarvis-systems/phone-right-mascot.webp', mask: '/jarvis-systems/device/phone-right-glass.webp', quad: [[301.1, 79.9], [763.2, 84.6], [646.4, 1197.8], [186.7, 1119]] },
};
/* USER13 (2026-11-07): quads and glass masks are DERIVED by scripts/o2-device-masks.mjs from each frame's own
   pixels (flood fill of the glass inside the black bezel line, luminance-graded AA edge, edge lines fitted and
   pushed out 3 px). The projected screen over-covers the glass; the mask alone trims it, so rounded corners,
   the Dynamic Island (excluded from the mask, original pixels show) and the bezel are never overpainted. */
export const SCREEN_W = 390;
export const SCREEN_H = 900;

export function glassMatrix(quad, w = SCREEN_W, h = SCREEN_H) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((n) => +n.toFixed(8)).join(',')})`;
}

/* Blank front-facing laptop (built-in imagegen 2026-11-07, public/jarvis-systems/laptop-blank.webp, 1080×1336).
   Glass rectangle measured from the file's own pixels (inner edge of the thin black bezel, luminance scan
   at y395/620/860 and x540): x106–974, y391–863. The demo website is laid out at 1.5× and scaled 2/3. */
export const LAPTOP = { src: '/jarvis-systems/laptop-blank.webp', mask: '/jarvis-systems/device/laptop-glass.webp', glass: { x: 104, y: 389, w: 872, h: 475 }, scale: 872 / 1440 };
/* Actual latest betonogaminiai.lt (UAB „Dailius ir ko“, source HEAD 9a94599) captured by root at 1440×783 with
   forms inert and no preview banner: docs/jarvis-stone-source-match/qa/betono-actual-capture-user14.json.
   Field rectangles are from that receipt (1440-px page coordinates); w = revealed text width (estimate,
   over-wide is harmless: the reveal shows only the captured filled pixels); pw = white blank that hides the
   placeholder from the first keystroke, as a real input does. */
export const BETONO = {
  home: '/jarvis-systems/demo/betono-actual/home.webp',
  empty: '/jarvis-systems/demo/betono-actual/form-empty.webp',
  filled: '/jarvis-systems/demo/betono-actual/form-filled.webp',
  logo: '/jarvis-systems/demo/betono-actual/logo-light.webp',
  name: 'Dailius ir ko', blue: '#2575AC',
  order: { x: 1116, y: 43, w: 174, h: 50 },
  fields: [
    { x: 540, y: 222, w: 64, pw: 110, h: 32, chars: 5 },
    { x: 540, y: 274, w: 118, pw: 118, h: 32, chars: 14 },
    { x: 540, y: 326, w: 160, pw: 160, h: 32, chars: 16 },
    { x: 540, y: 378, w: 190, pw: 190, h: 32, chars: 24 },
    { x: 540, y: 430, w: 300, pw: 300, h: 32, chars: 40 },
  ],
  submit: { x: 540, y: 535, w: 360, h: 55 },
};
