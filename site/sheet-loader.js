import {apiURL} from './hosting.js';
const status=document.querySelector('#sheet-message');
try{
 const id=new URL(location.href).searchParams.get('id');
 if(!/^[a-f0-9]{64}$/.test(id||''))throw Error('Código de ficha inválido.');
 const response=await fetch(apiURL('/api/forum-sheets/'+id));
 if(!response.ok)throw Error('Não foi possível consultar a ficha. Recarregue para tentar novamente.');
 const data=await response.json();
 if(typeof data.html!=='string')throw Error('Este arquivo não contém uma ficha visual.');
 const doc=new DOMParser().parseFromString(data.html,'text/html'),sheet=doc.querySelector('article#preview');
 if(!sheet)throw Error('Ficha não encontrada no arquivo.');
 const tags=new Set('ARTICLE SECTION DIV SPAN SMALL H2 H3 H4 P B STRONG EM I BR IMG BUTTON DETAILS SUMMARY'.split(' '));
 for(const el of [sheet,...sheet.querySelectorAll('*')]){
  if(!tags.has(el.tagName)){el.remove();continue;}
  for(const attr of [...el.attributes])if(!/^(id|class|role|aria-[a-z-]+|tabindex|alt|hidden|open|data-[a-z-]+|disabled|src)$/.test(attr.name))el.removeAttribute(attr.name);
  if(el.hasAttribute('src')){const url=new URL(el.getAttribute('src'),location.href);if(url.protocol!=='https:'||url.username||url.password)el.removeAttribute('src');}
 }
 status.replaceWith(document.importNode(sheet,true));
 await import('./forum-viewer.js');
}catch(error){status.textContent=error.message;}
