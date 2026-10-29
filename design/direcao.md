# Direção do redesign do Canteiro

Consolidado de `diagnostico-global.md` (detector do Impeccable) e das três críticas por página
(`critica-agente-campo.md`, `critica-suprimentos.md`, `critica-gestao-estrutura.md`), de 29/10/2026.
As três críticas convergem; as divergências ficaram listadas no fim, como decisões.

## O problema, numa frase

O conteúdo é forte, mas a interface não diz **o que fazer agora** nem mostra o **ciclo** que é o diferencial:
as decisões ficam dentro de textos corridos, sem ordem de urgência; a mesma ação tem 5 nomes e 4 formatos;
9 abas escondem pendências; e o acabamento tem cara de "gerado" (contraste baixo, texto de 11 px, cartão dentro de
cartão, faixa lateral colorida). Notas: suprimentos 22/40 (Nielsen).

## 1. Arquitetura de informação

**Obra: de 9 abas para 4, com contador de pendências.**

| Aba | O que tem dentro (controle segmentado de 2º nível) | Abre por padrão em |
|---|---|---|
| **Hoje** (nova, padrão) | o que pede você nesta obra + 3 números | sim |
| **Suprimentos** | Falta comprar (Insumos) · Pedidos · Almoxarifado · Entre obras | Falta comprar |
| **Custos** | Orçamento · Medições | Orçamento |
| **Execução** | Cronograma (Prazos) · Diário (RDO) · Equipe | Cronograma |

- O **chat da obra sai das abas** e vira um painel lateral recolhível, disponível em todas as abas da obra.
- Em **Suprimentos**, uma **faixa do ciclo** fixa no topo: Falta → Em cotação → A caminho → Conferir NF → Sobra,
  cada etapa com contagem e filtro. É o diferencial do produto aparecendo na estrutura.
- A sidebar e o hub passam a abrir a obra sempre em **Hoje** (hoje um abre no Chat e o outro no Orçamento).

**Nível global**
- **Início** = o briefing vira a página: lista densa de decisões, ordenada por prazo/gravidade. O chat global vira uma
  barra de uma linha no rodapé.
- **Aprovações** = três abas: Pendentes (com aprovação em lote e recusa com motivo) · Cotações · Registro.
- **Campo · WhatsApp**: continua, com o celular como alvo principal.
- **#gate** (tela pequena): deixa de ser beco sem saída e oferece o link para `#campo`.

## 2. Componentes únicos (um de cada no produto inteiro)

1. **Linha de decisão:** `prazo | obra · título · conta | valor | [ação com consequência] ⋯`. Depois de aprovar, vira
   no lugar "Aprovado 08:14 por Rizzi · Desfazer" (hoje a linha some e a lista pula). Usada em Início, Hoje,
   Aprovações e Pedidos; versão de toque no WhatsApp.
2. **Linha de conta (recibo):** `precisa X − saldo Y − a caminho Z [− transferência T] = falta F → comprar C`, idêntica
   em tabela, drawer, pedido e modal, com a fonte numa linha abaixo.
3. **Chip de fonte:** ícone + origem (agente, WhatsApp, NF, SINAPI, tela) + quem + hora.
4. **Estado × ação:** pill = estado (não clica). Botão = ação nomeada pela consequência ("Aprovar R$ 9.165", "Trazer
   20 sc", "Conferir NF"). Proibido "Avançar".
5. **Tabela de trabalho:** ordenada por urgência, com o que já foi resolvido recolhido em "Cobertos (n)", no máximo 6
   colunas em 1100 px e detalhe no drawer.
6. **Referência de documento** (`PED-0162`, `TRF-0005`) sempre como link para o cartão certo, com um destaque de 1 s ao chegar.
7. **Modal × drawer:** o modal grava, o drawer consulta. Cabeçalho com a linha de conta, rodapé de ação fixo, X, Esc,
   foco preso e devolvido, `role="dialog"`. No celular, o modal vira bottom sheet.
8. **KPI:** no máximo 3 por tela, só quando não repete um cartão. Sem a barra preta no topo. Número que depende de
   aprovação leva o rótulo "se aprovar".
9. **Nota de validação:** uma faixa fina recolhível, sempre no mesmo lugar, com visual de "pesquisa" distinto das pendências do produto.

## 3. Visual

**Tipografia** (escala de 5 passos, base de 4 px)
- 13 (meta, tabela densa) · 14 (corpo) · 16 (título de seção, 600) · 22 (título de bloco e de modal) · 28 (h1).
  **Nada abaixo de 12 px**; o corpo é ≥ 13 no desktop. No `#campo`: 13 · 16 · 18 · 22, corpo ≥ 16 e campos ≥ 16 (sem zoom no iOS).
- Bricolage Grotesque em h1, títulos de seção e de modal e nos números de KPI. `tabular-nums` em todo número
  (inclusive dentro do texto do agente). Texto do agente com `max-width: 68ch` e `text-wrap: pretty`.
- Hierarquia sem pular nível: h1 → h2 → h3.

**Cor: semântica fixa em todo o produto**
- **Ocre = ação.** Uma primária por bloco; numa lista, o primário ocre só na linha em foco, e nas outras Aprovar é secundário.
- **Âmbar = pede você.** **Vermelho = perda já ocorrida ou bloqueio** (quebra, falta que trava, NR-18 vencida).
  **Azul = a caminho / transferência.** **Verde = resolvido / dentro do previsto.** **Cinza = informação.**
- O ponto de status tem um significado só, igual na sidebar, no hub e no cabeçalho.
- Contraste AA: `--muted` → ~#575f5c; texto secundário da sidebar → ~#a3b3ad; `--faint` nunca em texto que se lê;
  textos coloridos escurecidos (âmbar ~#8a5a12, verde ~#256f49).
- Fundo: o detector leu o concreto #ebe9e3 como "bege padrão de IA". Ele passa para um cinza-concreto **frio e neutro**,
  mantendo a sidebar verde-grafite e o ocre.

**Superfícies e espaço**
- Um nível de caixa: página → cartão. Dentro do cartão, divisórias e espaço (fim do cartão dentro de cartão).
- Sem faixa lateral colorida (item ativo e atrasado mostram estado por fundo, peso e pill).
- Ritmo 4 · 8 · 12 · 16 · 24 · 32; página com 32 px laterais (hoje 44) para ganhar largura em 1100 px.

**Movimento** (lente do Emil: só onde explica mudança de estado)
- Aprovar: crossfade de 150 ms do botão para o estado aprovado, no lugar.
- Modal 180 ms (opacity + scale .97 → 1); drawer 200–240 ms (translateX); toast 160 ms subindo 8 px. Todos `ease-out`
  com curva `cubic-bezier(.23,1,.32,1)`.
- `:active { transform: scale(.97) }` nos botões. Hover só em `@media (hover:hover)`.
- **Sem animação** em troca de aba, tabela, KPI, Gantt, arrastar cartão e checkbox. `prefers-reduced-motion`: só opacidade.

## 4. Erros de dado e de fluxo que entram junto (obrigatórios)

1. **Compra em dobro:** o pedido de compra inclui itens já em cotação (PED-0163/0164/0167); só desconta a partir de "Aprovado".
2. "Acabam em ≤ 7 dias" lê uma marcação fixa em vez da duração calculada (lista o parafuso ≈ 8 d e omite o cimento ≈ 6 d).
3. Diário: "Enviar ao cliente" ativo com o RDO ainda aguardando a confirmação do áudio.
4. Equipe: o Rafael, com ASO vencido, aparece na chamada sem alerta (NR-18 é bloqueio).
5. Assistente: o passo 4 abre a Vila Nova; clicar fora fecha e perde o que foi digitado.
6. Prazos: o plano "21 → 6 dias" fica abaixo do Gantt e sem botão de aprovar; o Gantt não tem eixo de datas.
7. Medições: a ação principal é "Nova medição" e não "Segurar pagamento"; vermelho num adiantamento que o contrato prevê.
8. Briefing fora de ordem de urgência (o aço, que acaba em 30/10, aparece em 2º).
9. `#fluxos` mostra 8 fluxos e o FLUXOS.md tem 14.
10. Toast e modal sem `aria-live`, `role="dialog"`, foco e X.

## 5. Decisões (aprovadas em 29/10/2026)

- **4 abas + chat lateral: SIM.**
- **Fonte do corpo: IBM Plex Sans** (Bricolage continua em títulos e números grandes).

### Como eram as opções

- **Fonte do corpo:** o detector acusa Inter (81–98% do texto) como fonte usada em excesso. Duas das críticas acham
  aceitável numa ferramenta de trabalho, desde que a Bricolage dê a personalidade. Opções: manter Inter ou trocar
  por uma grotesca técnica com bons números tabulares (ex.: IBM Plex Sans).
- **4 abas + chat lateral:** muda a navegação inteira e todos os links internos.

## 6. Plano de implementação (depois de aprovado)

1. **Base, primeiro e sozinha:** tokens (cor, escala, espaço), fonte, sidebar, cabeçalho da obra, as 4 abas com
   segmentos, o chat lateral, os componentes 1–9, o toast e o modal acessíveis, o gate. Os outros dependem dela.
2. **Três frentes em paralelo**, cada uma dona dos seus arquivos e funções:
   - **Agente e campo:** Início, Aprovações, WhatsApp no celular e os modais do agente.
   - **Suprimentos:** faixa do ciclo, Falta comprar, Pedidos, Almoxarifado, Entre obras e os drawers.
   - **Custos e execução:** Hoje, Orçamento, Medições, Cronograma, Diário, Equipe e o assistente de nova obra.
3. **Integração, por mim:**
   - detector do Impeccable de novo, com a meta de zerar contraste, texto pequeno, cartão aninhado e faixa lateral;
   - `tests/smoke.html`, `tests/larguras.html` e o teste de ponta a ponta;
   - revisão por foto, inclusive a 390 px;
   - deploy.
