// Let the outer Bonds page scroll naturally with the editor's content.
if(window.parent!==window){
 let previousHeight=0;
 const reportHeight=()=>{const height=Math.ceil(document.body.getBoundingClientRect().height);if(height!==previousHeight){previousHeight=height;window.parent.postMessage({type:'bonds-studio-height',height},location.origin);}};
 new ResizeObserver(reportHeight).observe(document.body);
 window.addEventListener('load',reportHeight);
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='bonds-studio-viewport')return;
  const {offset,height}=event.data;
  if(!Number.isFinite(offset)||!Number.isFinite(height)||offset<0||height<1)return;
  document.documentElement.style.setProperty('--studio-sticky-top',`${offset}px`);
  document.documentElement.style.setProperty('--studio-viewport-height',`${height}px`);
 });
}
