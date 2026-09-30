const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const tags=new Set('article section div span small h2 h3 h4 p b strong em i br img button details summary'.split(' '));
export function renderTree(node,depth=0,budget={n:0}){
 if(++budget.n>12000||depth>45)throw Error('Ficha muito grande');
 if(typeof node==='string')return esc(node);
 if(!node||!tags.has(node.tag)||!Array.isArray(node.children))throw Error('Elemento inválido');
 let attrs='';
 for(const [key,value] of Object.entries(node.attrs||{})){
  if(typeof value!=='string')continue;
  if(key==='src'){let u;try{u=new URL(value);}catch{continue;}if(u.protocol!=='https:'||u.username||u.password)continue;}
  else if(!['id','class','role','aria-label','aria-live','aria-valuemin','aria-valuemax','aria-valuenow','aria-labelledby','aria-controls','aria-selected','tabindex','alt','hidden','open','data-preview-tab','data-stage','data-form-nav','data-forum-form','data-locked','data-hotspot','disabled'].includes(key))continue;
  attrs+=' '+key+'="'+esc(value)+'"';
 }
 const content=node.children.map(n=>renderTree(n,depth+1,budget)).join('');
 return '<'+node.tag+attrs+'>'+(['img','br'].includes(node.tag)?'':content+'</'+node.tag+'>');
}
export function sheetDocument(tree){return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Digimon Bonds — Ficha de Personagem</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/forum-viewer.css"></head><body>'+renderTree(tree)+'<script src="/forum-viewer.js" defer></script></body></html>';}
