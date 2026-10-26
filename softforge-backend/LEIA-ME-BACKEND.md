# SoftForge: como colocar o quiz no ar (passo a passo)

> Esta pasta (`softforge-backend`) **não é publicada** no site. Ela tem o gabarito do quiz. Só a pasta `softforge` vai para a hospedagem.
> Rode os comandos de teste **dentro desta pasta**.

Tudo aqui é **gratuito**. Se em qualquer passo pedirem cartão ou pagamento, **pare** e avise.
Os nomes de botões podem mudar um pouco no painel. A ideia de cada passo continua a mesma.

## Segredos: regra de ouro
Senha do banco, PIN, token do WhatsApp e seu número **nunca** vão em arquivo do site, no zip ou no chat.
Eles são digitados só no painel do Supabase (passo 4).

## 1. Criar o projeto (faça em 20/10)
1. Entre em supabase.com e crie uma conta gratuita.
2. **New project**: dê um nome (ex.: softforge), crie uma senha para o banco (guarde-a), região mais próxima (São Paulo).
3. Espere o projeto ficar pronto.

## 2. Criar as tabelas
1. Menu **SQL Editor** → **New query**.
2. Cole todo o conteúdo de `schema.sql` → **Run**.
3. Em **Table Editor** devem aparecer `attempts`, `answers` e `notifications`.

## 3. Publicar a função da API
1. Menu **Edge Functions** → **Create a new function** (ou "Deploy a new function" → "Via Editor").
2. O nome deve ser exatamente **quiz**.
3. Apague o código de exemplo e cole o conteúdo de `functions/quiz/index.ts` → **Deploy**.
4. Nas configurações da função, **desligue "Verify JWT"** (a função é pública; a segurança está dentro dela).
   - Pelo terminal, o equivalente é: `supabase functions deploy quiz --no-verify-jwt`.

## 4. Segredos da função
Em **Edge Functions → Secrets** (ou Settings → Edge Functions), crie:
| Nome | Valor |
|---|---|
| `ADMIN_PIN` | O PIN do ranking. **Mínimo 6 caracteres**, só você sabe. Sem ele o ranking fica trancado. |
| `WA_TOKEN` | Token do WhatsApp (passo 7) |
| `WA_PHONE_ID` | "Phone number ID" do número de teste (passo 7) |
| `WA_TO` | Seu número com país e DDD, **só dígitos** (ex.: 55 + DDD + número) |

Sem as três do WhatsApp, o quiz e o ranking funcionam normalmente. Só não chega o aviso.

## 5. Ligar o site à API
1. A URL da função é `https://SEU-PROJETO.supabase.co/functions/v1/quiz` (aparece na página da função).
2. Abra `softforge/js/config.js` (na pasta do SITE) e troque `api: ""` por essa URL.
3. Publique o site (GitHub Pages ou equivalente gratuito).

## 6. Teste
1. Abra `pages/desafios.html` no site publicado, jogue uma tentativa.
2. No Supabase → Table Editor → `attempts`: a tentativa deve aparecer com nota e tempo.
3. Abra `pages/ranking.html` (não está no menu), entre com o PIN e clique em **Mostrar rank**.

## 7. WhatsApp gratuito (teste em 23/10, uso em 29/10)
Usa o número de **teste** da Meta (gratuito, até 5 destinatários verificados). Passos gerais:
1. developers.facebook.com → criar app do tipo **Business** → adicionar o produto **WhatsApp**.
2. Em **API Setup**: adicione o **seu** número como destinatário e confirme o código que chegar no seu WhatsApp.
3. Copie o **Phone number ID** e o **token temporário** (vale 24 h) e guarde-os nos segredos (passo 4).
4. **Na manhã de 29/10:** gere um token novo, atualize `WA_TOKEN` e, do seu celular, mande um "oi" para o número de teste. Isso abre a janela de 24 h em que mensagens de texto livres são aceitas.
5. Se mudou algo na versão da API, defina o segredo `WA_API_VERSION` (padrão: v21.0).

## 8. Ensaio e limpeza
- **27/10, depois do ensaio:** rode `cleanup.sql` no SQL Editor para apagar os resultados de teste.
- **30/10:** rode `cleanup.sql` de novo e pause ou exclua o projeto (Project Settings → General).

## Testar sem Supabase (no seu computador)
```
node --experimental-strip-types functions/quiz/dev-server.mjs
```
Depois ponha `api: "http://localhost:8787"` em `js/config.js` (só para testar). O PIN é `demo123`, ou o valor de `ADMIN_PIN`.
Os testes automáticos: `node --experimental-strip-types --test functions/quiz/quiz.test.mjs`.

## Como funciona (para o TCC)
`start` sorteia 10 de 20 perguntas e embaralha as alternativas, só no servidor. `answer` corrige no servidor e devolve a explicação. `finish` calcula a nota e mede o tempo no servidor, grava e tenta avisar no WhatsApp **depois**, sem travar o quiz. `ranking` exige o PIN e devolve o top 5 (melhor tentativa de cada nome, nota e depois menor tempo).

## Limitações conhecidas (documente na apresentação)
- O PIN é um segredo simples. O limite de tentativas erradas é por IP e vive na memória da função.
- Quem fizer várias tentativas pode aprender as respostas. Limitamos a 2 tentativas por nome.
- Robôs persistentes e VPNs não são barrados: o público esperado é a banca e colegas.
- O aviso no WhatsApp depende da janela de 24 h e do token temporário. Os resultados ficam sempre no banco.
- O nome de usuário não prova identidade; ele só identifica a pontuação no ranking.

## Ver o ranking completo e os resultados
- **Telão:** `pages/ranking.html` no site publicado, PIN, botão **Mostrar rank**.
- **Todos os resultados:** Supabase → **Table Editor** → tabela `attempts` (nome, nota, tempo, status). Há opção de exportar em CSV.
- **Ranking completo em tabela:** SQL Editor → cole o conteúdo de `ver-ranking.sql` → Run.
