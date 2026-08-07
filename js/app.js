const STORAGE_KEY="projectLadyJourneyProfile_v07";
const answers={party:null,mood:null,stage:null};
const screens=[
{type:"intro",eyebrow:"A journey begins",title:"今回は、どんな旅ですか？",text:"まだ何も決まっていなくても大丈夫。<br>ここから、少しずつ。"},
{key:"party",compact:true,eyebrow:"About this journey",title:"誰と景色を見に行く？",text:"人数がわかると、ホテルや旅の提案も少し変わるよ。",choices:[
{label:"一人旅",sub:"自分のペースで。",value:"solo"},{label:"二人旅",sub:"同じ景色を、隣で。",value:"pair"},{label:"ワイワイ旅",sub:"寄り道も、思い出も。",value:"group"},{label:"まだ決めてない",sub:"決まってなくても大丈夫。",value:"later"}]},
{key:"mood",compact:true,eyebrow:"Mood",title:"どんな時間を過ごしたい？",text:"今回は、なんとなくで大丈夫。",choices:[
{label:"のんびり",sub:"余白も旅のうち。",value:"slow"},{label:"アクティブ",sub:"行きたいところへ。",value:"active"},{label:"どっちも",sub:"気分のままに。",value:"mix"},{label:"まだわからない",sub:"その日の気分で。",value:"later"}]},
{key:"stage",eyebrow:"Right now",title:"旅は、どこまで決まってる？",text:"最初から全部そろってなくて大丈夫。今必要なところから始めよう。",choices:[
{label:"これから考える",sub:"まだ予定はほとんど決まってない",value:"planning"},{label:"一部だけ決まってる",sub:"ホテル1泊だけ、交通だけ…みたいな旅",value:"partial"},{label:"だいたい決まってる",sub:"あとは細かいところを整えたい",value:"mostly"},{label:"今、旅の途中",sub:"今日必要な情報をすぐ見たい",value:"traveling"},{label:"思い出を残したい",sub:"終わった旅をゆっくり振り返りたい",value:"memory"}]},
{type:"final",eyebrow:"Ready"}];
let currentScreen=0;
const app=document.getElementById("app"),sheet=document.getElementById("sheet"),stage=document.getElementById("stage"),heroCopy=document.getElementById("heroCopy");
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch(e){return null}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify({...answers,savedAt:new Date().toISOString()}))}
function clear(){localStorage.removeItem(STORAGE_KEY)}
function partyCopy(p){return({solo:"今日は、自分の歩幅で。",pair:"同じ景色を、隣で。",group:"寄り道も、思い出も、みんなで。",later:"旅は、ここから始まる。"})[p]||""}
function stageCopy(s){return({planning:"旅は、ここから始まる。",partial:"続きは、ゆっくり決めよう。",mostly:"あと少しで、旅になる。",traveling:"今日という旅を、大切に。",memory:"旅が終わっても、残るものを。"})[s]||""}
function showHero(t){heroCopy.textContent=t||"";heroCopy.classList.toggle("show",!!t)}
function swap(fn){stage.classList.remove("active");setTimeout(()=>{fn();requestAnimationFrame(()=>stage.classList.add("active"))},330)}
function progress(){let h='<div class="progress">';for(let i=1;i<=3;i++)h+=`<span class="dot ${currentScreen===i?"active":""}"></span>`;return h+"</div>"}
function renderReturn(profile){app.classList.remove("home-mode");stage.className="stage active";showHero(partyCopy(profile.party));swap(()=>{sheet.className="sheet";sheet.innerHTML=`<p class="tiny">WELCOME BACK</p><p class="final-message">さぁ、どこまで行こうか。</p><p class="final-sub">前に決めた旅の方針は、そのまま残ってるよ。</p><button class="start-button" id="continue">続きから見る</button><div class="secondary-row"><button class="restart" id="reset">旅の方針を決め直す</button></div><p class="footer-message">This app is also on a journey.</p>`;document.getElementById("continue").onclick=renderHome;document.getElementById("reset").onclick=()=>{clear();Object.keys(answers).forEach(k=>answers[k]=null);currentScreen=0;showHero("");render()}})}
function render(){
 app.classList.remove("home-mode");stage.className="stage active";const s=screens[currentScreen];showHero("");
 swap(()=>{
  if(s.type!=="final")showHero("");
  sheet.className="sheet";
  if(s.type==="intro"){sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><h1>${s.title}</h1><p class="lead">${s.text}</p><button class="start-button" id="start">旅をはじめる</button><p class="footer-message">This app is also on a journey.</p>`;document.getElementById("start").onclick=next;return}
  if(s.type==="final"){showHero(partyCopy(answers.party)||stageCopy(answers.stage)||"旅は、ここから始まる。");sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><p class="final-message">この旅を、はじめよう。</p><p class="final-sub">選んだ内容は、あとからいつでも変えられます。</p><button class="start-button" id="save">この旅の方針で進む</button><div class="secondary-row"><button class="back" id="back">ひとつ戻る</button><button class="restart" id="restart">最初に戻る</button></div><p class="footer-message">Thank you for traveling with us.</p>`;document.getElementById("save").onclick=()=>{save();renderHome()};document.getElementById("back").onclick=back;document.getElementById("restart").onclick=restart;return}
  const ch=s.choices.map(c=>`<button class="choice" data-value="${c.value}"><span class="choice-main">${c.label}</span>${c.sub?`<span class="choice-sub">${c.sub}</span>`:""}</button>`).join("");
  sheet.innerHTML=`<button class="card-skip" id="skip">スキップ</button>${progress()}<p class="tiny">${s.eyebrow}</p><h1 class="${s.key==="stage"?"stage-question-title":""}">${s.title}</h1><p class="lead">${s.text}</p><div class="choices ${s.compact?"compact-four":""}">${ch}</div><div class="secondary-row"><button class="back" id="back">ひとつ戻る</button><button class="restart" id="restart">最初に戻る</button></div>`;
  document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{showHero("");answers[s.key]=b.dataset.value;setTimeout(next,170)});
  document.getElementById("skip").onclick=()=>{currentScreen=screens.length-1;render()};document.getElementById("back").onclick=back;document.getElementById("restart").onclick=restart;
 })
}
function renderHome(){
 app.classList.add("home-mode");showHero("");stage.className="home-stage";
 const profile=load()||answers;
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
    <h1 class="home-title">今回の旅</h1>
    <p class="home-date">旅先は、まだ登録されていません。</p>
    <span class="home-status">Planning</span>
   </div></div>
   <div class="home-body">
    <p class="home-intro">${partyCopy(profile.party)||"旅の続きを、ここから。"}</p>
    <div class="home-grid">${cards.map(c=>`<button class="home-card" data-page="${c[1]}"><small>${c[0]}</small><strong>${c[1]}</strong><span>${c[2]}</span></button>`).join("")}</div>
    <p class="home-note"><span class="home-note-en">This app is also on a journey.</span><span class="home-note-ja">このアプリも旅の途中です。</span></p>
   </div>
 </section>`;
 document.querySelectorAll(".home-card").forEach(b=>b.onclick=()=>{
   if(b.dataset.page==="交通") renderTransport();
   else renderPlaceholder(b.dataset.page);
 });
}

const TRANSPORT_KEY="projectLadyTransport_v01";

function defaultTransport(){
 return [
  {id:"leg1",label:"01",date:"11/19",from:"横浜",to:"大阪",mode:"未定",time:"",price:"",status:"検討中",url:"",memo:""},
  {id:"leg2",label:"02",date:"11/20",from:"大阪",to:"紀伊勝浦",mode:"未定",time:"",price:"",status:"検討中",url:"",memo:""},
  {id:"leg3",label:"03",date:"11/21",from:"紀伊勝浦",to:"白浜",mode:"未定",time:"",price:"",status:"検討中",url:"",memo:""},
  {id:"leg4",label:"04",date:"11/22",from:"白浜",to:"横浜",mode:"未定",time:"",price:"",status:"検討中",url:"",memo:""}
 ];
}
function loadTransport(){
 try{
  const v=JSON.parse(localStorage.getItem(TRANSPORT_KEY)||"null");
  return Array.isArray(v)&&v.length?v:defaultTransport();
 }catch(e){return defaultTransport();}
}
function saveTransport(data){
 localStorage.setItem(TRANSPORT_KEY,JSON.stringify(data));
}
function esc(v){
 return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function renderTransport(){
 app.classList.add("home-mode");
 showHero("");
 stage.className="home-stage";
 sheet.className="";
 const data=loadTransport();

 sheet.innerHTML=`<section class="transport-page">
   <header class="inside-header">
     <button class="inside-back" id="transportHome">←</button>
     <div>
       <p class="inside-kicker">PROJECT LADY / ROUTE</p>
       <h1>交通</h1>
     </div>
   </header>

   <div class="transport-wrap">
     <section class="transport-intro">
       <p class="transport-lead">移動を、ひとつずつ。</p>
       <p class="transport-note">11月の大阪・紀南旅を想定した仮区間。時間・料金・予約先は、決まったものから入れていく。</p>
     </section>

     <div class="transport-list">
       ${data.map((x,i)=>`
       <article class="route-card" data-id="${esc(x.id)}">
         <div class="route-top">
           <span class="route-no">${esc(x.label)}</span>
           <input class="route-date" data-field="date" value="${esc(x.date)}" aria-label="日付">
         </div>
         <div class="route-line">
           <input class="route-place route-from" data-field="from" value="${esc(x.from)}" aria-label="出発地">
           <span class="route-arrow">→</span>
           <input class="route-place route-to" data-field="to" value="${esc(x.to)}" aria-label="到着地">
         </div>

         <div class="route-grid">
           <label>移動手段
             <select data-field="mode">
               ${["未定","新幹線","特急・電車","飛行機","レンタカー","バス","その他"].map(v=>`<option ${x.mode===v?"selected":""}>${v}</option>`).join("")}
             </select>
           </label>
           <label>時間
             <input data-field="time" value="${esc(x.time)}" placeholder="例 09:10 → 11:20">
           </label>
           <label>料金
             <input data-field="price" value="${esc(x.price)}" placeholder="例 14,500円">
           </label>
           <label>状態
             <select data-field="status">
               ${["検討中","候補","予約予定","予約済み"].map(v=>`<option ${x.status===v?"selected":""}>${v}</option>`).join("")}
             </select>
           </label>
         </div>

         <label class="route-wide">予約・確認ページ
           <input data-field="url" value="${esc(x.url)}" placeholder="https://...">
         </label>
         <label class="route-wide">Memo
           <textarea data-field="memo" rows="2" placeholder="乗換、座席、乗り捨てなど">${esc(x.memo)}</textarea>
         </label>
         <div class="route-actions">
           <button class="route-open" data-open ${x.url?"":"disabled"}>予約先を開く</button>
           <span class="route-saved">自動保存</span>
         </div>
       </article>`).join("")}
     </div>

     <button class="add-leg" id="addTransportLeg">＋ 区間を追加</button>

     <p class="inside-footer">
       <span>This app is also on a journey.</span>
       <small>このアプリも旅の途中です。</small>
     </p>
   </div>
 </section>`;

 document.getElementById("transportHome").onclick=renderHome;

 function collect(){
   const cards=[...document.querySelectorAll(".route-card")];
   const fresh=cards.map((card,i)=>{
     const obj={id:card.dataset.id||`leg${Date.now()}_${i}`,label:String(i+1).padStart(2,"0")};
     card.querySelectorAll("[data-field]").forEach(el=>obj[el.dataset.field]=el.value);
     return obj;
   });
   saveTransport(fresh);
   return fresh;
 }
 document.querySelectorAll(".route-card [data-field]").forEach(el=>{
   el.addEventListener("input",()=>{
     const fresh=collect();
     const card=el.closest(".route-card");
     const obj=fresh.find(v=>v.id===card.dataset.id);
     const open=card.querySelector("[data-open]");
     open.disabled=!obj.url;
   });
   el.addEventListener("change",collect);
 });
 document.querySelectorAll("[data-open]").forEach(btn=>{
   btn.onclick=()=>{
     const card=btn.closest(".route-card");
     const url=card.querySelector('[data-field="url"]').value.trim();
     if(url) window.open(url,"_blank","noopener");
   };
 });
 document.getElementById("addTransportLeg").onclick=()=>{
   const fresh=collect();
   fresh.push({id:`leg${Date.now()}`,label:String(fresh.length+1).padStart(2,"0"),date:"",from:"",to:"",mode:"未定",time:"",price:"",status:"検討中",url:"",memo:""});
   saveTransport(fresh);
   renderTransport();
 };
}

function renderPlaceholder(name){
 stage.className="home-stage";sheet.className="";
 sheet.innerHTML=`<section class="home"><div class="placeholder"><p class="home-kicker">PROJECT LADY</p><h2>${name}</h2><p>ここは次の開発で、11月の旅の実データを入れながら育てます。</p><button class="text-link" id="homeBack">← 旅のホームへ戻る</button></div></section>`;
 document.getElementById("homeBack").onclick=renderHome;
}
function next(){if(currentScreen<screens.length-1){currentScreen++;render()}}
function back(){if(currentScreen>0){currentScreen--;render()}}
function restart(){currentScreen=0;Object.keys(answers).forEach(k=>answers[k]=null);render()}
const saved=load();if(saved){Object.assign(answers,saved);renderReturn(saved)}else render();
