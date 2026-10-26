# SoftForge — pacote revisado

## Alterações realizadas nesta revisão
- Imagens PNG preservadas e versões WebP otimizadas adicionadas; as páginas usam WebP.
- Favicon SVG adicionado em `assets/favicon.svg`.
- Metadados de descrição, Open Graph e Twitter Card adicionados às páginas.
- Página `pages/sobre.html` criada com campos para instituição, curso, autores e orientação, além de referências iniciais.
- Cabeçalho e rodapé estáticos de fallback adicionados para que os links essenciais existam sem JavaScript; aviso de fallback incluído.
- Fonte Inter armazenada localmente em `assets/fonts/` com licença. Space Grotesk foi substituída por Inter nos títulos para evitar dependência de fonte remota durante apresentação offline.
- Simulador de decisões implementado em `pages/simulador.html` + `js/simulador.js`.
- Quiz educativo implementado em `pages/desafios.html` + `js/desafios.js`.
- Modo de apresentação adicionado ao cabeçalho, com navegação por seções usando setas/PageUp/PageDown e opção de sair.
- Links internos verificados; scripts JavaScript passaram em `node --check`.

## Antes de entregar/publicar
1. Substitua `[Preencher ...]` na página Sobre por dados reais do TCC.
2. Revise as referências bibliográficas e a edição/formatação exigida pela instituição.
3. Depois da hospedagem, substitua `https://SEU-DOMINIO/...` nas tags Open Graph/Twitter pelo endereço HTTPS real. As prévias sociais dependem de URL pública absoluta.
4. Teste o site em um celular real e em pelo menos um navegador diferente.
5. A hospedagem e a configuração final do página Quem sou eu não foram alteradas nesta revisão.
6. O modo de apresentação foi validado estaticamente e por verificação de sintaxe; ainda precisa de teste manual em navegador real, inclusive em projetor.

## Nota sobre fontes
Inter está incluída localmente. A fonte Space Grotesk original dependia do Google Fonts e não estava no ZIP; por isso os títulos usam Inter local, garantindo uma aparência consistente sem internet.


## Ajustes desta segunda revisão
- Abas Simulador e página Quem sou eu voltaram ao cabeçalho (o menu agora tem 8 links; Sobre fica no rodapé).
- Space Grotesk restaurada nos títulos, agora local em woff2 (assets/fonts), junto com Inter em woff2. Os 4 arquivos .otf (2,5 MB) foram removidos.
- Corrigido o texto acima do título da antiga página página Quem sou eu.
- Chave interna da página Sobre padronizada de `about` para `sobre`.

## 21/10: quiz removido do site
- `pages/desafios.html`, `pages/ranking.html`, `js/desafios.js`, `js/ranking.js`, o CSS do quiz e o back-end foram para `extras-quiz-removido/`.
- Menu, busca e rodapé não têm mais Desafios.
- Celular: grades de 2 colunas empilham, cabeçalho cabe em 360 px, abas do Processo em grade e diagrama do laboratório com rolagem própria.

## 23/10: página página Quem sou eu removida
- Arquivos guardados em `extras-removidos/qrcode/`. Menu, busca e rodapé sem página Quem sou eu. `js/config.js` e `js/qrcode.js` (biblioteca do QR) saíram junto, pois só o QR usava.


## 26/10: página Quem sou eu
- A antiga página QR code permanece fora do site e seus arquivos foram removidos deste pacote.
- A página `pages/sobre.html` foi transformada em “Quem sou eu”, com trajetória profissional, objetivos com o curso e agradecimento final.
- O item “Quem sou eu” foi adicionado à navegação principal, à busca e ao rodapé.
