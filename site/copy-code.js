// Run the selection fallback synchronously inside the original click, including
// cross-origin forum iframes that do not delegate the Clipboard API permission.
export async function copyGeneratedText(source,{doc=globalThis.document,clipboard=globalThis.navigator?.clipboard}={}){
 const text=source?.value;
 if(typeof text!=='string'||!text.trim())return 'empty';
 const select=()=>{source.focus({preventScroll:true});source.select();source.setSelectionRange(0,text.length);};
 select();
 try{if(doc?.execCommand?.('copy'))return 'copied';}catch{}
 try{if(clipboard?.writeText){await clipboard.writeText(text);return 'copied';}}catch{}
 select();return 'selected';
}
