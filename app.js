/* =========================================================
   TELEGRAM INITIALIZATION
========================================================= */
const tg = window.Telegram && window.Telegram.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

/* =========================================================
   STATE & DATA
========================================================= */
const requiredAds = 3; 
let selectedVideo = null;
let adsWatched = 0;
let adLoading = false;

/* 
  ভিডিও ডাটাবেজ
*/
const videos = [
  {
    id: "0vascqz7njes",
    title: "Stepbrother 2023 - English Short Film",
    category: "Hot video",
    thumbnail: "https://images.weserv.nl/?url=https://img.doodcdn.io/snaps/0vascqz7njes.jpg"
  }
];

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
   TELEGRAM USER DISPLAY
========================================================= */
if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
  const user = tg.initDataUnsafe.user;
  tgUser.textContent = user.first_name || "Telegram User";
}

/* =========================================================
   HOMEPAGE AUTO AD (৩০ সেকেন্ড পর পর হোমপেজে অ্যাড আসবে)
========================================================= */
function startHomepageAutoAds() {
  setInterval(() => {
    // শুধুমাত্র মোডাল বন্ধ থাকা অবস্থায় (হোমপেজে) অটো অ্যাড ট্রাই করবে
    if (modal.classList.contains("hidden") && typeof window.show_11571866 === "function") {
      window.show_11571866().catch(err => console.log("Auto ad skipped:", err));
    }
  }, 30000);
}

startHomepageAutoAds();

/* =========================================================
   RENDER VIDEO CARDS
========================================================= */
function render(category = "All") {
  videoGrid.innerHTML = "";

  const filteredVideos = category === "All"
    ? videos
    : videos.filter(video => String(video.category).toLowerCase() === String(category).toLowerCase());

  if (!filteredVideos.length) {
    videoGrid.innerHTML = `<div class="loading">No videos found.</div>`;
    return;
  }

  filteredVideos.forEach(video => {
    const card = document.createElement("article");
    card.className = "video-card";

    let thumbnailHTML = video.thumbnail
      ? `<img src="${escapeHTML(video.thumbnail)}" alt="${escapeHTML(video.title)}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'thumb-placeholder\\'>🎬</div>';">`
      : `<div class="thumb-placeholder">🎬</div>`;

    card.innerHTML = `
      <div class="thumb">
        ${thumbnailHTML}
      </div>
      <div class="card-body">
        <h3>${escapeHTML(video.title)}</h3>
        <div class="meta">${escapeHTML(video.category)}</div>
        <button class="open-btn" type="button">🔒 Watch Ad</button>
      </div>
    `;

    const openBtn = card.querySelector(".open-btn");
    openBtn.addEventListener("click", event => {
      event.stopPropagation();
      openVideo(video);
    });

    const thumb = card.querySelector(".thumb");
    if (thumb) {
      thumb.addEventListener("click", () => openVideo(video));
    }

    videoGrid.appendChild(card);
  });
}

/* =========================================================
   OPEN VIDEO MODAL
========================================================= */
function openVideo(video) {
  selectedVideo = video;
  adsWatched = 0;
  adLoading = false;

  modalTitle.textContent = video.title || "Video";
  modalText.textContent = `Watch ${requiredAds} ads to unlock this video.`;

  if (video.thumbnail) {
    preview.innerHTML = `<img src="${escapeHTML(video.thumbnail)}" alt="" onerror="this.onerror=null; this.parentElement.innerHTML='🎬';">`;
  } else {
    preview.innerHTML = `
      <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:50px;">
        🎬
      </div>`;
  }

  modal.classList.remove("hidden");
  updateUnlockUI();
}

/* =========================================================
   UPDATE UNLOCK UI
========================================================= */
function updateUnlockUI() {
  if (adsWatched >= requiredAds) {
    videoBtn.disabled = false;
    videoBtn.textContent = "▶ Watch Video";
    modalText.textContent = `🎉 All ${requiredAds} ads completed! Your video is unlocked.`;
    watchAdBtn.disabled = true;
    watchAdBtn.textContent = "✓ Ads Completed";
  } else {
    watchAdBtn.disabled = false;
    watchAdBtn.textContent = `▶ Watch Ad (${adsWatched}/${requiredAds})`;
    videoBtn.disabled = true;
    videoBtn.textContent = "🔒 Video Locked";
  }

  adCount.textContent = `${adsWatched} / ${requiredAds} Ads Completed`;
  const percent = (adsWatched / requiredAds) * 100;
  progressBar.style.width = `${percent}%`;
}

/* =========================================================
   WATCH AD BUTTON (ম্যানুয়াল ক্লিক ১ ➔ ২ ➔ ৩ লজিক)
========================================================= */
async function showRewardedAd() {
  if (adLoading || adsWatched >= requiredAds) return;

  adLoading = true;
  watchAdBtn.disabled = true;
  watchAdBtn.textContent = "⏳ Loading Ad...";

  try {
    if (typeof window.show_11571866 === "function") {
      // বাটন চাপলে অ্যাড রান হবে
      await window.show_11571866();

      // অ্যাড দেখা সফল হলে তবেই ১ যোগ হবে
      adsWatched += 1;
      modalText.textContent = `✅ Ad (${adsWatched}/${requiredAds}) completed! Click again for next ad.`;
      updateUnlockUI();

    } else {
      throw new Error("Ad SDK missing");
    }
  } catch (error) {
    console.error("Ad failed or skipped:", error);
    // অ্যাড শো না হলে কাউন্ট বাড়বে না
    modalText.innerHTML = `<span style="color:#ff4d4d; font-weight:bold;">Ad not available</span>`;
    updateUnlockUI();
  } finally {
    adLoading = false;
  }
}

watchAdBtn.addEventListener("click", showRewardedAd);

/* =========================================================
   WATCH VIDEO BUTTON
========================================================= */
videoBtn.addEventListener("click", () => {
  if (!selectedVideo || adsWatched < requiredAds) return;

  const videoId = encodeURIComponent(selectedVideo.id);
  window.location.href = `video.html?id=${videoId}`;
});

closeModal.addEventListener("click", () => modal.classList.add("hidden"));

modal.addEventListener("click", event => {
  if (event.target === modal) modal.classList.add("hidden");
});

/* =========================================================
   CATEGORY NAVIGATION
========================================================= */
document.querySelectorAll(".category-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    render(button.dataset.category);
  });
});

document.querySelectorAll(".bottom-nav button").forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.bottomCategory;
    document.querySelectorAll(".bottom-nav button").forEach(btn => btn.classList.remove("bottom-active"));
    button.classList.add("bottom-active");

    document.querySelectorAll(".category-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.category === category);
    });

    render(category);
  });
});

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

render("All");
