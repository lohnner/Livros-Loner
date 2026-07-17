(async () => {
  const root = document.documentElement;
  const body = document.body;
  const base = body.dataset.root || '';
  const toast = document.getElementById('toast');
  let toastTimer;

  const keys = { theme: 'nakama-theme', current: 'nakama-current-user', profiles: 'nakama-profiles' };
  const firebaseConfig = {
    apiKey: 'AIzaSyCgZgwPUo5Ehp5JIdprYfjhIb5VlyJ2RcM',
    authDomain: 'games-loner.firebaseapp.com',
    projectId: 'games-loner',
    storageBucket: 'games-loner.firebasestorage.app',
    messagingSenderId: '243629336740',
    appId: '1:243629336740:web:841224ffe9661397781e31',
    measurementId: 'G-37QVBMC7PP'
  };
  let firebaseAuth = null;
  let firestore = null;
  let firebaseUser = null;
  const loadScript = source => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  try {
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js');
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firestore = firebase.firestore();
    firebaseUser = await new Promise(resolve => {
      const unsubscribe = firebaseAuth.onAuthStateChanged(user => { unsubscribe(); resolve(user); });
    });
  } catch (error) {
    console.error('Não foi possível conectar ao Firebase.', error);
  }
  const animeId = body.dataset.animeId || 'tomb-raider-king';
  const animeTitle = body.dataset.animeTitle || 'Tomb Raider King';
  const animeSlug = body.dataset.animeSlug || 'tomb-raider-king';
  const animeCover = body.dataset.animeCover || 'assets/images/capas/tomb-raider-king.jpg';
  const totalEpisodes = Number(body.dataset.totalEpisodes) || 12;
  const seasonEpisodeLimits = (body.dataset.seasonEpisodes || '').split(',').map(Number).filter(value => value > 0);
  const isAiring = body.dataset.airing === 'true';
  const experiencePerEpisode = 22;
  const getProfiles = () => { try { return JSON.parse(localStorage.getItem(keys.profiles)) || {}; } catch { return {}; } };
  const getCurrentName = () => localStorage.getItem(keys.current) || '';
  const getCurrentProfile = () => getProfiles()[getCurrentName()] || null;
  const initials = name => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const htmlEscapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => htmlEscapes[character]);
  const animeEpisodeLimits = { 'tomb-raider-king': 12, dorohedoro: 23, 'mushoku-tensei': 51, 'the-ghost-in-the-shell': 2 };
  const airingAnime = { 'tomb-raider-king': true, 'mushoku-tensei': true, 'the-ghost-in-the-shell': true };
  const animeCatalog = {
    'tomb-raider-king': { title: 'Tomb Raider King', slug: 'tomb-raider-king', cover: 'assets/images/capas/tomb-raider-king.jpg', totalEpisodes: 12 },
    dorohedoro: { title: 'Dorohedoro', slug: 'dorohedoro', cover: 'assets/images/capas/dorohedoro.jpg', totalEpisodes: 23 },
    'mushoku-tensei': { title: 'Mushoku Tensei: Jobless Reincarnation', slug: 'mushoku-tensei', cover: 'assets/images/capas/mushoku-tensei.png', totalEpisodes: 51 },
    'the-ghost-in-the-shell': { title: 'The Ghost in the Shell', slug: 'the-ghost-in-the-shell', cover: 'assets/images/capas/the-ghost-in-the-shell.jpg', totalEpisodes: 2 }
  };
  const safeEpisodes = (id, entry = {}) => Math.min(animeEpisodeLimits[id] || Number(entry.totalEpisodes) || 0, Math.max(0, Number(entry.episodes) || 0));
  const formatNumber = value => new Intl.NumberFormat('pt-BR').format(value);
  const profileExperience = profile => Object.entries(profile?.anime || {}).reduce((total, [id, entry]) => total + safeEpisodes(id, entry), 0) * experiencePerEpisode;

  function experienceForLevel(level) {
    const n = Math.max(0, level - 1);
    return Math.round((50 * n ** 3 - 150 * n ** 2 + 400 * n) / 3);
  }

  function levelFromExperience(experience) {
    let low = 1;
    let high = 2;
    while (experienceForLevel(high) <= experience) {
      low = high;
      high *= 2;
    }
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (experienceForLevel(middle) <= experience) low = middle;
      else high = middle;
    }
    const currentLevelXp = experienceForLevel(low);
    const nextLevelXp = experienceForLevel(low + 1);
    return {
      level: low,
      current: experience - currentLevelXp,
      needed: nextLevelXp - currentLevelXp,
      progress: ((experience - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    };
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function cacheProfile(profile) {
    const profiles = getProfiles();
    profiles[profile.uid || profile.username] = profile;
    localStorage.setItem(keys.profiles, JSON.stringify(profiles));
  }

  async function syncProfile(profile) {
    if (!firestore || !firebaseUser || profile.uid !== firebaseUser.uid) return;
    const publicProfile = {
      username: profile.username,
      displayName: profile.displayName,
      joinedAt: profile.joinedAt,
      anime: profile.anime || {}
    };
    await Promise.all([
      firestore.collection('users').doc(profile.uid).set({ nakamaProfile: publicProfile }, { merge: true }),
      firestore.collection('publicProfiles').doc(profile.uid).set(publicProfile, { merge: true })
    ]);
  }

  function saveProfile(profile) {
    cacheProfile(profile);
    syncProfile(profile).catch(error => {
      console.error('Falha ao sincronizar o perfil.', error);
      showToast('Alteração salva neste aparelho. A sincronização será tentada novamente.');
    });
  }

  async function hydrateProfiles() {
    if (!firestore) return;
    const profiles = {};
    const publicSnapshot = await firestore.collection('publicProfiles').get();
    publicSnapshot.forEach(document => { profiles[document.id] = { uid: document.id, ...document.data() }; });
    if (firebaseUser) {
      const privateDocument = await firestore.collection('users').doc(firebaseUser.uid).get();
      const privateProfile = privateDocument.exists ? privateDocument.data().nakamaProfile : null;
      const username = (privateProfile?.username || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'usuario')
        .replace(/\s+/g, '_').replace(/[^\wÀ-ÿ.-]/g, '').slice(0, 24) || 'usuario';
      const profile = {
        uid: firebaseUser.uid,
        username,
        displayName: privateProfile?.displayName || firebaseUser.displayName || username,
        joinedAt: privateProfile?.joinedAt || firebaseUser.metadata?.creationTime || new Date().toISOString(),
        anime: privateProfile?.anime || profiles[firebaseUser.uid]?.anime || {}
      };
      profiles[firebaseUser.uid] = profile;
      localStorage.setItem(keys.current, firebaseUser.uid);
      await syncProfile(profile);
    } else {
      localStorage.removeItem(keys.current);
    }
    localStorage.setItem(keys.profiles, JSON.stringify(profiles));
  }

  try { await hydrateProfiles(); } catch (error) { console.error('Falha ao carregar perfis online.', error); }

  function requireLogin(message = 'Entre para salvar esta ação no seu perfil.') {
    if (getCurrentProfile()) return true;
    showToast(message);
    setTimeout(() => { window.location.href = `${base}login.html`; }, 650);
    return false;
  }

  const savedTheme = localStorage.getItem(keys.theme);
  if (savedTheme) root.dataset.theme = savedTheme;
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(keys.theme, root.dataset.theme);
    showToast(root.dataset.theme === 'dark' ? 'Tema escuro ativado' : 'Tema claro ativado');
  });

  const currentProfile = getCurrentProfile();
  if (currentProfile) {
    body.classList.add('is-authenticated');
    document.querySelectorAll('[data-user-initials]').forEach(item => item.textContent = initials(currentProfile.displayName || currentProfile.username));
  } else {
    body.classList.add('is-guest');
  }

  function updateSiteMetrics() {
    const profiles = Object.values(getProfiles());
    const votes = profiles.map(profile => Number(profile?.anime?.[animeId]?.score)).filter(score => score > 0);
    const average = votes.length ? (votes.reduce((total, score) => total + score, 0) / votes.length).toFixed(2) : '0.00';
    document.querySelectorAll('[data-site-score]').forEach(item => item.textContent = average);
    document.querySelectorAll('[data-site-votes]').forEach(item => item.textContent = String(votes.length));
    document.querySelectorAll('[data-site-members]').forEach(item => item.textContent = String(profiles.length));
  }
  updateSiteMetrics();

  function updateCatalogCards() {
    const profiles = Object.values(getProfiles());
    const profile = getCurrentProfile();
    document.querySelectorAll('[data-anime-card]').forEach(card => {
      const cardAnimeId = card.dataset.animeCard;
      const cardTotal = Number(card.dataset.totalEpisodes) || 1;
      const entry = profile?.anime?.[cardAnimeId] || {};
      const episodes = Math.min(cardTotal, Math.max(0, Number(entry.episodes) || 0));
      const votes = profiles.map(item => Number(item?.anime?.[cardAnimeId]?.score)).filter(score => score > 0);
      const average = votes.length ? (votes.reduce((sum, score) => sum + score, 0) / votes.length).toFixed(2) : '0.00';
      card.querySelectorAll('[data-card-score]').forEach(item => item.textContent = average);
      card.querySelectorAll('[data-card-episodes]').forEach(item => item.textContent = String(episodes));
      card.querySelectorAll('[data-card-progress]').forEach(item => item.style.width = `${(episodes / cardTotal) * 100}%`);
    });
  }
  updateCatalogCards();

  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  menuToggle?.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    document.querySelector('.global-search')?.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? '×' : '☰';
  });

  const search = document.getElementById('globalSearch');
  const results = document.getElementById('searchResults');
  search?.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    if (!query) { results.hidden = true; return; }
    const catalog = [
      { terms: 'tomb raider king dogulwang', title: 'Tomb Raider King', slug: 'tomb-raider-king', cover: 'tomb-raider-king.jpg', episodes: 12 },
      { terms: 'dorohedoro caiman nikaido', title: 'Dorohedoro', slug: 'dorohedoro', cover: 'dorohedoro.jpg', episodes: 23 },
      { terms: 'mushoku tensei jobless reincarnation rudeus greyrat', title: 'Mushoku Tensei: Jobless Reincarnation', slug: 'mushoku-tensei', cover: 'mushoku-tensei.png', episodes: 51 },
      { terms: 'the ghost in the shell kokaku kidotai motoko kusanagi', title: 'The Ghost in the Shell', slug: 'the-ghost-in-the-shell', cover: 'the-ghost-in-the-shell.jpg', episodes: 2 }
    ];
    const matches = catalog.filter(anime => anime.terms.includes(query));
    results.innerHTML = matches.length
      ? matches.map(anime => `<a class="search-result" href="${base}anime/${anime.slug}.html"><img src="${base}assets/images/capas/${anime.cover}" alt=""><span><b>${anime.title}</b><small>Anime • ${anime.episodes} episódios</small></span></a>`).join('')
      : '<div class="no-result">Nenhum anime encontrado.</div>';
    results.hidden = false;
  });
  search?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { search.value = ''; results.hidden = true; search.blur(); }
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && search) { event.preventDefault(); search.focus(); }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.global-search') && results) results.hidden = true;
  });

  const catalogSearch = document.getElementById('catalogSearch');
  const catalogEmpty = document.getElementById('catalogEmpty');
  catalogSearch?.addEventListener('input', () => {
    const query = catalogSearch.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('.catalog-anime-card').forEach(card => {
      const matches = !query || card.dataset.catalogTitle.includes(query);
      card.classList.toggle('is-hidden', !matches);
      if (matches) visible += 1;
    });
    if (catalogEmpty) catalogEmpty.hidden = visible !== 0;
  });

  if (body.dataset.page === 'anime-ranking') {
    const profiles = Object.values(getProfiles());
    const ranking = Object.entries(animeCatalog).map(([id, anime]) => ({
      ...anime,
      id,
      points: profiles.filter(profile => profile?.anime?.[id]?.status === 'assistindo').length
    })).sort((first, second) => second.points - first.points || first.title.localeCompare(second.title, 'pt-BR'));
    document.getElementById('animeRankingTotal').textContent = formatNumber(ranking.reduce((total, anime) => total + anime.points, 0));
    document.getElementById('animeRankingList').innerHTML = ranking.map((anime, index) => `
      <article class="leaderboard-row anime-leaderboard-row">
        <span class="leaderboard-position">${index + 1}</span>
        <a class="leaderboard-cover" href="anime/${anime.slug}.html"><img src="${anime.cover}" alt="Capa de ${anime.title}"></a>
        <div class="leaderboard-name"><span>ANIME • ${anime.totalEpisodes} EPISÓDIOS</span><h3><a href="anime/${anime.slug}.html">${anime.title}</a></h3><small>${anime.points === 1 ? '1 usuário está assistindo' : `${anime.points} usuários estão assistindo`}</small></div>
        <div class="leaderboard-value"><strong>${formatNumber(anime.points)}</strong><span>${anime.points === 1 ? 'PONTO' : 'PONTOS'}</span></div>
      </article>
    `).join('');
  }

  if (body.dataset.page === 'user-ranking') {
    const currentUsername = getCurrentProfile()?.username || '';
    const ranking = Object.values(getProfiles()).map(profile => {
      const experience = profileExperience(profile);
      return {
        username: profile.username,
        displayName: profile.displayName || profile.username,
        experience,
        episodes: experience / experiencePerEpisode,
        level: levelFromExperience(experience).level
      };
    }).sort((first, second) => second.experience - first.experience || first.username.localeCompare(second.username, 'pt-BR'));
    document.getElementById('userRankingTotal').textContent = formatNumber(ranking.length);
    const list = document.getElementById('userRankingList');
    if (!ranking.length) {
      list.innerHTML = '<div class="leaderboard-empty"><span>♙</span><h3>Nenhum usuário cadastrado</h3><p>O ranking aparecerá quando a primeira conta for criada.</p><a class="button button-primary" href="login.html">Criar conta</a></div>';
    } else {
      list.innerHTML = ranking.map((user, index) => `
        <article class="leaderboard-row user-leaderboard-row${user.username === currentUsername ? ' is-current-user' : ''}">
          <span class="leaderboard-position">${index + 1}</span>
          <div class="leaderboard-avatar">${escapeHtml(initials(user.displayName))}</div>
          <div class="leaderboard-name"><span>${user.username === currentUsername ? 'VOCÊ • ' : ''}LEVEL ${user.level}</span><h3>${escapeHtml(user.displayName)}</h3><small>@${escapeHtml(user.username)} • ${formatNumber(user.episodes)} episódios assistidos</small></div>
          <div class="leaderboard-value"><strong>${formatNumber(user.experience)}</strong><span>XP</span></div>
        </article>
      `).join('');
    }
  }

  const loginForm = document.getElementById('loginForm');
  document.getElementById('showPassword')?.addEventListener('click', event => {
    const field = document.getElementById('password');
    field.type = field.type === 'password' ? 'text' : 'password';
    event.currentTarget.textContent = field.type === 'password' ? '◉' : '◎';
  });
  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const usernameInput = document.getElementById('username');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const username = usernameInput.value.trim();
    const error = document.getElementById('loginError');
    const submit = loginForm.querySelector('[type="submit"]');
    if (!firebaseAuth) { error.textContent = 'Não foi possível conectar ao Firebase. Verifique sua internet.'; return; }
    if (username.length < 3 || password.length < 6) { error.textContent = 'Use pelo menos 3 caracteres no usuário e 6 na senha.'; return; }
    error.textContent = '';
    submit.disabled = true;
    submit.textContent = 'Conectando...';
    try {
      const methods = await firebaseAuth.fetchSignInMethodsForEmail(email);
      let credential;
      if (methods.length) credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      else {
        credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        await credential.user.updateProfile({ displayName: username });
      }
      window.location.href = 'perfil.html';
    } catch (loginError) {
      const messages = {
        'auth/invalid-email': 'Digite um endereço de e-mail válido.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'Este e-mail já possui uma conta.',
        'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.'
      };
      error.textContent = messages[loginError.code] || 'Não foi possível entrar. Tente novamente.';
      submit.disabled = false;
      submit.textContent = 'Entrar ou criar conta';
    }
  });

  document.getElementById('googleLogin')?.addEventListener('click', async event => {
    const error = document.getElementById('loginError');
    if (!firebaseAuth) { error.textContent = 'Não foi possível conectar ao Firebase.'; return; }
    event.currentTarget.disabled = true;
    try {
      await firebaseAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      window.location.href = 'perfil.html';
    } catch (loginError) {
      if (loginError.code !== 'auth/popup-closed-by-user') error.textContent = 'Não foi possível entrar com o Google.';
      event.currentTarget.disabled = false;
    }
  });

  const getAnimeEntry = (profile, id = animeId) => profile?.anime?.[id] || { status: '', score: '', favorite: false, episodes: 0 };
  const getSeasonValues = entry => {
    if (!seasonEpisodeLimits.length) return [];
    if (Array.isArray(entry?.seasons)) {
      return seasonEpisodeLimits.map((limit, index) => Math.min(limit, Math.max(0, Number(entry.seasons[index]) || 0)));
    }
    let remaining = Math.min(totalEpisodes, Math.max(0, Number(entry?.episodes) || 0));
    return seasonEpisodeLimits.map(limit => {
      const watched = Math.min(limit, remaining);
      remaining -= watched;
      return watched;
    });
  };
  const statusSelect = document.getElementById('statusSelect');
  const scoreSelect = document.getElementById('scoreSelect');
  const listButton = document.getElementById('listButton');
  const favoriteButton = document.getElementById('favoriteButton');
  const personalVote = document.getElementById('personalVoteValue');
  const voteAction = document.getElementById('voteAction');
  const episodeInput = document.getElementById('episodeInput');
  const episodePlus = document.getElementById('episodePlus');
  const episodeProgressLabel = document.getElementById('episodeProgressLabel');
  const episodeProgressBar = document.getElementById('episodeProgressBar');
  if (voteAction && currentProfile) voteAction.textContent = 'Alterar meu voto';

  function updateAnimeControls() {
    const profile = getCurrentProfile();
    const entry = getAnimeEntry(profile);
    const episodes = Math.min(totalEpisodes, Math.max(0, Number(entry.episodes) || 0));
    const effectiveStatus = episodes >= totalEpisodes && !isAiring ? 'concluido' : entry.status || '';
    if (statusSelect) statusSelect.value = effectiveStatus;
    if (scoreSelect) scoreSelect.value = entry.score || '';
    if (personalVote) personalVote.textContent = entry.score || '—';
    if (episodeInput) episodeInput.value = String(episodes);
    if (episodeProgressLabel) episodeProgressLabel.textContent = String(episodes);
    if (episodeProgressBar) episodeProgressBar.style.width = `${(episodes / totalEpisodes) * 100}%`;
    if (episodePlus) episodePlus.disabled = episodes >= totalEpisodes;
    if (seasonEpisodeLimits.length) {
      const seasons = getSeasonValues(entry);
      document.querySelectorAll('.season-episode-input').forEach(input => {
        const index = Number(input.dataset.seasonIndex);
        input.value = String(seasons[index] || 0);
      });
      document.querySelectorAll('.season-episode-plus').forEach(button => {
        const index = Number(button.dataset.seasonIndex);
        button.disabled = (seasons[index] || 0) >= seasonEpisodeLimits[index];
      });
      seasonEpisodeLimits.forEach((limit, index) => {
        const watched = seasons[index] || 0;
        document.querySelectorAll(`[data-season-progress-label="${index}"]`).forEach(item => item.textContent = String(watched));
        document.querySelectorAll(`[data-season-progress-bar="${index}"]`).forEach(item => item.style.width = `${(watched / limit) * 100}%`);
      });
    }
    document.querySelectorAll('[data-home-episodes]').forEach(item => item.textContent = String(episodes));
    document.querySelectorAll('[data-home-progress]').forEach(item => item.style.width = `${(episodes / totalEpisodes) * 100}%`);
    if (listButton) listButton.innerHTML = effectiveStatus ? '<span>✓</span> Na minha lista' : '<span>＋</span> Adicionar à minha lista';
    if (favoriteButton) {
      favoriteButton.classList.toggle('active', Boolean(entry.favorite));
      favoriteButton.innerHTML = entry.favorite ? '<span>♥</span> Favoritado' : '<span>♡</span> Favoritar';
    }
  }
  updateAnimeControls();

  function updateEntry(change) {
    if (!requireLogin()) return false;
    const profile = getCurrentProfile();
    profile.anime ||= {};
    profile.anime[animeId] = { ...getAnimeEntry(profile), ...change, title: animeTitle, slug: animeSlug, cover: animeCover, totalEpisodes };
    saveProfile(profile);
    updateAnimeControls();
    updateSiteMetrics();
    updateCatalogCards();
    return true;
  }

  document.querySelectorAll('.quick-add').forEach(button => button.addEventListener('click', () => {
    if (updateEntry({ status: 'planejo' })) { button.innerHTML = '<span>✓</span> Adicionado à lista'; showToast('Tomb Raider King foi adicionado à sua lista'); }
  }));
  listButton?.addEventListener('click', () => {
    const active = Boolean(getAnimeEntry(getCurrentProfile()).status);
    if (updateEntry({ status: active ? '' : 'planejo' })) showToast(active ? 'Anime removido da sua lista' : 'Anime adicionado à sua lista');
  });
  statusSelect?.addEventListener('change', () => {
    const selected = statusSelect.value;
    if (updateEntry({ status: selected })) showToast(selected ? 'Status atualizado' : 'Anime removido da sua lista');
  });
  scoreSelect?.addEventListener('change', () => {
    const score = scoreSelect.value;
    if (updateEntry({ score })) showToast(score ? `Seu voto: ${score}/10` : 'Voto removido');
  });
  episodeInput?.addEventListener('change', () => {
    const episodes = Math.min(totalEpisodes, Math.max(0, Math.floor(Number(episodeInput.value) || 0)));
    const current = getAnimeEntry(getCurrentProfile());
    const previousEpisodes = Math.min(totalEpisodes, Math.max(0, Number(current.episodes) || 0));
    const status = episodes === totalEpisodes && !isAiring ? 'concluido' : episodes > 0 && (!current.status || current.status === 'planejo' || current.status === 'concluido') ? 'assistindo' : current.status;
    const gainedExperience = (episodes - previousEpisodes) * experiencePerEpisode;
    if (updateEntry({ episodes, status })) showToast(gainedExperience > 0 ? `Progresso: ${episodes}/${totalEpisodes} • +${gainedExperience} XP` : `Progresso atualizado: ${episodes}/${totalEpisodes}`);
  });
  episodeInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') episodeInput.blur();
  });
  episodePlus?.addEventListener('click', () => {
    if (!requireLogin('Entre para salvar seu progresso.')) return;
    const current = getAnimeEntry(getCurrentProfile());
    const episodes = Math.min(totalEpisodes, (Number(current.episodes) || 0) + 1);
    const status = episodes === totalEpisodes && !isAiring ? 'concluido' : 'assistindo';
    if (updateEntry({ episodes, status })) showToast(`Episódio ${episodes} marcado • +${experiencePerEpisode} XP`);
  });
  function updateSeasonProgress(index, requestedEpisodes) {
    if (!requireLogin('Entre para salvar seu progresso.')) return;
    const current = getAnimeEntry(getCurrentProfile());
    const seasons = getSeasonValues(current);
    const previousTotal = seasons.reduce((sum, value) => sum + value, 0);
    seasons[index] = Math.min(seasonEpisodeLimits[index], Math.max(0, Math.floor(Number(requestedEpisodes) || 0)));
    const episodes = seasons.reduce((sum, value) => sum + value, 0);
    const gainedExperience = (episodes - previousTotal) * experiencePerEpisode;
    const status = episodes >= totalEpisodes && !isAiring ? 'concluido' : episodes > 0 && (!current.status || current.status === 'planejo' || current.status === 'concluido') ? 'assistindo' : current.status;
    if (updateEntry({ seasons, episodes, status })) {
      showToast(gainedExperience > 0 ? `Temporada ${index + 1}: ${seasons[index]}/${seasonEpisodeLimits[index]} • +${gainedExperience} XP` : `Progresso da temporada ${index + 1} atualizado`);
    }
  }
  document.querySelectorAll('.season-episode-input').forEach(input => {
    input.addEventListener('change', () => updateSeasonProgress(Number(input.dataset.seasonIndex), input.value));
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') input.blur();
    });
  });
  document.querySelectorAll('.season-episode-plus').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.seasonIndex);
      const current = getAnimeEntry(getCurrentProfile());
      const seasons = getSeasonValues(current);
      updateSeasonProgress(index, (seasons[index] || 0) + 1);
    });
  });
  favoriteButton?.addEventListener('click', () => {
    const next = !getAnimeEntry(getCurrentProfile()).favorite;
    if (updateEntry({ favorite: next })) showToast(next ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  });
  voteAction?.addEventListener('click', () => {
    if (!requireLogin('Entre para registrar seu voto.')) return;
    scoreSelect?.focus();
    scoreSelect?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.querySelectorAll('.detail-tabs button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.detail-tabs button').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.dataset.tab)?.classList.add('active');
  }));

  if (body.dataset.page === 'profile') {
    const profile = getCurrentProfile();
    if (!profile) { window.location.replace('login.html'); return; }
    if (!profile.joinedAt) {
      profile.joinedAt = new Date().toISOString();
      saveProfile(profile);
    }
    document.querySelectorAll('[data-profile-name]').forEach(item => item.textContent = profile.displayName);
    document.querySelectorAll('[data-profile-handle]').forEach(item => item.textContent = profile.username);
    document.getElementById('profileJoinedAt').textContent = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(profile.joinedAt));
    document.getElementById('profileTheme').textContent = root.dataset.theme === 'dark' ? 'Escuro' : 'Claro';
    const entries = Object.entries(profile.anime || {}).filter(([, entry]) => entry.status || entry.score || entry.favorite || entry.episodes);
    document.getElementById('profileListCount').textContent = entries.filter(([, entry]) => entry.status).length;
    document.getElementById('profileWatchingCount').textContent = entries.filter(([id, entry]) => entry.status === 'assistindo' && (airingAnime[id] || safeEpisodes(id, entry) < (animeEpisodeLimits[id] || Number(entry.totalEpisodes) || Infinity))).length;
    document.getElementById('profileCompletedCount').textContent = entries.filter(([id, entry]) => entry.status === 'concluido' || (!airingAnime[id] && safeEpisodes(id, entry) >= (animeEpisodeLimits[id] || Number(entry.totalEpisodes) || Infinity))).length;
    document.getElementById('profileVoteCount').textContent = entries.filter(([, entry]) => entry.score).length;
    const totalExperience = profileExperience(profile);
    const levelData = levelFromExperience(totalExperience);
    document.getElementById('profileLevel').textContent = String(levelData.level);
    document.getElementById('profileLevelAside').textContent = String(levelData.level);
    document.getElementById('profileXpTotal').textContent = `${formatNumber(totalExperience)} XP`;
    document.getElementById('profileXpAside').textContent = `${formatNumber(totalExperience)} XP`;
    document.getElementById('profileXpNext').textContent = `${formatNumber(levelData.current)} / ${formatNumber(levelData.needed)} XP`;
    document.getElementById('profileXpBar').style.width = `${levelData.progress}%`;
    const list = document.getElementById('profileAnimeList');
    if (!entries.length) {
      list.innerHTML = '<div class="empty-list"><span>＋</span><h3>Sua lista está vazia</h3><p>Adicione um anime e registre seu primeiro voto.</p><a class="button button-primary" href="animes.html">Explorar animes</a></div>';
    } else {
      list.innerHTML = entries.map(([id, entry]) => {
        const fallback = animeCatalog[id] || { title: entry.title || id, slug: entry.slug || id, cover: entry.cover || 'assets/images/capas/tomb-raider-king.jpg', totalEpisodes: Number(entry.totalEpisodes) || 0 };
        const title = fallback.title;
        const slug = fallback.slug;
        const cover = fallback.cover;
        const total = fallback.totalEpisodes;
        const episodes = safeEpisodes(id, entry);
        const storedStatus = episodes >= total && !airingAnime[id] ? 'concluido' : entry.status;
        const status = storedStatus ? storedStatus.replace('planejo','Planejo assistir').replace('assistindo','Assistindo').replace('concluido','Concluído').replace('pausado','Pausado').replace('abandonado','Abandonado') : 'Sem status';
        return `<article class="profile-anime-card"><img src="${cover}" alt="Capa de ${title}"><div><span class="card-type">ANIME • ${total} EPISÓDIOS</span><h3><a href="anime/${slug}.html">${title}</a></h3><p>${status} • ${episodes}/${total} vistos <span class="anime-xp">+${episodes * experiencePerEpisode} XP</span></p></div><div class="profile-score"><span>SEU VOTO</span><strong>${entry.score || '—'}${entry.score ? '<small>/10</small>' : ''}</strong></div></article>`;
      }).join('');
    }
  }

  document.getElementById('logoutButton')?.addEventListener('click', async () => {
    if (firebaseAuth) await firebaseAuth.signOut();
    localStorage.removeItem(keys.current);
    window.location.href = 'login.html';
  });
})();
