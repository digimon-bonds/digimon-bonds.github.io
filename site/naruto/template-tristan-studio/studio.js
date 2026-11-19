'use strict';
const storageKey = 'nsc:tristan-template-studio:draft:v1';
const catalogKey = 'nsc:tristan-template-studio:jutsus:v1';
const publicBase = 'https://digimon-bonds.github.io/naruto/template-tristan-studio/';
const defaults = {
 name: 'Tristan', quote: 'Se começar a ver coisas, me avisa!', number: '01', rp: 'Treino Solo', title: 'A delicadeza da dose',
 story: 'O sapo observava a bancada com uma paciência que Genryuusai invejava. Entre os dois, uma gota violeta repousava no fundo do frasco.\n\nEle inclinou o vidro contra a luz. A cor parecia mais escura do que no ensaio anterior. Talvez fosse a proporção. Talvez fosse o calor que atravessava as paredes do laboratório. Anotou as duas possibilidades na margem do caderno.\n\n*— Você também acha que falta alguma coisa?*\n\nO sapo coaxou.\n\nGenryuusai sorriu e puxou outro frasco para perto.',
 notes: 'Objetivo do treino:\nResultado da rolagem:\nConsiderações:', chosen: []
};
const initialCatalog = [
 {
  "name": "Bunshin no Jutsu",
  "rank": "E",
  "art": "Ninjutsu",
  "type": "Suplementar",
  "range": "",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: Livre, respeitando o custo de manutenção.\nDescrição: O usuário produz cópias ilusórias de sua própria aparência. As duplicatas não possuem substância física e servem para confundir a observação do adversário, sem executar ataques nem interagir materialmente com o cenário.\n\n— Pode criar até 3 cópias simultâneas.\n— A ativação é suplementar e não consome uma ação de combate. A manutenção consome 20 CK por round em que as cópias permanecerem ativas.\n— As cópias podem reproduzir movimentos distintos dos realizados pelo usuário, mas não possuem autonomia real nem podem causar danos.\n— Enquanto as cópias permanecerem ativas e forem relevantes para confundir o adversário, o usuário recebe +1 nos testes de acerto. Esse bônus não se multiplica pela quantidade de cópias.\n— O usuário pode se deslocar fisicamente entre as imagens para dificultar sua identificação, mas não pode trocar instantaneamente de posição com uma cópia.\n— Um adversário que disponha de meios de distinguir imagens incorpóreas poderá reduzir ou neutralizar a vantagem, conforme as regras de detecção e a narrativa.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Kawarimi no Jutsu",
  "rank": "E",
  "art": "Ninjutsu",
  "type": "Defensiva",
  "range": "Objeto preparado a até 10 metros.",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: 1 por ponto de Inteligencia, por combate.\nAlcance: Objeto preparado a até 10 metros.\nDescrição: Técnica de substituição preparada antecipadamente, pela qual o usuário aproveita um objeto próximo para simular que recebeu um ataque e se reposicionar. Não se trata de teletransporte, nem cria imunidade automática a qualquer ameaça.\n\n— O uso deve ser preparado em um round anterior ao da substituição. Durante a preparação, o jogador identifica o objeto que será utilizado, localizado a até 10 metros.\n— Quando o personagem seria atingido por um ataque válido, poderá ativar a substituição gastando uma ação defensiva do round. A ativação dispensa uma nova ação de preparação.\n— Pode responder a ataques físicos e técnicas de até Rank B, desde que haja condição narrativa de substituição e que o personagem ainda possa agir. Não protege contra efeitos de área que também alcancem sua nova posição.\n— Cada personagem dispõe de 1 uso por ponto de Inteligência a cada combate, respeitado o máximo decorrente de seus atributos.\n— Depois de se reposicionar, poderá realizar um teste de Furtividade, quando possuir condições para se ocultar; caso não obtenha sucesso, o adversário identifica sua nova posição.\n— A técnica não pode ser preparada retrospectivamente após o ataque adversário ser anunciado.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Kinobori Shūgyō",
  "rank": "E",
  "art": "Ninjutsu",
  "type": "Suplementar",
  "range": "",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: Ilimitado, enquanto houver condições para sustentá-la.\nDescrição: Exercício fundamental de Controle de Chakra que concentra energia nos pés para manter aderência a árvores, paredes e outras superfícies inclinadas ou verticais.\n\n— Em condições normais, permite caminhar ou permanecer sobre superfícies sólidas adequadas sem testes adicionais.\n— Após consumir mais de 50% do CK máximo do personagem, a manutenção passa a custar 30 CK por uso/round de manutenção.\n— Quando o personagem tiver consumido 80% ou mais do CK máximo, não poderá iniciar nem manter a técnica.\n— Superfícies especiais, ataques e interrupções de concentração continuam sujeitos às regras gerais do confronto.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Suimen Hokō no Gyō",
  "rank": "E",
  "art": "Ninjutsu",
  "type": "Suplementar",
  "range": "",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: Ilimitado, enquanto houver condições para sustentá-la.\nDescrição: Técnica de Controle de Chakra que mantém um fluxo equilibrado de energia sob os pés, permitindo ao usuário sustentar-se e deslocar-se pela superfície da água e de outros líquidos compatíveis.\n\n— Em condições normais, permite caminhar ou permanecer sobre superfícies líquidas sem teste adicional para evitar afundar.\n— Após consumir mais de 50% do CK máximo, a manutenção passa a custar 30 CK por uso/round de manutenção.\n— Quando o personagem tiver consumido 80% ou mais do CK máximo, não poderá iniciar nem manter a técnica.\n— A técnica não torna o líquido sólido, não protege contra perigos presentes nele e não impede que impactos ou interrupções comprometam a sustentação.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Henge no Jutsu",
  "rank": "E",
  "art": "Ninjutsu",
  "type": "Suplementar",
  "range": "",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: Ilimitado.\nDescrição: Técnica de transformação que altera a aparência externa do usuário para reproduzir a forma de outra pessoa, animal ou objeto dentro das proporções permitidas. A mudança não concede as propriedades, capacidades ou resistência física daquilo que foi imitado.\n\n— As formas assumidas devem possuir entre 1 e 2 metros de dimensão predominante, não sendo possível transformar-se em objetos minúsculos ou criaturas gigantescas.\n— A transformação não concede acesso a Kekkei Genkai, atributos, técnicas, armas naturais nem outras habilidades do modelo copiado.\n— A técnica é desfeita quando o usuário sofre dano ou perde a concentração necessária à sua sustentação.\n— O Henge não substitui automaticamente testes de infiltração ou disfarce quando outros personagens tiverem motivos e meios para investigar a aparência.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Sakki no Jutsu",
  "rank": "E",
  "art": "Ninjutsu",
  "type": "Suplementar / Controle",
  "range": "",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: 2 vezes por combate.\nDescrição: O personagem exterioriza uma intenção assassina intensa e ameaçadora, buscando provocar medo e hesitação em adversários menos preparados para suportar sua presença.\n\n— O aplicador realiza um teste com um atributo social apropriado ou outro atributo que represente de forma convincente a ameaça narrada. O alvo resiste com Força de Vontade + 1D10.\n— Somente poderá afetar personagens de Nível inferior ao do usuário ou que possuam Força de Vontade pelo menos 2 pontos abaixo da do aplicador.\n— Em caso de sucesso, aplica Paralisia, respeitando os limites do efeito.\n— O alvo pode tentar superar o medo através de Força de Vontade + 1D10 contra dificuldade 10, em uma oportunidade de reação permitida pelo combate.\n— Também poderá romper a paralisia ao sofrer mais de 60 pontos de dano físico real; essa opção somente pode ser explorada a partir do round seguinte à aplicação, de modo que exista pelo menos um round sob o efeito.\n— O emprego da técnica exige uma intenção de ameaça genuína e coerente com a personalidade e as circunstâncias da cena. A restrição antiga por alinhamento moral fica pendente de confirmação, pois a classificação “caótico neutro ou superior” não define uma progressão inequívoca de alinhamentos.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Nawanuke no Jutsu",
  "rank": "E",
  "art": "Ninjutsu",
  "type": "Suplementar",
  "range": "",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: Ilimitado.\nDescrição: Técnica de fuga ensinada na Academia Ninja, baseada em movimentos corporais e controle preciso de chakra para afrouxar e escapar de cordas ou amarras convencionais.\n\n— Para se libertar, o usuário realiza Controle de Chakra + 1D10 e precisa atingir a dificuldade 6.\n— Funciona apenas contra cordas e amarras convencionais. Não rompe correntes, aprisionamentos especiais ou técnicas de contenção baseadas em chakra.\n— Exige que o personagem ainda possua alguma liberdade física e condições narrativas de executar a manobra; não significa escapar automaticamente de qualquer restrição.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Shunshin no Jutsu",
  "rank": "D",
  "art": "Ninjutsu",
  "type": "Suplementar / Movimentação",
  "range": "Até 15 metros.",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: 2 vezes por combate.\nAlcance: Até 15 metros.\nDescrição: O usuário concentra chakra para realizar um deslocamento veloz e repentino. Embora possa parecer um teletransporte aos observadores, o personagem percorre fisicamente a distância.\n\n— O deslocamento máximo é de 15 metros por utilização.\n— O uso substitui a locomoção convencional do personagem no momento da execução e consome 1 ação.\n— Quando empregado defensivamente para evitar um ataque, exige sucesso no teste de Percepção pertinente à defesa, além do gasto da ação correspondente.\n— Não atravessa barreiras sólidas, não permite passar por espaços fisicamente impossíveis e não supera automaticamente técnicas que atinjam toda a área de destino.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Kanashibari no Jutsu",
  "rank": "D",
  "art": "Ninjutsu",
  "type": "Suplementar / Controle",
  "range": "8 metros.",
  "seals": "Tigre, com uma mão.",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: 2 vezes por combate.\nSelos: Tigre, com uma mão.\nAlcance: 8 metros.\nDescrição: Por meio de pressão de chakra e intenção intimidatória, o usuário busca imobilizar o corpo de um ou mais adversários, comprometendo temporariamente suas ações de movimento.\n\n— Pode afetar até 3 alvos simultaneamente, desde que cada um esteja dentro do alcance.\n— Aplica Paralisia durante 1 round sobre os alvos que não resistirem à técnica.\n— Somente poderá afetar personagens com Controle de Chakra inferior ao do aplicador ou com reserva máxima de CK inferior a 300.\n— Para cada 100 pontos completos de vantagem de CK máximo que o aplicador possuir sobre um alvo, recebe +1 no modificador de aprisionamento contra aquele alvo. Vantagem parcial não gera bônus.\n— Os testes de aplicação e resistência seguem a regra geral de confronto entre técnicas, com resultados resolvidos individualmente para cada alvo. A técnica não estabelece vitória automática apenas pelo requisito de CK.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 },
 {
  "name": "Genjutsu Kai",
  "rank": "—",
  "art": "Ninjutsu",
  "type": "Suplementar",
  "range": "",
  "seals": "",
  "cost": "Aquisição inicial gratuita. Uso: conforme a descrição e as regras gerais.",
  "cd": "",
  "requirements": "Técnica básica inicial; respeitar as condições individuais de uso.",
  "description": "Limite de Uso: Ilimitado, respeitando custos, ações e demais condições.\nDescrição: Procedimento de liberação de Genjutsu por interrupção ou reajuste do fluxo de chakra. Pode ser realizado pelo próprio alvo, quando identifica que está sob uma ilusão, ou por um aliado em condições de prestar auxílio.\n\n— Segue integralmente as regras de Aplicação, Identificação e Dissipação estabelecidas no Sistema de Genjutsu.\n— A utilização consciente pelo próprio alvo exige identificação prévia da ilusão, salvo exceção expressa de uma habilidade específica.\n— O teste individual de dissipação é realizado com Controle de Chakra + modificadores + 1D10 contra a dificuldade da ilusão.\n— O custo básico em CK toma como referência o custo da técnica a ser desfeita, aplicando os descontos de Controle de Chakra previstos no Sistema de Genjutsu.\n— O auxílio externo depende de contato ou alcance apropriado, da disponibilidade de uma ação e das condições específicas da ilusão; não oferece libertação automática de toda e qualquer técnica.\n— Jinchūrikis ou outras habilidades capazes de interromper o fluxo de chakra de maneira especial devem seguir suas regras próprias.",
  "source": "Formação inicial — https://nsc-rpg.forumeiros.com/t8-regra-aquisicao-de-jutsus"
 }
];
function readSaved(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
let draft = {...defaults, ...readSaved(storageKey, readSaved('nsc:dokugiri-template-studio:draft:v1', {}))};
let catalog = readSaved(catalogKey, initialCatalog);
if (!Array.isArray(catalog) || !catalog.length) catalog = initialCatalog;
const fields = ['number','rp','title','story','notes'];
const preview = document.querySelector('#preview');
const status = document.querySelector('#export-status');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const italicHTML = text => escapeHTML(text).replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
function wordCount(text) { return (text.replace(/\*/g,'').match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu) || []).length; }
function drops(count) { return Array.from({length:count},(_,i)=>`<span class="dk-drop" style="--x:${8+i*84/(count-1)}%;--speed:${3.8+i%3*.7}s;--delay:-${i*.63}s"></span>`).join(''); }
function render() {
 const chosen = new Set(Array.isArray(draft.chosen) ? draft.chosen : []);
 const jutsus = catalog.filter(j => chosen.has(j.name));
 const cards = jutsus.map(j => {
  const metadata = [['Arte',j.art],['Classe',j.type],['Alcance',j.range],['Selos',j.seals],['Custo',j.cost],['CD',j.cd],['Requisitos',j.requirements]].filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join('\n');
  return `<details class="dk-jutsu"><summary>${escapeHTML(j.name)}<span class="dk-rank">Rank ${escapeHTML(j.rank || '—')}</span></summary><div class="dk-jutsu-text">${escapeHTML(metadata)}${metadata?'\n\n':''}${escapeHTML(j.description || '')}</div></details>`;
 }).join('');
 preview.innerHTML = `<div class="dk-frame"><div class="dk-post" lang="pt-BR"><div class="dk-hero"><div class="tr-oracle-deck" aria-label="Cartas do oráculo"><button type="button" class="tr-oracle-card tr-oracle-0" aria-label="Carta 7: Serpente"><svg viewBox="0 0 120 170" aria-hidden="true"><rect x="2" y="2" width="116" height="166" rx="12" fill="#f8eedf" stroke="#98729e" stroke-width="1.6"/><rect x="9" y="9" width="102" height="152" rx="7" fill="none" stroke="#ae89ad" stroke-width=".8"/><text x="16" y="34" fill="#66416f" font-family="Georgia,serif" font-size="25">7</text><text x="17" y="52" fill="#66416f" font-size="19">♣</text><path d="M28 107C73 110 36 88 58 84C99 77 31 72 55 61C63 57 72 59 78 52" fill="none" stroke="#79517f" stroke-width="8" stroke-linecap="round"/><path d="M74 49Q89 43 92 49Q89 56 77 55Z" fill="#79517f"/><circle cx="85" cy="49" r="1.2" fill="#f8eedf"/><path d="M92 51L100 54L103 52M100 54L104 56M26 111L20 118M29 112L38 117M80 104L91 92M83 108L95 105" fill="none" stroke="#79517f" stroke-width="1.3"/></svg></button><button type="button" class="tr-oracle-card tr-oracle-1" aria-label="Carta 6: Nuvens"><svg viewBox="0 0 120 170" aria-hidden="true"><rect x="2" y="2" width="116" height="166" rx="12" fill="#f8eedf" stroke="#98729e" stroke-width="1.6"/><rect x="9" y="9" width="102" height="152" rx="7" fill="none" stroke="#ae89ad" stroke-width=".8"/><text x="16" y="34" fill="#66416f" font-family="Georgia,serif" font-size="25">6</text><text x="17" y="52" fill="#66416f" font-size="19">♣</text><circle cx="58" cy="70" r="20" fill="#99739e"/><path d="M18 92Q19 80 31 83Q35 69 47 78Q55 68 65 82Q77 78 81 90H18Z" fill="#96719b" stroke="#f8eedf" stroke-width="2.5"/><path d="M49 108Q49 94 63 98Q69 79 82 91Q95 83 101 100L108 106Z" fill="#99739e" stroke="#f8eedf" stroke-width="2.5"/></svg></button><button type="button" class="tr-oracle-card tr-oracle-2" aria-label="Carta 8: Caixão"><svg viewBox="0 0 120 170" aria-hidden="true"><rect x="2" y="2" width="116" height="166" rx="12" fill="#f8eedf" stroke="#98729e" stroke-width="1.6"/><rect x="9" y="9" width="102" height="152" rx="7" fill="none" stroke="#ae89ad" stroke-width=".8"/><text x="16" y="34" fill="#66416f" font-family="Georgia,serif" font-size="25">8</text><text x="17" y="52" fill="#66416f" font-size="19">♣</text><path d="M32 99L45 64L66 48L86 52L94 72L65 112Z" fill="#6a4771" stroke="#795580" stroke-width="1.8"/><path d="M39 97L50 67L68 54L84 57L86 70L62 106Z" fill="none" stroke="#e6d5de" stroke-width="1.2"/><path d="M94 72L87 61M65 112L62 106" stroke="#e6d5de" stroke-width="1.2"/><path d="M66 65L58 83M56 69L71 75" stroke="#f5e8dc" stroke-width="1.7"/><path d="M30 109L24 98M28 112L19 110M78 116L82 105M80 116L92 108" stroke="#795580" stroke-width="1.3"/></svg></button></div><svg class="dk-hero-surface" viewBox="0 0 720 300" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dk-purple-surface" x1="0%" y1="0%" x2="100%" y2="90%"><stop stop-color="#15111e"/><stop offset=".46" stop-color="#38223e"/><stop offset="1" stop-color="#1b1426"/></linearGradient><radialGradient id="dk-banner-light" cx="29%" cy="26%" r="75%"><stop stop-color="#a67caa" stop-opacity=".23"/><stop offset=".56" stop-color="#836294" stop-opacity=".06"/><stop offset="1" stop-color="#211927" stop-opacity="0"/></radialGradient><pattern id="dk-banner-grain" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" stroke="#d8c2e2" stroke-opacity=".035" stroke-width=".6"/></pattern><clipPath id="dk-banner-clip"><path d="M0 57Q0 37 22 31C111 4 170 56 290 24S475 2 560 24S650 43 696 25Q720 16 720 42V300H0Z"/></clipPath></defs><path d="M0 57Q0 37 22 31C111 4 170 56 290 24S475 2 560 24S650 43 696 25Q720 16 720 42V300H0Z" fill="url(#dk-purple-surface)"/><g clip-path="url(#dk-banner-clip)"><path d="M0 0H720V300H0Z" fill="url(#dk-banner-light)"/><path d="M0 0H720V300H0Z" fill="url(#dk-banner-grain)"/><g fill="none" stroke="#c7a7cf" stroke-width=".7" opacity=".12"><path d="M-40 253C78 183 146 290 285 239S501 172 592 228"/><path d="M-40 264C78 194 146 301 285 250S501 183 592 239"/><path d="M-40 276C78 206 146 313 285 262S501 195 592 251"/></g><path d="M5 59Q5 41 25 36C111 9 170 61 290 29S475 7 560 29S650 48 696 30" fill="none" stroke="#d6badb" stroke-opacity=".16" stroke-width="1"/></g></svg><img class="dk-art" src="./assets/tristan-portrait.png" alt="Tristan de chapéu preto com faixa roxa"><div class="dk-hero-copy"><span class="dk-banner-origin">HERDEIRO <span>/</span> SUNAGAKURE</span><div class="dk-entry-heading"><span class="dk-number">${escapeHTML(draft.number)}</span><div><span class="dk-type">${escapeHTML(draft.rp)}</span><h3 class="dk-title">${escapeHTML(draft.title)}</h3></div></div></div><svg class="dk-wave" viewBox="0 0 720 100" preserveAspectRatio="none" aria-hidden="true"><path class="dk-paper-wave" d="M0 46C115 85 220 9 362 39S586 100 720 36V100H0Z" fill="#faf3e6"/><path class="dk-ribbon-wave" d="M0 45.5C115 84.5 220 8.5 362 38.5S586 99.5 720 35.5V46C581 112 476 72 360 49S117 96 0 56Z" fill="#b296b9"/></svg></div><div class="dk-paper"><div class="dk-film"></div><div class="dk-entry"><div class="dk-prose"><p>${italicHTML(draft.story)}</p></div></div><details class="dk-ledger"><summary><svg class="dk-bar-icon dk-card-icon" viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="3" width="20" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="1.7" transform="rotate(9 17 16)"/><rect x="4" y="3" width="20" height="26" rx="3" fill="#f4e9d9" stroke="currentColor" stroke-width="1.7"/><path d="M14 9C12 12 9 13 9 16C9 19 12 20 14 18C16 20 19 19 19 16C19 13 16 12 14 9ZM14 17L12 23H16Z" fill="currentColor"/></svg>Observações de campo</summary><div class="dk-note-body"><div class="dk-word-count">Nº DE PALAVRAS · ${wordCount(draft.story)}</div>${italicHTML(draft.notes)}</div></details><details class="dk-ledger"><summary><svg class="dk-bar-icon dk-scroll" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 5h17v20H8z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 5C1 1 1 12 8 10m17 15c7-4 7 7 0 3H8V10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12h9m-9 5h9m-9 5h6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Jutsus utilizados</summary>${cards || '<div class="dk-empty">Nenhuma técnica registrada neste relato.</div>'}</details><div class="dk-ending"><span class="tr-sorcerer-seal" lang="ja" role="img" aria-label="Feiticeiro">呪術師</span></div></div></div></div>`;
 document.querySelector('#technique-count').textContent = `(${jutsus.length})`;
}
function save() {
 try { localStorage.setItem(storageKey,JSON.stringify(draft));document.querySelector('#save-status').textContent='Rascunho salvo'; }
 catch { document.querySelector('#save-status').textContent='Sem armazenamento disponível'; }
}
for (const id of fields) {
 const field=document.getElementById(id);field.value=draft[id];
 field.addEventListener('input',()=>{draft[id]=field.value;save();render();});
}
function renderCatalog() {
 const container=document.querySelector('#techniques');container.replaceChildren();
 for (const item of catalog) {
  const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=draft.chosen?.includes(item.name) || false;
  box.addEventListener('change',()=>{const chosen=new Set(draft.chosen || []);box.checked?chosen.add(item.name):chosen.delete(item.name);draft.chosen=[...chosen];save();render();});
  label.append(box,document.createTextNode(`${item.name} · Rank ${item.rank || '—'}`));container.append(label);
 }
}
document.querySelector('#italic').addEventListener('click',()=>{const field=document.querySelector('#story');const start=field.selectionStart,end=field.selectionEnd;field.setRangeText('*'+field.value.slice(start,end)+'*',start,end,'select');field.dispatchEvent(new Event('input'));field.focus();});
document.querySelector('#import').addEventListener('click',()=>{
 const message=document.querySelector('#import-status');
 try {const raw=JSON.parse(document.querySelector('#import-data').value);const entries=Array.isArray(raw)?raw:raw.jutsus;if(!Array.isArray(entries)||!entries.length||entries.some(j=>!j||typeof j.name!=='string'||!j.name.trim()))throw Error();catalog=entries.map(j=>Object.fromEntries(['name','rank','description','art','type','range','seals','cost','cd','requirements'].map(k=>[k,typeof j[k]==='string'?j[k]:''])));localStorage.setItem(catalogKey,JSON.stringify(catalog));renderCatalog();render();message.textContent='Catálogo atualizado.';}catch{message.textContent='Confira o JSON. Cada jutsu precisa ter um nome.';}
});
async function exportCode() {
 const response=await fetch(document.querySelector('#template-style').href);if(!response.ok)throw Error('CSS indisponível');const css=await response.text();const article=preview.querySelector('.dk-frame').cloneNode(true);
 article.querySelectorAll('img').forEach(img=>img.setAttribute('src',new URL(img.getAttribute('src'),publicBase).href));
 return '<style>'+css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};,])\s*/g,'$1').trim().replace(/\s*\)/g,' )')+'</style>'+article.outerHTML.replace(/\r?\n/g,'&#10;');
}
document.querySelector('#copy').addEventListener('click',async()=>{
 try {const code=await exportCode();document.querySelector('#export-code').value=code;try{await navigator.clipboard.writeText(code);status.textContent='Template copiado. Cole no modo fonte do fórum.';}catch{const field=document.querySelector('#export-code');field.hidden=false;field.value=code;field.focus();field.select();status.textContent='Código selecionado. Pressione Ctrl+C para copiar.';}}catch{status.textContent='Abra o Studio por um servidor HTTP para exportar o template.';}
});
document.querySelector('#download').addEventListener('click',async()=>{
 try {const code=await exportCode();const blob=new Blob(['<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tristan</title><body>'+code+'</body></html>'],{type:'text/html'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='tristan-template.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}catch{status.textContent='Abra o Studio por um servidor HTTP para baixar o template.';}
});
renderCatalog();render();

