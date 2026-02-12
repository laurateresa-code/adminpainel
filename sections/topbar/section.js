(() => {
  const root = document.querySelector('.countdown-bar');
  if (!root) return;
  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-minutes');
  const sEl = document.getElementById('cd-seconds');
  const pad = (n) => String(n).padStart(2, '0');
  let targetStr = root.getAttribute('data-target');
  let target = targetStr ? new Date(targetStr) : null;
  if (!target || isNaN(target.getTime())) {
    target = new Date(Date.now() + 25 * 60 * 1000);
  }
  const tick = () => {
    const now = new Date();
    let diff = target.getTime() - now.getTime();
    if (diff < 0) diff = 0;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    if (dEl) dEl.textContent = pad(days);
    if (hEl) hEl.textContent = pad(hours);
    if (mEl) mEl.textContent = pad(minutes);
    if (sEl) sEl.textContent = pad(seconds);
  };
  tick();
  setInterval(tick, 1000);
})();
