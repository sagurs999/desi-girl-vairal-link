/* TELEGRAM WEBAPP INITIALIZE */
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const REQUIRED_ADS = 3;
let currentVideoCode = null;
let currentAdsWatched = 0;

/* 
  ভিডিও লিস্ট (নতুন ভিডিও যোগ করতে কমা দিয়ে নিচে নতুন অবজেক্ট বসাবেন)
*/
const allPosts = [
  {
    id: "0vascqz7njes",
    title: "Stepbrother 2023 - English Short Film",
    // wsrv.nl প্রক্সি দিয়ে থাম্বনেইল লোড করা হচ্ছে
    thumbnail_url: "https://wsrv.nl/?url=https://img.doodcdn.io/snaps/0vascqz7njes.jpg",
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

/* RENDER CARDS */
function renderPosts() {
  if (!allPosts.length) {
    videoGrid.innerHTML = `<p style="color: #aaa;">কোনো ভিডিও পাওয়া যায়নি।</p>`;
    return;
  }

  videoGrid.innerHTML = allPosts.map(post => `
    <div class="video-card">
      <div class="thumb" onclick="openModal('${post.id}')">
        ${post.thumbnail_url 
          ? `<img src="${post.thumbnail_url}" alt="Thumb" onerror="this.onerror=null; this.parentElement.innerHTML='🎬';">` 
          : `🎬`}
      </div>
      <div class="card-body">
        <h3>${escapeHTML(post.title)}</h3>
        <div class="meta">Views: ${post.views}</div>
        <button class="open-btn" onclick="openModal('${post.id}')">Watch Video</button>
      </div>
    </div>
  `).join("");
}

/* MODAL SYSTEM */
function openModal(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  currentVideoCode = id;
  currentAdsWatched = 0;
  updateModalUI(post);

  modal.classList.remove("hidden");
}

function updateModalUI(post) {
  document.getElementById("modalTitle").textContent = post.title;

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

/* MONETAG ADS SYSTEM */
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

/* UNLOCK ACTION */
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

renderPosts();
