/*
 * Project Lady / Phase3 Travel Data Box v0.1
 * One journey, one source of truth inside the browser prototype.
 * Seed values come from the Osaka/Kinan travel ledger v0.11.4.
 */
const JOURNEY_BOX_KEY = "projectLadyJourneyBox_v01";

const JOURNEY_SEED = {
  schemaVersion: "0.4",
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
    {id:"leg1",label:"01",date:"11/19",from:"羽田",to:"神戸",mode:"飛行機",time:"09:10 → 10:30",price:"支払済",status:"予約済み",memo:"SKY103。購入・支払済。神戸到着後は大阪へ。"},
    {id:"leg2",label:"02",date:"11/20",from:"天王寺",to:"新宮",mode:"特急・電車",time:"07:59 → 11:59",price:"",status:"発売待ち",memo:"くろしお1号。海側D席＋電源を優先。座席候補 1号車11D。"},
    {id:"leg3",label:"03",date:"11/21",from:"紀伊勝浦",to:"白浜",mode:"レンタカー",time:"11/21 08:00 → 11/22 11:00",price:"6,600円",status:"予約済み",memo:"ぬくいレンタカー。勝浦借受→白浜返却。"},
    {id:"leg4",label:"04",date:"11/22",from:"白浜",to:"横浜",mode:"その他",time:"",price:"",status:"候補",memo:"ホワイトビーチシャトル／JAL最終便／11/23帰着の三分岐。"}
  ],
  stays: [
    {id:"stay1",label:"01",date:"11/19",name:"ニッシン・ナンバ・イン",area:"大阪・なんば",status:"予約済み",price:"支払済",memo:"Agoda予約。喫煙ルーム。"},
    {id:"stay2",label:"02",date:"11/20",name:"ホテル浦島",area:"那智勝浦",status:"予約済み",price:"",memo:"19:00 和DINING祭。"},
    {id:"stay3",label:"03",date:"11/21",name:"祖母宅／白浜保険宿",area:"田辺・白浜",status:"保留",price:"",memo:"祖母宅泊を第一希望。グランパスSea＋エレガンテ白浜を保険保持。"},
    {id:"stay4",label:"04",date:"11/22",name:"エレガンテ白浜（延泊保険）",area:"白浜",status:"保険予約",price:"",memo:"11/22に帰る場合は取消。"}
  ],
  meta: {
    source: "大阪・紀南3泊4日_旅の台帳_v0.11.12 / 時系列しおり_v0.3",
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
    if(saved && saved.trip && Array.isArray(saved.transport)){
      if(!Array.isArray(saved.stays)) saved.stays = cloneJourneySeed().stays;
      return saved;
    }
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

function replaceJourneyStays(items){
  const box = loadJourneyBox();
  box.stays = items;
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
