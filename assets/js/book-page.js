(() => {
  document.body.innerHTML = `
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header class="site-header">
      <div class="header-inner shell">
        <a class="brand" href="../../index.html" aria-label="Livros Loner — início">
          <span class="brand-mark" aria-hidden="true">LL</span><strong>Livros Loner</strong>
        </a>
        <nav class="main-nav" id="mainNav" aria-label="Navegação principal">
          <a href="../../index.html">Início</a>
          <a class="active" href="../index.html">Livros</a>
          <div class="nav-dropdown">
            <a href="../../ranking/livros.html" aria-haspopup="true">Ranking</a>
            <div class="nav-dropdown-menu">
              <a href="../../ranking/livros.html">Ranking de Livros</a>
              <a href="../../ranking/usuarios.html">Ranking de Usuários</a>
            </div>
          </div>
          <button class="random-book-button" type="button" data-random-book>↝ Aleatório</button>
        </nav>
        <div class="account-nav">
          <a class="login-link auth-guest" href="../../login.html">Entrar</a>
          <a class="user-pill auth-user" href="../../perfil.html">
            <span class="user-initials" data-user-initials>L</span><span data-header-level>Nível 1</span>
          </a>
        </div>
        <button class="menu-toggle" type="button" data-menu-toggle aria-controls="mainNav" aria-expanded="false" aria-label="Abrir menu">☰</button>
      </div>
    </header>
    <main id="conteudo" class="detail-main shell" data-book-detail>
      <div class="breadcrumbs"><a href="../../index.html">Início</a><i>›</i><a href="../index.html">Livros</a><i>›</i><span data-breadcrumb-title>Livro</span></div>
      <section class="detail-panel">
        <div class="book-cover"><img data-detail-cover src="" alt=""></div>
        <div class="detail-copy">
          <span class="kicker" data-detail-label>Edição brasileira</span>
          <h1 data-detail-title>Livro</h1>
          <p class="original-title" data-detail-original></p>
          <p class="detail-summary" data-detail-summary></p>
          <div class="tag-row"><span class="tag" data-detail-genre></span><span class="tag">Edição brasileira</span><span class="tag" data-detail-year></span></div>
          <div class="book-author-badge"><small>Autoria</small><strong data-detail-author></strong><span data-detail-author-nationality></span></div>
        </div>
      </section>
      <section class="reading-tracker" data-reading-tracker data-book-id="" data-book-title="" data-book-slug="" data-book-cover="" data-total-pages="0">
        <div class="tracker-intro"><span class="kicker">Sua leitura</span><h2>Registre seu progresso</h2><p>1 página lida = 1 XP · níveis sem limite</p></div>
        <div class="tracker-guest auth-guest"><p>Entre para salvar o livro e ganhar XP.</p><a class="button" href="../../login.html">Entrar</a></div>
        <div class="tracker-user auth-user">
          <div class="tracker-field"><label for="readingStatus">Status</label><select id="readingStatus" data-reading-status><option value="">Selecionar</option><option value="owned">Tenho o livro</option><option value="reading">Estou lendo</option><option value="want">Quero ler</option><option value="finished">Finalizado</option><option value="abandoned">Abandonado</option></select></div>
          <div class="tracker-field"><label for="pagesRead">Páginas lidas</label><input id="pagesRead" type="number" min="0" max="0" value="0" data-pages-read></div>
          <button class="tracker-save" type="button" data-save-progress>Salvar</button>
          <div class="tracker-progress"><div class="tracker-progress-bar"><span data-reading-bar></span></div><small data-reading-label>0 páginas · 0 XP</small></div>
          <p class="tracker-message" data-tracker-message></p>
        </div>
      </section>
      <div class="compact-info"><section class="content-box book-about-wide"><span class="kicker">Sobre o livro</span><h2>Conheça esta obra</h2><p data-detail-about></p></section></div>
      <div class="compact-sources"><strong>Fonte bibliográfica e capa:</strong> <a data-detail-source href="#" target="_blank" rel="noreferrer">Open Library ↗</a></div>
    </main>
    <footer class="site-footer"><div class="footer-inner shell"><span>Livros Loner</span><small>© <span data-current-year></span></small></div></footer>`;
})();
