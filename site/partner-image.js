// Bundled images need a public, portable URL in saved sheets and forum exports.
const publicRoot='https://digimon-bonds.github.io/';
export function resolvePartnerImage(value){
 const image=String(value??'').trim();
 return /^(?:\.\/|\/)?assets\//.test(image)?new URL(image,publicRoot).href:image;
}

export async function loadPartnerImage(img,value,proxyURL){
 const source=resolvePartnerImage(value);
 img.crossOrigin='anonymous';
 // Our own bundled PNGs already support CORS, and need no third-party proxy.
 const bundled=new URL(source).origin===new URL(publicRoot).origin||new URL(source).origin===new URL(import.meta.url).origin;
 const candidates=bundled?[source,proxyURL(source)]:[proxyURL(source),source];
 for(const url of [...new Set(candidates)]){
  img.src=url;
  try{await img.decode();return;}catch{}
 }
 throw Error('Não foi possível carregar a imagem do Digimon. Confira a URL.');
}
