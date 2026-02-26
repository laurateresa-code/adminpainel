(function() {
  document.addEventListener('click', function(e) {
    const list = e.target.closest('.faq-retro__list');
    if (!list) return;

    const trigger = e.target.closest('.faq-retro__trigger');
    if (!trigger) return;
    
    e.preventDefault();

    const content = trigger.nextElementSibling && trigger.nextElementSibling.classList.contains('faq-retro__content')
      ? trigger.nextElementSibling
      : null;
    if (!content) return;

    const questionEl = trigger.querySelector('.faq-retro__question');
    if (questionEl && questionEl.textContent) list.dataset.faqOpen = questionEl.textContent.trim();

    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

    const openItem = (btn, panel) => {
      btn.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      panel.style.maxHeight = '0px';
      requestAnimationFrame(() => {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      });
    };

    const closeItem = (btn, panel) => {
      btn.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      requestAnimationFrame(() => {
        panel.style.maxHeight = '0px';
      });

      const end = (ev) => {
        if (ev.propertyName !== 'max-height') return;
        panel.removeEventListener('transitionend', end);
        if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true;
      };
      panel.addEventListener('transitionend', end);
      setTimeout(() => {
        if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true;
      }, 450);
    };

    // Close all others in the same list
    const allTriggers = list.querySelectorAll('.faq-retro__trigger');
    allTriggers.forEach(otherBtn => {
      if (otherBtn !== trigger && otherBtn.getAttribute('aria-expanded') === 'true') {
        const otherContent = otherBtn.nextElementSibling && otherBtn.nextElementSibling.classList.contains('faq-retro__content')
          ? otherBtn.nextElementSibling
          : null;
        if (otherContent) closeItem(otherBtn, otherContent);
      }
    });

    // Toggle current
    if (!isExpanded) openItem(trigger, content);
    else closeItem(trigger, content);
  });
})();
