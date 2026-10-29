# Diagnóstico global · detector do Impeccable (29/10/2026)

`npx impeccable detect` em 14 rotas a 1440×900 e em `#campo` a 390×844, mais as fontes (css/js/html).

| Regra | Achados | O que é | Onde |
|---|---|---|---|
| low-contrast | 115 | texto abaixo de 4,5:1 | sidebar: #7d8e88 sobre #1c2a27 (4,3:1) e sobre #2e423d (3,1:1); --muted #626c68 sobre o concreto e o cream2 (4,0–4,48:1); --faint #8d9692 (2,5:1) |
| tiny-text | 47 | corpo com 11–11,5 px | pills, legendas, meta dos cartões, faixa de protótipo |
| undersized-ui-text | 46 | texto de controle pequeno demais | botões .sm, chips, abas |
| nested-cards | 29 | cartão dentro de cartão | briefing, Kanban, diário, medição, modais |
| side-tab | 16 | faixa de 3 px na lateral (cara de IA) | .nav.on, .kc.late, .g-day.on |
| overused-font | 16 | Inter em 81–98% do texto | global |
| cream-palette | 16 | fundo bege "seguro" | --bg #ebe9e3 |
| skipped-heading | 9 | pula nível de título | várias abas |
| line-length | 6 | linha longa demais | callouts e textos do agente |
| straggler | 4 | palavra sozinha na última linha | títulos |
| icon-tile-stack | 1 | ícone em quadrado em cima do título | #gate |
| first-viewport-column-overflow | 1 | coluna estourando na 1ª dobra | ver relatório da rota |

Relatórios brutos por rota: /tmp/cant/imp/*.txt (não versionados).
Para rodar de novo: `IMPECCABLE_BROWSER=".../Google Chrome for Testing" npx impeccable detect --viewport 1440x900 "http://localhost:4321/index.html#<rota>"`.
