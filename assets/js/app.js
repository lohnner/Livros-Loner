(() => {
  const firebaseConfig = {
    apiKey: 'AIzaSyCgZgwPUo5Ehp5JIdprYfjhIb5VlyJ2RcM',
    authDomain: 'games-loner.firebaseapp.com',
    projectId: 'games-loner',
    storageBucket: 'games-loner.firebasestorage.app',
    messagingSenderId: '243629336740',
    appId: '1:243629336740:web:841224ffe9661397781e31',
    measurementId: 'G-37QVBMC7PP'
  };

  const statusLabels = {
    owned: 'Tenho o livro',
    reading: 'Estou lendo',
    want: 'Quero ler',
    finished: 'Finalizado',
    abandoned: 'Abandonado'
  };

  const root = document.body.dataset.root || '';
  let auth;
  let db;
  let currentUser = null;
  let currentProfile = null;

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

  document.querySelectorAll('[data-random-book]').forEach(button => {
    button.addEventListener('click', () => {
      const books = window.LIVROS_LONER_BOOKS || [];
      if (!books.length) return;
      const book = books[Math.floor(Math.random() * books.length)];
      window.location.href = `${root}livros/livro.html?slug=${encodeURIComponent(book.slug)}`;
    });
  });

  const normalize = value => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const initialsFor = value => String(value || 'Leitor')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

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

  const loadScript = src => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.firebase) resolve();
      else existing.addEventListener('load', resolve, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const profileKey = uid => `livros-loner-profile:${uid}`;

  const newProfile = user => ({
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Leitor',
    email: user.email || '',
    photoURL: user.photoURL || '',
    joinedAt: new Date().toISOString(),
    books: {}
  });

  const activeBookSlugs = new Set((window.LIVROS_LONER_BOOKS || []).map(book => book.slug));
  const isActiveBook = book => !activeBookSlugs.size || activeBookSlugs.has(book?.slug);
  const getTotalXp = profile => Object.values(profile?.books || {})
    .filter(isActiveBook)
    .reduce((total, book) => total + Math.max(0, Number(book.xpEarned || 0)), 0);

  const thresholdForLevel = level => {
    const steps = Math.max(0, level - 1);
    return (steps * 100) + (25 * steps * (steps - 1) / 2);
  };

  const getLevelData = xp => {
    let level = 1;
    while (xp >= thresholdForLevel(level + 1)) level += 1;
    const floor = thresholdForLevel(level);
    const ceiling = thresholdForLevel(level + 1);
    return {
      level,
      floor,
      ceiling,
      progress: Math.min(100, ((xp - floor) / (ceiling - floor)) * 100)
    };
  };

  const publicRankingData = profile => {
    const books = Object.values(profile?.books || {}).filter(isActiveBook);
    const xp = getTotalXp(profile);
    return {
      displayName: profile.displayName || 'Leitor',
      photoURL: profile.photoURL || '',
      xp,
      level: getLevelData(xp).level,
      readingSlugs: books.filter(book => book.status === 'reading').map(book => book.slug),
      updatedAt: new Date().toISOString()
    };
  };

  const syncPublicRanking = async profile => {
    if (!db || !profile?.uid) return;
    try {
      await db.collection('publicProfiles').doc(profile.uid).set({
        livrosLonerRanking: publicRankingData(profile)
      }, { merge: true });
    } catch (error) {
      console.warn('Ranking público temporariamente indisponível.', error);
    }
  };

  const rankingPosition = position => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return String(position).padStart(2, '0');
  };

  const renderBookRanking = profiles => {
    const container = document.querySelector('[data-ranking-books]');
    if (!container) return;
    const counts = new Map((window.LIVROS_LONER_BOOKS || []).map(book => [book.slug, 0]));
    profiles.forEach(profile => {
      new Set(profile.readingSlugs || []).forEach(slug => {
        if (counts.has(slug)) counts.set(slug, counts.get(slug) + 1);
      });
    });
    const books = [...(window.LIVROS_LONER_BOOKS || [])].sort((a, b) => (
      counts.get(b.slug) - counts.get(a.slug) || a.title.localeCompare(b.title, 'pt-BR')
    ));
    container.replaceChildren(...books.map((book, index) => {
      const row = document.createElement('a');
      row.className = 'ranking-row ranking-book-row';
      row.href = `${root}livros/livro.html?slug=${encodeURIComponent(book.slug)}`;
      row.innerHTML = `
        <span class="ranking-position">${rankingPosition(index + 1)}</span>
        <img class="ranking-cover" src="${root}assets/images/livros/${book.cover}" alt="">
        <span class="ranking-main"><strong>${book.title}</strong><small>${book.author}</small></span>
        <span class="ranking-score"><strong>${counts.get(book.slug)}</strong><small>${counts.get(book.slug) === 1 ? 'leitor lendo' : 'leitores lendo'}</small></span>`;
      return row;
    }));
  };

  const renderUserRanking = profiles => {
    const container = document.querySelector('[data-ranking-users]');
    if (!container) return;
    const users = [...profiles].sort((a, b) => (
      Number(b.xp || 0) - Number(a.xp || 0) ||
      String(a.displayName || '').localeCompare(String(b.displayName || ''), 'pt-BR')
    ));
    if (!users.length) {
      container.innerHTML = '<div class="ranking-empty">O ranking aparecerá quando os leitores entrarem novamente no site.</div>';
      return;
    }
    container.replaceChildren(...users.map((user, index) => {
      const row = document.createElement('article');
      row.className = 'ranking-row ranking-user-row';
      const avatar = document.createElement('span');
      avatar.className = 'ranking-avatar';
      avatar.textContent = initialsFor(user.displayName);
      const position = document.createElement('span');
      position.className = 'ranking-position';
      position.textContent = rankingPosition(index + 1);
      const main = document.createElement('span');
      main.className = 'ranking-main';
      const name = document.createElement('strong');
      name.textContent = user.displayName || 'Leitor';
      const level = document.createElement('small');
      level.textContent = `Nível ${user.level || getLevelData(Number(user.xp || 0)).level}`;
      main.append(name, level);
      const score = document.createElement('span');
      score.className = 'ranking-score';
      score.innerHTML = `<strong>${Number(user.xp || 0).toLocaleString('pt-BR')}</strong><small>XP</small>`;
      row.append(position, avatar, main, score);
      return row;
    }));
  };

  const renderRankings = async () => {
    if (!document.querySelector('[data-ranking-books], [data-ranking-users]')) return;
    try {
      const snapshot = await db.collection('publicProfiles').get();
      const profiles = snapshot.docs
        .map(doc => doc.data()?.livrosLonerRanking)
        .filter(Boolean);
      renderBookRanking(profiles);
      renderUserRanking(profiles);
    } catch (error) {
      console.warn('Não foi possível carregar o ranking.', error);
      document.querySelectorAll('[data-ranking-books], [data-ranking-users]').forEach(container => {
        container.innerHTML = '<div class="ranking-empty">Não foi possível carregar o ranking agora. Tente novamente em instantes.</div>';
      });
    }
  };

  const cacheProfile = profile => {
    localStorage.setItem(profileKey(profile.uid), JSON.stringify(profile));
  };

  const saveProfile = async profile => {
    cacheProfile(profile);
    try {
      await db.collection('users').doc(profile.uid).set({ livrosLonerProfile: profile }, { merge: true });
      await syncPublicRanking(profile);
    } catch (error) {
      console.warn('Perfil salvo somente neste dispositivo.', error);
    }
  };

  const mergeBooks = (localBooks = {}, remoteBooks = {}) => {
    const merged = { ...localBooks };
    Object.entries(remoteBooks).forEach(([id, remoteBook]) => {
      const localBook = merged[id];
      const localDate = String(localBook?.updatedAt || '');
      const remoteDate = String(remoteBook?.updatedAt || '');
      if (!localBook || remoteDate >= localDate) merged[id] = remoteBook;
    });
    return merged;
  };

  const loadProfile = async user => {
    let cached;
    try {
      cached = JSON.parse(localStorage.getItem(profileKey(user.uid)) || 'null');
    } catch {
      cached = null;
    }

    let remote;
    try {
      const snapshot = await db.collection('users').doc(user.uid).get();
      remote = snapshot.exists ? snapshot.data()?.livrosLonerProfile : null;
    } catch (error) {
      console.warn('Perfil remoto indisponível; usando dados locais.', error);
    }

    const profile = {
      ...newProfile(user),
      ...(cached || {}),
      ...(remote || {}),
      uid: user.uid,
      displayName: remote?.displayName || cached?.displayName || user.displayName || user.email?.split('@')[0] || 'Leitor',
      email: user.email || remote?.email || cached?.email || '',
      photoURL: user.photoURL || remote?.photoURL || cached?.photoURL || '',
      books: mergeBooks(cached?.books, remote?.books)
    };
    cacheProfile(profile);
    return profile;
  };

  const renderHeaderAccount = () => {
    document.body.classList.toggle('is-authenticated', Boolean(currentUser));
    if (!currentUser || !currentProfile) return;
    const xp = getTotalXp(currentProfile);
    const { level } = getLevelData(xp);
    document.querySelectorAll('[data-user-initials]').forEach(item => {
      item.textContent = initialsFor(currentProfile.displayName);
    });
    document.querySelectorAll('[data-header-level]').forEach(item => {
      item.textContent = `Nível ${level}`;
    });
  };

  const renderTracker = () => {
    const tracker = document.querySelector('[data-reading-tracker]');
    if (!tracker || !currentUser || !currentProfile) return;
    const id = tracker.dataset.bookId;
    const totalPages = Number(tracker.dataset.totalPages);
    const saved = currentProfile.books?.[id] || {};
    const pagesRead = Math.min(totalPages, Math.max(0, Number(saved.pagesRead || 0)));
    const status = tracker.querySelector('[data-reading-status]');
    const pages = tracker.querySelector('[data-pages-read]');
    if (status) status.value = saved.status || '';
    if (pages) pages.value = String(pagesRead);
    renderTrackerProgress(tracker, pagesRead, totalPages, saved.xpEarned || 0);
  };

  const renderTrackerProgress = (tracker, pagesRead, totalPages, xpEarned) => {
    const percentage = totalPages ? Math.min(100, (pagesRead / totalPages) * 100) : 0;
    const bar = tracker.querySelector('[data-reading-bar]');
    const label = tracker.querySelector('[data-reading-label]');
    if (bar) bar.style.width = `${percentage}%`;
    if (label) label.textContent = `${pagesRead} de ${totalPages} páginas · ${xpEarned} XP`;
  };

  const setupTracker = () => {
    const tracker = document.querySelector('[data-reading-tracker]');
    if (!tracker) return;
    const totalPages = Number(tracker.dataset.totalPages);
    const pages = tracker.querySelector('[data-pages-read]');
    const status = tracker.querySelector('[data-reading-status]');
    const message = tracker.querySelector('[data-tracker-message]');

    pages?.addEventListener('input', () => {
      const value = Math.min(totalPages, Math.max(0, Number(pages.value || 0)));
      const earned = currentProfile?.books?.[tracker.dataset.bookId]?.xpEarned || 0;
      renderTrackerProgress(tracker, value, totalPages, earned);
    });

    status?.addEventListener('change', () => {
      if (status.value === 'finished' && pages) {
        pages.value = String(totalPages);
        const earned = currentProfile?.books?.[tracker.dataset.bookId]?.xpEarned || 0;
        renderTrackerProgress(tracker, totalPages, totalPages, earned);
      }
    });

    tracker.querySelector('[data-save-progress]')?.addEventListener('click', async event => {
      if (!currentUser || !currentProfile) return;
      const button = event.currentTarget;
      const id = tracker.dataset.bookId;
      const previous = currentProfile.books?.[id] || {};
      let pagesRead = Math.min(totalPages, Math.max(0, Number(pages?.value || 0)));
      let selectedStatus = status?.value || '';

      if (selectedStatus === 'finished') pagesRead = totalPages;
      if (!selectedStatus && pagesRead > 0) selectedStatus = 'reading';
      if (pagesRead === totalPages && selectedStatus !== 'abandoned') selectedStatus = 'finished';
      if (!selectedStatus) {
        if (message) message.textContent = 'Escolha um status para este livro.';
        return;
      }

      const xpEarned = Math.max(Number(previous.xpEarned || 0), pagesRead);
      const gained = xpEarned - Number(previous.xpEarned || 0);
      currentProfile.books = {
        ...(currentProfile.books || {}),
        [id]: {
          title: tracker.dataset.bookTitle,
          slug: tracker.dataset.bookSlug,
          cover: tracker.dataset.bookCover,
          totalPages,
          status: selectedStatus,
          pagesRead,
          xpEarned,
          updatedAt: new Date().toISOString()
        }
      };

      button.disabled = true;
      button.textContent = 'Salvando…';
      await saveProfile(currentProfile);
      button.disabled = false;
      button.textContent = 'Salvar';
      if (status) status.value = selectedStatus;
      if (pages) pages.value = String(pagesRead);
      renderTrackerProgress(tracker, pagesRead, totalPages, xpEarned);
      renderHeaderAccount();
      if (message) {
        message.textContent = gained > 0
          ? `Progresso salvo: +${gained} XP.`
          : 'Progresso atualizado, sem repetir XP.';
      }
    });
  };

  const safeReturnPath = () => {
    const value = new URLSearchParams(window.location.search).get('return');
    if (!value || value.startsWith('/') || value.includes('://') || value.includes('..')) return 'perfil.html';
    return value;
  };

  const showAuthError = error => {
    const field = document.querySelector('[data-auth-error]');
    if (!field) return;
    const messages = {
      'auth/email-already-in-use': 'Este e-mail já tem uma conta.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/invalid-email': 'Digite um e-mail válido.',
      'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir.',
      'auth/weak-password': 'Use uma senha com pelo menos 6 caracteres.'
    };
    field.textContent = messages[error?.code] || 'Não foi possível entrar agora. Tente novamente.';
  };

  const setupAuthPage = () => {
    const form = document.querySelector('[data-auth-form]');
    if (!form) return;
    const modeButtons = [...document.querySelectorAll('[data-auth-mode]')];
    const nameField = document.querySelector('[data-name-field]');
    const submit = form.querySelector('[data-auth-submit]');
    let mode = 'login';

    const setMode = nextMode => {
      mode = nextMode;
      modeButtons.forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
      if (nameField) nameField.hidden = mode !== 'create';
      if (submit) submit.textContent = mode === 'create' ? 'Criar conta' : 'Entrar com e-mail';
      const errorField = document.querySelector('[data-auth-error]');
      if (errorField) errorField.textContent = '';
    };

    modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.authMode)));
    setMode('login');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      submit.disabled = true;
      submit.textContent = 'Aguarde…';
      try {
        if (mode === 'create') {
          const credential = await auth.createUserWithEmailAndPassword(email, password);
          const displayName = form.elements.displayName.value.trim() || email.split('@')[0];
          await credential.user.updateProfile({ displayName });
          await credential.user.reload();
        } else {
          await auth.signInWithEmailAndPassword(email, password);
        }
        window.location.href = safeReturnPath();
      } catch (error) {
        showAuthError(error);
        submit.disabled = false;
        submit.textContent = mode === 'create' ? 'Criar conta' : 'Entrar com e-mail';
      }
    });

    document.querySelector('[data-google-login]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        window.location.href = safeReturnPath();
      } catch (error) {
        showAuthError(error);
        button.disabled = false;
      }
    });
  };

  const renderProfile = () => {
    if (document.body.dataset.page !== 'profile' || !currentUser || !currentProfile) return;
    const xp = getTotalXp(currentProfile);
    const level = getLevelData(xp);
    const books = Object.values(currentProfile.books || {}).filter(isActiveBook).sort((a, b) => (
      String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
    ));
    const catalogBySlug = new Map((window.LIVROS_LONER_BOOKS || []).map(book => [book.slug, book]));
    const pagesRead = books.reduce((total, book) => total + Math.max(0, Number(book.pagesRead || 0)), 0);
    const setProfileValue = (selector, value) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = value;
    };

    document.querySelector('[data-profile-initials]').textContent = initialsFor(currentProfile.displayName);
    document.querySelector('[data-profile-name]').textContent = currentProfile.displayName;
    document.querySelector('[data-profile-email]').textContent = currentProfile.email;
    document.querySelector('[data-profile-level]').textContent = String(level.level);
    document.querySelector('[data-profile-xp]').textContent = `${xp} XP total`;
    document.querySelector('[data-level-progress]').style.width = `${level.progress}%`;
    document.querySelector('[data-level-copy]').textContent =
      `${xp - level.floor} de ${level.ceiling - level.floor} XP para o próximo nível`;
    setProfileValue('[data-stat-reading]', books.filter(book => book.status === 'reading').length);
    setProfileValue('[data-stat-finished]', books.filter(book => book.status === 'finished').length);
    setProfileValue('[data-stat-want]', books.filter(book => book.status === 'want').length);
    setProfileValue('[data-stat-pages]', pagesRead.toLocaleString('pt-BR'));

    const list = document.querySelector('[data-profile-books]');
    if (!list) return;
    if (!books.length) {
      list.innerHTML = `<div class="empty-profile">Sua estante aparecerá aqui depois que você salvar o status de um livro.</div>`;
      return;
    }

    list.replaceChildren(...books.map(book => {
      const catalogBook = catalogBySlug.get(book.slug);
      const titleText = catalogBook?.title || book.title;
      const totalPages = Number(catalogBook?.pages || book.totalPages || 0);
      const currentPages = Math.min(totalPages, Math.max(0, Number(book.pagesRead || 0)));
      const percentage = totalPages ? Math.min(100, (currentPages / totalPages) * 100) : 0;
      const link = document.createElement('a');
      link.className = 'profile-book';
      link.href = `${root}livros/livro.html?slug=${encodeURIComponent(book.slug)}`;

      const image = document.createElement('img');
      image.src = catalogBook
        ? `${root}assets/images/livros/${catalogBook.cover}`
        : `${root}${book.cover}`;
      image.alt = `Capa de ${titleText}`;
      image.loading = 'lazy';

      const copy = document.createElement('span');
      copy.className = 'profile-book-copy';
      const title = document.createElement('h3');
      title.textContent = titleText;
      const details = document.createElement('p');
      details.textContent = `${statusLabels[book.status] || 'Sem status'} · ${currentPages} de ${totalPages} páginas`;
      const progress = document.createElement('span');
      progress.className = 'profile-book-progress';
      progress.innerHTML = `<i style="width:${percentage}%"></i>`;
      copy.append(title, details, progress);

      const experience = document.createElement('strong');
      experience.className = 'profile-book-xp';
      experience.textContent = `${Math.max(0, Number(book.xpEarned || 0))} XP`;
      link.append(image, copy, experience);
      return link;
    }));
  };

  const initializeFirebase = async () => {
    try {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js');
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      setupAuthPage();
      renderRankings();

      auth.onAuthStateChanged(async user => {
        currentUser = user;
        currentProfile = user ? await loadProfile(user) : null;
        if (currentProfile) {
          await syncPublicRanking(currentProfile);
          renderRankings();
        }
        renderHeaderAccount();
        renderTracker();
        renderProfile();

        if (document.body.dataset.page === 'profile' && !user) {
          window.location.href = `${root}login.html?return=perfil.html`;
        }
      });
    } catch (error) {
      console.error('Não foi possível iniciar a conta Livros Loner.', error);
      const authError = document.querySelector('[data-auth-error]');
      if (authError) authError.textContent = 'O login está temporariamente indisponível.';
    }
  };

  setupTracker();
  document.querySelector('[data-logout]')?.addEventListener('click', async () => {
    if (auth) await auth.signOut();
    window.location.href = `${root}index.html`;
  });
  initializeFirebase();
})();
