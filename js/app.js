const STORAGE_KEY="projectLadyJourneyProfile_v07";

const answers={party:null,mood:null,stage:null};

const screens=[
  {
    type:"intro",
    eyebrow:"A journey begins",
    title:"今回は、どんな旅ですか？",
    text:"まだ何も決まっていなくても大丈夫。<br>ここから、少しずつ。"
  },
  {
    key:"party",
    compact:true,
    eyebrow:"About this journey",
    title:"誰と景色を見に行く？",
    text:"人数がわかると、ホテルや旅の提案も少し変わるよ。",
    choices:[
      {label:"一人旅",sub:"自分のペースで。",value:"solo"},
      {label:"二人旅",sub:"同じ景色を、隣で。",value:"pair"},
      {label:"ワイワイ旅",sub:"寄り道も、思い出も。",value:"group"},
      {label:"まだ決めてない",sub:"決まってなくても大丈夫。",value:"later"}
    ]
  },
  {
    key:"mood",
    compact:true,
    eyebrow:"Mood",
    title:"どんな時間を過ごしたい？",
    text:"今回は、なんとなくで大丈夫。",
    choices:[
      {label:"のんびり",sub:"余白も旅のうち。",value:"slow"},
      {label:"アクティブ",sub:"行きたいところへ。",value:"active"},
      {label:"どっちも",sub:"気分のままに。",value:"mix"},
      {label:"まだわからない",sub:"その日の気分で。",value:"later"}
    ]
  },
  {
    key:"stage",
    eyebrow:"Right now",
    title:"旅は、どこまで決まってる？",
    text:"最初から全部そろってなくて大丈夫。今必要なところから始めよう。",
    choices:[
      {label:"これから考える",sub:"まだ予定はほとんど決まってない",value:"planning"},
      {label:"一部だけ決まってる",sub:"ホテル1泊だけ、交通だけ…みたいな旅",value:"partial"},
      {label:"だいたい決まってる",sub:"あとは細かいところを整えたい",value:"mostly"},
      {label:"今、旅の途中",sub:"今日必要な情報をすぐ見たい",value:"traveling"},
      {label:"思い出を残したい",sub:"終わった旅をゆっくり振り返りたい",value:"memory"}
    ]
  },
  {type:"final",eyebrow:"Ready"}
];

let currentScreen=0;

const sheet=document.getElementById("sheet");
const stage=document.getElementById("stage");
const heroCopy=document.getElementById("heroCopy");

function saveProfile(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify({
    party:answers.party,
    mood:answers.mood,
    stage:answers.stage,
    savedAt:new Date().toISOString()
  }));
}

function loadProfile(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
  }catch(e){
    return null;
  }
}

function clearProfile(){
  localStorage.removeItem(STORAGE_KEY);
}

function partyCopy(party){
  const map={
    solo:"今日は、自分の歩幅で。",
    pair:"同じ景色を、隣で。",
    group:"寄り道も、思い出も、みんなで。",
    later:"旅は、ここから始まる。"
  };
  return map[party]||"";
}

function stageCopy(stageValue){
  const map={
    planning:"旅は、ここから始まる。",
    partial:"続きは、ゆっくり決めよう。",
    mostly:"あと少しで、旅になる。",
    traveling:"今日という旅を、大切に。",
    memory:"旅が終わっても、残るものを。"
  };
  return map[stageValue]||"";
}

function returnTopCopy(profile){
  if(profile.stage==="memory") return "思い出の続きを、ここから。";
  return partyCopy(profile.party)||"今日は、どこまで行こうか。";
}

function makeProgress(){
  let h='<div class="progress">';
  for(let i=1;i<=3;i++){
    h+=`<span class="dot ${currentScreen===i?"active":""}"></span>`;
  }
  return h+"</div>";
}

function finalMessage(){
  if(answers.stage==="memory"){
    return{
      title:"どんな旅だった？",
      sub:"素敵な思い出はできた？ 写真や小さな出来事から、ゆっくり残していこう。"
    };
  }

  const moodMap={
    "solo-slow":"自分のペースで、よい旅を。",
    "solo-active":"行きたいところへ、思いきり。",
    "pair-slow":"一緒に過ごす時間を、ゆっくり。",
    "pair-active":"二人で、たくさんの景色を。",
    "group-slow":"寄り道も、思い出も、みんなで。",
    "group-active":"寄り道も、思い出も、みんなで。"
  };

  return{
    title:moodMap[`${answers.party}-${answers.mood}`]||partyCopy(answers.party)||"今回の旅を、楽しもう。",
    sub:stageCopy(answers.stage)||"今決まっているところから、旅のホームへ。"
  };
}

function showHeroCopy(text){
  heroCopy.textContent=text||"";
  heroCopy.classList.toggle("show",Boolean(text));
}

function swap(fn){
  stage.classList.remove("active");
  setTimeout(()=>{
    fn();
    requestAnimationFrame(()=>stage.classList.add("active"));
  },380);
}

function renderReturnTop(profile){
  currentScreen=0;
  showHeroCopy(returnTopCopy(profile));
  swap(()=>{
    sheet.className="sheet return-sheet";
    sheet.innerHTML=`
      <p class="tiny">WELCOME BACK</p>
      <p class="final-message">今日は、どこまで行こうか。</p>
      <p class="final-sub">前に決めた旅の方針は、そのまま残ってるよ。</p>

      <button class="start-button" id="continueButton">続きから見る</button>

      <div class="secondary-row">
        <button class="restart" id="resetButton">旅の方針を決め直す</button>
      </div>

      <p class="footer-message">This app is also on a journey.</p>
    `;

    document.getElementById("continueButton").onclick=()=>{
      alert("次はここから、Project Ladyの旅ホームへつなぎます。");
    };

    document.getElementById("resetButton").onclick=()=>{
      clearProfile();
      answers.party=answers.mood=answers.stage=null;
      currentScreen=0;
      showHeroCopy("");
      render();
    };
  });
}

function render(){
  const s=screens[currentScreen];
  showHeroCopy("");

  swap(()=>{
    sheet.className="sheet";

    if(s.type==="intro"){
      sheet.innerHTML=`
        <p class="tiny">${s.eyebrow}</p>
        <h1>${s.title}</h1>
        <p class="lead">${s.text}</p>
        <button class="start-button" id="startButton">旅をはじめる</button>
        <p class="footer-message">This app is also on a journey.</p>
      `;
      document.getElementById("startButton").onclick=next;
      return;
    }

    if(s.type==="final"){
      const m=finalMessage();
      showHeroCopy(partyCopy(answers.party));

      sheet.innerHTML=`
        <p class="tiny">${s.eyebrow}</p>
        <p class="final-message">${m.title}</p>
        <p class="final-sub">${m.sub}</p>

        <button class="start-button" id="saveButton">この旅の方針で進む</button>

        <div class="secondary-row">
          <button class="back" id="backButton">ひとつ戻る</button>
          <button class="restart" id="restartButton">最初に戻る</button>
        </div>

        <p class="footer-message">Thank you for traveling with us.</p>
      `;

      document.getElementById("saveButton").onclick=()=>{
        saveProfile();
        renderReturnTop(loadProfile());
      };
      document.getElementById("backButton").onclick=back;
      document.getElementById("restartButton").onclick=restart;
      return;
    }

    const choices=s.choices.map(c=>`
      <button class="choice" data-value="${c.value}">
        <span class="choice-main">${c.label}</span>
        ${c.sub?`<span class="choice-sub">${c.sub}</span>`:""}
      </button>
    `).join("");

    sheet.innerHTML=`
      <button class="card-skip" id="skipButton">スキップ</button>
      ${makeProgress()}
      <p class="tiny">${s.eyebrow}</p>
      <h1>${s.title}</h1>
      <p class="lead">${s.text}</p>
      <div class="choices ${s.compact?"compact-four":""}">${choices}</div>

      <div class="secondary-row">
        <button class="back" id="backButton">ひとつ戻る</button>
        <button class="restart" id="restartButton">最初に戻る</button>
      </div>
    `;

    document.querySelectorAll(".choice").forEach(b=>{
      b.onclick=()=>{
        answers[s.key]=b.dataset.value;

        if(s.key==="party"){
          showHeroCopy(partyCopy(answers.party));
        }else if(s.key==="stage"){
          showHeroCopy(stageCopy(answers.stage));
        }

        setTimeout(next,260);
      };
    });

    document.getElementById("skipButton").onclick=()=>{
      currentScreen=screens.length-1;
      render();
    };
    document.getElementById("backButton").onclick=back;
    document.getElementById("restartButton").onclick=restart;
  });
}

function next(){
  if(currentScreen<screens.length-1){
    currentScreen++;
    render();
  }
}
function back(){
  if(currentScreen>0){
    currentScreen--;
    render();
  }
}
function restart(){
  currentScreen=0;
  answers.party=answers.mood=answers.stage=null;
  showHeroCopy("");
  render();
}

const saved=loadProfile();
if(saved){
  answers.party=saved.party;
  answers.mood=saved.mood;
  answers.stage=saved.stage;
  renderReturnTop(saved);
}else{
  render();
}
