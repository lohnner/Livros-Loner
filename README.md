# Animes Dihhz

Protótipo de catálogo exclusivamente de animes em português, inspirado na organização de plataformas como o MyAnimeList.

## Estrutura

- `index.html` — página inicial
- `animes.html` — catálogo com todos os animes cadastrados
- `anime/tomb-raider-king.html` — detalhes da adaptação animada de Tomb Raider King
- `anime/dorohedoro.html` — página de Dorohedoro com 12 episódios
- `login.html` — login e criação de conta com Google ou e-mail
- `perfil.html` — perfil, lista e votos do usuário
- `assets/css/style.css` — estilos globais e responsivos
- `assets/js/app.js` — busca, filtros, tema, lista, favoritos, notas e abas
- `assets/images/capas/` — capas baixadas e armazenadas localmente

O progresso de cada anime pode ser informado manualmente ou avançado pelo botão `+`. Tomb Raider King e Dorohedoro possuem 12 episódios cada. Contas, listas, votos, progresso, XP e rankings são sincronizados pelo Firebase.

Cada episódio assistido concede 22 XP. O level do perfil não possui limite fixo e utiliza uma curva crescente inspirada na fórmula de experiência do Tibia.

Abra `index.html` em um navegador ou sirva a pasta com um servidor HTTP local.
