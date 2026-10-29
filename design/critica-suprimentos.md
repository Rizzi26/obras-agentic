# Crítica de design · Suprimentos (Casa Vila Nova + Estoque entre obras)

> ⚠️ DEGRADED: single-context. O protocolo do `impeccable critique` pede dois sub-agentes isolados (A: revisão de design, B: detector). Aqui rodei tudo num só contexto para não multiplicar o custo por 5 telas. Fiz a revisão de design (A) antes de abrir o resultado do detector (B), mas as duas não foram isoladas de fato.
> Evidência: screenshots a 1440×900 (tela inteira e primeira dobra), 1100×800 (largura mínima do desktop), drawers `openComp('cim')` e `openInvItem('bloco')`, modal `openTransfer('cim')` (via Playwright), `npx impeccable detect` nas 5 rotas e leitura de `js/core.js`, `js/features/gestao.js` (Orçamento redefinido) e `js/features/proativo.js` (pedido de compra redefinido). Nada foi editado.

## O ciclo, antes das telas

A sequência que o produto promete é **falta prevista → cotação → pedido → entrega → NF conferida → estoque → sobra para outra obra**. Hoje ela está espalhada em 5 telas que **não se apresentam como etapas de um mesmo fluxo**:

- As abas são `Chat · Orçamento · Insumos e compras · Pedidos · Almoxarifado · Equipe · Prazos · Diário · Medições`: suprimentos fica no meio de 9 abas do mesmo peso, sem agrupamento nem contagem. O gerente não sabe em qual aba está o que pede ação.
- O **mesmo insumo muda de nome e de base de cálculo** entre as telas: "Cimento CP-II-E-32 50 kg (argamassa)", 474 sc da obra inteira em Insumos, vira "Cimento CP-II 50 kg", 200 sc "precisa até o fim" em Almoxarifado e na Transferência. A conta fecha (falta 34 = 14 comprar + 20 transferir), mas o olho não consegue provar isso.
- Cada tela tem uma cor e um componente para a mesma ação ("comprar 14" é pill âmbar no Almoxarifado, checkbox + botão em Insumos, "Avançar" no Kanban, botão âmbar "Transferir" no Estoque).

**Proposta transversal (vale para as 5 telas):** uma **faixa do ciclo** fixa no topo das abas de suprimentos, com as 5 etapas como passos contados e clicáveis:
`Falta 6 itens → Em cotação 4 → A caminho 3 (1 atrasado) → Conferir NF 1 → Sobra 1`.
Cada número abre a tela já filtrada. É o mapa do diferencial na tela e dá ao gerente a resposta "o que eu faço agora?" em todas as telas. Cada item ganha também um **ID e nome únicos** (o nome do Almoxarifado, curto) e uma **linha de conta padronizada** `precisa 200 − saldo 46 − a caminho 120 = falta 34 → 20 transferir + 14 comprar`, que é a mesma em todas as telas, no drawer, no pedido e no modal.

---

## 1. Orçamento (`#obra/vila-nova/overview`)

**(a) Tarefa principal:** decidir se a verba aguenta e quais economias aplicar hoje para fechar a diferença de R$ 28,3 mil.

**(b) Problemas**

1. **A decisão mora na lateral; a tabela de 16 linhas, no centro.** O painel "A verba é realista?" (resposta + economias + "Aplicar 3 de 5") é o que o gerente vai usar, mas ocupa a coluna estreita da direita. A tabela de etapas tem quebras de 3–4 linhas no nome da etapa ("Fundação · empreitada (Equipe Ramos)") e leva a página a ~2.000 px.
   *Correção:* inverter a hierarquia. Primeiro, uma faixa de largura total com a resposta ("Ainda não: fecha em R$ 648.300, +4,6%") e as economias em linhas com checkbox, com o botão "Aplicar 3 (−R$ 4.387)" logo ali. Abaixo, a tabela em largura total, com o nome da etapa em uma linha (etapa em negrito + serviço em cinza na mesma célula: `Fundação · empreitada`).
2. **Dois callouts antes de qualquer número.** "Validar com o gerente" + "Estimativa para decisão" empilhados ocupam ~110 px da primeira dobra. O segundo é um aviso legal, não uma ação.
   *Correção:* tirar o callout "Estimativa…" do topo e colocar como uma linha de rodapé junto do selo de confiança ("Estimativa para decisão: não substitui o executivo nem a ART/RRT"). A nota de validação fica, mas como a única faixa (ver padrões).
3. **4 KPIs do mesmo peso, sendo que só um importa.** Verba, Projeção, Gasto e Comprometido têm o mesmo tamanho e a mesma barra preta no topo. A informação que dispara a decisão (Projeção +R$ 28.300) parece igual a "Comprometido".
   *Correção:* um bloco principal "Projeção R$ 648.300 · +R$ 28.300 (+4,6%) sobre a verba de R$ 620.000" e, ao lado, um par secundário menor "Gasto R$ 241.850 (39%) · Comprometido R$ 286.400". Sem barra superior.
4. **As economias são ações de outras telas, sem ponte.** "Exigir palete no PED-0162", "Aprovar o PED-0163", "Abater a areia do PED-0157" são exatamente o que aparece em Pedidos e Almoxarifado, mas aqui não têm link e o checkbox não diz o que acontece lá.
   *Correção:* cada economia com o ID do pedido como link (`PED-0162 ›`) e, depois de aplicada, a pill "aplicada · ver em Pedidos". Isso costura o Orçamento ao ciclo.
5. **Δ sem unidade e cor só vermelha.** "+1.400", "+9.400" em vermelho, "—" em cinza. A coluna Δ é a mais útil para escanear e não tem destaque de magnitude.
   *Correção:* "+R$ 9.400" com uma barra horizontal fina proporcional na própria célula (dado funcional, sem animação), ordenação por Δ disponível no cabeçalho.
6. **Contraste e tamanho:** o detector acusa 11,5 px no corpo da tabela (`.sm` + fonte da linha), verde #2f8a5b sobre #e5eeea a 3,6:1 no painel do agente, h1→h3 pulando nível.

**(c) Redesenho:** topo = resposta do agente + economias com checkbox + "Aplicar" (largura total, fundo do agente). Depois a linha de números (Projeção grande, Gasto/Comprometido pequenos). Depois a tabela de etapas, ordenável, com Δ em barra e selo de confiança. "Gasto × avanço" e "Etapas" saem do rodapé e viram uma linha só abaixo dos números ("Dinheiro 39% · obra 38%: 1 p.p. à frente, dentro do normal"). O aviso legal vai para o rodapé da tabela.

**(d) Para globalizar:** "resposta primeiro, tabela depois"; a fonte e a confiança por linha (pill `alta/média/baixa`) viram o componente padrão de "de onde vem esse número" em Insumos, Almoxarifado e Estoque.

---

## 2. Insumos e compras (`#obra/vila-nova/componentes`) + drawer `openComp('cim')`

**(a) Tarefa principal:** ver o que falta comprar (descontado o que já está pedido ou vem por transferência) e gerar o pedido no fornecedor certo.

**(b) Problemas**

1. **Risco de compra em dobro no botão principal.** "Gerar pedido de compra (7)" vem com 7 itens marcados, e 3 deles já estão em cotação (Aço 600 kg "PED-0167 em cotação", Telha 3.900 "PED-0163", Cabo 22 rolos "PED-0164"). O `openCheckout` em `proativo.js` calcula `falta = precisa − saldo − a caminho` e "a caminho" só conta `col ≥ 1`, então o item em cotação entra de novo no pedido. Isso contradiz o critério de sucesso do produto ("nenhum real pago a mais… compra em dobro").
   *Correção:* item com cotação aberta **não** tem checkbox. Em vez disso, um botão inline "Aprovar PED-0167" (que move o cartão para Aprovado). O botão principal conta só o que não tem pedido nenhum: "Pedir 4 insumos · R$ 3.274".
2. **Colunas com largura mal distribuída: o nome quebra em 4 linhas.** "Concreto usinado fck 25 MPa (com bomba lança)" ocupa 4 linhas numa coluna de ~90 px, enquanto "Economia vs. 2º" tem ~200 px para mostrar "R$ 5". Cada linha fica com ~100 px de altura; 9 insumos já passam da dobra (64 não caberiam).
   *Correção:* nome com `min-width: 260px` em uma linha + fase em cinza abaixo. "Economia vs. 2º" vira um texto curto dentro da célula do fornecedor ("Depósito São Bento · R$ 22 a menos que o 2º"). O motivo de não ser o mais barato ("Gerdau está atrasada") vira um ícone de info com o texto no tooltip e no drawer.
3. **A tela mistura "o que já está resolvido" com "o que pede ação".** Concreto e Brita aparecem com a pill "nada" e checkbox desativado, intercalados com as faltas.
   *Correção:* agrupar em três blocos com cabeçalho e contagem: **Falta comprar (4)** · **Em cotação, aguardando você (3)** · **Coberto (2, recolhido)**. É o primeiro passo do ciclo, e o agrupamento conta a história sozinho.
4. **"9 de 64 insumos" sem explicação.** Pill azul que parece filtro, mas não é clicável e não diz quais são os outros 55.
   *Correção:* "9 insumos com compra até o fim da estrutura · ver os 64" (link que expande ou filtra).
5. **Drawer `openComp`: o fornecedor recomendado não é o mesmo da tabela, e falta a conta.** O drawer diz "falta comprar 14 sc" e explica a fórmula em texto, mas sem os números. Os três cartões de fornecedor (cartão dentro do drawer, `nested-cards`) têm o mesmo peso e cada um tem "Pedir aqui" + "Contato": 6 botões iguais.
   *Correção:* topo do drawer = a linha de conta padrão com números (`precisa 200 − saldo 46 − a caminho 120 − transferência 20 = 14 sc`). Fornecedores como **lista com divisórias** (não cartões), o melhor com "Pedir 14 sc aqui · R$ 517" (botão primário) e os outros só com o preço e o prazo; "Contato" vira ícone. Mostrar de onde veio o preço ("WhatsApp 07:40", "site") por fornecedor, não só no rodapé.
6. **Contraste:** #626c68 sobre #ebe9e3 (4,48:1) na legenda de fórmula; o verde da economia (#2f8a5b sobre branco, 4,3:1) fica abaixo de AA.

**(c) Redesenho:** cabeçalho com a frase de status do agente ("4 insumos para comprar · R$ 3.274 · 3 cotações esperando sua aprovação"). Bloco "Em cotação, aguardando você" primeiro (é a decisão mais barata: um clique). Depois "Falta comprar" com checkbox e o botão de pedido no fim do bloco, não no canto. "Coberto" recolhido. A coluna "Comprado ou a caminho" vira o padrão `saldo + a caminho` igual ao do Almoxarifado.

**(d) Para globalizar:** a linha de conta; **nenhum CTA conta item que já tem pedido aberto**; um só nome por insumo; drawer = conta → recomendação → alternativas → origem do dado.

---

## 3. Pedidos (`#obra/vila-nova/kanban`)

**(a) Tarefa principal:** saber o que está travado (atrasado, aguardando aprovação, chegou e falta conferir) e destravar com um clique.

**(b) Problemas**

1. **A única ação urgente do Kanban está abaixo da dobra.** Na coluna "Recebido", os 4 primeiros cartões são `PED-0141/0144/0149/0150 · No almoxarifado` (encerrados em setembro e outubro). O PED-0157 da areia, o único com "Conferir NF" e R$ 472 a abater, é o 5º cartão e não aparece em 1440×900.
   *Correção:* separar "Recebido · conferir NF" (aberto) de "No almoxarifado" (histórico). Os encerrados viram uma linha recolhida "4 conferidos este mês ›" no pé da coluna. Ordem de cada coluna: atrasado/ação primeiro, depois por data.
2. **"Avançar" é o mesmo botão para aprovar compra, marcar enviado e marcar em trânsito.** Em "Em cotação", o cartão da Telha diz "cotado · aguarda sua aprovação", mas o botão é "Avançar →". Aprovar R$ 9.165 com o mesmo peso de "mudar de coluna" esconde a decisão de dinheiro (e a alçada).
   *Correção:* o verbo do botão vem da transição: "Aprovar R$ 9.165" (primário âmbar, só em Em cotação), "Marcar enviado", "Saiu para entrega", "Conferir NF". Aprovar acima da alçada de R$ 5.000 abre a confirmação com a alçada, como já faz o pedido de compra.
3. **O cartão atrasado usa faixa lateral de 3 px (`side-tab`) + pill "atrasado" + texto "9 dias atrasado".** Três sinais para o mesmo fato, e a faixa é o padrão "cara de IA" que o detector acusa.
   *Correção:* tirar a faixa; manter a pill "atrasado 9 d" no topo do cartão e trazer o efeito ("trava a laje do 2º pav.") como a linha de meta. O cartão atrasado sobe para o topo da coluna.
4. **Cartão dentro de coluna dentro de página = três níveis de caixa** (`nested-cards` ×5), coluna #dfddd5 com texto #626c68 a 4,0:1. Em 1100 px cada coluna tem 142 px e os nomes quebram em 3 linhas.
   *Correção:* colunas sem fundo, só um título com contagem e uma divisória; cartões brancos com borda. A 1100 px, colunas `minmax(180px,1fr)` e o histórico recolhido liberam espaço; se não couber, rolagem horizontal da faixa do Kanban (não da página).
5. **Não há ligação visível entre o Kanban e o resto do ciclo.** O cartão "sugerido" do parafuso diz "o que a transferência não cobre", mas não mostra a transferência (que entra como cartão "transf." só depois de pedida). O cartão do aço atrasado não diz que existe o PED-0167 de plano B.
   *Correção:* uma linha "ligado a" no cartão: `PED-0158 atrasado ↔ PED-0167 plano B (em cotação)`, `PED-0165 · resto de 380 − 300 da TRF`. Clique leva ao outro cartão (destaque de 1 s, sem animação de movimento).
6. **Arrastar como instrução principal.** O subtítulo começa com "arraste o cartão". Para o gerente, arrastar é a forma menos segura de mudar estado de compra; e o critério de acessibilidade pede ação sem arrastar.
   *Correção:* subtítulo "Pedidos em aberto R$ 68.838 · 1 atrasado · 1 para conferir"; o arrastar continua existindo, mas não é anunciado.

**(c) Redesenho:** acima do quadro, a faixa do ciclo (já filtrável). Colunas: Em cotação (aprovar) → Aprovado → Enviado → Em trânsito → **Conferir NF** (só os abertos). "No almoxarifado" sai do quadro e vira link para o Almoxarifado/histórico. Cartão: ID + pill de estado na 1ª linha; item em negrito; quantidade · fornecedor; uma linha de efeito ("trava a laje", "abate R$ 472"); botão com o verbo certo.

**(d) Para globalizar:** botão nomeado pela consequência ("Aprovar R$ 9.165", nunca "Avançar"); itens encerrados recolhidos; o que pede ação sempre no topo do grupo; nenhum sinal de estado por faixa lateral.

---

## 4. Almoxarifado (`#obra/vila-nova/inventario`) + drawer `openInvItem('bloco')`

**(a) Tarefa principal:** ver o que vai acabar e o que está sumindo (quebra/perda) e mandar a ação certa: transferir, comprar o resto ou cobrar o fornecedor.

**(b) Problemas**

1. **O KPI "Acabam em ≤ 7 dias" contradiz a tabela.** Ele lista "Aço CA-50, Parafuso 5/16"", mas a coluna Dura diz parafuso **≈ 8 dias** e cimento **≈ 6 dias** (que não entra). O KPI lê o campo `st:'bad'`, não a duração. Na frente do gerente, isso derruba a confiança no número.
   *Correção (dado e design):* o KPI calcula a partir da mesma duração da coluna, e o card mostra os itens ordenados pelo dia em que acabam ("Aço até 30/10 · Cimento ≈ 6 d"). Avisar o Maestro: é inconsistência de dado, não só de layout.
2. **A coluna "O que fazer" é a mais importante e é a menos legível.** São pills de 12 px, com cor de status, misturando ação ("comprar 600 · PED-0167"), informação ("programado por concretagem"), estado ("suficiente") e sobra ("sobra 8 · 6 podem ir para a Loja Centro"). As pills parecem clicáveis só às vezes (só as de transferência têm `onclick`). O detector acusa âmbar #b7791f sobre branco a 3,6:1 na coluna Falta.
   *Correção:* separar em duas colunas: **Situação** (texto curto cinza: "suficiente", "programado") e **Ação** (botão de verdade quando há ação: "Trazer 20 da Loja Centro", "Comprar 14", "Ver PED-0167"). Linha sem ação fica com a célula vazia.
3. **A tabela não está ordenada pela urgência.** A ordem é a do cadastro (aço, concreto, bloco, cimento…). Concreto (saldo 0, "entregue no dia") e Brita ("suficiente") ficam entre as faltas.
   *Correção:* ordenar por "dura" (acaba primeiro em cima); itens sem falta recolhidos em "Cobertos (4)". A curva ABC continua como pill pequena ao lado do nome, mas com rótulo acessível ("curva A").
4. **O caso-vitrine (quebra de 15%) está num KPI do mesmo peso que "Itens no almoxarifado: 42".** "42" e "R$ 18.240" não levam a nenhuma decisão; a quebra leva (exigir palete no PED-0162).
   *Correção:* trocar os 4 KPIs por **2 alertas acionáveis** em largura total, cada um com o botão: "Bloco: 15% de quebra contra 5% previsto · 190 un · 110 na descarga sem palete → Exigir palete no PED-0162" e "PED-0157 chegou e falta conferir: 36 m³ medidos contra 40 na NF → Conferir NF". "42 itens · R$ 18.240" vira uma linha de texto acima da tabela.
5. **Faixa vermelha de recebimento usa vermelho para algo que não é erro.** "PED-0157 chegou e ainda não foi conferido" está em `alertnote` (fundo vermelho claro), a mesma cor de "falta 600 kg".
   *Correção:* "chegou, falta conferir" é uma tarefa pendente: âmbar (ação), não vermelho (perda). Vermelho fica reservado para divergência real (−4 m³) e falta que para a obra.
6. **Drawer `openInvItem('bloco')`:** o "Para onde foi" é bom (barra empilhada + legenda com quantidades e %), e o alerta com "Exigir palete" é a ação certa. Mas: (i) as cores da barra são 5 tons que não querem dizer nada (roxo, verde, ocre para "eixo A", "A–B", "B–C") e competem com o vermelho da quebra; (ii) o botão principal ("Exigir palete") está no meio do drawer e "Registrar saída" no pé, depois de uma tabela longa; (iii) a linha de resumo "Entraram 4.000 · saíram 1.240 · saldo 2.760 · a caminho 9.000 · precisa 13.200 · falta 1.440" é um parágrafo corrido.
   *Correção:* barra com **duas cores semânticas** (assentado = grafite, quebra = vermelho, saldo = concreto), com os eixos só na legenda. Resumo na linha de conta padrão. Ação primária fixa no pé do drawer (sticky), com o verbo da situação ("Exigir palete no PED-0162" ou "Trazer 20 da Loja Centro").

**(c) Redesenho:** topo = 1–2 alertas acionáveis (quebra, conferir NF). Depois "Vai acabar" (tabela ordenada por dias: item · saldo · a caminho · falta · dura · ação em botão). Depois "Coberto" recolhido. Os botões "Registrar saída / Registrar entrada / Pedir de outra obra" saem do cabeçalho: entrada e transferência já viram ação por linha; "Registrar saída" fica, mas como secundário, com a nota "o mestre registra pelo WhatsApp".

**(d) Para globalizar:** **cor = significado fixo** (vermelho = perda/obra parada, âmbar = pede você, azul = a caminho/transferência, verde = resolvido); pill é estado, botão é ação, nunca uma pill clicável; tabelas ordenadas por urgência com o resolvido recolhido.

---

## 5. Estoque entre obras (`#estoque`) + modal `openTransfer('cim')`

**(a) Tarefa principal:** aprovar a transferência da sobra de uma obra para a falta de outra, sabendo que a origem não fica sem e quanto se economiza.

**(b) Problemas**

1. **Os 4 KPIs são de resultado, mas nada foi feito ainda.** "Material aproveitado: 3 insumos", "Compra evitada: R$ 969", "Dias ganhos: até 3 dias" descrevem o que acontece **se** as 3 sugestões forem aprovadas. Lido como fato, é uma afirmação falsa e contraria "a confiança vem de mostrar de onde vem cada número".
   *Correção:* um só cabeçalho condicional: "Se aprovar as 3: R$ 52,60 a menos que comprar novo, cimento chega 2 dias antes, 20 sc deixam de vencer na Loja Centro". Resultado real (o que já foi transferido) vai para o Histórico com o total.
2. **Tabela de 10 colunas para uma decisão de 3 números.** "Saldo na origem · Origem ainda usa · Reserva · Pode sair · Destino precisa · Preço de custo · Total": o gerente precisa mesmo de "pode sair 20 de 26 · destino precisa 34 · R$ 710 vs R$ 738". A coluna "De → para" quebra em 4 linhas.
   *Correção:* uma linha por sugestão em forma de **frase + mini barra** (a mesma barra do modal: usa / reserva / pode sair) + preço contra novo + botão. "Reforma Loja Centro → Casa Vila Nova" vira "Loja Centro → Vila Nova" numa linha.
3. **Dois caminhos para a mesma decisão, com nomes diferentes.** A tela chama "Transferências sugeridas"; o Almoxarifado chama "20 da Loja Centro" e "Pedir de outra obra"; o drawer chama "Trazer 20 da…"; o chat chama "Transferir 20 sc"; o modal confirma "Pedir transferência". Cinco verbos.
   *Correção:* um verbo só por direção: **"Trazer"** quando se olha do destino, **"Ceder"** quando se olha da origem; o botão final sempre "Pedir transferência de 20 sc".
4. **Modal `openTransfer('cim')`: bom conteúdo, sem prioridade e corta a ação a 1100×800.** A barra "quanto pode sair" e a comparação "Transferir × Comprar novo" são o melhor momento do ciclo. Mas a 1100×800 o botão "Pedir transferência" fica abaixo da dobra do modal (a nota "Validar" amarela ocupa o lugar dele). E "Ainda faltam 14 sc: o agente inclui no próximo pedido" é a ponte para Insumos, sem link.
   *Correção:* rodapé do modal fixo (sticky) com Cancelar / Pedir transferência; nota de validação colapsada num ícone no título; "14 sc no próximo pedido" com link "ver em Insumos ›". O "OK da Ana P." sobe para perto do botão ("vai para a Ana P. aprovar").
5. **Acerto entre obras e Histórico: bom conceito, leitura frágil.** "+R$ 227,30 / −R$ 227,30" em verde/vermelho parece lucro/prejuízo; "Positivo: cedeu mais do que recebeu" fica em letra miúda no pé.
   *Correção:* "Vila Nova cedeu R$ 227,30 a mais do que recebeu" como frase, cores neutras (não é perda de ninguém).
6. **Contraste:** "vence em 25 dias na origem" em #b7791f sobre branco (3,6:1); linha de regra com ~164 caracteres por linha (detector `line-length`).

**(c) Redesenho:** título + frase do agente ("3 sobras podem cobrir faltas: cimento, parafuso, prego"). Lista de sugestões em linhas-frase com a barra usa/reserva/pode sair, preço × novo e "Trazer". A regra da reserva vai num "como calculo" expansível. Abaixo, "Pedidas, aguardando a origem" (o que hoje some do Histórico até ser recebido) e o Histórico com o acerto em frase. Modal com rodapé fixo.

**(d) Para globalizar:** projeção nunca escrita como fato (rótulo "se aprovar"); barra de capacidade "usa / reserva / disponível" como componente reutilizável (vale também para a duração do estoque no Almoxarifado); rodapé de ação fixo em todo modal e drawer.

---

## Notas Emil (cheatsheet, movimento, break-ui)

- **Movimento:** drawer e modal aparecem por `display:none → flex`, sem transição. Para uma ferramenta usada o dia inteiro, isso é aceitável, mas a entrada do drawer sem nenhum deslocamento faz a tela "piscar". Proposta: drawer `transform: translateX(16px) → 0` + opacity, **180 ms, `cubic-bezier(.23,1,.32,1)`**, saída 140 ms; modal `scale(.98) → 1` + opacity, 160 ms; nada de mola. Kanban: **sem animação** ao mover cartão (ação frequente; o toast com Desfazer já é o feedback). `prefers-reduced-motion` já zera transições; manter.
- **Feedback de ação:** toda ação que muda dinheiro ou estoque (Aprovar, Trazer, Conferir) muda o botão para o estado resultante no mesmo lugar ("✓ PED-0167 aprovado") e o toast traz Desfazer. Já existe em parte (palete, transferência); padronizar.
- **Números:** `font-variant-numeric: tabular-nums` em toda coluna `num` e KPI (hoje só `lining-nums` no KPI); alinhamento à direita já está certo.
- **break-ui (dados extremos):** (1) nome de insumo longo já quebra em 4 linhas com 9 itens; com 64 insumos a tela de Insumos passa de 6.000 px, sem busca nem filtro. (2) Kanban a 1100 px: colunas de 142 px; um fornecedor como "Pedreira Basalto Campinas Ltda." ou um valor de R$ 1.250.000 quebra o cartão. (3) Coluna "Recebido" cresce para sempre (todo pedido conferido fica lá). (4) Transferência com 0 sugestões cai num `colspan=10` de texto cinza; o estado vazio precisa dizer "nenhuma sobra cobre falta hoje · próxima checagem amanhã 6h". (5) Valor negativo de falta / quantidade zero no modal já está tratado (`max(0, …)`).
- **mobile-native:** fora do recorte (abaixo de 1100 px só #campo funciona), mas a conferência de NF (PED-0157) acontece no canteiro: vale levar o "Conferir NF" do Kanban para o #campo como cartão de WhatsApp.

## Nota de saúde (Nielsen, 0–4, conjunto das 5 telas)

| # | Heurística | Nota | Ponto-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 2 | Conferir NF abaixo da dobra; KPI "≤ 7 dias" errado |
| 2 | Linguagem do mundo real | 3 | vocabulário de obra correto; "Avançar" genérico |
| 3 | Controle e liberdade | 3 | registro + Desfazer em quase tudo |
| 4 | Consistência | 1 | nome do insumo, verbo da transferência e cor variam por tela |
| 5 | Prevenção de erro | 1 | pedido de compra inclui o que já está em cotação |
| 6 | Reconhecer em vez de lembrar | 2 | a conta não aparece com os números; sem ponte entre pedidos ligados |
| 7 | Eficiência | 2 | tabelas sem ordenar por urgência; 16 linhas antes da decisão |
| 8 | Estética e minimalismo | 2 | 4 KPIs por tela, 3 níveis de caixa, callouts empilhados |
| 9 | Recuperação de erro | 3 | divergência da NF bem tratada (abate R$ 472) |
| 10 | Ajuda | 3 | fórmulas no rodapé e "como estimei" no drawer |
| | **Total** | **22/40** | aceitável: conteúdo forte, apresentação ainda não conta o ciclo |

**Veredito de especificidade:** o conteúdo é muito específico (palete, caçamba medida, reserva da origem, alçada); a forma ainda é genérica de dashboard (4 KPIs + tabela + card lateral em todas as telas, barra preta no topo do KPI, faixa lateral no ativo). O detector confirma o que a revisão viu: `nested-cards` no Kanban e nos drawers, `side-tab` (.nav.on, .kc.late), `tiny-text` 11,5 px, `low-contrast` (sidebar #7d8e88 a 3,1–4,3:1; #626c68 sobre a coluna do Kanban a 4,0:1; âmbar #b7791f e verde #2f8a5b sobre branco a 3,6 e 4,3:1), `skipped-heading` (h1 → h3/h4), `line-length` na regra do Estoque. O "cream-palette" e o "overused-font Inter" são da identidade global e cabem à crítica geral, não a este recorte.

---

## Padrões globais propostos

**Tipografia**
- Escala de 5 passos: 13 (meta/tabela densa), 14 (corpo), 16 (título de seção, peso 600), 22 (título de bloco/drawer), 28 (h1 da página). Nada abaixo de 13 px no desktop (acaba com os 11,5/12/12,5 px das pills, `th` e `.sm`).
- `tabular-nums` em todo número; dinheiro sempre com "R$" e sinal ("+R$ 9.400").
- Hierarquia de títulos correta: h1 página → h2 bloco → h3 subbloco (corrige `skipped-heading`).
- Linha de texto ≤ 80 caracteres em callouts e notas do agente (`max-width: 72ch`).

**Cor (semântica fixa, em todo o produto)**
- Vermelho = perda ou obra parada (falta que trava, divergência, quebra). Âmbar = pede você (aprovar, conferir). Azul = a caminho / transferência. Verde = resolvido / economia. Cinza = informação.
- Texto colorido só com contraste AA: escurecer o âmbar de texto (≈ #8a5a12), o verde (≈ #256f49), o `--muted` (≈ #575f5c) e o cinza da sidebar (≈ #9aaaa4 sobre #1c2a27).
- Âmbar sólido (botão primário) só para **uma** ação por tela/bloco.

**Espaçamento e superfícies**
- Base de 4 px; ritmo 8/12/16/24/32. Um nível de caixa: página → cartão. Dentro do cartão, divisórias e espaço; nunca cartão dentro de cartão (Kanban, drawers, modais).
- Sem barra superior preta nos KPIs e sem faixa lateral no item ativo/atrasado (estado por pill + peso de texto + fundo).
- Nota de validação: uma faixa fina recolhível (ícone de frasco + 1 linha), sempre no mesmo lugar, nunca empilhada com outro callout.

**Componentes**
- **Faixa do ciclo de suprimentos** (Falta → Em cotação → A caminho → Conferir NF → Sobra) no topo de Insumos, Pedidos, Almoxarifado e Estoque, com contagem e filtro.
- **Linha de conta** padrão: `precisa X − saldo Y − a caminho Z [− transferência T] = falta F → comprar C`, idêntica em tabela, drawer, pedido e modal.
- **Status × Ação**: pill = estado (não clicável); botão = ação, nomeado pela consequência ("Aprovar R$ 9.165", "Trazer 20 sc", "Conferir NF"). Proibido "Avançar".
- **Tabela de trabalho**: ordenada por urgência, o resolvido recolhido em "Cobertos (n)", coluna de ação à direita com no máximo um botão.
- **Referência de documento** (`PED-0162`, `TRF-0005`) sempre como link que abre o cartão/drawer certo, em todas as telas.
- **Drawer e modal**: cabeçalho com nome + linha de conta; corpo; **rodapé de ação fixo**; origem do dado no pé ("preço via WhatsApp, 07:40").
- **Projeção rotulada**: todo número que depende de aprovação leva "se aprovar".
- **Barra de capacidade** (usa / reserva / disponível) reutilizada no Estoque, no modal e na duração do Almoxarifado.

**Movimento**
- Drawer: entra 180 ms (`translateX(16px)` + opacity, `cubic-bezier(.23,1,.32,1)`), sai 140 ms. Modal: 160 ms (`scale(.98)` + opacity). Toast: 160 ms de baixo.
- Sem animação em ações frequentes (mover cartão, marcar checkbox, aplicar economia); o feedback é a troca de estado no lugar + toast com Desfazer.
- Destaque de 1 s (fundo âmbar claro que esmaece) ao chegar a um item por link cruzado ("PED-0162 ›").
- `prefers-reduced-motion`: só opacidade, sem deslocamento.
