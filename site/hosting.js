// GitHub Pages serves the UI; persistent forum exports remain on the existing service.
export const apiOrigin=location.hostname==='digimon-bonds.github.io'
 ? 'https://bonds-character-app.mateuzim-alves.chatgpt.site' : location.origin;
export const apiURL=path=>new URL(path,apiOrigin).href;
