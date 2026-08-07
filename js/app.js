
const answers={party:null,mood:null,stage:null};
const screens=[
{type:"intro",eyebrow:"A journey begins",title:"今回は、どんな旅ですか？",text:"まだ何も決まっていなくても大丈夫。<br>ここから、少しずつ。"},
{key:"party",eyebrow:"About this journey",title:"誰と景色を見に行く？",text:"人数がわかると、ホテルや旅の提案も少し変わるよ。",choices:[
{label:"一人旅",value:"solo"},{label:"二人旅",value:"pair"},{label:"ワイワイ旅",value:"group"},{label:"まだ決めてない",value:"later"}]},
{key:"mood",eyebrow:"Mood",title:"どんな時間を過ごしたい？",text:"今回は、なんとなくで大丈夫。",choices:[
{label:"のんびり",value:"slow"},{label:"アクティブ",value:"active"},{label:"どっちも",value:"mix"},{label:"まだわからない",value:"later"}]},
{key:"stage",eyebrow:"Right now",title:"旅は、どこまで決まってる？",text:"最初から全部そろってなくて大丈夫。今必要なところから始めよう。",choices:[
{label:"これから考える",sub:"まだ予定はほとんど決まってない",value:"planning"},
{label:"一部だけ決まってる",sub:"ホテル1泊だけ、交通だけ…みたいな旅",value:"partial"},
{label:"だいたい決まってる",sub:"あとは細かいところを整えたい",value:"mostly"},
{label:"今、旅の途中",sub:"今日必要な情報をすぐ見たい",value:"traveling"},
{label:"思い出を残したい",sub:"終わった旅をゆっくり振り返りたい",value:"memory"}]},
{type:"final",eyebrow:"Ready"}];
let currentScreen=0;
const sheet=document.getElementById("sheet"),stage=document.getElementById("stage");
function makeProgress(){let h='<div class="progress">';for(let i=1;i<=3;i++)h+=`<span class="dot ${currentScreen===i?"active":""}"></span>`;return h+"</div>"}
function finalMessage(){if(answers.stage==="memory")return{title:"どんな旅だった？",sub:"素敵な思い出はできた？ 写真や小さな出来事から、ゆっくり残していこう。"};const m={"solo-slow":"自分のペースで、よい旅を。","solo-active":"行きたいところへ、思いきり。","pair-slow":"一緒に過ごす時間を、ゆっくり。","pair-active":"二人で、たくさんの景色を。","group-slow":"みんなで、気の向くままに。","group-active":"笑って、動いて、最高の旅へ。"};return{title:m[`${answers.party}-${answers.mood}`]||"今回の旅を、楽しもう。",sub:"今決まっているところから、旅のホームへ。"}}
function swap(fn){stage.classList.remove("active");setTimeout(()=>{fn();requestAnimationFrame(()=>stage.classList.add("active"))},360)}
function render(){const s=screens[currentScreen];swap(()=>{if(s.type==="intro"){sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><h1>${s.title}</h1><p class="lead">${s.text}</p><button class="start-button" id="startButton">旅をはじめる</button><p class="footer-message">This app is also on a journey.</p>`;document.getElementById("startButton").onclick=next;return}
if(s.type==="final"){const m=finalMessage();sheet.innerHTML=`<p class="tiny">${s.eyebrow}</p><p class="final-message">${m.title}</p><p class="final-sub">${m.sub}</p><button class="start-button" id="homeButton">旅のホームへ</button><div class="secondary-row"><button class="back" id="backButton">ひとつ戻る</button><button class="restart" id="restartButton">最初に戻る</button></div><p class="footer-message">Thank you for traveling with us.</p>`;document.getElementById("homeButton").onclick=()=>alert("次はここから、Project Ladyのホームへつながります。");document.getElementById("backButton").onclick=back;document.getElementById("restartButton").onclick=restart;return}
const choices=s.choices.map(c=>`<button class="choice" data-value="${c.value}"><span class="choice-main">${c.label}</span>${c.sub?`<span class="choice-sub">${c.sub}</span>`:""}</button>`).join("");
sheet.innerHTML=`<button class="card-skip" id="skipButton">スキップ</button>${makeProgress()}<p class="tiny">${s.eyebrow}</p><h1>${s.title}</h1><p class="lead">${s.text}</p><div class="choices">${choices}</div><div class="secondary-row"><button class="back" id="backButton">ひとつ戻る</button><button class="restart" id="restartButton">最初に戻る</button></div>`;
document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{answers[s.key]=b.dataset.value;next()});document.getElementById("skipButton").onclick=()=>{currentScreen=screens.length-1;render()};document.getElementById("backButton").onclick=back;document.getElementById("restartButton").onclick=restart;})}
function next(){if(currentScreen<screens.length-1){currentScreen++;render()}}function back(){if(currentScreen>0){currentScreen--;render()}}function restart(){currentScreen=0;answers.party=answers.mood=answers.stage=null;render()}
render();
