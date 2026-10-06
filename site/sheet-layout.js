// Shared presentation for the editor preview and previously published sheets.
export function styleSheet(root){
 if(!root)return;
 for(const row of root.querySelectorAll('#preview-panel-digimon .data-row')){
  const label=row.querySelector('b')?.textContent.trim();
  if(label==='NOME'||label==='ESTÁGIO')for(const node of row.childNodes){if(node.nodeType===3&&node.textContent.trim()===node.textContent.trim().toLocaleUpperCase('pt-BR'))node.textContent=node.textContent.toLocaleLowerCase('pt-BR').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('pt-BR'));}
 }
 for(const history of root.querySelectorAll('.history'))history.classList.add('sheet-card','history-card');
 for(const bar of root.querySelectorAll('.bar')){
  if(bar.classList.contains('energy-card'))continue;
  const match=bar.textContent.match(/(\d+)\s*\/\s*(\d+)/);if(!match)continue;
  const current=Number(match[1]),max=Number(match[2]);bar.classList.add('energy-card');bar.textContent='';
  const caption=document.createElement('div');caption.className='energy-caption';
  const label=document.createElement('span');label.textContent='Reserva de energia';
  const value=document.createElement('strong');value.textContent=current+' / '+max;caption.append(label,value);
  const track=document.createElement('div');track.className='energy-track';track.setAttribute('role','progressbar');track.setAttribute('aria-label','Energia');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(max));track.setAttribute('aria-valuenow',String(current));
  for(let i=0;i<20;i++){const segment=document.createElement('span');if(i<Math.round(Math.max(0,Math.min(1,current/(max||1)))*20))segment.className='charged';track.append(segment);}
  bar.append(caption,track);
 }
 const card=(row,type='')=>{if(row.closest('.sheet-card'))return;const box=document.createElement('div');box.className='sheet-card '+type;row.before(box);box.append(row);};
 for(const heading of root.querySelectorAll('.sheet-section')){
  if(heading.textContent.trim()!=='LAÇO E PROGRESSÃO'||heading.closest('.progression-card'))continue;
  const box=document.createElement('section');box.className='sheet-card progression-card';heading.before(box);
  let next=heading.nextElementSibling;box.append(heading);
  while(next&&(next.classList.contains('data-row')||next.classList.contains('sheet-stats'))){const after=next.nextElementSibling;box.append(next);next=after;}
 }
 for(const heading of root.querySelectorAll('.sheet-section')){
  const title=heading.textContent.trim();
  if(title==='CARACTERÍSTICAS'){
   const stats=heading.nextElementSibling;
   if(stats?.classList.contains('sheet-stats')&&!heading.closest('.sheet-card')){
    const box=document.createElement('section');box.className='sheet-card grouped-section characteristics-card';heading.before(box);box.append(heading,stats);
   }
   continue;
  }
  if(!['TALENTOS','TRAÇOS DO PERSONAGEM','QUALIDADE','QUALIDADES'].includes(title))continue;
  const rows=[];let next=heading.nextElementSibling;while(next?.classList.contains('data-row')){rows.push(next);next=next.nextElementSibling;}
  if(!rows.length)continue;
  const group=document.createElement('div');group.className='sheet-card-grid'+(title==='TRAÇOS DO PERSONAGEM'?' sheet-traits':'');heading.after(group);
  const box=document.createElement('section');box.className='sheet-card grouped-section '+(title==='TRAÇOS DO PERSONAGEM'?'traits-card':'named-section');heading.before(box);box.append(heading,group);
  for(const row of rows){group.append(row);card(row,title==='TRAÇOS DO PERSONAGEM'?'trait-card':'named-card');}
 }
 for(const row of root.querySelectorAll('.data-row')){
  const label=row.querySelector('b')?.textContent.trim();
  if(label==='NOME'){row.classList.add('sheet-name');}
  if(label==='PERSONALIDADE & CARACTERÍSTICAS'||(label==='PERSONALIDADE'&&row.closest('#preview-panel-digimon')))card(row,'description-card');
 }
 for(const panel of root.querySelectorAll('#preview-panel-digimon,#preview-form-panel,[data-forum-form]')){
  const name=[...panel.children].find(el=>el.classList.contains('sheet-name'));if(!name||name.closest('.sheet-card'))continue;
  const box=document.createElement('div');box.className='sheet-card partner-identity-card';name.before(box);
  let row=name;while(row?.classList.contains('data-row')){const next=row.nextElementSibling;box.append(row);row=next;}
 }
}
