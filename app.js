const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const videos = [
  {id:1,title:"Trending Video 01",category:"Trending",emoji:"🔥"},
  {id:2,title:"Funny Video 02",category:"Funny",emoji:"😂"},
  {id:3,title:"Popular Video 03",category:"Popular",emoji:"⭐"},
  {id:4,title:"Trending Video 04",category:"Trending",emoji:"🎬"},
  {id:5,title:"Funny Video 05",category:"Funny",emoji:"🤣"},
  {id:6,title:"Popular Video 06",category:"Popular",emoji:"💥"}
];

let selected = null;
let adsWatched = 0;
const requiredAds = 3;

const grid = document.getElementById("videoGrid");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const preview = document.getElementById("preview");
const watchAdBtn = document.getElementById("watchAdBtn");
const videoBtn = document.getElementById("videoBtn");
const progressBar = document.getElementById("progressBar");

const user = tg?.initDataUnsafe?.user;
if (user) document.getElementById("tgUser").textContent = user.first_name || "Telegram User";

function render(category="All"){
  grid.innerHTML="";
  videos.filter(v=>category==="All"||v.category===category).forEach(v=>{
    const card=document.createElement("article");
    card.className="card";
    card.innerHTML=`
      <div class="thumb">${v.emoji}</div>
      <div class="card-body">
        <h3>${v.title}</h3>
        <div class="meta">${v.category} • 3 ads to unlock</div>
        <button class="open-btn">Open</button>
      </div>`;
    card.querySelector(".open-btn").onclick=()=>openVideo(v);
    grid.appendChild(card);
  });
}

function openVideo(v){
  selected=v;
  adsWatched=0;
  modalTitle.textContent=v.title;
  modalText.textContent="Watch 3 ads to unlock this content.";
  preview.textContent=v.emoji;
  updateUnlock();
  modal.classList.remove("hidden");
}

function updateUnlock(){
  watchAdBtn.textContent=`Watch Ads (${adsWatched}/${requiredAds})`;
  progressBar.style.width=`${(adsWatched/requiredAds)*100}%`;
  if(adsWatched>=requiredAds){
    videoBtn.disabled=false;
    videoBtn.classList.add("unlocked");
    videoBtn.textContent="▶ Watch Video";
    modalText.textContent="Unlocked. You can now open the content.";
  }else{
    videoBtn.disabled=true;
    videoBtn.classList.remove("unlocked");
    videoBtn.textContent="🔒 Video Locked";
  }
}

watchAdBtn.onclick=()=>{
  if(adsWatched>=requiredAds) return;
  // DEMO ONLY: this increments after the button click.
  // A real ad network must confirm a completed ad before incrementing.
  adsWatched++;
  updateUnlock();
};

videoBtn.onclick=()=>{
  if(adsWatched>=requiredAds){
    alert("Demo unlocked. Replace this with your real video URL/backend.");
  }
};

document.getElementById("closeModal").onclick=()=>modal.classList.add("hidden");
modal.onclick=e=>{if(e.target===modal) modal.classList.add("hidden")};

document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    render(btn.dataset.category);
  };
});

render();
