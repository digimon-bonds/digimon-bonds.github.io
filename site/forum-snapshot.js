import {stageOrder} from './forms.js';
export function captureSheet(){const sheet=document.getElementById('preview');if(!sheet)throw Error('O preview da ficha não está disponível.');return sheet.cloneNode(true);}
export function snapshotTree(sheet,images,snapshots,state){
 sheet.removeAttribute('style');
 const panel=sheet.querySelector('#preview-panel-digimon');
 panel.querySelector('#preview-form-panel')?.remove();
 for(const stage of stageOrder){
  const source=snapshots[stage].querySelector('#preview-form-panel').cloneNode(true);
  source.id='forum-form-'+stage;source.dataset.forumForm=stage;source.dataset.locked=String(!state.digimonForms[stage].unlocked);source.hidden=stage!==state.activeDigimonStage;
  source.setAttribute('aria-labelledby','preview-stage-'+stage);
  source.querySelectorAll('.partner-device').forEach(el=>{
   const wrap=document.createElement('div');wrap.className='forum-device';
   const img=document.createElement('img');img.className='forum-device-image';img.src=images[stage];img.alt=state.digimonForms[stage].unlocked?'Digivice e parceiro digital':'Digivice — dados bloqueados';wrap.append(img);
   el.querySelectorAll('.device-hotspot').forEach(b=>wrap.append(b.cloneNode(true)));
   el.replaceWith(wrap);
  });
  panel.append(source);
 }
 sheet.querySelectorAll('[data-stage]').forEach(b=>{b.setAttribute('aria-controls','forum-form-'+b.dataset.stage);b.removeAttribute('data-context');});
 const status=document.createElement('div');status.id='form-status';status.className='hint';status.setAttribute('role','status');status.setAttribute('aria-live','aria-valuemin','aria-valuemax','aria-valuenow','polite');panel.querySelector('.stage-navigation').after(status);
 sheet.querySelectorAll('svg,script,style').forEach(el=>el.remove());
 const attrs=['id','class','role','aria-label','aria-live','aria-labelledby','aria-controls','aria-selected','tabindex','alt','hidden','open','src','data-preview-tab','data-stage','data-form-nav','data-forum-form','data-locked','disabled'];
 function tree(node){if(node.nodeType===3)return node.textContent;if(node.nodeType!==1)return '';const pairs=attrs.filter(k=>node.hasAttribute(k)).map(k=>[k,node.getAttribute(k)]);if(node.classList.contains('device-hotspot'))pairs.push(['data-hotspot',['left','top','width','height'].map(k=>parseFloat(node.style[k])).join(',')]);return {tag:node.localName,attrs:Object.fromEntries(pairs),children:[...node.childNodes].map(tree)};}
 return tree(sheet);
}
export function embedCode(url,height){if(!Number.isFinite(height)||height<1)throw Error('Altura da ficha indisponível. Gere o código novamente.');height=Math.ceil(height);return '<iframe src="'+url+'?embed=full" title="Ficha de Personagem — Digimon Bonds" width="100%" height="'+height+'" frameborder="0" scrolling="no" loading="lazy" style="display:block;width:100%;max-width:860px;height:'+height+'px;margin:0 auto;border:0;border-radius:16px;"></iframe>';}
// Measure every tab and expanded register at narrow and wide forum widths.
// A cross-origin post cannot resize its parent iframe without forum-side JavaScript.
export async function measureForumHeight(tree){
 const frame=document.createElement('iframe');frame.title='Preparação da ficha';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-10000px;top:0;width:280px;height:1px;border:0;pointer-events:none;';document.body.append(frame);
 try{
  const doc=frame.contentDocument;
  doc.open();doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');doc.close();
  await Promise.all(['style.css','forum-viewer.css'].map(file=>new Promise((resolve,reject)=>{const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL(file,location.href).href;link.onload=resolve;link.onerror=()=>reject(Error('Não foi possível medir o estilo da ficha.'));doc.head.append(link);}))); 
  function build(n){if(typeof n==='string')return doc.createTextNode(n);const el=doc.createElement(n.tag);for(const [k,v] of Object.entries(n.attrs))el.setAttribute(k,v);n.children.forEach(c=>el.append(build(c)));return el;}
  const sheet=build(tree);doc.body.append(sheet);sheet.querySelectorAll('details').forEach(d=>d.open=true);
  await Promise.all([...sheet.querySelectorAll('img')].map(img=>Promise.race([img.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,8000))])));
  let height=0;const human=sheet.querySelector('#preview-panel-human'),digimon=sheet.querySelector('#preview-panel-digimon'),forms=[...sheet.querySelectorAll('[data-forum-form]')];
  for(const width of [280,480,860]){frame.style.width=width+'px';human.hidden=false;digimon.hidden=true;height=Math.max(height,sheet.scrollHeight);human.hidden=true;digimon.hidden=false;for(const form of forms){forms.forEach(f=>f.hidden=f!==form);height=Math.max(height,sheet.scrollHeight);}}
  return Math.ceil(height)+128;
 }finally{frame.remove();}
}
