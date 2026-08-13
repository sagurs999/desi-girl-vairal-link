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
    emoji: "🔥"
  }
];


let selectedVideo = null;

let adsWatched = 0;

const requiredAds = 3;

let adLoading = false;


const videoGrid = document.getElementById("videoGrid");

const modal = document.getElementById("modal");

const modalTitle = document.getElementById("modalTitle");

const modalText = document.getElementById("modalText");

const preview = document.getElementById("preview");

const watchAdBtn = document.getElementById("watchAdBtn");

const videoBtn = document.getElementById("videoBtn");

const progressBar = document.getElementById("progressBar");

const closeModal = document.getElementById("closeModal");

const tgUser = document.getElementById("tgUser");


if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {

  const user = tg.initDataUnsafe.user;

  tgUser.textContent =
    user.first_name || "Telegram User";

}


function render(category = "All") {

  videoGrid.innerHTML = "";

  const filteredVideos =
    category === "All"
      ? videos
      : videos.filter(video => video.category === category);


  filteredVideos.forEach(video => {

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


    const openButton =
      card.querySelector(".open-btn");


    openButton.addEventListener("click", () => {

      openVideo(video);

    });


    videoGrid.appendChild(card);

  });

}


function openVideo(video) {

  selectedVideo = video;

  adsWatched = 0;

  adLoading = false;

  modalTitle.textContent = video.title;

  modalText.textContent =
    "Watch 3 ads to unlock this content.";

  preview.textContent = video.emoji;

  modal.classList.remove("hidden");

  videoBtn.disabled = true;

  videoBtn.textContent = "🔒 Video Locked";

  updateUnlockUI();

}


function updateUnlockUI() {

  watchAdBtn.textContent =
    `Watch Ad (${adsWatched}/${requiredAds})`;


  const percent =
    (adsWatched / requiredAds) * 100;


  progressBar.style.width =
    `${percent}%`;


  if (adsWatched >= requiredAds) {

    videoBtn.disabled = false;

    videoBtn.textContent = "▶ Watch Video";

    modalText.textContent =
      "Unlocked. You can now open the content.";

    watchAdBtn.disabled = true;

    watchAdBtn.textContent =
      "Ads Completed";

  } else {

    videoBtn.disabled = true;

    videoBtn.textContent =
      "🔒 Video Locked";

    watchAdBtn.disabled = false;

  }

}


/*
  Monetag Rewarded Interstitial

  The counter is increased ONLY after
  the Monetag promise resolves successfully.
*/

async function showRewardedAd() {

  if (adLoading) {
    return;
  }


  if (adsWatched >= requiredAds) {
    return;
  }


  adLoading = true;

  watchAdBtn.disabled = true;

  watchAdBtn.textContent = "Loading Ad...";


  try {

    if (typeof window.show_11571866 !== "function") {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    const result =
      await window.show_11571866();


    /*
      IMPORTANT:

      Do NOT increment the counter
      before this point.

      The counter changes only after
      the ad promise resolves.
    */

    adsWatched++;

    updateUnlockUI();


    console.log(
      "Monetag ad completed:",
      result
    );


  } catch (error) {

    console.error(
      "Monetag ad failed:",
      error
    );


    modalText.textContent =
      "Ad is not available right now. Please try again.";


    watchAdBtn.textContent =
      `Watch Ad (${adsWatched}/${requiredAds})`;


    watchAdBtn.disabled = false;

  } finally {

    adLoading = false;

  }

}


watchAdBtn.addEventListener(
  "click",
  showRewardedAd
);


videoBtn.addEventListener(
  "click",
  () => {

    if (adsWatched < requiredAds) {

      return;

    }


    /*
      Replace this section with your
      real video URL/backend later.
    */

    alert(
      `Unlocked: ${selectedVideo.title}`
    );

  }
);


closeModal.addEventListener(
  "click",
  () => {

    modal.classList.add("hidden");

  }
);


modal.addEventListener(
  "click",
  event => {

    if (event.target === modal) {

      modal.classList.add("hidden");

    }

  }
);


document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".tab")
          .forEach(tab => {

            tab.classList.remove("active");

          });


        button.classList.add("active");


        render(
          button.dataset.category
        );

      }
    );

  });


render();
