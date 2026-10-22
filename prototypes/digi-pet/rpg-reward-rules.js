/* Draft RPG rules and an ISOLATED test scene. No sheet, Scanner or Battle Link
 * calls. Lab inventory/HP/Energy/Bond are ephemeral and never the pet save. */
(() => {
 'use strict';
 const C=globalThis.DigiDowntimeConfig,F=globalThis.DigiPetConfig.FOOD_CONFIG,copy=x=>structuredClone(x);
 const definition=card=>C.cards.find(c=>c.id===card.id)||card;
 function cardText(card){const c=definition(card),e=c.effect;return e.kind==='attribute'?`+${e.amount} ${e.test} por ${e.turns} turno.`:`${e.dice} em ${c.consumable?'um teste de':'testes de'} ${e.test} no turno de ativação.`;}
 function probabilities(modifier=0){
  const categories=Object.fromEntries(C.loot.map(x=>[x.id,0]));
  for(let face=1;face<=100;face++){const value=Math.min(100,Math.max(1,face+modifier)),row=C.loot.find(x=>value>=x.min&&value<=x.max);categories[row.id]++;}
  const common=C.cards.filter(c=>c.rarity==='COMMON').length,rare=C.cards.filter(c=>c.rarity==='RARE').length;
  return {categories,foodEach:categories.food/F.filter(f=>f.price>0).length,careEach:categories.care/C.careItems.length,commonEach:categories.common/common,rareEach:categories.rare/rare,restorationEach:100/common,fragment:categories.fragment+categories.rareFind*.25,eventEach:categories.rareFind/4};
 }
 function createScene(){return {turn:1,scanner:true,cardUsedThisTurn:false,activeCard:null,human:{energy:5,maxEnergy:20,bond:1,maxBond:10},digimon:{hp:5,maxHp:20},attributes:{power:2,intelligence:2,heart:2,agility:2},pet:{satiety:30,energy:30,mood:30,companionship:30},inventory:{care:Object.fromEntries(C.careItems.map(i=>[i.id,1])),cards:Object.fromEntries(C.cards.map(c=>[c.id,1]))},lastAction:'Bancada nova: todos os exemplos disponíveis.'};}
 function fail(scene,feedback){return {scene:copy(scene),ok:false,feedback};}
 function useItem(input,id){
  const s=copy(input),item=C.careItems.find(i=>i.id===id);if(!item||!(s.inventory.care[id]>0))return fail(s,'Sem unidade de teste. Reinicie a bancada.');
  const e=item.rpgEffect,recipient=s[e.target],maxKey={hp:'maxHp',energy:'maxEnergy',bond:'maxBond'}[e.resource];
  if(recipient[e.resource]>=recipient[maxKey])return fail(s,'Esse recurso simulado já está cheio.');
  const old=recipient[e.resource];recipient[e.resource]=Math.min(recipient[maxKey],old+e.amount);s.inventory.care[id]--;
  s.lastAction=`${item.name}: +${recipient[e.resource]-old} ${e.resource==='hp'?'PV do Digimon':e.resource==='energy'?'Energia do humano':'Pontos de Laço'} em um Tópico/Luta (simulação).`;return {scene:s,ok:true,feedback:s.lastAction};
 }
 function activateCard(input,id){
  const s=copy(input),c=C.cards.find(c=>c.id===id);if(!c||!(s.inventory.cards[id]>0))return fail(s,'Card indisponível na bancada.');
  if(s.cardUsedThisTurn)return fail(s,'Apenas um card por turno do humano. Avance o turno.');
  if(c.requiresScanner&&!s.scanner)return fail(s,'Card raro exige Scanner.');
  if(c.consumable)s.inventory.cards[id]--;
  s.cardUsedThisTurn=true;s.activeCard={id:c.id,expiresAtTurn:s.turn,rollsRemaining:c.consumable?1:null};
  s.lastAction=`${c.name} ativo no turno ${s.turn}. ${cardText(c)} ${c.consumable?'Exemplar consumido.':'Card permanente preservado.'}`;return {scene:s,ok:true,feedback:s.lastAction};
 }
 function recordRoll(input,test){
  const s=copy(input),active=s.activeCard,c=active?C.cards.find(c=>c.id===active.id):null,e=c?.effect;
  let dice=0,attributeBonus=0;
  if(c&&active.expiresAtTurn===s.turn&&e.test===test){if(e.kind==='dice'&&active.rollsRemaining!==0){dice=e.diceCount;if(active.rollsRemaining!==null)active.rollsRemaining--;}if(e.kind==='attribute')attributeBonus=e.amount;}
  s.lastAction=`Teste de ${test}: ${dice?'+'+dice+'d6':'sem dado extra'}${attributeBonus?` · +${attributeBonus} no atributo`:''}. Simulação; nenhum roll do Battle Link foi alterado.`;
  return {scene:s,ok:true,dice,attributeBonus,feedback:s.lastAction};
 }
 function nextTurn(input){const s=copy(input);s.turn++;s.activeCard=null;s.cardUsedThisTurn=false;s.lastAction=`Turno ${s.turn}. Todos os efeitos do card anterior expiraram.`;return {scene:s,ok:true,feedback:s.lastAction};}
 function feed(input,id){const s=copy(input),food=F.find(f=>f.id===id);if(!food)return fail(s,'Alimento inválido.');for(const [key,value]of Object.entries({satiety:food.satiety,energy:food.energy,mood:food.mood})){s.pet[key]=Math.min(100,s.pet[key]+value);}s.lastAction=`${food.name} oferecido apenas ao pet simulado.`;return {scene:s,ok:true,feedback:s.lastAction};}
 globalThis.RPGRewardRules={definition,cardText,probabilities,createScene,useItem,activateCard,recordRoll,nextTurn,feed};
})();
