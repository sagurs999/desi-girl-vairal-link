const videos = [
  {
    id: 1,
    title: "Trending Video 01",
    category: "Trending",
    emoji: "🔥"
  },
  {
    id: 2,
    title: "Funny Video 02",
    category: "Funny",
    emoji: "😂"
  },
  {
    id: 3,
    title: "Popular Video 03",
    category: "Popular",
    emoji: "⭐"
  },
  {
    id: 4,
    title: "Trending Video 04",
    category: "Trending",
    emoji: "🎬"
  },
  {
    id: 5,
    title: "Funny Video 05",
    category: "Funny",
    emoji: "🤣"
  },
  {
    id: 6,
    title: "Popular Video 06",
    category: "Popular",
    emoji: "🌟"
  }
];

let selected = null;
let adsWatched = 0;

const REQUIRED_ADS = 3;

/* =========================
   TELEGRAM
========================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  const user = tg.initDataUnsafe?.user;

  if (user) {
    document.getElementById("tgUser").textContent =
      user.first_name || "Telegram User";
  }
}

/* =========================
   ELEMENTS
========================= */

const grid = document.getElementById("videoGrid");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");

const preview = document.getElementById("preview");

const watchAdBtn = document.getElementById("watchAdBtn");
const videoBtn = document.getElementById("videoBtn");

const progressBar = document.getElementById("progressBar");

const closeModal = document.getElementById("closeModal");

/* =========================
   TADS
========================= */

/*
 IMPORTANT:
 নিচের ID-টা আপনার TADS dashboard
 থেকে পাওয়া REAL widget ID দিয়ে বদলাবেন।
*/

const TADS_WIDGET_ID = 11498;

let adController = null;

function initAds() {

  if (!window.tads) {
    console.error("TADS SDK not loaded");
    return;
  }

  try {

    adController = window.tads.init({

      widgetId: String(TADS_WIDGET_ID),

      type: "fullscreen",

      debug: false,

      onShowReward: function(result) {

        console.log("TADS ad completed:", result);

        adsWatched++;

        updateUnlock();

      },

      onAdsNotFound: function() {

        console.log("TADS: No ad available");

        watchAdBtn.textContent =
          `No ad available. Try again (${adsWatched}/${REQUIRED_ADS})`;

        watchAdBtn.disabled = false;

      }

    });

    console.log("TADS initialized:", adController);

  } catch (error) {

    console.error("TADS initialization error:", error);

  }

}

initAds();

/* =========================
   RENDER VIDEOS
========================= */

function render(category = "All") {

  grid.innerHTML = "";

  videos
    .filter(video =>
      category === "All" ||
      video.category === category
    )
    .forEach(video => {

      const card = document.createElement("article");

      card.className = "card";

      card.innerHTML = `
        <div class="thumb">
          ${video.emoji}
        </div>

        <div class="card-body">

          <h3>${video.title}</h3>

          <div class="meta">
            ${video.category} · 3 ads to unlock
          </div>

          <button class="open-btn">
            Open
          </button>

        </div>
      `;

      card
        .querySelector(".open-btn")
        .addEventListener("click", () => {

          openVideo(video);

        });

      grid.appendChild(card);

    });

}

/* =========================
   OPEN VIDEO
========================= */

function openVideo(video) {

  selected = video;

  adsWatched = 0;

  modalTitle.textContent = video.title;

  modalText.textContent =
    "Watch 3 ads to unlock this content.";

  preview.textContent = video.emoji;

  modal.classList.remove("hidden");

  updateUnlock();

}

/* =========================
   UPDATE LOCK
========================= */

function updateUnlock() {

  watchAdBtn.textContent =
    `Watch Ads (${adsWatched}/${REQUIRED_ADS})`;

  const percent =
    Math.min(
      100,
      (adsWatched / REQUIRED_ADS) * 100
    );

  progressBar.style.width = percent + "%";

  if (adsWatched >= REQUIRED_ADS) {

    videoBtn.disabled = false;

    videoBtn.classList.add("unlocked");

    videoBtn.textContent = "▶ Watch Video";

    modalText.textContent =
      "Unlocked! You can now open the content.";

  } else {

    videoBtn.disabled = true;

    videoBtn.classList.remove("unlocked");

    videoBtn.textContent =
      "🔒 Video Locked";

  }

}

/* =========================
   WATCH AD
========================= */

watchAdBtn.addEventListener("click", async () => {

  if (adsWatched >= REQUIRED_ADS) {
    return;
  }

  if (!adController) {

    console.error("TADS controller is not ready");

    alert(
      "Advertisement is not ready. Please open the Mini App from Telegram and try again."
    );

    return;

  }

  watchAdBtn.disabled = true;

  watchAdBtn.textContent = "Loading Ad...";

  try {

    await adController.showAd();

  } catch (error) {

    console.error("TADS showAd error:", error);

    watchAdBtn.disabled = false;

    watchAdBtn.textContent =
      `Watch Ads (${adsWatched}/${REQUIRED_ADS})`;

  }

});

/* =========================
   VIDEO BUTTON
========================= */

videoBtn.addEventListener("click", () => {

  if (adsWatched < REQUIRED_ADS) {
    return;
  }

  /*
    এখানে আপনার আসল ভিডিও URL বসাবেন।
  */

  alert(
    "Video unlocked! এখানে আপনার আসল video URL বসাতে হবে."
  );

});

/* =========================
   CLOSE MODAL
========================= */

closeModal.addEventListener("click", () => {

  modal.classList.add("hidden");

});

modal.addEventListener("click", (event) => {

  if (event.target === modal) {

    modal.classList.add("hidden");

  }

});

/* =========================
   CATEGORY TABS
========================= */

document.querySelectorAll(".tab").forEach(button => {

  button.addEventListener("click", () => {

    document
      .querySelectorAll(".tab")
      .forEach(btn =>
        btn.classList.remove("active")
      );

    button.classList.add("active");

    render(button.dataset.category);

  });

});

/* =========================
   START
========================= */

render();
