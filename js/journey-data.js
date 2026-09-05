/*
 * Project Lady / Phase3 Travel Data Box v0.4.3
 * One journey, one source of truth inside the browser prototype.
 * Current seed values are aligned to the Osaka/Kinan trip ledger v0.11.14 reviewed on 2026-09-04.
 */
const JOURNEY_BOX_KEY = "projectLadyJourneyBox_v01";

const JOURNEY_SEED = {
  schemaVersion: "0.4.3",
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
  meta: {
    source: "大阪・紀南3泊4日_旅の台帳_v0.11.14_2026-09-04_旅程最新版反映版",
    seededAt: "2026-09-04",
    updatedAt: null
  }
};

function cloneJourneySeed(){
  return JSON.parse(JSON.stringify(JOURNEY_SEED));
}

function relabelStays(items){
  return items.map((item,i)=>({...item,label:String(i+1).padStart(2,"0")}));
}

function migrateJourneyBox(saved){
  if(!saved || !saved.trip) return saved;
  const next = JSON.parse(JSON.stringify(saved));
  if(!Array.isArray(next.stays)) next.stays = cloneJourneySeed().stays;

  // v0.4 -> v0.4.1 lodging migration.
  // Only replace the old combined/default lodging records. User-entered edits elsewhere are kept.
  const oldCombinedIndex = next.stays.findIndex(x => x && x.id === "stay3" && x.name === "祖母宅／白浜保険宿");
  if(oldCombinedIndex >= 0){
    const seed = cloneJourneySeed().stays;
    next.stays.splice(oldCombinedIndex, 1, seed[2], seed[3], seed[4]);
  }

  const oldStay4 = next.stays.find(x => x && x.id === "stay4");
  if(oldStay4 && oldStay4.name === "エレガンテ白浜（延泊保険）"){
    Object.assign(oldStay4, cloneJourneySeed().stays.find(x=>x.id === "stay4"));
  }

  const stay1 = next.stays.find(x => x && x.id === "stay1");
  if(stay1){
    if(stay1.price === "支払済" || stay1.price === "") stay1.price = "5,001円";
    // Preserve notes added by the user (e.g. review TEST); only upgrade the old default memo prefix.
    if(stay1.memo === "Agoda予約。喫煙ルーム。") stay1.memo = "Agoda予約・支払済み。喫煙ルーム。予約ID 1755191376。";
  }

  const stay2 = next.stays.find(x => x && x.id === "stay2");
  if(stay2){
    if(stay2.price === "") stay2.price = "21,450円";
    if(stay2.memo === "19:00 和DINING祭。") stay2.memo = "公式予約・現地払い。16:30前後チェックイン予定。19:00 和DINING祭。";
  }

  // v0.4.3 transport repair.
  // v0.4.2 relied on exact old memo text, so a browser that had edited/legacy transport
  // could be marked 0.4.2 while still showing the old route. Detect the stale route by
  // structure/content instead and sync the six canonical legs for this Osaka/Kinan trip.
  const transport = Array.isArray(next.transport) ? next.transport : [];
  const hasAna98 = transport.some(x => x && x.id === "leg6" && x.from === "関西" && x.to === "羽田");
  const oldReturnToYokohama = transport.some(x => x && x.id === "leg4" && x.to === "横浜");
  const oldOutboundFromYokohama = transport.some(x => x && x.id === "leg1" && x.from === "横浜");
  const missingCanonicalLegs = !transport.some(x => x && x.id === "leg5") || !transport.some(x => x && x.id === "leg6");
  const needsTransportRepair = next.trip?.id === JOURNEY_SEED.trip.id &&
    (!next.meta?.transportSyncV043) &&
    (oldReturnToYokohama || oldOutboundFromYokohama || missingCanonicalLegs || !hasAna98);

  if(needsTransportRepair){
    const canonicalIds = new Set(["leg1","leg2","leg3","leg4","leg5","leg6"]);
    // Keep only genuinely custom extra legs with some content; discard blank legacy/add-card shells.
    const customExtras = transport.filter(x => {
      if(!x || canonicalIds.has(x.id)) return false;
      return [x.date,x.from,x.to,x.time,x.price,x.memo].some(v => String(v || "").trim());
    });
    next.transport = [...cloneJourneySeed().transport, ...customExtras].map((x,i)=>({
      ...x, label:String(i+1).padStart(2,"0")
    }));
    next.meta = {...(next.meta || {}), transportSyncV043:true};
  }
  // Remove the obsolete 11/22 extension-insurance seed only when it is still the old default.
  next.stays = next.stays.filter(x => !(x && x.id === "stay4" && x.name === "エレガンテ白浜" && x.status === "延泊保険"));
  next.stays = relabelStays(next.stays);
  next.schemaVersion = "0.4.3";
  next.meta = {...(next.meta || {}), source:JOURNEY_SEED.meta.source};
  return next;
}

function loadJourneyBox(){
  try{
    const saved = JSON.parse(localStorage.getItem(JOURNEY_BOX_KEY) || "null");
    if(saved && saved.trip && Array.isArray(saved.transport)){
      const migrated = migrateJourneyBox(saved);
      if(JSON.stringify(migrated) !== JSON.stringify(saved)){
        localStorage.setItem(JOURNEY_BOX_KEY, JSON.stringify(migrated));
      }
      return migrated;
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
  box.stays = relabelStays(items);
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
