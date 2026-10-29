/* ===================== MOVIMENTO =====================
   Observa o DOM (MutationObserver) e marca o que acabou de mudar; não reescreve nada do core e não muda a ordem do
   render (que continua síncrono: foco, testes e rolagem não esperam animação). O desenho fica em css/motion.css.
   - troca de aba / sessão / página: o conteúdo novo entra com fade + 6 px (WAAPI, compositor)
   - bolha nova na conversa e "usando ferramentas…": .mv-entra (as do agente já chegam com .cv-entra)
   - linha que acabou de ser aprovada: .mv-aprovou (check desenhado + realce verde que esmaece); desfeita: .mv-voltou
   - contador que mudou: .mv-conta · grupo da lateral que abriu/fechou: .mv-abre/.mv-fecha + seta girando
   - menus "+" e "⋯": crescem a partir do gatilho
   View Transitions ficaram de fora de propósito: o callback delas é assíncrono e o render precisa continuar síncrono. */
(()=>{
  const EASE='cubic-bezier(.23,1,.32,1)';
  const reduz=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MV={cena:null, msgs:{s:null, n:0, pensa:false}, linhas:new Map(), linhasCena:null, contas:new Map(), grupos:new Map()};
  const visivel=el=>el && !el.hidden;

  /* o que ocupa a área agora: a aba de tela, a conversa de uma sessão ou uma página (#fluxos, #campo) */
  function cena(){
    const vs=$('visao'), m=$('main'), box=$('caMsgs');
    if(visivel(vs) && vs.dataset.k) return {k:'v:'+vs.dataset.k, el:$('vsCorpo')};
    if(box && visivel(m)) return {k:'c:'+box.dataset.s, el:box};
    return {k:'p:'+location.hash.split('/')[0], el:m};
  }
  function entrar(el){
    if(!el || !el.animate) return;
    el.animate(reduz() ? [{opacity:0},{opacity:1}] : [{opacity:0, transform:'translateY(6px)'},{opacity:1, transform:'none'}],
      {duration:reduz()?140:190, easing:EASE});
  }

  /* bolhas novas na mesma sessão (as do agente já vêm com .cv-entra da Conversa) e o balão "usando ferramentas…" */
  function mensagens(){
    const box=$('caMsgs'); if(!box || !visivel($('main'))) return;
    const s=box.dataset.s, ms=[...box.querySelectorAll('.msg:not(.ca-pensando)')], p=box.querySelector('.ca-pensando');
    if(MV.msgs.s===s){
      ms.slice(MV.msgs.n).forEach(e=>{ if(!e.classList.contains('cv-entra')) e.classList.add('mv-entra'); });
      if(p && !MV.msgs.pensa) p.classList.add('mv-entra');
    }
    MV.msgs={s, n:ms.length, pensa:!!p};
  }

  /* linhas de decisão: pendente → feito ganha o check desenhado e o realce; feito → pendente (Desfazer) só faz o crossfade */
  function linhas(k){
    const atual=new Map();
    document.querySelectorAll('#main .ld, #visao .ld, #drawer .ld, #modal .ld').forEach(r=>{
      const t=r.querySelector('.ld-tit'), key=r.dataset.doc || (t ? t.textContent.trim() : ''); if(!key) return;
      const feito=r.classList.contains('feito'), antes=MV.linhasCena===k ? MV.linhas.get(key) : undefined;
      if(antes===false && feito) aprovou(r);
      else if(antes===true && !feito) r.classList.add('mv-voltou');
      atual.set(key, feito);
    });
    MV.linhas=atual; MV.linhasCena=k;
  }
  function aprovou(r){
    r.querySelectorAll('.ld-feito svg path').forEach(p=>p.setAttribute('pathLength','1'));
    r.classList.add('mv-aprovou');
    setTimeout(()=>r.classList.remove('mv-aprovou'), 1400);
  }

  /* contadores: os da lateral e da barra de abas valem em qualquer tela; os do conteúdo, só na mesma tela */
  function contas(k){
    const atual=new Map();
    document.querySelectorAll('#side .count, #sesTop .count, #sesTop .n, #main .seg .n, #visao .seg .n, #visao .tab .count').forEach(e=>{
      const dono=e.closest('[aria-controls],[data-k],[href],button') || e.parentElement;
      const id=(e.closest('#side,#sesTop') ? '' : k+'|') + (dono.getAttribute('aria-controls') || dono.dataset.k || dono.getAttribute('href') || dono.textContent.replace(e.textContent,'').trim());
      const v=e.textContent.trim(), antes=MV.contas.get(id);
      if(antes!==undefined && antes!==v) e.classList.add('mv-conta');
      atual.set(id, v);
    });
    MV.contas.forEach((v,id)=>{ if(!atual.has(id)) atual.set(id,'0'); });   // sumiu = zerou: se voltar, faz o pop
    MV.contas=atual;
  }

  /* grupos da obra na lateral: a lista abre/fecha por grid-template-rows; na volta o hidden do core já está posto */
  function grupos(){
    document.querySelectorAll('#side .grp[aria-controls]').forEach(b=>{
      const id=b.getAttribute('aria-controls'), aberto=b.getAttribute('aria-expanded')==='true', l=$(id);
      if(l && MV.grupos.has(id) && MV.grupos.get(id)!==aberto) animarGrupo(b, l, aberto);
      MV.grupos.set(id, aberto);
    });
  }
  function animarGrupo(b, l, aberto){
    const w=document.createElement('div'); w.className='mv-grp-in';
    while(l.firstChild) w.appendChild(l.firstChild);
    l.appendChild(w);
    l.classList.add(aberto ? 'mv-abre' : 'mv-fecha');
    l.addEventListener('animationend', e=>{ if(e.target===l) l.classList.remove('mv-abre','mv-fecha'); });
    const c=b.querySelector('.grp-chev');
    if(c && !reduz()) c.animate([{transform:aberto?'none':'rotate(90deg)'},{transform:aberto?'rotate(90deg)':'none'}], {duration:200, easing:EASE});
  }

  /* menus: a origem do scale é o gatilho (o "+" abre para baixo e à direita; o "⋯" pode abrir para cima) */
  function abriuMenu(pop){
    const b=pop.id && document.querySelector(`[aria-controls="${pop.id}"]`); if(!pop.animate) return;
    if(b){
      const br=b.getBoundingClientRect(), pr=pop.getBoundingClientRect();
      const x=Math.max(0, Math.min(pr.width, br.left+br.width/2-pr.left)), y=br.top+br.height/2 <= pr.top ? 0 : pr.height;
      pop.style.transformOrigin=`${Math.round(x)}px ${Math.round(y)}px`;
    }
    pop.animate(reduz() ? [{opacity:0},{opacity:1}] : [{opacity:0, transform:'scale(.96)'},{opacity:1, transform:'none'}],
      {duration:reduz()?120:160, easing:EASE});
  }

  function varrer(){
    const c=cena();
    if(MV.cena!==null && c.k!==MV.cena) entrar(c.el);
    MV.cena=c.k;
    mensagens(); linhas(c.k); contas(c.k); grupos();
  }

  /* mudanças do campo (contexto, @/sugestões), do toast e do campo "Perguntar sobre isto" não interessam: são de digitação */
  const IGNORA='.ca-pe, #toast, .vs-perg';
  const mo=new MutationObserver(rs=>{
    let mudou=false;
    for(const r of rs){
      const t=r.target;
      if(r.type==='attributes'){
        if(!t.hidden && t.matches && t.matches('.mm-pop, .ca-menu-pop')) abriuMenu(t);
        continue;
      }
      if(!(t.closest && t.closest(IGNORA))) mudou=true;
    }
    if(mudou) varrer();
  });
  varrer();
  mo.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden']});
})();
