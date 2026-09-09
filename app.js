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
    url: "https://playmogo.com/e/0vascqz7njes",
    title: "Step Brother 2026 - English Short Film",
    category: "Trending",
    thumbnail: "https://i.ibb.co/YF39Dw1h/Step-Brother-2023-English-Short-Film-Sex-Mex.jpg"
  },
  {
    id: "x7pdzvpfeuw7",
    url: "https://playmogo.com/e/x7pdzvpfeuw7",
    title: "sex video 1",
    category: "Popular",
    thumbnail: "https://i.ibb.co/zhvtNwYX/Screenshot-2026-09-08-17-57-33-31-99c04817c0de5652397fc8b56c3b3817.jpg"
  },
  {
    id: "1zngyas64349",
    url: "https://playmogo.com/e/1zngyas64349",
    title: "Vairal Video",
    category: "Hot video",
    thumbnail: "https://i.ibb.co/23nw3rN3/Screenshot-2026-09-08-19-13-02-92-99c04817c0de5652397fc8b56c3b3817.jpg"
  },
  {
    id: "6clvappg3m8z",
    url: "https://playmogo.com/e/6clvappg3m8z",
    title: "Sex Hot Video",
    category: "Trending",
    thumbnail: "https://i.ibb.co/Yw7S09v/Screenshot-2026-09-08-19-34-18-93-99c04817c0de5652397fc8b56c3b3817.jpg"
  },
  {
    id: "37urf9qdgfkf",
    url: "https://luluvdo.com/e/37urf9qdgfkf",
    title: "Waitress_(2026)_Moodx_Hindi Uncut_Hot_Short Film_Watch_Free",
    category: "Popular",
    thumbnail: "https://i.ibb.co/xKHdTDX7/Waitress-2026-Moodx-Hindi-Uncut-Hot-Short-Film-Watch-Free.webp"
  },
  {
   id: "hos5vx536juy",
   url: "https://playmogo.com/e/hos5vx536juy",
   title: "sex video",
   category: "Hot video",
   thumbnail: "https://i.ibb.co/BVsYqV4Q/Screenshot-2026-09-09-01-28-42-65-99c04817c0de5652397fc8b56c3b3817.jpg"
  },
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
   LOAD POSTS (AUTO-RUNS ON PAGE LOAD)
========================================================= */

function loadPosts() {
  render("All");
}


/* =========================================================
   RENDER VIDEO CARDS (CLICK ANYWHERE ON CARD)
========================================================= */

function render(category = "All") {
  if (!videoGrid) return;
  videoGrid.innerHTML = "";

  const filteredVideos = category === "All"
    ? videos
    : videos.filter(video => String(video.category).toLowerCase() === String(category).toLowerCase());

  if (!filteredVideos || filteredVideos.length === 0) {
    videoGrid.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">No videos found.</div>`;
    return;
  }

  // Reverse array so latest added posts appear first
  const displayVideos = [...filteredVideos].reverse();

  displayVideos.forEach(video => {
    const card = document.createElement("article");
    card.className = "video-card";

    let thumbnailHTML = video.thumbnail
      ? `<img src="${escapeHTML(video.thumbnail)}" alt="${escapeHTML(video.title)}" loading="lazy">`
      : `<div class="thumb-placeholder">🎬</div>`;

    card.innerHTML = `
      <div class="thumb">${thumbnailHTML}</div>
      <div class="card-body">
        <h3>${escapeHTML(video.title)}</h3>
        <div class="meta">${escapeHTML(video.category)}</div>
        <button class="open-btn" type="button">🔒 Watch Ad</button>
      </div>
    `;

    // পুরো কার্ডের যেকোনো জায়গায় ক্লিক করলেই মডাল ওপেন হবে
    card.addEventListener("click", () => {
      openVideo(video);
    });

    const openBtn = card.querySelector(".open-btn");
    if (openBtn) {
      openBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openVideo(video);
      });
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
  modalText.textContent = "Watch 3 ads to unlock this video.";

  if (video.thumbnail) {
    preview.innerHTML = `<img src="${escapeHTML(video.thumbnail)}" alt="">`;
  } else {
    preview.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:50px;">🎬</div>`;
  }

  modal.classList.remove("hidden");
  videoBtn.disabled = true;
  videoBtn.textContent = "🔒 Video Locked";
  watchAdBtn.disabled = false;

  updateUnlockUI();
}


/* =========================================================
   UPDATE UI
========================================================= */

function updateUnlockUI() {
  watchAdBtn.textContent = `▶ Watch Ad (${adsWatched}/${requiredAds})`;
  adCount.textContent = `${adsWatched} / ${requiredAds} Ads Completed`;

  const percent = (adsWatched / requiredAds) * 100;
  progressBar.style.width = `${percent}%`;

  if (adsWatched >= requiredAds) {
    videoBtn.disabled = false;
    videoBtn.textContent = "▶ Watch Video";
    modalText.textContent = "🎉 All ads completed! Your video is unlocked.";
    watchAdBtn.disabled = true;
    watchAdBtn.textContent = "✓ Ads Completed";
  } else {
    videoBtn.disabled = true;
    videoBtn.textContent = "🔒 Video Locked";
    watchAdBtn.disabled = false;
  }
}


/* =========================================================
   MONETAG REWARDED AD
========================================================= */

async function showRewardedAd() {
  if (adLoading || adsWatched >= requiredAds) return;

  adLoading = true;
  watchAdBtn.disabled = true;
  watchAdBtn.textContent = "⏳ Loading Ad...";

  try {
    if (typeof window.show_11571866 !== "function") {
      throw new Error("Ad SDK is not loaded.");
    }

    await window.show_11571866();
    adsWatched++;
    updateUnlockUI();

  } catch (error) {
    console.error("Ad failed:", error);
    modalText.textContent = "Ad is not available right now. Please try again.";
    watchAdBtn.textContent = `▶ Watch Ad (${adsWatched}/${requiredAds})`;
    watchAdBtn.disabled = false;
  } finally {
    adLoading = false;
  }
}

watchAdBtn.addEventListener("click", showRewardedAd);


/* =========================================================
   WATCH VIDEO (UPDATED TO REDIRECT TO video.html)
========================================================= */

videoBtn.addEventListener("click", () => {
  if (!selectedVideo || adsWatched < requiredAds) return;
  
  const videoUrl = encodeURIComponent(selectedVideo.url);
  const videoTitle = encodeURIComponent(selectedVideo.title);
  
  // সরাসরি আপনার দেওয়া video.html পেজে লিংক এবং টাইটেল সহ রিডায়রেক্ট করবে
  window.location.href = `video.html?url=${videoUrl}&title=${videoTitle}`;
});


/* =========================================================
   CLOSE MODAL
========================================================= */

closeModal.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});


/* =========================================================
   CATEGORY BUTTONS
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


/* =========================================================
   UTILS
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   MONETAG IN-APP INTERSTITIAL (EXACT 40 SECONDS INTERVAL)
========================================================= */

function initInAppInterstitial() {
  if (typeof window.show_11571866 === "function") {
    setInterval(() => {
      window.show_11571866();
    }, 40000); 
  } else {
    setTimeout(initInAppInterstitial, 1000);
  }
}

initInAppInterstitial();

// পেজ লোড হওয়ার সাথে সাথেই ভিডিওগুলো রেন্ডার করার জন্য
loadPosts();
