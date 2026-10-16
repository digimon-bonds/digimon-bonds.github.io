export const effectId=value=>String(typeof value==='object'?value?.name:value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
export const SIGNATURE_EFFECTS=['ataque-multiplo','atordoador','desorientador','eficiente','enfraquecedor','explosivo','multi-elemento','pesado','quebra-bloqueio','imobilizador','sobrecarregado','vampirismo','venenoso','curativo','animador'];
export const OPTIONAL_EFFECTS=['atordoador','enfraquecedor','quebra-bloqueio','venenoso','explosivo'];
export const effectsOf=signature=>[...new Set([...(signature?.effects||[]),...(signature?.sourceEffects||[]),signature?.effect].map(effectId).filter(Boolean))];
export const hasEffect=(signature,effect)=>effectsOf(signature).includes(effect);
export function effectTargetKey(signature,effect,targetId){return effect==='venenoso'?'venenoso':effect==='atordoador'?effect+':'+targetId:signature.id+':'+targetId+':'+effect;}
export const effectAvailable=(actor,signature,effect,targetId)=>!['atordoador','desorientador','enfraquecedor','quebra-bloqueio','venenoso'].includes(effect)||!(actor.effectTargets||[]).includes(effectTargetKey(signature,effect,targetId));
export const optionalEffects=(actor,signature,targetId)=>effectsOf(signature).filter(effect=>OPTIONAL_EFFECTS.includes(effect)&&effectAvailable(actor,signature,effect,targetId));
export function signatureElements(signature){return [...new Set([signature?.element,...(hasEffect(signature,'multi-elemento')?[...(signature?.elements||[]),...(signature?.effectDetails||[]).filter(e=>effectId(e)==='multi-elemento').map(e=>e.element)]:[])].filter(Boolean))];}
export function signatureUsePlan(actor,signature,{targets=1,overload=0,extraUse=false}={}){
 const uses=actor.uses[actor.formId]??0,firstFree=hasEffect(signature,'eficiente')&&!(actor.usedAttacks||[]).includes(signature.id),base=firstFree?0:1;
 if(!Number.isInteger(overload)||overload<0||overload>100||overload&&!hasEffect(signature,'sobrecarregado'))throw Error('Usos adicionais inválidos para Sobrecarregado.');
 if(!Number.isInteger(targets)||targets<1||targets>10||targets>1&&!hasEffect(signature,'ataque-multiplo'))throw Error('Ataque não permite esses alvos adicionais.');
 const additional=targets-1+overload,cost=base+additional;
 if(extraUse&&uses>0)throw Error('Segura Essa! só está disponível com os usos esgotados.');
 if(cost>uses){if(uses!==0||!extraUse||base!==1||additional)throw Error('Usos de Assinatura insuficientes.');return {uses:0,bond:1,firstFree};}
 return {uses:cost,bond:0,firstFree};
}
