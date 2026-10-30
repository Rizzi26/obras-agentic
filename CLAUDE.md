# Canteiro (obras-agentic)

Agente de IA para gestão de obras. Este repositório tem **duas coisas**:

- **O protótipo** (raiz: `index.html`, `css/`, `js/`, `tests/*.html`), publicado em https://obras-agentic.vercel.app a cada
  push na `main`. Dados fictícios. Não misture código do produto nele.
- **O produto (MVP-0)**: `packages/dominio` (regras puras), `apps/api` (FastAPI), `apps/agente` (Claude + Tool Runner),
  `apps/web` (Next.js), `infra/` (compose local).

Leia antes de codar: `docs/arquitetura.md`, `docs/contrato.md` (o contrato entre API, agente e web) e `PRODUCT.md`.

## Regras da casa

**O repositório é PÚBLICO.** Nada de segredo em arquivo, teste ou log: `.env` fica fora do git (há `.env.exemplo`);
chave da Anthropic da plataforma só em variável de ambiente; chave própria de cliente cifrada no banco. Pesquisa de
mercado e estratégia ficam em `pesquisa/` (ignorada pelo git).

**Banco portável: MongoDB hoje, Firestore (Firebase) depois.** Toda leitura e escrita passa pela porta
`canteiro_dominio.armazenamento`; o resto do código nunca importa `pymongo`. A porta só aceita o que o Firestore aceita:
igualdade e `in` (≤ 30), desigualdade em um campo só, ordenação começando por esse campo, limite. Sem joins, sem regex,
sem aggregation pipeline (relatório = projeção pré-calculada ou soma feita na API). Unicidade e idempotência pelo **ID do
documento**. Transação: leia tudo antes de escrever, ≤ 500 escritas. Nada de lista que cresce sem limite dentro de um
documento. Quantidade em milésimos e dinheiro em centavos (inteiros); IDs UUIDv7 gerados por nós. Um mesmo conjunto de
testes de contrato roda contra o adaptador em memória e o do Mongo (e, depois, o do Firestore).

**Toda conta no domínio, nunca no modelo de IA.** Falta, saldo, transições: `canteiro_dominio.regras`. O agente cita a
`Conta` devolvida pela API.

**O agente só propõe.** Escrita do agente = `POST /propostas`. Só a aprovação de uma pessoa executa, e toda execução gera
`EntradaRegistro` com `desfazer`. Não crie caminho de escrita do agente que pule isso.

**Multi-tenant e papel no servidor.** `tenant_id` em todo documento e em toda consulta (a porta exige). O papel vem do
banco a cada requisição, nunca do token. O agente age com o token do usuário.

**Consumo de IA medido.** Toda chamada ao modelo grava `UsoIA`; o saldo de créditos é checado antes da chamada.

**Comentário explica por quê, não o quê.** Português do Brasil no código de domínio e nas mensagens.

## Comandos

```bash
docker compose -f infra/docker-compose.yml up -d          # Mongo (replica set) + emulador do Pub/Sub
cd packages/dominio && .venv/bin/pytest                   # regras
cd apps/api && .venv/bin/pytest                           # API (usa o Mongo do compose)
cd apps/api && .venv/bin/uvicorn canteiro_api.main:app --reload
cd apps/agente && .venv/bin/uvicorn canteiro_agente.main:app --reload --port 8100
cd apps/web && pnpm dev
# ambiente Python de cada pacote: uv venv -p 3.14 .venv && uv pip install -p .venv -e ".[dev]"
```
