const LEGACY_PROFILE_KEY="projectLadyJourneyProfile_v07";
const LEGACY_TRANSPORT_KEY="projectLadyTransport_v01";
const UI_STATE_KEY="projectLadyUiState_v01";
const HOME_INTRO_KEY="projectLadyHomeIntroSeen_v01";
const answers={party:null,mood:null,stage:null,entryRoute:null,known:[],knownNote:""};
const screens=[
{type:"intro",eyebrow:"A journey begins",title:"今回は、どんな旅ですか？",text:"まだ何も決まっていなくても大丈夫。<br>ここから、少しずつ。"},
{key:"party",compact:true,eyebrow:"About this journey",title:"誰と景色を見に行く？",text:"人数がわかると、ホテルや旅の提案も少し変わるよ。",choices:[
{label:"一人旅",sub:"自分のペースで。",value:"solo"},{label:"二人旅",sub:"同じ景色を、隣で。",value:"pair"},{label:"ワイワイ旅",sub:"寄り道も、思い出も。",value:"group"},{label:"まだ決めてない",sub:"決まってなくても大丈夫。",value:"later"}]},
{key:"mood",compact:true,eyebrow:"Mood",title:"どんな時間を過ごしたい？",text:"今回は、なんとなくで大丈夫。",choices:[
{label:"のんびり",sub:"余白も旅のうち。",value:"slow"},{label:"アクティブ",sub:"行きたいところへ。",value:"active"},{label:"どっちも",sub:"気分のままに。",value:"mix"},{label:"まだわからない",sub:"その日の気分で。",value:"later"}]},
{key:"stage",eyebrow:"Right now",title:"旅は、どこまで決まってる？",text:"最初から全部そろってなくて大丈夫。今必要なところから始めよう。",choices:[
{label:"なんとなく考えてる",sub:"行き先など、少しだけイメージがある",value:"planning"},{label:"一部だけ決まってる",sub:"ホテル1泊だけ、交通だけ…みたいな旅",value:"partial"},{label:"だいたい決まってる",sub:"あとは細かいところを整えたい",value:"mostly"},{label:"まだ何も決めてない",sub:"ここからゆっくり考えたい",value:"none"},{label:"今、旅の途中",sub:"今日必要な情報をすぐ見たい",value:"traveling"},{label:"思い出を残したい",sub:"終わった旅をゆっくり振り返りたい",value:"memory"}]},
{type:"known",eyebrow:"Already decided",title:"決まっていることを教えてください。",text:"",choices:[
{label:"行き先・方面",value:"destination"},{label:"日程",value:"dates"},{label:"交通",value:"transport"},{label:"ホテル・宿",value:"stay"},{label:"やりたいこと・行きたい場所",value:"plans"},{label:"チケット・予約済みの予定",value:"bookings"}]},
{type:"final",eyebrow:"Ready"},
{type:"midAfter",eyebrow:"Right now",title:"今の旅に、いちばん近いのは？",text:"旅の途中からでも、帰ってきてからでも。今いるところから始められます。",choices:[
{label:"今、旅の途中",sub:"今日必要な交通や予定をすぐ見たい",value:"traveling"},
{label:"思い出を残したい",sub:"終わった旅をゆっくり振り返りたい",value:"memory"},
{label:"これ以降の旅について考える",sub:"この先の予定や行き先を考えたい",value:"future"}]}];
let currentScreen=0;
const app=document.getElementById("app"),sheet=document.getElementById("sheet"),stage=document.getElementById("stage"),heroCopy=document.getElementById("heroCopy");
function load(){
 const box=loadJourneyBox();
 return box?.welcome||null;
}
function save(){
 patchJourneyWelcome({...answers,savedAt:new Date().toISOString()});
 localStorage.removeItem(LEGACY_PROFILE_KEY);
}
function clearWelcomeOnly(){
 resetJourneyWelcome();
 localStorage.removeItem(LEGACY_PROFILE_KEY);
 // Transport / hotel / itinerary / memo / log data must survive a Welcome reset.
}
function migrateLegacyData(){
 const box=loadJourneyBox();
 try{
   const legacyProfile=JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY)||"null");
   if(legacyProfile && !box.meta?.legacyProfileMigrated && box.meta?.source!=="new journey"){
     box.welcome={...(box.welcome||{}),...legacyProfile};
     if(legacyProfile.party) box.trip.partyMode=legacyProfile.party;
     if(legacyProfile.mood) box.trip.mood=legacyProfile.mood;
     box.meta={...(box.meta||{}),legacyProfileMigrated:true};
   }
   // Once the registry exists, a legacy profile must never repopulate a future blank journey.
   localStorage.removeItem(LEGACY_PROFILE_KEY);
 }catch(e){}
 try{
   const legacyTransport=JSON.parse(localStorage.getItem(LEGACY_TRANSPORT_KEY)||"null");
   if(Array.isArray(legacyTransport) && legacyTransport.length && !box.meta?.legacyTransportMigrated){
     // Never inject old transport into a deliberately new blank journey.
     if(box.meta?.source!=="new journey" && (!Array.isArray(box.transport) || !box.transport.length)){
       box.transport=legacyTransport;
     }
     box.meta={...(box.meta||{}),legacyTransportMigrated:true};
     localStorage.removeItem(LEGACY_TRANSPORT_KEY);
   }
 }catch(e){}
 saveJourneyBox(box);
}
function saveUiState(page,extra={}){localStorage.setItem(UI_STATE_KEY,JSON.stringify({page,...extra,savedAt:new Date().toISOString()}))}
function loadUiState(){try{return JSON.parse(localStorage.getItem(UI_STATE_KEY)||"null")}catch(e){return null}}
function persistWelcomeDraft(){
 patchJourneyWelcome({...answers,draft:true,savedAt:new Date().toISOString()});
}
function finishMidAfter(value){
 answers.entryRoute="midAfter";
 answers.stage=value;
 persistWelcomeDraft();
 save();
 if(value==="traveling"){renderTransport();return;}
 if(value==="memory"){renderPlaceholder("旅ログ");return;}
 renderDestinationStart();
}
function partyCopy(p){return({solo:"今日は、自分の歩幅で。",pair:"同じ景色を、隣で。",group:"寄り道も、思い出も、みんなで。",later:"旅は、ここから始まる。"})[p]||""}
function stageCopy(s){return({planning:"旅は、ここから始まる。",partial:"続きは、ゆっくり決めよう。",mostly:"あと少しで、旅になる。",traveling:"今日という旅を、大切に。",memory:"旅が終わっても、残るものを。"})[s]||""}
function showHero(t){heroCopy.textContent=t||"";heroCopy.classList.toggle("show",!!t)}
function swap(fn){stage.classList.remove("active");setTimeout(()=>{fn();requestAnimationFrame(()=>stage.classList.add("active"))},330)}
function progress(){let h='<div class="progress">';for(let i=1;i<=3;i++)h+=`<span class="dot ${currentScreen===i?"active":""}"></span>`;return h+"</div>"}
function renderReturn(profile){saveUiState("return");app.classList.remove("home-mode");stage.className="stage active";showHero(partyCopy(profile.party));swap(()=>{sheet.className="sheet";sheet.innerHTML=`<p class="tiny">WELCOME BACK</p><p class="final-message">さぁ、どこまで行こうか。</p><p class="final-sub">前に決めた旅の方針は、そのまま残ってるよ。</p><button class="start-button" id="continue">続きから見る</button><div class="secondary-row"><button class="restart" id="reset">旅の方針を決め直す</button></div><p class="footer-message">This app is also on a journey.</p>`;document.getElementById("continue").onclick=renderHome;document.getElementById("reset").onclick=()=>{Object.assign(answers,profile);currentScreen=1;showHero("");render()}})}
function render(){
 saveUiState("welcome",{screen:currentScreen});
 app.classList.remove("home-mode");stage.className="stage active";const s=screens[currentScreen];showHero("");
 swap(()=>{
  if(s.type!=="final")showHero("");
  sheet.className="sheet";
  if(s.type==="intro"){
   const savedCount=listSavedJourneys().length;
   sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><h1>${s.title}</h1><p class="lead">${s.text}</p><button class="start-button" id="start">旅をはじめる</button><button class="start-button start-button-secondary" id="midAfter">旅の途中・旅のあと</button>${savedCount?`<button class="start-button saved-entry-button" id="openSaved">保存した旅をひらく　${savedCount}件</button>`:""}<p class="footer-message">This app is also on a journey.</p>`;
   document.getElementById("start").onclick=()=>{answers.entryRoute="before";persistWelcomeDraft();currentScreen=1;render()};
   document.getElementById("midAfter").onclick=()=>{answers.entryRoute="midAfter";persistWelcomeDraft();currentScreen=screens.length-1;render()};
   const openSaved=document.getElementById("openSaved");if(openSaved)openSaved.onclick=()=>renderSavedJourneys({backToWelcome:true});
   return
  }
  if(s.type==="midAfter"){
   const ch=s.choices.map(c=>`<button class="choice" data-value="${c.value}"><span class="choice-main">${c.label}</span>${c.sub?`<span class="choice-sub">${c.sub}</span>`:""}</button>`).join("");
   sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><h1>${s.title}</h1><p class="lead">${s.text}</p><div class="choices">${ch}</div><div class="secondary-row"><button class="back" id="backToEntry">← ひとつ戻る</button><button class="restart" id="restart">最初からやり直す</button></div>`;
   document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>finishMidAfter(b.dataset.value));
   document.getElementById("backToEntry").onclick=()=>{currentScreen=0;render()};
   document.getElementById("restart").onclick=restart;
   return
  }
  if(s.type==="known"){
   const selected=new Set(Array.isArray(answers.known)?answers.known:[]);
   const ch=s.choices.map(c=>`<button class="choice known-choice ${selected.has(c.value)?"selected":""}" data-value="${c.value}" aria-pressed="${selected.has(c.value)}"><span class="choice-main">${c.label}</span></button>`).join("");
   sheet.innerHTML=`<button class="card-skip" id="skipKnown">あとで</button><p class="tiny">${s.eyebrow}</p><h1>${s.title}</h1>${s.text?`<p class="lead">${s.text}</p>`:""}<div class="choices compact-four known-choices">${ch}</div><label class="known-note-label" for="knownNote">まとめて書いてもOK</label><textarea class="known-note" id="knownNote" rows="3" placeholder="例：11/19は大阪。翌日は紀伊勝浦、最後は白浜。ホテルはまだ。">${esc(answers.knownNote||"")}</textarea><button class="start-button" id="knownContinue">この内容で進む</button><div class="secondary-row"><button class="back" id="back">← ひとつ戻る</button><button class="restart" id="restart">最初からやり直す</button></div>`;
   document.querySelectorAll(".known-choice").forEach(b=>b.onclick=()=>{b.classList.toggle("selected");b.setAttribute("aria-pressed",String(b.classList.contains("selected")));answers.known=[...document.querySelectorAll(".known-choice.selected")].map(x=>x.dataset.value);persistWelcomeDraft()});
   document.getElementById("knownNote").oninput=e=>{answers.knownNote=e.target.value;persistWelcomeDraft()};
   document.getElementById("knownContinue").onclick=next;document.getElementById("skipKnown").onclick=next;document.getElementById("back").onclick=back;document.getElementById("restart").onclick=restart;return
  }
  if(s.type==="final"){const isMidAfter=["traveling","memory"].includes(answers.stage);showHero(isMidAfter?"":(partyCopy(answers.party)||stageCopy(answers.stage)||"旅は、ここから始まる。"));const finalMessage=answers.stage==="traveling"?"今の旅を、ここから。":answers.stage==="memory"?"旅の記録を、ここから。":"この旅を、はじめよう。";sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><p class="final-message">${finalMessage}</p><p class="final-sub">選んだ内容は、あとからいつでも変えられます。</p><button class="start-button" id="save">この旅の方針で進む</button><div class="secondary-row"><button class="back" id="back">← ひとつ戻る</button><button class="restart" id="restart">最初からやり直す</button></div><p class="footer-message">Thank you for traveling with us.</p>`;document.getElementById("save").onclick=()=>{save();renderHome()};document.getElementById("back").onclick=back;document.getElementById("restart").onclick=restart;return}
  const ch=s.choices.map(c=>`<button class="choice" data-value="${c.value}"><span class="choice-main">${c.label}</span>${c.sub?`<span class="choice-sub">${c.sub}</span>`:""}</button>`).join("");
  sheet.innerHTML=`<button class="card-skip" id="skip">スキップ</button>${progress()}<p class="tiny">${s.eyebrow}</p><h1 class="${s.key==="stage"?"stage-question-title":""}">${s.title}</h1><p class="lead">${s.text}</p><div class="choices ${s.compact?"compact-four":""}">${ch}</div><div class="secondary-row"><button class="back" id="back">← ひとつ戻る</button><button class="restart" id="restart">最初からやり直す</button></div>`;
  document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{showHero("");answers[s.key]=b.dataset.value;persistWelcomeDraft();setTimeout(()=>{if(s.key==="stage"){const v=b.dataset.value;if(["planning","partial","mostly"].includes(v)){next()}else{currentScreen=screens.findIndex(x=>x.type==="final");render()}}else next()},170)});
  document.getElementById("skip").onclick=()=>{currentScreen=screens.length-1;render()};document.getElementById("back").onclick=back;document.getElementById("restart").onclick=restart;
 })
}
function renderHome(){
 saveUiState("home");
 app.classList.add("home-mode");showHero("");stage.className="home-stage";
 const box=loadJourneyBox();
 const profile=box.welcome||answers;
 const trip=box.trip||{};
 const savedCount=listSavedJourneys().length;
 const showHomeIntro=!localStorage.getItem(HOME_INTRO_KEY);
 const cards=[
  ["ROUTE","交通","移動手段を比べる・確認する"],
  ["STAY","ホテル・予約","候補と予約済みをまとめる"],
  ["PLAN","旅程","4日間の流れを見る"],
  ["PACK","持ちもの","旅の準備を静かに確認"],
  ["MEMO","Memo","気になったことを残す"],
  ["LOG","旅ログ","旅の途中と、そのあとを残す"]
 ];
 sheet.className="";
 sheet.innerHTML=`<section class="home">
   <div class="home-hero"><div class="home-hero-inner">
    <p class="home-kicker">PROJECT LADY / JOURNEY</p>
    <h1 class="home-title">${esc(trip.title||"今回の旅")}</h1>
    <p class="home-date">${esc(formatTripDates(trip.startDate,trip.endDate))} ・ ${esc(trip.destination||"旅先未登録")}</p>
    <button class="home-edit" id="editJourney" type="button">旅の情報を編集</button>
    <span class="home-status">${esc(homeStatus(profile.stage))}</span>
   </div></div>
   <div class="home-body">
    ${showHomeIntro?`<aside class="home-intro-guide" id="homeIntroGuide"><div><strong>ここが、この旅のHomeです。</strong><span>交通・ホテル・旅程・持ちものなど、旅の情報はここから開けます。</span></div><button id="closeHomeIntro" type="button" aria-label="案内を閉じる">×</button></aside>`:""}
    <p class="home-intro">${partyCopy(profile.party)||"旅の続きを、ここから。"}</p>
    ${profile.stage==="planning"?`<button class="home-start-card" id="homeStartJourney" type="button"><small>START</small><strong>何から考える？</strong><span>気分・体験・予算・日数から、今の旅を少しずつ。</span></button>`:""}
    <div class="home-grid">${cards.map(c=>`<button class="home-card" data-page="${c[1]}"><small>${c[0]}</small><strong>${c[1]}</strong><span>${c[2]}</span></button>`).join("")}</div>
    <div class="journey-actions">
      <p class="journey-actions-label">旅の管理</p>
      <button class="journey-review-link" id="reviewJourney" type="button"><span>旅のはじまりを見直す</span><small>人数・旅の気分・今の状況を変更する</small><b>→</b></button>
      <button class="journey-review-link" id="savedJourneys" type="button"><span>保存した旅をひらく${savedCount?`　${savedCount}件`:""}</span><small>候補や延期した旅も、ここから再開できます。</small><b>→</b></button>
      <button class="journey-review-link" id="saveOfflineItineraryHome" type="button"><span>オフラインしおりを保存</span><small>いまの旅を通信なしで見られるHTMLに保存</small><b>→</b></button>
      <button class="journey-review-link journey-reset-link" id="restartJourney" type="button"><span>最初からやり直す</span><small>今の旅を保存して、新しい旅を始めることもできます</small><b>→</b></button>
    </div>
    <p class="home-note"><span class="home-note-en">This app is also on a journey.</span><span class="home-note-ja">このアプリも旅の途中です。</span></p>
   </div>
 </section>`;
 document.getElementById("reviewJourney").onclick=()=>{currentScreen=0;render()};
 document.getElementById("editJourney").onclick=showJourneyEditPrompt;
 document.getElementById("savedJourneys").onclick=renderSavedJourneys;
 document.getElementById("saveOfflineItineraryHome").onclick=downloadOfflineItinerary;
 document.getElementById("restartJourney").onclick=showJourneyRestartPrompt;
 const homeStartJourney=document.getElementById("homeStartJourney");
 const closeHomeIntro=document.getElementById("closeHomeIntro");
 if(closeHomeIntro)closeHomeIntro.onclick=()=>{localStorage.setItem(HOME_INTRO_KEY,"1");document.getElementById("homeIntroGuide")?.remove();};
 if(homeStartJourney) homeStartJourney.onclick=renderDestinationStart;
 document.querySelectorAll(".home-card").forEach(b=>b.onclick=()=>{
   if(b.dataset.page==="交通") renderTransport();
   else if(b.dataset.page==="ホテル・予約") renderStay();
   else if(b.dataset.page==="旅程") renderItinerary();
   else renderPlaceholder(b.dataset.page);
 });
}

const TRANSPORT_LINKS={
 yahoo:{label:"Yahoo!乗換案内",url:"https://transit.yahoo.co.jp/"},
 maps:{label:"Google Maps",url:"https://www.google.com/maps"},
 skyscanner:{label:"Skyscanner",url:"https://www.skyscanner.jp/"},
 flights:{label:"Google Flights",url:"https://www.google.com/travel/flights?gl=JP&hl=ja"},
 smartex:{label:"SmartEX",url:"https://smart-ex.jp/"},
 e5489:{label:"e5489",url:"https://www.jr-odekake.net/goyoyaku/e5489/"},
 ekinet:{label:"えきねっと",url:"https://www.eki-net.com/"},
 jal:{label:"JAL",url:"https://www.jal.co.jp/jp/ja/"},
 nukui:{label:"ぬくいレンタカー",url:"https://www.nukui-ltd.com/rentacar_katsuura.html"},
 ana:{label:"ANA",url:"https://www.ana.co.jp/"}
};
function loadTransport(){const box=loadJourneyBox();return Array.isArray(box.transport)?box.transport:[];}
function saveTransport(data){replaceJourneyTransport(data);}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
/* Keep imported or legacy values visible when a dropdown has fewer options than
   the saved journey. Never silently change a confirmed value by editing another field. */
function selectOptions(options,selected){
 const choice=String(selected??"");
 const items=choice&&!options.includes(choice)?[choice,...options]:options;
 return items.map(value=>`<option value="${esc(value)}" ${value===choice?"selected":""}>${esc(value)}</option>`).join("");
}
function formatTripDates(start,end){
 if(!start&&!end)return "日程未登録";
 const f=v=>{if(!v)return "";const d=new Date(v+"T00:00:00");return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`};
 return start===end?f(start):`${f(start)} — ${f(end)}`;
}
function homeStatus(stageValue){
 return ({planning:"Planning",partial:"Planning",mostly:"Almost ready",none:"Planning",traveling:"Traveling",memory:"Memory"})[stageValue]||"Planning";
}
function linkButton(key,small=false){const x=TRANSPORT_LINKS[key];return `<a class="${small?"search-chip":"search-tool"}" href="${x.url}" target="_blank" rel="noopener">${x.label}</a>`;}
function routeTools(id){if(id==="leg1")return ["yahoo","maps","skyscanner","flights","jal"];if(id==="leg2")return ["yahoo","maps","e5489"];if(id==="leg3")return ["maps","nukui"];if(id==="leg4"||id==="leg5")return ["yahoo","maps","e5489"];if(id==="leg6")return ["maps","ana"];return ["yahoo","maps"];}
function renderTransport(){
 saveUiState("transport");
 const profile=load()||answers;
 app.classList.add("home-mode");showHero("");stage.className="home-stage";sheet.className="";const data=loadTransport();
 sheet.innerHTML=`<section class="transport-page"><header class="inside-header"><button class="inside-back" id="transportHome">← 旅のHomeへ</button><div><p class="inside-kicker">PROJECT LADY / ROUTE</p><h1>交通</h1></div></header><div class="transport-wrap">
 <section class="transport-intro"><p class="transport-lead">まず、どう行くかを見る。</p><p class="transport-note">経路を見て、候補を比べて、最後に公式条件を確認する。予約先のURLを手入力する必要はありません。</p></section>
 <section class="search-hub"><div class="search-hub-head"><div><p class="search-hub-kicker">SEARCH</p><h2>交通を探す</h2></div></div><div class="search-tools">${["yahoo","maps","skyscanner","flights","smartex","e5489","ekinet"].map(k=>linkButton(k)).join("")}</div><p class="search-hub-note">経路全体は乗換案内・Maps。飛行機はSkyscanner＋Google Flights。鉄道は経路が見えたら区間に合うJR公式へ。</p></section>
 <div class="transport-list">${data.map(x=>`<article class="route-card" data-id="${esc(x.id)}"><div class="route-top"><span class="route-no">${esc(x.label)}</span><div class="route-top-actions"><input class="route-date" data-field="date" value="${esc(x.date)}" aria-label="日付"><button type="button" class="route-delete" data-id="${esc(x.id)}" aria-label="区間 ${esc(x.label)} を削除">削除</button></div></div><div class="route-line"><input class="route-place route-from" data-field="from" value="${esc(x.from)}" aria-label="出発地"><span class="route-arrow">→</span><input class="route-place route-to" data-field="to" value="${esc(x.to)}" aria-label="到着地"></div><div class="route-search"><span>この区間を探す</span><div class="route-search-links">${routeTools(x.id).map(k=>linkButton(k,true)).join("")}</div></div><div class="route-grid"><label>移動手段<select data-field="mode">${selectOptions(["未定","新幹線","特急・電車","飛行機","車","レンタカー","バス","その他"],x.mode)}</select></label><label>時間<input data-field="time" value="${esc(x.time)}" placeholder="例 09:10 → 11:20"></label><label>料金<input data-field="price" value="${esc(x.price)}" placeholder="例 14,500円"></label><label>状態<select data-field="status">${selectOptions(["検討中","候補","監視中","発売待ち","未予約","予約予定","予約済み"],x.status)}</select></label></div><label class="route-wide">Memo<textarea data-field="memo" rows="3" placeholder="座席、変更条件、乗換など">${esc(x.memo)}</textarea></label></article>`).join("")}</div>
 <button class="add-leg" id="addTransportLeg">＋ 区間を追加</button>
 <button class="compare-guide-toggle" id="compareGuideToggle" type="button" aria-expanded="false">比べ方を見る</button>
 <section class="transport-flow is-collapsed" id="compareGuide"><p class="search-hub-kicker">HOW TO CHOOSE</p><h2>比べる順番</h2><ol><li><span>1</span><div><strong>経路候補を見る</strong><small>乗換案内・Google Maps</small></div></li><li><span>2</span><div><strong>交通手段ごとの候補を見る</strong><small>飛行機・鉄道など</small></div></li><li><span>3</span><div><strong>実質総額を比べる</strong><small>運賃だけでなく時間・アクセス・変更条件も</small></div></li><li><span>4</span><div><strong>候補を残す</strong><small>最安・楽・時間優先など理由もMemoへ</small></div></li><li><span>5</span><div><strong>公式条件を確認して予約</strong><small>取消・変更・支払条件を最後に確認</small></div></li></ol></section>
 <p class="inside-footer"><span>This app is also on a journey.</span><small>このアプリも旅の途中です。</small></p></div></section>`;
 document.getElementById("transportHome").onclick=renderHome;
 const guide=document.getElementById("compareGuide"),guideToggle=document.getElementById("compareGuideToggle");
 guideToggle.onclick=()=>{const open=guide.classList.toggle("is-open");guide.classList.toggle("is-collapsed",!open);guideToggle.setAttribute("aria-expanded",String(open));guideToggle.textContent=open?"比べ方を閉じる":"比べ方を見る";};
 function collect(){const cards=[...document.querySelectorAll(".route-card")];const fresh=cards.map((card,i)=>{const obj={id:card.dataset.id||`leg${Date.now()}_${i}`,label:String(i+1).padStart(2,"0")};card.querySelectorAll("[data-field]").forEach(el=>obj[el.dataset.field]=el.value);return obj;});saveTransport(fresh);return fresh;}
 document.querySelectorAll(".route-card [data-field]").forEach(el=>{el.addEventListener("input",collect);el.addEventListener("change",collect);});
 document.querySelectorAll(".route-delete").forEach(button=>button.onclick=()=>{
   // Capture unsaved edits in other cards before opening the confirmation.
   const current=collect();
   const id=button.dataset.id;
   const matches=current.filter(item=>String(item.id)===id);
   if(matches.length!==1){alert("削除対象を特定できません。操作を中止しました。");return;}
   const item=matches[0];
   const route=[item.from,item.to].map(value=>String(value||"").trim()).filter(Boolean).join(" → ")||"未入力の区間";
   showDeleteTransportPrompt(item.label,route,()=>{
     // The data-layer helper refuses a missing or duplicate ID.
     if(!removeJourneyTransportLeg(id)){
       alert("削除対象が変更されたため、中止しました。");
       return false;
     }
     renderTransport();
     return true;
   });
 });
 document.getElementById("addTransportLeg").onclick=()=>{const fresh=collect();fresh.push({id:`leg${Date.now()}`,label:String(fresh.length+1).padStart(2,"0"),date:"",from:"",to:"",mode:"未定",time:"",price:"",status:"検討中",memo:""});saveTransport(fresh);renderTransport();};
}


function loadStays(){const box=loadJourneyBox();return Array.isArray(box.stays)?box.stays:[];}
function saveStays(data){replaceJourneyStays(data);}
function renderStay(){
 saveUiState("stay");
 app.classList.add("home-mode");showHero("");stage.className="home-stage";sheet.className="";
 const data=loadStays();
 const statuses=["検討中","候補","第一希望・確認待ち","保留","未予約","予約予定","予約済み","宿泊確定","保険予約","延泊保険","取消済み"];
 sheet.innerHTML=`<section class="transport-page"><header class="inside-header"><button class="inside-back" id="stayHome">← 旅のHomeへ</button><div><p class="inside-kicker">PROJECT LADY / STAY</p><h1>ホテル・予約</h1></div></header><div class="transport-wrap">
 <section class="transport-intro"><p class="transport-lead">泊まる場所を、ひとつにまとめる。</p><p class="transport-note">予約済みも、保険で押さえた宿も、まだ決めない夜も。同じ旅のデータとして残します。</p></section>
 <div class="transport-list">${data.map(x=>`<article class="route-card stay-card ${x.status==="保険予約"||x.status==="延泊保険"?"is-backup":""}" data-id="${esc(x.id)}"><div class="route-top"><span class="route-no">${esc(x.label)}</span><span class="stay-status-chip">${esc(x.status)}</span><input class="route-date" data-field="date" value="${esc(x.date)}" aria-label="宿泊日"></div><label class="route-wide">宿・滞在先<input data-field="name" value="${esc(x.name)}" placeholder="ホテル名・滞在先"></label><label class="route-wide">エリア<input data-field="area" value="${esc(x.area)}" placeholder="大阪・白浜など"></label><div class="route-grid"><label>状態<select data-field="status">${selectOptions(statuses,x.status)}</select></label><label>料金<input data-field="price" value="${esc(x.price)}" placeholder="未入力"></label></div><label class="route-wide">Memo<textarea data-field="memo" rows="3" placeholder="予約先、取消期限、部屋条件など">${esc(x.memo)}</textarea></label></article>`).join("")}</div>
 <button class="add-leg" id="addStay">＋ 宿泊先を追加</button>
 <p class="inside-footer"><span>This app is also on a journey.</span><small>このアプリも旅の途中です。</small></p></div></section>`;
 document.getElementById("stayHome").onclick=renderHome;
 function collect(){const cards=[...document.querySelectorAll(".stay-card")];const fresh=cards.map((card,i)=>{const obj={id:card.dataset.id||`stay${Date.now()}_${i}`,label:String(i+1).padStart(2,"0")};card.querySelectorAll("[data-field]").forEach(el=>obj[el.dataset.field]=el.value);return obj;});saveStays(fresh);return fresh;}
 document.querySelectorAll(".stay-card [data-field]").forEach(el=>{el.addEventListener("input",collect);el.addEventListener("change",collect);});
 document.getElementById("addStay").onclick=()=>{const fresh=collect();fresh.push({id:`stay${Date.now()}`,label:String(fresh.length+1).padStart(2,"0"),date:"",name:"",area:"",status:"検討中",price:"",memo:""});saveStays(fresh);renderStay();};
}


/* v0.5.10: read-only day-by-day itinerary. It lives in the existing journey
   registry; no hardcoded trip data is ever shipped in the public app code. */
const ITINERARY_STATUS_LABELS={
 fixed:"確定枠",planned:"計画",flexible:"時間可変",conditional:"条件付き",
 optional:"時間次第",buffer:"予備時間",hard_cutoff:"締切",reserved:"予約済み・要照合",
 priority:"優先",decision:"決定方針",pending:"未確定",verify:"要確認"
};
const ITINERARY_STATUS_ALERTS=new Set(["hard_cutoff","pending","verify"]);
function itineraryDateLabel(day){
 const d=new Date(day+"T00:00:00+09:00");
 if(!Number.isFinite(d.getTime()))return day;
 return `${d.getMonth()+1}/${d.getDate()}（${d.toLocaleDateString("ja-JP",{weekday:"short",timeZone:"Asia/Tokyo"})}）`;
}
function itineraryStatus(key){return ITINERARY_STATUS_LABELS[key]||"予定";}
function renderItinerary(selectedDate){
 const box=loadJourneyBox();
 const items=(Array.isArray(box.itinerary)?box.itinerary:[]).filter(x=>x&&typeof x.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x.date));
 const dates=[...new Set(items.map(x=>x.date))].sort();
 const localToday=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"});
 const activeDate=dates.includes(selectedDate)?selectedDate:(dates.includes(localToday)?localToday:dates[0]);
 saveUiState("itinerary",{date:activeDate||""});
 app.classList.add("home-mode");showHero("");stage.className="home-stage";sheet.className="";
 const dayItems=items.filter(x=>x.date===activeDate);
 const dayTitle=activeDate?itineraryDateLabel(activeDate):"旅程未登録";
 const allChecks=box.itineraryChecks||{};
 const extraChecks=activeDate&&Array.isArray(allChecks[activeDate])?allChecks[activeDate]:[];
 const generalChecks=Array.isArray(allChecks.general)?allChecks.general:[];
 sheet.innerHTML=`<section class="transport-page itinerary-page">
 <header class="inside-header"><button class="inside-back" id="itineraryHome" type="button">← 旅のHomeへ</button><div><p class="inside-kicker">PROJECT LADY / PLAN</p><h1>旅程</h1></div></header>
 <div class="transport-wrap">
 <section class="transport-intro"><p class="transport-lead">今日の予定を、ひと目で。</p><p class="transport-note itinerary-disclaimer">保存した旅程を表示しています。時刻・予約の最終確認は、各予定のメモと原票で行ってください。</p></section>
 ${dates.length?`<nav class="itinerary-days" aria-label="日付を選択">${dates.map((date,i)=>`<button type="button" class="itinerary-day ${date===activeDate?"is-active":""}" data-date="${esc(date)}" aria-pressed="${date===activeDate}"><small>DAY ${String(i+1).padStart(2,"0")}</small><strong>${esc(itineraryDateLabel(date))}</strong></button>`).join("")}</nav>`:""}
 <div class="itinerary-heading"><h2>${esc(dayTitle)}</h2><span>${dayItems.length} 件</span></div>
 ${dayItems.length?`<ol class="itinerary-list">${dayItems.map(event=>{
   const key=typeof event.status==="string"?event.status:"planned";
   const tone=ITINERARY_STATUS_ALERTS.has(key)?"is-alert":(["fixed","reserved"].includes(key)?"is-firm":"");
   return `<li class="itinerary-entry"><div class="itinerary-time">${event.time?esc(event.time):"時刻未確定"}</div><article class="itinerary-event"><div class="itinerary-event-head"><span class="itinerary-tag ${tone}">${esc(itineraryStatus(key))}</span></div><h3>${esc(event.activity||"内容未入力")}</h3>${event.note?`<p>${esc(event.note)}</p>`:""}</article></li>`;
 }).join("")}</ol>`:`<div class="saved-empty"><p>この旅の旅程は、まだ登録されていません。</p></div>`}
 ${(extraChecks.length||generalChecks.length)?`<details class="itinerary-checks"><summary>確認が必要なこと（${extraChecks.length+generalChecks.length}件）</summary><ul>${[...extraChecks,...generalChecks].map(x=>`<li>${esc(x)}</li>`).join("")}</ul></details>`:""}
 <p class="inside-footer"><span>This app is also on a journey.</span><small>このアプリも旅の途中です。</small></p>
 </div></section>`;
 document.getElementById("itineraryHome").onclick=renderHome;
 document.querySelectorAll(".itinerary-day[data-date]").forEach(button=>{
   button.onclick=()=>{if(button.dataset.date!==activeDate){renderItinerary(button.dataset.date);window.scrollTo(0,0);}};
 });
}

function renderDestinationStart(){
 saveUiState("destination");
 app.classList.add("home-mode");showHero("");stage.className="home-stage";sheet.className="";
 const ways=[
  ["TOGETHER","一緒に考える","気になることから、少しずつ。"],
  ["EXPERIENCE","体験から決める","食べたい、見たい、やってみたいから。"],
  ["BUDGET","予算から決める","無理のない範囲から、行ける場所を。"],
  ["DAYS","日数から決める","使える時間に合う旅を。"]
 ];
 sheet.innerHTML=`<section class="transport-page"><header class="inside-header"><button class="inside-back" id="destinationHome">← 旅のHomeへ</button><div><p class="inside-kicker">PROJECT LADY / JOURNEY</p><h1>旅のことを考える</h1></div></header><div class="transport-wrap">
 <section class="destination-intro"><p class="transport-lead">まだ決まっていなくて、大丈夫。</p><p class="transport-note">何から考える？</p></section>
 <div class="destination-ways">${ways.map(w=>`<button class="destination-way" type="button"><small>${w[0]}</small><strong>${w[1]}</strong><span>${w[2]}</span></button>`).join("")}</div>
 <p class="destination-later">気になることが見えてきたら、必要なものを少しずつ使えます。</p>
 <p class="inside-footer"><span>This app is also on a journey.</span><small>このアプリも旅の途中です。</small></p></div></section>`;
 document.getElementById("destinationHome").onclick=renderHome;
}

function renderPlaceholder(name){
 saveUiState("placeholder",{name});
 stage.className="home-stage";sheet.className="";
 sheet.innerHTML=`<section class="home"><div class="placeholder"><p class="home-kicker">PROJECT LADY</p><h2>${name}</h2><p>ここは次の開発で、11月の旅の実データを入れながら育てます。</p><button class="text-link" id="homeBack">← 旅のHomeへ</button></div></section>`;
 document.getElementById("homeBack").onclick=renderHome;
}

function resetWelcomeAnswers(){
 Object.keys(answers).forEach(k=>answers[k]=null);answers.known=[];answers.knownNote="";
}
function journeyDisplayName(j){
 const t=j?.trip||{};
 if(t.title && t.title!=="今回の旅") return t.title;
 if(t.destination) return `${t.destination}の旅`;
 return "今回の旅";
}
function showJourneyEditPrompt(){
 const trip=loadJourneyBox().trip||{};
 const overlay=document.createElement("div");overlay.className="journey-modal";
 overlay.innerHTML=`<form class="journey-modal-card journey-edit-card" id="journeyEditForm"><p class="inside-kicker">JOURNEY DETAILS</p><h2>旅の情報を編集</h2><div class="journey-edit-fields"><label>旅のタイトル<input name="title" value="${esc(trip.title||"")}" placeholder="例：春の3泊4日の旅"></label><div><label>出発日<input name="startDate" type="date" value="${esc(trip.startDate||"")}"></label><label>帰着日<input name="endDate" type="date" value="${esc(trip.endDate||"")}"></label></div><label>行き先<input name="destination" value="${esc(trip.destination||"")}" placeholder="例：大阪・紀南"></label></div><div class="journey-modal-actions"><button class="start-button" type="submit">保存する</button><button class="modal-cancel" id="journeyEditCancel" type="button">やめる</button></div></form>`;
 document.body.appendChild(overlay);
 overlay.querySelector("#journeyEditCancel").onclick=()=>overlay.remove();
 overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
 overlay.querySelector("#journeyEditForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);const startDate=String(f.get("startDate")||"");const endDate=String(f.get("endDate")||"");if(startDate&&endDate&&endDate<startDate){alert("帰着日は、出発日以降の日付を選んでください。");return;}patchJourneyTrip({title:String(f.get("title")||"").trim()||"今回の旅",startDate,endDate,destination:String(f.get("destination")||"").trim()});overlay.remove();renderHome();};
}
function showJourneyRestartPrompt(){
 const current=loadJourneyBox();
 const hasData=journeyHasMeaningfulData(current);
 if(!hasData){startNewBlankJourney({saveCurrent:false});localStorage.removeItem(LEGACY_PROFILE_KEY);localStorage.removeItem(UI_STATE_KEY);resetWelcomeAnswers();currentScreen=0;showHero("");render();return;}
 const overlay=document.createElement("div");overlay.className="journey-modal";
 overlay.innerHTML=`<div class="journey-modal-card" role="dialog" aria-modal="true" aria-labelledby="restartTitle"><p class="inside-kicker">START OVER</p><h2 id="restartTitle">最初からやり直しますか？</h2><p>今まで入力した旅は、保存しておけばあとから続きから使えます。</p><div class="journey-modal-actions"><button class="start-button" id="restartSave">保存して最初に戻る</button><button class="modal-secondary" id="restartDelete">保存せず最初に戻る</button><button class="modal-cancel" id="restartCancel">やめる</button></div></div>`;
 document.body.appendChild(overlay);
 const finish=(saveCurrent)=>{startNewBlankJourney({saveCurrent});localStorage.removeItem(LEGACY_PROFILE_KEY);localStorage.removeItem(UI_STATE_KEY);resetWelcomeAnswers();currentScreen=0;overlay.remove();showHero("");render();};
 overlay.querySelector("#restartSave").onclick=()=>finish(true);
 overlay.querySelector("#restartDelete").onclick=()=>finish(false);
 overlay.querySelector("#restartCancel").onclick=()=>overlay.remove();
 overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
}
function renderSavedJourneys({backToWelcome=false}={}){
 saveUiState("savedJourneys",{backToWelcome});app.classList.add("home-mode");showHero("");stage.className="home-stage";sheet.className="";
 const current=loadJourneyBox();
 const saved=listSavedJourneys();
 sheet.innerHTML=`<section class="transport-page"><header class="inside-header"><button class="inside-back" id="savedHome">${backToWelcome?"← 最初の画面へ":"← 旅のHomeへ"}</button><div><p class="inside-kicker">PROJECT LADY / JOURNEYS</p><h1>旅の管理</h1></div></header><div class="transport-wrap"><section class="transport-intro"><p class="transport-lead">使っている旅と、保存している旅。</p><p class="transport-note">候補や延期した旅も、ここから再開できます。</p></section><section class="journey-group"><p class="journey-group-label">CURRENT JOURNEY｜現在の旅</p><article class="saved-journey-card current-journey-card"><div><p class="inside-kicker">CURRENT JOURNEY</p><h2>${esc(journeyDisplayName(current))}</h2><p>${esc(formatTripDates(current.trip?.startDate,current.trip?.endDate))}${current.trip?.destination?` ・ ${esc(current.trip.destination)}`:""}</p></div><button class="resume-journey current-home" id="currentJourneyHome">現在の旅に戻る</button></article></section><section class="journey-group"><p class="journey-group-label">SAVED JOURNEYS｜保存している旅　${saved.length}件</p>${saved.length?`<div class="saved-journey-list">${saved.map(j=>`<article class="saved-journey-card"><div><p class="inside-kicker">SAVED JOURNEY</p><h2>${esc(journeyDisplayName(j))}</h2><p>${esc(formatTripDates(j.trip?.startDate,j.trip?.endDate))}${j.trip?.destination?` ・ ${esc(j.trip.destination)}`:""}</p></div><div class="saved-journey-actions"><button class="resume-journey" data-id="${esc(j.trip?.id)}">この旅を再開</button><button class="delete-journey" data-id="${esc(j.trip?.id)}" data-name="${esc(journeyDisplayName(j))}">削除</button></div></article>`).join("")}</div>`:`<div class="saved-empty"><p>保存している旅は、まだありません。</p></div>`}</section><section class="journey-backup"><p class="journey-group-label">BACKUP｜旅データの保険</p><p>こちらはデータ復元用のJSONです。読み込み時も、いま使っている旅は消しません。</p><div class="journey-backup-actions"><button class="modal-secondary" id="exportJourneyBackup" type="button">旅データを書き出す（JSON）</button><button class="modal-secondary" id="importJourneyBackup" type="button">旅データを読み込む（JSON）</button><input id="journeyBackupFile" type="file" accept="application/json,.json" hidden></div></section><section class="journey-backup journey-offline"><p class="journey-group-label">OFFLINE｜閲覧用しおり</p><p>いま開いている旅を、通信なしで読めるHTMLに保存します。保存後の変更は自動反映されません。</p><div class="journey-backup-actions"><button class="modal-secondary" id="saveOfflineItinerary" type="button">オフラインしおりを保存（HTML）</button></div></section><p class="inside-footer"><span>This app is also on a journey.</span><small>このアプリも旅の途中です。</small></p></div></section>`;
 document.getElementById("savedHome").onclick=()=>{if(backToWelcome){currentScreen=0;render();}else renderHome();};
 document.getElementById("currentJourneyHome").onclick=()=>{const profile=current.welcome;if(profile){resetWelcomeAnswers();Object.assign(answers,profile);renderHome();}else{currentScreen=0;render();}};
 document.querySelectorAll(".resume-journey[data-id]").forEach(b=>b.onclick=()=>{const j=resumeSavedJourney(b.dataset.id);if(!j)return;localStorage.removeItem(UI_STATE_KEY);resetWelcomeAnswers();if(j.welcome)Object.assign(answers,j.welcome);renderHome();});
 document.querySelectorAll(".delete-journey").forEach(b=>b.onclick=()=>showDeleteSavedJourneyPrompt(b.dataset.id,b.dataset.name,()=>renderSavedJourneys({backToWelcome})));
 document.getElementById("exportJourneyBackup").onclick=()=>downloadJourneyBackup();
 document.getElementById("saveOfflineItinerary").onclick=downloadOfflineItinerary;
 const backupInput=document.getElementById("journeyBackupFile");
 document.getElementById("importJourneyBackup").onclick=()=>backupInput.click();
 backupInput.onchange=()=>{const file=backupInput.files?.[0];if(file)readJourneyBackupFile(file,()=>renderSavedJourneys({backToWelcome}));backupInput.value="";};
}


/* v0.5.10.4: an independent, read-only HTML snapshot for offline travel.
   No localStorage, network calls, app JS, or external CSS/fonts are needed to read it.
   Do not package private trip data into the public GitHub release. */
function offlineText(value){return esc(value);}
function offlineDate(value){
 if(typeof value!=="string")return String(value??"");
 if(/^\d{4}-\d{2}-\d{2}$/.test(value))return itineraryDateLabel(value);
 return value;
}
function offlineListText(value){
 if(typeof value==="string"||typeof value==="number")return String(value);
 if(!value||typeof value!=="object")return "";
 const title=[value.name,value.item,value.title,value.label,value.activity].find(v=>typeof v==="string"&&v.trim())||"";
 const detail=[value.text,value.note,value.content,value.memo].find(v=>typeof v==="string"&&v.trim())||"";
 return [title,detail].filter(Boolean).join(" — ");
}
function buildOfflineItineraryHtml(journey,exportedAt=new Date()){
 const box=journey||{};
 const trip=box.trip||{};
 const title=journeyDisplayName(box);
 const events=(Array.isArray(box.itinerary)?box.itinerary:[]).filter(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||""));
 const days=[...new Set(events.map(x=>x.date))].sort();
 const routes=Array.isArray(box.transport)?box.transport:[];
 const stays=Array.isArray(box.stays)?box.stays:[];
 const checks=box.itineraryChecks&&typeof box.itineraryChecks==="object"?box.itineraryChecks:{};
 const extra=(Array.isArray(checks.general)?checks.general:[]);
 const packing=Array.isArray(box.packing)?box.packing:[];
 const memos=Array.isArray(box.memos)?box.memos:[];
 const souvenirs=Array.isArray(box.souvenirs)?box.souvenirs:[];
 const listItems=items=>items.map(item=>`<li>${offlineText(offlineListText(item))}</li>`).join("");
 const dayHtml=days.map((date,index)=>{
   const each=events.filter(e=>e.date===date);
   const dayChecks=Array.isArray(checks[date])?checks[date]:[];
   return `<section class="day"><div class="day-head"><div><small>DAY ${String(index+1).padStart(2,"0")}</small><h2>${offlineText(offlineDate(date))}</h2></div><span>${each.length}件</span></div><ol class="events">${each.map(e=>{
     const status=itineraryStatus(e.status);
     const warning=ITINERARY_STATUS_ALERTS.has(e.status)?" attention":"";
     return `<li class="event"><time>${offlineText(e.time||"時刻未確定")}</time><div class="event-main"><span class="status${warning}">${offlineText(status)}</span><h3>${offlineText(e.activity||"内容未入力")}</h3>${e.note?`<p>${offlineText(e.note)}</p>`:""}</div></li>`;
   }).join("")}</ol>${dayChecks.length?`<details class="checks" open><summary>この日の確認事項（${dayChecks.length}件）</summary><ul>${listItems(dayChecks)}</ul></details>`:""}</section>`;
 }).join("");
 const routeHtml=routes.map((route,i)=>`<article class="info-card"><div class="info-head"><b>${String(i+1).padStart(2,"0")}</b><span>${offlineText(route.date||"日付未登録")}　${offlineText(route.status||"未確認")}</span></div><h3>${offlineText(route.from||"出発地未入力")} → ${offlineText(route.to||"到着地未入力")}</h3><p>${[route.mode,route.time,route.price].filter(Boolean).map(offlineText).join(" ・ ")||"詳細未登録"}</p>${route.memo?`<p class="note">${offlineText(route.memo)}</p>`:""}</article>`).join("");
 const stayHtml=stays.map((stay,i)=>`<article class="info-card"><div class="info-head"><b>${String(i+1).padStart(2,"0")}</b><span>${offlineText(stay.date||"日付未登録")}　${offlineText(stay.status||"未確認")}</span></div><h3>${offlineText(stay.name||"宿泊先未入力")}</h3><p>${[stay.area,stay.price].filter(Boolean).map(offlineText).join(" ・ ")}</p>${stay.memo?`<p class="note">${offlineText(stay.memo)}</p>`:""}</article>`).join("");
 const section=(label,heading,html)=>`<section class="section"><header class="section-head"><small>${label}</small><h2>${heading}</h2></header>${html}</section>`;
 const extraHtml=extra.length?section("CHECKLIST","旅全体の確認事項",`<ul class="plain-list">${listItems(extra)}</ul>`):"";
 const packingHtml=packing.length?section("PACK","持ちもの",`<ul class="plain-list">${listItems(packing)}</ul>`):"";
 const memosHtml=memos.length?section("MEMO","旅のメモ",`<ul class="plain-list">${listItems(memos)}</ul>`):"";
 const souvenirHtml=souvenirs.length?section("SOUVENIR","お土産",`<ul class="plain-list">${listItems(souvenirs)}</ul>`):"";
 const stamp=exportedAt.toLocaleString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
 return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${offlineText(title)} | Project Lady オフラインしおり</title>
<style>
:root{color-scheme:light;--ink:#263931;--soft:#67756c;--accent:#2c5648;--border:#e3e7e0;--paper:#fff;--bg:#f6f7f4}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;line-height:1.65;font-size:14px}main{max-width:820px;margin:auto;background:var(--paper);min-height:100vh;padding-bottom:50px}
.cover{background:var(--ink);color:white;padding:36px clamp(22px,5vw,56px) 30px}.cover small,.section-head small,.day-head small{font-size:11px;letter-spacing:.18em;font-weight:600}.cover h1{font-size:clamp(25px,5vw,34px);line-height:1.35;margin:12px 0}.cover p{margin:7px 0;color:#d9e5de}.cover .stamp{color:#bbd0c4;font-size:11px}
.notice{margin:22px clamp(20px,5vw,50px) 0;border:1px solid #cfdcd1;background:#f5f9f5;border-radius:12px;padding:12px 15px;font-size:12px;color:#4c6257}
.section{margin:34px clamp(20px,5vw,50px) 0}.section-head{border-bottom:1px solid var(--border);margin:0 0 14px;padding:0 0 10px}.section-head small{color:var(--accent)}.section-head h2{font-size:21px;margin:2px 0 0}.day{margin:26px 0 34px;border-radius:18px;overflow:hidden;border:1px solid var(--border)}.day-head{background:#eef2ec;padding:17px 18px;display:flex;justify-content:space-between;gap:12px;align-items:center}.day-head small{color:var(--soft)}.day-head h2{font-size:19px;margin:1px 0}.day-head>span{font-size:12px;color:var(--soft)}
.events{list-style:none;margin:0;padding:0}.event{display:grid;grid-template-columns:75px minmax(0,1fr);gap:14px;padding:15px 17px;border-bottom:1px solid #edf0eb}.event:last-child{border-bottom:0}.event time{font-weight:700;font-size:15px;color:var(--accent);font-variant-numeric:tabular-nums;line-height:1.4}.event h3{font-size:15px;line-height:1.5;margin:5px 0 3px}.event p,.info-card p{white-space:pre-wrap;overflow-wrap:anywhere;margin:4px 0;color:#4f5c53;font-size:12.5px}.status{display:inline-block;border-radius:5px;background:#eef3ef;color:#42604c;padding:2px 8px;font-size:10px}.status.attention{background:#fff0e4;color:#8e5b24}
.info-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(245px,1fr))}.info-card{padding:15px 16px;border:1px solid var(--border);border-radius:13px;min-width:0;break-inside:avoid}.info-head{display:flex;align-items:center;gap:9px;color:var(--soft);font-size:11px}.info-head b{background:var(--ink);color:white;border-radius:5px;padding:1px 6px}.info-card h3{font-size:15px;margin:8px 0 4px;overflow-wrap:anywhere}.info-card p.note{border-top:1px solid var(--border);padding-top:7px;margin-top:8px}.checks{border-top:1px solid var(--border);padding:12px 17px;background:#fafbf8;font-size:12px}.checks summary{font-weight:700;cursor:default}.checks ul,.plain-list{margin:8px 0 0;padding-left:20px;overflow-wrap:anywhere}.checks li,.plain-list li{margin:7px 0;white-space:pre-wrap}
footer{border-top:1px solid var(--border);margin:32px clamp(20px,5vw,50px) 0;padding:19px 0;color:var(--soft);font-size:11px}.empty{color:var(--soft);font-size:13px;padding:12px 0}
@media(max-width:480px){.event{grid-template-columns:62px minmax(0,1fr);gap:9px;padding:14px 12px}.event time{font-size:13px}.day-head{padding:14px}.section{margin-top:28px}}
@media print{body{background:white;font-size:11px}main{max-width:none}.cover{print-color-adjust:exact}.section,.day,.event,.info-card{break-inside:avoid}.day{break-before:auto}footer{margin-top:25px}}
</style></head><body><main>
<header class="cover"><small>PROJECT LADY / OFFLINE JOURNEY</small><h1>${offlineText(title)}</h1><p>${offlineText(formatTripDates(trip.startDate,trip.endDate))}　${offlineText(trip.destination||"")}</p><p class="stamp">保存日時：${offlineText(stamp)} ／ 閲覧用スナップショット</p></header>
<aside class="notice">このHTMLは保存した時点の予定です。アプリの変更は自動反映されません。予約時刻・営業時間・運行状況は最新の公式情報と照合してください。<br>予約メール・QRコード・別ファイルのお土産マスターは自動的には含まれません。</aside>
${section("PLAN","旅程",days.length?dayHtml:'<p class="empty">旅程はまだ登録されていません。</p>')}
${section("ROUTE","交通",routes.length?`<div class="info-grid">${routeHtml}</div>`:'<p class="empty">交通はまだ登録されていません。</p>')}
${section("STAY","ホテル・予約",stays.length?`<div class="info-grid">${stayHtml}</div>`:'<p class="empty">宿泊はまだ登録されていません。</p>')}
${extraHtml}${packingHtml}${memosHtml}${souvenirHtml}
<footer>Project Lady ・ このファイルはオフラインでも閲覧できます。個人の旅程が含まれるため公開しないでください。</footer>
</main></body></html>`;
}
function downloadOfflineItinerary(){
 const box=loadJourneyBox();
 if(!journeyHasMeaningfulData(box)){alert("保存する旅がまだありません。旅の情報を登録してから保存してください。");return;}
 const html=buildOfflineItineraryHtml(box);
 const d=new Date();const stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
 const fileName=`Project_Lady_オフラインしおり_${stamp}.html`;
 const blob=new Blob([html],{type:"text/html;charset=utf-8"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}

function downloadJourneyBackup(){
 const payload=buildJourneyBackup();
 const stamp=new Date().toISOString().slice(0,10).replaceAll("-","");
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`Project_Lady_旅データ_${stamp}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function readJourneyBackupFile(file,onDone){
 const reader=new FileReader();
 reader.onerror=()=>alert("ファイルを読み込めませんでした。");
 reader.onload=()=>{try{const payload=JSON.parse(reader.result);if(!validateJourneyBackup(payload))throw new Error("このファイルはProject Ladyの旅バックアップではありません。");showJourneyImportPrompt(payload,onDone);}catch(e){alert(e.message||"バックアップを確認できませんでした。");}};
 reader.readAsText(file);
}
function showJourneyImportPrompt(payload,onDone){
 const count=1+(payload.registry.savedJourneys?.length||0);const overlay=document.createElement("div");overlay.className="journey-modal";
 overlay.innerHTML=`<div class="journey-modal-card" role="dialog" aria-modal="true"><p class="inside-kicker">RESTORE JOURNEYS</p><h2>旅データを読み込みますか？</h2><p>バックアップ内の旅 ${count}件を確認します。いま使っている旅は残したまま、重複していない旅だけ保存した旅へ追加します。</p><div class="journey-modal-actions"><button class="start-button" id="importJourneyConfirm">読み込む</button><button class="modal-cancel" id="importJourneyCancel">やめる</button></div></div>`;
 document.body.appendChild(overlay);overlay.querySelector("#importJourneyCancel").onclick=()=>overlay.remove();overlay.querySelector("#importJourneyConfirm").onclick=()=>{try{const result=importJourneyBackupSafely(payload);overlay.remove();alert(`読み込み完了！ 保存している旅は ${result.savedCount}件です。`);onDone();}catch(e){alert(e.message||"読み込みを中止しました。");}};overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
}

/* v0.5.10.3: deleting a transport leg requires an explicit confirmation.
   Only the identified leg of the active journey is removed; other journeys survive. */
function showDeleteTransportPrompt(label,route,onConfirm){
 const overlay=document.createElement("div");overlay.className="journey-modal";
 overlay.innerHTML=`<div class="journey-modal-card" role="dialog" aria-modal="true" aria-labelledby="deleteTransportTitle"><p class="inside-kicker">REMOVE ROUTE</p><h2 id="deleteTransportTitle">区間 ${esc(label)} を削除しますか？</h2><p>${esc(route)}</p><p>この区間の情報は消えます。ほかの区間と旅程・宿泊は残ります。</p><div class="journey-modal-actions"><button type="button" class="modal-secondary" id="deleteTransportCancel">削除しない</button><button type="button" class="modal-danger" id="deleteTransportConfirm">この区間を削除</button></div></div>`;
 document.body.appendChild(overlay);
 const cancel=overlay.querySelector("#deleteTransportCancel");
 const close=()=>overlay.remove();
 cancel.onclick=close;
 overlay.querySelector("#deleteTransportConfirm").onclick=()=>{if(onConfirm())close();};
 overlay.onclick=e=>{if(e.target===overlay)close();};
 overlay.onkeydown=e=>{if(e.key==="Escape")close();};
 cancel.focus();
}

function showDeleteSavedJourneyPrompt(id,name,onDone){
 const overlay=document.createElement("div");overlay.className="journey-modal";
 overlay.innerHTML=`<div class="journey-modal-card" role="dialog" aria-modal="true" aria-labelledby="deleteJourneyTitle"><p class="inside-kicker">DELETE JOURNEY</p><h2 id="deleteJourneyTitle">「${esc(name)}」を削除しますか？</h2><p>この操作は元に戻せません。</p><div class="journey-modal-actions"><button class="modal-secondary" id="deleteJourneyCancel">削除しない</button><button class="modal-danger" id="deleteJourneyConfirm">削除する</button></div></div>`;
 document.body.appendChild(overlay);
 overlay.querySelector("#deleteJourneyCancel").onclick=()=>overlay.remove();
 overlay.querySelector("#deleteJourneyConfirm").onclick=()=>{if(deleteSavedJourney(id)!==1){alert("削除対象を確認できなかったため、中止しました。");return;}overlay.remove();onDone();};
 overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
}

function next(){if(currentScreen<screens.length-1){currentScreen++;render()}}
function back(){if(currentScreen>0){currentScreen--;render()}}
function restart(){showJourneyRestartPrompt()}
function restoreLastLocation(){
 const saved=load();
 const ui=loadUiState();
 if(saved) Object.assign(answers,saved);

 // A journey profile is required before restoring inside the app.
 if(!saved){currentScreen=0;render();return;}

 if(ui?.page==="transport"){renderTransport();return;}
 if(ui?.page==="stay"){renderStay();return;}
 if(ui?.page==="itinerary"){renderItinerary(ui.date);return;}
 if(ui?.page==="savedJourneys"){renderSavedJourneys({backToWelcome:!!ui.backToWelcome});return;}
 if(ui?.page==="destination"){renderDestinationStart();return;}
 if(ui?.page==="home"){renderHome();return;}
 if(ui?.page==="placeholder"){renderPlaceholder(ui.name||"今回の旅");return;}
 if(ui?.page==="welcome"){
   const n=Number(ui.screen);
   currentScreen=Number.isInteger(n)&&n>=0&&n<screens.length?n:1;
   render();
   return;
 }
 if(ui?.page==="return"){renderReturn(saved);return;}

 // Old versions may have no usable location record.
 renderReturn(saved);
}
migrateLegacyData();
restoreLastLocation();
