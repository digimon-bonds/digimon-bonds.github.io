// Presentation only: move existing controls into panels without recreating fields.
export function organizeEditor(root,step){
 if(!root||root.querySelector('.editor-card'))return;
 let index=0;
 const direct=el=>el?.closest('.field')||el;
 function card(start,end,title,description=''){
  if(!start||start===end)return;const parent=start.parentNode;if(end&&end.parentNode!==parent)return;
  const section=document.createElement('section');section.className='editor-card';
  const head=document.createElement('div');head.className='editor-card-head';
  const number=document.createElement('span');number.className='editor-card-number';number.textContent=String(++index).padStart(2,'0');
  const heading=document.createElement('h3');heading.textContent=title;head.append(number,heading);
  const body=document.createElement('div');body.className='editor-card-body';
  start.before(section);section.append(head);if(description){const p=document.createElement('p');p.className='editor-card-description';p.textContent=description;section.append(p);}section.append(body);
  let node=start;while(node&&node!==end){const next=node.nextSibling;body.append(node);node=next;}
 }
 const field=id=>direct(root.querySelector('#'+id));
 const reset=root.querySelector('[data-action="reset"]');
 if(step===1){const matrix=root.querySelector('#human-matrix');card(field('player'),matrix,'Identificação','Quem é você e quem está do outro lado da tela?');card(matrix,reset,'Características','Distribua os valores do seu personagem.');}
 if(step===2){const choices=root.querySelector('.archetypes'),ability=root.querySelector('.ability');card(choices,ability||reset,'Arquétipo','Selecione o perfil que combina com seu personagem.');if(ability)card(ability,reset,'Habilidade de Arquétipo');}
 if(step===3){const keys=['talent','flaw','wish','item','things'],titles=['Talento','Falha','Desejo','Item especial','Coisas'];const starts=keys.map(field);starts.forEach((start,i)=>card(start,starts[i+1]||reset,titles[i]));}
 if(step===5){
  const device=root.querySelector('#device-editor'),customizer=root.querySelector('#device-customizer');if(device)card(device,customizer?.nextSibling||device.nextSibling,'Digivice','Modelo, cores e acabamento do seu terminal.');
  const panel=root.querySelector('#editor-form-panel');
  if(field('digiName')){const matrix=root.querySelector('#digi-matrix'),quality=field('quality'),attackHeading=[...panel.children].find(el=>el.tagName==='H3'&&el.textContent.includes('ATAQUE'));card(field('digiName'),matrix,'Parceiro','Identidade, imagem e personalidade do seu Digimon.');card(matrix,quality,'Atributos','Distribuição de pontos e recursos de combate.');card(quality,attackHeading,'Qualidade','A capacidade que torna seu parceiro único.');card(attackHeading,reset,'Ataques de assinatura','Configure o ataque inicial e os ataques adicionais.');}
  else if(panel&&!panel.querySelector('.evolution-locked')){const start=panel.querySelector('.field'),headings=[...panel.children].filter(el=>el.tagName==='H3');card(start,headings[0],'Parceiro','Dados próprios da forma selecionada.');headings.forEach((h,i)=>card(h,headings[i+1]||panel.querySelector('[data-form-issues]'),h.textContent.split(' // ')[0]));}
 }
 if(step===6)card(field('history'),reset,'História','Escreva o caminho que trouxe seu personagem até aqui.');
 if(step===8){const action=root.querySelector('[data-action="prepare-post"]');if(action)card(action,null,'Publicar ficha','Gere e copie o código para o tópico do fórum.');}
}
