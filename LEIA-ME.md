# Quiz removido do SoftForge (guardado aqui)

Em 21/10/2026 o quiz saiu do site. Nada foi apagado: tudo está nesta pasta.

- `site/`: as páginas e scripts do quiz e do ranking (`pages/desafios.html`, `pages/ranking.html`, `js/desafios.js`, `js/ranking.js`) e `quiz.css` (os estilos).
- `softforge-backend/`: o servidor do quiz (Supabase) com guia, SQL e testes.
- `AUDITORIA-SEGURANCA.md` e `auditoria-testes/`: a auditoria de segurança feita no back-end.

## Como restaurar (se mudar de ideia)
1. Copie `site/pages/*` para `softforge/pages/` e `site/js/*` para `softforge/js/`.
2. Cole o conteúdo de `site/quiz.css` no fim de `softforge/css/pages.css`.
3. Em `softforge/js/main.js`: volte `desafios:["Desafios","pages/desafios.html"]` no objeto `P`, `"desafios"` na lista `NAV` e a entrada de busca `Quiz|Teste seus conhecimentos|desafios;`.
4. Em `softforge/js/config.js` volte `api: ""` e siga `softforge-backend/LEIA-ME-BACKEND.md`.
