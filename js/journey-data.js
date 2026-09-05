/*
 * Project Lady / Journey Registry v0.5.6
 * Multiple journeys: one active journey, saved journeys, and a future completed archive.
 * v0.5.6: remove semantic duplicates of the active journey from the saved shelf, even when legacy bugs gave the clones different journey IDs.
 * v0.4.x single-journey data is migrated without destroying the Osaka/Kinan working trip.
 */
const JOURNEY_BOX_KEY = "projectLadyJourneyBox_v01"; // legacy single-journey key
const JOURNEY_REGISTRY_KEY = "projectLadyJourneyRegistry_v01";

const JOURNEY_SEED = {
  schemaVersion: "0.5.6",
  trip: {
    id: "2026-osaka-kinan-1119-1122",
    title: "大阪・紀南3泊4日の旅",
    startDate: "2026-11-19",
    endDate: "2026-11-22",
    origin: "横浜市神奈川区（自宅）",
    destination: "大阪・紀南",
    partyMode: "solo",
    mood: "active",
    readiness: "mostly",
    entryRoute: "before",
    knownCategories: ["destination", "dates", "transport", "stay", "plans", "bookings"],
    knownNote: "",
    mainPhoto: null,
    lifecycle: "active"
  },
  welcome: {
    party: "solo", mood: "active", stage: "mostly", entryRoute: "before",
    known: ["destination", "dates", "transport", "stay", "plans", "bookings"], knownNote: ""
  },
  transport: [
    {id:"leg1",label:"01",date:"11/19",from:"羽田",to:"神戸",mode:"飛行機",time:"09:10 → 10:30",price:"支払済",status:"予約済み",memo:"SKY103。購入・支払済。神戸到着後は大阪へ。"},
    {id:"leg2",label:"02",date:"11/20",from:"天王寺",to:"新宮",mode:"特急・電車",time:"07:59 → 11:59",price:"WEB早特7候補",status:"発売待ち",memo:"くろしお1号。10/20 10:00発売。第1希望＝5号車17D、第2希望＝2号車17D。海側D＋奇数列＋最後尾＋電源を優先。"},
    {id:"leg3",label:"03",date:"11/21",from:"紀伊勝浦",to:"白浜",mode:"レンタカー",time:"11/21 08:00 → 11/22 11:00",price:"6,600円",status:"予約済み",memo:"ぬくいレンタカー。勝浦借受→白浜返却。乗り捨て無料。"},
    {id:"leg4",label:"04",date:"11/22",from:"白浜",to:"日根野",mode:"特急・電車",time:"17:20 → 日根野",price:"",status:"発売待ち",memo:"くろしお32号。10/22 10:00発売。窓側優先。17Dが空いていれば候補だが必須ではない。"},
    {id:"leg5",label:"05",date:"11/22",from:"日根野",to:"関西空港",mode:"特急・電車",time:"→ 19:21頃",price:"",status:"発売待ち",memo:"くろしお32号から関空方面へ乗継。関空19:21頃着を目安。"},
    {id:"leg6",label:"06",date:"11/22",from:"関西",to:"羽田",mode:"飛行機",time:"21:00 → 22:15",price:"10,690円",status:"予約済み",memo:"ANA98／ANA WINGS。購入・支払済。KIX T1→HND T2。予約番号 EQW7N。"}
  ],
  stays: [
    {id:"stay1",label:"01",date:"11/19",name:"ニッシン・ナンバ・イン",area:"大阪・なんば",status:"予約済み",price:"5,001円",memo:"Agoda予約・支払済み。喫煙ルーム。予約ID 1755191376。"},
    {id:"stay2",label:"02",date:"11/20",name:"ホテル浦島",area:"那智勝浦",status:"予約済み",price:"21,450円",memo:"公式予約・現地払い。16:30前後チェックイン予定。19:00 和DINING祭。"},
    {id:"stay3",label:"03",date:"11/21",name:"祖母宅",area:"田辺方面",status:"第一希望・確認待ち",price:"",memo:"第一希望。ただし、まだ連絡前のため未確定。10月後半～11月上旬目安に相談。"},
    {id:"stay3b",label:"04",date:"11/21",name:"グランパスSea",area:"白浜",status:"保険予約",price:"9,828円",memo:"11/21の保険宿。11/17まで取消無料。祖母宅泊が決まれば整理する。"},
    {id:"stay3c",label:"05",date:"11/21",name:"エレガンテ白浜",area:"白浜",status:"保険予約",price:"11,610円＋入湯税150円",memo:"11/21の保険宿。11/18まで取消無料。祖母宅泊が決まれば整理する。"}
  ],
  itinerary: [], memos: [], packing: [], logs: [],
  meta: {source:"大阪・紀南3泊4日_旅の台帳_v0.11.14_2026-09-04_旅程最新版反映版",seededAt:"2026-09-04",updatedAt:null}
};

function deepClone(v){return JSON.parse(JSON.stringify(v));}
function cloneJourneySeed(){return deepClone(JOURNEY_SEED);}
function makeJourneyId(){return `journey-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
function createBlankJourney(){
  const now=new Date().toISOString();
  return {schemaVersion:"0.5.6",trip:{id:makeJourneyId(),title:"今回の旅",startDate:"",endDate:"",origin:"",destination:"",partyMode:null,mood:null,readiness:null,entryRoute:null,knownCategories:[],knownNote:"",mainPhoto:null,lifecycle:"active"},welcome:null,transport:[],stays:[],itinerary:[],memos:[],packing:[],logs:[],meta:{source:"new journey",createdAt:now,updatedAt:now}};
}
function relabelStays(items){return (items||[]).map((item,i)=>({...item,label:String(i+1).padStart(2,"0")}));}

function migrateLegacyJourney(saved){
  if(!saved || !saved.trip) return saved;
  const next=deepClone(saved);
  if(!Array.isArray(next.stays)) next.stays=cloneJourneySeed().stays;
  const oldCombinedIndex=next.stays.findIndex(x=>x&&x.id==="stay3"&&x.name==="祖母宅／白浜保険宿");
  if(oldCombinedIndex>=0){const seed=cloneJourneySeed().stays;next.stays.splice(oldCombinedIndex,1,seed[2],seed[3],seed[4]);}
  const stay1=next.stays.find(x=>x&&x.id==="stay1");
  if(stay1){if(stay1.price==="支払済"||stay1.price==="")stay1.price="5,001円";if(stay1.memo==="Agoda予約。喫煙ルーム。")stay1.memo="Agoda予約・支払済み。喫煙ルーム。予約ID 1755191376。";}
  const stay2=next.stays.find(x=>x&&x.id==="stay2");
  if(stay2){if(stay2.price==="")stay2.price="21,450円";if(stay2.memo==="19:00 和DINING祭。")stay2.memo="公式予約・現地払い。16:30前後チェックイン予定。19:00 和DINING祭。";}
  const transport=Array.isArray(next.transport)?next.transport:[];
  const hasAna98=transport.some(x=>x&&x.id==="leg6"&&x.from==="関西"&&x.to==="羽田");
  const stale=transport.some(x=>x&&x.id==="leg4"&&x.to==="横浜")||transport.some(x=>x&&x.id==="leg1"&&x.from==="横浜")||!transport.some(x=>x&&x.id==="leg5")||!hasAna98;
  if(next.trip.id===JOURNEY_SEED.trip.id&&stale){
    const ids=new Set(["leg1","leg2","leg3","leg4","leg5","leg6"]);
    const extras=transport.filter(x=>x&&!ids.has(x.id)&&[x.date,x.from,x.to,x.time,x.price,x.memo].some(v=>String(v||"").trim()));
    next.transport=[...cloneJourneySeed().transport,...extras].map((x,i)=>({...x,label:String(i+1).padStart(2,"0")}));
  }
  next.stays=next.stays.filter(x=>!(x&&x.id==="stay4"&&x.name==="エレガンテ白浜"&&x.status==="延泊保険"));
  next.stays=relabelStays(next.stays);
  next.itinerary=Array.isArray(next.itinerary)?next.itinerary:[];next.memos=Array.isArray(next.memos)?next.memos:[];next.packing=Array.isArray(next.packing)?next.packing:[];next.logs=Array.isArray(next.logs)?next.logs:[];
  next.trip={...next.trip,lifecycle:"active"};next.schemaVersion="0.5.6";next.meta={...(next.meta||{}),migratedToRegistryV050:true};
  return next;
}

function journeyHasRealCollections(j){
  return !!((j?.transport||[]).length||(j?.stays||[]).length||(j?.itinerary||[]).length||(j?.memos||[]).length||(j?.packing||[]).length||(j?.logs||[]).length);
}
function journeyHasIdentity(j){
  const t=j?.trip||{};
  return !!((t.title&&t.title!=="今回の旅")||String(t.destination||"").trim()||String(t.startDate||"").trim()||String(t.endDate||"").trim()||String(t.origin||"").trim()||String(t.knownNote||"").trim());
}
function looksLikeOsakaSeedPayload(j){
  const transport=Array.isArray(j?.transport)?j.transport:[];
  const stays=Array.isArray(j?.stays)?j.stays:[];
  const routeHits=[
    ["羽田","神戸"],["天王寺","新宮"],["紀伊勝浦","白浜"],["白浜","日根野"],["日根野","関西空港"],["関西","羽田"],
    ["横浜","大阪"],["大阪","紀伊勝浦"],["白浜","横浜"]
  ].filter(([a,b])=>transport.some(x=>x?.from===a&&x?.to===b)).length;
  const stayHits=["ニッシン・ナンバ・イン","ホテル浦島","グランパスSea","エレガンテ白浜"].filter(name=>stays.some(x=>x?.name===name)).length;
  return routeHits>=2||stayHits>=2;
}
function isGhostJourney(j){
  if(!j||!j.trip)return true;
  const t=j.trip||{};
  const defaultIdentity=(!t.title||t.title==="今回の旅")&&!String(t.destination||"").trim()&&!String(t.startDate||"").trim()&&!String(t.endDate||"").trim()&&!String(t.origin||"").trim()&&!String(t.knownNote||"").trim();
  const hasCollections=journeyHasRealCollections(j);

  // A saved item with no trip identity and no actual trip collections is not a journey.
  // Earlier builds could leave one behind after Welcome-only navigation even when its meta/source
  // no longer said "new journey". Purge it regardless of legacy metadata.
  if(defaultIdentity&&!hasCollections) return true;

  // v0.5.0-v0.5.4 could also leave an unnamed shell contaminated with the Osaka seed payload.
  // If it still has no independent identity, it is not a real second journey.
  if(defaultIdentity&&looksLikeOsakaSeedPayload(j)) return true;
  return false;
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
  const payload={
    trip:pick(t,["title","startDate","endDate","origin","destination","partyMode","mood","readiness","entryRoute","knownNote"]),
    knownCategories:Array.isArray(t.knownCategories)?[...t.knownCategories]:[],
    welcome:j.welcome||null,
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
  const currentId=r.currentJourney?.trip?.id||"";
  const currentSig=journeyContentSignature(r.currentJourney);
  const seenIds=new Set();
  const seenSigs=new Set();
  const cleaned=[];
  for(const j of (Array.isArray(r.savedJourneys)?r.savedJourneys:[])){
    const id=j?.trip?.id||"";
    const sig=journeyContentSignature(j);
    if(!id||id===currentId||seenIds.has(id)||isGhostJourney(j))continue;
    // Legacy v0.5.x could leave a full clone of the active journey with a different ID.
    // A saved shelf must never contain a second copy of the journey that is active now.
    if(sig&&currentSig&&sig===currentSig)continue;
    // Also collapse exact duplicate saved clones created by the same bug chain.
    if(sig&&seenSigs.has(sig))continue;
    seenIds.add(id);if(sig)seenSigs.add(sig);cleaned.push(j);
  }
  r.savedJourneys=cleaned;
  if(!Array.isArray(r.completedJourneys))r.completedJourneys=[];
  r.schemaVersion="0.5.6";
  r.meta={...(r.meta||{}),registryNormalizedV056:true};
  return r;
}

function loadRegistry(){
  try{
    const r=JSON.parse(localStorage.getItem(JOURNEY_REGISTRY_KEY)||"null");
    if(r&&r.currentJourney&&Array.isArray(r.savedJourneys)){
      const before=JSON.stringify(r.savedJourneys);
      normalizeRegistry(r);
      if(before!==JSON.stringify(r.savedJourneys)||r.schemaVersion!=="0.5.6"||!r.meta?.registryNormalizedV056){
        r.meta={...(r.meta||{}),updatedAt:new Date().toISOString()};
      }
      localStorage.setItem(JOURNEY_REGISTRY_KEY,JSON.stringify(r));
      return r;
    }
  }catch(e){}
  let current=null;
  try{const legacy=JSON.parse(localStorage.getItem(JOURNEY_BOX_KEY)||"null");if(legacy&&legacy.trip)current=migrateLegacyJourney(legacy);}catch(e){}
  if(!current) current=createBlankJourney();
  const registry={schemaVersion:"0.5.6",currentJourney:current,savedJourneys:[],completedJourneys:[],meta:{createdAt:new Date().toISOString(),migratedFromSingleJourney:!!localStorage.getItem(JOURNEY_BOX_KEY),registryNormalizedV056:true}};
  localStorage.setItem(JOURNEY_REGISTRY_KEY,JSON.stringify(registry));
  return registry;
}
function saveRegistry(registry){normalizeRegistry(registry);registry.meta={...(registry.meta||{}),updatedAt:new Date().toISOString()};localStorage.setItem(JOURNEY_REGISTRY_KEY,JSON.stringify(registry));return registry;}
function loadJourneyBox(){return loadRegistry().currentJourney;}
function saveJourneyBox(box){const r=loadRegistry();const next=deepClone(box);next.schemaVersion="0.5.6";next.meta={...(next.meta||{}),updatedAt:new Date().toISOString()};r.currentJourney=next;saveRegistry(r);return next;}
function listSavedJourneys(){return deepClone(loadRegistry().savedJourneys||[]);}
function saveCurrentJourneyForLater(){const r=loadRegistry();const current=deepClone(r.currentJourney);if(!journeyHasMeaningfulData(current))return null;current.trip={...current.trip,lifecycle:"saved"};current.meta={...(current.meta||{}),savedForLaterAt:new Date().toISOString()};const i=r.savedJourneys.findIndex(x=>x.trip?.id===current.trip?.id);if(i>=0)r.savedJourneys[i]=current;else r.savedJourneys.unshift(current);saveRegistry(r);return current;}
function startNewBlankJourney({saveCurrent=false}={}){const r=loadRegistry();if(saveCurrent&&journeyHasMeaningfulData(r.currentJourney)){const current=deepClone(r.currentJourney);current.trip={...current.trip,lifecycle:"saved"};current.meta={...(current.meta||{}),savedForLaterAt:new Date().toISOString()};const i=r.savedJourneys.findIndex(x=>x.trip?.id===current.trip?.id);if(i>=0)r.savedJourneys[i]=current;else r.savedJourneys.unshift(current);}r.currentJourney=createBlankJourney();saveRegistry(r);localStorage.removeItem(JOURNEY_BOX_KEY);return r.currentJourney;}
function resumeSavedJourney(id){
  const r=loadRegistry();
  const i=r.savedJourneys.findIndex(x=>x.trip?.id===id);
  if(i<0)return null;
  const chosen=deepClone(r.savedJourneys[i]);
  r.savedJourneys.splice(i,1);
  const old=deepClone(r.currentJourney);
  if(old?.trip?.id!==chosen?.trip?.id&&!journeysHaveSameContent(old,chosen)&&journeyHasMeaningfulData(old)){
    old.trip={...old.trip,lifecycle:"saved"};
    old.meta={...(old.meta||{}),savedForLaterAt:new Date().toISOString()};
    const oldIndex=r.savedJourneys.findIndex(x=>x.trip?.id===old.trip?.id);
    if(oldIndex>=0)r.savedJourneys[oldIndex]=old;else r.savedJourneys.unshift(old);
  }
  chosen.trip={...chosen.trip,lifecycle:"active"};
  r.currentJourney=chosen;
  saveRegistry(r);
  return chosen;
}
function deleteSavedJourney(id){const r=loadRegistry();r.savedJourneys=(r.savedJourneys||[]).filter(x=>x.trip?.id!==id);saveRegistry(r);}
function patchJourneyWelcome(profile){const box=loadJourneyBox();box.welcome={...(box.welcome||{}),...profile};if(profile.party)box.trip.partyMode=profile.party;if(profile.mood)box.trip.mood=profile.mood;if(profile.stage)box.trip.readiness=profile.stage;if(profile.entryRoute)box.trip.entryRoute=profile.entryRoute;if(Array.isArray(profile.known))box.trip.knownCategories=[...profile.known];if(typeof profile.knownNote==="string")box.trip.knownNote=profile.knownNote;return saveJourneyBox(box);}
function replaceJourneyTransport(items){const box=loadJourneyBox();box.transport=items;return saveJourneyBox(box);}
function replaceJourneyStays(items){const box=loadJourneyBox();box.stays=relabelStays(items);return saveJourneyBox(box);}
function resetJourneyWelcome(){const box=loadJourneyBox();box.welcome=null;if(box.trip){box.trip.partyMode=null;box.trip.mood=null;box.trip.readiness=null;box.trip.entryRoute=null;box.trip.knownCategories=[];box.trip.knownNote="";}return saveJourneyBox(box);}
function resetJourneyBox(){return startNewBlankJourney({saveCurrent:false});}
