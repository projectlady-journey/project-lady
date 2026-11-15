/*
 * Project Lady / Journey Registry v0.5.10.4
 * Multiple journeys: one active journey, saved journeys, and a future completed archive.
 * v0.5.8: add stable first-saved timestamps, sorted saved journeys, and editable trip identity.
 * v0.4.x single-journey data is migrated without destroying the Osaka/Kinan working trip.
 */
const JOURNEY_BOX_KEY = "projectLadyJourneyBox_v01"; // legacy single-journey key
const JOURNEY_REGISTRY_KEY = "projectLadyJourneyRegistry_v01";

/* v0.5.10.1+ safety fix: no personal trip data or outdated bookings in public source.
   Current journeys remain in the browser's localStorage, never in this script. */

function deepClone(v){return JSON.parse(JSON.stringify(v));}
function makeJourneyId(){return `journey-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
function createBlankJourney(){
  const now=new Date().toISOString();
  return {schemaVersion:"0.5.8",trip:{id:makeJourneyId(),title:"今回の旅",startDate:"",endDate:"",origin:"",destination:"",partyMode:null,mood:null,readiness:null,entryRoute:null,knownCategories:[],knownNote:"",mainPhoto:null,lifecycle:"active"},welcome:null,transport:[],stays:[],itinerary:[],memos:[],packing:[],logs:[],meta:{source:"new journey",createdAt:now,updatedAt:now}};
}
function relabelStays(items){return (items||[]).map((item,i)=>({...item,label:String(i+1).padStart(2,"0")}));}

function migrateLegacyJourney(saved){
  if(!saved || !saved.trip) return saved;
  // Conservative migration: never replace existing private data with a stale
  // hard-coded sample route or booking. Preserve legacy fields as supplied.
  const next=deepClone(saved);
  for(const key of ["transport","stays","itinerary","memos","packing","logs"]){
    if(!Array.isArray(next[key])) next[key]=[];
  }
  next.stays=relabelStays(next.stays);
  next.trip={...next.trip,lifecycle:"active"};
  next.schemaVersion="0.5.8";
  next.meta={...(next.meta||{}),migratedToRegistryV050:true};
  return next;
}

function journeyHasRealCollections(j){
  return !!((j?.transport||[]).length||(j?.stays||[]).length||(j?.itinerary||[]).length||(j?.memos||[]).length||(j?.packing||[]).length||(j?.logs||[]).length);
}
function journeyHasIdentity(j){
  const t=j?.trip||{};
  return !!((t.title&&t.title!=="今回の旅")||String(t.destination||"").trim()||String(t.startDate||"").trim()||String(t.endDate||"").trim()||String(t.origin||"").trim()||String(t.knownNote||"").trim());
}
function hasDefaultJourneyIdentity(j){
  const t=j?.trip||{};
  return (!t.title||t.title==="今回の旅")&&!String(t.destination||"").trim()&&!String(t.startDate||"").trim()&&!String(t.endDate||"").trim()&&!String(t.origin||"").trim()&&!String(t.knownNote||"").trim();
}
function looksLikeLegacyStaleTransportPayload(j){
  const transport=Array.isArray(j?.transport)?j.transport:[];
  if(transport.length<4||transport.length>5)return false;
  const legacyRoutes=[["横浜","大阪"],["天王寺","紀伊勝浦"],["大阪","紀伊勝浦"],["紀伊勝浦","白浜"],["白浜","横浜"]];
  const hits=legacyRoutes.filter(([a,b])=>transport.some(x=>x?.from===a&&x?.to===b)).length;
  const noOtherCollections=!(j?.stays||[]).length&&!(j?.itinerary||[]).length&&!(j?.memos||[]).length&&!(j?.packing||[]).length&&!(j?.logs||[]).length;
  return hits>=4&&noOtherCollections;
}
function isGhostJourney(j){
  if(!j||!j.trip)return true;
  return hasDefaultJourneyIdentity(j)&&!journeyHasRealCollections(j);
}
function journeyHasMeaningfulData(j){
  if(!j||isGhostJourney(j))return false;
  return journeyHasIdentity(j)||journeyHasRealCollections(j);
}
function journeyContentSignature(j){
  if(!j||!j.trip)return "";
  const t=j.trip||{};
  const pick=(obj,keys)=>Object.fromEntries(keys.map(k=>[k,obj?.[k]??null]));
  const transport=(j.transport||[]).map(x=>pick(x,["date","from","to","mode","time","price","status","memo"]));
  const stays=(j.stays||[]).map(x=>pick(x,["date","name","area","status","price","memo"]));
  const welcome=j.welcome?pick(j.welcome,["party","mood","stage","entryRoute","known","knownNote"]):null;
  const payload={
    trip:pick(t,["title","startDate","endDate","origin","destination","partyMode","mood","readiness","entryRoute","knownNote"]),
    knownCategories:Array.isArray(t.knownCategories)?[...t.knownCategories]:[],
    welcome,
    transport,stays,
    itinerary:j.itinerary||[],memos:j.memos||[],packing:j.packing||[],logs:j.logs||[]
  };
  return JSON.stringify(payload);
}
function journeysHaveSameContent(a,b){
  const sa=journeyContentSignature(a),sb=journeyContentSignature(b);
  return !!sa&&sa===sb;
}
function normalizeRegistry(r){
  if(!r||!r.currentJourney)return r;
  const needsV057Cleanup=r.schemaVersion!=="0.5.8"||!r.meta?.legacyTransportCleanupV057;

  // One-time cleanup for a v0.5.0-v0.5.6 bug chain: a visually blank journey could carry
  // the old 5-card Osaka transport set after legacy migration. Keep genuine user-entered
  // transport-only journeys; purge only the known stale route fingerprint during migration.
  if(needsV057Cleanup&&hasDefaultJourneyIdentity(r.currentJourney)&&looksLikeLegacyStaleTransportPayload(r.currentJourney)){
    r.currentJourney.transport=[];
    r.currentJourney.meta={...(r.currentJourney.meta||{}),staleBlankTransportPurgedV057:true,updatedAt:new Date().toISOString()};
  }

  const currentId=r.currentJourney?.trip?.id||"";
  const currentSig=journeyContentSignature(r.currentJourney);
  const seenIds=new Set();
  const seenSigs=new Set();
  const cleaned=[];
  for(const j of (Array.isArray(r.savedJourneys)?r.savedJourneys:[])){
    const id=j?.trip?.id||"";
    const sig=journeyContentSignature(j);
    if(!id||id===currentId||seenIds.has(id)||isGhostJourney(j))continue;
    if(needsV057Cleanup&&hasDefaultJourneyIdentity(j)&&looksLikeLegacyStaleTransportPayload(j))continue;
    if(sig&&currentSig&&sig===currentSig)continue;
    if(sig&&seenSigs.has(sig))continue;
    j.meta={...(j.meta||{})};
    if(!j.meta.savedAt)j.meta.savedAt=j.meta.savedForLaterAt||j.meta.createdAt||new Date().toISOString();
    seenIds.add(id);if(sig)seenSigs.add(sig);cleaned.push(j);
  }
  r.savedJourneys=cleaned;
  if(!Array.isArray(r.completedJourneys))r.completedJourneys=[];
  r.schemaVersion="0.5.8";
  r.meta={...(r.meta||{}),registryNormalizedV057:true,legacyTransportCleanupV057:true};
  return r;
}

function loadRegistry(){
  try{
    const r=JSON.parse(localStorage.getItem(JOURNEY_REGISTRY_KEY)||"null");
    if(r&&r.currentJourney&&Array.isArray(r.savedJourneys)){
      const before=JSON.stringify(r.savedJourneys);
      normalizeRegistry(r);
      if(before!==JSON.stringify(r.savedJourneys)||r.schemaVersion!=="0.5.8"||!r.meta?.registryNormalizedV057){
        r.meta={...(r.meta||{}),updatedAt:new Date().toISOString()};
      }
      localStorage.setItem(JOURNEY_REGISTRY_KEY,JSON.stringify(r));
      return r;
    }
  }catch(e){}
  let current=null;
  try{const legacy=JSON.parse(localStorage.getItem(JOURNEY_BOX_KEY)||"null");if(legacy&&legacy.trip)current=migrateLegacyJourney(legacy);}catch(e){}
  if(!current) current=createBlankJourney();
  const registry={schemaVersion:"0.5.8",currentJourney:current,savedJourneys:[],completedJourneys:[],meta:{createdAt:new Date().toISOString(),migratedFromSingleJourney:!!localStorage.getItem(JOURNEY_BOX_KEY),registryNormalizedV057:true,legacyTransportCleanupV057:true}};
  localStorage.setItem(JOURNEY_REGISTRY_KEY,JSON.stringify(registry));
  return registry;
}
function saveRegistry(registry){normalizeRegistry(registry);registry.meta={...(registry.meta||{}),updatedAt:new Date().toISOString()};localStorage.setItem(JOURNEY_REGISTRY_KEY,JSON.stringify(registry));return registry;}
function loadJourneyBox(){return loadRegistry().currentJourney;}
function saveJourneyBox(box){const r=loadRegistry();const next=deepClone(box);next.schemaVersion="0.5.8";next.meta={...(next.meta||{}),updatedAt:new Date().toISOString()};r.currentJourney=next;saveRegistry(r);return next;}
function savedJourneyTime(j){return Date.parse(j?.meta?.savedAt||j?.meta?.savedForLaterAt||j?.meta?.createdAt||0)||0;}
function listSavedJourneys(){return deepClone(loadRegistry().savedJourneys||[]).sort((a,b)=>{const ad=String(a?.trip?.startDate||""),bd=String(b?.trip?.startDate||"");if(ad&&bd)return ad.localeCompare(bd)||savedJourneyTime(a)-savedJourneyTime(b);if(ad)return -1;if(bd)return 1;return savedJourneyTime(a)-savedJourneyTime(b);});}
function markSaved(j){const now=new Date().toISOString();j.trip={...j.trip,lifecycle:"saved"};j.meta={...(j.meta||{}),savedAt:j.meta?.savedAt||now,savedForLaterAt:now};return j;}
function saveCurrentJourneyForLater(){const r=loadRegistry();const current=deepClone(r.currentJourney);if(!journeyHasMeaningfulData(current))return null;markSaved(current);const i=r.savedJourneys.findIndex(x=>x.trip?.id===current.trip?.id);if(i>=0)r.savedJourneys[i]=current;else r.savedJourneys.push(current);saveRegistry(r);return current;}
function startNewBlankJourney({saveCurrent=false}={}){const r=loadRegistry();if(saveCurrent&&journeyHasMeaningfulData(r.currentJourney)){const current=deepClone(r.currentJourney);markSaved(current);const i=r.savedJourneys.findIndex(x=>x.trip?.id===current.trip?.id);if(i>=0)r.savedJourneys[i]=current;else r.savedJourneys.push(current);}r.currentJourney=createBlankJourney();saveRegistry(r);localStorage.removeItem(JOURNEY_BOX_KEY);return r.currentJourney;}
function resumeSavedJourney(id){
  const r=loadRegistry();
  const i=r.savedJourneys.findIndex(x=>x.trip?.id===id);
  if(i<0)return null;
  const chosen=deepClone(r.savedJourneys[i]);
  r.savedJourneys.splice(i,1);
  const old=deepClone(r.currentJourney);
  if(old?.trip?.id!==chosen?.trip?.id&&!journeysHaveSameContent(old,chosen)&&journeyHasMeaningfulData(old)){
    markSaved(old);
    const oldIndex=r.savedJourneys.findIndex(x=>x.trip?.id===old.trip?.id);
    if(oldIndex>=0)r.savedJourneys[oldIndex]=old;else r.savedJourneys.unshift(old);
  }
  chosen.trip={...chosen.trip,lifecycle:"active"};
  r.currentJourney=chosen;
  saveRegistry(r);
  return chosen;
}
function deleteSavedJourney(id){const r=loadRegistry();const before=r.savedJourneys.length;r.savedJourneys=(r.savedJourneys||[]).filter(x=>x.trip?.id!==id);saveRegistry(r);return before-r.savedJourneys.length;}
function patchJourneyTrip(fields){const box=loadJourneyBox();box.trip={...(box.trip||{}),...fields};return saveJourneyBox(box);}
function patchJourneyWelcome(profile){const box=loadJourneyBox();box.welcome={...(box.welcome||{}),...profile};if(profile.party)box.trip.partyMode=profile.party;if(profile.mood)box.trip.mood=profile.mood;if(profile.stage)box.trip.readiness=profile.stage;if(profile.entryRoute)box.trip.entryRoute=profile.entryRoute;if(Array.isArray(profile.known))box.trip.knownCategories=[...profile.known];if(typeof profile.knownNote==="string")box.trip.knownNote=profile.knownNote;return saveJourneyBox(box);}
function replaceJourneyTransport(items){const box=loadJourneyBox();box.transport=items;return saveJourneyBox(box);}
/* Delete exactly one transport card of the active journey by stable ID.
   Do not modify other collections or any saved journey. */
function removeJourneyTransportLeg(id){
  const box=loadJourneyBox();
  const items=Array.isArray(box.transport)?box.transport:[];
  const key=String(id||"");
  if(!key||items.filter(item=>String(item.id)===key).length!==1)return false;
  box.transport=items.filter(item=>String(item.id)!==key).map((item,i)=>({...item,label:String(i+1).padStart(2,"0")}));
  saveJourneyBox(box);
  return true;
}
function replaceJourneyStays(items){const box=loadJourneyBox();box.stays=relabelStays(items);return saveJourneyBox(box);}
function resetJourneyWelcome(){const box=loadJourneyBox();box.welcome=null;if(box.trip){box.trip.partyMode=null;box.trip.mood=null;box.trip.readiness=null;box.trip.entryRoute=null;box.trip.knownCategories=[];box.trip.knownNote="";}return saveJourneyBox(box);}
function resetJourneyBox(){return startNewBlankJourney({saveCurrent:false});}

/* v0.5.9: portable journey backup / safe restore */
const JOURNEY_BACKUP_FORMAT = "project-lady-journey-backup-v1";
function buildJourneyBackup(){
  const registry=deepClone(loadRegistry());
  return {format:JOURNEY_BACKUP_FORMAT,appVersion:"0.5.10.4",exportedAt:new Date().toISOString(),registry};
}
function validateJourneyBackup(payload){
  if(!payload||payload.format!==JOURNEY_BACKUP_FORMAT||!payload.registry||!payload.registry.currentJourney)return false;
  return Array.isArray(payload.registry.savedJourneys);
}
function importJourneyBackupSafely(payload){
  if(!validateJourneyBackup(payload))throw new Error("このファイルはProject Ladyの旅バックアップではありません。");
  const live=loadRegistry();
  const incoming=normalizeRegistry(deepClone(payload.registry));
  const pool=[];
  const addUnique=(j)=>{
    if(!journeyHasMeaningfulData(j))return;
    if(j.trip?.id===live.currentJourney?.trip?.id||journeysHaveSameContent(j,live.currentJourney))return;
    if(pool.some(x=>x.trip?.id===j.trip?.id||journeysHaveSameContent(x,j)))return;
    const copy=deepClone(j);markSaved(copy);pool.push(copy);
  };
  (live.savedJourneys||[]).forEach(addUnique);
  addUnique(incoming.currentJourney);
  (incoming.savedJourneys||[]).forEach(addUnique);
  live.savedJourneys=pool;
  saveRegistry(live);
  return {savedCount:pool.length};
}
