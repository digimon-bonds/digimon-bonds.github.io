import {isOmegamon} from '../../site/forum-owner.js';
export const canManageScenes=(user,authorized)=>isOmegamon(user)&&authorized===true;
export async function deletePersistentScene(id,fetchAPI){
 const response=await fetchAPI('/api/scenes?id='+encodeURIComponent(id),{method:'DELETE'});
 if(!response.ok){const result=await response.json().catch(()=>({}));throw Error(result.error||'Não foi possível excluir a cena.');}
}
export const canDeleteScene=(user,authorized,mode)=>mode==='narrator'&&canManageScenes(user,authorized);
export async function deleteSceneCard(scene,card,fetchAPI){await deletePersistentScene(scene.id,fetchAPI);card.remove();}
