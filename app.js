/* =========================================================
   TELEGRAM WEBAPP
========================================================= */

const tg = window.Telegram && window.Telegram.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

/* =========================================================
   VIDEO DATA (WITH DIRECT THUMBNAIL URL)
========================================================= */

const videos = [
  {
    id: "0vascqz7njes",
    title: "Step Brother 2023 - English Short Film",
    category: "Trending",
    thumbnail: "https://i.ibb.co/YF39Dw1h/Step-Brother-2023-English-Short-Film-Sex-Mex.jpg"
  },
  {
    id: "x7pdzvpfeuw7",
    title: "sex video 1",
    category: "Popular",
    thumbnail: "https://i.ibb.co/zhvtNwYX/Screenshot-2026-09-08-17-57-33-31-99c04817c0de5652397fc8b56c3b3817.jpg"
  }
];

let selectedVideo = null;
let adsWatched = 0;
const requiredAds = 3;
let adLoading = false;

/* =========================================================
   DOM ELEMENTS
========================================================= */

const videoGrid = document.getElementById("videoGrid");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const preview = document.getElementById("preview");
const watchAdBtn = document.getElementById("watchAdBtn");
const videoBtn = document.getElementById("videoBtn");
const progressBar = document.getElementById("progressBar");
const adCount = document.getElementById("adCount");
const closeModal = document.getElementById("closeModal");
const tgUser = document.getElementById("tgUser");

/* =========================================================
   TELEGRAM USER PROFILE
========================================================= */

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
  const user = tg.initDataUnsafe.user;
  tgUser.textContent = user.first_name || "Telegram User";
}

/* =========================================================
   LOAD POSTS
========================================================= */

function loadPosts() {
  render("All");
}

/* =========================================================
   RENDER VIDEO CARDS
========================================================= */

function render(category = "All") {
  videoGrid.innerHTML = "";

  const filtered = category === "All" 
    ? videos 
    : videos.filter(v => v.category.toLowerCase() === category.toLowerCase());

  if (filtered.length === 0) {
    videoGrid.innerHTML = "<p style='color:#a0aec0; text-align:center; grid-column:1/-1;'>No videos found.</p>";
    return;
  }

  filtered.forEach(video => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}" class="thumb" onerror="this.src='https://via.placeholder.com/300x170?text=Image+Not+Found'">
      <div class="card-content">
        <h3 class="card-title">${video.title}</h3>
        <span class="card-category">${video.category}</span>
        <button class="unlock-btn">🔒 Watch Ad</button>
      </div>
    `;

    card.querySelector(".unlock-btn").addEventListener("click", () => openModal(video));
    videoGrid.appendChild(card);
  });
}

/* =========================================================
   FILTER BUTTONS
========================================================= */

document.querySelectorAll(".tab, .nav-item").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".tab, .nav-item").forEach(b => b.classList.remove("active"));
    
    const cat = btn.getAttribute("data-category") || btn.innerText.trim();
    
    btn.classList.add("active");
    render(cat);
  });
});

/* =========================================================
   MODAL FUNCTIONS
========================================================= */

function openModal(video) {
  selectedVideo = video;
  adsWatched = 0;
  updateAdUI();

  modalTitle.textContent = video.title;
  modalText.textContent = "Watch 3 ads to unlock full video";
  preview.src = video.thumbnail;
  
  videoBtn.style.display = "none";
  watchAdBtn.style.display = "block";

  modal.classList.add("active");
}

closeModal.addEventListener("click", () => {
  modal.classList.remove("active");
});

/* =========================================================
   ADS LOGIC
========================================================= */

watchAdBtn.addEventListener("click", () => {
  if (adLoading) return;
  adLoading = true;
  watchAdBtn.innerText = "Loading Ad...";

  // Monetag / Adsterra Integration
  if (typeof show_8984923 === 'function') {
    show_8984923().then(() => {
      onAdWatched();
    }).catch(() => {
      onAdWatched(); // Fallback if ad fails
    });
  } else {
    setTimeout(() => {
      onAdWatched();
    }, 2000);
  }
});

function onAdWatched() {
  adsWatched++;
  adLoading = false;
  watchAdBtn.innerText = "🎬 Watch Ad";
  updateAdUI();

  if (adsWatched >= requiredAds) {
    watchAdBtn.style.display = "none";
    videoBtn.style.display = "block";
    modalText.textContent = "🎉 Video Unlocked! Click below to play.";
  }
}

function updateAdUI() {
  adCount.textContent = adsWatched;
  const percentage = (adsWatched / requiredAds) * 100;
  progressBar.style.width = percentage + "%";
}

/* =========================================================
   PLAY VIDEO
========================================================= */

videoBtn.addEventListener("click", () => {
  if (selectedVideo) {
    const playUrl = `https://playmogo.com/e/${selectedVideo.id}`;
    window.open(playUrl, "_blank");
  }
});

/* =========================================================
   INIT
========================================================= */

loadPosts();
