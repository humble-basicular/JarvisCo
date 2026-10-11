/* Progressive visual effects. The page is complete without this file; every
   effect is skipped under prefers-reduced-motion.
   - [data-tilt]: 3D device stage follows the pointer (or device tilt on
     phones that need no permission prompt); otherwise CSS idle float.
   - [data-magnetic]: buttons lean toward the pointer (fine pointers only).
   - [data-spot]: cursor spotlight position for cards.
   - [data-count]: numbers count up when they scroll into view. The final
     value is in the HTML; numbers already on screen at load stay as they are.
   - [data-build]: IntersectionObserver fallback for the scroll-driven
     "site builds itself" section when CSS scroll timelines are missing. */
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Count-up ---------- */
const nf = (decimals: number) => new Intl.NumberFormat('lt-LT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function countUp(el: HTMLElement) {
  const to = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals ?? 0);
  const fmt = nf(decimals);
  const final = el.dataset.final ?? el.textContent;
  const start = performance.now();
  const duration = 1400;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = t < 1 ? fmt.format(to * eased) : final;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if (!still && 'IntersectionObserver' in window) {
  const counters = [...document.querySelectorAll<HTMLElement>('[data-count]')];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        countUp(e.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  for (const el of counters) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) continue; // already on screen
    el.dataset.final = el.textContent ?? '';
    el.textContent = nf(Number(el.dataset.decimals ?? 0)).format(0);
    io.observe(el);
  }
}

/* ---------- Device tilt ---------- */
const stage = document.querySelector<HTMLElement>('[data-tilt]');
if (stage && !still) {
  let raf = 0;
  const set = (x: number, y: number) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      stage.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
      stage.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    });
  };
  if (finePointer) {
    const area = stage.closest('section') ?? stage;
    area.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = ((e as PointerEvent).clientX - (r.left + r.width / 2)) / r.width;
      const y = ((e as PointerEvent).clientY - (r.top + r.height / 2)) / r.height;
      stage.classList.add('is-live');
      set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
    });
    area.addEventListener('pointerleave', () => {
      stage.classList.remove('is-live');
      set(0, 0);
    });
  } else if (
    'DeviceOrientationEvent' in window &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission !== 'function'
  ) {
    // Android: no permission prompt. iOS needs one, so it keeps the idle float.
    let base: number | null = null;
    addEventListener('deviceorientation', (e) => {
      if (e.beta == null || e.gamma == null) return;
      base ??= e.beta;
      stage.classList.add('is-live');
      set(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - base) / 30)));
    });
  }
}

/* ---------- Magnetic buttons + spotlight ---------- */
if (finePointer && !still) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-magnetic]')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px`);
      el.style.setProperty('--my', `${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    });
  }
  document.addEventListener('pointermove', (e) => {
    const card = (e.target as Element | null)?.closest?.<HTMLElement>('[data-spot]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--sx', `${e.clientX - r.left}px`);
    card.style.setProperty('--sy', `${e.clientY - r.top}px`);
  });
}

/* ---------- "Site builds itself" fallback ---------- */
const build = document.querySelector<HTMLElement>('[data-build]');
if (build && !still && !CSS.supports('animation-timeline: view()') && 'IntersectionObserver' in window) {
  build.classList.add('is-js');
  const steps = [...build.querySelectorAll<HTMLElement>('[data-step]')];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const n = Number((e.target as HTMLElement).dataset.step);
        build.dataset.stage = String(n);
        steps.forEach((s, i) => s.classList.toggle('is-on', i < n));
      }
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  steps.forEach((s) => io.observe(s));
}
