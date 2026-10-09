import {ELEMENTS} from './rules.mjs';
const key=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
export const PROTOCOLS=['Troca de Elemento','Reforço de PV','Reforço de Esquiva','Reforço de Dano','Qualidade Temporária','Ataque Temporário'];
const FUNCTIONS=['Scanner','Detecção','Comunicação','Mapa','Armazenamento','Booster','Protocolos Especiais','Scanner de Cards'];
const effects=['eficiente','pesado','atordoador','venenoso','enfraquecedor','quebra-bloqueio','desorientador','imobilizador'];
export function normalizeDevices(devices=[]){return devices.flatMap((d,i)=>{const name=FUNCTIONS.find(n=>key(n)===key(d.name));if(!name)return [];return [{id:'device-'+i,name,rank:Number(d.rank),protocol:PROTOCOLS.find(n=>key(n)===key(d.protocol))||'',detail:String(d.detail||'').trim()}];});}
// Read only numbered upgrade slots, never mentions in prose or rule explanations.
export function readDeviceSlots(text){const out=[];for(const line of text.split(/\r?\n/)){const m=line.trim().match(/^\d{1,2}\s*[.)]\s*(.*?)\s*\|\s*N[ií]vel\s*(\d)(?:\s*\|\s*(.*))?\s*$/i);if(!m)continue;const [protocol,...detail]=(m[3]||'').split(/\s+[—–]\s+/);out.push({name:m[1],rank:Number(m[2]),protocol,detail:detail.join(' — ')});}return normalizeDevices(out);}
function protocolParameters(d){
 if(d.protocol==='Troca de Elemento'){const element=ELEMENTS.find(e=>key(e)===key(d.detail));return element?{element}:{error:'Elemento de aquisição não reconhecido na ficha.'};}
 if(d.protocol==='Qualidade Temporária')return d.detail?{quality:d.detail.replace(/\s*\|?\s*(?:rank|r)\s*2\.?$/i,'').trim()}:{error:'Qualidade de aquisição não registrada.'};
 if(d.protocol==='Ataque Temporário'){const [name,elementText,effectText]=d.detail.split('|').map(s=>s.trim());const element=ELEMENTS.find(e=>key(e)===key(elementText)),effect=effects.find(e=>key(e)===key(effectText));return name&&element&&(!effectText||effect)?{attack:{name,element,effect:effect||null}}:{error:'Registre o ataque na ficha como Nome | Elemento | Efeito (opcional).'};}
 return PROTOCOLS.includes(d.protocol)?{}:{error:'Protocolo não reconhecido na ficha.'};
}
export function digiviceOptions(human,level){
 const installed=normalizeDevices(human?.devices),valid=installed.length<=Math.max(0,level-1)&&installed.every(d=>Number.isInteger(d.rank)&&d.rank>=1&&d.rank<=(d.name==='Mapa'?2:3))&&FUNCTIONS.every(name=>{const ranks=installed.filter(d=>d.name===name).map(d=>d.rank).sort();return ranks.every((rank,i)=>rank===i+1);});
 const devices=valid?installed:[],rank=Math.max(0,...devices.filter(d=>d.name==='Booster').map(d=>d.rank)),used=human?.digiviceUses||{};
 return {error:valid?'':'Melhorias incompatíveis com o nível de Laço. Confira a ficha.',booster:{rank,limit:rank===3?2:rank?1:0,used:used.booster||0},protocols:devices.filter(d=>d.name==='Protocolos Especiais').map(d=>({...d,...protocolParameters(d),used:!!used[d.id]})),scanner:devices.some(d=>d.name==='Scanner de Cards')};
}
export function effectiveForm(actor){const base=actor.forms[actor.formId],buffs=actor.digiviceProtocols||[];if(!buffs.length)return base;const f=structuredClone(base);f.combatBonuses||={};for(const b of buffs){
 if(b.protocol==='Troca de Elemento'){f.element=b.element;f.attacks.forEach(a=>a.element=b.element);}
 if(b.protocol==='Reforço de PV')f.combatBonuses.hp=(f.combatBonuses.hp||0)+10;
 if(b.protocol==='Reforço de Esquiva')f.combatBonuses.dodge=(f.combatBonuses.dodge||0)+1;
 if(b.protocol==='Reforço de Dano')f.combatBonuses.damage=(f.combatBonuses.damage||0)+2;
 if(b.protocol==='Qualidade Temporária')f.qualities.push({id:b.id,name:b.quality,rank:2});
 if(b.protocol==='Ataque Temporário')f.attacks.push({...b.attack,id:b.id,rank:Math.max(1,...base.attacks.map(a=>a.rank)),temporary:true});
 }return f;}
export function digiviceModifiers(actor,kind,mod){if(actor.boosterNext===kind)mod.advantages.push('Booster');return mod;}
export function expireProtocols(actor){for(const b of actor.digiviceProtocols||[])if(b.protocol==='Reforço de PV')actor.hp=Math.max(0,actor.hp-10);delete actor.digiviceProtocols;}
