import {apiURL} from './hosting.js';
import {fresh,parseProject,parseCharacterCode} from './rules.js';
import {initializeForms,stageOrder,blankForm} from './forms.js';
import {species,effects} from './catalog.js';
import {archetypes} from './archetypes.js';
export function sheetId(raw){const text=raw.trim();const match=text.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);const value=match?match[1].replaceAll('&amp;','&'):text;let url;try{url=new URL(value);}catch{return null;}if(url.origin!=='https://bonds-character-app.mateuzim-alves.chatgpt.site'||!/^\/sheets\/[a-f0-9]{64}$/.test(url.pathname))throw Error('Use o código ou link de uma ficha publicada pelo Bonds Terminal.');return url.pathname.split('/').pop();}
export async function recoverCharacter(raw,current){if(!raw.trim())throw Error('Cole o código da ficha anterior.');if(raw.length>2000000)throw Error('Código muito grande.');const id=sheetId(raw);if(!id)return {state:parseCharacterCode(raw,current),warning:''};const response=await fetch(apiURL('/api/forum-sheets/'+id));if(!response.ok)throw Error(response.status===404?'Ficha não encontrada. Confira se o código está completo.':'Não foi possível consultar a ficha. Tente novamente.');const data=await response.json();if(data.project)return {state:parseProject(data.project),warning:''};return {state:recoverLegacySheet(data.html),warning:'Código antigo: os textos e atributos disponíveis foram recuperados. Confira as imagens originais, cores e acabamento do Digivice e a progressão: esses dados não eram guardados no post antigo.'};}
export function recoverLegacySheet(html){
 const doc=new DOMParser().parseFromString(html,'text/html'),root=doc.querySelector('#preview');if(!root)throw Error('Este código antigo não contém uma ficha reconhecível.');
 const clean=v=>v?.trim()==='—'?'':v?.trim()||'';
 const row=(panel,label)=>{const el=[...panel.querySelectorAll('.data-row')].find(r=>r.querySelector('b')?.textContent.trim()===label);if(!el)return '';return clean([...el.childNodes].filter(n=>n!==el.querySelector('b')).map(n=>n.textContent).join(''));};
 const s=fresh(),human=root.querySelector('#preview-panel-human');if(!human)throw Error('Seção Humano ausente.');
 s.player=clean(root.querySelector('.sheet-player strong')?.textContent);for(const [key,label] of Object.entries({name:'NOME',age:'IDADE',personality:'PERSONALIDADE',flaw:'FALHA',wish:'DESEJO',item:'ITEM ESPECIAL',things:'COISAS'}))s[key]=row(human,label);
 s.archetype=archetypes.find(a=>a.name.toLocaleUpperCase()===row(human,'ARQUÉTIPO').toLocaleUpperCase())?.id||'';s.talent=row(human,'TALENTO // RANK 1');s.history=clean(human.querySelector('.history')?.textContent);s.humanImage=human.querySelector('.human-portrait img')?.getAttribute('src')||'';
 const stats=(panel,keys,selector)=>{const nodes=[...panel.querySelectorAll(selector+' > div')];return Object.fromEntries(keys.map((k,i)=>[k,Number(nodes[i]?.querySelector('strong')?.textContent)||1]));};s.human=stats(human,['mente','corpo','presenca'],'.sheet-stats');
 initializeForms(s);
 for(const stage of stageOrder){const panel=root.querySelector('[data-forum-form="'+stage+'"]');if(!panel||panel.dataset.locked==='true')continue;const f=blankForm(stage);f.unlocked=true;for(const [key,label] of Object.entries({name:'NOME',digital:'ATRIBUTO DIGITAL',element:'ELEMENTO',classification:'CLASSIFICAÇÃO'}))f[key]=row(panel,label);f.personality=row(panel,'PERSONALIDADE & CARACTERÍSTICAS')||row(panel,'PERSONALIDADE');f.attributes=stats(panel,['poder','coracao','inteligencia','agilidade'],'.sheet-stats.four');
 const catalog=species.find(x=>x.name.toUpperCase()===f.name.toUpperCase());f.image=catalog?.image||'';
 f.qualities=[...panel.querySelectorAll('.data-row')].filter(el=>/^RANK \d$/.test(el.querySelector('b')?.textContent.trim()||'')).map(el=>({name:clean([...el.childNodes].slice(1).map(n=>n.textContent).join('')),rank:Number(el.querySelector('b').textContent.match(/\d/)[0])}));
 f.signatureAttacks=[...panel.querySelectorAll('.signature-card')].map(card=>{const label=card.querySelector('b')?.textContent.trim()||'';const effect=row(card,'EFEITOS');return {name:row(card,label),rank:Number(label.match(/RANK (\d)/)?.[1])||1,element:row(card,'ELEMENTO'),effects:effect.split(';').filter(Boolean).map(value=>({name:effects.find(e=>value.trim().startsWith(e.name))?.name||'',element:value.match(/\(([^)]+)\)/)?.[1]||''}))};});
 // Evolved previews include inherited attacks; keep only this stage's rank.
 const rank={baby:0,rookie:1,champion:2,ultimate:3,mega:4}[stage];if(stage!=='rookie')f.signatureAttacks=f.signatureAttacks.filter(a=>a.rank===rank);
 s.digimonForms[stage]=f;
 if(stage==='rookie'){Object.assign(s,{digiName:catalog?.name||f.name,digiImage:f.image,digiPersonality:f.personality,digital:f.digital,element:f.element,classification:f.classification,digi:f.attributes,quality:f.qualities[0]?.name||'',attack:f.signatureAttacks[0]?.name||'',attackElement:f.signatureAttacks[0]?.element||'',effect:f.signatureAttacks[0]?.effects[0]?.name||'',effectElement:f.signatureAttacks[0]?.effects[0]?.element||''});}
 }
 s.activeDigimonStage='rookie';return initializeForms(s);
}
