/* Isolated local prototype model. No RPG, character-sheet or network data. */
(() => {
  'use strict';
  const CONFIG = {
    storageKey: 'digimon-bonds:digi-pet:prototype:v1',
    initial: { satiety: 65, mood: 60, energy: 70, bond: 10 },
    tickMs: 60_000, maxCatchupTicks: 30, passiveSatietyFloor: 20,
    awakeTick: { satiety: -2, energy: 1 }, sleepTick: { satiety: -1, energy: 8 },
    digestionMs: 120_000, cooldownMs: 5_000, historyLimit: 12,
    conditions: { hungry: 30, tired: 25, happy: 75 },
    actions: {
      food: { effects: { satiety: 20 }, message: 'Agumon comeu e parece satisfeito.' },
      play: { effects: { mood: 15, energy: -12 }, minEnergy: 12, message: 'Agumon parece mais animado.' },
      train: { effects: { energy: -20, satiety: -8 }, minEnergy: 20, minSatiety: 10, message: 'Agumon terminou o treino.' },
      talk: { effects: { bond: 5, mood: 4 }, message: 'Agumon passou algum tempo com você.' },
    },
  };
  const labels = { food: 'Comida', play: 'Brincar', train: 'Treinar', talk: 'Conversar', sleep: 'Dormir', wake: 'Acordar', clean: 'Limpar', simulation: 'Teste de tempo' };
  const statKeys = Object.keys(CONFIG.initial);
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
  const copy = state => structuredClone(state);
  function create(now = Date.now()) {
    return { version: 1, stats: { ...CONFIG.initial }, sleeping: false, habitat: 'interior', waste: false,
      digestionDue: null, lastTick: now, lastActions: {}, counts: {}, history: [] };
  }
  function restore(raw, now = Date.now()) {
    if (!raw || raw.version !== 1 || !raw.stats || !statKeys.every(key => finite(raw.stats[key]))) return create(now);
    const state = create(now);
    statKeys.forEach(key => { state.stats[key] = clamp(raw.stats[key]); });
    state.sleeping = raw.sleeping === true;
    state.habitat = raw.habitat === 'exterior' ? 'exterior' : 'interior';
    state.waste = raw.waste === true;
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
  function advance(input, now = Date.now()) {
    const state = copy(input);
    const elapsed = Math.max(0, now - state.lastTick);
    const ticks = Math.min(Math.floor(elapsed / CONFIG.tickMs), CONFIG.maxCatchupTicks);
    for (let tick = 0; tick < ticks; tick++) {
      const effects = state.sleeping ? CONFIG.sleepTick : CONFIG.awakeTick;
      for (const [key, delta] of Object.entries(effects)) {
        if (key === 'satiety') state.stats[key] = Math.max(Math.min(state.stats[key], CONFIG.passiveSatietyFloor), state.stats[key] + delta);
        else state.stats[key] = clamp(state.stats[key] + delta);
      }
      if (state.sleeping && state.stats.energy >= 100) { state.sleeping = false; record(state, 'wake', now, true); }
    }
    // Drop time above the catchup cap, preserving only the sub-minute remainder.
    state.lastTick = now - (elapsed % CONFIG.tickMs);
    if (state.digestionDue !== null && now >= state.digestionDue) { state.waste = true; state.digestionDue = null; }
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
    else if (action === 'clean') { state.waste = false; message = 'Tudo limpo. O habitat ficou aconchegante de novo.'; }
    else {
      const definition = CONFIG.actions[action];
      for (const [key, delta] of Object.entries(definition.effects)) state.stats[key] = clamp(state.stats[key] + delta);
      if (action === 'food' && !state.waste && state.digestionDue === null) state.digestionDue = now + CONFIG.digestionMs;
      message = definition.message;
    }
    state.lastActions[action] = now;
    record(state, action, now);
    return { state, ok: true, message };
  }
  function condition(state) {
    if (state.sleeping) return 'Dormindo';
    if (state.stats.satiety <= CONFIG.conditions.hungry) return 'Com fome';
    if (state.stats.energy <= CONFIG.conditions.tired) return 'Cansado';
    if (state.stats.mood >= CONFIG.conditions.happy) return 'Feliz';
    return 'Tranquilo';
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
  globalThis.DigiPetEngine = { CONFIG, labels, create, restore, advance, availability, act, condition, simulate };
})();
