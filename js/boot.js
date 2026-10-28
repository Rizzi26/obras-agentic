window.onhashchange();
if(!location.hash) render();
const gw=()=>$('gw').textContent=innerWidth; gw(); addEventListener('resize',gw);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();closeModal();}});
