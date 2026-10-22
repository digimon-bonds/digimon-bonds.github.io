/* All balance values and temporary personality data live here, not in the view. */
(() => {
 const PET_CONFIG={mode:'test',storageKey:'digimon-bonds:digi-pet:prototype:v3',legacyKeys:['digimon-bonds:digi-pet:prototype:v2','digimon-bonds:digi-pet:prototype:v1'],skins:['bonds','street'],historyLimit:18,initial:{satiety:65,energy:70,companionship:65,baseMood:70},thresholds:{hungry:25,tired:25,lonely:30,sad:35,happy:75,animated:85},speechHoldMs:8000,foodRefusalAt:95,talkCooldownMs:60000,talkEffects:{companionship:10,mood:4}};
 const FOOD_CONFIG=[
  {id:'digimeat',name:'DIGIMEAT',satiety:25,energy:0,mood:0,company:0,category:'Proteína',icon:'meat'},
  {id:'digifish',name:'DIGIFISH',satiety:25,energy:0,mood:0,company:0,category:'Proteína',icon:'fish'},
  {id:'digiapple',name:'DIGIAPPLE',satiety:15,energy:0,mood:3,company:0,category:'Fruta',icon:'apple'},
  {id:'digicarrot',name:'DIGICARROT',satiety:15,energy:0,mood:0,company:0,category:'Vegetal',icon:'carrot'},
  {id:'digibanana',name:'DIGIBANANA',satiety:20,energy:5,mood:0,company:0,category:'Fruta',icon:'banana'},
  {id:'digiprotein',name:'DIGIPROTEIN',satiety:10,energy:15,mood:0,company:0,category:'Suplemento',icon:'protein'},
 ];
 const ACTIVITY_CONFIG={
  durations:{test:{play:60000,train:120000,sleep:180000},production:{play:600000,train:900000,sleep:1800000}},
  play:{minEnergy:12,minSatiety:10,effects:{mood:15,companionship:8,energy:-10,satiety:-5}},
  train:{minEnergy:20,minSatiety:15,effects:{energy:-15,satiety:-8},happyMoodGain:3},
  sleep:{energyRecovery:60},
 };
 const NEED_DECAY_CONFIG={satietyPerHour:2,energyPerHour:1.5,companyPerHour:2,companyGraceMs:12*3600000,maxCompanyLoss:35,maxDecayMs:24*3600000,floors:{satiety:15,energy:15,companionship:20},digestionMs:120000};
 const MOOD_CONFIG={dirtyPenalty:20,hungerPenalty:12,exhaustionPenalty:12,lonelinessPenalty:12,stackedNeedPenalty:5,trainingComfortMinimum:50};
 // This mock profile is independent of the species label. Only Fire/Vaccine is defined.
 const PARTNER_PROFILE={id:'mock-partner-01',element:'fire',digitalAttribute:'vaccine',preferenceProfile:'fire-vaccine'};
 const PREFERENCE_CONFIG={profiles:{'fire-vaccine':{element:'fire',digitalAttribute:'vaccine',favorite:['digimeat'],liked:['digiprotein','digicarrot'],neutral:['digiapple','digibanana'],disliked:['digifish']}},bonuses:{favorite:{mood:5,companionship:3},liked:{mood:2,companionship:1},neutral:{mood:0,companionship:0},disliked:{mood:0,companionship:0}}};
 const PET_SPEECH={
  hungry:['Tô com fome...','Um lanchinho cairia bem.'],tired:['Acho que preciso de uma soneca.'],lonely:['Você fica aqui comigo um pouco?','Bom ter você por perto.'],happy:['Gosto de passar um tempo com você!'],sad:['Hoje eu tô meio sem vontade...','Vamos fazer algo tranquilo juntos?'],dirty:['Ops, acho que fiz sujeira.','Uma limpeza cairia bem.'],
  eatingFavorite:['Isso! Esse é o meu favorito!'],eatingLiked:['Esse é bom!'],eatingNeutral:['Valeu.'],eatingDisliked:['...Tem outra coisa?'],foodRefused:['Não cabe mais nada.'],finishedPlaying:['De novo depois?'],finishedTraining:['Ufa! Dei o meu melhor.'],finishedResting:['Essa soneca foi boa.'],talk:['Gosto quando você vem me ver.','O que a gente faz depois?','Fica mais um pouquinho?'],greeting:['Oi! Que bom te ver.'],play:['Essa brincadeira tá boa!'],train:['Vou dar o meu melhor!'],sleep:['Descansando. Daqui a pouco a gente brinca.'],clean:['Bem melhor assim. Obrigado!'],casual:['Um pequeno mundo fica melhor com companhia.'],
 };
 globalThis.DigiPetConfig={PET_CONFIG,FOOD_CONFIG,ACTIVITY_CONFIG,NEED_DECAY_CONFIG,MOOD_CONFIG,PARTNER_PROFILE,PREFERENCE_CONFIG,PET_SPEECH};
})();
