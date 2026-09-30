import {effects,elements} from './catalog.js';
export const progressionSource='https://digimonbonds.forumeiros.com/t16-07-experiencia-e-progressao';
export const deviceLimits={Scanner:3,'Detecção':3,'Comunicação':3,Mapa:2,Armazenamento:3,Booster:3,'Protocolos Especiais':3,'Scanner de Cards':3};
export const improvementNames=['Resistência','Força','Defesa','Técnica'];
export const majorNames={talent:'Novo Talento',quality:'Nova Qualidade',effect:'Novo Efeito de Ataque',attack:'Rank de Ataque',minor:'Opção de Atualização Menor'};
export const protocols=['Troca de Elemento','Reforço de PV','Reforço de Esquiva','Reforço de Dano','Qualidade Temporária','Ataque Temporário'];
export const stages={Novato:{level:1,min:1,total:12,max:4,hpBase:5,hpHeart:3,damage:2,dodge:1,rank:1},Campeão:{level:2,min:2,total:14,max:5,hpBase:10,hpHeart:4,damage:2,dodge:1,rank:2},Perfeito:{level:5,min:2,total:16,max:6,hpBase:15,hpHeart:5,damage:3,dodge:1,rank:3},Mega:{level:8,min:2,total:18,max:6,hpBase:20,hpHeart:6,damage:4,dodge:2,rank:4}};
export function formStats(p,form){const r=stages[form.stage],b=bonuses(p);return {pv:r.hpBase+r.hpHeart*form.digi.coracao+b.pv,damage:r.damage*form.digi.poder+b.damage,dodge:form.digi.agilidade+r.dodge+b.dodge,uses:form.digi.inteligencia+b.uses};}
export function allAttacks(p,s){return [{stage:'Novato',name:s.attack,rank:p.attackRank,element:s.attackElement||s.element,effects:p.effects},...p.forms.map(f=>({stage:f.stage,...f.attack}))]}
const fail=m=>{throw Error(m)};
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const text=v=>typeof v==='string'&&v.trim().length>0;
export function progress(s){
 const p={level:1,exp:0,energy:10,bond:6,broken:false,pv:5+3*s.digi.coracao,talents:[{name:s.talent,rank:1}],qualities:[{name:s.quality,rank:1,stage:'Novato'}],forms:[],attackRank:1,effects:[{name:s.effect,element:s.effectElement||''}],devices:[],improvements:[],pending:[],lastMajor:'',lastAttribute:'',history:[]};
 for(const event of s.updates||[])applyEvent(p,event,s);
 return p;
}
export function bonuses(p){return {pv:p.improvements.filter(x=>x==='Resistência').length*5,damage:p.improvements.filter(x=>x==='Força').length*2,dodge:p.improvements.filter(x=>x==='Defesa').length,uses:p.improvements.filter(x=>x==='Técnica').length}}
function minor(p,e){const list=e.target==='talent'?p.talents:e.target==='quality'?p.qualities:null;if(!list||!integer(e.index,0,list.length-1))fail('Escolha um Talento ou uma Qualidade existente.');if(list[e.index].rank>=3)fail('Rank máximo 3.');list[e.index].rank++;return `${list[e.index].name}: Rank ${list[e.index].rank}`}
function applyEvent(p,e,s){
 if(!e||typeof e!=='object'||Array.isArray(e)||!text(e.type))fail('Registro de Update inválido.');
 let description='';
 if(e.type==='exp'){
  if(p.pending.length)fail('Conclua as melhorias pendentes antes de registrar outra recompensa.');
  if(p.level===10)fail('Nível 10: limite normal de progressão.');
  if(!text(e.reason)||!integer(e.amount,1,1000000))fail('Informe uma origem e EXP inteira positiva.');
  const expected={'Progressão Natural':3,Desejo:1,'Grande Conquista':8,'Quebra de Laço':5};
  if(e.reason in expected&&e.amount!==expected[e.reason])fail('EXP diferente do valor canônico dessa recompensa.');
  const extra=e.extra??0;if(!integer(extra,0,1000000))fail('EXP extra deve ser inteira e não negativa.');if(extra&&!text(e.extraReason))fail('Descreva a origem da EXP extra concedida pelo Narrador.');
  if(p.exp+e.amount+extra>(10-p.level)*10)fail('Essa recompensa ultrapassa o limite normal de Nível 10. Solicite ao Narrador o destino da EXP após o limite.');
  if(e.reason==='Quebra de Laço'){if(!p.broken)fail('Não há Quebra de Laço ativa.');p.broken=false;p.bond=0;}
  if(e.reason==='Desejo'){p.bond--;if(p.bond<=-6)p.broken=true;}
  let remaining=e.amount+extra;
  while(remaining>0){const previous=p.exp,added=Math.min(remaining,10-p.exp);p.exp+=added;remaining-=added;if(previous<5&&p.exp>=5)p.pending.push('minor');if(p.exp===10){p.level++;p.exp=0;if(!p.broken)p.bond=5+p.level;p.pending.push('major');if([2,4,6,8].includes(p.level))p.pending.push('attribute');p.pending.push('device');}}
  description=`${e.reason}: +${e.amount} EXP${extra?` + ${extra} EXP extra (${e.extraReason})`:""} → Laço ${p.level}, ${p.exp}/10 EXP${text(e.reference)?" / "+e.reference:""}`;
 }else if(e.type==='upgrade'){
  const kind=p.pending[0];if(!kind)fail('Não há melhoria pendente.');
  if(kind==='minor')description='Atualização Menor — '+minor(p,e);
  if(kind==='major'){
   if(!Object.hasOwn(majorNames,e.choice))fail('Escolha uma Atualização Maior.');
   if(p.lastMajor===e.choice)fail('A mesma Atualização Maior não pode ser escolhida duas vezes consecutivas.');
   if(e.choice==='minor')description=minor(p,e);
   if(['talent','quality'].includes(e.choice)){const list=e.choice==='talent'?p.talents:p.qualities,stage=e.stage||'Novato';if(e.choice==='quality'&&stage!=='Novato'&&!p.forms.some(f=>f.stage===stage))fail('Registre primeiro essa forma.');if(!text(e.name))fail('Informe o nome da nova capacidade.');if(list.some(v=>v.name.toLocaleLowerCase()===e.name.trim().toLocaleLowerCase()&&(e.choice==='talent'||v.stage===stage)))fail('Essa capacidade já existe.');list.push({name:e.name.trim(),rank:1,...(e.choice==='quality'?{stage}:{})});description=`${e.name.trim()}: Rank 1${e.choice==='quality'?' ('+stage+')':''}`;}
   const attackStage=e.attackStage||'Novato',form=p.forms.find(f=>f.stage===attackStage),attack=attackStage==='Novato'?{name:s.attack,rank:p.attackRank,element:s.attackElement||s.element,effects:p.effects}:form?.attack;
   if(['attack','effect'].includes(e.choice)&&!attack)fail('Escolha um Ataque existente.');
   if(e.choice==='attack'){if(!['Novato','Campeão'].includes(attackStage)||attack.rank>=3)fail('Somente Ataques de Novato ou Campeão, até Rank 3.');if(attackStage==='Novato')p.attackRank++;else attack.rank++;description=`${attack.name}: Rank ${attackStage==='Novato'?p.attackRank:attack.rank}`;}
   if(e.choice==='effect'){if(attack.effects.length>=3)fail('Máximo de 3 Efeitos por Ataque.');if(!effects.some(x=>x.name===e.name))fail('Escolha um Efeito da lista canônica.');if(e.name!=='MULTI-ELEMENTO'&&attack.effects.some(x=>x.name===e.name))fail('Esse Efeito não pode ser repetido.');if(e.name==='MULTI-ELEMENTO'&&(!elements.includes(e.element)||e.element===attack.element||attack.effects.some(x=>x.element===e.element)))fail('Escolha um Elemento adicional diferente.');attack.effects.push({name:e.name,element:e.name==='MULTI-ELEMENTO'?e.element:''});description=`${attack.name}: +${e.name}${e.name==='MULTI-ELEMENTO'?' ('+e.element+')':''}`;}
   p.lastMajor=e.choice;description='Atualização Maior — '+description;
  }
  if(kind==='attribute'){if(!improvementNames.includes(e.choice)||p.lastAttribute===e.choice)fail('Escolha uma Melhoria de Atributos diferente da anterior.');p.improvements.push(e.choice);p.lastAttribute=e.choice;description='Melhoria de Atributos — '+e.choice;}
  if(kind==='device'){if(!Object.hasOwn(deviceLimits,e.name))fail('Escolha uma Função do Digivice.');const rank=p.devices.filter(x=>x.name===e.name).length+1;if(rank>deviceLimits[e.name])fail('Função no Nível máximo.');if(e.name==='Protocolos Especiais'&&(!protocols.includes(e.protocol)||!text(e.detail)))fail('Escolha o Protocolo e registre seus parâmetros.');p.devices.push({name:e.name,rank,protocol:e.name==='Protocolos Especiais'?e.protocol:'',detail:e.name==='Protocolos Especiais'?e.detail:''});description=`Digivice — ${e.name}: Nível ${rank}${e.name==='Protocolos Especiais'?' / '+e.protocol+' / '+e.detail:''}`;}
  p.pending.shift();
 }else if(e.type==='form'){
  const f=e.form,r=stages[f?.stage];if(!r||f.stage==='Novato'||r.level>p.level)fail('O Nível de Laço não atende ao Estágio.');if(p.forms.some(v=>v.stage===f.stage))fail('Estágio já registrado.');if(e.approved!==true)fail('Confirme o desbloqueio narrativo concedido pelo Narrador.');
  if(!['name','digital','element','classification','quality','image'].every(k=>text(f[k])))fail('Preencha todos os dados da forma.');if(!['Vacina','Vírus','Data','Free','Variable','Unknown'].includes(f.digital)||!elements.includes(f.element))fail('Atributo Digital ou Elemento inválido.');try{const u=new URL(f.image);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{fail('Use uma URL http ou https para a imagem.');}
  const keys=['poder','coracao','inteligencia','agilidade'];if(!f.digi||keys.some(k=>!integer(f.digi[k],r.min,r.max))||keys.reduce((n,k)=>n+f.digi[k],0)!==r.total)fail(`Distribuição ${f.stage}: base ${r.min}, total ${r.total}, máximo ${r.max}.`);
  if(!f.attack||!text(f.attack.name)||!elements.includes(f.attack.element)||!Array.isArray(f.attack.effects)||f.attack.effects.length!==1||!effects.some(x=>x.name===f.attack.effects[0].name))fail('Defina Nome, Elemento e um Efeito oficial para o novo Ataque.');const effect=f.attack.effects[0];if(effect.name==='MULTI-ELEMENTO'&&(!elements.includes(effect.element)||effect.element===f.attack.element))fail('Escolha um Elemento adicional diferente.');
  p.forms.push({stage:f.stage,name:f.name,image:f.image,digital:f.digital,element:f.element,classification:f.classification,digi:Object.fromEntries(keys.map(k=>[k,f.digi[k]])),attack:{name:f.attack.name,element:f.attack.element,rank:r.rank,effects:[{name:effect.name,element:effect.name==='MULTI-ELEMENTO'?effect.element:''}]}});p.qualities.push({name:f.quality,rank:1,stage:f.stage});description=`Evolução desbloqueada pelo Narrador: ${f.stage} — ${f.name}`;
 }else if(e.type==='status'){
  const maxPV=5+3*s.digi.coracao+bonuses(p).pv;
  if(!integer(e.energy,0,9+p.level)||!integer(e.pv,0,maxPV)||!Number.isSafeInteger(e.bond)||e.bond>5+p.level)fail('Recursos atuais fora dos limites da ficha.');
  if(p.broken&&e.bond>p.bond)fail('Durante a Quebra, Pontos de Laço não podem ser recuperados. Registre a resolução narrativa.');
  p.energy=e.energy;p.pv=e.pv;p.bond=e.bond;if(p.bond<=-6)p.broken=true;description=`Recursos registrados: Energia ${p.energy}, PV ${p.pv}, PL ${p.bond}`;
 }else fail('Tipo de Update desconhecido.');
 p.history.push(description);
}
export function withUpdate(s,event){const next=structuredClone(s);next.updates=[...(next.updates||[]),structuredClone(event)];progress(next);return next}
export function validateUpdates(s){if(!Array.isArray(s.updates)||s.updates.length>2000)fail('Histórico de Update inválido.');progress(s);}
export function updateCode(s){const p=progress(s),safe=v=>String(v).replaceAll('[','［').replaceAll(']','］');return `[b]UPDATE DE FICHA — ${safe(s.name)}[/b]\n${p.history.slice(s.updateStart||0).map((v,i)=>`${i+1}. ${safe(v)}`).join('\n')}\n\nNível de Laço: ${p.level}\nEXP: ${p.exp}/10\nEnergia: ${p.energy}/${9+p.level}\nPontos de Laço: ${p.bond}/${5+p.level}\n${p.broken?'Episódio de Quebra de Laço ativo.\n':''}${p.pending.length?'Melhorias pendentes: '+p.pending.map(k=>({minor:'Atualização Menor',major:'Atualização Maior',attribute:'Melhoria de Atributos',device:'Melhoria de Digivice'})[k]).join(', '):'Melhorias concluídas.'}\n[url=${progressionSource}]Regra de progressão[/url]`}
