const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

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
    emoji: "💥"
  }
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

if (user) {
  document.getElementById("tgUser").textContent =
    user.first_name || "Telegram User";
}

function render(category = "All") {
  grid.innerHTML = "";

  videos
    .filter(v => category === "All" || v.category === category)
    .forEach(v => {

      const card = document.createElement("article");

      card.className = "card";

      card.innerHTML = `
        <div class="thumb">${v.emoji}</div>

        <div class="card-body">
          <h3>${v.title}</h3>

          <div class="meta">
            ${v.category} · 3 ads to unlock
          </div>

          <button class="open-btn">
            Open
          </button>
        </div>
      `;

      card
        .querySelector(".open-btn")
        .onclick = () => openVideo(v);

      grid.appendChild(card);
    });
}

function openVideo(video) {
  selected = video;

  adsWatched = 0;

  modalTitle.textContent = video.title;

  modalText.textContent =
    "Watch 3 ads to unlock this content.";

  preview.textContent = video.emoji;

  updateUnlock();

  modal.classList.remove("hidden");
}

function updateUnlock() {

  watchAdBtn.textContent =
    `Watch Ads (${adsWatched}/${requiredAds})`;

  const percentage =
    Math.min((adsWatched / requiredAds) * 100, 100);

  progressBar.style.width =
    `${percentage}%`;

  if (adsWatched >= requiredAds) {

    videoBtn.disabled = false;

    videoBtn.classList.add("unlocked");

    videoBtn.textContent =
      "▶ Watch Video";

    modalText.textContent =
      "Unlocked. You can now open the content.";

  } else {

    videoBtn.disabled = true;

    videoBtn.classList.remove("unlocked");

    videoBtn.textContent =
      "🔒 Video Locked";
  }
}

let adController = null;

function initializeAds() {

  if (
    !window.tads ||
    typeof window.tads.init !== "function"
  ) {
    console.error("TADS SDK is not available.");
    return;
  }

  adController = window.tads.init({

    widgetId: "11498",

    type: "fullscreen",

    debug: false,

    onShowReward: function(result) {

      console.log(
        "Reward received:",
        result
      );

      if (adsWatched < requiredAds) {
        adsWatched++;
      }

      updateUnlock();
    },

    onAdsNotFound: function() {

      console.log(
        "No ads found."
      );

      watchAdBtn.disabled = false;

      watchAdBtn.textContent =
        `Watch Ads (${adsWatched}/${requiredAds})`;
    }
  });
}

watchAdBtn.onclick = async function() {

  if (adsWatched >= requiredAds) {
    return;
  }

  if (!adController) {

    console.error(
      "TADS controller is not ready."
    );

    watchAdBtn.disabled = false;

    watchAdBtn.textContent =
      `Watch Ads (${adsWatched}/${requiredAds})`;

    return;
  }

  watchAdBtn.disabled = true;

  watchAdBtn.textContent =
    "Loading Ad...";

  try {

    await adController.loadAd();

    await adController.showAd();

  } catch (error) {

    console.error(
      "TADS error:",
      error
    );

    watchAdBtn.disabled = false;

    watchAdBtn.textContent =
      `Watch Ads (${adsWatched}/${requiredAds})`;
  }
};

videoBtn.onclick = function() {

  if (
    adsWatched >= requiredAds &&
    selected
  ) {

    alert(
      "Video unlocked. Add your real video URL or backend here."
    );
  }
};

document
  .getElementById("closeModal")
  .onclick = function() {

    modal.classList.add("hidden");
  };

modal.onclick = function(event) {

  if (event.target === modal) {
    modal.classList.add("hidden");
  }
};

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.onclick = function() {

      document
        .querySelectorAll(".tab")
        .forEach(tab => {
          tab.classList.remove("active");
        });

      button.classList.add("active");

      render(
        button.dataset.category
      );
    };
  });

initializeAds();
render();
