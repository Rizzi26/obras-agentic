# Crítica · agente e campo (Início, Aprovações, Campo · WhatsApp, modais do agente)

Recorte: `#home`, `#aprovacoes`, `#campo` (1440×900 e 390×844) e os modais `openCheckout(['cim'])`,
`openConferencia('PED-0157')`, `openBaixa('bloco')`. Feito em 29/10/2026, só leitura (nenhum código alterado).

**Método.** Execução degradada em um só contexto: fui recrutado como subagente e não havia ninguém a quem fazer
as perguntas da skill, então a revisão de design (A) e o detector (B) rodaram em sequência, e a revisão foi
escrita antes de eu ler o detector. Lentes usadas: impeccable critique/audit, cheatsheet de UI do Emil,
mobile-native (obrigatória na `#campo`) e break-ui por leitura do código. Evidência: screenshots em
`/tmp/critcampo/*.png` (rotas, rolagem longa, modais no desktop e no celular, estado "Corrigir", estado "Gravado",
1100 px, toast depois de Aprovar) e `npx impeccable detect` nas 4 vistas (`/tmp/critcampo/detect.txt`).

**Detector, resumo do recorte.** home 16 · aprovacoes 14 · campo 20 · campo 390 px 12 anti-padrões.
Os que importam aqui: tiny-text 11,5 px (`.sug`, `.bx-chip small`, `.wa-transc span`, a linha da conta no pedido),
horário do WhatsApp a 10,5 px e `--faint` em 2,6–3,0:1 (`.wa-h`, placeholder do composer), nested-cards (briefing
dentro do balão do agente, cards dentro do modal de pedido, cards no painel lateral da `#campo`), line-length de
96–101 caracteres nos textos das propostas em Aprovações e side-tab no `.nav.on`. O "repeating-stripes" (parede
e código de barras da DANFE) é falso positivo: é ilustração de conteúdo, não decoração.

---

## 1. Início (`#home`) · briefing do dia + chat

**(a) Tarefa principal.** Às 7h, no escritório ou no carro, o gerente decide em menos de 2 minutos o que aprovar
hoje, começando pelo que trava equipe ou custa dinheiro primeiro.

**(b) Problemas**

1. **A fila não tem ordem de urgência nem dá para varrer.** As 6 propostas têm o mesmo peso visual (ícone,
   título, parágrafo de 2–3 linhas, linha "sugerido pelo agente", 3 botões). O aço, que "só dá até ~30/10" (daqui
   a 2 dias e com equipe parando), está em 2º; a concretagem de 06/11 vem em 1º. Prazo e dinheiro estão escondidos
   no meio do parágrafo. A 1440×900 só cabem 1,5 decisões na primeira dobra; a 1100×800, uma.
   *Correção:* ordenar por "prazo para decidir" e mostrar isso como coluna, não como prosa. Cada linha da fila
   ganha, à esquerda e em números tabulares, **quando** ("até amanhã", "até 30/10", "até 04/11") e, à direita,
   **quanto** (R$ 472, R$ 7.540, 600 kg). O título fica numa linha só; o `det` vira a 2ª linha, limitada a 1 linha,
   com "mais" para expandir. Meta: 6 decisões visíveis na primeira dobra a 1440×900.

2. **"sugerido pelo agente · {tag} · aguardando você" repetido 6 vezes.** Nesta tela tudo é sugestão do agente e
   tudo aguarda o gerente, então a linha é ruído (e está em 11,5 px no ocre `--accentInk`, que disputa com o botão
   Aprovar). *Correção:* tirar da fila do Início. A tag (clima, fornecedor, perda…) vira um rótulo curto ao lado do
   título; a origem "agente" só aparece no registro e quando a proposta veio de outra fonte (WhatsApp da Joana).

3. **Não diz de qual obra é cada item.** O balão anuncia "3 obras" como fonte, mas `itemProp(p)` é chamado sem
   `comObra`; as 6 são da Vila Nova e o gerente não tem como saber. *Correção:* sempre mostrar a obra (bolinha de
   cor + nome curto) na linha. Se todas forem da mesma obra, agrupar sob um cabeçalho "Casa Vila Nova · 6", como
   em Aprovações.

4. **O briefing mora dentro de um balão de chat, seguido de uma conversa antiga já respondida.** O gerente entra
   e vê um card dentro do card do agente (nested-cards), e abaixo duas trocas pré-roteirizadas (blocos e prazo) que
   empurram o composer para competir com a fila. A 1100 px, o composer + chips ocupam ~220 px dos 800 px da tela.
   *Correção:* o briefing é a página, não uma mensagem. Fila em largura total no topo; o chat vira uma barra de
   uma linha fixa no rodapé ("Pergunte ou peça…", que expande ao focar). As duas conversas de exemplo descem para
   "Conversas de hoje", recolhidas.

5. **Aprovar não deixa rastro onde o olho está.** Ao aprovar o aço, o item sai com fade + `translateX(24px)` em
   200 ms e a lista **pula** (não há colapso de altura). O toast "Pedido de 600 kg… Desfazer" aparece por cima do
   composer, e a confirmação persistente ("Aprovado hoje: …") fica no fim da lista, fora da tela.
   *Correção:* a linha não some: vira estado "Aprovado 08:14 · Desfazer" no mesmo lugar (fundo verde-claro, botões
   trocados por um link), e só recolhe quando o gerente sai da tela. Assim o desfazer fica onde a decisão foi tomada
   e a lista não salta. Animação: só a troca de conteúdo (cross-fade de 150 ms `ease-out`), sem deslizar para o
   lado.

6. **Cabeçalho redundante e chips cortados.** "Bom dia, Rizzi" aparece 2 vezes (H1 e título do balão); os botões
   "Aprovações e registro" e "Ver todas as obras" repetem a sidebar. A faixa de chips sugeridos corta "Quem está em
   campo hoje na Vila Nova?" na borda direita, sem indicar que há mais 2. *Correção:* H1 = "Hoje, quarta 28/10";
   subtítulo = "6 decisões · a mais urgente vence amanhã". Tirar os dois botões do topo. Chips: mostrar só 3 que
   caibam inteiros, ou um fade na borda direita com scroll.

**(c) Redesenho em poucas linhas.** Topo: data + "6 decisões, a 1ª vence amanhã". Logo abaixo, a **fila de
decisões** em largura de leitura (~880 px) como lista densa: `prazo | obra · título · 1 linha de conta | valor |
[Aprovar] [⋯ Ajustar / Ver / Recusar]`. Uma linha expandida por vez mostra a conta completa e a fonte. Depois,
"Também hoje" (Loja Centro adiantada, Sumaré esperando 2 respostas) como 2 linhas de status. O chat desce para uma
barra fixa de uma linha. Sai: título duplicado, linha "sugerido pelo agente", botões do topo, conversas
pré-roteirizadas na primeira dobra.

**(d) Deve ser igual em todo o produto.** O componente "linha de decisão" (prazo, obra, título, conta, valor,
ação primária, menu secundário, estado aprovado-com-desfazer no lugar) é **o mesmo** no Início, em Aprovações, na
aba Pedidos e no WhatsApp desktop. A ordem padrão de qualquer fila é por prazo para decidir.

---

## 2. Aprovações e registro (`#aprovacoes`)

**(a) Tarefa principal.** Esvaziar a fila de propostas de todas as obras e, quando algo der errado, achar no
registro quem fez o quê, de onde veio, e desfazer.

**(b) Problemas**

1. **É o Início de novo, só que mais largo.** As mesmas 6 propostas, o mesmo `itemProp`, agora em linhas de
   ~100 caracteres (line-length 96–101 no detector). O gerente não ganha nada ao vir aqui que já não tinha no
   Início. *Correção:* Aprovações vira a **visão de trabalho em lote**: tabela com seleção (checkbox), filtros por
   obra / tipo / prazo, coluna de valor e "Aprovar selecionados". O Início fica com as 6 do dia; Aprovações com
   todas, inclusive as que o agente gerou por "Transformar em propostas".

2. **Recusar está isolado à direita, a 600 px do Aprovar.** Em cada linha, Aprovar/Ajustar/Ver ficam à esquerda e
   "Recusar" lá na outra ponta. O olho viaja e a ação negativa parece outra coisa. *Correção:* manter juntas,
   na ordem `Aprovar` (primária) · `Ajustar` · `⋯` (Ver, Recusar). Recusar pede motivo curto (3 opções + texto),
   que vai para o registro: é dado para o agente aprender.

3. **A cotação diz "melhor" só pelo preço e tem 3 botões primários iguais.** "Cerâmica Itu Direto · melhor"
   (R$ 1,62, 7 dias) contra Olaria Sumaré (R$ 1,74, 4 dias, frete à parte). Para quem tem alvenaria correndo e
   quebra de 15%, prazo e palete importam. Os 3 "Fechar com este" têm o mesmo peso. *Correção:* trocar "melhor"
   por um critério explícito ("mais barato", "mais rápido", "palete incluso") e a recomendação do agente numa linha
   acima da tabela, com o porquê: "Recomendo a Cerâmica Itu: R$ 683 mais barata, palete incluso; chega 04/11, antes
   de o saldo acabar". Só essa linha recebe a ação primária; as outras ficam com um botão secundário.

4. **O registro é o que dá confiança e está no rodapé, sem filtro.** "Quem fez, quando, de onde veio" é o
   princípio 3 do produto; aqui são 3 linhas no fim da página, sem busca, sem filtro por obra/origem, e o "Desfazer"
   só aparece em linhas desta sessão. *Correção:* dividir a página em duas abas no topo: **Pendentes (7)** e
   **Registro**. No registro: filtros por obra, origem (agente / WhatsApp / tela) e pessoa; data absoluta
   ("27/10 16:40", já está certo); a coluna "Origem" com rótulo + ícone, como hoje.

5. **Título e navegação não batem.** Nav "Aprovações", botão no Início "Aprovações e registro", H1 "Aprovações",
   crumb "tudo o que foi feito fica no registro". *Correção:* um só nome, "Aprovações", com as abas Pendentes /
   Registro / Cotações deixando claro o que mora ali.

**(c) Redesenho em poucas linhas.** Topo: H1 "Aprovações" + abas `Pendentes 7 · Cotações 1 · Registro`. Em
Pendentes, a mesma linha de decisão do Início, agrupada por obra, com checkbox e barra de lote fixa ao selecionar
("3 selecionadas · R$ 8.012 · Aprovar"). Em Cotações, um card por cotação com a recomendação do agente em
destaque e a tabela de respostas abaixo. Registro em tabela filtrável. Sai: Recusar isolado, "melhor" sem critério,
parágrafos de 100 caracteres.

**(d) Deve ser igual em todo o produto.** A linha de decisão (mesma do Início). O padrão de abas de página
(Pendentes / Registro) e o chip de origem `agente | WhatsApp | tela`, que precisa aparecer igual em toda tela que
mostra histórico (Diário, Pedidos, Medições).

---

## 3. Campo · WhatsApp (`#campo`) · desktop e celular 390×844

**(a) Tarefa principal.** *Celular:* a Joana, com a mão suja e no sol, confere o que o agente entendeu do áudio e
confirma em um toque. *Desktop:* o gerente entende, na demo, o que aquele áudio alimentou no sistema.

**(b) Problemas**

1. **Texto e alvos de toque pequenos demais para quem está no canteiro.** No celular, o corpo do chat é 13,5 px
   (`.wa-body`), abaixo dos 15 px que o PRODUCT.md exige para o celular; horário 10,5 px em `--faint` (2,6:1 sobre o
   verde do balão); "Quebra hoje 8%…" em 12,5 px vermelho. Os botões Confirmar/Corrigir têm ~32 px de altura
   (`padding:6px 13px`); o ícone "−" do cabeçalho ~30 px. *Correção (mobile-native):* corpo 16 px / 1,45;
   horário 12 px com contraste 4,5:1; `Confirmar` como botão de largura total, 48 px de altura, e `Corrigir` como
   secundário de 44 px ao lado ou abaixo; todos os alvos com no mínimo 44×44 px. Alto contraste: texto `--ink` puro
   sobre balão branco, sem cinzas abaixo de `#4f5854`.

2. **"Entendi isto" é uma lista de 6 itens que mistura o que será gravado com aviso.** Os itens 1–5 serão gravados;
   o 6 (aço da Gerdau) é só informação, mas está na mesma lista numerada antes de "Posso gravar?". A Joana não
   consegue tirar um item que entendeu errado: é tudo ou "Corrigir". *Correção:* dividir em **"Vou gravar"**
   (4 linhas curtas, cada uma com um valor em negrito e um "x" para remover) e **"Para você saber"** (aço), separado
   abaixo. Encurtar cada linha para "Bloco: −195 (15 quebrados) · saldo 2.565". A quebra acima do previsto vira um
   alerta de 1 linha no topo do balão, não um rodapé vermelho do item 1.

3. **"Corrigir" abre um formulário de 3 colunas no WhatsApp.** O estado de correção tem 3 inputs `type=number` com
   rótulos de 11,5 px quebrando em 2 linhas ("Blocos / assentados") e fonte de 14 px: no iPhone, focar o campo **dá
   zoom na página** (abaixo de 16 px). Contradiz o princípio 5 ("o canteiro não preenche formulário").
   *Correção:* Corrigir pergunta "O que ficou errado?" com 3 chips grandes (Blocos · Quebra · Cimento); tocar abre
   **um** campo de cada vez com `inputmode="numeric"` em 18 px e botões −/+ de 44 px; ou "mande outro áudio" como
   opção de mesmo peso. Inputs sempre ≥ 16 px.

4. **Botão "−" no cabeçalho do WhatsApp para "Registrar saída".** É um controle do app dentro do mock de WhatsApp;
   sem rótulo visível, ninguém descobre que "−" abre a baixa manual. No desktop, a baixa ainda manda "Ou mande um
   áudio… abrir", que na `#campo` leva para a própria `#campo` (fecha o modal e não muda nada). *Correção:* tirar o
   "−" do cabeçalho. No celular, a baixa manual vira uma ação do composer ("+" ao lado da câmera, com rótulo
   "Registrar saída" no menu). No modal de baixa, esconder o link "abrir" quando já se está na `#campo`.

5. **Falta o básico de "parece instalado" (mobile-native).** Sem `viewport-fit=cover` nem `env(safe-area-inset-*)`
   (o composer encosta na home indicator do iPhone); sem `theme-color` (barra de status branca sobre o cabeçalho
   verde-grafite); hovers sem `@media (hover:hover)` (`.btn:hover`, `.chip:hover` ficam presos depois do toque); sem
   `-webkit-tap-highlight-color: transparent` nem `touch-action: manipulation`; `overscroll-behavior` ausente na
   área do chat (puxar para baixo recarrega a página). O "Mensagem" é uma `div`, não um campo. O toast de
   "Gravado… Desfazer" cobre o composer e o microfone. *Correção:* aplicar o baseline da skill mobile-native nesses
   seletores; `.wa-comp` com `padding-bottom: max(8px, env(safe-area-inset-bottom))`; `<meta name="theme-color"
   content="#1c2a27">`; toast acima do composer (`bottom: calc(72px + env(safe-area-inset-bottom))`).

6. **No desktop, o painel ao lado do celular explica mais do que mostra.** O painel tem 3 caixas empilhadas (nota do
   agente em verde, "O que esta conversa alimenta", nota de validação), deixando ~250 px vazios à direita, e
   "O que esta conversa alimenta" só muda um pill quando a Joana confirma. É o momento "uau" da demo e passa
   despercebido. *Correção:* o painel vira um **antes → depois ao vivo**: 4 linhas (Almoxarifado, RDO, Atraso,
   Avanço) com o valor atual e, ao Confirmar, o valor novo (2.760 → 2.565), a hora e um "abrir". A nota "Sem
   formulário" sai do painel e vira o subtítulo da página (1 linha).

**(c) Redesenho em poucas linhas.** *Celular:* cabeçalho verde com safe-area; conversa em 16 px; o balão
"Entendi" vira um cartão de confirmação com "Vou gravar" (4 linhas removíveis) + "Para você saber" + botão
`Confirmar e gravar` de largura total; composer com `+` (registrar saída), câmera e microfone de 48 px; toast acima
do composer. *Desktop:* celular à esquerda; à direita, o "efeito no sistema" ao vivo (antes → depois) e,
abaixo, a nota de validação. Sai: o "−" do cabeçalho, a nota "Sem formulário" em caixa, o formulário de 3 colunas.

**(d) Deve ser igual em todo o produto.** Alvo de toque mínimo de 44 px e inputs ≥ 16 px em tudo que roda no
celular (inclusive os modais abertos a partir da `#campo`). O cartão "o agente entendeu → vou gravar → confirmar"
é o mesmo padrão da linha de decisão do escritório, só que em versão de toque.

---

## 4. Modais do agente

### 4.1 Pedido de compra (`openCheckout(['cim'])`)

**(a) Tarefa.** Confirmar a quantidade e o fornecedor que o agente sugeriu e gerar o pedido dentro da alçada.

**(b) Problemas**
1. **A conta, que é o argumento do agente, está em 12,5 px cinza embaixo da linha**, e o resultado (14 sc) fica
   num input enquanto a falta (34 sc) aparece no texto. Não fica claro que 34 − 20 de transferência = 14.
   *Correção:* a conta vira uma linha de "recibo" acima do input, em números tabulares e 14 px: `precisa 200 −
   saldo 46 − a caminho 120 = falta 34 − transferência 20 = **comprar 14**`, com a fonte em 1 linha abaixo.
2. **O select de fornecedor corta o preço** ("Depósito São Bento · R$" truncado a 190 px) e esconde a comparação.
   *Correção:* trocar o select por 2–3 opções em rádio (nome · R$/sc · prazo), com a sugerida marcada e o porquê.
3. **"Quem está pedindo" e "Regime da obra" são selects editáveis**, mas são fatos (quem está logado; o regime da
   obra). Mudar o regime num pedido não faz sentido. *Correção:* mostrar como texto; deixar o seletor só na demo,
   atrás de "simular outro usuário".
4. **Cards dentro do modal** (Entrega e Pagamento com fundo e borda; Alçada em caixa verde) = nested-cards.
   *Correção:* Entrega e Pagamento como 2 linhas `rótulo: valor` sem caixa; Alçada como uma linha com ícone ao lado
   do botão primário ("Dentro da sua alçada · gera o pedido direto").
5. **"Pedir cotação a 5 fornecedores" tem o mesmo peso do Cancelar**, à esquerda. É um caminho alternativo
   importante (cotação assíncrona). *Correção:* manter à esquerda, mas como link-botão com o tempo esperado:
   "Cotar com 5 fornecedores (respostas em 1–3 h)".

### 4.2 Conferência de NF (`openConferencia('PED-0157')`)

**(a) Tarefa.** Decidir se aceita a entrega como está ou registra a falta e abate do boleto.

**(b) Problemas**
1. **Três botões no rodapé, dois deles "concluir".** "Aceitar e dar entrada" e "Registrar divergência e abater do
   boleto" competem; a ação certa (abater) é o texto mais longo do modal. *Correção:* uma ação primária curta,
   "Abater R$ 472 e dar entrada"; "Aceitar sem abater" vira secundária; Cancelar como "×" no topo.
2. **No celular, a ação primária fica abaixo da dobra e o Cancelar vem primeiro.** A 390×844 os botões empilham
   na ordem `Cancelar`, `Aceitar`, e o botão âmbar só aparece rolando. É justamente onde a Joana confere.
   *Correção:* rodapé fixo (sticky) com a primária em cima e largura total; o modal vira bottom sheet no celular.
3. **A tabela de 5 colunas para 1 item espreme no celular** ("Na NF" e "Areia média" quebram em 2 linhas, input de
   58 px). *Correção:* para 1 item, trocar a tabela por 3 números grandes lado a lado: `NF 40 · recebido [36] ·
   falta 4 m³`; tabela só quando houver 2+ itens.
4. **O alerta vermelho de "Faltam 4 m³" é um card** (`alertnote` dentro do modal) em vermelho para algo que é uma
   ação proposta, não um erro. *Correção:* tom âmbar (decisão pendente), sem caixa, colado ao número da diferença.

### 4.3 Baixa (`openBaixa('bloco')`)

**(a) Tarefa.** Registrar uma saída em 3 toques: item, quantidade, frente.

**(b) Problemas**
1. **Está bom no conceito (3 passos numerados, últimos valores lembrados)**, mas os chips de item têm o saldo em
   11,5 px e a frente "obrigatório · item curva A" é um pill âmbar que parece aviso. *Correção:* saldo 13 px;
   "obrigatório" como texto simples após o rótulo.
2. **A quantidade não tem −/+ e o saldo novo não aparece.** *Correção:* stepper de 44 px ao lado do input e a
   linha "saldo 2.760 → 2.565" atualizando enquanto digita (mesma linguagem do WhatsApp).
3. **No celular é um modal centrado com 94vh**, Cancelar e Registrar no fim. *Correção:* bottom sheet com o botão
   primário fixo no rodapé, largura total.
4. **Link "Ou mande um áudio… abrir" na `#campo` leva para a própria `#campo`.** *Correção:* esconder quando a
   rota já é `campo`.

**(c) Redesenho dos modais em poucas linhas.** Todos seguem o mesmo esqueleto: título com o objeto
("Pedido · Cimento CP-II · 14 sc"), **a conta do agente em linha de recibo**, o campo editável, os fatos em linhas
`rótulo: valor`, e um rodapé com **uma** ação primária que diz o efeito ("Gerar pedido de R$ 516,60", "Abater
R$ 472 e dar entrada", "Registrar saída de 195 un"). No celular, todos viram bottom sheet com rodapé fixo.

**(d) Deve ser igual em todo o produto.** Rodapé de modal: primária à direita no desktop / em cima no celular,
com verbo + efeito; secundárias como botão neutro; cancelar como "×" + Esc. Zero cards dentro de modal.

---

## Padrões globais propostos

**Tipografia**
- Escala fixa de 5 tamanhos no desktop: 12 (só meta e horário, nunca corpo) · 13,5 (corpo de tabela e listas) ·
  15 (texto do agente) · 18 (títulos de seção e de modal) · 26 (H1). No celular: 13 · 16 · 18 · 22. Acabar com
  11,5 px e 10,5 px (47 tiny-text no diagnóstico global).
- Todos os números de dinheiro, quantidade e data em `font-variant-numeric: tabular-nums`, inclusive dentro de
  parágrafos do agente (hoje só `.num` em tabela tem).
- Texto corrido do agente com `max-width: 68ch` e `text-wrap: pretty` (resolve line-length e straggler).
- Bricolage só em H1, títulos de seção e de modal; Inter no resto (aceitável numa ferramenta de trabalho; o
  "overused-font" não é prioridade aqui).

**Cor**
- Ocre `--accent` = **uma** ação primária por bloco. Hoje cada linha de fila tem um botão ocre, e 6 ocres
  empilhados viram ruído. Na lista, a primária ocre só aparece na linha em foco/hover; nas outras, Aprovar é
  secundário com ícone de check.
- Verde-grafite `--pine` = superfície do agente e do WhatsApp (balão, cabeçalho), nunca botão primário fora do
  WhatsApp. No WhatsApp, o pine pode continuar como primário, porque ali é a linguagem do canal.
- Semântica fixa: vermelho só para erro ou perda já ocorrida; âmbar para decisão pendente; verde para feito.
  Hoje a divergência da NF (decisão) está em vermelho.
- `--muted` subir para ~`#59625e` (≥ 4,5:1 sobre `--bg` e `--cream2`); `--faint` proibido para texto que se
  precisa ler (só para divisores e ícones desativados).

**Espaçamento**
- Grade de 4 px; ritmo vertical de lista: linha de decisão de 56 px fechada / auto aberta; 24 px entre seções;
  32 px entre a fila e o resto.
- Largura de leitura de 880 px para Início e filas; tabelas podem ir à largura total.

**Componentes a globalizar**
- **Linha de decisão** (`prazo | obra · título · conta | valor | Aprovar · ⋯`), com estado
  "aprovado HH:MM · Desfazer" **no lugar**. Usada no Início, Aprovações, Pedidos e (versão de toque) WhatsApp.
- **Linha de conta (recibo)**: `precisa − saldo − a caminho = falta` sempre na mesma forma e no mesmo tamanho,
  com a fonte em 1 linha abaixo. É o princípio 2 do produto virando componente.
- **Chip de origem** `agente | WhatsApp | tela` + quem + hora, igual em todo histórico.
- **Modal / bottom sheet** com o esqueleto da seção 4 e rodapé "verbo + efeito".
- **Sem card dentro de card**: dentro de um card, separar com divisores e espaço; caixas coloridas só para um
  único alerta por tela.
- Remover a faixa lateral de 3 px do `.nav.on` (side-tab): item ativo só com fundo + ícone ocre.

**Movimento** (Emil: animar só o que explica mudança de estado; nada em ação repetida 50 vezes por dia)
- Aprovar: cross-fade de 150 ms `ease-out` da linha para o estado aprovado; **sem** deslize lateral e sem a lista
  pular. Recolher a linha (altura → 0, 200 ms) só ao sair da tela.
- Modal: entrada 180 ms (`opacity 0 → 1`, `scale .97 → 1`, `ease-out`), saída 120 ms; bottom sheet no celular
  sobe 240 ms com a mesma curva. Hoje abre e fecha seco (`display:none → grid`).
- Toast: sobe 8 px + fade em 160 ms; com "Desfazer" fica 6 s e pausa no hover.
- Botões: `transform: scale(.97)` em `:active` (100 ms), principalmente no WhatsApp, onde não há hover.
- No WhatsApp: a mensagem nova do agente entra com fade + 4 px (180 ms); o contador "antes → depois" do painel
  desktop pode trocar o número com um cross-fade curto. Nada de animação no briefing ao carregar.
- Manter o `prefers-reduced-motion` global que já existe; hovers sempre dentro de `@media (hover:hover)`.
