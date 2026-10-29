/* ===================== DADOS FICTÍCIOS (coerentes entre telas) =====================
   Os nomes globais (INV, LOTES, ORC, COMP, FASES, MOV, EQUIPE...) são da Casa Vila Nova.
   Tela por obra usa dados(o.id), que devolve os arrays da obra pedida. */
const brl = v => 'R$ ' + v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});
const brl2 = v => 'R$ ' + v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const num = v => v.toLocaleString('pt-BR');

const OBRAS = [
  {id:'vila-nova', nome:'Casa Vila Nova', tipo:'Residencial · 180 m² · 2 pav.', local:'Campinas · SP', cor:'#e09a2b', mestre:'Joana M.', regime:'empreitada',
   budget:620000, previsto:648300, comprometido:286400, gasto:241850, fase:'Estrutura', progresso:38,
   inicio:'03/03/2026', prazo:'30/06/2027', previsao:'21/07/2027', atraso:21, status:'risco'},
  {id:'loja-centro', nome:'Reforma Loja Centro', tipo:'Comercial · 95 m²', local:'Valinhos · SP', cor:'#3f6f9a', mestre:'Ana P.', regime:'administracao',
   budget:145000, previsto:139200, comprometido:118000, gasto:104300, fase:'Acabamento', progresso:81,
   inicio:'10/07/2026', prazo:'15/12/2026', previsao:'09/12/2026', atraso:-6, status:'ok'},
  {id:'galpao', nome:'Galpão Sumaré', tipo:'Industrial · 1.200 m²', local:'Sumaré · SP', cor:'#7a64b0', mestre:'—', regime:'empreitada',
   budget:2400000, previsto:null, comprometido:0, gasto:0, fase:'Em orçamento', progresso:0,
   inicio:'—', prazo:'—', previsao:'—', atraso:0, status:'plan'},
];
const NOME_OBRA = {'vila-nova':'Casa Vila Nova','loja-centro':'Reforma Loja Centro','galpao':'Galpão Sumaré'};
/* "6 dias adiantada" / "21 dias de atraso previsto" / "Em orçamento" */
const prazoTxt = o => o.status==='plan' ? 'Em orçamento' : o.atraso>0 ? `${o.atraso} dias de atraso previsto` : o.atraso<0 ? `${-o.atraso} dias adiantada` : 'No prazo';

/* ===================== CASA VILA NOVA ===================== */
const FASES = [
  {n:'Serviços preliminares', ini:0,  fim:6,  real:[0,6],   pct:100},
  {n:'Fundação',             ini:5,  fim:16, real:[5,17],  pct:100},
  {n:'Estrutura',            ini:15, fim:30, real:[16,34], pct:62},
  {n:'Alvenaria e reboco',   ini:26, fim:40, real:[32,46], pct:6},
  {n:'Cobertura',            ini:36, fim:44, real:[40,48], pct:0},
  {n:'Instalações (elét./hidr.)', ini:38, fim:54, real:[44,57], pct:0},
  {n:'Acabamento',           ini:48, fim:64, real:[51,67], pct:0},
  {n:'Limpeza e entrega',    ini:63, fim:69, real:[66,72], pct:0},
]; // semanas desde 03/03/2026; hoje = semana 34

/* Orçamento por etapa: soma prev = 620.000 · soma real (projeção) = 648.300 (+28.300, +4,6%).
   Mão de obra = empreitadas por etapa (EMPREITADAS) + administração própria (ADM). */
const ORC = [
  {cat:'Serviços preliminares e canteiro', tipo:'material', prev:10000, real:10000},
  {cat:'Fundação · material', tipo:'material', prev:30000, real:31400},
  {cat:'Fundação · empreitada (Equipe Ramos)', tipo:'empreitada', prev:26500, real:26500},
  {cat:'Estrutura · concreto usinado, aço cortado e dobrado, formas', tipo:'material', prev:72000, real:81400},
  {cat:'Estrutura · empreitada (Equipe Silva)', tipo:'empreitada', prev:58000, real:58000},
  {cat:'Alvenaria e reboco · bloco, cimento, areia', tipo:'material', prev:34000, real:39200},
  {cat:'Alvenaria e reboco · empreitada (Equipe Silva)', tipo:'empreitada', prev:46000, real:46000},
  {cat:'Cobertura · madeira e telha', tipo:'material', prev:28000, real:28000},
  {cat:'Cobertura · empreitada (Carlos A.)', tipo:'empreitada', prev:16000, real:16000},
  {cat:'Instalações elétricas e hidráulicas · material', tipo:'material', prev:30000, real:32200},
  {cat:'Elétrica · empreitada (Paulo R.)', tipo:'empreitada', prev:18000, real:18000},
  {cat:'Hidráulica · empreitada (a contratar)', tipo:'empreitada', prev:14000, real:14000},
  {cat:'Esquadrias e ferragens', tipo:'material', prev:30000, real:31100},
  {cat:'Acabamento · material', tipo:'material', prev:59180, real:63080},
  {cat:'Acabamento · assentamento (a contratar)', tipo:'empreitada', prev:32000, real:32000},
  {cat:'Administração própria (mestre 50% + ajudante)', tipo:'administracao', prev:116320, real:121420},
]; // administração: R$ 7.270/mês × 16 meses; projeção soma ~0,7 mês pelos 21 dias de atraso (+R$ 5.100)

const EMPREITADAS = [
  {etapa:'Fundação', equipe:'Equipe Ramos', valor:26500, exec:100, pago:100, status:'encerrada 30/06'},
  {etapa:'Estrutura (formas, armação, concretagem)', equipe:'Equipe Silva', valor:58000, exec:62, pago:75, status:'em andamento', obs:'R$ 7.540 pagos acima do executado'},
  {etapa:'Alvenaria e reboco', equipe:'Equipe Silva', valor:46000, exec:6, pago:10, status:'em andamento'},
  {etapa:'Elétrica', equipe:'Paulo R.', valor:18000, exec:0, pago:0, status:'começa 04/11'},
  {etapa:'Cobertura (carpintaria)', equipe:'Carlos A.', valor:16000, exec:0, pago:0, status:'contratada'},
  {etapa:'Hidráulica', equipe:'a contratar', valor:14000, exec:0, pago:0, status:'orçado'},
  {etapa:'Acabamento / assentamento', equipe:'a contratar', valor:32000, exec:0, pago:0, status:'orçado'},
];
const ADM = {
  itens:[
    {n:'Joana M.', f:'Mestre de obras · 50% nesta obra', mes:3750},
    {n:'Ajudante', f:'Servente · R$ 160/dia', mes:3520},
  ],
  mes:7270, obs:'Não há almoxarife: quem recebe e confere material é a Joana (mestre).'
};

/* Insumos (lista gerada do projeto). qtd = quantidade da obra inteira; o que falta comprar sai do almoxarifado. */
const COMP = [
  {id:'concreto', nome:'Concreto usinado fck 25', espec:'25 MPa · com bomba lança', un:'m³', qtd:100, fase:'Fundação / Estrutura',
   forn:[{n:'Concrecamp',cid:'Campinas',p:485,prazo:'agendar 48 h',nota:4.6},{n:'Supermix',cid:'Campinas',p:498,prazo:'agendar 48 h',nota:4.5},{n:'Polimix',cid:'Hortolândia',p:512,prazo:'agendar 72 h',nota:4.4}]},
  {id:'aco', nome:'Aço CA-50 cortado e dobrado', un:'kg', qtd:8600, fase:'Fundação / Estrutura',
   forn:[{n:'Gerdau Distribuidor Hortolândia',cid:'Hortolândia',p:7.90,prazo:'5 dias',nota:4.5},{n:'Aço Forte Comercial',cid:'Campinas',p:8.40,prazo:'2 dias',nota:4.1},{n:'Armafer Campinas',cid:'Campinas',p:8.15,prazo:'4 dias',nota:4.3}]},
  {id:'bloco', nome:'Bloco cerâmico 14×19×29', un:'un', qtd:14440, fase:'Alvenaria',
   forn:[{n:'Cerâmica Itu Direto',cid:'Itu',p:1.62,prazo:'7 dias',nota:4.2},{n:'Depósito São Bento',cid:'Campinas',p:1.89,prazo:'2 dias',nota:4.6},{n:'Olaria Sumaré',cid:'Sumaré',p:1.74,prazo:'4 dias',nota:4.0}]},
  {id:'cim', nome:'Cimento CP-II 50 kg', espec:'CP-II-E-32 · argamassa', un:'sc', qtd:474, fase:'Alvenaria / Reboco',
   forn:[{n:'Depósito São Bento',cid:'Campinas',p:36.90,prazo:'2 dias',nota:4.6},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:38.49,prazo:'3 dias',nota:4.3},{n:'Casa do Construtor Sousas',cid:'Campinas',p:39.80,prazo:'1 dia',nota:4.8}]},
  {id:'areia', nome:'Areia média', espec:'lavada', un:'m³', qtd:95, fase:'Alvenaria / Reboco',
   forn:[{n:'Porto de Areia Jaguari',cid:'Paulínia',p:118,prazo:'1 dia',nota:4.4},{n:'Depósito São Bento',cid:'Campinas',p:135,prazo:'1 dia',nota:4.6}]},
  {id:'brita', nome:'Brita 1', un:'m³', qtd:32, fase:'Contrapiso',
   forn:[{n:'Pedreira Basalto Campinas',cid:'Campinas',p:112,prazo:'1 dia',nota:4.5},{n:'Depósito São Bento',cid:'Campinas',p:129,prazo:'1 dia',nota:4.6}]},
  {id:'paraf', nome:'Parafuso 5/16" × 2"', espec:'sextavado, zincado', un:'un', qtd:1380, fase:'Esquadrias / Cobertura',
   forn:[{n:'Ciser Distribuidor',cid:'Campinas',p:0.42,prazo:'3 dias',nota:4.7},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:0.59,prazo:'1 dia',nota:4.3},{n:'Ferragens Paulista',cid:'Valinhos',p:0.48,prazo:'2 dias',nota:4.5}]},
  {id:'telha', nome:'Telha cerâmica portuguesa', un:'un', qtd:3900, fase:'Cobertura',
   forn:[{n:'Telhas Tatuí',cid:'Tatuí',p:2.35,prazo:'10 dias',nota:4.3},{n:'Telhanorte Barão',cid:'Campinas',p:2.98,prazo:'3 dias',nota:4.4}]},
  {id:'fio', nome:'Cabo flexível 2,5 mm²', espec:'rolo de 100 m', un:'rolo', qtd:22, fase:'Instalações',
   forn:[{n:'Elétrica Central',cid:'Campinas',p:189,prazo:'2 dias',nota:4.6},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:214,prazo:'1 dia',nota:4.3}]},
];

/* Pedidos. col: 0 Em cotação · 1 Aprovado · 2 Pedido enviado · 3 Em trânsito · 4 Recebido.
   conf:true = conferido e já lançado no almoxarifado. inv/qn ligam o pedido ao item do almoxarifado. */
const KCOLS = ['Em cotação','Aprovado','Pedido enviado','Em trânsito','Recebido'];
const LOTES = [
  {id:'PED-0141', inv:'cim', qn:200, un:'sc', item:'Cimento CP-II 50 kg', q:'200 sc', forn:'Depósito São Bento', v:7380, eta:'conferido 12/09', col:4, conf:true},
  {id:'PED-0144', inv:'aco', qn:2900, un:'kg', item:'Aço CA-50 cortado e dobrado', q:'2.900 kg', forn:'Gerdau Hortolândia', v:22910, eta:'conferido 18/09', col:4, conf:true},
  {id:'PED-0149', inv:'bloco', qn:4000, un:'un', item:'Bloco cerâmico 14×19×29', q:'4.000 un', forn:'Cerâmica Itu', v:6480, eta:'conferido 20/10 · veio sem palete', col:4, conf:true},
  {id:'PED-0150', inv:'paraf', qn:1000, un:'un', item:'Parafuso 5/16" × 2"', q:'1.000 un', forn:'Ciser Distribuidor', v:420, eta:'conferido 02/10', col:4, conf:true},
  {id:'PED-0157', inv:'areia', qn:40, un:'m³', item:'Areia média', q:'40 m³ na NF', forn:'Porto Jaguari', v:4720, eta:'chegou hoje · 36 m³ medidos na caçamba', col:4, conf:false, medido:36},
  {id:'PED-0158', inv:'aco', qn:3200, un:'kg', item:'Aço CA-50 cortado e dobrado', q:'3.200 kg', forn:'Gerdau Hortolândia', v:25280, eta:'previsto 19/10 · 9 dias atrasado, sem data', col:3, late:true},
  {id:'PED-0160', inv:'cim', qn:120, un:'sc', item:'Cimento CP-II 50 kg', q:'120 sc', forn:'Depósito São Bento', v:4428, eta:'chega 30/10', col:3},
  {id:'PED-0162', inv:'bloco', qn:9000, un:'un', item:'Bloco cerâmico 14×19×29', q:'9.000 un', forn:'Cerâmica Itu', v:14580, eta:'saída 31/10', col:2, palete:false},
  {id:'PED-0166', inv:'concreto', qn:38, un:'m³', item:'Concreto usinado fck 25', q:'38 m³', forn:'Concrecamp', v:19830, eta:'concretagem qui 05/11 07h', col:1},
  {id:'PED-0163', inv:'telha', qn:3900, un:'un', item:'Telha cerâmica portuguesa', q:'3.900 un', forn:'Telhas Tatuí', v:9165, eta:'cotado · aguarda sua aprovação', col:0},
  {id:'PED-0164', inv:'fio', qn:22, un:'rolo', item:'Cabo flexível 2,5 mm²', q:'22 rolos', forn:'Elétrica Central', v:4158, eta:'cotação com 3 fornecedores', col:0},
  {id:'PED-0165', inv:'paraf', qn:80, un:'un', item:'Parafuso 5/16" × 2"', q:'80 un', forn:'Ciser Distribuidor', v:34, eta:'o que a transferência não cobre', col:0, ai:true},
  {id:'PED-0167', inv:'aco', qn:600, un:'kg', item:'Aço CA-50 cortado e dobrado', q:'600 kg', forn:'Aço Forte Comercial', v:5040, eta:'plano B · entrega em 2 dias', col:0, ai:true},
];

/* Almoxarifado. saldo = ent − sai · falta = nec − saldo − a caminho (a caminho sai dos pedidos).
   abc: só itens A têm baixa com destino; C é controlado por contagem semanal. */
const INV = [
  {id:'aco', nome:'Aço CA-50 cortado e dobrado', un:'kg', abc:'A', ent:4800, sai:4660, nec:3940, cob:'até ~30/10', st:'bad'},
  {id:'concreto', nome:'Concreto usinado fck 25', un:'m³', abc:'A', ent:62, sai:62, nec:38, cob:'entregue no dia', st:'ok', obs:'programado por concretagem'},
  {id:'bloco', nome:'Bloco cerâmico 14×19×29', un:'un', abc:'A', ent:4000, sai:1240, nec:13200, cob:'≈ 12 dias', st:'warn', quebra:{real:15, prev:5}},
  {id:'cim', nome:'Cimento CP-II 50 kg', un:'sc', abc:'A', ent:320, sai:274, nec:200, cob:'≈ 6 dias', st:'warn'},
  {id:'areia', nome:'Areia média', un:'m³', abc:'B', ent:56, sai:31, nec:64, cob:'≈ 9 dias', st:'ok'},
  {id:'brita', nome:'Brita 1', un:'m³', abc:'B', ent:32, sai:21, nec:10, cob:'> 30 dias', st:'ok'},
  {id:'paraf', nome:'Parafuso 5/16" × 2"', un:'un', abc:'C', ent:1000, sai:900, nec:480, cob:'≈ 8 dias', st:'bad', contagem:'26/10'},
  {id:'prego', nome:'Prego 18×27', un:'kg', abc:'C', ent:60, sai:22, nec:20, cob:'> 30 dias', st:'ok', contagem:'26/10'},
];
const MOV = {
  bloco:[
    {d:'20/10', t:'Entrada', q:+4000, onde:'Recebimento PED-0149 · Cerâmica Itu · descarregado sem palete', quem:'Joana M. (mestre)'},
    {d:'20/10', t:'Quebra', q:-110, onde:'Quebra na descarga (sem palete)', quem:'Joana M. (mestre)'},
    {d:'21/10', t:'Saída', q:-320, onde:'Alvenaria do térreo · eixo A', quem:'Equipe Silva'},
    {d:'23/10', t:'Saída', q:-380, onde:'Alvenaria do térreo · eixos A–B', quem:'Equipe Silva'},
    {d:'26/10', t:'Saída', q:-350, onde:'Alvenaria do térreo · eixos B–C', quem:'Equipe Silva'},
    {d:'27/10', t:'Quebra', q:-80, onde:'Quebra no manuseio (pilha no chão)', quem:'Joana M. (mestre)'},
  ],
  cim:[
    {d:'20/08', t:'Entrada', q:+120, onde:'Recebimento PED-0133 · Depósito São Bento', quem:'Joana M. (mestre)'},
    {d:'25/08', t:'Saída', q:-60, onde:'Argamassa · embasamento do baldrame', quem:'Equipe Ramos'},
    {d:'12/09', t:'Entrada', q:+200, onde:'Recebimento PED-0141 · Depósito São Bento', quem:'Joana M. (mestre)'},
    {d:'15/09', t:'Saída', q:-90, onde:'Regularização da laje do térreo', quem:'Equipe Silva'},
    {d:'30/09', t:'Saída', q:-72, onde:'Chapisco e embutidos da estrutura', quem:'Equipe Silva'},
    {d:'21/10', t:'Saída', q:-22, onde:'Argamassa · alvenaria do térreo, eixo A', quem:'Equipe Silva'},
    {d:'23/10', t:'Saída', q:-12, onde:'Argamassa · alvenaria do térreo, eixos A–B', quem:'Equipe Silva'},
    {d:'26/10', t:'Saída', q:-10, onde:'Argamassa · alvenaria do térreo, eixos B–C', quem:'Equipe Silva'},
    {d:'27/10', t:'Saída', q:-8, onde:'Argamassa · alvenaria do térreo, eixo C', quem:'Joana M. (WhatsApp)'},
  ],
  aco:[
    {d:'12/08', t:'Entrada', q:+1900, onde:'Recebimento PED-0128 · Gerdau · cortado e dobrado', quem:'Joana M. (mestre)'},
    {d:'14/08', t:'Saída', q:-1900, onde:'Armação de sapatas e baldrames', quem:'Equipe Ramos'},
    {d:'18/09', t:'Entrada', q:+2900, onde:'Recebimento PED-0144 · Gerdau · cortado e dobrado', quem:'Joana M. (mestre)'},
    {d:'22/09', t:'Saída', q:-1560, onde:'Pilares e vigas do térreo', quem:'Equipe Silva'},
    {d:'20/10', t:'Saída', q:-1200, onde:'Laje do 2º pav. · armação (em curso)', quem:'Equipe Silva'},
  ],
  concreto:[
    {d:'10/06', t:'Entrada', q:+24, onde:'Concretagem da fundação · Concrecamp', quem:'Joana M. (mestre)'},
    {d:'10/06', t:'Saída', q:-24, onde:'Sapatas e baldrames (aplicado no dia)', quem:'Equipe Ramos'},
    {d:'24/09', t:'Entrada', q:+38, onde:'Concretagem da laje do térreo · Concrecamp', quem:'Joana M. (mestre)'},
    {d:'24/09', t:'Saída', q:-38, onde:'Laje do térreo (aplicado no dia)', quem:'Equipe Silva'},
  ],
  paraf:[
    {d:'02/10', t:'Entrada', q:+1000, onde:'Recebimento PED-0150 (Ciser)', quem:'Joana M. (mestre)'},
    {d:'12/10', t:'Contagem', q:-420, onde:'Contagem semanal: 580 na caixa', quem:'Joana M. (mestre)'},
    {d:'19/10', t:'Contagem', q:-260, onde:'Contagem semanal: 320 na caixa', quem:'Joana M. (mestre)'},
    {d:'26/10', t:'Contagem', q:-220, onde:'Contagem semanal: 100 na caixa', quem:'Joana M. (mestre)'},
  ],
  prego:[
    {d:'05/09', t:'Entrada', q:+60, onde:'Recebimento PED-0139 · Ferragens Paulista', quem:'Joana M. (mestre)'},
    {d:'26/10', t:'Contagem', q:-22, onde:'Contagem semanal: 38 kg', quem:'Joana M. (mestre)'},
  ],
};
const MOV_PARAF = MOV.paraf;

/* Equipe. Sem almoxarife: a mestre recebe e confere. */
const EQUIPE = {
  cols:['Vaga aberta','Em mobilização','Em campo','Desmobilizado'],
  ppl:[
    {n:'Vaga: Armador', f:'Estrutura · Equipe Silva', c:'—', col:0, alert:true, nota:'aberta desde 01/10'},
    {n:'Vaga: Armador', f:'Estrutura · Equipe Silva', c:'—', col:0, alert:true, nota:'aberta desde 01/10'},
    {n:'Paulo R.', f:'Eletricista · empreitada', c:'R$ 18.000 global', col:1, nota:'começa 04/11'},
    {n:'Joana M.', f:'Mestre de obras · 50% aqui', c:'R$ 3.750/mês', col:2},
    {n:'Equipe Silva (4)', f:'3 pedreiros + 1 meio-oficial · empreitada', c:'R$ 104.000 em 2 contratos', col:2},
    {n:'Carlos A.', f:'Carpinteiro · formas da laje', c:'R$ 16.000 global (cobertura)', col:2},
    {n:'Ajudante', f:'Servente', c:'R$ 160/dia', col:2},
    {n:'Equipe Ramos (5)', f:'Fundação · empreitada', c:'R$ 26.500 global', col:3, nota:'saiu 30/06'},
  ]
};
const EFETIVO_HOJE = {data:'28/10', total:7, itens:[['Joana M.','mestre',1],['Equipe Silva','3 pedreiros + 1 meio-oficial',4],['Carlos A.','carpinteiro · formas da laje',1],['Ajudante','servente',1]],
  clima:'Manhã de sol; chuva forte das 15h às 17h parou a alvenaria por 2 h', previsao:'Chuva 80% na quinta 05/11'};

/* ===================== REFORMA LOJA CENTRO ===================== */
const ORC_LC = [
  {cat:'Demolição e retirada', tipo:'empreitada', prev:9000, real:8400},
  {cat:'Instalações elétricas', tipo:'material', prev:22000, real:21300},
  {cat:'Hidráulica e ar-condicionado', tipo:'material', prev:18000, real:18900},
  {cat:'Drywall e forro', tipo:'empreitada', prev:21000, real:19600},
  {cat:'Piso porcelanato 60×60 (material + assentamento)', tipo:'material', prev:34000, real:32100},
  {cat:'Pintura', tipo:'empreitada', prev:12000, real:11400},
  {cat:'Fachada e vitrine', tipo:'material', prev:19000, real:18700},
  {cat:'Administração própria (Ana P., mestre)', tipo:'administracao', prev:10000, real:8800},
]; // 145.000 → 139.200
const FASES_LC = [
  {n:'Demolição e retirada', ini:0, fim:2, real:[0,2], pct:100},
  {n:'Instalações', ini:2, fim:8, real:[2,7], pct:100},
  {n:'Drywall e forro', ini:5, fim:11, real:[5,10], pct:100},
  {n:'Piso porcelanato', ini:9, fim:14, real:[9,13], pct:100},
  {n:'Pintura', ini:12, fim:18, real:[11,17], pct:70},
  {n:'Fachada e vitrine', ini:14, fim:20, real:[13,19], pct:55},
  {n:'Limpeza e entrega', ini:21, fim:23, real:[20,22], pct:0},
]; // semanas desde 10/07/2026; hoje = semana 16
const COMP_LC = [
  {id:'lc-rejunte', inv:'rejunte', nome:'Rejunte acrílico 1 kg (cinza platina)', un:'un', qtd:45, fase:'Piso',
   forn:[{n:'Ferragens Paulista',cid:'Valinhos',p:24.90,prazo:'1 dia',nota:4.5},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:27.40,prazo:'1 dia',nota:4.3}]},
  {id:'lc-arg', inv:'arg', nome:'Argamassa AC-III 20 kg', un:'sc', qtd:100, fase:'Piso / Fachada',
   forn:[{n:'Depósito Valinhos',cid:'Valinhos',p:38.50,prazo:'1 dia',nota:4.4},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:41.90,prazo:'2 dias',nota:4.3}]},
  {id:'lc-tinta', inv:'tinta', nome:'Tinta acrílica fosca 18 L (branco gelo)', un:'lata', qtd:14, fase:'Pintura',
   forn:[{n:'Tintas Valinhos',cid:'Valinhos',p:389,prazo:'1 dia',nota:4.6},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:412,prazo:'2 dias',nota:4.3}]},
  {id:'lc-led', inv:'led', nome:'Luminária LED de embutir 18 W', un:'un', qtd:24, fase:'Instalações',
   forn:[{n:'Elétrica Central',cid:'Campinas',p:62,prazo:'2 dias',nota:4.6},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:71,prazo:'1 dia',nota:4.3}]},
];
const LOTES_LC = [
  {id:'PED-0109', inv:'porc', qn:240, un:'m²', item:'Porcelanato 60×60 retificado', q:'240 m²', forn:'Portobello Shop Valinhos', v:21600, eta:'conferido 24/10', col:4, conf:true},
  {id:'PED-0110', inv:'tinta', qn:8, un:'lata', item:'Tinta acrílica fosca 18 L', q:'8 latas', forn:'Tintas Valinhos', v:3112, eta:'conferido 20/10', col:4, conf:true},
  {id:'PED-0112', inv:'arg', qn:20, un:'sc', item:'Argamassa AC-III 20 kg', q:'20 sc', forn:'Depósito Valinhos', v:770, eta:'chega 29/10', col:3},
  {id:'PED-0115', inv:'led', qn:24, un:'un', item:'Luminária LED de embutir 18 W', q:'24 un', forn:'Elétrica Central', v:1488, eta:'saída 30/10', col:2},
  {id:'PED-0117', inv:'tinta', qn:6, un:'lata', item:'Tinta acrílica fosca 18 L', q:'6 latas', forn:'Tintas Valinhos', v:2334, eta:'aprovado hoje', col:1},
  {id:'PED-0118', inv:'rejunte', qn:5, un:'un', item:'Rejunte acrílico 1 kg', q:'5 un', forn:'Ferragens Paulista', v:125, eta:'sugerido: o que falta para fechar o piso', col:0, ai:true},
];
const INV_LC = [
  {id:'porc', nome:'Porcelanato 60×60 retificado', un:'m²', abc:'A', ent:240, sai:222, nec:0, cob:'piso concluído', st:'ok', obs:'sobra 18 m²'},
  {id:'cim', nome:'Cimento CP-II 50 kg', un:'sc', abc:'A', ent:60, sai:34, nec:4, cob:'vence em 25 dias', st:'warn', vence:25},
  {id:'arg', nome:'Argamassa AC-III 20 kg', un:'sc', abc:'B', ent:80, sai:62, nec:30, cob:'≈ 10 dias', st:'ok'},
  {id:'tinta', nome:'Tinta acrílica fosca 18 L', un:'lata', abc:'B', ent:8, sai:5, nec:9, cob:'≈ 4 dias', st:'ok'},
  {id:'rejunte', nome:'Rejunte acrílico 1 kg', un:'un', abc:'C', ent:40, sai:31, nec:14, cob:'≈ 5 dias', st:'warn', contagem:'26/10'},
  {id:'paraf', nome:'Parafuso 5/16" × 2"', un:'un', abc:'C', ent:1000, sai:580, nec:80, cob:'> 30 dias', st:'ok', contagem:'26/10'},
  {id:'prego', nome:'Prego 18×27', un:'kg', abc:'C', ent:10, sai:10, nec:6, cob:'acabou', st:'bad', contagem:'26/10'},
];
const MOV_LC = {
  porc:[
    {d:'24/10', t:'Entrada', q:+240, onde:'Recebimento PED-0109 · Portobello Shop', quem:'Ana P. (mestre)'},
    {d:'25/10', t:'Saída', q:-118, onde:'Piso do salão de vendas', quem:'Assentador (Rui)'},
    {d:'26/10', t:'Saída', q:-86, onde:'Piso do estoque e corredor', quem:'Assentador (Rui)'},
    {d:'27/10', t:'Quebra', q:-18, onde:'Recortes e quebra (7,5%, previsto 8%)', quem:'Ana P. (mestre)'},
  ],
  cim:[
    {d:'01/09', t:'Entrada', q:+60, onde:'Recebimento PED-0102 · Depósito São Bento', quem:'Ana P. (mestre)'},
    {d:'08/09', t:'Saída', q:-22, onde:'Contrapiso do salão', quem:'Equipe drywall'},
    {d:'22/09', t:'Saída', q:-12, onde:'Regularização do banheiro', quem:'Equipe drywall'},
  ],
};

/* ===================== POR OBRA ===================== */
const PRAZO_VN = {W:72, hoje:34, base:'03/03/2026', faseAtual:'Estrutura', fasePct:62, faseObs:'deveria estar em 100%',
  causas:[['Fornecedor','Aço PED-0158 (Gerdau) 9 dias atrasado, sem nova data',9,'var(--red)'],['Equipe','2 vagas de armador abertas desde 01/10',8,'var(--accentHi)'],['Clima','Chuva em outubro: 4 dias de serviço perdidos (hoje, 2 h)',4,'var(--blue)']],
  recupera:15};
const PRAZO_LC = {W:23, hoje:16, base:'10/07/2026', faseAtual:'Acabamento', fasePct:81, faseObs:'à frente do planejado',
  causas:[['Piso','Porcelanato assentado em 4 dias, contra 6 previstos',-3,'var(--green)'],['Instalações','Elétrica terminou 1 semana antes',-3,'var(--green)']],
  recupera:0};
const DADOS = {
  'vila-nova':{inv:INV, lotes:LOTES, orc:ORC, comp:COMP, fases:FASES, mov:MOV, empreitadas:EMPREITADAS, adm:ADM, prazo:PRAZO_VN, valorEstoque:18240, itensAlmox:42},
  'loja-centro':{inv:INV_LC, lotes:LOTES_LC, orc:ORC_LC, comp:COMP_LC, fases:FASES_LC, mov:MOV_LC, empreitadas:[], adm:{itens:[{n:'Ana P.',f:'Mestre de obras',mes:2200}],mes:2200}, prazo:PRAZO_LC, valorEstoque:6380, itensAlmox:27},
  'galpao':{inv:[], lotes:[], orc:[], comp:[], fases:[], mov:{}, empreitadas:[], adm:{itens:[],mes:0}, prazo:null, valorEstoque:0, itensAlmox:0},
};
function dados(id){ return DADOS[id] || DADOS['vila-nova']; }
function insumo(id){ for(const d of Object.values(DADOS)){ const c=d.comp.find(x=>x.id===id); if(c) return c; } }

/* A caminho = pedidos de Aprovado em diante que ainda não foram conferidos (recebido: vale o medido, não a NF). */
function aCaminho(obraId, invId){ return dados(obraId).lotes.filter(l=>l.inv===invId && l.col>=1 && !l.conf).reduce((a,l)=>a+(l.medido??l.qn??0),0); }
/* Em cotação = pedidos na 1ª coluna (ainda não aprovados). emCotacao devolve o 1º pedido; cotando, a quantidade somada. */
function emCotacao(obraId, invId){ return dados(obraId).lotes.find(l=>l.inv===invId && l.col===0); }
function cotando(obraId, invId){ return dados(obraId).lotes.filter(l=>l.inv===invId && l.col===0).reduce((a,l)=>a+(l.qn??0),0); }
function saldoDe(obraId, invId){ const i=dados(obraId).inv.find(x=>x.id===invId); return i? i.ent-i.sai : 0; }
/* Regra de toda sugestão (erro 1, compra em dobro): falta = precisa − saldo − a caminho − em cotação.
   O que já está em cotação não volta para o pedido de compra; se a cotação for recusada, a falta reaparece. */
function faltaDe(obraId, invId){ const i=dados(obraId).inv.find(x=>x.id===invId); return i? Math.max(0, i.nec-(i.ent-i.sai)-aCaminho(obraId,invId)-cotando(obraId,invId)) : 0; }
/* A linha de conta de um insumo, a mesma em tabela, drawer, pedido de compra e modal de transferência:
   precisa − saldo − a caminho − em cotação − transferência = falta → comprar. Passe direto para linhaConta(contaDe(...)).
   falta e comprar já descontam a transferência sugerida; faltaSemTransf (= faltaDe) é antes dela.
   Insumo que ainda não está no almoxarifado (telha, cabo): precisa = quantidade do projeto, saldo 0.
   Campos extras: cot (1º pedido em cotação), tr (transferência sugerida), nome, un, item (do almoxarifado ou null). */
function contaDe(obraId, invId){
  const d=dados(obraId), i=d.inv.find(x=>x.id===invId), c=d.comp.find(x=>(x.inv||x.id)===invId);
  const precisa=i? i.nec : (c? c.qtd : 0), saldo=i? i.ent-i.sai : 0;
  const caminho=i? aCaminho(obraId,invId) : d.lotes.filter(l=>l.inv===invId&&l.col>=1).reduce((a,l)=>a+(l.receb??l.medido??l.qn??0),0);
  const cot=cotando(obraId,invId), falta=Math.max(0, precisa-saldo-caminho-cot);
  const tr=TRANSF.find(t=>t.inv===invId&&t.destino===obraId&&t.sug>0), transf=tr? Math.min(tr.sug,falta) : 0;
  return {precisa, saldo, aCaminho:caminho, cotando:cot, transf, falta:falta-transf, comprar:falta-transf, faltaSemTransf:falta, un:(i||c||{}).un||'',
    cot:emCotacao(obraId,invId), tr, nome:(i||c||{}).nome||invId, item:i||null};
}
/* Duração do estoque em dias, lida do mesmo texto da coluna "Dura" (erro 2: nunca da marcação st).
   "≈ 6 dias" → 6 · "até ~30/10" → dias até a data · "acabou" → 0 · "> 30 dias" → 31 · sem consumo contínuo → null. */
const HOJE = {d:28, m:10};
function duraDias(i){
  const t=String(i&&i.cob||'');
  if(/acabou/.test(t)) return 0;
  let m=t.match(/>\s*(\d+)/); if(m) return +m[1]+1;
  m=t.match(/(\d{1,2})\/(\d{1,2})/); if(m) return Math.max(0, Math.round((new Date(2026,+m[2]-1,+m[1])-new Date(2026,HOJE.m-1,HOJE.d))/864e5));
  m=t.match(/(\d+)\s*dia/); if(m) return +m[1];
  return null;
}

/* Estoque entre obras: o máximo que sai da origem é saldo − o que ela ainda vai usar − reserva
   (metade do que ela ainda vai usar). O preço é o do lote original, não o de mercado.
   saldo, usar e falta são lidos do almoxarifado das duas obras (recalcTransf). */
const TRANSF = [
  {inv:'paraf', item:'Parafuso 5/16" × 2"', un:'un', origem:'loja-centro', destino:'vila-nova',
   custo:0.39, lote:'PED-0098 · Ciser · 18/07', novo:0.42, novoForn:'Ciser Distribuidor', novoPrazo:'3 dias', dias:3, resp:'Ana P. (mestre da Loja Centro)',
   pq:'A Loja Centro está no acabamento e só usa mais 80. Chega hoje, contra 3 dias da compra. Os 80 que sobram para comprar já estão no PED-0165.'},
  {inv:'cim', item:'Cimento CP-II 50 kg', un:'sc', origem:'loja-centro', destino:'vila-nova',
   custo:35.50, lote:'PED-0102 · Depósito São Bento · 01/09', novo:36.90, novoForn:'Depósito São Bento', novoPrazo:'2 dias', dias:2, resp:'Ana P. (mestre da Loja Centro)',
   pq:'Os sacos da Loja Centro vencem em 25 dias e lá só vão usar 4. Na Vila Nova vão para a argamassa da alvenaria: faltam 34 sc mesmo contando os 120 do PED-0160.', perda:true},
  {inv:'prego', item:'Prego 18×27', un:'kg', origem:'vila-nova', destino:'loja-centro',
   custo:14.90, lote:'PED-0139 · Ferragens Paulista · 02/09', novo:17.50, novoForn:'Leroy Merlin D. Pedro', novoPrazo:'1 dia', dias:1, resp:'Joana M. (mestre da Vila Nova)',
   pq:'A Vila Nova tem prego além do que vai usar; a Loja Centro precisa de 6 kg para o forro.'},
];
/* Movimentam o almoxarifado e devolvem a função que desfaz. NÃO chamam registrar(): quem chama registra. */
function baixar(obraId, invId, qtd, onde, quem, tipo='Saída'){
  const d=dados(obraId), i=d.inv.find(x=>x.id===invId); if(!i||!(qtd>0)) return ()=>{};
  const m={d:'28/10', t:tipo, q:-qtd, onde:onde||'—', quem:quem||'—'};
  i.sai+=qtd; (d.mov[invId]=d.mov[invId]||[]).push(m); recalcTransf();
  return ()=>{ i.sai-=qtd; const a=d.mov[invId], k=a.indexOf(m); if(k>=0) a.splice(k,1); recalcTransf(); };
}
function acharLote(id){ for(const [ob,d] of Object.entries(DADOS)){ const l=d.lotes.find(x=>x.id===id); if(l) return {l, ob, d}; } return null; }
/* Recebido e conferido: lança a entrada no almoxarifado da obra do pedido (cria o item se não existir). */
function darEntrada(idLote, qtd, opt={}){
  const f=acharLote(idLote); if(!f||f.l.conf) return ()=>{};
  const {l, ob, d}=f, q=qtd ?? (l.medido ?? l.qn ?? 0), invId=l.inv;
  const antes={col:l.col, eta:l.eta, conf:l.conf, receb:l.receb};
  let i=d.inv.find(x=>x.id===invId), novo=false;
  if(!i && invId){ i={id:invId, nome:l.item, un:l.un||'', abc:'B', ent:0, sai:0, nec:0, cob:'—', st:'ok'}; d.inv.push(i); novo=true; }
  const mestre=(OBRAS.find(o=>o.id===ob)||{}).mestre||'mestre';
  const m={d:'28/10', t:'Entrada', q:+q, onde:`Recebimento ${l.id} · ${l.forn}`+(opt.divergencia?` · ${opt.divergencia}`:''), quem:mestre+' (mestre)'};
  l.col=KCOLS.length-1; l.conf=true; l.receb=q;
  l.eta='conferido hoje'+(l.qn&&q!==l.qn?` · ${num(q)} de ${num(l.qn)} ${l.un||''}`:'');
  if(i){ i.ent+=q; (d.mov[invId]=d.mov[invId]||[]).push(m); }
  let voltaOrigem=()=>{}, h=null;
  if(l.trf){ voltaOrigem=baixar(l.origem, invId, q, `Transferência ${l.id} para ${NOME_OBRA[ob]}`, 'transferência', 'Transferência');
    h=TRF_HIST.find(x=>x.id===l.id); if(h) h.st='Recebida'; }
  recalcTransf();
  return ()=>{ Object.assign(l,antes); if(i){ i.ent-=q; const a=d.mov[invId], k=a.indexOf(m); if(k>=0) a.splice(k,1); }
    if(novo) d.inv.splice(d.inv.indexOf(i),1); voltaOrigem(); if(h) h.st='Aguardando OK da origem'; recalcTransf(); };
}
function recalcTransf(){ TRANSF.forEach(t=>{
  const o=dados(t.origem).inv.find(x=>x.id===t.inv);
  t.saldo=o?o.ent-o.sai:0; t.usar=o?o.nec:0; t.reserva=Math.ceil(t.usar/2); t.max=Math.max(0,t.saldo-t.usar-t.reserva);
  t.falta=faltaDe(t.destino,t.inv); t.sug=Math.min(t.max,t.falta); }); }
recalcTransf();
const TRF_HIST = [
  {id:'TRF-0004', d:'09/10', item:'Disco de corte 7"', q:'12 un', de:'vila-nova', para:'loja-centro', v:106.80, st:'Recebida'},
  {id:'TRF-0003', d:'22/09', item:'Argamassa AC-II 20 kg', q:'15 sc', de:'loja-centro', para:'vila-nova', v:268.50, st:'Recebida'},
  {id:'TRF-0002', d:'28/08', item:'Lona preta 4×100 m', q:'1 rolo', de:'vila-nova', para:'loja-centro', v:389.00, st:'Recebida'},
];
