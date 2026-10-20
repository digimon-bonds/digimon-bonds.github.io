/* BONDS OS v10 PUBLIC BETA — native forum remains the fallback. */
(function () {
  'use strict';
  if(document.currentScript && document.currentScript.dataset.bondsCancelled==='1')return;
  var BASE_URL = 'https://digimon-bonds.github.io/forum-skin/';
  var VERSION = '20261020-profile-digivices';
  if(!document.getElementById('bonds-forum-app-identity')){var identityBridge=document.createElement('script');identityBridge.id='bonds-forum-app-identity';identityBridge.type='module';identityBridge.src=BASE_URL+'forum-app-bridge.js?v=20261020-profile-digivices';document.head.appendChild(identityBridge);}
  var root=document.documentElement, storageKey='bondsSkinVersion', failKey='bondsSkinFailsafe';
  if (document.getElementById('bonds-skin-switcher-style')) return;
  var flag=new URLSearchParams(location.search).get('bondsos'), preference='2', failedSession='';
  try { var saved=localStorage.getItem(storageKey); if(saved==='1'||saved==='2')preference=saved; } catch (_) {}
  try { failedSession=sessionStorage.getItem(failKey)||''; } catch (_) {}
  if (flag==='1'||flag==='0') {
    preference=flag==='1'?'2':'1';
    try { localStorage.setItem(storageKey,preference); } catch (_) {}
    // An automatic recovery reload wins once over the original diagnostic URL.
    if (failedSession!=='once') { failedSession=''; try {sessionStorage.removeItem(failKey);} catch (_) {} }
  }
  var effective=failedSession || flag==='fallback' ? '1' : preference;
  if(failedSession==='once')try{sessionStorage.setItem(failKey,'classic');}catch(_){}
  var wrapper, trigger, menu, options=[], status, failure=effective!==preference;
  function element(tag, className, text) {
    var node=document.createElement(tag); node.className=className||''; if(text)node.textContent=text; return node;
  }
  var selectorStyle=element('style'); selectorStyle.id='bonds-skin-switcher-style';
  selectorStyle.textContent='[aria-label="Configurações de cookies"],[title="Configurações de cookies"]{display:none!important}#bonds-skin-switcher{position:relative;display:flex;justify-content:flex-end;width:calc(100% - 64px);max-width:1380px;margin:12px auto 0;z-index:1000;font:11px/1.5 "Segoe UI",sans-serif;color:#dcecf2;box-sizing:border-box}#bonds-skin-switcher *{box-sizing:border-box}#bonds-skin-switcher button{position:static;float:none;height:auto;margin:0;text-transform:none;letter-spacing:0;cursor:pointer;font:inherit;color:inherit;box-shadow:none}#bonds-skin-switcher-trigger{display:flex;align-items:center;gap:8px;min-height:34px;padding:8px 11px;background:#102735;border:1px solid #597b89;border-left:3px solid #e3b76d;border-radius:4px 10px 4px 4px;font-size:10px!important;letter-spacing:.06em!important;box-shadow:0 4px 16px #0004!important}#bonds-skin-switcher-trigger:after{content:"⌄";color:#e3b76d}#bonds-skin-menu{position:absolute;top:calc(100% + 8px);right:0;width:228px;max-width:calc(100vw - 24px);padding:10px;background:#0b202d;border:1px solid #527480;border-radius:6px 15px 6px 6px;box-shadow:0 14px 30px #0006}#bonds-skin-menu[hidden]{display:none!important}#bonds-skin-menu .bonds-skin-heading{margin:0;padding:2px 7px 8px;color:#91b4c3;font-size:9px;letter-spacing:.14em}#bonds-skin-menu button{display:block;width:100%;padding:10px 12px;text-align:left;border:1px solid transparent;border-radius:4px;background:transparent}#bonds-skin-menu button[aria-checked="true"]{background:#193b49;border-color:#7cb8c5}#bonds-skin-menu button:before{content:"○";display:inline-block;width:18px;color:#8db5c4}#bonds-skin-menu button[aria-checked="true"]:before{content:"●";color:#e3b76d}#bonds-skin-menu button span{display:block;padding-left:18px;color:#9fbcc8;font-size:10px}#bonds-skin-menu button:hover{background:#204656}#bonds-skin-switcher button:focus-visible{outline:2px solid #e3b76d;outline-offset:3px}#bonds-skin-status{margin:8px 7px 2px;color:#e5c18b;font-size:10px}#bonds-skin-status:empty{display:none}@media(max-width:600px){#bonds-skin-switcher{width:calc(100% - 32px);margin-top:10px}#bonds-skin-switcher-trigger{font-size:9px!important;padding:7px 8px;min-height:32px}}';
  document.head.appendChild(selectorStyle);
  function update() {
    options.forEach(function(option){option.setAttribute('aria-checked',String(option.dataset.version===effective));});
    if(status)status.textContent=failure?'Falha temporária: usando a clássica. Selecione 2.0 para tentar novamente.':'';
  }
  function closeMenu(focus) { if(!menu)return; menu.hidden=true; trigger.setAttribute('aria-expanded','false'); if(focus)trigger.focus(); }
  function choose(version) {
    var persisted=false;
    try{localStorage.setItem(storageKey,version);persisted=true;}catch(_){}
    try{sessionStorage.removeItem(failKey);}catch(_){}
    closeMenu(false);
    var url=new URL(location.href);
    if(persisted)url.searchParams.delete('bondsos'); else url.searchParams.set('bondsos',version==='2'?'1':'0');
    try{history.replaceState(null,'',url.href);}catch(_){location.replace(url.href);return;}
    location.reload();
  }
  function mount() {
    if(wrapper || !document.body || !/^\/(?:index\.(?:php|htm|html))?$/.test(new URL(location.href).pathname))return;
    wrapper=element('div'); wrapper.id='bonds-skin-switcher';
    trigger=element('button','','VERSÃO DA SKIN'); trigger.id='bonds-skin-switcher-trigger'; trigger.type='button';
    trigger.setAttribute('aria-haspopup','menu'); trigger.setAttribute('aria-expanded','false'); trigger.setAttribute('aria-controls','bonds-skin-menu');
    menu=element('div'); menu.id='bonds-skin-menu'; menu.hidden=true; menu.setAttribute('role','menu'); menu.setAttribute('aria-label','Interface');
    menu.appendChild(element('p','bonds-skin-heading','INTERFACE'));
    [['2','2.0 // BONDS OS'],['1','1.0 // CLÁSSICA']].forEach(function(item){
      var option=element('button','',item[1]); option.id='bonds-skin-'+item[0]; option.type='button'; option.dataset.version=item[0]; option.setAttribute('role','menuitemradio');
      option.addEventListener('click',function(){choose(item[0]);}); options.push(option); menu.appendChild(option);
    });
    status=element('p'); status.id='bonds-skin-status'; status.setAttribute('role','status'); menu.appendChild(status);
    trigger.addEventListener('click',function(){
      if(!menu.hidden){closeMenu(false);return;} menu.hidden=false;trigger.setAttribute('aria-expanded','true'); options[effective==='2'?0:1].focus();
    });
    menu.addEventListener('keydown',function(event){
      var index=options.indexOf(document.activeElement), next;
      if(event.key==='ArrowDown')next=(index+1)%options.length;
      if(event.key==='ArrowUp')next=(index+options.length-1)%options.length;
      if(event.key==='Home')next=0; if(event.key==='End')next=options.length-1;
      if(next!==undefined){event.preventDefault();options[next].focus();}
    });
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!menu.hidden){closeMenu(true);}});
    document.addEventListener('pointerdown',function(event){if(!menu.hidden&&!wrapper.contains(event.target))closeMenu(false);});
    wrapper.append(trigger,menu); (document.getElementById('page-header')||document.body).appendChild(wrapper); update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  function clearBridge() {
    root.classList.remove('bonds-bootstrap-loading');
    var bridge=document.getElementById('bonds-bootstrap-critical');if(bridge)bridge.remove();
  }
  if(effective==='1'){clearBridge();return;}
  if(document.getElementById('bonds-os-css')||document.getElementById('bonds-os-js')){clearBridge();return;}
  var css=element('link'),js,timer,stopped=false,started=false;
  var suffix='?v='+encodeURIComponent(VERSION),base=BASE_URL.replace(/\/?$/,'/');
  css.id='bonds-os-css';css.rel='stylesheet';css.href=base+'bonds-os.css'+suffix;
  var early=element('style');early.id='bonds-os-critical';
  early.textContent='html.bonds-os-loading,html.bonds-os-loading body{background:#0b202b!important;color:#dcebf0!important}html.bonds-os-loading :is(#wrap,#page-body,#main-content,.headerbar,.post,.postbody,.postprofile,.panel,.forabg,.forumbg,.navbar){background-color:#0b202b!important;background-image:none!important;border-color:#365767!important}html.bonds-os-loading #page-header .navbar{visibility:hidden!important}html.bonds-os-loading #wrap{opacity:0!important;pointer-events:none!important}html.bonds-os-loading .postprofile{background:none!important}';
  document.head.appendChild(early);root.classList.add('bonds-os-loading');clearBridge();
  function clearEarly(){root.classList.remove('bonds-os-loading');early.remove();}
  function cleanListeners(){clearTimeout(timer);document.removeEventListener('bonds-os-ready',ready);document.removeEventListener('bonds-os-failed',rollback);document.removeEventListener('DOMContentLoaded',start);}
  function ready(){if(stopped)return;cleanListeners();clearEarly();effective='2';failure=false;update();}
  function rollback(){
    if(stopped)return;stopped=true;cleanListeners();clearEarly();clearBridge();
    root.classList.remove('bonds-os-preview');if(document.body)document.body.classList.remove('bonds-os-preview');
    css.remove();if(js)js.remove();effective='1';failure=true;update();
    var partial=!!root.dataset.bosInitialized, sessionSaved=false;
    try{sessionStorage.setItem(failKey,partial?'once':'classic');sessionSaved=true;}catch(_){}
    console.warn('[BONDS OS] Camada indisponível; usando a interface clássica. Preferência preservada.');
    if(partial){
      if(sessionSaved)location.reload();
      else {var fallbackURL=new URL(location.href);fallbackURL.searchParams.set('bondsos','fallback');location.replace(fallbackURL.href);}
    }
  }
  function start(){
    if(stopped||started)return;started=true;
    root.classList.add('bonds-os-preview');document.body.classList.add('bonds-os-preview');
    js=element('script');js.id='bonds-os-js';js.src=base+'bonds-os.js'+suffix;js.onerror=rollback;
    js.onload=function(){if(root.dataset.bosInitialized!=='ready')rollback();};
    document.addEventListener('bonds-os-ready',ready,{once:true});document.addEventListener('bonds-os-failed',rollback,{once:true});
    timer=setTimeout(rollback,20000);document.head.appendChild(js);
  }
  css.onerror=rollback;css.onload=function(){
    if(stopped)return;clearTimeout(timer);
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  };
  timer=setTimeout(rollback,20000);document.head.appendChild(css);
}());
