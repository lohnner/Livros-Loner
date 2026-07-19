(() => {
  const root = document.body.dataset.root || '';
  const menu = document.getElementById('mainNav');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const searchDialog = document.getElementById('searchDialog');
  const searchInput = document.getElementById('siteSearch');
  const searchResults = document.getElementById('searchResults');

  const catalog = [
    {
      title: 'A Armadilha do Paraíso',
      subtitle: 'Livro · Trilogia Han Solo, volume 1',
      terms: 'a armadilha do paraiso paradise snare han solo star wars livro',
      href: `${root}livros/a-armadilha-do-paraiso.html`,
      image: `${root}assets/images/livros/a-armadilha-do-paraiso.jpg`
    },
    {
      title: 'A. C. Crispin',
      subtitle: 'Autora · Ficção científica',
      terms: 'a c crispin ann carol crispin autora escritora star wars star trek',
      href: `${root}autores/a-c-crispin.html`,
      image: `${root}assets/images/autores/a-c-crispin.jpg`
    }
  ];

  const normalize = value => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const renderResults = query => {
    if (!searchResults) return;
    const normalized = normalize(query.trim());
    const matches = normalized
      ? catalog.filter(item => item.terms.includes(normalized) || normalize(item.title).includes(normalized))
      : catalog;

    searchResults.innerHTML = matches.length
      ? matches.map(item => `
        <a class="search-result" href="${item.href}">
          <img src="${item.image}" alt="">
          <span><strong>${item.title}</strong><small>${item.subtitle}</small></span>
          <b aria-hidden="true">↗</b>
        </a>`).join('')
      : '<p class="search-empty">Nenhum livro ou autor encontrado no acervo.</p>';
  };

  menuToggle?.addEventListener('click', () => {
    const isOpen = menu?.classList.toggle('open');
    document.body.classList.toggle('menu-open', Boolean(isOpen));
    menuToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    menuToggle.textContent = isOpen ? '×' : '☰';
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    if (menuToggle) menuToggle.textContent = '☰';
  }));

  document.querySelector('[data-open-search]')?.addEventListener('click', () => {
    renderResults('');
    searchDialog?.showModal();
    window.setTimeout(() => searchInput?.focus(), 50);
  });

  searchInput?.addEventListener('input', () => renderResults(searchInput.value));

  searchDialog?.addEventListener('click', event => {
    if (event.target === searchDialog) searchDialog.close();
  });

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      renderResults('');
      searchDialog?.showModal();
      window.setTimeout(() => searchInput?.focus(), 50);
    }
  });

  document.querySelector('[data-copy-isbn]')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const isbn = button.dataset.copyIsbn;
    try {
      await navigator.clipboard.writeText(isbn);
      button.textContent = 'ISBN copiado';
    } catch {
      button.textContent = `ISBN: ${isbn}`;
    }
    window.setTimeout(() => { button.textContent = 'Copiar ISBN'; }, 1800);
  });

  document.querySelectorAll('[data-current-year]').forEach(item => {
    item.textContent = String(new Date().getFullYear());
  });
})();
