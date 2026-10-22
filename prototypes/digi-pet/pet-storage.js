/* Prototype-only persistence port. This adapter has NO authority to grant RPG
 * rewards. Replace read/write AND domain transactions with a secure backend
 * before trusting XP, credits, cards, items, cycles, Prepared or D100 results. */
globalThis.DigiPetPersistence={
 read(key){return localStorage.getItem(key);},
 write(key,value){localStorage.setItem(key,value);},
 backup(key,value){localStorage.setItem(`${key}:backup:${Date.now()}`,value);}
};
