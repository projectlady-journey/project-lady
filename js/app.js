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
    <p class="home-kicker">PROJECT LADY / JOURNEY 01</p>
    <h1 class="home-title">大阪・紀南<br>3泊4日の旅</h1>
    <p class="home-date">2026.11.19 — 11.22</p>
    <span class="home-status">Planning</span>
   </div></div>
   <div class="home-body">
    <p class="home-intro">${partyCopy(profile.party)||"旅の続きを、ここから。"}</p>
    <div class="home-grid">${cards.map(c=>`<button class="home-card" data-page="${c[1]}"><small>${c[0]}</small><strong>${c[1]}</strong><span>${c[2]}</span></button>`).join("")}</div>
    <p class="home-note">This app is also on a journey.<br>このアプリも旅の途中です。</p>
   </div>
 </section>`;
 document.querySelectorAll(".home-card").forEach(b=>b.onclick=()=>renderPlaceholder(b.dataset.page));
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
