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
export function embedCode(url){return '<iframe src="'+url+'" title="Ficha de Personagem — Digimon Bonds" width="100%" height="900" frameborder="0" scrolling="yes" loading="lazy" style="display:block;width:100%;max-width:860px;height:900px;margin:0 auto;border:0;border-radius:16px;"></iframe>';}
