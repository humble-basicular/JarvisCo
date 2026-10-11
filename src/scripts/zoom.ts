/* Tap-to-zoom for proof screenshots. Each thumbnail is a link to the full
   image, so without JS it still opens. With JS the full image opens in a
   native <dialog> (focus trap, Esc to close, focus returns to the link) and
   grows out of the thumbnail (FLIP with the Web Animations API). */
const dialog = document.querySelector<HTMLDialogElement>('[data-zoom-dialog]');
const img = dialog?.querySelector<HTMLImageElement>('img');
const caption = dialog?.querySelector<HTMLElement>('[data-zoom-caption]');
const still = matchMedia('(prefers-reduced-motion: reduce)');

if (dialog && img && caption && typeof dialog.showModal === 'function') {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-zoom]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const thumb = link.querySelector('img') ?? link;
    const from = thumb.getBoundingClientRect();

    img.src = link.href;
    img.alt = link.dataset.alt ?? '';
    img.width = Number(link.dataset.w);
    img.height = Number(link.dataset.h);
    caption.textContent = link.dataset.caption ?? '';
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.scrollLeft = 0;

    if (still.matches || typeof img.animate !== 'function') return;
    const to = img.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const sx = from.width / to.width;
    img.animate(
      [
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx})`, opacity: 0.6 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  });

  // Close on backdrop tap (the dialog itself is the backdrop area).
  dialog.addEventListener('click', (event) => {
    const t = event.target as Element;
    if (t === dialog || t.classList.contains('zoom__stage')) dialog.close();
  });
  dialog.addEventListener('close', () => img.removeAttribute('src'));
}
