/* Replace this adapter with an authenticated server result before official use.
 * Rejection sampling avoids modulo bias. Presentation never rolls rewards. */
(() => {
 function integer(min,max){
  if(!Number.isInteger(min)||!Number.isInteger(max)||max<min)throw new Error('Invalid roll range');
  const size=max-min+1,limit=Math.floor(4294967296/size)*size,buffer=new Uint32Array(1);
  if(!globalThis.crypto?.getRandomValues)throw new Error('RNG seguro indisponível neste navegador.');
  do{globalThis.crypto.getRandomValues(buffer);}while(buffer[0]>=limit);
  return min+buffer[0]%size;
 }
 globalThis.ExplorationRNG={integer,d100:()=>integer(1,100)};
})();
