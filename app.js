const tg = window.Telegram && window.Telegram.WebApp;

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

let adController = null;
let adLoading = false;
let rewardReceived = false;


const grid = document.getElementById("videoGrid");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const preview = document.getElementById("preview");
const watchAdBtn = document.getElementById("watchAdBtn");
const videoBtn = document.getElementById("videoBtn");
const progressBar = document.getElementById("progressBar");
const closeModal = document.getElementById("closeModal");


const user =
  tg && tg.initDataUnsafe
    ? tg.initDataUnsafe.user
    : null;


if (user) {
  const tgUser = document.getElementById("tgUser");

  if (tgUser) {
    tgUser.textContent = user.first_name || "Telegram User";
  }
}


function initAds() {

  if (!window.tads || typeof window.tads.init !== "function") {
    console.error("TADS SDK is not loaded.");
    return false;
  }

  try {

    adController = window.tads.init({
      widgetId: "11498",
      type: "fullscreen",
      debug: false,

      onShowReward: function(result) {

        console.log("Ad reward received:", result);

        rewardReceived = true;

        adsWatched++;

        if (adsWatched > requiredAds) {
          adsWatched = requiredAds;
        }

        updateUnlock();
      },

      onAdsNotFound: function() {

        console.log("No ads found.");

        adLoading = false;

        watchAdBtn.disabled = false;

        watchAdBtn.textContent =
          `Watch Ads (${adsWatched}/${requiredAds})`;
      }
    });

    return true;

  } catch (error) {

    console.error("TADS initialization error:", error);

    adController = null;

    return false;
  }
}


function render(category = "All") {

  grid.innerHTML = "";

  const filteredVideos =
    videos.filter(function(video) {

      return category === "All" ||
             video.category === category;

    });


  filteredVideos.forEach(function(video) {

    const card = document.createElement("article");

    card.className = "card";


    card.innerHTML = `
      <div class="thumb">${video.emoji}</div>

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


    const openButton =
      card.querySelector(".open-btn");


    openButton.addEventListener("click", function() {

      openVideo(video);

    });


    grid.appendChild(card);

  });

}


function openVideo(video) {

  selected = video;

  adsWatched = 0;

  rewardReceived = false;

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


  const progress =
    Math.min(
      (adsWatched / requiredAds) * 100,
      100
    );


  progressBar.style.width =
    `${progress}%`;


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

    modalText.textContent =
      "Watch 3 ads to unlock this content.";

  }

}


async function watchAd() {

  if (adsWatched >= requiredAds) {
    return;
  }


  if (adLoading) {
    return;
  }


  if (!adController) {

    const initialized = initAds();

    if (!initialized) {

      watchAdBtn.disabled = false;

      watchAdBtn.textContent =
        `Watch Ads (${adsWatched}/${requiredAds})`;

      return;
    }
  }


  adLoading = true;

  rewardReceived = false;

  watchAdBtn.disabled = true;

  watchAdBtn.textContent = "Loading Ad...";


  try {

    if (!adController) {
      throw new Error("TADS controller is not ready.");
    }


    if (typeof adController.showAd !== "function") {
      throw new Error("showAd is not available.");
    }


    await adController.showAd();


    if (!rewardReceived) {

      console.log(
        "Ad finished without reward callback."
      );

      watchAdBtn.disabled = false;

      watchAdBtn.textContent =
        `Watch Ads (${adsWatched}/${requiredAds})`;
    }

  } catch (error) {

    console.error("TADS error:", error);

    watchAdBtn.disabled = false;

    watchAdBtn.textContent =
      `Watch Ads (${adsWatched}/${requiredAds})`;

  } finally {

    adLoading = false;

  }

}


watchAdBtn.addEventListener("click", function() {

  watchAd();

});


videoBtn.addEventListener("click", function() {

  if (adsWatched < requiredAds) {
    return;
  }


  if (!selected) {
    return;
  }


  alert(
    "Demo unlocked. Replace this with your real video URL/backend."
  );

});


closeModal.addEventListener("click", function() {

  modal.classList.add("hidden");

});


modal.addEventListener("click", function(event) {

  if (event.target === modal) {
    modal.classList.add("hidden");
  }

});


document.querySelectorAll(".tab").forEach(function(button) {

  button.addEventListener("click", function() {

    document
      .querySelectorAll(".tab")
      .forEach(function(tab) {

        tab.classList.remove("active");

      });


    button.classList.add("active");


    render(button.dataset.category);

  });

});


render();

initAds();
