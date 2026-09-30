import {archetypes,derivedStats,validURL} from './rules.js';
import {initializeForms,stageOrder,stageNames,activeForm,formMetrics,availableAttacks} from './forms.js';
import {progress} from './progression.js';
const safe=v=>String(v??'').replaceAll('[','［').replaceAll(']','］').replaceAll('<','＜').replaceAll('>','＞');
const cell='font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#E5EDF0;vertical-align:top;';
const table=content=>'[table style="width:100%;border-collapse:separate;border-spacing:6px;table-layout:fixed;"]'+content+'[/table]';
const box=content=>table('[tr][td style="'+cell+'padding:16px;background:#101B23;border:1px solid #38505C;border-radius:12px;"]'+content+'[/td][/tr]');
const heading=t=>'[table style="width:100%;margin:20px 0 10px;background:#101B23;border-left:4px solid #F6AD52;border-radius:8px;"][tr][td style="'+cell+'padding:12px;"][size=16][b][color=#F6AD52]'+safe(t)+'[/color][/b][/size][/td][/tr][/table]';
const line=(k,v)=>'[size=14][color=#82CFDC]'+safe(k)+'[/color][/size]\n[size=15][color=#E5EDF0]'+safe(v||'—')+'[/color][/size]';
const image=(url,width)=>validURL(url)?'[center][img('+width+'px,auto)]'+url.replaceAll('[','%5B').replaceAll(']','%5D')+'[/img][/center]':'';
const grid=rows=>table('[tr]'+rows.map(([k,v])=>'[td style="'+cell+'padding:12px 4px;text-align:center;background:#101B23;border:1px solid #38505C;border-radius:9px;"][size=12][color=#E5EDF0]'+safe(k)+'[/color][/size]\n[size=22][b][color=#70D3E0]'+safe(v)+'[/color][/b][/size][/td]').join('')+'[/tr]');
export function generateForumPost(input,images){
 const s=initializeForms(structuredClone(input)),p=progress(s),a=archetypes.find(x=>x.id===s.archetype);
 let out=heading('FICHA DE PERSONAGEM')+box(line('JOGADOR',s.player))+'\n'+heading('HUMANO');
 out+=table('[tr][td style="'+cell+'width:34%;padding:8px;background:#101B23;border-radius:12px;"]'+line('REGISTRO VISUAL','')+image(s.humanImage,140)+'[/td][td style="'+cell+'padding:12px;"]'+[line('NOME',s.name),line('IDADE',s.age),line('PERSONALIDADE',s.personality),line('ARQUÉTIPO',a?.name),line('HABILIDADE DE ARQUÉTIPO',a?.abilityName),safe(a?.abilityDescription||'')].join('\n\n')+'[/td][/tr]');
 out+=heading('CARACTERÍSTICAS')+grid([['MENTE',s.human.mente],['CORPO',s.human.corpo],['PRESENÇA',s.human.presenca]]);
 out+=heading('TALENTOS')+box(p.talents.map(t=>line('RANK '+t.rank,t.name)).join('\n\n'));
 out+=heading('TRAÇOS DO PERSONAGEM')+box([line('FALHA',s.flaw),line('DESEJO',s.wish),line('ITEM ESPECIAL',s.item),line('COISAS',s.things)].join('\n\n'));
 out+=heading('ENERGIA')+grid([['ATUAL / MÁXIMA',p.energy+' / '+(9+p.level)]]);
 for(const stage of stageOrder){const f=activeForm({...s,activeDigimonStage:stage});if(!f.unlocked)continue;
  if(!validURL(images[stage]))throw Error('Prepare a imagem pública do Digivice antes de copiar.');
  const d=formMetrics(s,stage);out+=heading('DIGIMON // '+stageNames[stage])+image(images[stage],320);
  out+=box([line('NOME',f.name),line('ESTÁGIO',stageNames[stage]),line('ATRIBUTO DIGITAL',f.digital),line('ELEMENTO',f.element),line('CLASSIFICAÇÃO',f.classification),line('PERSONALIDADE',f.personality)].join('\n\n'));
  out+=heading('ATRIBUTOS')+grid([['PODER',f.attributes.poder],['CORAÇÃO',f.attributes.coracao]])+grid([['INTELIGÊNCIA',f.attributes.inteligencia],['AGILIDADE',f.attributes.agilidade]]);
  out+=heading('RECURSOS DE COMBATE')+grid([['PV',stage==='rookie'?p.pv+' / '+derivedStats(s).pv:d.pv],['DANO BASE',d.damage],['ESQUIVA',d.dodge]]);
  out+=heading('QUALIDADES')+box(f.qualities.length?f.qualities.map(q=>line('RANK '+q.rank,q.name)).join('\n\n'):'—');
  const attacks=availableAttacks(s,stage);if(attacks.length)out+=heading('ATAQUES DE ASSINATURA')+attacks.map(at=>box([line('NOME',at.name),line('RANK',at.rank),line('ELEMENTO',at.element),line('EFEITOS',at.effects.map(e=>e.name+(e.element?' ('+e.element+')':'')).join('; '))].join('\n\n'))).join('')+box(line('USOS POR COMBATE',d.uses));
 }
 out+=heading('Digivice (Registro e Melhorias)')+box(Array.from({length:9},(_,i)=>{const v=p.devices[i];return safe(String(i+1).padStart(2,'0')+'. '+(v?v.name+' | Nível '+v.rank+(v.protocol?' | '+v.protocol+' — '+v.detail:''):'—'));}).join('\n'));
 out+=heading('LAÇO E PROGRESSÃO')+grid([['NÍVEL',p.level],['LAÇO',p.bond+' / '+(5+p.level)],['EXP',p.exp+' / 10']])+heading('HISTÓRIA')+box('[justify]'+safe(s.history)+'[/justify]');
 return '[table style="width:100%;max-width:860px;margin:16px auto;background:#18262E;border:1px solid #38505C;border-radius:16px;"][tr][td style="'+cell+'padding:16px;"]'+out+'[/td][/tr][/table]';
}
