/*
 * Project Lady / Phase3 Travel Data Box v0.1
 * One journey, one source of truth inside the browser prototype.
 * Seed values come from the Osaka/Kinan travel ledger v0.11.4.
 */
const JOURNEY_BOX_KEY = "projectLadyJourneyBox_v01";

const JOURNEY_SEED = {
  schemaVersion: "0.2",
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
    mainPhoto: null
  },
  welcome: {
    party: "solo",
    mood: "active",
    stage: "mostly",
    entryRoute: "before",
    known: ["destination", "dates", "transport", "stay", "plans", "bookings"],
    knownNote: ""
  },
  transport: [
    {id:"leg1",label:"01",date:"11/19",from:"横浜",to:"大阪",mode:"飛行機",time:"13:30 → 14:40候補",price:"10,910円目安",status:"監視中",memo:"羽田→伊丹。チケット確保後に予約。"},
    {id:"leg2",label:"02",date:"11/20",from:"大阪",to:"紀伊勝浦",mode:"特急・電車",time:"天王寺 7:59 → 新宮 11:59",price:"6,750円目安",status:"発売待ち",memo:"くろしお1号／WEB早特7／D席・できれば7D。新宮→紀伊勝浦は別途確認。"},
    {id:"leg3",label:"03",date:"11/21",from:"紀伊勝浦",to:"白浜",mode:"レンタカー",time:"",price:"10,000円目安",status:"未予約",memo:"ぬくいレンタカー。勝浦借受→白浜返却。乗り捨て条件・営業時間確認。"},
    {id:"leg4",label:"04",date:"11/22",from:"白浜",to:"横浜",mode:"飛行機",time:"最終便候補",price:"15,000円目安",status:"監視中",memo:"南紀白浜→羽田。最終便軸で確認。"}
  ],
  meta: {
    source: "大阪・紀南3泊4日_旅の台帳_v0.11.12",
    seededAt: "2026-08-30",
    updatedAt: null
  }
};

function cloneJourneySeed(){
  return JSON.parse(JSON.stringify(JOURNEY_SEED));
}

function loadJourneyBox(){
  try{
    const saved = JSON.parse(localStorage.getItem(JOURNEY_BOX_KEY) || "null");
    if(saved && saved.trip && Array.isArray(saved.transport)) return saved;
  }catch(e){}
  const fresh = cloneJourneySeed();
  localStorage.setItem(JOURNEY_BOX_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveJourneyBox(box){
  const next = JSON.parse(JSON.stringify(box));
  next.meta = {...(next.meta || {}), updatedAt:new Date().toISOString()};
  localStorage.setItem(JOURNEY_BOX_KEY, JSON.stringify(next));
  return next;
}

function patchJourneyWelcome(profile){
  const box = loadJourneyBox();
  box.welcome = {...(box.welcome || {}), ...profile};
  if(profile.party) box.trip.partyMode = profile.party;
  if(profile.mood) box.trip.mood = profile.mood;
  if(profile.stage) box.trip.readiness = profile.stage;
  if(profile.entryRoute) box.trip.entryRoute = profile.entryRoute;
  if(Array.isArray(profile.known)) box.trip.knownCategories = [...profile.known];
  if(typeof profile.knownNote === "string") box.trip.knownNote = profile.knownNote;
  return saveJourneyBox(box);
}

function replaceJourneyTransport(items){
  const box = loadJourneyBox();
  box.transport = items;
  return saveJourneyBox(box);
}

function resetJourneyWelcome(){
  const box = loadJourneyBox();
  box.welcome = null;
  if(box.trip){
    box.trip.partyMode = null;
    box.trip.mood = null;
    box.trip.readiness = null;
    box.trip.entryRoute = null;
    box.trip.knownCategories = [];
    box.trip.knownNote = "";
  }
  return saveJourneyBox(box);
}

function resetJourneyBox(){
  localStorage.removeItem(JOURNEY_BOX_KEY);
  return loadJourneyBox();
}
