/* BONDS OS — copiar este arquivo no Forumeiros: Todas as páginas. */
(function(){
  if(document.getElementById('bonds-os-loader'))return;
  var q=new URLSearchParams(location.search).get('bondsos'),v='2',f='';
  try{var p=localStorage.getItem('bondsSkinVersion');if(p==='1'||p==='2')v=p;}catch(_){}
  try{f=sessionStorage.getItem('bondsSkinFailsafe')||'';}catch(_){}
  if(q==='0')v='1';if(q==='1'&&f!=='once'){v='2';f='';}
  var s=document.createElement('script'),c,t;s.id='bonds-os-loader';
  function clear(){clearTimeout(t);document.documentElement.classList.remove('bonds-bootstrap-loading');if(c)c.remove();}
  if(v==='2'&&!f&&q!=='fallback'){
    c=document.createElement('style');c.id='bonds-bootstrap-critical';
    c.textContent='html.bonds-bootstrap-loading,html.bonds-bootstrap-loading body{background:#0b202b!important;color:#dcebf0!important}html.bonds-bootstrap-loading :is(#wrap,#page-body,#main-content,.headerbar,.post,.postbody,.postprofile,.panel,.forabg,.forumbg,.navbar){background-color:#0b202b!important;background-image:none!important}html.bonds-bootstrap-loading #page-header .navbar{visibility:hidden!important}html.bonds-bootstrap-loading #wrap{opacity:0!important;pointer-events:none!important}';
    document.head.appendChild(c);document.documentElement.classList.add('bonds-bootstrap-loading');
  }
  s.src='https://digimon-bonds.github.io/forum-skin/forumeiros-loader.js?v=20261013-10-public-beta3';
  function cancel(){s.dataset.bondsCancelled='1';s.remove();clear();}
  s.onload=clear;s.onerror=cancel;t=setTimeout(cancel,12000);document.head.appendChild(s);
}());
