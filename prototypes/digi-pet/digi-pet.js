/* Visual-only fixture. Replace this value at the view boundary when a real
   partner is authorized. No storage, character model, API or RPG rules. */
const mockPartner = Object.freeze({
  humanName: 'Tamer',
  digimonName: 'Agumon',
  species: 'Agumon',
  stage: 'Rookie',
  personality: 'Curioso e impulsivo',
  image: 'assets/agumon.png',
});

function renderPartner(partner) {
  document.getElementById('partner-name').textContent = partner.digimonName;
  document.getElementById('partner-species').textContent = partner.species;
  document.getElementById('partner-stage').textContent = partner.stage;
  const image = document.getElementById('partner-image');
  image.src = partner.image;
  image.alt = `${partner.digimonName}, ${partner.species}, ${partner.stage}`;
  document.getElementById('welcome').textContent = `Um tempo com ${partner.digimonName}.`;
}

renderPartner(mockPartner);

const messages = {
  food: 'Ele parece interessado.',
  play: 'Ele mal pode esperar para brincar.',
  train: 'Hora de treinar.',
  talk: 'Ele está ouvindo você, Tamer.',
};
let messageTimer;
let reactionTimer;
const message = document.getElementById('pet-message');
const room = document.getElementById('room');
document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => {
    clearTimeout(messageTimer);
    clearTimeout(reactionTimer);
    document.querySelectorAll('[data-action]').forEach(item => item.classList.remove('is-active'));
    button.classList.add('is-active');
    message.textContent = button.dataset.action === 'talk'
      ? `Ele está ouvindo você, ${mockPartner.humanName}.`
      : messages[button.dataset.action];
    message.classList.add('is-visible');
    room.classList.remove('is-reacting');
    void room.offsetWidth;
    room.classList.add('is-reacting');
    reactionTimer = setTimeout(() => room.classList.remove('is-reacting'), 900);
    messageTimer = setTimeout(() => {
      message.classList.remove('is-visible');
      message.textContent = '';
      button.classList.remove('is-active');
    }, 3200);
  });
});

const fullscreen = document.getElementById('fullscreen');
if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector('.pet-experience').requestFullscreen();
  } catch {
    message.textContent = 'Use F11 para ampliar a sala no navegador.';
    message.classList.add('is-visible');
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => { message.classList.remove('is-visible'); message.textContent = ''; }, 3200);
  }
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.setAttribute('aria-label', document.fullscreenElement ? 'Sair da tela cheia' : 'Entrar em tela cheia');
});
