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
  left: { src: '/jarvis-systems/phone.webp', quad: [[325, 90], [789, 82], [879, 1129], [436, 1187]], island: { x: 523, y: 105, w: 114, h: 49 } },
  right: { src: '/jarvis-systems/phone-right-mascot.webp', quad: [[302, 89], [761, 79], [645, 1191], [189, 1121]], island: { x: 452, y: 105, w: 122, h: 49 } },
};
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
