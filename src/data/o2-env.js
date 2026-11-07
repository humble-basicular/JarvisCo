/* Build-time switches for the Offer2 page.
   showDrafts: render marked placeholders for not-yet-filmed videos. True in
   `astro dev` and on Vercel preview deployments; false in production, so the
   live site never shows an empty slot. Force with O2_DRAFTS=1 / O2_DRAFTS=0. */
const forced = process.env.O2_DRAFTS;
export const showDrafts = forced === '1' ? true : forced === '0' ? false : Boolean(import.meta.env.DEV || process.env.VERCEL_ENV === 'preview');

/* Booking route. The call-booking form posts to the same-origin Worker route /t/form,
   which exists only on jarvisweb.lt (Cloudflare routes jarvisweb.lt/t/*; the Worker also
   rejects other origins). Vercel preview hosts have no such route, so on dev/preview
   builds the form is validated but nothing is sent and the page says so; no false
   "booked" message and no write to the CRM feed from review builds.
   Force with O2_BOOKING=live / O2_BOOKING=preview. */
const bookingForced = process.env.O2_BOOKING;
export const bookingLive = bookingForced === 'live' ? true : bookingForced === 'preview' ? false : !Boolean(import.meta.env.DEV || process.env.VERCEL_ENV === 'preview');
