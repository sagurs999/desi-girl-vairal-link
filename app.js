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
const requiredAds = 3; // ৩টি অ্যাড দিয়ে ১, ২, ৩ কাউন্ট হবে
let selectedVideo = null;
let adsWatched = 0;
let adLoading = false;

/* 
  ভিডিও লিস্ট
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
   HOMEPAGE AUTO AD LOOP (৩০ সেকেন্ড পর পর অটোমেটিক অ্যাড)
========================================================= */
function startHomepageAutoAds() {
  setInterval(() => {
    // শুধুমাত্র মোডাল বন্ধ থাকলে এবং ইউজার হোমপেজে থাকলে অ্যাড রান হবে
    if (modal.classList.contains("hidden") && typeof window.show_11571866 === "function") {
      console.log("Triggering 30-second automatic homepage ad...");
      window.show_11571866({
        type: 'inApp',
        inAppSettings: {
          frequency: 2,
          capping: 0.1,
          interval: 30,
          timeout: 5,
          everyPage: false
        }
      }).catch(err => console.log("Auto ad failed or skipped:", err));
    }
  }, 30000); // ৩০,০০০ মিলিসেকেন্ড = ৩০ সেকেন্ড
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
   WATCH AD BUTTON CLICK (অ্যাড ফুল দেখার পরেই ১, ২, ৩ কাউন্ট হবে)
========================================================= */
async function showRewardedAd() {
  if (adLoading || adsWatched >= requiredAds) return;

  adLoading = true;
  watchAdBtn.disabled = true;
  watchAdBtn.textContent = "⏳ Showing Ad...";

  try {
    if (typeof window.show_11571866 === "function") {
      // Monetag ইন-অ্যাপ অ্যাড চালুকরণ
      await window.show_11571866({
        type: 'inApp',
        inAppSettings: {
          frequency: 2,
          capping: 0.1,
          interval: 30,
          timeout: 5,
          everyPage: false
        }
      });

      // অ্যাড সফলভাবে প্রদর্শন সম্পন্ন হলে ১ করে কাউন্ট বৃদ্ধি
      adsWatched += 1;
      updateUnlockUI();

    } else {
      throw new Error("Ad SDK not loaded");
    }
  } catch (error) {
    // অ্যাড ইউজার বন্ধ করে দিলে বা না দেখালে কাউন্ট যোগ হবে না
    console.error("Ad not completed or failed:", error);
    modalText.textContent = "❌ Ad was closed early. Please watch full ad to increment count.";
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
   CATEGORY BUTTONS & NAVIGATION
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
