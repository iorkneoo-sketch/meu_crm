# wacrm — Template CRM para WhatsApp

> Template CRM auto-hospedável para WhatsApp® — caixa de entrada
> compartilhada, contatos, pipelines de vendas, broadcasts e
> automações no-code. Faça um fork, personalize, hospede.

<p align="center">
  <a href="https://www.hostinger.com/web-apps-hosting">
    <img src="./.github/assets/hostinger-deploy.png" alt="Implante seu app Node.js em um clique — Deploy na Hostinger" width="900">
  </a>
</p>

[![Licença: MIT](https://img.shields.io/badge/Licença-MIT-violet.svg)](./LICENSE)
[![CI](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnasDon/wacrm/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ecf8e?logo=supabase)](https://supabase.com)
[![Estrelas](https://img.shields.io/github/stars/ArnasDon/wacrm?style=social)](https://github.com/ArnasDon/wacrm/stargazers)

O site de marketing e a documentação de auto-hospedagem estão em um
repositório separado:
[ArnasDon/wacrm-site](https://github.com/ArnasDon/wacrm-site)
([wacrm.tech](https://wacrm.tech)). Este repositório é o produto —
clone ou faça um fork para rodar seu próprio CRM.

## O que você ganha de cara

- **Caixa de entrada compartilhada** na API oficial do WhatsApp
  Business — múltiplos agentes em um único número, atribuição por
  conversa, status e anotações.
- **Contatos + tags + campos personalizados**, importação CSV,
  deduplicação.
- **Pipelines de vendas** (Kanban) com negócios vinculados a conversas.
- **Broadcasts** com templates aprovados pela Meta, rastreamento de
  entrega + leitura, substituição de variáveis por destinatário.
- **Automações no-code** — gatilhos em mensagens recebidas, novos
  contatos, palavras-chave ou agendamento; ramificações condicionais,
  esperas, tags, webhooks. Construtor visual.
- **Dashboard em tempo real** — tempos de resposta, volume diário,
  valor do pipeline, feed de atividade entre módulos.
- **Contas de equipe** — convide colegas por link, acesso baseado em
  papéis (owner / admin / agent / viewer), transferência de
  propriedade. Cada instalação tem seu próprio escopo de conta, então
  uma única caixa de entrada compartilhada pode ser operada por uma
  equipe inteira. Uso individual permanece monousuário sem
  configuração extra.
- **Gerenciamento de conta** — e-mail, senha, avatar, saída global.
- **API REST pública** (`/api/v1`) com chaves de API escopadas e
  revogáveis — crie suas próprias automações sobre o CRM. Veja
  [docs/public-api.md](./docs/public-api.md).

## Por que fazer um fork?

Isto é um **template**, não um produto. Fazer um fork significa que
você obtém:

- **Propriedade total** — seu código, seu projeto Supabase, seu
  domínio, seus dados. Sem vendor lock-in, sem precificação por
  assento, sem dança da confiança.
- **Personalização total** — adicione os campos que sua equipe precisa,
  remova os módulos que não usa, redesenhe tudo. A stack é
  propositalmente simples (Next.js + Supabase + Tailwind) para a curva
  de aprendizado ser curta.
- **Zero operações para começar** — o Node.js gerenciado da
  [Hostinger](https://www.hostinger.com/web-apps-hosting) faz o deploy
  de um fork em poucos cliques. Sem Docker, sem Kubernetes, sem equipe
  de infra. ([Veja abaixo ↓](#-deploy-na-hostinger-recomendado))
- **Primitivos reais de segurança** — criptografia de tokens
  (AES-256-GCM), RLS em toda tabela, webhooks verificados por HMAC,
  CSP, rate limiting, CI com typecheck/build em todo PR.

Não é um framework. Não é um SDK. É um CRM concreto e funcional que
você pode colocar de pé em uma tarde e fazer seu.

## Início rápido

```bash
# Faça o fork no GitHub primeiro: https://github.com/ArnasDon/wacrm → Fork
git clone https://github.com/<seu-usuario>/wacrm.git
cd wacrm
npm install
cp .env.local.example .env.local   # preencha credenciais Supabase + Meta
npm run dev
```

Abra <http://localhost:3000>. Você será redirecionado para `/login` (ou
para `/dashboard` se já estiver logado).

## 🚀 Deploy na Hostinger (recomendado)

<p align="center">
  <a href="https://www.hostinger.com/web-apps-hosting">
    <img src="./.github/assets/hostinger-deploy.png" alt="Implante seu app Node.js em um clique — Deploy na Hostinger" width="1000">
  </a>
</p>
<p align="center">
  <a href="https://wacrm.tech/docs/deployment-hostinger">
    <img src="https://img.shields.io/badge/Guia_passo_a_passo-wacrm.tech%2Fdocs-111?style=for-the-badge" alt="Guia passo a passo" height="44">
  </a>
</p>

**O wacrm foi feito para rodar na [Hostinger](https://www.hostinger.com/web-apps-hosting).**
É o caminho que testamos, documentamos e recomendamos — e a maneira
mais rápida de colocar um CRM de nível de produção no ar sem ter um
VPS ou um cluster Kubernetes.

### Por que Hostinger?

| | |
|---|---|
| **Deploy Git com um clique** | Conecte seu fork, envie para `main`, a Hostinger compila e publica. Sem SSH, sem Docker, sem CI para configurar — a própria `main` deste repositório faz deploy assim. |
| **Node.js gerenciado** | Next.js 16 (App Router, server actions, ISR) roda de fábrica nos planos compartilhados [Premium, Business e Cloud](https://www.hostinger.com/web-apps-hosting). Você não gerencia versões do Node, processos ou proxies reversos. |
| **SSL grátis + domínio grátis** | Let's Encrypt automático no seu domínio personalizado (ou um grátis incluso em planos anuais). HTTPS ativo por padrão — exigido para o webhook do WhatsApp Business. |
| **CDN global + LiteSpeed** | Assets estáticos armazenados em cache na edge, rotas dinâmicas servidas pelo LiteSpeed. Dashboards rápidos de fábrica, sem necessidade de configurar Cloudflare. |
| **Env vars + logs no hPanel** | Defina `SUPABASE_*`, `WHATSAPP_*` e `ENCRYPTION_KEY` pelo painel — sem `.env` no servidor. Logs da aplicação ao vivo na mesma interface. |
| **Proteção DDoS + backups diários** | Integrados, sem add-ons. O endpoint do webhook é um alvo público — ter proteção na edge é importante. |
| **Mais barato que um VPS** | Planos a partir de alguns dólares por mês — uma ordem de grandeza a menos que um host Node.js gerenciado comparável, e você não paga a mais pelo banco de dados (esse é o Supabase). |
| **Suporte humano 24/7** | Chat ao vivo em mais de 20 idiomas — útil quando seu CRM é a ferramenta da qual sua equipe depende para falar com clientes. |

### A versão de 60 segundos

1. **Faça um fork** deste repositório no GitHub.
2. No **hPanel → Websites → Create**, escolha **Node.js** e conecte
   seu fork.
3. Cole suas variáveis de ambiente Supabase + Meta no hPanel.
4. Envie para `main`. A Hostinger compila e serve. Pronto.

Guia completo com screenshots:
**[wacrm.tech/docs/deployment-hostinger](https://wacrm.tech/docs/deployment-hostinger)**.

> _Nota: o wacrm é licenciado sob MIT e roda em qualquer lugar que
> suporte Node.js (Vercel, Railway, seu próprio VPS). A Hostinger é
> recomendada, não obrigatória._

## Documentação

A documentação completa de auto-hospedagem — migrations do Supabase,
configuração da API do WhatsApp Business e deploy em produção — está
em **[wacrm.tech/docs](https://wacrm.tech/docs)**
(fonte: [ArnasDon/wacrm-site](https://github.com/ArnasDon/wacrm-site)).

Páginas principais:
- [Primeiros passos](https://wacrm.tech/docs/getting-started)
- [Configuração do Supabase](https://wacrm.tech/docs/supabase-setup)
- [Configuração do WhatsApp](https://wacrm.tech/docs/whatsapp-setup)
- [Variáveis de ambiente](https://wacrm.tech/docs/environment-variables)
- [Deploy na Hostinger](https://wacrm.tech/docs/deployment-hostinger)
- [Arquitetura](https://wacrm.tech/docs/architecture)
- [Solução de problemas](https://wacrm.tech/docs/troubleshooting)

## Stack

- **App** — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4.
- **Dados** — Supabase (Postgres + Auth + Storage + RLS).
- **WhatsApp** — Meta Cloud API (API oficial do WhatsApp Business).

## Contribuição

Isto é um template, não um produto colaborativo — o fluxo esperado é
fork → personalize → deploy, **não** contribuição upstream. Relatos de
bugs e problemas de segurança são bem-vindos; PRs de funcionalidades
geralmente pertencem ao seu fork, não aqui. Detalhes em
[`CONTRIBUTING.md`](./CONTRIBUTING.md) e
[`.github/SECURITY.md`](./.github/SECURITY.md).

## Licença

[MIT](./LICENSE). Faça um fork, coloque sua marca, hospede.
