import {displayName} from './display-names.mjs';
import {ELEMENTS,markers} from './rules.mjs';
import {sheetSprite} from './sheet-art.mjs';
const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.\s]+$/,'').trim();
const supported=new Set(['eficiente','pesado','atordoador','venenoso','enfraquecedor','quebra-bloqueio','desorientador','imobilizador']);
const safeImage=s=>/^https?:\/\//i.test(s||'')?s:'';
export function adaptSheet(s,p,b,source){
 const warnings=[],forms={};
 const element=value=>{const name=['Água','Gelo','Água/Gelo'].some(v=>key(v)===key(value))?'Água/Gelo':ELEMENTS.find(v=>key(v)===key(value));if(!name)throw Error('Elemento não reconhecido nesta ficha: '+value);return name;};
 for(const [id,f] of Object.entries(s.digimonForms||{}))if(f.unlocked){
  const attrs=Object.fromEntries(Object.entries({power:'poder',heart:'coracao',intelligence:'inteligencia',agility:'agilidade'}).map(([a,v])=>[a,Number(f.attributes[v])]));
  if(Object.values(attrs).some(v=>!Number.isInteger(v)||v<1||v>12))throw Error('Atributos incompletos em '+f.name);
  const attacks=(f.signatureAttacks||[]).filter(a=>{if(['nome','ataque','nome do ataque'].includes(key(a.name))){warnings.push(f.name+': ataque ainda sem preenchimento na ficha; revise no LAB.');return false;}return true;}).map((a,i)=>{const effects=a.effects.map(e=>key(e.name).replace(/\(s\)$/,'')).map(e=>e==='atordoado'?'atordoador':e==='quebra bloqueio'?'quebra-bloqueio':e).filter(Boolean),unsupported=effects.filter(e=>!supported.has(e));if(unsupported.length||effects.length>1)warnings.push(a.name+': efeitos '+effects.join(', ')+' precisam de arbitragem do Narrador; só o primeiro efeito suportado é automático.');const missing=!a.element||/^[—–.\s]+$/.test(a.element);if(missing)warnings.push(a.name+': elemento não preenchido; adotado o elemento da espécie nesta sessão. Confira no LAB.');return {id:id+'-attack-'+i,name:displayName(a.name),rank:Number(a.rank),element:element(missing?f.element:a.element),effect:supported.has(effects[0])?effects[0]:null,sourceEffects:effects};});
  forms[id]={name:displayName(f.name),stage:id,element:element(f.element),digitalAttribute:['Vacina','Vírus','Data','Free','Variable','Unknown'].find(v=>key(v)===key(f.digital))||f.digital,image:sheetSprite(f.name,safeImage(f.image)),unlocked:true,attributes:attrs,qualities:(f.qualities||[]).map((q,i)=>({id:id+'-q-'+i,name:displayName(q.name),rank:Number(q.rank)})),attacks,combatBonuses:{hp:b.pv,damage:b.damage,dodge:b.dodge}};
  if(!safeImage(f.image))warnings.push(f.name+': sem imagem pública reconhecida; substitua o PNG no LAB.');
 }
 if(!forms.rookie)throw Error('Ficha sem forma Novato reconhecida.');
 const human={name:displayName(s.name),image:safeImage(s.humanImage),player:displayName(s.player),characteristics:{body:Number(s.human.corpo),mind:Number(s.human.mente),presence:Number(s.human.presenca)},talents:p.talents.filter(t=>t.name).map((t,i)=>({id:'talent-'+i,name:displayName(t.name),rank:t.rank})),energy:p.energy};
 if(Object.values(human.characteristics).some(v=>!Number.isInteger(v)||v<1||v>12))throw Error('Características do Humano incompletas.');
 return {forms,human,level:p.level,bond:p.bond,hp:Math.min(p.pv,markers(forms.rookie).hp),warnings:[...new Set(warnings)],source};
}
