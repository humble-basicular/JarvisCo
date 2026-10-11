/* Progressive effects, with native CSS timelines where available. Every
   observer/listener/frame is released when reduced motion is selected. */
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const timelines = CSS.supports('animation-timeline: view()');
let dispose = () => {};

function initEffects() {
  dispose();
  if (motion.matches) return;
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const cleanups: (() => void)[] = [];
  const frames = new Set<number>();
  const frame = (callback: FrameRequestCallback) => {
    const id = requestAnimationFrame((now) => { frames.delete(id); callback(now); });
    frames.add(id);
  };
  dispose = () => {
    controller.abort();
    frames.forEach(cancelAnimationFrame);
    cleanups.forEach((cleanup) => cleanup());
  };
  const observe = (callback: IntersectionObserverCallback, settings?: IntersectionObserverInit) => {
    const io = new IntersectionObserver(callback, settings);
    cleanups.push(() => io.disconnect());
    return io;
  };

  if ('IntersectionObserver' in window) {
    const counts = observe((entries, io) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        const el = entry.target as HTMLElement;
        const final = el.textContent;
        const to = Number(el.dataset.count);
        const decimals = Number(el.dataset.decimals ?? 0);
        const fmt = new Intl.NumberFormat('lt-LT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        const start = performance.now();
        // Keep the server-rendered final value until animation starts; do not
        // replace offscreen evidence with zero or change the number's width.
        el.style.minInlineSize = `${el.getBoundingClientRect().width}px`;
        cleanups.push(() => { el.textContent = final; el.style.removeProperty('min-inline-size'); });
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1200);
          el.textContent = t < 1 ? fmt.format(to * (1 - (1 - t) ** 4)) : final;
          if (t < 1) frame(tick);
          else el.style.removeProperty('min-inline-size');
        };
        frame(tick);
      }
    }, { threshold: 0.6 });
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const bounds = el.getBoundingClientRect();
      if (bounds.top >= innerHeight || bounds.bottom <= 0) counts.observe(el);
    });

    if (!timelines) {
      const reveal = observe((entries, io) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      }, { threshold: 0.08 });
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight) return;
        reveal.observe(el);
        el.classList.add('reveal-ready');
        cleanups.push(() => el.classList.remove('reveal-ready', 'is-revealed'));
      });
    }
  }

  const stage = document.querySelector<HTMLElement>('[data-tilt]');
  if (stage) {
    let queued = false;
    let x = 0;
    let y = 0;
    const tilt = (nextX: number, nextY: number) => {
      x = Math.max(-1, Math.min(1, nextX));
      y = Math.max(-1, Math.min(1, nextY));
      if (queued) return;
      queued = true;
      frame(() => {
        queued = false;
        stage.style.setProperty('--ry', `${x * 10}deg`);
        stage.style.setProperty('--rx', `${-y * 8}deg`);
      });
    };
    const reset = () => {
      stage.classList.remove('is-live');
      stage.style.removeProperty('--ry');
      stage.style.removeProperty('--rx');
    };
    cleanups.push(reset);
    if (fine.matches) {
      const area = stage.closest('section') ?? stage;
      area.addEventListener('pointermove', (event) => {
        const e = event as PointerEvent;
        const r = stage.getBoundingClientRect();
        stage.classList.add('is-live');
        tilt((e.clientX - r.left - r.width / 2) / r.width, (e.clientY - r.top - r.height / 2) / r.height);
      }, options);
      area.addEventListener('pointerleave', () => { reset(); tilt(0, 0); }, options);
    } else if ('DeviceOrientationEvent' in window &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission !== 'function') {
      // Devices requiring a permission prompt retain the CSS idle float.
      let base: number | null = null;
      addEventListener('deviceorientation', (event) => {
        if (event.beta == null || event.gamma == null) return;
        base ??= event.beta;
        stage.classList.add('is-live');
        tilt(event.gamma / 30, (event.beta - base) / 30);
      }, options);
    }
  }

  if (fine.matches) {
    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      const reset = () => { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); };
      cleanups.push(reset);
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.16}px`);
        el.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.2}px`);
      }, options);
      el.addEventListener('pointerleave', reset, options);
    });
    document.addEventListener('pointermove', (e) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>('[data-spot]');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sx', `${e.clientX - r.left}px`);
      card.style.setProperty('--sy', `${e.clientY - r.top}px`);
    }, options);
  }

  const build = document.querySelector<HTMLElement>('[data-build]');
  if (build && !(timelines && CSS.supports('timeline-scope: --a')) && 'IntersectionObserver' in window) {
    const steps = [...build.querySelectorAll<HTMLElement>('[data-step]')];
    const setStage = (n: number) => {
      build.dataset.stage = String(n);
      steps.forEach((step, i) => step.classList.toggle('is-on', i < n));
    };
    build.classList.add('is-js');
    // Restore the correct stage when navigating back into the middle of a page.
    const current = steps.filter((step) => step.getBoundingClientRect().top < innerHeight * 0.6).at(-1);
    setStage(Number(current?.dataset.step ?? 1));
    const observer = observe((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setStage(Number((entry.target as HTMLElement).dataset.step));
      }
    }, { rootMargin: '-48% 0px -42% 0px' });
    steps.forEach((step) => observer.observe(step));
    cleanups.push(() => {
      build.classList.remove('is-js');
      delete build.dataset.stage;
      steps.forEach((step) => step.classList.remove('is-on'));
    });
  }
}
initEffects();
motion.addEventListener('change', initEffects);
fine.addEventListener('change', initEffects);

export {};
