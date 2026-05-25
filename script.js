document.querySelectorAll('[data-paper-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-paper-filter');
    const list = document.querySelector('.publication-list');

    document.querySelectorAll('[data-paper-filter]').forEach(item => {
      item.classList.toggle('active', item === btn);
    });

    document.querySelectorAll('[data-paper-tags]').forEach(item => {
      const tags = item.getAttribute('data-paper-tags') || '';
      const hidden = filter !== 'all' && !tags.includes(filter);
      item.classList.toggle('is-hidden', hidden);
      item.classList.remove('filter-pop');
      if (!hidden) {
        window.requestAnimationFrame(() => item.classList.add('filter-pop'));
      }
    });

    if (list) {
      list.classList.add('filtering');
      window.setTimeout(() => list.classList.remove('filtering'), 460);
    }
  });
});

document.querySelectorAll('.abstract-toggle').forEach(btn => {
  btn.dataset.closedLabel = btn.textContent.trim();
  btn.addEventListener('click', () => {
    const paper = btn.closest('.publication-item');
    if (!paper) return;
    paper.classList.toggle('expanded');
    btn.textContent = paper.classList.contains('expanded') ? 'Hide details' : btn.dataset.closedLabel;
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.publication-item').forEach((item, index) => {
  item.classList.add('revealed');
});

document.querySelectorAll('[data-count]').forEach(counter => {
  const target = Number(counter.getAttribute('data-count')) || 0;
  if (document.body.classList.contains('research-page')) {
    counter.textContent = target;
    return;
  }
  const duration = 520;
  const start = performance.now();

  const step = now => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
  window.setTimeout(() => {
    counter.textContent = target;
  }, duration + 120);
});

document.querySelectorAll('.contact-form').forEach(form => {
  const status = form.querySelector('[data-form-status]');
  const submitButton = form.querySelector('button[type="submit"]');
  const defaultButtonText = submitButton ? submitButton.textContent : '';

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!status) return;

    status.textContent = 'Sending...';
    status.className = 'form-status';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      form.reset();
      status.textContent = 'Thank you. Your message has been sent.';
      status.classList.add('success');
    } catch (error) {
      status.textContent = 'Sorry, the message could not be sent. Please try again.';
      status.classList.add('error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonText;
      }
    }
  });
});
