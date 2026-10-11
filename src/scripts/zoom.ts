/* Tap-to-zoom for proof screenshots. Each thumbnail is a link to the full
   image, so without JS it still opens. With JS the full image opens in a
   native <dialog> (focus trap, Esc to close, focus returns to the link). */
const dialog = document.querySelector<HTMLDialogElement>('[data-zoom-dialog]');
const img = dialog?.querySelector<HTMLImageElement>('img');
const caption = dialog?.querySelector<HTMLElement>('[data-zoom-caption]');

if (dialog && img && caption && typeof dialog.showModal === 'function') {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-zoom]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    img.src = link.href;
    img.alt = link.dataset.alt ?? '';
    img.width = Number(link.dataset.w);
    img.height = Number(link.dataset.h);
    caption.textContent = link.dataset.caption ?? '';
    dialog.showModal();
    dialog.scrollTop = 0;
  });

  // Close on backdrop tap (the dialog itself is the backdrop area).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => img.removeAttribute('src'));
}
