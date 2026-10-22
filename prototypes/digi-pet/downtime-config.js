/* All progression is a LOCAL, UNTRUSTED prototype. Server must own this config,
 * dates, rolls, XP, cycles, Prepared, credits and inventory before RPG integration. */
(() => {
 const C=globalThis.DigiPetConfig;
 // Older open tabs still write v3 care saves. Isolate progression from them.
 C.PET_CONFIG.legacyKeys.unshift('digimon-bonds:digi-pet:prototype:v5','digimon-bonds:digi-pet:prototype:v4',C.PET_CONFIG.storageKey);
 C.PET_CONFIG.storageKey='digimon-bonds:digi-pet:prototype:v6';
 C.FOOD_CONFIG.forEach(f=>{f.price={digimeat:0,digifish:8,digiapple:6,digicarrot:6,digibanana:7,digiprotein:12}[f.id];});
 C.FOOD_CONFIG.find(f=>f.id==='digimeat').satiety=20;
 C.ACTIVITY_CONFIG.durations.test.explore=90000;
 C.ACTIVITY_CONFIG.durations.production.explore=1800000;
 C.ACTIVITY_CONFIG.explore={minEnergy:25,minSatiety:20,effects:{energy:-20,satiety:-10}};
 C.PET_SPEECH.explore=['Vou descobrir o que tem por lá!'];
 C.PET_SPEECH.exploreTired=['Podemos ir depois que eu descansar um pouco?'];
 C.PET_SPEECH.exploreHungry=['Explorar de barriga vazia?'];
 globalThis.DigiDowntimeConfig={
  timeZone:'America/Sao_Paulo',cyclesPerXP:15,trainingGoal:2,fragmentGoal:2,
  cardRules:{cardsPerHumanTurn:1,durationTurns:1,commonConsumed:true,rareRequiresScanner:true,rareConsumed:false,stacking:false},
  attributes:{power:'Poder',heart:'Coração',intelligence:'Inteligência',agility:'Agilidade'},
  zones:[{id:'sector01',name:'ÁREA DE DADOS // SETOR 01'}],
  disposition:{good:{satiety:70,mood:70,energy:70,companionship:60},excellent:90,low:35,bonus:5},
  credits:{min:8,max:20},
  loot:[
   {min:1,max:10,id:'nothing',name:'NADA ENCONTRADO'},
   {min:11,max:45,id:'credits',name:'CRÉDITOS DIGITAIS'},
   {min:46,max:65,id:'food',name:'COMIDA ESPECIAL'},
   {min:66,max:80,id:'care',name:'ITEM DE CUIDADO'},
   {min:81,max:90,id:'fragment',name:'FRAGMENTO DE CARD'},
   {min:91,max:97,id:'common',name:'CARD COMUM'},
   {min:98,max:99,id:'rareFind',name:'EVENTO RARO'},
   {min:100,max:100,id:'rare',name:'CARD RARO'}
  ],
  careItems:[
   {id:'recovery-disk',name:'RECOVERY DISK',image:'assets/items/recovery-disk.webp',price:10,consumable:true,target:'RPG',description:'Recupera 10 PV do Digimon em um Tópico/Luta.',rpgEffect:{kind:'recover',target:'digimon',resource:'hp',amount:10}},
   {id:'energy-patch',name:'ENERGY PATCH',image:'assets/items/energy-patch.webp',price:12,consumable:true,target:'RPG',description:'Recupera 10 de Energia do Digimon em um Tópico/Luta.',rpgEffect:{kind:'recover',target:'digimon',resource:'energy',amount:10}},
   {id:'care-pack',name:'CARE PACK',image:'assets/items/care-pack.webp',price:8,consumable:true,target:'RPG',description:'Recupera 3 Pontos de Laço em um Tópico/Luta. Não altera Companhia.',rpgEffect:{kind:'recover',target:'human',resource:'bond',amount:3}}
  ],
  cards:[
   {id:'power-drive',name:'Power Drive',rarity:'COMMON',test:'Poder',description:'Força extra para superar um obstáculo.'},
   {id:'logic-boost',name:'Logic Boost',rarity:'COMMON',test:'Inteligência',description:'Uma nova perspectiva diante de um desafio.'},
   {id:'attack-chip',name:'Attack Chip',rarity:'COMMON',test:'Ataque',description:'Precisão no momento decisivo.'},
   {id:'heart-signal',name:'Heart Signal',rarity:'COMMON',test:'Coração',description:'Coragem para seguir em frente.'},
   {id:'quick-step',name:'Quick Step',rarity:'COMMON',test:'Agilidade',description:'Uma abertura para agir com rapidez.'},
   {id:'nova-strike',name:'Nova Strike',rarity:'RARE',test:'Ataque',description:'Um sinal excepcional atravessou o setor.'},
   {id:'quantum-mind',name:'Quantum Mind',rarity:'RARE',test:'Inteligência',description:'Amplia temporariamente a capacidade de análise.',effect:{kind:'attribute',attribute:'intelligence',amount:2,test:'Inteligência'}},
   {id:'power-amplifier',name:'Amplificador de Poder',rarity:'RARE',test:'Poder',description:'Amplifica o Poder do parceiro durante o turno.',effect:{kind:'attribute',attribute:'power',amount:2,test:'Poder'}},
   {id:'white-wings',name:'Asas Brancas',rarity:'RARE',test:'Esquiva',description:'Asas de luz protegem o parceiro: +2d6 em Esquiva por 1 turno.',effect:{kind:'dice',diceCount:2,test:'Esquiva'}}
  ].map(c=>({...c,image:'assets/card-placeholder.png',consumable:c.rarity==='COMMON',requiresScanner:c.rarity==='RARE',effect:{kind:'dice',diceCount:1,test:c.test,...c.effect,turns:1,uses:c.rarity==='COMMON'?1:null,applied:false},source:'sector01'})).map(c=>({...c,effect:{...c.effect,...(c.effect.kind==='dice'?{dice:`+${c.effect.diceCount}d6`}:{})}}))
 };
})();
