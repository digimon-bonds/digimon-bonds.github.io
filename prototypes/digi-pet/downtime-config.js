/* All progression is a LOCAL, UNTRUSTED prototype. Server must own this config,
 * dates, rolls, XP, cycles, Prepared, credits and inventory before RPG integration. */
(() => {
 const C=globalThis.DigiPetConfig;
 // Older open tabs still write v3 care saves. Isolate progression from them.
 C.PET_CONFIG.legacyKeys.unshift(C.PET_CONFIG.storageKey);
 C.PET_CONFIG.storageKey='digimon-bonds:digi-pet:prototype:v4';
 C.FOOD_CONFIG.forEach(f=>{f.price={digimeat:0,digifish:8,digiapple:6,digicarrot:6,digibanana:7,digiprotein:12}[f.id];});
 C.FOOD_CONFIG.find(f=>f.id==='digimeat').satiety=20;
 C.ACTIVITY_CONFIG.durations.test.explore=90000;
 C.ACTIVITY_CONFIG.durations.production.explore=1800000;
 C.ACTIVITY_CONFIG.explore={minEnergy:25,minSatiety:20,effects:{energy:-20,satiety:-10}};
 C.PET_SPEECH.explore=['Vou descobrir o que tem por lá!'];
 C.PET_SPEECH.exploreTired=['Podemos ir depois que eu descansar um pouco?'];
 C.PET_SPEECH.exploreHungry=['Explorar de barriga vazia?'];
 globalThis.DigiDowntimeConfig={
  timeZone:'America/Sao_Paulo',cyclesPerXP:10,trainingGoal:3,
  attributes:{power:'Poder',heart:'Coração',intelligence:'Inteligência',agility:'Agilidade'},
  zones:[{id:'sector01',name:'ÁREA DE DADOS // SETOR 01'}],
  disposition:{good:{satiety:70,mood:70,energy:70,companionship:60},excellent:90,low:35,bonus:5},
  credits:{min:8,max:20},
  loot:[
   {min:1,max:40,id:'credits',name:'CRÉDITOS DIGITAIS'},
   {min:41,max:62,id:'food',name:'COMIDA ESPECIAL'},
   {min:63,max:76,id:'care',name:'ITEM DE CUIDADO'},
   {min:77,max:87,id:'cache',name:'CACHE DE DADOS'},
   {min:88,max:94,id:'fragment',name:'FRAGMENTO DE CARD'},
   {min:95,max:97,id:'common',name:'CARD COMUM'},
   {min:98,max:99,id:'rareFind',name:'ACHADO RARO'},
   {min:100,max:100,id:'rare',name:'CARD RARO'}
  ],
  careItems:[{id:'recovery-disk',name:'RECOVERY DISK'},{id:'energy-patch',name:'ENERGY PATCH'},{id:'care-pack',name:'CARE PACK'}],
  cards:[
   {id:'power-drive',name:'Power Drive',rarity:'COMMON',test:'Poder',description:'Força extra para superar um obstáculo.'},
   {id:'logic-boost',name:'Logic Boost',rarity:'COMMON',test:'Inteligência',description:'Uma nova perspectiva diante de um desafio.'},
   {id:'attack-chip',name:'Attack Chip',rarity:'COMMON',test:'Ataque',description:'Precisão no momento decisivo.'},
   {id:'heart-signal',name:'Heart Signal',rarity:'COMMON',test:'Coração',description:'Coragem para seguir em frente.'},
   {id:'quick-step',name:'Quick Step',rarity:'COMMON',test:'Agilidade',description:'Uma abertura para agir com rapidez.'},
   {id:'nova-strike',name:'Nova Strike',rarity:'RARE',test:'Ataque',description:'Um sinal excepcional atravessou o setor.'},
   {id:'quantum-mind',name:'Quantum Mind',rarity:'RARE',test:'Inteligência',description:'Dados raros, possibilidades extraordinárias.'}
  ].map(c=>({...c,image:'assets/card-placeholder.png',effect:{dice:'+1d6',test:c.test,uses:1,applied:false},source:'sector01'}))
 };
})();
