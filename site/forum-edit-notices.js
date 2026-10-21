import {forumProfileId} from './forum-owner.js';

export function isOmegamonEditNotice(text,editorHref=''){
 const normalized=String(text||'').replace(/\s+/g,' ').trim();
 const match=normalized.match(/^Última edição por (.+) em .+, editado \d+ vez(?:\(es\)|es)?$/i);
 if(!match)return false;
 const id=forumProfileId(editorHref);
 return id?id==='1':match[1].toLocaleLowerCase('pt-BR')==='omegamon';
}

// Only native edit metadata is hidden; message contents and player notices stay intact.
export function hideOmegamonEditNotices(doc){
 for(const notice of doc.querySelectorAll('.post .postbody > .edicao')){
  const editor=notice.querySelector('a[href]');
  if(!isOmegamonEditNotice(notice.textContent,editor?.getAttribute('href')))continue;
  notice.hidden=true;notice.style.setProperty('display','none','important');
 }
}
