document.querySelectorAll('[data-paper-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-paper-filter');

    document.querySelectorAll('[data-paper-filter]').forEach(item => {
      item.classList.toggle('active', item === btn);
    });

    document.querySelectorAll('[data-paper-tags]').forEach(item => {
      const tags = item.getAttribute('data-paper-tags') || '';
      item.classList.toggle('is-hidden', filter !== 'all' && !tags.includes(filter));
    });
  });
});

document.querySelectorAll('.abstract-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const paper = btn.closest('.publication-item');
    if (!paper) return;
    paper.classList.toggle('expanded');
    btn.textContent = paper.classList.contains('expanded') ? 'Hide abstract' : 'Abstract';
  });
});

document.querySelectorAll('[data-product-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const selected = btn.getAttribute('data-product-tab');

    document.querySelectorAll('[data-product-tab]').forEach(tab => {
      tab.classList.toggle('active', tab === btn);
    });

    document.querySelectorAll('[data-product-panel]').forEach(panel => {
      panel.classList.toggle('active', panel.getAttribute('data-product-panel') === selected);
    });
  });
});
