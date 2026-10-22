/* Local experiment only: configurable care rules, no official RPG data. */
(() => {
  'use strict';
  const CONFIG = {
    storageKey: 'digimon-bonds:digi-pet:prototype:v2',
    legacyStorageKey: 'digimon-bonds:digi-pet:prototype:v1',
    initial: { satiety: 65, mood: 60, energy: 70, companionship: 65 },
    skins: ['bonds', 'street'],
    tickMs: 60_000, maxCatchupTicks: 60,
    floors: { satiety: 20, mood: 20, energy: 15, companionship: 20 },
    awakeTick: { satiety: -1, energy: -1 }, sleepTick: { satiety: -1, energy: 8 },
    attentionGraceTicks: 10, companionshipIntervalTicks: 5,
    dirt: { arrivalMoodLoss: 18, moodLossPerTick: 1, cleanMoodGain: 22, cleanCompanionshipGain: 3 },
    neglect: { requiredNeeds: 2, moodLossPerTick: 1 },
    digestionMs: 120_000, cooldownMs: 5_000, historyLimit: 12,
    conditions: { hungry: 30, tired: 25, lonely: 30, sad: 35, happy: 75 },
    actions: {
      food: { effects: { satiety: 20, companionship: 2 }, message: 'Agumon comeu e parece satisfeito.' },
      play: { effects: { mood: 15, energy: -12, companionship: 4 }, minEnergy: 12, message: 'Agumon se divertiu com você.' },
      train: { effects: { energy: -20, satiety: -8 }, minEnergy: 20, minSatiety: 10, message: 'Agumon terminou o treino. Uma pausa cairia bem.' },
      talk: { effects: { companionship: 12, mood: 8 }, message: 'Sua companhia fez bem a Agumon.' },
    },
  };
  const labels = { food: 'Comida', play: 'Brincar', train: 'Treinar', talk: 'Conversar', sleep: 'Dormir', wake: 'Acordar', clean: 'Limpar', simulation: 'Teste de tempo' };
  const statKeys = Object.keys(CONFIG.initial);
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
  const copy = state => structuredClone(state);
  function decrease(state, key, amount) {
    state.stats[key] = Math.max(Math.min(state.stats[key], CONFIG.floors[key]), state.stats[key] - amount);
  }
  function create(now = Date.now()) {
    return { version: 2, stats: { ...CONFIG.initial }, sleeping: false, habitat: 'interior', skin: 'bonds', waste: false,
      digestionDue: null, attentionTicks: 0, lastTick: now, lastActions: {}, counts: {}, history: [] };
  }
  function restore(raw, now = Date.now()) {
    if (!raw || ![1, 2].includes(raw.version) || !raw.stats) return create(now);
    const stats = { ...raw.stats };
    if (raw.version === 1) stats.companionship = stats.bond;
    if (!statKeys.every(key => finite(stats[key]))) return create(now);
    const state = create(now);
    statKeys.forEach(key => { state.stats[key] = clamp(stats[key]); });
    state.sleeping = raw.sleeping === true;
    state.habitat = raw.habitat === 'exterior' ? 'exterior' : 'interior';
    state.skin = CONFIG.skins.includes(raw.skin) ? raw.skin : 'bonds';
    state.waste = raw.waste === true;
    state.attentionTicks = finite(raw.attentionTicks) ? Math.max(0, Math.min(10000, Math.floor(raw.attentionTicks))) : 0;
    state.digestionDue = finite(raw.digestionDue) && raw.digestionDue >= 0 ? Math.min(raw.digestionDue, now + CONFIG.digestionMs) : null;
    state.lastTick = finite(raw.lastTick) && raw.lastTick >= 0 ? Math.min(raw.lastTick, now) : now;
    Object.keys(labels).forEach(key => {
      if (finite(raw.lastActions?.[key]) && raw.lastActions[key] >= 0) state.lastActions[key] = Math.min(raw.lastActions[key], now);
      if (finite(raw.counts?.[key])) state.counts[key] = Math.max(0, Math.floor(raw.counts[key]));
    });
    state.history = Array.isArray(raw.history) ? raw.history.filter(item => item && Object.hasOwn(labels, item.action) && finite(item.at) && item.at >= 0)
      .slice(0, CONFIG.historyLimit).map(item => ({ action: item.action, at: Math.min(item.at, now), automatic: item.automatic === true })) : [];
    return state;
  }
  function record(state, action, now, automatic = false) {
    state.counts[action] = (state.counts[action] || 0) + 1;
    state.history.unshift({ action, at: now, automatic });
    state.history = state.history.slice(0, CONFIG.historyLimit);
  }
  function digest(state, now) {
    if (state.digestionDue !== null && now >= state.digestionDue) {
      if (!state.waste) { state.waste = true; decrease(state, 'mood', CONFIG.dirt.arrivalMoodLoss); }
      state.digestionDue = null;
    }
  }
  function advance(input, now = Date.now()) {
    const state = copy(input);
    const elapsed = Math.max(0, now - state.lastTick);
    const ticks = Math.min(Math.floor(elapsed / CONFIG.tickMs), CONFIG.maxCatchupTicks);
    for (let tick = 0; tick < ticks; tick++) {
      digest(state, state.lastTick + (tick + 1) * CONFIG.tickMs);
      const effects = state.sleeping ? CONFIG.sleepTick : CONFIG.awakeTick;
      for (const [key, delta] of Object.entries(effects)) {
        if (delta < 0) decrease(state, key, -delta);
        else state.stats[key] = clamp(state.stats[key] + delta);
      }
      if (!state.sleeping) {
        state.attentionTicks++;
        const lonelyTicks = state.attentionTicks - CONFIG.attentionGraceTicks;
        if (lonelyTicks > 0 && lonelyTicks % CONFIG.companionshipIntervalTicks === 0) decrease(state, 'companionship', 1);
      }
      const needs = [state.stats.satiety <= CONFIG.conditions.hungry, state.stats.energy <= CONFIG.conditions.tired,
        state.stats.companionship <= CONFIG.conditions.lonely, state.waste].filter(Boolean).length;
      if (state.waste) decrease(state, 'mood', CONFIG.dirt.moodLossPerTick);
      if (needs >= CONFIG.neglect.requiredNeeds) decrease(state, 'mood', CONFIG.neglect.moodLossPerTick);
      if (state.sleeping && state.stats.energy >= 100) { state.sleeping = false; record(state, 'wake', now, true); }
    }
    state.lastTick = now - (elapsed % CONFIG.tickMs);
    digest(state, now);
    return state;
  }
  function availability(state, action, now = Date.now()) {
    if (!Object.hasOwn(labels, action) || action === 'simulation') return 'Ação indisponível.';
    if (action === 'clean') return state.waste ? '' : 'O ambiente já está limpo.';
    if (action === 'wake') return state.sleeping ? '' : 'Agumon já está acordado.';
    if (action === 'sleep') return state.sleeping ? 'Agumon já está dormindo.' : state.stats.energy >= 100 ? 'Agumon já está descansado.' : '';
    if (state.sleeping) return 'Agumon está dormindo. Acorde-o para interagir.';
    const remaining = CONFIG.cooldownMs - (now - (state.lastActions[action] ?? -Infinity));
    if (remaining > 0) return `Aguarde ${Math.ceil(remaining / 1000)} s para repetir.`;
    const definition = CONFIG.actions[action];
    if (definition.minEnergy && state.stats.energy < definition.minEnergy) return 'Agumon precisa descansar primeiro.';
    if (definition.minSatiety && state.stats.satiety < definition.minSatiety) return 'Agumon precisa comer antes de treinar.';
    if (action === 'food' && state.stats.satiety >= 100) return 'Agumon já está satisfeito.';
    return '';
  }
  function act(input, action, now = Date.now()) {
    const state = advance(input, now);
    const reason = availability(state, action, now);
    if (reason) return { state, ok: false, message: reason };
    let message;
    if (action === 'sleep') { state.sleeping = true; state.lastTick = now; message = 'Agumon está descansando. Energia recupera aos poucos.'; }
    else if (action === 'wake') { state.sleeping = false; state.lastTick = now; message = 'Agumon acordou. Bom ter você por perto.'; }
    else if (action === 'clean') {
      state.waste = false;
      state.stats.mood = clamp(state.stats.mood + CONFIG.dirt.cleanMoodGain);
      state.stats.companionship = clamp(state.stats.companionship + CONFIG.dirt.cleanCompanionshipGain);
      message = 'Tudo limpo! Agumon parece muito mais à vontade.';
    } else {
      const definition = CONFIG.actions[action];
      for (const [key, delta] of Object.entries(definition.effects)) state.stats[key] = clamp(state.stats[key] + delta);
      if (action === 'food' && !state.waste && state.digestionDue === null) state.digestionDue = now + CONFIG.digestionMs;
      message = definition.message;
    }
    state.attentionTicks = 0;
    state.lastActions[action] = now;
    record(state, action, now);
    return { state, ok: true, message };
  }
  function condition(state) {
    if (state.sleeping) return 'Dormindo';
    if (state.stats.mood <= CONFIG.conditions.sad) return 'Tristinho';
    if (state.stats.satiety <= CONFIG.conditions.hungry) return 'Com fome';
    if (state.stats.energy <= CONFIG.conditions.tired) return 'Cansado';
    if (state.stats.companionship <= CONFIG.conditions.lonely) return 'Solitário';
    if (state.waste) return 'Incomodado';
    if (state.stats.mood >= CONFIG.conditions.happy) return 'Feliz';
    return 'Tranquilo';
  }
  function status(state) {
    if (state.waste) return 'Ops, acho que fiz sujeira. Uma limpeza cairia bem.';
    if (state.sleeping) return 'Descansando. Daqui a pouco a gente brinca.';
    if (state.stats.satiety <= CONFIG.conditions.hungry) return 'Um lanchinho cairia bem agora.';
    if (state.stats.energy <= CONFIG.conditions.tired) return 'Foi um dia cheio. Que tal uma soneca?';
    if (state.stats.companionship <= CONFIG.conditions.lonely) return 'Senti sua falta. Fica um pouquinho comigo?';
    if (state.stats.mood <= CONFIG.conditions.sad) return 'Estou meio quietinho. Vamos fazer algo juntos?';
    if (state.stats.mood >= CONFIG.conditions.happy) return 'Gosto quando a gente passa um tempo junto.';
    return 'Um pequeno mundo fica melhor com companhia.';
  }
  function simulate(input, minutes = 5, now = Date.now()) {
    const state = advance(input, now);
    const duration = Math.min(CONFIG.maxCatchupTicks, Math.max(0, Math.floor(minutes))) * CONFIG.tickMs;
    const result = advance(state, now + duration);
    result.lastTick -= duration;
    if (result.digestionDue !== null) result.digestionDue -= duration;
    result.history.forEach(item => { if (item.at > now) item.at = now; });
    record(result, 'simulation', now);
    return result;
  }
  globalThis.DigiPetEngine = { CONFIG, labels, create, restore, advance, availability, act, condition, status, simulate };
})();
