import {roundStatus,closeRound,nextRound} from './scene-engine.mjs';

// Run only after a successful action, never during rendering or a dice preview.
export function advanceCompletedRound(state,maintenance={}){
 if(!roundStatus(state).ready)return state;
 const next=nextRound(closeRound(state,maintenance));
 // Keep the final applied result visible while the next round is available.
 next.result=structuredClone(state.result);
 return next;
}
