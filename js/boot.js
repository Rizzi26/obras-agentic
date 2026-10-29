window.onhashchange();
if(!location.hash) render();
const gw=()=>$('gw').textContent=innerWidth; gw(); addEventListener('resize',gw);
/* Esc, Tab e o atalho / ficam em js/core.js (diálogos e painel do agente). */
