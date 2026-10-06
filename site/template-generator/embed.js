// Let the outer Bonds page scroll naturally with the editor's content.
if(window.parent!==window){
 let previousHeight=0;
 const reportHeight=()=>{const height=Math.ceil(document.body.getBoundingClientRect().height);if(height!==previousHeight){previousHeight=height;window.parent.postMessage({type:'bonds-studio-height',height},location.origin);}};
 new ResizeObserver(reportHeight).observe(document.body);
 window.addEventListener('load',reportHeight);
}
