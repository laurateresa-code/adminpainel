const loadSections = async () => {
  const placeholders = Array.from(document.querySelectorAll('[data-include]'));
  for (const ph of placeholders) {
    const path = ph.getAttribute('data-include');
    try {
      const res = await fetch(path);
      const html = await res.text();
      ph.outerHTML = html;
      const base = path.replace(/\/[^/]+$/, '');
      const cssURL = `${base}/style.css`;
      const jsURL = `${base}/section.js`;
      try {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = cssURL;
        cssLink.onload = () => {};
        cssLink.onerror = () => {};
        document.head.appendChild(cssLink);
      } catch {}
      try {
        const probe = await fetch(jsURL);
        const ct = (probe.headers.get('content-type') || '').toLowerCase();
        const body = await probe.text();
        if (probe.ok && !body.includes('<!DOCTYPE html>') && (ct.includes('javascript') || ct.includes('text/plain'))) {
          const jsTag = document.createElement('script');
          jsTag.src = jsURL;
          jsTag.defer = true;
          document.body.appendChild(jsTag);
        }
      } catch {}
    } catch {}
  }
  setTimeout(() => document.dispatchEvent(new Event('sections:ready')), 0);
};
document.addEventListener('DOMContentLoaded', loadSections);
