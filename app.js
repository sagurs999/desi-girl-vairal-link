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

/* DOODSTREAM CONFIGURATION */
const DOODSTREAM_API_KEY = "577640ki1zlnwq28ruachu";
const DOOD_BASE_URL = "https://doodapi.com/api";

const REQUIRED_ADS = 3;
let currentVideoCode = null;
let currentAdsWatched = 0;
let allPosts = [];

const videoGrid = document.getElementById("videoGrid");
const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const watchAdBtn = document.getElementById("watchAdBtn");
const videoBtn = document.getElementById("videoBtn");
const progressBar = document.getElementById("progressBar");
const adCount = document.getElementById("adCount");

/* FETCH DOODSTREAM VIDEOS (Multi-Proxy Fallback System) */
async function fetchPosts() {
  const targetUrl = `${DOOD_BASE_URL}/file/list?key=${DOODSTREAM_API_KEY}`;
  
  // একাধিক প্রক্সি ট্রাই করা হবে যাতে একটি ফেল করলে অন্যটি কাজ করে
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://thingproxy.freeboard.io/fetch/${targetUrl}`
  ];

  let data = null;

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        data = await res.json();
        if (data && (data.status === 200 || data.result)) {
          break; // ডাটা সফলভাবে পাওয়া গেলে লুপ থামবে
        }
      }
    } catch (e) {
      console.warn("Proxy failed, trying next one...", proxyUrl);
    }
  }

  if (data && data.result && data.result.files) {
    allPosts = data.result.files.map(file => ({
      id: file.file_code,
      title: file.title,
      thumbnail_url: file.single_img || file.splash_img || "",
      views: file.views || 0,
      length: file.length || ""
    }));

    renderPosts(allPosts);
  } else {
    // যদি প্রক্সি এবং API দুটোই ফেল করে, তবে ফলব্যাক ডিফল্ট পোস্ট দেখাবে
    videoGrid.innerHTML = `<div class="error-box">Doodstream অ্যাকাউন্ট সার্ভারে কোনো ফাইল পাওয়া যায়নি অথবা API সাড়া দিচ্ছে না। অ্যাকাউন্ট চেক করুন।</div>`;
  }
}

/* RENDER POSTS */
function renderPosts(posts) {
  if (!posts.length) {
    videoGrid.innerHTML = `<div class="loading">কোনো ভিডিও পাওয়া যায়নি। Doodstream-এ নতুন ভিডিও আপলোড করুন।</div>`;
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

/* ADS LOGIC */
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

fetchPosts();
