/* Mock presentation data only; no permanent character-sheet model. */
const mockPartner = Object.freeze({ humanName: 'Tamer', digimonName: 'Agumon', species: 'Agumon', stage: 'Rookie', personality: 'Curioso e impulsivo', image: 'assets/agumon.png' });
const engine = globalThis.DigiPetEngine;
const { CONFIG } = engine;
const byId = id => document.getElementById(id);
const room = byId('room');
const message = byId('pet-message');
let messageTimer;
let storageAvailable = true;
let state;
let renderedHistory;
try { state = engine.restore(JSON.parse(localStorage.getItem(CONFIG.storageKey))); }
catch { state = engine.create(); storageAvailable = false; }
state = engine.advance(state);

function save() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  byId('save-status').textContent = storageAvailable ? 'SALVO NESTE NAVEGADOR' : 'SEM SALVAMENTO · SESSÃO TEMPORÁRIA';
}
function feedback(text) {
  clearTimeout(messageTimer);
  message.textContent = text;
  message.classList.add('is-visible');
  messageTimer = setTimeout(() => { message.classList.remove('is-visible'); message.textContent = ''; }, 4200);
}
function render() {
  for (const [key, value] of Object.entries(state.stats)) {
    const element = byId(`stat-${key}`);
    element.textContent = value;
    element.closest('.pet-stat').classList.toggle('needs-care', (key === 'satiety' && value <= CONFIG.conditions.hungry) || (key === 'energy' && value <= CONFIG.conditions.tired));
  }
  const condition = engine.condition(state).toUpperCase();
  if (byId('condition').textContent !== condition) byId('condition').textContent = condition;
  byId('waste').hidden = !state.waste;
  byId('sleep-note').hidden = !state.sleeping;
  byId('care-note').textContent = state.waste ? 'Uma limpeza cairia bem.' : state.sleeping ? 'Descansando, um minuto de cada vez.' : 'Um tempo com Agumon.';
  room.dataset.sleeping = String(state.sleeping);
  room.dataset.habitat = state.habitat;
  document.querySelector('.scenery-interior').hidden = state.habitat !== 'interior';
  document.querySelector('.scenery-exterior').hidden = state.habitat !== 'exterior';
  byId('habitat-name').textContent = state.habitat === 'interior' ? '01 / QUARTO DIGITAL' : '02 / JARDIM DIGITAL';
  document.querySelectorAll('.habitat-switch button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.habitat === state.habitat)));
  document.querySelectorAll('[data-action]').forEach(button => {
    const reason = engine.availability(state, button.dataset.action);
    button.setAttribute('aria-disabled', String(Boolean(reason)));
    button.title = reason || 'Cuidar de Agumon';
  });
  byId('sleep-button').textContent = state.sleeping ? '☾ Acordar' : '☾ Dormir';
  byId('sleep-button').setAttribute('aria-pressed', String(state.sleeping));
  byId('clean-button').textContent = state.waste ? 'Limpar · 1' : 'Limpar';
  byId('clean-button').setAttribute('aria-disabled', String(!state.waste));
  const latest = state.history[0];
  byId('last-action').textContent = latest ? `Último: ${engine.labels[latest.action]} · ${new Date(latest.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Pronto para o primeiro cuidado.';
  const history = byId('history-list');
  const historySignature = JSON.stringify(state.history);
  if (historySignature !== renderedHistory) {
  history.replaceChildren();
  state.history.forEach(entry => {
    const item = document.createElement('li');
    item.textContent = `${new Date(entry.at).toLocaleString('pt-BR')} — ${engine.labels[entry.action]}${entry.automatic ? ' (descanso completo)' : ''}`;
    history.append(item);
  });
  renderedHistory = historySignature;
  }
  byId('history-empty').hidden = state.history.length > 0;
  byId('care-count').textContent = `Cuidados registrados: ${Object.entries(state.counts).filter(([key]) => key !== 'simulation').reduce((total, [, count]) => total + count, 0)}`;
}
function update() { state = engine.advance(state); save(); render(); }
function interact(action) {
  const result = engine.act(state, action);
  state = result.state;
  save(); render(); feedback(result.message);
}
byId('partner-name').textContent = mockPartner.digimonName;
byId('partner-species').textContent = mockPartner.species;
byId('partner-stage').textContent = mockPartner.stage;
byId('partner-image').src = mockPartner.image;
byId('partner-image').alt = `${mockPartner.digimonName}, ${mockPartner.species}, ${mockPartner.stage}`;
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => interact(button.dataset.action)));
document.querySelectorAll('.habitat-switch button').forEach(button => button.addEventListener('click', () => { state.habitat = button.dataset.habitat; update(); }));
byId('sleep-button').addEventListener('click', () => interact(state.sleeping ? 'wake' : 'sleep'));
byId('clean-button').addEventListener('click', () => interact('clean'));
byId('open-history').addEventListener('click', () => { update(); byId('history-dialog').showModal(); });
byId('close-history').addEventListener('click', () => byId('history-dialog').close());
byId('simulate-time').addEventListener('click', () => {
  state = engine.simulate(state, 5); save(); render();
  byId('test-feedback').textContent = '5 minutos simulados. Estados e ambiente atualizados.';
});
byId('open-reset').addEventListener('click', () => byId('reset-dialog').showModal());
byId('cancel-reset').addEventListener('click', () => byId('reset-dialog').close());
byId('confirm-reset').addEventListener('click', () => {
  state = engine.create(); save(); render(); byId('reset-dialog').close();
  byId('test-feedback').textContent = '';
  feedback('Protótipo reiniciado. Um novo começo com Agumon.');
});
const fullscreen = byId('fullscreen');
if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('.pet-experience').requestFullscreen(); }
  catch { feedback('Use F11 para ampliar a sala no navegador.'); }
});
document.addEventListener('fullscreenchange', () => fullscreen.setAttribute('aria-label', document.fullscreenElement ? 'Sair da tela cheia' : 'Entrar em tela cheia'));
document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
window.addEventListener('pagehide', update);
window.addEventListener('storage', event => {
  if (event.key !== CONFIG.storageKey) return;
  try { state = engine.advance(engine.restore(JSON.parse(event.newValue))); render(); }
  catch { /* Ignore malformed external writes. */ }
});
setInterval(update, 1000);
save(); render();
