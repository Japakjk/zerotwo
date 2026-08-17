# 🌸 Zero Two Bot — Darling Edition (Darling in the Franxx)

> *"Você quer ser meu Darling?"* — Zero Two 🦖❤️

Bot de Discord profissional, moderno e altamente imersivo inspirado na **Zero Two** (*Darling in the Franxx*). Desenvolvido com uma arquitetura de alta performance, suporte a comandos híbridos (**Slash Commands `/` e prefixo tradicional `zero!`**), validação rigorosa com **Zod**, banco de dados **MongoDB Atlas** e identidade visual totalmente customizada com emojis temáticos.

---

## 📋 Sumário

1. [Arquitetura do Projeto](#-arquitetura-do-projeto)
2. [Pré-requisitos](#-pré-requisitos)
3. [Instalação e Configuração](#-instalação-e-configuração)
4. [Variáveis de Ambiente (`.env`)](#-variáveis-de-ambiente-env)
5. [Scripts Disponíveis](#-scripts-disponíveis)
6. [Sistemas Principais](#-sistemas-principais)
7. [Guia de Deploy (Railway)](#-guia-de-deploy-railway)
8. [Troubleshooting](#-troubleshooting)

---

## 🏛️ Arquitetura do Projeto

O bot foi estruturado seguindo os mais altos padrões de engenharia de software em **TypeScript**, garantindo separação estrita de responsabilidades entre comandos, serviços de negócio, modelos de dados e utilitários visuais.

```text
src/
├── commands/         # Comandos organizados por categoria (economy, moderation, social, utility, owner)
├── database/         # Conexão Mongoose e Models (Guild, User, EconomyTransaction, Ticket, Giveaway, etc.)
├── services/         # Regras de negócio encapsuladas (Economy, Leveling, Ticket, Maintenance, Cron, etc.)
├── utils/            # Utilitários centralizados (Embeds temáticos, Emojis customizados, Winston Logger)
├── config/           # Validação estrita de variáveis de ambiente com Zod
└── index.ts          # Ponto de entrada principal, registro de eventos e dispatchers híbridos
```

---

## ⚙️ Pré-requisitos

Certifique-se de possuir o seguinte ambiente configurado antes de iniciar:
- **Node.js** versão 22.x ou superior [1].
- **npm** ou **pnpm** [1].
- Cluster ativo no **MongoDB Atlas** [2].
- Aplicação configurada no [Discord Developer Portal](https://discord.com/developers/applications) com os Intents Privados habilitados (`Message Content`, `Server Members`, `Presence`).

---

## 📦 Instalação e Configuração

Clone o repositório e instale as dependências necessárias utilizando o terminal:

```bash
# Instalar dependências
npm install

# Compilar o projeto TypeScript
npm run build
```

---

## 🔐 Variáveis de Ambiente (`.env`)

O projeto utiliza um validador baseado em **Zod** (`src/config/config.ts`) que valida todas as chaves críticas na inicialização. Se alguma variável obrigatória estiver ausente, o bot será interrompido imediatamente para evitar falhas silenciosas.

Crie um arquivo `.env` na raiz do projeto com a seguinte estrutura:

```env
# Token da sua Aplicação no Discord Developer Portal
DISCORD_TOKEN=seu_token_discord_aqui

# URI de Conexão com o MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority

# Configurações Opcionais
PORT=3000
NODE_ENV=production
```

---

## 📜 Scripts Disponíveis

O arquivo `package.json` disponibiliza os seguintes scripts para o ciclo de desenvolvimento e produção:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Executa o bot em modo de desenvolvimento com `nodemon` e recarga automática. |
| `npm run build` | Compila os arquivos TypeScript da pasta `src/` para JavaScript na pasta `dist/`. |
| `npm start` | Inicia o bot em modo de produção utilizando o build compilado (`node dist/index.js`). |
| `npm run deploy` | Registra e atualiza os Slash Commands globalmente na API do Discord. |
| `npm run lint` | Executa o linter para verificação de estilo de código. |

---

## 🌟 Sistemas Principais

### 1. Sistema Híbrido de Comandos
Todos os comandos suportam tanto o padrão moderno do Discord (**Slash Commands `/`**) quanto o prefixo tradicional configurável por servidor (**`zero!`**, alterável via `/prefixo`).

### 2. Economia Profissional & VIP
- **D-Coins**: Gestão completa de saldo, carteira e cofre (`/saldo`, **/banco**, **/pay**).
- **Transações Atômicas**: Histórico detalhado (`EconomyTransactionModel`) com IDs únicos para rastreabilidade de pagamentos, roubos e prêmios de minigames (`/mines`, `/crash`, `/blackjack`, `/roleta`).
- **Níveis VIP (1 a 5)**: Bônus progressivos de ganho de coins/XP e redução de cooldowns.

### 3. Sistema de Níveis e XP (Fase 11)
- Ganho de XP por mensagens com cooldown integrado (60s) para evitar spam.
- Multiplicadores de XP configuráveis por guilda (`/config levels`).
- Atribuição automática de cargos por nível alcançado.

### 4. Sistema de Tickets & Suporte (Fase 24)
- Painel interativo para abertura de tickets de suporte ou aquisição de VIP.
- Prevenção rigorosa de tickets duplicados por usuário e geração automática de transcripts enviados para canais de log.

### 5. Modo Manutenção & Segurança (Fase 19 & 15)
- **Modo Manutenção**: Painel interativo exclusivo para o Owner (`ID: 554833756431712267`) para pausar o bot globalmente ou desativar comandos específicos.
- **AutoMod & Anti-Raid**: Proteção avançada contra spam, flood, links maliciosos e entradas em massa.

---

## 🚀 Guia de Deploy (Railway)

O bot está totalmente preparado para hospedagem em nuvem na [Railway](https://railway.com/) [3]:

1. Conecte seu repositório GitHub ao seu projeto na Railway.
2. Configure as **Environment Variables** (`DISCORD_TOKEN`, `MONGODB_URI`) no painel da Railway.
3. Certifique-se de que o comando de build está configurado como `npm run build` e o comando de start como `npm start`.
4. O bot iniciará com latência otimizada (~100ms) e persistência total no MongoDB Atlas.

---

## 🛠️ Troubleshooting

- **Erro de Conexão com MongoDB**: Verifique se o IP da sua hospedagem está liberado na Network Access do MongoDB Atlas (`0.0.0.0/0`) [2].
- **Falha na Validação do Zod**: Certifique-se de que o arquivo `.env` contém exatamente as variáveis `DISCORD_TOKEN` e `MONGODB_URI` preenchidas corretamente.
- **Slash Commands não aparecem**: Execute `npm run deploy` para sincronizar os comandos com a API do Discord.

---

## 📚 Referências

[1] **Node.js Documentation**. Disponível em: <https://nodejs.org/docs/>.  
[2] **MongoDB Atlas Documentation**. Disponível em: <https://www.mongodb.com/docs/atlas/>.  
[3] **Railway Deployment Guide**. Disponível em: <https://railway.app/docs>.

---
*Desenvolvido com dedicação e carinho para o universo de Darling in the Franxx. Darling!* ❤️
