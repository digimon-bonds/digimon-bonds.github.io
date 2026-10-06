import {digimonDatabase,digimonStages,evolutionCategories,searchDigimon,collectedAt} from './digimon-database.js';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
function card(d){
 const article=el('article','digibank-card');article.dataset.digimonId=d.id;
 article.style.setProperty('--species-accent','#f6b34b');
 const art=el('div','digibank-art'),image=el('img');
 image.src=d.image;image.alt=d.name;image.loading='lazy';image.decoding='async';image.width=240;image.height=200;
 const missing=el('span','digibank-image-fallback','◈ IMAGEM INDISPONÍVEL');missing.hidden=true;
 image.addEventListener('error',()=>{image.hidden=true;missing.hidden=false;},{once:true});art.append(image,missing);
 const stage=digimonStages.find(s=>s.id===d.stage).label+(d.isXBody?' // '+digimonStages.find(s=>s.id===d.progressionStage)?.label:'');
 art.append(el('span','digibank-stage',stage));article.append(art);
 const content=el('div','digibank-card-content');content.append(el('p','digibank-record',d.id.replace(/^(rookie|champion|ultimate|mega|special)-/,'DB // ').toUpperCase()),el('h2','',d.name));
 if(d.evolutionCategory!=='standard')content.append(el('p','digibank-evolution-tag',evolutionCategories.find(category=>category.id===d.evolutionCategory)?.label));
 const facts=el('dl','digibank-facts');
 for(const [label,value] of [['ATRIBUTO DIGITAL',d.digitalAttribute],['ELEMENTO',d.element],['CLASSIFICAÇÃO',d.classification]]){
  const row=el('div');row.append(el('dt','',label),el('dd','',value));facts.append(row);
 }
 content.append(facts,el('p','digibank-description',d.description));
 if(d.evolutionRequirement){
  const requirement=el('div','digibank-evolution-requirement');
  requirement.append(el('strong','',d.evolutionComponents?.length?'FORMAS NECESSÁRIAS':'CONDIÇÃO DE EVOLUÇÃO'));
  if(d.evolutionComponents?.length)requirement.append(el('p','digibank-components',d.evolutionComponents.map(component=>component.name).join(' + ')));
  requirement.append(el('p','',d.evolutionRequirement));content.append(requirement);
 }
 if(d.partner)content.append(el('p','digibank-partner','COMPANHEIRO: '+d.partner.toLocaleUpperCase('pt-BR')));
 else if(d.availableAsPartner)content.append(el('p','digibank-partner digibank-partner-available','PARCEIRO INICIAL DISPONÍVEL'));
 else if(d.stage==='rookie'&&!d.initialEligible)content.append(el('p','digibank-partner digibank-partner-unavailable','INDISPONÍVEL'));
 article.append(content);return article;
}
export function mountDigibank(root){
 root.className='digibank-area';
 const hero=el('div','digibank-hero');hero.append(el('p','eyebrow','DB–03 // SPECIES ARCHIVE'),el('h1','','DIGIMON BONDS // DIGIBANK'),el('p','','Explore espécies, descubra seus atributos e encontre seu parceiro digital.'));
 root.append(hero);
 const controls=el('section','digibank-controls');controls.setAttribute('aria-label','Buscar e filtrar Digimon');
 const label=el('label','','BUSCAR POR NOME'),input=el('input');input.type='search';input.placeholder='Ex.: Agumon, Garurumon, Gammamon';input.autocomplete='off';input.id='digibank-search';label.htmlFor=input.id;
 controls.append(label,input);
 const filters=el('div','digibank-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Estágio evolutivo');
 let activeStage='all';const count=el('p','digibank-results');count.setAttribute('role','status');count.setAttribute('aria-live','polite');
 const grid=el('div','digibank-grid');grid.id='digibank-records';
 const empty=el('div','digibank-empty');empty.hidden=true;
 const emptyTitle=el('h2'),emptyText=el('p');empty.append(el('span','','◈'),emptyTitle,emptyText);
 function render(){
  const records=searchDigimon({query:input.value,stage:activeStage});
  if(activeStage==='rookie'){
   const items=[];
   for(const [initialEligible,title] of [[true,'PARCEIROS INICIAIS'],[false,'OUTROS NOVATOS // INDISPONÍVEIS COMO INICIAIS']]){
    const group=records.filter(d=>d.initialEligible===initialEligible);
    if(group.length){items.push(el('h2','digibank-rookie-group',title+' // '+group.length));items.push(...group.map(card));}
   }
   grid.replaceChildren(...items);
  }else grid.replaceChildren(...records.map(card));
  count.textContent=records.length+' '+(records.length===1?'registro encontrado':'registros encontrados');
  empty.hidden=records.length!==0;
  const pending=activeStage!=='all'&&!digimonDatabase.some(d=>d.stage===activeStage);
  emptyTitle.textContent=pending?'Arquivo em expansão':'Nenhum Digimon encontrado';
  emptyText.textContent=pending?'Este estágio está preparado para novos registros. Nesta versão, consulte Novatos, Campeões, Perfeitos, Megas e Especiais.':'Tente outro nome ou estágio.';
  filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bankStage===activeStage)));
 }
 for(const stage of [{id:'all',label:'TODOS'},...digimonStages]){
  const n=digimonDatabase.filter(d=>stage.id==='all'||d.stage===stage.id).length;
  const button=el('button','',stage.label);button.type='button';button.dataset.bankStage=stage.id;button.setAttribute('aria-controls',grid.id);button.append(el('span','',n));
  button.addEventListener('click',()=>{activeStage=stage.id;render();});filters.append(button);
 }
 input.addEventListener('input',render);controls.append(filters,count);
 root.append(controls,grid,empty,el('p','digibank-note','Arquivo consultado em '+collectedAt.split('-').reverse().join('/')+'. Elementos e equivalências de estágio são adaptações do Bonds, em revisão. Os requisitos especiais conhecidos aparecem em cada card.'));
 render();
}
