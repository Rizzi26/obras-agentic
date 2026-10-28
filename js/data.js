/* ===================== DADOS FICTÍCIOS (coerentes entre telas) ===================== */
const brl = v => 'R$ ' + v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});
const brl2 = v => 'R$ ' + v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

const OBRAS = [
  {id:'vila-nova', nome:'Casa Vila Nova', tipo:'Residencial · 180 m² · 2 pav.', local:'Campinas · SP', cor:'#e09a2b',
   budget:620000, previsto:648300, comprometido:286400, gasto:241850, fase:'Estrutura', progresso:38,
   inicio:'03/03/2026', prazo:'30/06/2027', previsao:'21/07/2027', atraso:21, status:'risco'},
  {id:'loja-centro', nome:'Reforma Loja Centro', tipo:'Comercial · 95 m²', local:'Valinhos · SP', cor:'#3f6f9a',
   budget:145000, previsto:139200, comprometido:118000, gasto:104300, fase:'Acabamento', progresso:81,
   inicio:'10/07/2026', prazo:'15/12/2026', previsao:'09/12/2026', atraso:-6, status:'ok'},
  {id:'galpao', nome:'Galpão Sumaré', tipo:'Industrial · 1.200 m²', local:'Sumaré · SP', cor:'#7a64b0',
   budget:2400000, previsto:null, comprometido:0, gasto:0, fase:'Planejamento', progresso:0,
   inicio:'—', prazo:'—', previsao:'—', atraso:0, status:'plan'},
];

const FASES = [
  {n:'Serviços preliminares', ini:0,  fim:6,  real:[0,6],   pct:100},
  {n:'Fundação',             ini:5,  fim:16, real:[5,17],  pct:100},
  {n:'Estrutura',            ini:15, fim:30, real:[16,34], pct:62},
  {n:'Alvenaria',            ini:26, fim:40, real:[30,44], pct:8},
  {n:'Cobertura',            ini:36, fim:44, real:[40,48], pct:0},
  {n:'Instalações (elét./hidr.)', ini:38, fim:54, real:[42,57], pct:0},
  {n:'Acabamento',           ini:48, fim:64, real:[51,67], pct:0},
  {n:'Limpeza e entrega',    ini:63, fim:69, real:[66,72], pct:0},
]; // semanas desde 03/03/2026; hoje = semana 34

const ORC = [
  {cat:'Fundação', prev:70000, real:71400},
  {cat:'Estrutura (concreto e aço)', prev:132000, real:138900},
  {cat:'Alvenaria', prev:81000, real:84800},
  {cat:'Cobertura', prev:52000, real:52000},
  {cat:'Instalações elétricas e hidráulicas', prev:72000, real:74200},
  {cat:'Esquadrias e ferragens', prev:37000, real:38100},
  {cat:'Acabamento', prev:112000, real:112000},
  {cat:'Mão de obra (fora das empreitadas)', prev:72000, real:76900},
];

const COMP = [
  {id:'cim', nome:'Cimento CP-II-E-32 50 kg', un:'saco', qtd:420, fase:'Estrutura / Alvenaria',
   forn:[{n:'Depósito São Bento',cid:'Campinas',p:36.90,prazo:'2 dias',nota:4.6},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:38.49,prazo:'3 dias',nota:4.3},{n:'Casa do Construtor Sousas',cid:'Campinas',p:39.80,prazo:'1 dia',nota:4.8}]},
  {id:'aco', nome:'Vergalhão CA-50 10 mm (barra 12 m)', un:'barra', qtd:540, fase:'Estrutura',
   forn:[{n:'Gerdau Distribuidor Hortolândia',cid:'Hortolândia',p:58.70,prazo:'5 dias',nota:4.5},{n:'Aço Forte Comercial',cid:'Campinas',p:61.20,prazo:'2 dias',nota:4.1},{n:'Telhanorte Barão',cid:'Campinas',p:66.90,prazo:'3 dias',nota:4.4}]},
  {id:'bloco', nome:'Bloco cerâmico 14×19×29', un:'un', qtd:18500, fase:'Alvenaria',
   forn:[{n:'Cerâmica Itu Direto',cid:'Itu',p:1.62,prazo:'7 dias',nota:4.2},{n:'Depósito São Bento',cid:'Campinas',p:1.89,prazo:'2 dias',nota:4.6},{n:'Olaria Sumaré',cid:'Sumaré',p:1.74,prazo:'4 dias',nota:4.0}]},
  {id:'areia', nome:'Areia média lavada', un:'m³', qtd:96, fase:'Estrutura / Alvenaria',
   forn:[{n:'Porto de Areia Jaguari',cid:'Paulínia',p:118,prazo:'1 dia',nota:4.4},{n:'Depósito São Bento',cid:'Campinas',p:135,prazo:'1 dia',nota:4.6}]},
  {id:'brita', nome:'Brita 1', un:'m³', qtd:64, fase:'Fundação / Estrutura',
   forn:[{n:'Pedreira Basalto Campinas',cid:'Campinas',p:112,prazo:'1 dia',nota:4.5},{n:'Depósito São Bento',cid:'Campinas',p:129,prazo:'1 dia',nota:4.6}]},
  {id:'paraf', nome:'Parafuso sextavado 5/16" × 2" zincado', un:'un', qtd:1500, fase:'Esquadrias / Cobertura',
   forn:[{n:'Ciser Distribuidor',cid:'Campinas',p:0.42,prazo:'3 dias',nota:4.7},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:0.59,prazo:'1 dia',nota:4.3},{n:'Ferragens Paulista',cid:'Valinhos',p:0.48,prazo:'2 dias',nota:4.5}]},
  {id:'telha', nome:'Telha cerâmica portuguesa', un:'un', qtd:3900, fase:'Cobertura',
   forn:[{n:'Telhas Tatuí',cid:'Tatuí',p:2.35,prazo:'10 dias',nota:4.3},{n:'Telhanorte Barão',cid:'Campinas',p:2.98,prazo:'3 dias',nota:4.4}]},
  {id:'fio', nome:'Cabo flexível 2,5 mm² (rolo 100 m)', un:'rolo', qtd:22, fase:'Instalações',
   forn:[{n:'Elétrica Central',cid:'Campinas',p:189,prazo:'2 dias',nota:4.6},{n:'Leroy Merlin D. Pedro',cid:'Campinas',p:214,prazo:'1 dia',nota:4.3}]},
];

const LOTES = [
  {id:'PED-0141', item:'Cimento CP-II 50 kg', q:'200 sc', forn:'Depósito São Bento', v:7380, eta:'entregue 12/09', col:5},
  {id:'PED-0142', item:'Brita 1', q:'32 m³', forn:'Pedreira Basalto', v:3584, eta:'entregue 14/09', col:5},
  {id:'PED-0150', item:'Parafuso 5/16" × 2"', q:'1.000 un', forn:'Ciser Distribuidor', v:420, eta:'entregue 02/10', col:5},
  {id:'PED-0157', item:'Areia média', q:'40 m³', forn:'Porto Jaguari', v:4720, eta:'recebido hoje — conferir', col:4},
  {id:'PED-0158', item:'Vergalhão CA-50 10 mm', q:'300 barras', forn:'Gerdau Hortolândia', v:17610, eta:'previsto 19/10 · 9 dias atrasado', col:3, late:true},
  {id:'PED-0160', item:'Cimento CP-II 50 kg', q:'120 sc', forn:'Depósito São Bento', v:4428, eta:'chega 30/10', col:3},
  {id:'PED-0162', item:'Bloco cerâmico 14×19×29', q:'9.000 un', forn:'Cerâmica Itu', v:14580, eta:'saída 31/10', col:2},
  {id:'PED-0163', item:'Telha portuguesa', q:'3.900 un', forn:'Telhas Tatuí', v:9165, eta:'aguardando aprovação', col:1},
  {id:'PED-0164', item:'Cabo flexível 2,5 mm²', q:'22 rolos', forn:'Elétrica Central', v:4158, eta:'cotação 3 fornecedores', col:0},
  {id:'PED-0165', item:'Parafuso 5/16" × 2"', q:'500 un', forn:'Ciser Distribuidor', v:210, eta:'sugerido pelo agente', col:0, ai:true},
];
const KCOLS = ['Cotado','Aprovado','Pedido feito','Em trânsito','Entregue (conferir)','Disponível no inventário'];

const INV = [
  {id:'paraf', nome:'Parafuso 5/16" × 2"', un:'un', ent:1000, sai:900, nec:480, cob:'6 dias', st:'bad'},
  {id:'cim', nome:'Cimento CP-II 50 kg', un:'sc', ent:200, sai:154, nec:220, cob:'9 dias', st:'warn'},
  {id:'brita', nome:'Brita 1', un:'m³', ent:32, sai:21, nec:10, cob:'15 dias', st:'ok'},
  {id:'aco', nome:'Vergalhão CA-50 10 mm', un:'barra', ent:240, sai:228, nec:300, cob:'2 dias', st:'bad'},
  {id:'areia', nome:'Areia média', un:'m³', ent:56, sai:31, nec:22, cob:'12 dias', st:'ok'},
  {id:'prego', nome:'Prego 18×27 (kg)', un:'kg', ent:60, sai:22, nec:20, cob:'> 30 dias', st:'ok'},
];
const MOV_PARAF = [
  {d:'02/10', t:'Entrada', q:+1000, onde:'Recebimento PED-0150 (Ciser)', quem:'Marcos (almox.)'},
  {d:'06/10', t:'Saída', q:-450, onde:'Estrutura do telhado — tesouras', quem:'Equipe carpintaria'},
  {d:'14/10', t:'Saída', q:-350, onde:'Portão da garagem', quem:'Serralheria (Luiz)'},
  {d:'21/10', t:'Saída', q:-100, onde:'Porta principal — batente e dobradiças', quem:'Equipe carpintaria'},
];

/* Estoque entre obras: o máximo que sai da origem é saldo − o que ela ainda vai usar − reserva
   (metade do que ela ainda vai usar). O preço é o do lote original, não o de mercado. */
const NOME_OBRA = {'vila-nova':'Casa Vila Nova','loja-centro':'Reforma Loja Centro','galpao':'Galpão Sumaré'};
const TRANSF = [
  {inv:'paraf', item:'Parafuso 5/16" × 2"', un:'un', origem:'loja-centro', destino:'vila-nova', saldo:420, usar:80, falta:380,
   custo:0.39, lote:'PED-0098 · Ciser · 18/07', novo:0.42, novoForn:'Ciser Distribuidor', novoPrazo:'3 dias', resp:'Ana P. (mestre da Loja Centro)',
   pq:'A Loja Centro está no acabamento e não usa mais parafuso estrutural. Chega hoje, contra 3 dias da compra.'},
  {inv:'cim', item:'Cimento CP-II 50 kg', un:'sc', origem:'loja-centro', destino:'vila-nova', saldo:26, usar:4, falta:174,
   custo:35.50, lote:'PED-0102 · Depósito São Bento · 01/09', novo:36.90, novoForn:'Depósito São Bento', novoPrazo:'2 dias', resp:'Ana P. (mestre da Loja Centro)',
   pq:'Os sacos da Loja Centro vencem em 25 dias. Lá eles empedrariam; na Vila Nova são gastos na laje desta semana.', perda:true},
  {inv:'prego', item:'Prego 18×27', un:'kg', origem:'vila-nova', destino:'loja-centro', saldo:38, usar:20, falta:6,
   custo:14.90, lote:'PED-0139 · Ferragens Paulista · 02/09', novo:17.50, novoForn:'Leroy Merlin D. Pedro', novoPrazo:'1 dia', resp:'Joana M. (mestre da Vila Nova)',
   pq:'A Vila Nova tem prego além do que vai usar; a Loja Centro precisa de 6 kg para o forro.'},
];
TRANSF.forEach(t=>{ t.reserva=Math.ceil(t.usar/2); t.max=Math.max(0,t.saldo-t.usar-t.reserva); t.sug=Math.min(t.max,t.falta); });
const TRF_HIST = [
  {id:'TRF-0004', d:'09/10', item:'Disco de corte 7"', q:'12 un', de:'vila-nova', para:'loja-centro', v:106.80, st:'Recebida'},
  {id:'TRF-0003', d:'22/09', item:'Argamassa AC-II 20 kg', q:'15 sc', de:'loja-centro', para:'vila-nova', v:268.50, st:'Recebida'},
  {id:'TRF-0002', d:'28/08', item:'Lona preta 4×100 m', q:'1 rolo', de:'vila-nova', para:'loja-centro', v:389.00, st:'Recebida'},
];

const EQUIPE = {
  cols:['Vaga aberta','Em mobilização','Em campo','Desmobilizado'],
  ppl:[
    {n:'Vaga: Armador', f:'Estrutura', c:'—', col:0, alert:true},
    {n:'Vaga: Armador', f:'Estrutura', c:'—', col:0, alert:true},
    {n:'Paulo R.', f:'Eletricista', c:'R$ 280/dia', col:1, nota:'começa 04/11'},
    {n:'Joana M.', f:'Mestre de obras', c:'R$ 9.800/mês', col:2},
    {n:'Equipe Silva (4)', f:'Pedreiros · empreitada', c:'R$ 38.000 global', col:2},
    {n:'Carlos A.', f:'Carpinteiro', c:'R$ 260/dia', col:2},
    {n:'Diego F.', f:'Carpinteiro', c:'R$ 260/dia', col:2},
    {n:'Luiz S.', f:'Serralheiro', c:'R$ 300/dia', col:2},
    {n:'Marcos T.', f:'Almoxarife', c:'R$ 3.200/mês', col:2},
    {n:'Ajudantes (3)', f:'Servente', c:'R$ 160/dia cada', col:2},
    {n:'Equipe Fundação (5)', f:'Fundação · empreitada', c:'R$ 26.500 global', col:3, nota:'saiu 30/06'},
  ]
};

