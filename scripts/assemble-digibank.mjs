import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {exclusionReason} from './digibank-curation.mjs';
import {specialEvolution,evolutionComponents,combinedSpirits} from './digibank-special-curation.mjs';
import {translateClassification} from '../site/digimon-localization.js';
import {addDigibankSpecies} from './digibank-additions.mjs';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const editorial=async path=>new Map((await readFile(path,'utf8')).trim().split(/\r?\n/).map(line=>{const [id,...values]=line.split('|');return [id,values];}));
const rookieText=await editorial('scripts/digibank-rookie-editorial.tsv');
const championText=await editorial('scripts/digibank-editorial.tsv');
const ultimateText=await editorial('scripts/digibank-ultimate-editorial.tsv');
const megaText=await editorial('scripts/digibank-mega-editorial.tsv');
const elementReview=await editorial('scripts/digibank-element-review.tsv');
const hybridText=await editorial('scripts/digibank-hybrid-editorial.tsv');
const displayName=name=>name.toLowerCase().replace(/(^|[\s-])([a-z])/g,(_,prefix,letter)=>prefix+letter.toUpperCase());
// Neutro is permitted by the Bonds author, outside the three advantage cycles.
const elementCorrections={};
const slug=name=>name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const rookies=(await read('.digibank-research/forum-bank.json')).map(({text,image})=>{
 const lines=text.trim().split(/\n/).map(s=>s.trim()).filter(Boolean),name=lines[0];
 const field=label=>lines.find(s=>s.startsWith(label+':'))?.split(':').slice(1).join(':').trim();
 const partner=field('Companheiro')?.replace(/\.$/,'')||null;
 const description=rookieText.get(name)?.[0];if(!description)throw Error('Missing rookie '+name);
 return {id:'rookie-'+slug(name),name:displayName(name),legacyName:name,stage:'rookie',evolutionCategory:'standard',digitalAttribute:field('Atributo Digital').replace(/^Virus$/,'Vírus'),element:elementCorrections[name]||field('Elemento'),sourceElement:field('Elemento'),classification:field('Classificação'),description,image,availableAsPartner:!partner,partner,sourceUrl:'https://digimonbonds.forumeiros.com/t14-09-digibank',elementReason:elementCorrections[name]?'Proposta em substituição a Neutro, seguindo os ciclos confirmados: '+description:'Adaptação preservada do Digibank do Bonds.',provenance:'bonds',reviewStatus:'pending'};
});
const exclusions=[];
function curated(rows){return rows.filter(row=>{const reason=exclusionReason(row);if(reason && reason!=='Variante de Anticorpo X')exclusions.push({name:row.name,sourceUrl:row.sourceUrl,reason});return !reason;});}
function officialEntry(row,stage,level,text){
 const id=row.directory_name;
 const aliases={'greymon_x':'greymon-first','greymon_blue_x':'greymon_blue','garurumon_x':'garurumon','tailmon_x':'tailmon','dobermon_x':'dobermon'};
 const base=id.replace(/_x$/,'');
 const content=text.get(id)||text.get(aliases[id]||base);
 if(!content)throw Error('Missing '+level+' editorial '+id);
 if(!row.officialLevel.startsWith(level)||!row.officialAttribute||!row.officialType)throw Error('Invalid official metadata '+id);
 const [proposedElement,description]=content;
 const element=elementCorrections[id]||elementCorrections[base]||proposedElement;
 const recordId=stage+'-'+slug(id),review=elementReview.get(recordId);
 return {id:recordId,name:row.name,stage,digitalAttribute:({Vaccine:'Vacina',Virus:'Vírus'})[row.officialAttribute]||row.officialAttribute,element:review?.[0]||element,classification:translateClassification(row.officialType),description,image:row.image,availableAsPartner:false,partner:null,sourceUrl:row.sourceUrl,official:{level:row.officialLevel,attribute:row.officialAttribute,type:row.officialType},elementReason:review?.[1]||description,provenance:'official',reviewStatus:'pending'};
}
const champs=curated(await read('.digibank-research/champion-research.json')).map(row=>officialEntry(row,'champion','Champion',championText));
const ultimates=curated(await read('.digibank-research/ultimate-research.json')).map(row=>officialEntry(row,'ultimate','Ultimate',ultimateText));
const megas=curated(await read('.digibank-research/mega-research.json')).map(row=>officialEntry(row,'mega','Mega',megaText));
const records=[...rookies,...champs,...ultimates,...megas];
const hybrids=curated(await read('.digibank-research/hybrid-research.json')).map(row=>{
 const content=hybridText.get(row.directory_name);if(!content)throw Error('Missing Hybrid '+row.directory_name);
 const [stage,evolutionCategory,element,description]=content;
 const entry=officialEntry(row,stage,'Hybrid',new Map([[row.directory_name,[element,description]]]));
 const components=combinedSpirits[row.directory_name];
 const requirement=components?'Reúne os Digiespíritos humano e Fera da mesma afinidade.':row.directory_name==='kaisergreymon'?'Reúne os Digiespíritos humano e Fera de Fogo, Vento, Gelo, Terra e Madeira.':row.directory_name==='magnagarurumon'?'Reúne os Digiespíritos humano e Fera de Luz, Trovão, Água, Metal e Escuridão.':null;
 return {...entry,evolutionCategory,availableAsPartner:stage==='rookie',requiresSpecialEvolution:false,...(requirement?{evolutionRequirement:requirement}:{}),...(components?{evolutionComponents:components.map(([digimonId,name])=>({digimonId,name}))}:{})};
});
records.push(...hybrids);
await addDigibankSpecies(records,officialEntry);
const babyI=await editorial('scripts/digibank-baby-editorial.tsv'),babyII=await editorial('scripts/digibank-baby-ii-editorial.tsv');
const babyRows=[...(await read('.digibank-research/in-trainingⅰ-research.json')),...(await read('.digibank-research/in-trainingⅱ-research.json'))];
const babies=curated(babyRows).map(row=>{
 const babyText=row.officialLevel.includes('Ⅱ')?babyII:babyI;
 const entry=officialEntry({...row,officialAttribute:row.officialAttribute||'Não definido'},'baby','In-Training',babyText);
 entry.official.attribute=row.officialAttribute||null;entry.initialEligible=false;entry.isXBody=false;
 return entry;
});
records.push(...babies);
const extraText=await editorial('scripts/digibank-supplemental-editorial.tsv');
for(const row of curated((await read('.digibank-research/supplemental-research.json')).filter(r=>r.officialLevel!=='Armor'))){
 const entry=officialEntry({...row,officialAttribute:row.officialAttribute||'Não definido'},'special',row.officialLevel,extraText);
 entry.official.attribute=row.officialAttribute||null;entry.initialEligible=false;entry.isXBody=false;
 if(row.officialLevel==='Armor'){entry.evolutionCategory='armor';const egg=row.profile.match(/Digi-?Egg of ([A-Za-z]+)/i)?.[1],labels={Courage:'Coragem',Friendship:'Amizade',Love:'Amor',Sincerity:'Sinceridade',Knowledge:'Conhecimento',Reliability:'Confiabilidade',Hope:'Esperança',Light:'Luz',Kindness:'Bondade',Miracles:'Milagres',Destiny:'Destino'};entry.evolutionRequirement='Evolução Armor: requer '+(labels[egg]?'o Digimental de '+labels[egg]:'o Digimental correspondente')+' e autorização do Narrador.';}
 else {entry.evolutionCategory='special';entry.evolutionRequirement='Forma de nível oficial desconhecido; exige avaliação do Narrador.';}
 records.push(entry);
}
for(const entry of records.filter(d=>d.isXBody))entry.image='./assets/digibank/xbody/'+entry.id+'.jpg';
const warX=records.find(d=>d.isXBody&&/WarGrowlmon/i.test(d.name));if(!warX)throw Error('Missing WarGrowlmon X');warX.image='./assets/digibank/xbody/wargrowlmon-user.png';
for(const entry of records){
 entry.evolutionCategory||='standard';entry.requiresSpecialEvolution=false;
 const special=specialEvolution[entry.id];
 if(special){entry.progressionStage=entry.stage;entry.stage='special';entry.evolutionCategory=special.category;entry.requiresSpecialEvolution=true;entry.evolutionRequirement=special.reason;entry.evolutionComponents=(evolutionComponents[entry.id]||[]).map(([digimonId,name])=>({digimonId,name}));}
}
for(const id of Object.keys(specialEvolution))if(!records.some(r=>r.id===id))throw Error('Unknown special '+id);
for(const entry of records)for(const component of entry.evolutionComponents||[])if(!records.some(r=>r.id===component.digimonId))throw Error('Missing evolution component '+component.digimonId);
for(const [id,[element,reason]] of elementReview){if(!records.some(r=>r.id===id))throw Error('Unknown reviewed species '+id);if(!reason||!['Fogo','Madeira','Água','Gelo','Elétrico','Vento','Terra','Luz','Escuridão','Metal','Neutro'].includes(element))throw Error('Invalid element review '+id);}
await mkdir('site/data',{recursive:true});
await writeFile('site/data/digimon-data.js','// Bonds migration snapshot and official species facts. Elements await Bonds approval.\nexport default '+JSON.stringify({version:7,collectedAt:'2026-10-06',entries:records},null,2)+';\n');
await mkdir('docs',{recursive:true});
const stageNames={baby:'Bebê',rookie:'Novato',champion:'Campeão',ultimate:'Perfeito',mega:'Mega',special:'Especial',xbody:'X-Body'};
const counts=Object.fromEntries(Object.keys(stageNames).map(stage=>[stage,records.filter(r=>r.stage===stage).length]));
await writeFile('docs/digibank-review.md','# Digibank — revisão local\n\n'+records.length+' registros: '+Object.entries(counts).map(([stage,count])=>count+' '+stageNames[stage]).join('; ')+'. Inclui 75 Novatos migrados, 32 Hybrid adaptados, 72 Novatos complementares, Hyemon, Black Strabimon e 121 variantes X em categoria própria. Sem publicação. Classificação é traduzida para português; official.type conserva o Type original e official.level preserva Hybrid. Elementos são adaptações do Bonds, pendentes de aprovação. Neutro permanece permitido fora dos ciclos.\n\nO Creator continua usando seu catálogo atual até validação. Imagens são referências externas, com alternativa visual caso falhem. O fórum descreve Labramon como um leão negro; sua descrição local evita perpetuar essa provável troca.\n\n| Digimon | Categoria Bonds | Elemento | Fundamentação | Fonte |\n|---|---|---|---|---|\n'+records.filter(r=>r.provenance==='official').map(r=>`| ${r.name} | ${stageNames[r.stage]} | ${r.element} | ${r.elementReason} | [Oficial](${r.sourceUrl}) |`).join('\n')+'\n\n## Condições especiais\n\n'+records.filter(r=>r.evolutionRequirement).map(r=>`- **${r.name}**: ${r.evolutionComponents?.map(c=>c.name).join(' + ')||''}. ${r.evolutionRequirement}`).join('\n')+'\n\n## Registros retirados\n\nVariantes de Anticorpo X ficam exclusivamente na aba X-Body. Família Aegiomon/Aegiochusmon, variantes de anime, modos, acessórios e formas Enhancement continuam excluídos das categorias comuns. Espécies-base naturalmente portadoras de Anticorpo X permanecem; formas Dex continuam retiradas. Fusões selecionadas ficam em Especiais, sem serem apagadas.\n\n'+exclusions.map(r=>`- [${r.name}](${r.sourceUrl}): ${r.reason}.`).join('\n')+'\n');
console.log('Database assembled:',records.length,JSON.stringify(counts),'Excluded:',exclusions.length);
