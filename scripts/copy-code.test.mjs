import test from 'node:test';
import assert from 'node:assert/strict';
import {copyGeneratedText} from '../site/copy-code.js';
const code='<iframe title="Ficha — Coração" data-bonds-project="'+('ABC123+/='.repeat(20000))+'"></iframe>\n';
function field(value=code){return {value,selected:0,focus(){},select(){this.selected++;},setSelectionRange(start,end){assert.equal(start,0);assert.equal(end,value.length);}};}
test('iframe-compatible copy runs in the click before awaiting the restricted Clipboard API and preserves the complete code',async()=>{
 const source=field();let sync=false,api=false;
 const result=copyGeneratedText(source,{doc:{execCommand(command){assert.equal(command,'copy');assert.equal(source.value,code);sync=true;return true;}},clipboard:{async writeText(){api=true;throw Error('iframe permission denied');}}});
 assert.equal(sync,true);assert.equal(await result,'copied');assert.equal(api,false);
});
test('modern clipboard copies the exact full Unicode payload when selection copying is unavailable',async()=>{
 let copied;assert.equal(await copyGeneratedText(field(),{doc:{execCommand(){throw Error('unsupported');}},clipboard:{async writeText(value){copied=value;}}}),'copied');assert.equal(copied,code);
});
test('both denied clipboard paths leave all code selected without reporting a successful copy',async()=>{
 const source=field();assert.equal(await copyGeneratedText(source,{doc:{execCommand:()=>false},clipboard:{async writeText(){throw Error('NotAllowedError');}}}),'selected');assert.equal(source.selected,2);assert.equal(source.value,code);
});
test('copying before generation never invokes clipboard or copies empty content',async()=>{
 let invoked=false;assert.equal(await copyGeneratedText(field(''),{doc:{execCommand(){invoked=true;}},clipboard:{async writeText(){invoked=true;}}}),'empty');assert.equal(invoked,false);
});
