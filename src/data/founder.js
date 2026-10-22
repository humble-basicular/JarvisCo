// Founder price (39 €/mėn.) is only for the first five clients; everyone else pays the standard 59 €/mėn. after the free 60 days.
// ONE number to edit: how many of the five founder slots are still open (0–5). A slot is used the moment terms are agreed on a call
// AND the intake is submitted or the domain is paid (not at launch). Matas keeps the count; 0 = "5 vietos (užimtos)".
// Flip it back up if an agreement falls through before launch and the slot reopens. Every founder mention on the site follows this number.
export const FOUNDER_SLOTS_LEFT = 0;

if (!Number.isInteger(FOUNDER_SLOTS_LEFT) || FOUNDER_SLOTS_LEFT < 0 || FOUNDER_SLOTS_LEFT > 5) {
  throw new Error(`FOUNDER_SLOTS_LEFT must be an integer 0–5, got ${FOUNDER_SLOTS_LEFT}`);
}

const left = FOUNDER_SLOTS_LEFT;
const slotsWord = left === 1 ? 'vieta' : 'vietos';

/** Price-block line under the 59 € headline. */
export const founderLaunch = left === 0
  ? 'Steigėjų kaina 39 € – 5 vietos (užimtos). Dabar – 59 € per mėnesį, ir ši kaina nesikeis, kol naudositės svetaine.'
  : `Steigėjų kaina 39 € – liko ${left} ${slotsWord}. Visiems kitiems – 59 €. Sutarta kaina nesikeis, kol naudositės svetaine.`;

/** Short parenthetical for FAQ/terms/cost lines; empty when the founder slots are gone, so nothing stale remains. */
export const founderNote = left === 0 ? '' : ` (steigėjų kaina 39 € – liko ${left} ${slotsWord})`;
