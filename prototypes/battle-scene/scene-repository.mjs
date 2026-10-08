import * as e from './scene-engine.mjs';
import {advanceCompletedRound} from './auto-round.mjs';
import {controlLocked,canOperate} from './interface-policy.mjs';
import {adjustResources} from './narrator-tools.mjs';
import {createNpc} from './npc.mjs';

export function applySceneCommand(s,command,args,context){
 const {narrator,actorId}=context;
 const own=id=>{if(!narrator&&!canOperate(s,'player',actorId,id))throw Error('Você não controla este participante.');};
 const admin=()=>{if(!narrator)throw Error('Somente o Narrador pode editar ou recomeçar a cena.');};
 const pending=s.pending;
 switch(command){
  case 'resourceSurvival':{const offer=s.resourceSurvival;if(!offer)throw Error('Decisão indisponível.');own(offer.id);const n=structuredClone(s),unit=e.entityById(n,offer.id),pair=e.pairOf(n,unit);if(args[0]){if(!pair||pair.bond<3)throw Error('São necessários 3 PL.');pair.bond-=3;if(unit.characteristics)unit.energy=1;else{unit.hp=1;unit.formId=offer.formId;delete unit.conditions.incapacitated;}n.log.push({id:n.log.length+1,round:n.round,kind:'survival',actorId:unit.id,summary:offer.name+' usou Força para Lutar: −3 PL, permaneceu com 1.'});}else n.log.push({id:n.log.length+1,round:n.round,kind:'knockout',actorId:unit.id,summary:offer.name+' está fora de batalha!'});delete n.resourceSurvival;return n;}
  case 'beginAttack':if(!narrator&&args[0].mode&&args[0].mode!=='normal')throw Error('Circunstância exige o Narrador.');own(args[0].actorId);return e.beginAttack(s,{...args[0],staged:true,rescueEnabled:false});
  case 'genericTest':own(args[0].entityId);if(!narrator&&(args[0].mode!=='normal'||args[0].difficulty!==2))throw Error('Circunstância e dificuldade exigem o Narrador.');return e.genericTest(s,args[0]);
  case 'rollDodge':if(!narrator&&args[0].mode&&args[0].mode!=='normal')throw Error('Circunstância exige o Narrador.');own(pending?.context.targetId);return e.rollDodge(s,{...args[0],rescueEnabled:false});
  case 'confirmAttackMulti':own(pending?.context.actorId);return e.confirmAttackMulti(s);
  case 'confirmAttack':own(pending?.context.actorId);return e.confirmAttack(s);
  case 'confirmDodge':own(pending?.context.targetId);return e.confirmDodge(s);
  case 'decideSurvival':own(pending?.context.targetId);return e.decideSurvival(s,args[0]);
  case 'acceptResult':own(pending?.kind==='attack'?pending.context.targetId:pending?.entityId);return e.acceptResult(s);
  case 'forceTest':own(pending?.kind==='attack'?pending.context[args[0]==='attack'?'actorId':'targetId']:pending?.entityId);return e.forceTest(s,args[0]);
  case 'defend':case 'evolveAction':case 'observe':case 'giveCoordinates':own(args[0]);return e[command](s,...args);
  case 'skipAction':own(args[1]);return e[command](s,...args);
  case 'skipPair':{own(args[0]);let n=s;const a=e.actorById(n,args[0]),h=n.humans.find(h=>h.pairId===a.pairId);if(a.remaining&&a.hp)n=e.skipAction(n,'digimon',a.id);if(h?.remaining&&h.energy)n=e.skipAction(n,'human',h.id);return n;}
  case 'adjustResources':admin();return adjustResources(s,args[0]);
  case 'configureLab':case 'importParticipant':case 'removeParticipant':admin();return e[command](s,...args);
  case 'createNpc':admin();return createNpc(s,...args);
  case 'presentation':{admin();const n=structuredClone(s),c=args[0];if(c.actorId){const a=e.actorById(n,c.actorId);if(!a)throw Error('Participante inválido');a.flipped=!!c.flipped;}if(c.name!==undefined)n.scene.name=String(c.name).slice(0,70);if(c.environment!==undefined)n.scene.environment=String(c.environment);if(c.background!==undefined)n.scene.background=c.background;return n;}
  default:throw Error('Comando indisponível.');
 }
}

export function newSceneData(state=e.exampleBattle()){return {revision:0,state,baseline:structuredClone(state),clients:{},maintenance:{},receipts:{}};}
export function createSceneRepository(initial,save){
 let data=structuredClone(initial);
 let tail=Promise.resolve();
 const write=async next=>{await save(next);data=next;};
 const serial=fn=>{const result=tail.then(fn);tail=result.catch(()=>{});return result;};
 const snapshot=token=>({state:structuredClone(data.state),revision:data.revision,actorId:data.clients[token]?.actorId||null,maintenance:structuredClone(data.maintenance)});
 return {
  read:token=>serial(()=>snapshot(token)),
  execute:(token,request,narrator=false)=>serial(async()=>{
   const {command,args=[],revision,requestId,resolutionId}=request;
   if(!requestId||typeof requestId!=='string'||requestId.length>80)throw Error('Identificador inválido.');
   const key=token+':'+requestId;
   if(data.receipts[key])return snapshot(token);
   if(revision!==data.revision){const error=Error('A cena mudou. O estado salvo foi restaurado; confira antes de agir.');error.status=409;throw error;}
   const next=structuredClone(data),client=next.clients[token]||={actorId:null};
   if(command==='claim'){
    const actor=e.actorById(next.state,args[0]);if(!actor||actor.side!=='ally'||actor.controller!=='player')throw Error('Participante inválido.');
    if(client.actorId&&client.actorId!==actor.id&&controlLocked(next.state,client.actorId))throw Error('Controle bloqueado nesta rodada.');
    client.actorId=actor.id;
   }else if(command==='restart'){
    if(!narrator)throw Error('Somente o Narrador pode recomeçar a cena.');
    next.state=e.restartScene(next.baseline);
   }else if(command==='maintenance'){
    if(!narrator&&!canOperate(next.state,'player',client.actorId,args[0].actorId))throw Error('Dupla indisponível.');
    const pair=e.pairOf(next.state,e.actorById(next.state,args[0].actorId));if(!pair)throw Error('Dupla indisponível.');
    next.maintenance[pair.id]={sustain:!!args[0].sustain,allowZero:!!args[0].allowZero,rescueEnabled:false};
   }else{
    let current=next.state;if(resolutionId)current=e.selectResolution(current,resolutionId);
    if(current.resourceSurvival&&command!=='resourceSurvival')throw Error('Decida sobre Força para Lutar antes de continuar.');
    const before=current;
    current=applySceneCommand(current,command,args,{narrator,actorId:client.actorId});
    for(const unit of [...current.actors,...current.humans]){
     const old=e.entityById(before,unit.id);
     if(old&&e.entityLife(old)>0&&e.entityLife(unit)===0){
      const pair=e.pairOf(current,unit);
      if(pair?.bond>=3&&!before.pending?.survivalDecided&&!['adjustResources','configureLab'].includes(command))current.resourceSurvival={id:unit.id,name:e.entityName(old),formId:old.formId,resource:unit.characteristics?'Energia':'PV'};
      else current.log.push({id:current.log.length+1,round:current.round,kind:'knockout',actorId:unit.id,summary:e.entityName(old)+' está fora de batalha!'});
     }
    }
    next.state=current.resourceSurvival?current:advanceCompletedRound(current,next.maintenance);
    if(['configureLab','createNpc','importParticipant','removeParticipant','presentation'].includes(command))next.baseline=structuredClone(next.state);
   }
   next.revision++;next.receipts[key]=true;
   await write(next);return snapshot(token);
  })
 };
}
