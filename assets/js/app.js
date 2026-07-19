(() => {
  const menu = document.getElementById('mainNav');
  const menuToggle = document.querySelector('[data-menu-toggle]');

  menuToggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('open');
    document.body.classList.toggle('menu-open', Boolean(open));
    menuToggle.setAttribute('aria-expanded', String(Boolean(open)));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuToggle.textContent = open ? '×' : '☰';
  });

  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    if (menuToggle) menuToggle.textContent = '☰';
  }));

  const normalize = value => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const catalog = document.querySelector('[data-catalog]');
  if (catalog) {
    const items = [...catalog.querySelectorAll('[data-catalog-item]')];
    const search = catalog.querySelector('[data-catalog-search]');
    const filterToggle = catalog.querySelector('[data-filter-toggle]');
    const filterPanel = catalog.querySelector('[data-filter-panel]');
    const filterCount = catalog.querySelector('[data-filter-count]');
    const resultCount = catalog.querySelector('[data-result-count]');
    const empty = catalog.querySelector('[data-catalog-empty]');
    const reset = catalog.querySelector('[data-reset-filters]');
    const letterButtons = [...catalog.querySelectorAll('[data-letter]')];
    const fields = [...catalog.querySelectorAll('[data-filter-key]')];
    let selectedLetter = '';

    const getActiveFilterCount = () => (
      (search?.value.trim() ? 1 : 0) +
      (selectedLetter ? 1 : 0) +
      fields.filter(field => field.value.trim()).length
    );

    const sortVisibleItems = visibleItems => {
      const sortField = fields.find(field => field.dataset.filterKey === 'sort');
      const sort = sortField?.value || 'title-asc';
      const [key, direction] = sort.split('-');
      const sorted = [...visibleItems].sort((a, b) => {
        const first = key === 'year' ? Number(a.dataset.year || a.dataset.birth || 0) : normalize(a.dataset.title);
        const second = key === 'year' ? Number(b.dataset.year || b.dataset.birth || 0) : normalize(b.dataset.title);
        if (first < second) return direction === 'desc' ? 1 : -1;
        if (first > second) return direction === 'desc' ? -1 : 1;
        return 0;
      });
      sorted.forEach(item => item.parentElement.appendChild(item));
    };

    const applyFilters = () => {
      const query = normalize(search?.value || '');
      const visible = [];

      items.forEach(item => {
        const matchesSearch = !query || normalize(item.dataset.search || item.dataset.title).includes(query);
        const matchesLetter = !selectedLetter || item.dataset.letter === selectedLetter;
        const matchesFields = fields.every(field => {
          if (field.dataset.filterKey === 'sort' || !field.value.trim()) return true;
          const availableValues = normalize(item.dataset[field.dataset.filterKey] || '').split(/\s+/);
          return availableValues.includes(normalize(field.value));
        });
        const show = matchesSearch && matchesLetter && matchesFields;
        item.hidden = !show;
        if (show) visible.push(item);
      });

      sortVisibleItems(visible);
      if (resultCount) resultCount.textContent = `${visible.length} ${visible.length === 1 ? 'resultado' : 'resultados'}`;
      if (empty) empty.hidden = visible.length !== 0;
      const active = getActiveFilterCount();
      if (filterCount) {
        filterCount.textContent = String(active);
        filterCount.hidden = active === 0;
      }
    };

    filterToggle?.addEventListener('click', () => {
      const open = filterPanel.hidden;
      filterPanel.hidden = !open;
      filterToggle.setAttribute('aria-expanded', String(open));
      filterToggle.querySelector('[data-filter-label]').textContent = open ? 'Fechar filtros' : 'Filtrar';
    });

    search?.addEventListener('input', applyFilters);
    fields.forEach(field => field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', applyFilters));
    letterButtons.forEach(button => button.addEventListener('click', () => {
      selectedLetter = button.dataset.letter;
      letterButtons.forEach(item => item.classList.toggle('active', item === button));
      applyFilters();
    }));

    reset?.addEventListener('click', () => {
      if (search) search.value = '';
      fields.forEach(field => {
        field.value = field.dataset.filterKey === 'sort' ? 'title-asc' : '';
      });
      selectedLetter = '';
      letterButtons.forEach(button => button.classList.toggle('active', button.dataset.letter === ''));
      applyFilters();
      search?.focus();
    });

    applyFilters();
  }

  document.querySelector('[data-copy-isbn]')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copyIsbn);
      button.textContent = 'ISBN copiado';
    } catch {
      button.textContent = `ISBN: ${button.dataset.copyIsbn}`;
    }
    window.setTimeout(() => { button.textContent = label; }, 1600);
  });

  document.querySelectorAll('[data-current-year]').forEach(item => {
    item.textContent = String(new Date().getFullYear());
  });
})();
