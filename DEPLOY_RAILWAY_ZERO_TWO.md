# Deploy da Zero Two na Railway

## Pacote

Este projeto é o bot Discord da Zero Two. O arquivo `.env` real não deve ser versionado nem incluído no ZIP. O repositório deve conter apenas `.env.example`, que documenta os nomes das variáveis e os valores não secretos da instalação.

## Variáveis da Railway

Na Railway, abra o serviço do bot e configure as variáveis abaixo. Os valores secretos devem ser colados diretamente no painel da Railway, nunca no GitHub.

| Variável | Valor da configuração Zero Two | Tratamento |
|---|---|---|
| `DISCORD_TOKEN` | Token do bot Zero Two | Segredo; configurar somente na Railway. |
| `MONGODB_URI` | URI do MongoDB Atlas | Segredo; configurar somente na Railway. |
| `BOT_API_KEY` | Chave da ponte bot/dashboard | Segredo; configurar somente na Railway. |
| `CLIENT_ID` | `554833756431712267` | Não secreto; usado pelo registro de Slash Commands. |
| `GUILD_ID` | `599007864153178185` | Não secreto; escopo de registro de comandos. |
| `OWNER_ID` | `544662302025187338` | Não secreto; owner local/configurado para o bot. |
| `DEFAULT_PREFIX` | `z.` | Configuração de prefixo; deve ser alinhada à lógica de prefixo do servidor. |
| `NODE_ENV` | `production` | Ambiente de produção. |
| `PORT` | `3000` | Porta padrão do processo. |
| `DASHBOARD_API_URL` | `https://zerotwo-dashboard-production.up.railway.app` | URL da ponte do dashboard. |

## Deploy pelo GitHub

Depois de extrair o ZIP, entre na pasta do bot e confira se `.env` não está presente. Em seguida, execute:

```bash
git init
git add .
git commit -m "chore: sincroniza atualização da Zero Two"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Se o repositório já existir, não execute `git init` nem adicione um segundo remote. Use apenas `git add`, `git commit` e `git push`.

## Deploy na Railway

**Importante:** o log `Cannot find module '/app/dist/src/index.js'` significa que o processo iniciou sem encontrar o build TypeScript. Nesta atualização, `railway.json` força o builder `DOCKERFILE`, e o `Dockerfile` executa `npm ci` seguido de `npm run build` antes do `npm start`.

Ao usar o ZIP, extraia o conteúdo da pasta interna `zero-two-bot-package/` para a raiz do repositório. A raiz correta precisa conter diretamente `package.json`, `Dockerfile`, `railway.json`, `src/` e `tsconfig.json`; não deixe `zero-two-bot-package/` como o único diretório no nível raiz do GitHub.

Conecte o repositório ao serviço da Railway. O `Dockerfile` compila o TypeScript e inicia `node dist/src/index.js`. Nos logs do novo deploy deve aparecer a detecção do Dockerfile e, antes do start, a etapa de build concluída. A Railway deve usar as variáveis de ambiente configuradas no painel e não um arquivo `.env` commitado.

O comando local de validação antes do push é:

```bash
npm install
npm run build
npm run lint
```

O script `npm run deploy` registra os Slash Commands no escopo definido por `CLIENT_ID` e `GUILD_ID`. Ele deve ser executado somente quando os dois IDs e o token estiverem disponíveis no ambiente que fará o registro. A inicialização normal do serviço usa `npm start`.

## Verificação pós-deploy

Após o deploy, confirme no log da Railway: conexão bem-sucedida ao MongoDB Atlas, login do bot Zero Two, sincronização do dashboard e ausência de erros fatais. Depois confirme no Discord `/help`, um comando por prefixo, `/perfil`, `/beijar`, `/ban` e `/namorar`.

Se o token ou a URI do MongoDB já tiverem sido publicados em algum lugar fora da Railway, faça a rotação dessas credenciais no Discord Developer Portal e no MongoDB Atlas antes de usar a instalação em produção. O anexo recebido contém uma falha de inicialização, não uma evidência de falha de autenticação do Discord ou do MongoDB.
