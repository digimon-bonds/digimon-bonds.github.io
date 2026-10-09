import {readDeviceSlots} from './digivice.mjs';
import {displayName} from './display-names.mjs';
import {recoverTableCharacter} from '/creator/table-import.js';
import {restoreEmbeddedCode} from '/creator/code-archive.js';
import {recoverLegacySheet} from '/creator/recovery.js';
import {progress,projectedForm,bonuses} from '/creator/progression.js';
import {normalizeElement} from '/creator/catalog.js';
import {adaptSheet} from './sheet-adapter.mjs';
import {selectableSpecies} from '/creator/species-selection.js';
import {speciesKey} from '/creator/import-labels.js';

// Public posts are parsed in an inert document; no forum markup is mounted.
export function toBBCode(node){
 if(node.nodeType===3)return node.textContent.replace(/\u00a0/g,' ');
 if(node.nodeType!==1)return '';
 const tag=node.tagName.toLowerCase();if(['script','style','iframe','object','embed'].includes(tag))return '';
 if(tag==='img'){let url=node.getAttribute('src')||'';if(url.startsWith('//'))url='https:'+url;return /^https?:\/\//i.test(url)?'[img]'+url+'[/img]':'';}
 if(tag==='br')return '\n';
 if(tag==='dl'&&node.classList.contains('spoiler'))return '[spoiler='+node.querySelector('dt')?.textContent.trim().replace(/:$/,'')+']'+[...node.querySelector('dd').childNodes].map(toBBCode).join('')+'[/spoiler]';
 const content=[...node.childNodes].map(toBBCode).join(''),bb={strong:'b',b:'b',table:'table',tr:'tr',td:'td',th:'td'}[tag];
 if(bb==='b'&&/^(?:Nome|Idade|Arquétipo|Habilidade de Arquétipo|Atributo Digital|Elemento|Classificação|Mente|Corpo|Presença|Poder|Coração|Inteligência|Agilidade|Talento|Falha|Desejo|Item Especial|Coisas):/i.test(content)){const colon=content.indexOf(':');return '[b]'+content.slice(0,colon+1)+'[/b]'+content.slice(colon+1);}
 return bb?'['+bb+']'+content+'[/'+bb+']':content+(['p','div'].includes(tag)?'\n':'');
}
export function parsePublicSheet(html,source){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const posts=[...doc.querySelectorAll('.postbody')];
 for(const post of posts){
  let s=restoreEmbeddedCode(post.outerHTML);
  const inferred=[];
  if(!s){let raw=toBBCode(post);
   // A few public sheets leave the species label blank but identify the species
   // unambiguously with its official Reference Book image. Expose that inference.
   raw=raw.replace(/\[spoiler=NOVATO\s*\/\s*ROOKIE\]([\s\S]*?)\[\/spoiler\]/i,(whole,body)=>{if(/\[b\]Nome:\[\/b\]\s*(?=\[b\])/i.test(body)){const file=body.match(/https:\/\/digimon\.net\/cimages\/digimon\/([\w-]+)\.(?:jpg|png)/i)?.[1];const matches=file?selectableSpecies('rookie').filter(d=>speciesKey(d.name)===speciesKey(file)):[];if(matches.length===1){body=body.replace(/(\[b\]Nome:\[\/b\])\s*(?=\[b\])/i,'$1 '+matches[0].name+'\n');inferred.push('Nome da espécie ausente: '+matches[0].name+' identificado pela imagem oficial; confira.');}}return '[spoiler=NOVATO / ROOKIE]'+body+'[/spoiler]';});
   s=recoverTableCharacter(raw);}
  if(!s&&post.querySelector('#preview'))s=recoverLegacySheet(post.innerHTML);
  if(!s)continue;
  const p=progress(s),forms={};if(!p.devices.length)p.devices=readDeviceSlots(toBBCode(post).replace(/\[\/(?:td|tr)\]/gi,'\n').replace(/\[[^\]]*\]/g,''));for(const [stage,f] of Object.entries(s.digimonForms||{}))if(f.unlocked)forms[stage]=projectedForm(s,stage,p);
  const normalized={...s,digimonForms:forms};for(const [stage,f] of Object.entries(forms)){f.name=displayName(f.name,selectableSpecies(stage).map(d=>d.name));f.element=normalizeElement(f.element);for(const a of f.signatureAttacks)a.element=normalizeElement(a.element);}
  const result=adaptSheet(normalized,p,bonuses(p),source);result.warnings.push(...inferred);return result;
 }
 throw Error('Formato desta ficha ainda não reconhecido. A cena foi preservada; confira a ficha no fórum.');
}
