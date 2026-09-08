/* TELEGRAM WEBAPP */
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  const user = tg.initDataUnsafe?.user;
  if (user) {
    document.getElementById("tgUser").textContent = user.first_name || "Guest";
  }
}

const REQUIRED_ADS = 3;
let currentVideoCode = null;
let currentAdsWatched = 0;

/* 
  আপনার Doodstream-এর ভিডিও লিস্ট। 
  ভবিষ্যতে নতুন ভিডিও যুক্ত করতে চাইলে কমা (,) দিয়ে নিচে নতুন অবজেক্ট বসিয়ে দিবেন।
*/
const allPosts = [
  {
    id: "0vascqz7njes", // আপনার ভিডিওর File Code
    title: "Stepbrother 2023 - English Short Film",
    thumbnail_url: "https://img.doodcdn.io/snaps/0vascqz7njes.jpg", 
    views: "1.5k"
  }
];

const videoGrid = document.getElementById("videoGrid");
const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const watchAdBtn = document.getElementById("watchAdBtn");
const videoBtn = document.getElementById("videoBtn");
const progressBar = document.getElementById("progressBar");
const adCount = document.getElementById("adCount");

/* RENDER POSTS */
function renderPosts(posts) {
  if (!posts.length) {
    videoGrid.innerHTML = `<div class="loading">কোনো ভিডিও পাওয়া যায়নি।</div>`;
    return;
  }

  videoGrid.innerHTML = posts.map(post => `
    <div class="video-card">
      <div class="thumb" onclick="openModal('${post.id}')">
        ${post.thumbnail_url 
          ? `<img src="${post.thumbnail_url}" alt="Thumbnail" />` 
          : `<div class="thumb-placeholder">🎬</div>`}
      </div>
      <div class="card-body">
        <h3>${escapeHTML(post.title || "Untitled")}</h3>
        <div class="meta">Views: ${post.views}</div>
        <button class="open-btn" onclick="openModal('${post.id}')">Watch Video</button>
      </div>
    </div>
  `).join("");
}

/* MODAL LOGIC */
function openModal(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  currentVideoCode = id;
  currentAdsWatched = 0;
  updateModalUI(post);

  modal.classList.remove("hidden");
}

function updateModalUI(post) {
  document.getElementById("modalTitle").textContent = post.title || "Video";
  
  const pct = Math.floor((currentAdsWatched / REQUIRED_ADS) * 100);
  progressBar.style.width = `${pct}%`;
  adCount.textContent = `${currentAdsWatched} / ${REQUIRED_ADS} Ads Completed`;
  
  watchAdBtn.textContent = `▶ Watch Ad (${currentAdsWatched}/${REQUIRED_ADS})`;

  if (currentAdsWatched >= REQUIRED_ADS) {
    watchAdBtn.disabled = true;
    videoBtn.disabled = false;
    videoBtn.textContent = "🔓 Watch Video";
  } else {
    watchAdBtn.disabled = false;
    videoBtn.disabled = true;
    videoBtn.textContent = "🔒 Video Locked";
  }
}

/* ADS LOGIC (MONETAG integration) */
watchAdBtn.addEventListener("click", () => {
  if (typeof show_11571866 === "function") {
    show_11571866().then(() => {
      onAdWatched();
    }).catch(() => {
      onAdWatched();
    });
  } else {
    onAdWatched();
  }
});

function onAdWatched() {
  if (currentAdsWatched < REQUIRED_ADS) {
    currentAdsWatched++;
    const post = allPosts.find(p => p.id === currentVideoCode);
    if (post) updateModalUI(post);
  }
}

videoBtn.addEventListener("click", () => {
  if (currentAdsWatched >= REQUIRED_ADS && currentVideoCode) {
    window.location.href = `video.html?code=${currentVideoCode}`;
  }
});

closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}

// Render Videos Immediately
renderPosts(allPosts);
