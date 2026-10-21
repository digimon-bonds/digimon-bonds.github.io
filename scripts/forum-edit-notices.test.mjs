import test from 'node:test';
import assert from 'node:assert/strict';
import {isOmegamonEditNotice,hideOmegamonEditNotices} from '../site/forum-edit-notices.js';
const notice=name=>'Última edição por '+name+' em Sex 25 Set 2026 - 18:32, editado 10 vez(es)';
test('only Omegamon edit metadata matches, with native account ID taking precedence when present',()=>{
 assert.equal(isOmegamonEditNotice(notice('Omegamon')),true);
 assert.equal(isOmegamonEditNotice('\n\n'+notice('OMEGAMON')+'\n'),true);
 for(const name of ['your_lily','BisKath','Omegamon2','Omegamon em treino'])assert.equal(isOmegamonEditNotice(notice(name)),false);
 assert.equal(isOmegamonEditNotice(notice('Omegamon'),'/u40'),false);
 assert.equal(isOmegamonEditNotice(notice('Nome atualizado'),'/u1'),true);
 assert.equal(isOmegamonEditNotice('Texto de mensagem sobre Omegamon'),false);
});
test('hide only the native Omegamon notice, retaining other notices and the stored metadata',()=>{
 function node(name){return {textContent:notice(name),hidden:false,style:{setProperty(...args){this.display=args;}},querySelector(){return null;}};}
 const admin=node('Omegamon'),player=node('your_lily');
 const doc={querySelectorAll(selector){assert.equal(selector,'.post .postbody > .edicao');return [admin,player];}};
 hideOmegamonEditNotices(doc);hideOmegamonEditNotices(doc);
 assert.equal(admin.hidden,true);assert.deepEqual(admin.style.display,['display','none','important']);assert.equal(admin.textContent,notice('Omegamon'));assert.equal(player.hidden,false);assert.equal(player.style.display,undefined);
});
