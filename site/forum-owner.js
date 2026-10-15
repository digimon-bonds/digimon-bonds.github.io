export const FORUM_ORIGIN='https://digimonbonds.forumeiros.com';
export function forumUserId(value){const text=String(value??'');return /^[1-9]\d{0,9}$/.test(text)?text:null;}
export function forumProfileId(value){try{const url=new URL(value,FORUM_ORIGIN);return url.origin===FORUM_ORIGIN?forumUserId(url.pathname.match(/^\/u([1-9]\d*)(?:[-/]|$)/)?.[1]):null;}catch{return null;}}
export function normalizeForumUser(value){const id=forumUserId(value?.forumUserId),name=typeof value?.forumUsername==='string'?value.forumUsername.trim().slice(0,80):'';return id&&name?{forumUserId:id,forumUsername:name}:null;}
export const isOmegamon=user=>forumUserId(user?.forumUserId)==='1';
export function sheetURL(value){try{const url=new URL(value,FORUM_ORIGIN);return url.origin===FORUM_ORIGIN&&/^\/t[1-9]\d*-[\w-]+$/.test(url.pathname)?url.origin+url.pathname:null;}catch{return null;}}
export function ownerFields(value){return {ownerForumUserId:forumUserId(value?.ownerForumUserId),ownerForumUsername:typeof value?.ownerForumUsername==='string'?value.ownerForumUsername.trim().slice(0,80):''};}
export function canControlForumParticipant(participant,user){return !!participant&&!!user&&(isOmegamon(user)||!!forumUserId(participant.ownerForumUserId)&&forumUserId(participant.ownerForumUserId)===forumUserId(user.forumUserId));}
// Authoritative profile URLs only. Never infer the owner from the character's player/name fields.
export function extractSheetOwner(doc,postBody=null){
 const post=postBody?.closest('.post')||doc.querySelector('.post'),profile=post?.querySelector('.postprofile');
 for(const link of profile?.querySelectorAll('dt a[href],.bos-author-card a[href]')||[]){const id=forumProfileId(link.getAttribute('href'));if(id&&link.textContent.trim())return {ownerForumUserId:id,ownerForumUsername:link.textContent.trim().slice(0,80)};}
 const first=doc.querySelector('.postbody');
 // Public guest pages omit profile links, but expose the topic author as JSON-LD.
 if(postBody&&first!==postBody)return ownerFields(null);
 const objects=[];
 function visit(value){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object'){objects.push(value);if(value['@graph'])visit(value['@graph']);}}
 for(const script of doc.querySelectorAll('script[type="application/ld+json"]'))try{visit(JSON.parse(script.textContent));}catch{}
 for(const item of objects){if(item['@type']!=='DiscussionForumPosting')continue;const author=Array.isArray(item.author)?item.author[0]:item.author,id=forumProfileId(author?.url||author?.['@id']);if(id&&typeof author?.name==='string'&&author.name.trim())return {ownerForumUserId:id,ownerForumUsername:author.name.trim().slice(0,80)};}
 return ownerFields(null);
}
export function hydrateParticipantOwners(state,owners=new Map()){
 for(const participant of state.actors){const source=participant.source||{},cached=owners.get(sheetURL(source.url)),existing=ownerFields(participant),owner=cached||ownerFields(source);if(!existing.ownerForumUserId&&owner.ownerForumUserId){Object.assign(participant,owner);for(const human of state.humans.filter(h=>h.pairId===participant.pairId))Object.assign(human,owner);}}
 return state;
}
