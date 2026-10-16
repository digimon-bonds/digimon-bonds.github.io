import {SIGNATURE_EFFECTS} from './signature-effects.mjs';
const key=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
export const automaticEffects=SIGNATURE_EFFECTS;
const manualEffects=['ataque-multiplo','explosivo','multi-elemento','sobrecarregado','curativo','animador'];
export function npcSignature(line,index=0){
 const [name,rank,element,effectText='']=line.split('|').map(s=>s.trim());
 const details=effectText.split(/[;,]/).map(text=>text.trim()).filter(Boolean).map(text=>{const [name,element]=text.split(':').map(value=>value.trim());const effect=key(name);if(!SIGNATURE_EFFECTS.includes(effect))throw Error('Efeito desconhecido: escolha um efeito na lista.');return {name:effect,...(element?{element}:{})};});
 const sourceEffects=details.map(effect=>effect.name);return {id:'attack-'+index,name,rank:Number(rank),element,effect:sourceEffects[0]||null,sourceEffects,effectDetails:details,elements:[element,...details.filter(effect=>effect.name==='multi-elemento').map(effect=>effect.element).filter(Boolean)]};
}
