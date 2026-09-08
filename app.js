/* =========================================================
   TELEGRAM
========================================================= */

const tg = window.Telegram && window.Telegram.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

/* =========================================================
   DOODSTREAM CONFIG
========================================================= */

const DOODSTREAM_API_KEY = "577640ki1zlnwq28ruachu";

/* =========================================================
   STATE
========================================================= */

const videos = [];
let selectedVideo = null;
let adsWatched = 0;
const requiredAds = 3;
let adLoading = false;

/* =========================================================
   DOM
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
   TELEGRAM USER
========================================================= */

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
  const user = tg.initDataUnsafe.user;
  tgUser.textContent = user.first_name || "Telegram User";
}

/* =========================================================
   LOAD POSTS FROM DOODSTREAM API
========================================================= */

async function loadPosts() {
  videoGrid.innerHTML = `
    <div class="loading">
      Loading videos...
    </div>
  `;

  const apiUrl = `https://doodapi.com/api/file/list?key=${DOODSTREAM_API_KEY}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const proxyData = await response.json();
    const data = JSON.parse(proxyData.contents);

    videos.length = 0;

    if (data.status === 200 && data.result && data.result.files) {
      data.result.files.forEach(file => {
        videos.push({
          id: file.file_code,
          title: file.title || "Untitled Video",
          category: "Trending",
          thumbnail: file.single_img || file.splash_img || "",
          videoUrl: `https://dood.to/e/${file.file_code}`,
          createdAt: file.uploaded || ""
        });
      });
    }

    if (videos.length === 0) {
      videoGrid.innerHTML = `<div class="loading">No videos found.</div>`;
      return;
    }

    render("All");

  } catch (error) {
    console.error("Failed to load posts from Doodstream:", error);

    videoGrid.innerHTML = `
      <div class="error-box">
        <h3>Unable to load videos</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}

/* =========================================================
   RENDER
========================================================= */

function render(category = "All") {
  videoGrid.innerHTML = "";

  const filteredVideos =
    category === "All"
      ? videos
      : videos.filter(
          video =>
            String(video.category).toLowerCase() ===
            String(category).toLowerCase()
        );

  if (!filteredVideos.length) {
    videoGrid.innerHTML = `
      <div class="loading">
        No videos found.
      </div>
    `;
    return;
  }

  filteredVideos.forEach(video => {
    const card = document.createElement("article");
    card.className = "video-card";

    /* ================= THUMBNAIL ================= */
    let thumbnailHTML;
    if (video.thumbnail) {
      thumbnailHTML = `
        <img
          src="${escapeHTML(video.thumbnail)}"
          alt="${escapeHTML(video.title)}"
          loading="lazy"
        >
      `;
    } else {
      thumbnailHTML = `
        <div class="thumb-placeholder">
          🎬
        </div>
      `;
    }

    /* ================= CARD ================= */
    card.innerHTML = `
      <div class="thumb">
        ${thumbnailHTML}
      </div>

      <div class="card-body">
        <h3>
          ${escapeHTML(video.title)}
        </h3>
        <div class="meta">
          ${escapeHTML(video.category)}
        </div>
        <button
          class="open-btn"
          type="button"
        >
          🔒 Watch Ad
        </button>
      </div>
    `;

    /* ================= WATCH BUTTON ================= */
    const openBtn = card.querySelector(".open-btn");
    openBtn.addEventListener("click", event => {
      event.stopPropagation();
      openVideo(video);
    });

    /* ================= THUMBNAIL CLICK ================= */
    const thumb = card.querySelector(".thumb");
    if (thumb) {
      thumb.addEventListener("click", () => {
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

  /* ================= PREVIEW ================= */
  if (video.thumbnail) {
    preview.innerHTML = `
      <img
        src="${escapeHTML(video.thumbnail)}"
        alt=""
      >
    `;
  } else {
    preview.innerHTML = `
      <div
        style="
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:50px;
        "
      >
        🎬
      </div>
    `;
  }

  modal.classList.remove("hidden");

  videoBtn.disabled = true;
  videoBtn.textContent = "🔒 Video Locked";
  watchAdBtn.disabled = false;

  updateUnlockUI();
}

/* =========================================================
   UPDATE UNLOCK UI
========================================================= */

function updateUnlockUI() {
  watchAdBtn.textContent = `▶ Watch Ad (${adsWatched}/${requiredAds})`;
  adCount.textContent = `${adsWatched} / ${requiredAds} Ads Completed`;

  const percent = (adsWatched / requiredAds) * 100;
  progressBar.style.width = `${percent}%`;

  /* ================= UNLOCKED ================= */
  if (adsWatched >= requiredAds) {
    videoBtn.disabled = false;
    videoBtn.textContent = "▶ Watch Video";
    modalText.textContent = "🎉 All ads completed! Your video is unlocked.";
    watchAdBtn.disabled = true;
    watchAdBtn.textContent = "✓ Ads Completed";
  }
  /* ================= LOCKED ================= */
  else {
    videoBtn.disabled = true;
    videoBtn.textContent = "🔒 Video Locked";
    watchAdBtn.disabled = false;
  }
}

/* =========================================================
   MONETAG REWARDED AD
========================================================= */

async function showRewardedAd() {
  if (adLoading || adsWatched >= requiredAds) {
    return;
  }

  adLoading = true;
  watchAdBtn.disabled = true;
  watchAdBtn.textContent = "⏳ Loading Ad...";

  try {
    if (typeof window.show_11571866 !== "function") {
      throw new Error("Monetag SDK is not loaded.");
    }

    const result = await window.show_11571866();
    adsWatched++;
    console.log("Monetag ad completed:", result);
    updateUnlockUI();

  } catch (error) {
    console.error("Monetag ad failed:", error);
    modalText.textContent = "Ad is not available right now. Please try again.";
    watchAdBtn.textContent = `▶ Watch Ad (${adsWatched}/${requiredAds})`;
    watchAdBtn.disabled = false;
  } finally {
    adLoading = false;
  }
}

/* =========================================================
   WATCH AD BUTTON
========================================================= */

watchAdBtn.addEventListener("click", showRewardedAd);

/* =========================================================
   WATCH VIDEO BUTTON
========================================================= */

videoBtn.addEventListener("click", () => {
  if (!selectedVideo || adsWatched < requiredAds) {
    return;
  }

  const videoId = encodeURIComponent(selectedVideo.id);
  const videoUrl = encodeURIComponent(selectedVideo.videoUrl || "");

  window.location.href = `video.html?id=${videoId}&url=${videoUrl}`;
});

/* =========================================================
   CLOSE MODAL
========================================================= */

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

modal.addEventListener("click", event => {
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
});

/* =========================================================
   CATEGORY BUTTONS
========================================================= */

document.querySelectorAll(".category-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    button.classList.add("active");
    render(button.dataset.category);
  });
});

/* =========================================================
   BOTTOM NAV
========================================================= */

document.querySelectorAll(".bottom-nav button").forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.bottomCategory;

    document.querySelectorAll(".bottom-nav button").forEach(btn => {
      btn.classList.remove("bottom-active");
    });

    button.classList.add("bottom-active");

    document.querySelectorAll(".category-btn").forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.category === category
      );
    });

    render(category);
  });
});

/* =========================================================
   HTML ESCAPE
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
   START
========================================================= */

loadPosts();
