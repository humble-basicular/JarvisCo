/* The only motion on the page (plan §4.2): a thin scroll-progress line,
   headlines that slide in once, and the hero object drifting slightly on
   scroll. Nothing moves with prefers-reduced-motion (the line still tracks
   position: it is a position indicator, not an animation). */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const bar = document.querySelector<HTMLElement>('[data-scroll-line]');
const drift = document.querySelector<HTMLElement>('[data-drift]');

let queued = false;
const update = () => {
  queued = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar?.style.setProperty('--p', String(max > 0 ? Math.min(1, scrollY / max) : 0));
  if (drift && !reduced) {
    const shift = Math.min(1, scrollY / innerHeight);
    drift.style.transform = `translate3d(${(-shift * 4).toFixed(2)}%, 0, 0)`;
  }
};
addEventListener('scroll', () => {
  if (!queued) requestAnimationFrame(update);
  queued = true;
}, { passive: true });
update();

const heads = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduced || !('IntersectionObserver' in window)) {
  heads.forEach((h) => h.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  heads.forEach((h) => io.observe(h));
}
