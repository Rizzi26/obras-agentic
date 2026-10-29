# Crítica · estrutura do produto e telas de gestão (29/10/2026)

⚠️ DEGRADED: single-context (crítica de 7 rotas + estrutura feita num só agente, sem os sub-agentes A/B do `impeccable critique`).
Ordem respeitada: primeiro a leitura do código e dos renders (1440×900, 1440×2400, 1100×900 e 390×844), depois o detector
(`npx impeccable detect --viewport 1440x900`) em `#hub`, `#fluxos`, chat, equipe, prazos, diário e medições.
O assistente de nova obra (`openWizard`) foi avaliado pelo código (`js/features/gestao.js:521`): o headless não clica.
Nenhum arquivo de código foi alterado.

**Nota geral da estrutura (Nielsen): 25/40, "aceitável, com atrito".** As notas mais baixas são consistência (2: o ponto de status muda de
significado, a obra abre em telas diferentes conforme a porta de entrada), prevenção de erro (2: é possível enviar um RDO que ainda aguarda
confirmação, e um clique fora do modal fecha o assistente e perde o que foi digitado) e reconhecimento em vez de memória (2: nove abas sem
contador; em 1100 px a aba ativa some).

---

## A pergunta-chave: nove abas por obra é navegável?

**Não.** Há quatro evidências:

1. **Em 1100 px, Diário e Medições somem.** A barra corta em "Prazos", a barra de rolagem fica escondida (`.tabs{scrollbar-width:none}`) e
   não há sombra nem seta indicando que tem mais. Em `#obra/vila-nova/medicoes` a aba ativa fica fora da tela: a pessoa não vê onde está
   (screenshot `tabs1100`).
2. **Nenhuma aba diz se tem algo para fazer.** As pendências (RDO aguardando, pagamento a segurar, ASO vencido, NF a conferir) existem, mas
   só aparecem depois que a aba é aberta. Para saber "o que eu faço nesta obra", a pessoa abre as nove.
3. **Há duas portas de entrada para a obra, cada uma levando a um lugar.** A sidebar abre no **Chat** (`core.js:39`); o cartão do hub
   abre no **Orçamento** (`core.js:100`). Nenhuma das duas abre numa tela que responda "o que eu faço agora?" (Princípio 1).
4. **A ordem é de módulo de ERP, não de trabalho.** Chat · Orçamento · Insumos · Pedidos · Almoxarifado · Equipe · Prazos · Diário · Medições
   mistura dinheiro, suprimentos e campo. Medições (dinheiro) fica longe de Orçamento; Diário (campo) fica longe de Equipe, e as duas
   telas mostram a mesma chamada do dia.

### Arquitetura proposta: 4 abas + o agente sempre à mão

| Aba (nível 1) | Subvisões (controle segmentado, nível 2) | Por quê |
|---|---|---|
| **Hoje** (nova, padrão) | — | É a resposta a "o que eu faço nesta obra?": as propostas pendentes desta obra (o filtro de `pendentes(obraId)` já existe), o RDO que aguarda confirmação, a documentação vencida, o pagamento a segurar e quatro números (entrega prevista, verba, efetivo hoje, itens em falta). As duas portas de entrada passam a abrir aqui. |
| **Suprimentos** | Falta comprar · Pedidos · Almoxarifado | É o diferencial do produto, na ordem do ciclo (falta → pedido → entrada). O "Estoque aguenta até o fim?" sai de Prazos e vem para cá. |
| **Custos** | Orçamento · Medições | Verba, fonte de cada número, pago × executado. "Custo de mão de obra do mês" sai de Equipe e vem para cá. |
| **Execução** | Cronograma · Diário (RDO) · Equipe | É o que o mestre alimenta pelo WhatsApp: prazo, chamada, RDO e NR-18. |

- **O chat deixa de ser aba.** Vira um painel lateral recolhível (≈ 420 px, à direita) com o contexto da obra, aberto por um botão
  "Perguntar ao agente" no cabeçalho e pelo atalho `/`. Hoje ele ocupa a tela toda como uma 4ª coluna (sidebar 264 + sessões 248 + chat).
  Como painel, a pessoa pergunta "por que só tem 2.760 blocos?" sem sair do Almoxarifado.
- **Cada aba de nível 1 leva um contador** com o que pede ação (ex.: "Execução 2" = RDO aguardando + ASO vencido). A cor é ocre, a mesma
  dos contadores da sidebar.
- **Nomes:** "Insumos e compras" vira "Falta comprar" (é o que a tela calcula); "Prazos" vira "Cronograma"; "Diário" vira "Diário (RDO)",
  que é o termo do canteiro. A obra em orçamento (Galpão) mostra só **Hoje**, com o chat do orçamento aberto, e as outras abas aparecem
  desabilitadas com uma dica, em vez de abrir uma tela de "disponível depois".
- **Custo:** a pessoa decide em 1 clique (Hoje) e chega a qualquer tela em no máximo 2 (aba + segmento). Quatro abas cabem em 1100 px sem rolar.

---

## Estrutura · sidebar

**(a) Tarefa:** saber onde está, ver o que pede atenção em todas as obras e trocar de obra em 1 clique.

**(b) Problemas**
1. **O aviso "Protótipo · dados fictícios" ocupa o melhor lugar da navegação.** É um bloco de 3 linhas em âmbar no topo, acima de Início.
   *Correção:* mover o aviso para uma faixa de 28 px no rodapé da sidebar, ou para um selo "protótipo" ao lado da marca (o `.brand .tag` já existe).
2. **A ordem não segue a prioridade.** Aprovações (7) é a fila do "o que eu faço agora" e vem em 5º lugar, depois de Campo · WhatsApp, que
   é a *simulação do celular do mestre* e não uma tela do gerente. *Correção:* Início · Aprovações · Todas as obras · Estoque entre obras;
   "Campo · WhatsApp" vai para o grupo **Protótipo** com o nome "Celular do mestre (simulação)".
3. **O ponto colorido muda de significado.** Na sidebar ele indica o status (vermelho = risco, `core.js:27`); no hub, a cor de identidade
   da obra (`o.cor`: laranja, azul, violeta). A Vila Nova aparece vermelha num lugar e laranja no outro. *Correção:* o ponto significa
   **sempre** status (vermelho, verde, cinza). A cor de identidade sai, ou vira só a barra de progresso.
4. **O contraste falha no escuro.** O detector acusa `#7d8e88` sobre `#1c2a27` (4,3:1), presente nas 7 rotas, e sobre `#2e423d` (3,1:1).
   As seções têm 10,5 px ("OBRAS", "PROTÓTIPO"). *Correção:* rótulos de seção em `#a3b3ad` com 11,5 px; a porcentagem das obras em `#a3b3ad`.
5. **A lista de obras cresce sem limite.** Com 20 obras ela empurra "Nova obra" e o grupo Protótipo para fora da tela. *Correção*
   (break-ui): mostrar as 5 obras com mais pendências e um "Ver todas (20)", com a lista rolando dentro de si mesma.
6. **A barra lateral de 3 px no item ativo** (`.nav.on`, apontada pelo detector como side-tab) se soma ao fundo mais claro. *Correção:* manter
   só o fundo `--sideOn`, o texto branco e o ícone ocre.

**(c) Redesenho:** marca + selo "protótipo"; Início (com contador) · Aprovações (7) · Todas as obras · Estoque entre obras (3);
OBRAS: as 5 com pendência, cada uma com o ponto de status e o **número de pendências** no lugar da porcentagem; + Nova obra;
PROTÓTIPO (recolhível): Celular do mestre, Notas de validação, Mapa de fluxos; rodapé com o usuário.

**(d) Igual no produto todo:** o ponto de status com um só significado; os contadores ocre só para "pede ação"; o item ativo marcado
por fundo, sem faixa lateral.

---

## Estrutura · cabeçalho da obra

**(a) Tarefa:** confirmar em que obra estou e como ela está (prazo, fase), e trocar de seção.

**(b) Problemas**
1. **O breadcrumb "Obras / Campinas · SP" mistura navegação e endereço.** O segundo nível é a cidade, que não é um lugar navegável.
   *Correção:* breadcrumb "Obras / Casa Vila Nova" e o endereço numa linha de metadado abaixo do título.
2. **O status está espalhado.** A pílula "21 dias de atraso previsto" fica colada ao título, e "Fase: Estrutura · 38%" fica a 900 px de
   distância, na direita, em 12,5 px. *Correção:* uma linha de status única sob o título: "Estrutura 38% · entrega prevista 21/07/2027
   (contrato 30/06) · 3 pendências", com a pílula vermelha só no trecho do atraso.
3. **Falta a ação recorrente da obra.** Não há "Perguntar ao agente" nem "+ Registrar" no cabeçalho. *Correção:* à direita do cabeçalho,
   o botão "Perguntar ao agente" (abre o painel), secundário.
4. **O título pula do h1 para o h3 em todas as abas** (detector: skipped-heading em diário, medições, prazos, fluxos). *Correção:* os
   títulos de cartão passam a ser h2 com o mesmo estilo visual de hoje.

**(c) Redesenho:** 2 linhas e as abas: breadcrumb · **Nome** (28 px) + [Perguntar ao agente]; linha de status; abas com contador.
Altura total ≈ 132 px, como hoje.

**(d) Igual no produto todo:** a linha de status com o mesmo formato no hub, no cabeçalho e no briefing.

---

## #hub · Todas as obras

**(a) Tarefa:** decidir em qual obra entrar primeiro.

**(b) Problemas**
1. **O cartão mostra o estado, mas não o que fazer.** Orçamento, gasto, prazo e previsão estão lá; as 7 aprovações, o RDO aguardando e o
   pagamento a segurar não aparecem. O próprio callout de validação pergunta isso. *Correção:* uma linha "Pede você: 4 aprovações · 1 RDO ·
   segurar R$ 7.540" no topo do cartão, em ocre, clicável (abre a aba Hoje da obra).
2. **A pílula de prazo pula de lugar.** Nas obras 1 e 2 ela quebra para baixo do nome; no Galpão, fica na mesma linha. *Correção:*
   pílula numa linha própria, sempre abaixo do nome, ou o nome com `min-width:0` e reticências.
3. **O cartão do Galpão é feito de traços.** Três campos "—" (Gasto, Prazo, Previsão). *Correção:* mostrar o próximo passo:
   "O agente espera 2 respostas suas (piso, fechamento) · Responder".
4. **Os cartões não escalam** (break-ui). Com 15 obras, uma grade de 3 colunas vira 5 telas de rolagem sem ordenação. *Correção:* trocar
   por uma **tabela**: Obra · status · fase/% · entrega prevista vs contrato · verba usada · pede você. A ordem padrão é por pendências,
   com filtro "em risco".
5. **O título "Obras" não bate com "Todas as obras"** na sidebar. *Correção:* usar o mesmo nome nos dois lugares.

**(c) Redesenho:** a tabela de obras ordenada por "pede você" e por risco, com uma faixa de 3 números no topo (obras em risco, aprovações
pendentes, R$ a segurar). Os cartões podem voltar como visualização alternativa só se houver até 4 obras.

**(d) Igual no produto todo:** "Pede você" como coluna ou linha padrão de qualquer lista de entidades (obras, contratos, pedidos).

---

## #fluxos · Mapa de fluxos

**(a) Tarefa** (de quem conduz a demo): pular para a tela que prova cada hipótese, na ordem do roteiro.

**(b) Problemas**
1. **Está desatualizado.** São 8 cartões, mas o FLUXOS.md tem 14 fluxos. Faltam Briefing, Aprovações, WhatsApp do mestre, NF-e, Diário e
   Medições, justamente o que a Onda 2 entregou. A numeração também é outra.
2. **Os cartões são texto corrido com setas.** Cadeias de "→" de 3 linhas em cinza (`--muted`) cansam a leitura. *Correção:* uma lista
   numerada ou tabela com as colunas **Fluxo · Onde · O que prova · Abrir**.
3. **O cartão inteiro é clicável e ainda tem o link "abrir no protótipo"**, com dois alvos para a mesma ação. *Correção:* deixar só a linha
   clicável, com o chevron à direita.

**(c) Redesenho:** uma tabela única, agrupada pelos blocos do roteiro de 45 min (Briefing · Celular do mestre · NF, almoxarifado e medição ·
Orçamento e prazos). A fonte é o mesmo array do FLUXOS.md, para não divergir de novo.

**(d) Igual no produto todo:** linha clicável com chevron, e nunca o cartão inteiro clicável junto com um link interno.

---

## #gate · tela pequena

**(a) Tarefa:** dizer a quem abriu no celular o que fazer em seguida.

**(b) Problemas**
1. **É um beco sem saída.** A rota `#campo` funciona no celular (`campo.js:317` libera o gate), mas o gate não dá o link para ela. Quem
   recebe o link principal no celular (o gerente na demo, conforme o roteiro) para aqui. *Correção:* botão primário "Abrir o WhatsApp do
   mestre (funciona no celular)" → `#campo`; abaixo, "Copiar link para abrir no computador".
2. **O ícone em quadrado em cima do título** (detector: icon-tile-stack) usa um asterisco diferente da marca da sidebar. *Correção:* usar a
   marca da sidebar (logo + "Canteiro") pequena no topo e remover o quadrado.
3. **O texto fala do protótipo, não da pessoa.** "Este protótipo foi desenhado para telas de computador…" *Correção:* "O painel do
   gerente é feito para o computador. No celular, abra o que o mestre usa:" e o botão.
4. **O corpo tem 14 px a 390 px de largura** (PRODUCT.md pede ≥ 15 px no celular). *Correção:* 16 px; o metadado "Sua tela: 390 px" vai
   para 13 px em `--muted`.

**(c) Redesenho:** marca; título "Abra no computador"; 1 frase; [Abrir o WhatsApp do mestre]; [Copiar link]; o metadado de largura.

**(d) Igual no produto todo:** nenhum estado vazio, de erro ou de bloqueio sem uma ação de saída.

---

## Toasts

**(a) Tarefa:** confirmar que a ação gravou e permitir desfazer.

**(b) Problemas**
1. **Aparecem e somem sem transição** (`display:block/none`, `core.js:6`), e o leitor de tela não os anuncia (falta `role="status"` /
   `aria-live`). *Correção:* `role="status" aria-live="polite"`; entrada com translateY(8px)→0 + opacity em 180 ms `cubic-bezier(.23,1,.32,1)`
   e saída em 120 ms; com `prefers-reduced-motion`, só opacity.
2. **O "Desfazer" fica 6 s na tela e some até com o mouse em cima.** Em ação de dinheiro (segurar R$ 7.540, transferir), é pouco.
   *Correção:* 8 s, pausando no hover e no foco; o "Desfazer" vira um `<button>` focável (hoje é `<a href="#">`).
3. **Uma mensagem apaga a anterior.** Duas aprovações seguidas → só a última pode ser desfeita pelo toast. *Correção:* empilhar até 3
   toasts (o mais novo embaixo) ou apontar "Desfeito pelo registro em Aprovações".
4. **Toasts "(protótipo) o agente responderia aqui"** usam o mesmo visual de uma confirmação real. *Correção:* uma variante neutra (fundo
   claro, ícone de info) para o que é só simulação.

**(d) Igual no produto todo:** toda ação que muda dado gera **um** toast com verbo no passado + objeto + "Desfazer" ("Pagamento da Equipe
Silva segurado · Desfazer"), sempre na mesma posição.

---

## Modais e drawers

**(a) Tarefa:** fazer uma tarefa curta sem perder o contexto da tela.

**(b) Problemas**
1. **Clicar fora fecha o modal**, inclusive o assistente de nova obra e a nova medição, que têm campos preenchidos (`index.html:24`).
   *Correção:* modal com formulário só fecha pelo X, Cancelar ou Esc, e pede confirmação se algo foi editado.
2. **Faltam a semântica e o foco:** sem `role="dialog"`, sem `aria-modal`, o foco não entra no modal nem volta ao botão de origem, e o
   modal não tem botão X (só o drawer tem). *Correção:* X no canto de todo modal, foco no primeiro campo, retenção do foco dentro dele e
   devolução ao gatilho.
3. **Abrem sem movimento.** Hoje vão de `display:none` a `grid`. *Correção:* modal com opacity + scale(.97→1) em 180 ms ease-out, a
   origem no centro; drawer com translateX(100%→0) em 240 ms `cubic-bezier(.32,.72,0,1)`; o fundo escuro com opacity em 150 ms; saída
   mais rápida (120 ms). Nada disso nas abas nem nas tabelas.
4. **Cartão dentro de cartão** (detector: nested-cards, 7 no Diário; também no drawer de contrato e no assistente). *Correção:* dentro de
   modal ou drawer, KPIs e notas viram blocos sem borda, separados por espaço e fundo `--cream`.

**(d) Igual no produto todo:** o **drawer** é para consultar uma entidade (contrato, item, pedido) sem sair da lista; o **modal** é para
uma tarefa que grava (medição, pedido, nova obra), com o primário à direita, Voltar/Cancelar à esquerda e o X sempre presente.

---

## Chat da obra · `#obra/vila-nova/chat`

**(a) Tarefa:** perguntar algo sobre esta obra e aprovar ali mesmo a ação que o agente propõe.

**(b) Problemas**
1. **A tela abre no topo de uma conversa antiga.** `render()` zera o scroll (`core.js:625`), então a pessoa vê a 1ª pergunta e precisa
   rolar até a ação pendente. Chat abre ancorado no fim, ou na **primeira ação pendente**. *Correção:* rolar até a última mensagem com
   botão não resolvido.
2. **A lista de sessões não diz onde há decisão.** "Atraso do aço (Gerdau) · hoje" tem um "Aprovar PED-0167" pendente, mas a lista
   mostra só a data. *Correção:* um ponto ocre + "1 ação" na sessão; as sessões com ação pendente ficam no topo.
3. **Quatro colunas em 1440 px** (sidebar, sessões, chat, margem de 760 px centrada). O chat de 760 px fica espremido entre vazios.
   *Correção:* nesta arquitetura, o chat vira painel lateral; quando aberto em tela cheia, as sessões viram um seletor (dropdown) no
   cabeçalho do chat.
4. **O compositor ocupa 150 px fixos** e não tem as sugestões que a Home tem. *Correção:* compositor de 1 linha que cresce até 6, com o
   chip de contexto inline à esquerda; 3 sugestões da obra acima dele ("O que chega amanhã?", "Quem está em campo?").
5. **As fontes aparecem como "ferramentas" com ícone de chave inglesa** (`.tools`). Para o gerente, "pedido PED-0158 · e-mail do
   fornecedor" é **de onde veio** o número, não uma ferramenta. *Correção:* trocar o rótulo e o ícone para "Fonte:" + o mesmo chip de
   fonte do Diário (`.g-src`), com um só componente de fonte no produto todo.
6. Placeholder do compositor com 3,0:1 (detector). *Correção:* `--muted`.

**(c) Redesenho:** painel do agente à direita (≈ 420 px) presente em todas as abas da obra; dentro dele, o seletor de sessão (com ponto de
ação pendente), as mensagens ancoradas no fim, os botões de ação em linha e o compositor compacto.

**(d) Igual no produto todo:** a **ação do agente dentro da resposta** é um bloco com a conta e a fonte, um primário ocre (Aprovar…) e até
2 secundários. Depois de aprovada, vira uma pílula verde "✓ aprovado por Rizzi 09:12 · Desfazer", e não some.

---

## Equipe · `#obra/vila-nova/equipe`

**(a) Tarefa:** saber quem está na obra hoje, se alguém **não pode** estar (documentação) e o que trava o prazo (a vaga).

**(b) Problemas**
1. **Há uma pessoa sem ASO válido trabalhando, sem alerta na chamada.** O Rafael S. aparece na tabela com chegada às 07h10, sem nenhum
   alerta. O aviso "ASO vencido · não pode trabalhar (NR-7)" está em outro cartão, 300 px abaixo. É um risco legal escondido.
   *Correção:* pílula vermelha "ASO vencido" na linha do Rafael, e o primeiro bloco da tela passa a ser "Não pode trabalhar hoje: Rafael S."
2. **Os KPIs repetem os cartões.** "Pendências de documentação 3" e "Vaga aberta 2 armadores" são o KPI e também o cartão logo ao lado;
   três vermelhos disputam a atenção. *Correção:* remover a fileira de KPIs. Ficam a chamada (com o total no título: "Na obra hoje · 7") e
   uma coluna à direita com **o que pede ação**, por gravidade.
3. **"Cobrar a Equipe Silva" aparece duas vezes**, com sentidos diferentes (armadores, ASO do Rafael). *Correção:* uma ação só,
   "Cobrar a Equipe Silva: 2 armadores + ASO do Rafael", que mostra a mensagem antes de enviar.
4. **O custo de mão de obra do mês é assunto de dinheiro** e fecha a tela de pessoas. *Correção:* vai para Custos › Medições, com um link
   "Custo do mês: R$ 14.870 ›" no rodapé da chamada.
5. **As iniciais coloridas são decoração** e ocupam a coluna Nome (10,5 px, detector: undersized-ui-text). *Correção:* remover os avatares
   da tabela; a coluna "Vínculo" vira uma pílula curta (próprio, empreitada, subcontratado) com o detalhe ao passar o mouse.

**(c) Redesenho:** à esquerda, a "Chamada de hoje · 7 na obra" (fonte: WhatsApp da Joana 07h12), com os problemas marcados na linha. À
direita, "Pede você": 1) Rafael sem ASO (vermelho), 2) Vaga de 2 armadores → +8 dias, 3) EPI do Gilmar, 4) Integração do Paulo em 03/11.
Cada item com uma ação.

**(d) Igual no produto todo:** o problema aparece **na linha do dado** (pílula) e na lista "Pede você", nunca só num cartão separado.

---

## Prazos · `#obra/vila-nova/prazos`

**(a) Tarefa:** saber se a obra vai atrasar, por quê, e aprovar o plano que recupera o prazo.

**(b) Problemas**
1. **O plano de ação (a decisão da tela) está abaixo do Gantt, dentro de outro cartão e sem botões.** São 3 ações (−6, −5, −4 dias)
   sem Aprovar: a pessoa precisa ir a Aprovações ou ao Chat. *Correção:* o plano sobe para logo abaixo dos números, como lista de 3 linhas,
   cada uma com o dia ganho e o botão que aprova a proposta correspondente (`PROPOSTAS_PRAZO` já existe em `proativo.js:86`). O título
   fica "21 → 6 dias se você aprovar estas 3 ações".
2. **O Gantt não tem eixo de tempo.** Só "semanas desde 03/03/2026" e "hoje (sem. 34)"; o gerente pensa em datas e meses. As barras de
   planejado e real têm 7 px cada e só se distinguem pela cor. Verde (concluído) não está na legenda. *Correção:* eixo com meses
   (mar…jul/27), a barra planejada como contorno e a real preenchida, legenda completa e a linha de hoje em `--ink` (o vermelho fica para
   atraso).
3. **As barras de causa têm cores arbitrárias** (vermelho, ocre, azul) para fornecedor, equipe e clima. *Correção:* uma cor só (`--ink2`);
   o número em dias é o que importa. Cada causa leva um link para a tela onde se resolve (Pedidos, Equipe, Diário).
4. **"O estoque aguenta até o fim?" é uma tabela de suprimentos** com 10 linhas, e repete Almoxarifado e Falta comprar. *Correção:* vai
   para Suprimentos. Em Prazos ficam só os itens que **seguram uma fase**, com a data-limite ("Telha: comprar até 12/11 senão a cobertura
   atrasa").

**(c) Redesenho:** uma fileira de 3 números (contrato · previsão · com o plano) → "Plano: 3 ações" com Aprovar → "Por que atrasa"
(3 linhas, monocromático) → o Gantt com eixo de meses, em largura total.

**(d) Igual no produto todo:** **a decisão vem antes da explicação** (o plano antes do Gantt, a ação antes da tabela), e toda proposta do
agente pode ser aprovada na tela onde aparece.

---

## Diário (RDO) · `#obra/vila-nova/diario`

**(a) Tarefa:** revisar o RDO que o agente montou e enviar ao cliente, sabendo de onde veio cada fato.

**(b) Problemas**
1. **"Enviar ao cliente" é o primário e está ativo enquanto o próprio RDO aguarda a confirmação do áudio.** A pessoa pode enviar ao
   cliente um diário sem os serviços do dia. *Correção:* enquanto houver áudio pendente, o primário é "Confirmar o áudio da Joana" e o
   envio fica desabilitado, com o motivo ("faltam os fatos do áudio das 17h40").
2. **A pendência é um callout pontilhado com 2 botões pequenos**, com o mesmo visual das notas de validação da demo (`.callout`), o que
   confunde "isto é do produto" com "isto é pergunta da pesquisa". *Correção:* barra de revisão fixa no topo do RDO, fundo `--accentSoft`
   sólido: "3 fatos aguardam a Joana · Ver no WhatsApp · Confirmar daqui".
3. **A lista de dias repete "enviado" em verde 7 vezes.** É ruído; a exceção é o que importa. *Correção:* mostrar só as exceções
   (rascunho, aguardando) e, nos enviados, um ✓ discreto; semanas agrupadas ("Esta semana", "Semana passada").
4. **Cartão dentro de cartão** (detector: 7 nested-cards): clima em caixas, fotos em caixas, tudo dentro do cartão do RDO. *Correção:*
   desenhar o RDO **como o documento que ele vira** (o PDF já existe em `.g-doc`): seções com cabeçalho, sem caixas internas, e as fontes
   como notas à margem direita.
5. As fontes (`.g-src`) têm 11,5 px em `--muted` sobre `--cream` (detector: tiny-text ×7). Pelo Princípio 2, a fonte é o que gera
   confiança. *Correção:* 12 px, contraste ≥ 4,5:1.

**(c) Redesenho:** à esquerda, a lista de dias compacta (só as exceções em destaque); à direita, o RDO como folha de papel, com a barra de
revisão fixa (pendências + Enviar habilitado só quando estiver completo); "Gerar PDF" é secundário e "Editar" vira edição inline em cada
seção.

**(d) Igual no produto todo:** **um só componente de fonte** (ícone + "de onde veio + hora"), usado no chat, no RDO, no orçamento e nas
medições; e nenhuma ação irreversível habilitada com dados pendentes.

---

## Medições · `#obra/vila-nova/medicoes`

**(a) Tarefa:** ver qual empreiteiro recebeu mais do que executou e segurar o próximo pagamento.

**(b) Problemas**
1. **O primário da tela é a ação errada.** "Nova medição" está em ocre; "Segurar o próximo pagamento", que é a recomendação do agente e o
   motivo de abrir a tela, é um botão branco sobre um alerta vermelho. *Correção:* "Segurar o próximo pagamento" vira o primário do
   alerta; "Nova medição" passa a secundário no cabeçalho da tabela.
2. **A tabela tem 9 colunas, com 3 delas dizendo a mesma coisa** (as barras de executado × pago, Executado R$, Pago R$, Pago − executado).
   Em 1100 px a tabela rola na horizontal e corta Vales e Situação. *Correção:* 6 colunas: Etapa · empreiteiro | Contratado | Executado ×
   pago (barra dupla com os R$ ao lado) | Diferença | Retenção | Situação; os vales entram no detalhe (drawer).
3. **Vermelho onde não há problema.** "+R$ 1.840 adiantamento de mobilização **previsto no contrato**" está em vermelho, como o
   sobrepagamento da estrutura. *Correção:* vermelho só quando o pagamento passa do executado **e** não tem respaldo no contrato; o
   adiantamento previsto fica em `--muted`, com a nota.
4. **Os KPIs quebram em 1100 px.** "R$ / 164.500" se divide em 2 linhas (screenshot `tabs1100`). *Correção:* valor do KPI com
   `white-space:nowrap`, `tabular-nums` e um tamanho que encolhe (`clamp(20px, 2vw, 28px)`).
5. **As linhas são clicáveis sem nada que indique isso** (só o hover). *Correção:* chevron à direita e o nome do contrato como link.

**(c) Redesenho:** o alerta com a conta no título ("Equipe Silva: pago 75%, executado 62% → R$ 7.540 acima") e o primário Segurar → 3 números
(contratado, executado, pago, com a diferença) → a tabela de 6 colunas → os contratos a fechar ("Hidráulica, Acabamento: pedir 3 propostas")
num bloco próprio abaixo, fora da tabela.

**(d) Igual no produto todo:** a frase-conta no título do alerta (A × B → diferença → ação), e o vermelho reservado para dinheiro ou prazo
perdido.

---

## Assistente de nova obra · `openWizard(1..4)`

**(a) Tarefa:** criar uma obra com o mínimo de digitação e sair com uma estimativa em que dê para confiar.

**(b) Problemas**
1. **O passo 3 junta 3 decisões:** de onde vem o orçamento (3 caminhos), verba/margem/datas e as 9 fases. É o passo mais pesado e o único
   sem ajuda. *Correção:* o caminho do orçamento vai para o passo 1, porque depende do que foi anexado (planilha → importar; só PDF →
   extrair) e o agente sugere o caminho a partir dos anexos. As fases saem do assistente: o agente as propõe depois, na obra.
2. **O passo 4 leva para outra obra.** "Abrir orçamento completo" abre a Casa Vila Nova (`gestao.js:543`). Na demo, o gerente cria o
   "Sobrado Jardim Europa" e cai numa obra com outro nome. *Correção:* terminar criando a obra na sidebar (estado "orçando", como o
   Galpão) e abrir a aba Hoje com o chat do orçamento. O modal fecha no momento em que o agente começa a trabalhar, sem uma tela de
   espera dentro do modal.
3. **O progresso é uma barra de 3 px sem rótulos.** Não dá para saber quantos passos faltam nem voltar para um específico. *Correção:*
   "Passo 2 de 3 · Descreva a obra" em texto, com os rótulos dos passos clicáveis para voltar.
4. **Os títulos são inconsistentes:** "Nova obra · 1. Projeto", depois "2. Descreva a obra", depois "3. Orçamento, prazos e fases".
   *Correção:* título fixo "Nova obra" e subtítulo com o passo.
5. **As fases têm ícone de arrastar, mas não arrastam**, e "+ fase" é um toast. *Correção* (se as fases continuarem): lista editável com
   ↑/↓ acessível por teclado; o ícone de arrastar sai.
6. **Clicar fora fecha e perde tudo** (ver Modais).

**(c) Redesenho em 3 passos:** 1) Anexos + nome + endereço → o agente sugere o caminho do orçamento (selo de confiança visível);
2) Descreva do seu jeito + verba e datas; 3) Revisar e criar. Depois a obra aparece na sidebar e o chat dela mostra o progresso
(passos ✓) e a lista "não consegui medir".

**(d) Igual no produto todo:** o selo de confiança (`.g-conf`) e a lista "não consegui medir" aparecem sempre que o agente estima,
no orçamento, no RDO e na medição.

---

## Padrões globais propostos

**Tipografia**
- Bricolage Grotesque só para o h1 (28 px), o h2 de seção e o título de cartão (17–18 px, 600). Inter para todo o resto. O detector acusa
  Inter em 85–97% do texto: a Bricolage nos números de KPI e nas manchetes do agente dá a personalidade sem trocar o corpo.
- Escala: 12 (meta, fonte, legenda) · 13,5 (controles, tabela) · 14 (corpo) · 17 · 22 · 28. **Nada abaixo de 12 px**; os rótulos da
  sidebar passam de 10,5 para 11,5 px. No `#campo` e no gate, o corpo tem ≥ 16 px.
- `font-variant-numeric: tabular-nums` em todo valor em R$, quantidade, data e hora; KPI com `nowrap`.
- Hierarquia de títulos: h1 da página → h2 dos cartões (sem pular nível).

**Cor**
- **Ocre = ação.** Primário, contador "pede você", aba ativa. Nunca decoração nem barra de progresso neutra.
- **Vermelho = dinheiro ou prazo perdido, ou bloqueio legal.** Nada de vermelho em adiantamento previsto, linha de "hoje" ou causa.
- **Verde = resolvido ou dentro do previsto.** Ponto de status com um só significado (vermelho, verde, cinza), igual na sidebar, no hub e
  no cabeçalho.
- Contraste: `--faint` (#8d9692, 2,5:1) não é usado em texto; `--muted` passa a #59625e (≥ 4,5:1 sobre o concreto e o cream2);
  sidebar com o texto secundário em #a3b3ad.
- As notas de validação (`.callout.val`) têm visual próprio de "pesquisa" (borda tracejada + rótulo "Pergunta para o gerente"). As
  pendências do produto usam outro componente.

**Espaçamento**
- Escala de 4 px: 4 · 8 · 12 · 16 · 24 · 32. Página com 32 px laterais (hoje são 44) para ganhar largura em 1100 px; cartões com 20 px;
  18 px entre cartões, como hoje.
- Uma superfície por nível: cartão sobre o concreto; dentro do cartão, blocos sem borda (fundo `--cream`). Fim do cartão dentro de cartão.

**Componentes (um de cada no produto)**
- **Proposta do agente:** título com a conta → fonte → primário ocre + até 2 secundários → depois de aprovada, pílula com quem, quando e
  Desfazer.
- **Pede você:** lista ordenada por gravidade, presente em Início, no hub (coluna), na aba Hoje e no topo de cada aba.
- **Chip de fonte:** ícone + origem + hora, ≥ 12 px.
- **KPI:** rótulo, valor (nowrap) e uma linha de contexto; no máximo 3 por tela e só quando não repetem um cartão.
- **Tabela:** linha clicável com chevron, no máximo 6 colunas em 1100 px, detalhe em drawer.
- **Abas:** no máximo 4 no nível 1, com contador; o segmento de nível 2 é um controle segmentado.
- **Modal vs drawer:** o modal grava, o drawer consulta. Os dois com X, Esc, foco preso e devolvido.

**Movimento** (lentes do Emil: só onde explica mudança de estado)
- Toast: entra com 8 px + opacity em 180 ms `cubic-bezier(.23,1,.32,1)` e sai em 120 ms.
- Modal: opacity + scale .97→1 em 180 ms, origem no centro. Drawer: translateX em 240 ms `cubic-bezier(.32,.72,0,1)`.
- Aprovação: o botão vira a pílula "✓ aprovado" com crossfade de 150 ms. Botões com `:active{transform:scale(.97)}`.
- **Sem animação:** troca de aba, tabelas, KPIs, Gantt, contadores (em ferramenta de uso diário, isso só atrasa).
- `prefers-reduced-motion`: só opacity, ≤ 120 ms (hoje o `*{transition:none}` já cobre; manter).
