# Auditoria de segurança do SoftForge (fase 1: somente auditoria)

**Data:** 14/10/2026. **Versão auditada:** `softforge.zip` (pastas `softforge/` e `softforge-backend/`).
**Nenhum arquivo do projeto foi alterado** (34 arquivos conferidos por checksum antes e depois). Os ataques foram simulados contra uma **cópia** em `/tmp`, com a lógica real do back-end e o banco em memória.

## 0. Limites desta auditoria
- O prompt recebido estava **cortado** no meio da seção 8. Cobri também dependências, segredos e hospedagem, que estavam nos objetivos.
- **Não foi possível inspecionar o ambiente publicado** (projeto Supabase, GitHub Pages, conta Meta): ainda não existem. Tudo que depende deles está marcado **Pendente de validação**, com o jeito de validar.
- Os testes de ataque rodaram na **camada de lógica** (função `quiz` + banco em memória). Comportamentos do Postgres real (restrições, RLS, concorrência) foram avaliados **lendo o `schema.sql`**, e não executados.
- Não foi feita varredura automática de CVEs: o projeto não tem manifesto de dependências (`package.json`/lockfile).
- Legenda: **Confirmado** (reproduzido ou visto no código), **Risco potencial**, **Pendente de validação**.

## 1. Resumo executivo
Não encontrei vulnerabilidade **crítica**. Não há segredo no código, nem script de terceiros, nem `eval`, nem execução de HTML do usuário nos fluxos reais, e o gabarito não está no navegador. O servidor calcula nota e tempo.
O ponto fraco real é a **integridade do ranking e o abuso de recursos**: um script simples vence o ranking e inunda o WhatsApp. Como o público é a banca e colegas, a probabilidade é baixa a moderada, mas o impacto atinge exatamente a função principal do quiz.

| ID | Severidade | Achado | Status |
|---|---|---|---|
| F-01 | **Alta** | Ranking manipulável por automação | Confirmado |
| F-02 | **Média** | Inundação de avisos no WhatsApp e consumo de cotas | Confirmado |
| F-04 | **Média** | Reserva indevida de nomes (inclusive por tentativas expiradas) | Confirmado |
| F-05 | **Média** | Corrida: mesmo nome em dois aparelhos | Confirmado (lógica) |
| F-06 | **Média** | Respostas duplicadas simultâneas permitem nota máxima | Confirmado no banco em memória; mitigado pela PK, a validar |
| F-07 | Baixa-Média | `finish` sem tempo limite na chamada à Meta | Confirmado sem `waitUntil`; a validar |
| F-03 | Baixa | Bloqueio de PIN fraco (estado em memória, IP por cabeçalho) | Confirmado fora de proxy; a validar |
| F-08 | Baixa | Limite de 2 tentativas é por nome, não por pessoa | Confirmado |
| F-10 | Baixa | Campos numéricos sem escape (XSS se a API for adulterada) | Confirmado em teste |
| F-12 | Baixa | Homóglifos e normalização de nomes | Confirmado |
| F-19 | Baixa | Privacidade: aviso curto, identificador do aparelho não declarado | Confirmado |
| F-22 | Baixa | PIN aceita valores fracos (≥ 6 caracteres) | Confirmado |
| F-09, F-11, F-13 a F-18, F-20, F-21 | Info | Ver seção 5 | |

## 2. Arquitetura e superfície de ataque
```
Navegador (site estático) --HTTPS POST JSON--> Edge Function `quiz` (pública)
   | ações: start, answer, finish        | ação restrita: ranking (PIN do dono)
   v                                      v
Postgres (service role; RLS ligado, sem políticas)     graph.facebook.com (Bearer WA_TOKEN) --> WhatsApp do dono
```
- **Páginas públicas:** index e 8 páginas internas. **Oculta (sem proteção por si só):** `pages/ranking.html` (a segurança real é o PIN no servidor).
- **Scripts do navegador:** main, lab, processo, qrcode (biblioteca MIT), qrpage, simulador, config, desafios, ranking. Sem CDN e sem scripts inline.
- **Rotas do back-end:** uma função, quatro ações. Só POST (e OPTIONS).
- **Entradas do usuário:** nome, respostas e escolha (servidor); campo de endereço da página QR (só local); cabeçalhos HTTP.
- **Segredos:** `ADMIN_PIN`, `WA_TOKEN`, `WA_PHONE_ID`, `WA_TO` e a chave de serviço (injetada pelo Supabase). Ficam só no servidor. Públicos: tudo em `softforge/`, incluindo a URL da função em `config.js`.

## 3. Matriz de permissões (conforme `schema.sql`)
| Tabela | anon (chave pública) | authenticated | função `quiz` (service role) | Proprietário (painel/SQL) |
|---|---|---|---|---|
| `attempts` | nenhuma | nenhuma | SELECT, INSERT, UPDATE | tudo |
| `answers` | nenhuma | nenhuma | SELECT, INSERT | tudo |
| `notifications` | nenhuma | nenhuma | INSERT | tudo |

A função **não usa DELETE**: a limpeza é feita pelo dono no SQL Editor. A coluna "nenhuma" vem de RLS ligado **sem políticas**; **pendente de validação** no projeto real (seção 7). A chave de serviço nunca chega ao navegador (confirmado: o site não tem nenhuma chave).

## 4. O que está funcionando (controles verificados)
- Nota e tempo calculados no servidor; gabarito fora do JavaScript público; resposta não pode ser alterada; tentativa expira em 30 min; pergunta fora do sorteio é recusada; `finish` exige tudo respondido (13 testes automáticos).
- PIN comparado em tempo constante e **só no servidor**; sem `ADMIN_PIN` configurado, o ranking fica trancado; o PIN não é guardado no navegador (conferido: `localStorage` e `sessionStorage` vazios).
- Nomes: regex estrita. Testados `<img onerror>`, `<script>`, `javascript:`, `'; DROP TABLE`, `../`, RTL override, zero-width e emoji: **todos recusados**.
- Texto do servidor (nome, pergunta, alternativa, explicação) escapado no navegador: 3 testes com API simulada maliciosa, **sem execução**.
- Erro interno devolve só `SERVER_ERROR`: um segredo colocado de propósito na exceção **não vazou**. Corpo limitado a 4 KB. Respostas sem campos internos (sem `device_id`, sem gabarito).
- Modo de apresentação só captura teclas enquanto ativo.

## 5. Achados detalhados
**F-01 Ranking manipulável (Alta, Confirmado).** Um bot aprendeu as 20 respostas em **5 tentativas (72 requisições)** e fez **10/10 em 3 ms**, ficando em **1º lugar**. Causa: o servidor revela a resposta certa depois de cada resposta, e o limite de tentativas não impede nomes novos. Impacto: o ranking perde o sentido. Correção gratuita: (a) duração mínima plausível (por exemplo, descartar ou marcar tentativas com menos de ~1,5 s por pergunta); (b) limite de `start` por IP e por aparelho, com contador no banco; (c) coluna de "suspeita" que exclui do ranking; (d) opcional: modo ranking sem feedback imediato (revela só no fim); (e) só se necessário: Cloudflare Turnstile (gratuito, mais uma dependência). Esforço: baixo a médio. **Decisão do dono:** feedback imediato é didático, e o modo ranking sem feedback é mais seguro.

**F-02 Inundação de avisos (Média, Confirmado).** 100 tentativas automáticas geraram **100 chamadas ao WhatsApp**. Sem limite global. Impacto: spam no celular do dono, possível bloqueio do número de teste, consumo das cotas gratuitas (o limite do Supabase deve ser conferido no painel). Correção: contar os envios dos últimos minutos na tabela `notifications` e enviar no máximo N por intervalo, ou só quando a pessoa entrar no top 5. Esforço: baixo.

**F-04 Reserva de nomes (Média, Confirmado).** Seis nomes reservados sem terminar o quiz continuaram bloqueando "Maria" **3 horas depois**, com as tentativas já expiradas, por causa do `NAME_TAKEN`. Correção: ignorar tentativas expiradas e não finalizadas na unicidade e na contagem de tentativas. Esforço: baixo.

**F-05 Corrida de nomes (Média, Confirmado na lógica).** Dois `start` simultâneos com o mesmo nome em aparelhos diferentes retornaram 200, com 2 tentativas gravadas. O `schema.sql` só tem chaves primárias (sem unicidade do nome). Como o ranking junta por nome, há personificação. Correção: tabela `players(nickname_key primary key, device_id)` com inserção atômica. Esforço: médio.

**F-06 Respostas duplicadas (Média, condicional).** No banco em memória, 10 respostas simultâneas à mesma pergunta permitiram **finalizar com 10/10 tendo respondido uma só pergunta**. No banco real, a chave primária `(attempt_id, qid)` de `answers` impediria isso (**pendente de validação** após aplicar o SQL), mas a violação viraria erro 500. Correção: tratar a violação como resposta repetida e contar perguntas distintas. A demonstração publicada usa o banco em memória, então este cenário vale para ela.

**F-07 Sem tempo limite na Meta (Baixa-Média).** Com a Meta sem responder, o `finish` ficou **sem resposta por 3 s** (sem `waitUntil`). Se o ambiente oferecer `EdgeRuntime.waitUntil` o impacto some (**pendente de validação**). Correção: tempo limite de 5 s e `waitUntil`.

**F-03 / F-22 PIN (Baixa).** O contador fica em memória, por instância. Com o cabeçalho `X-Forwarded-For` variando, **0 de 20** chutes foram bloqueados. Em produção, o código usa `cf-connecting-ip` ou o último valor do `X-Forwarded-For`; se o Supabase os preenche de forma confiável, o bloqueio funciona (**pendente de validação**). O ADMIN_PIN só exige 6 caracteres (aceitaria até `demo123`). O impacto é limitado: o painel **só lê** nomes e notas e não escreve nada. Correção: PIN de 12 ou mais caracteres aleatórios e recusa de PINs fracos. Esforço: baixo.

**F-08 Limite por nome (Baixa).** 8 nomes diferentes no mesmo aparelho foram aceitos. Faz parte de F-01 e deve ser documentado como limitação.

**F-10 Campos numéricos sem escape (Baixa).** `score`, `total`, posição e tempo entram em `innerHTML` sem escape em `desafios.js` e `ranking.js`. Com uma API adulterada, o script **executou** (teste com API simulada). Hoje o servidor só devolve inteiros, então o risco é de defesa em profundidade. Correção: converter com `Number()` ou usar `textContent`.

**F-12 Nomes (Baixa).** "Аna" (A cirílico) é aceito e parece "Ana". Nomes só com letras não latinas ("Иван", "日本語") e "ＡＢＣ" são recusados com a mensagem enganosa `NAME_BLOCKED`, porque a chave de unicidade descarta o que não é a-z/0-9. Colisões podem dar falso "nome em uso". Correção: normalização NFKC e bloqueio de scripts misturados.

**F-19 Privacidade (Baixa).** O aviso na tela do nome é curto. Falta dizer: dados coletados (nome, resultado e um identificador do aparelho em `localStorage`), finalidade, exclusão em 30/10 e contato do responsável.

**Informativos.**
- **F-09:** corpo JSON `null` causa TypeError e responde **500** em vez de 400.
- **F-11:** não há CSP, política de referrer ou proteção contra enquadramento. Hospedagens estáticas costumam não permitir cabeçalhos personalizados (**pendente de validação** na escolhida). Dá para usar `<meta>` para CSP e referrer. Há 13 `style=` inline, então `style-src` precisaria de `'unsafe-inline'`. Não há scripts inline, então `script-src 'self'` é viável. `frame-ancestors` não funciona por `<meta>`.
- **F-13:** `NAME_TAKEN` revela nomes em uso (inerente).
- **F-14:** CORS `*` é adequado para API pública sem cookies. Não há sessão por cookie, então CSRF não se aplica.
- **F-15:** `npm:@supabase/supabase-js@2` aceita versões menores novas, e `qrcode.js` não tem versão registrada. Fixar versão e checksum.
- **F-16:** `console.error(e)` grava a exceção inteira em logs (só o dono acessa). `notifications.detail` guarda até 300 caracteres da resposta de erro da Meta.
- **F-17 `verify_jwt = false`:** é coerente, pois a função é pública por desenho e a autorização é o PIN. Alternativa mantendo o JWT ligado: enviar a chave pública do Supabase no cabeçalho, mas essa chave é pública e daria pouca proteção, com mais complexidade. Recomendo manter desligado e tratar o abuso com F-01 e F-02. O `config.toml` só vale para o CLI: no painel o botão precisa ser desligado **(pendente de validação)**.
- **F-18 RLS:** ligado nas 3 tabelas e sem políticas. Reforço gratuito: `revoke all` de `anon` e `authenticated`.
- **F-20 Hospedagem:** HTTPS obrigatório (opção "Enforce HTTPS") e sem conteúdo misto, **pendente de validação**.
- **F-21 Risco operacional:** publicar `softforge-backend/` junto com o site expõe o gabarito. O zip já separa as pastas, e os guias avisam.

## 6. Limitações da identificação por nome de usuário
Um nome não identifica uma pessoa. O identificador em `localStorage` apaga com a limpeza do navegador ou pela aba anônima. Quem quiser, joga com vários nomes ou aparelhos, e o servidor não consegue provar quem é quem. O que o sistema consegue é **dificultar** a fraude, e não impedi-la: as medidas de F-01 reduzem o abuso casual, mas um atacante determinado ainda poderá contorná-las. Isso deve ser dito na apresentação.

## 7. Pendente de validação (como verificar, sem enviar segredos por chat)
1. **Função pública:** no painel, a opção de verificação de JWT da função `quiz` está desligada? Abrir o site e jogar: deve funcionar.
2. **RLS efetivo:** com a chave pública do seu projeto, `curl "https://SEU-PROJETO.supabase.co/rest/v1/attempts?select=*" -H "apikey: SUA_CHAVE_PUBLICA"` deve devolver lista vazia ou erro, **nunca** os dados. Rode o mesmo para `answers` e `notifications`. Não cole a chave aqui.
3. **PIN:** o segredo `ADMIN_PIN` existe e tem 12 ou mais caracteres? Errar o PIN 6 vezes seguidas: a 6ª resposta deve ser 429. Repetir de outra rede (4G): deve voltar a aceitar tentativas.
4. **Chave primária de `answers`:** no Table Editor, a tabela mostra a chave `(attempt_id, qid)`.
5. **Tempo do `finish`:** com um `WA_TOKEN` propositalmente inválido, o resultado do quiz deve aparecer sem demora.
6. **HTTPS e cabeçalhos:** "Enforce HTTPS" ligado; `curl -I` na página para ver os cabeçalhos entregues.
7. **Cotas e custo:** painel do Supabase (invocações e armazenamento) e conta Meta (nenhum pedido de pagamento).

## 8. Plano de correção proposto (nada foi implementado)
**Prioridade 1, antes de 22/10:** F-01, F-02, F-04, F-05, F-06, F-07, F-22 e F-09. **Prioridade 2:** F-10, F-12, F-19, F-18, F-11 (CSP/referrer por `<meta>`) e F-15. **Sempre:** transformar os scripts desta auditoria (`auditoria-testes/`) em testes de regressão, rodar o checklist da seção 7 e reaplicar o `cleanup.sql` depois do ensaio.
Tudo com custo R$ 0. Se alguma correção pedir serviço pago ou cartão, não será feita: apresentaremos alternativa.

## 9. O que preciso de você para a fase 2
1. Autorização explícita para alterar arquivos.
2. **Decisão:** manter o feedback imediato a cada pergunta ou revelar as respostas só no fim do quiz no modo ranking (mais seguro, menos didático).
3. Aceitar que o ranking proteja contra abuso casual, e não contra um atacante determinado.
