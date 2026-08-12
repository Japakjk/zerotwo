# 🦖 Manual de Operação: Darling Bot (Zero Two Edition)

Este documento fornece as diretrizes técnicas e operacionais para a implantação e gestão do **Darling Bot**, uma aplicação de alta performance para Discord baseada na personagem **Zero Two** de *Darling in the Franxx*. O sistema foi construído utilizando **TypeScript**, **Discord.js v14** e **MongoDB**, garantindo escalabilidade e robustez.

---

## 📋 Pré-requisitos do Sistema

Para garantir a operação estável da unidade Franxx, certifique-se de que o ambiente atenda aos seguintes requisitos:

| Requisito | Versão Mínima | Finalidade |
| :--- | :--- | :--- |
| **Node.js** | v18.0.0+ | Ambiente de execução JavaScript/TypeScript |
| **NPM / PNPM** | v9.0.0+ | Gerenciador de pacotes e dependências |
| **MongoDB** | v6.0+ | Banco de dados NoSQL para persistência de dados |
| **Discord Token** | N/A | Credencial de acesso à API do Discord |

---

## ⚙️ Configuração do Ambiente

O bot utiliza variáveis de ambiente para gerenciar segredos e configurações críticas. Localize o arquivo `.env` na raiz do projeto e preencha-o conforme as instruções abaixo:

> **Nota de Segurança:** Nunca compartilhe seu `DISCORD_TOKEN`. Ele é a chave de acesso à sua unidade.

```env
DISCORD_TOKEN=Seu_Token_Aqui
CLIENT_ID=ID_da_Aplicacao
GUILD_ID=ID_do_Servidor_Principal
MONGODB_URI=mongodb://localhost:27017/zero-two-bot
```

---

## 🚀 Guia de Instalação e Inicialização

Siga os passos abaixo para colocar a Zero Two em operação no seu Garden:

1. **Preparação dos Arquivos:**
   Navegue até o diretório do projeto:
   ```bash
   cd zero-two-bot
   ```

2. **Instalação Automatizada:**
   Utilize o script de inicialização fornecido para realizar o setup completo:
   ```bash
   ./start.sh
   ```

Este script executará automaticamente a instalação de dependências, a transpilação do código TypeScript para JavaScript e o deploy dos comandos de barra (Slash Commands).

---

## 🛠️ Visão Geral dos Sistemas Implementados

O Darling Bot é composto por múltiplos subsistemas integrados, cada um projetado para uma faceta específica da interação no Garden:

### 💰 Economia e Jogos
O sistema de economia utiliza a moeda **D-Coins**. Os usuários podem acumular riqueza através de comandos de trabalho (`/work`), recompensas diárias (`/daily`) e jogos de risco controlado como `Crash`, `Mines` e `Slots`.

### 📈 Progressão e Níveis
A progressão é baseada em XP (Experiência) adquirida através da atividade no chat. O sistema inclui algoritmos anti-spam para garantir uma evolução justa. Ao subir de nível, o Darling recebe bônus em D-Coins e novos títulos.

### ❤️ Relacionamentos e Social
Inspirado no vínculo entre Zero Two e Hiro, o bot permite que usuários estabeleçam conexões oficiais através do sistema de `/namorar`, com acompanhamento de tempo de união e integração direta no perfil visual.

### 🛡️ Moderação e Segurança
A moderação é gerida por um sistema de **Casos**, onde cada punição (Ban, Kick, Timeout) é registrada no banco de dados com um identificador único. O **AutoMod** protege o servidor contra convites externos e spam de forma autônoma.

---

## 📜 Comandos Principais

| Categoria | Comandos Principais | Descrição |
| :--- | :--- | :--- |
| **Perfil** | `/perfil`, `/personalizar`, `/rank` | Gestão da identidade visual e progresso. |
| **Economia** | `/saldo`, `/banco`, `/work`, `/daily` | Gestão de D-Coins e transações bancárias. |
| **Jogos** | `/mines`, `/crash`, `/slots`, `/coinflip` | Entretenimento e apostas. |
| **Social** | `/amigo`, `/namorar`, `/rep`, `/beijar` | Interações entre membros do Garden. |
| **Moderação** | `/ban`, `/kick`, `/timeout`, `/clear` | Ferramentas administrativas de controle. |

---

## 🦖 Conclusão

Sua unidade Zero Two está configurada e pronta para pilotar. Lembre-se, Darling: a eficiência do Garden depende da harmonia entre os pistoqueiros e a tecnologia. 

> "Se você não pertence a lugar nenhum, então eu vou te dar um lugar para pertencer." — **Zero Two**

Para suporte técnico ou modificações avançadas, consulte o código-fonte estruturado em `src/`.
