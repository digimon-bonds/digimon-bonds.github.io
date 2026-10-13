import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=await readFile(new URL('../site/forum-skin/bonds-os.js',import.meta.url),'utf8');
const context={Set,api:{}};
runInNewContext(source.slice(source.indexOf('  function repairPostShell('),source.indexOf('  function enhanceInteriors('))+'api.repair=repairPostShell;',context);
class Node {
 constructor(tagName,children=[]){this.tagName=tagName;this.childNodes=[];this.dataset={};children.forEach(child=>this.append(child));}
 append(child){child.parentNode?.detach(child);this.childNodes.push(child);child.parentNode=this;child.parentElement=this;}
 detach(child){this.childNodes.splice(this.childNodes.indexOf(child),1);}
 get firstChild(){return this.childNodes[0];}
 insertBefore(child,ref){child.parentNode.detach(child);this.childNodes.splice(this.childNodes.indexOf(ref),0,child);child.parentNode=this;child.parentElement=this;}
 remove(){this.parentNode.detach(this);this.parentNode=this.parentElement=null;}
}
function fixture(depth=2){
 const content=new Node('DIV',[new Node('B')]),profile=new Node('DIV'),body=new Node('DIV',[content]);
 let children=[profile,body];for(let i=0;i<depth;i++)children=[new Node('B',children)];
 const inner=new Node('DIV',children),post=new Node('DIV',[inner]);post.id='p377';
 post.querySelector=()=>inner;inner.querySelector=selector=>selector==='.postprofile'?profile:body;
 return {post,inner,profile,body,content};
}
test('unclosed template formatting cannot trap later post bodies in the avatar column',()=>{
 const {post,inner,profile,body,content}=fixture(3),authoredBold=content.firstChild;
 context.api.repair(post);
 assert.deepEqual(inner.childNodes,[profile,body]);assert.equal(body.firstChild,content);assert.equal(content.firstChild,authoredBold);
 assert.equal(post.dataset.bosShellRepaired,'');
 context.api.repair(post);assert.deepEqual(inner.childNodes,[profile,body]);
});
test('valid shells and non-native posts are unchanged',()=>{
 const valid=fixture(0);context.api.repair(valid.post);assert(!('bosShellRepaired' in valid.post.dataset));
 const ad=fixture();ad.post.id='p_ad';const before=ad.inner.firstChild;context.api.repair(ad.post);assert.equal(ad.inner.firstChild,before);
});
test('arbitrary structural containers are not unwrapped as formatting leaks',()=>{
 const f=fixture(1);f.inner.firstChild.tagName='SECTION';context.api.repair(f.post);
 assert.equal(f.inner.firstChild.tagName,'SECTION');assert(!('bosShellRepaired' in f.post.dataset));
});
