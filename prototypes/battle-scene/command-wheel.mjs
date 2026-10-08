// Original SVG pictograms: crisp at every size, without font/emoji dependencies.
const paths={
 digivice:'<path d="M21 7h22l10 13v24L43 57H21L11 44V20Z"/><rect x="21" y="20" width="22" height="19" rx="3"/><path d="M27 13h10M27 47h10M16 27v7M48 27v7"/>',
 sword:'<path d="m37 8 15-2-2 15-23 23-7-7Z" fill="currentColor" stroke="none"/><path d="m18 34 13 13M24 41 12 53M9 50l6 6"/>',
 signature:'<path d="m37 8 15-2-2 15-23 23-7-7Z" fill="currentColor" stroke="none"/><path d="m18 34 13 13M24 41 12 53M9 50l6 6M12 9v12M6 15h12M47 41v12M41 47h12"/>',
 shield:'<path d="M32 6 52 14v16c0 13-12 23-20 28C24 53 12 43 12 30V14Z" fill="currentColor" fill-opacity=".16"/><path d="m23 30 7 7 13-14"/>',
 eye:'<path d="M5 32S15 16 32 16s27 16 27 16-10 16-27 16S5 32 5 32Z"/><circle cx="32" cy="32" r="9" fill="currentColor"/><circle cx="35" cy="29" r="2" stroke="none" fill="#091a24"/>',
 dna:'<path d="M18 6c0 22 28 30 28 52M46 6c0 22-28 30-28 52M20 12h24M25 22h14M25 42h14M20 52h24"/>',
 hand:'<path d="M20 32V15a4 4 0 0 1 8 0v14-19a4 4 0 0 1 8 0v19-14a4 4 0 0 1 8 0v17-9a4 4 0 0 1 8 0v16c0 12-8 19-18 19-8 0-12-5-17-11L8 35a4 4 0 0 1 6-5l6 5"/>',
 help:'<path d="M6 40h13l8-8h13a4 4 0 0 1 0 8H29m-10 0 11 11 21-14a5 5 0 0 1 7 7L34 59 18 49H6M32 21C13 11 26 1 32 11 38 1 51 11 32 21Z"/>',
 coordinates:'<path d="M6 23V6h17M41 6h17v17M58 41v17H41M23 58H6V41M20 32h24M32 20v24"/><circle cx="32" cy="32" r="8"/>'
};
export const commandIcon=name=>`<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.help}</svg>`;
export function initCommandWheel(){
 document.querySelectorAll('[data-command-icon]').forEach(node=>node.innerHTML=commandIcon(node.dataset.commandIcon));
 const title=document.querySelector('#commandFocus'),description=document.querySelector('#commandDescription');
 const reset=()=>{title.textContent='ESCOLHA SUA AÇÃO';description.textContent=document.querySelector('.human-panel').hidden?'Selecione uma ação deste Digimon.':'Digimon acima. Humano abaixo. Cada um tem sua própria ação.';};
 document.querySelectorAll('.command-wheel button').forEach(button=>{
  button.setAttribute('aria-description',button.dataset.hint);
  const show=()=>{title.textContent=button.querySelector('b')?.textContent||'AÇÃO';description.textContent=button.id==='humanObserve'?document.querySelector('#observeHelp').textContent:button.dataset.hint;};
  button.addEventListener('mouseenter',show);button.addEventListener('focus',show);
  button.addEventListener('mouseleave',reset);button.addEventListener('blur',reset);
 });
}
