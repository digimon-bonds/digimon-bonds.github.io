const status=document.querySelector('#sheet-message');
try{
 const encoded=location.hash.slice(1);
 if(!/^[A-Za-z0-9_-]+$/.test(encoded)||encoded.length>1000000)throw Error('Código visual de ficha inválido. Gere novamente em Transmissão.');
 const bytes=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 const reader=stream.getReader();let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000){await reader.cancel();throw Error('Ficha muito grande.');}chunks.push(value);}
 const tree=JSON.parse(await new Blob(chunks).text());
 const tags=new Set('article section div span small h2 h3 h4 p b strong em i br img button details summary'.split(' '));let count=0;
 function render(node,depth=0){
  if(++count>12000||depth>45)throw Error('Ficha muito grande.');
  if(typeof node==='string')return document.createTextNode(node);
  if(!node||!tags.has(node.tag)||!Array.isArray(node.children))throw Error('Elemento de ficha inválido.');
  const el=document.createElement(node.tag);
  for(const [key,value] of Object.entries(node.attrs||{})){
   if(typeof value!=='string'||!['id','class','role','aria-label','aria-live','aria-valuemin','aria-valuemax','aria-valuenow','aria-labelledby','aria-controls','aria-selected','tabindex','alt','hidden','open','data-preview-tab','data-stage','data-form-nav','data-forum-form','data-locked','data-hotspot','disabled','src'].includes(key))continue;
   if(key==='src'){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)continue;}
   el.setAttribute(key,value);
  }
  for(const child of node.children)el.append(render(child,depth+1));return el;
 }
 const sheet=render(tree);if(sheet.tagName!=='ARTICLE'||sheet.id!=='preview')throw Error('Ficha inválida.');
 status.replaceWith(sheet);await import('./forum-viewer.js');
}catch(error){status.textContent=error.message;}
