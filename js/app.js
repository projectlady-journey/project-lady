const STORAGE_KEY="projectLadyJourneyV1";
const answers={party:null,mood:null,stage:null};
const screens=[
{type:"intro",eyebrow:"A journey begins",title:"今回は、どんな旅ですか？",text:"まだ何も決まっていなくても大丈夫。<br>ここから、少しずつ。"},
{key:"party",eyebrow:"About this journey",title:"誰と景色を見に行く？",text:"人数がわかると、ホテルや旅の提案も少し変わるよ。",choices:[{label:"一人旅",value:"solo"},{label:"二人旅",value:"pair"},{label:"ワイワイ旅",value:"group"},{label:"まだ決めてない",value:"later"}]},
{key:"mood",eyebrow:"Mood",title:"どんな時間を過ごしたい？",text:"今回は、なんとなくで大丈夫。",choices:[{label:"のんびり",value:"slow"},{label:"アクティブ",value:"active"},{label:"どっちも",value:"mix"},{label:"まだわからない",value:"later"}]},
{key:"stage",eyebrow:"Right now",title:"旅は、どこまで決まってる？",text:"最初から全部そろってなくて大丈夫。今必要なところから始めよう。",choices:[{label:"これから考える",sub:"まだ予定はほとんど決まってない",value:"planning"},{label:"一部だけ決まってる",sub:"ホテル1泊だけ、交通だけ…みたいな旅",value:"partial"},{label:"だいたい決まってる",sub:"あとは細かいところを整えたい",value:"mostly"},{label:"今、旅の途中",sub:"今日必要な情報をすぐ見たい",value:"traveling"},{label:"思い出を残したい",sub:"終わった旅をゆっくり振り返りたい",value:"memory"}]},
{type:"final",eyebrow:"Ready"}];
let currentScreen=0;
const sheet=document.getElementById("sheet"),stage=document.getElementById("stage");
function saved(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch(e){return null}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify({answers:{...answers},welcomeCompleted:true,updatedAt:new Date().toISOString()}))}
function clearJourney(){localStorage.removeItem(STORAGE_KEY);answers.party=answers.mood=answers.stage=null;currentScreen=0;render()}
function copyFor(a){
 if(a.stage==="memory") return {eyebrow:"Welcome back",title:"旅の余韻を、もう少し。",sub:"思い出の続きを、ここに残そう。"};
 const map={
 "solo-slow":"今日は、どこまで行こうか。",
 "solo-active":"気になる方へ、軽やかに。",
 "solo-mix":"寄り道も、予定のうち。",
 "pair-slow":"急がない時間も、旅になる。",
 "pair-active":"次の景色を、見に行こう。",
 "pair-mix":"ふたりのペースで、いい方へ。",
 "group-slow":"みんなの気分で、行き先を。",
 "group-active":"今日は、どこで笑おうか。",
 "group-mix":"予定も寄り道も、みんなで。"
 };
 return {eyebrow:"Welcome back",title:map[`${a.party}-${a.mood}`]||"旅の続きを、はじめよう。",sub:"前に決めた旅の方針は、そのまま残っています。"};
}
function makeProgress(){let h='<div class="progress">';for(let i=1;i<=3;i++)h+=`<span class="dot ${currentScreen===i?"active":""}"></span>`;return h+"</div>"}
function finalMessage(){if(answers.stage==="memory")return{title:"どんな旅だった？",sub:"写真や小さな出来事から、ゆっくり残していこう。"};return{title:copyFor(answers).title,sub:"この旅の方針を保存しました。次に開いたときも、ここから続けられます。"}}
function swap(fn){stage.classList.remove("active");setTimeout(()=>{fn();requestAnimationFrame(()=>stage.classList.add("active"))},360)}
function renderReturnTop(data){const c=copyFor(data.answers||{});swap(()=>{sheet.classList.add("return-sheet");sheet.innerHTML=`<p class="tiny">${c.eyebrow}</p><h1 class="return-copy">${c.title}</h1><p class="lead">${c.sub}</p><button class="start-button" id="continueButton">続きから見る</button><div class="secondary-row"><button class="restart" id="newJourneyButton">旅の方針を決め直す</button></div><p class="footer-message">This app is also on a journey.</p>`;document.getElementById("continueButton").onclick=()=>alert("次はここから、保存された旅のホームへつなぎます。");document.getElementById("newJourneyButton").onclick=()=>{if(confirm("保存した旅の方針を消して、最初から決め直しますか？"))clearJourney()}})}
function render(){sheet.classList.remove("return-sheet");const s=screens[currentScreen];swap(()=>{if(s.type==="intro"){sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><h1>${s.title}</h1><p class="lead">${s.text}</p><button class="start-button" id="startButton">旅をはじめる</button><p class="footer-message">This app is also on a journey.</p>`;document.getElementById("startButton").onclick=next;return}
if(s.type==="final"){persist();const m=finalMessage();sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><p class="final-message">${m.title}</p><p class="final-sub">${m.sub}</p><button class="start-button" id="homeButton">旅のホームへ</button><div class="secondary-row"><button class="back" id="backButton">ひとつ戻る</button><button class="restart" id="restartButton">最初に戻る</button></div><p class="footer-message">Thank you for traveling with us.</p>`;document.getElementById("homeButton").onclick=()=>alert("保存完了。次はここからProject Ladyのホームへつなぎます。");document.getElementById("backButton").onclick=back;document.getElementById("restartButton").onclick=restart;return}
const choices=s.choices.map(c=>`<button class="choice" data-value="${c.value}"><span class="choice-main">${c.label}</span>${c.sub?`<span class="choice-sub">${c.sub}</span>`:""}</button>`).join("");sheet.innerHTML=`<button class="card-skip" id="skipButton">スキップ</button>${makeProgress()}<p class="tiny">${s.eyebrow}</p><h1>${s.title}</h1><p class="lead">${s.text}</p><div class="choices">${choices}</div><div class="secondary-row"><button class="back" id="backButton">ひとつ戻る</button><button class="restart" id="restartButton">最初に戻る</button></div>`;document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{answers[s.key]=b.dataset.value;next()});document.getElementById("skipButton").onclick=()=>{currentScreen=screens.length-1;render()};document.getElementById("backButton").onclick=back;document.getElementById("restartButton").onclick=restart})}
function next(){if(currentScreen<screens.length-1){currentScreen++;render()}}function back(){if(currentScreen>0){currentScreen--;render()}}function restart(){currentScreen=0;render()}
const existing=saved();if(existing&&existing.welcomeCompleted&&existing.answers){Object.assign(answers,existing.answers);renderReturnTop(existing)}else render();
