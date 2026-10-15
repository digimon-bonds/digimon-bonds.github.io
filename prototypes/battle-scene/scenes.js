import {initForumIdentity,getForumUser,subscribeForumIdentity} from '/creator/forum-identity.js';
import {canManageScenes,deleteSceneCard} from './scene-management.mjs';
initForumIdentity();
import {apiFetch} from './api-client.mjs';
const $=id=>document.getElementById(id);
let creating=false,authorized=false,deletionSupported=false,selectedDeletion=null;
function syncManagement(){const manage=canManageScenes(getForumUser(),authorized);$('createScene').hidden=getForumUser()?.forumUserId!=='1';document.querySelectorAll('[data-delete-scene]').forEach(button=>{button.hidden=!manage;button.disabled=!deletionSupported;});}
const environments={grid:'linear-gradient(150deg,#173a4c,#0b1b27)',ice:'linear-gradient(140deg,#8bb8c9,#1c3a50)',sunset:'linear-gradient(140deg,#b87652,#252742)',forest:'linear-gradient(140deg,#357c68,#0b252c)',metro:'linear-gradient(140deg,#567785,#162735)',city:'linear-gradient(140deg,#555186,#11232f)'};
async function loadScenes(){
 const response=await apiFetch('/api/scenes');const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível carregar as cenas.');
 $('scenes').replaceChildren();$('status').textContent=data.scenes.length+' cena(s) aberta(s)';$('createScene').disabled=false;deletionSupported=data.capabilities?.sceneDeletion===true;
 if(!data.scenes.length){const p=document.createElement('p');p.className='empty';p.textContent='Nenhuma cena aberta. Clique em Criar cena para preparar a primeira batalha.';$('scenes').append(p);}
 for(const scene of data.scenes){
  const card=document.createElement('article');card.className='scene-card';const link=document.createElement('a');link.className='scene-link';link.href='index.html?scene='+encodeURIComponent(scene.id);
  const art=document.createElement('div');art.className='scene-art';art.style.backgroundImage=environments[scene.environment]||environments.grid;
  if(scene.background&&/^(data:image\/(png|jpeg|webp);base64,|https?:\/\/)/i.test(scene.background))art.style.backgroundImage='url('+JSON.stringify(scene.background)+')';
  const meta=document.createElement('div');meta.className='scene-meta';meta.textContent='CENA ABERTA';const round=document.createElement('span');round.textContent='ROUND '+String(scene.round).padStart(2,'0');meta.append(round);art.append(meta);
  const content=document.createElement('div');content.className='scene-content';const title=document.createElement('h2');title.textContent=scene.name;content.append(title);
  for(const enemy of scene.enemies){const tag=document.createElement('span');tag.className='enemy-tag';tag.textContent='Inimigo · '+enemy;content.append(tag);}
  const enter=document.createElement('span');enter.className='enter';enter.textContent='CONTINUAR CENA ↗';content.append(enter);link.append(art,content);card.append(link);const remove=document.createElement('button');remove.type='button';remove.className='delete-scene';remove.dataset.deleteScene=scene.id;remove.textContent='EXCLUIR CENA';remove.hidden=true;remove.addEventListener('click',()=>{if(!canManageScenes(getForumUser(),authorized)||!deletionSupported)return;selectedDeletion={scene,card};$('deleteDescription').textContent='Excluir definitivamente a cena ‘'+scene.name+'’?';$('deleteError').textContent='';$('deleteConfirmation').showModal();});card.append(remove);$('scenes').append(card);
 }
 syncManagement();
}
function openAccess(create=false){creating=create;$('accessTitle').textContent=create?'Criar cena de batalha':'Acesso do narrador';$('nameField').hidden=!create;$('password').value='';$('accessError').textContent='';$('unlock').textContent=create?'Criar cena':'Entrar';$('access').showModal();}
$('createScene').onclick=()=>openAccess(true);
$('access').addEventListener('cancel',e=>{if(!creating)e.preventDefault();});
$('accessForm').onsubmit=async e=>{e.preventDefault();$('unlock').disabled=true;try{
 const response=await apiFetch('/api/narrator',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('password').value})});const result=await response.json();if(!response.ok||!result.authorized)throw Error(result.error||'Acesso indisponível.');$('password').value='';authorized=true;
 if(creating){const created=await apiFetch('/api/scenes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('sceneName').value})});const scene=await created.json();if(!created.ok)throw Error(scene.error||'Não foi possível criar a cena.');location.href='index.html?scene='+encodeURIComponent(scene.id)+'&narrator=1';return;}
 $('access').close();await loadScenes();
 }catch(error){$('accessError').textContent=error.message;}finally{$('unlock').disabled=false;}};
$('cancelDelete').onclick=()=>$('deleteConfirmation').close();
$('confirmDelete').onclick=async()=>{
 if(!selectedDeletion||!canManageScenes(getForumUser(),authorized))return;
 $('confirmDelete').disabled=true;const target=selectedDeletion;
 try{await deleteSceneCard(target.scene,target.card,apiFetch);$('deleteConfirmation').close();selectedDeletion=null;const count=$('scenes').querySelectorAll('.scene-card').length;$('status').textContent=count+' cena(s) aberta(s)';if(!count){const empty=document.createElement('p');empty.className='empty';empty.textContent='Nenhuma cena aberta.';$('scenes').append(empty);}}
 catch(error){$('deleteError').textContent=error.message;}finally{$('confirmDelete').disabled=false;}
};
subscribeForumIdentity(()=>{if(!canManageScenes(getForumUser(),authorized))$('deleteConfirmation').close();syncManagement();});
try{const access=await (await apiFetch('/api/narrator')).json();authorized=access.authorized===true;await loadScenes();}catch(error){$('status').textContent=error.message;}
