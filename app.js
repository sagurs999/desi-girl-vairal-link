const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


/* =========================
   VIDEO DATA
========================= */

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
    emoji: "🎥"
  }
];


/* =========================
   SETTINGS
========================= */

let selected = null;
let adsWatched = 0;

const requiredAds = 3;


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

const tgUser = document.getElementById("tgUser");


/* =========================
   TELEGRAM USER
========================= */

if (tg?.initDataUnsafe?.user) {

  const user = tg.initDataUnsafe.user;

  tgUser.textContent =
    user.first_name ||
    "Telegram User";

}


/* =========================
   RENDER VIDEOS
========================= */

function render(category = "All") {

  grid.innerHTML = "";

  const filteredVideos =
    videos.filter(video =>
      category === "All" ||
      video.category === category
    );

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

    openButton.onclick = () => {
      openVideo(video);
    };

    grid.appendChild(card);

  });

}


/* =========================
   OPEN VIDEO
========================= */

function openVideo(video) {

  selected = video;

  adsWatched = 0;

  modalTitle.textContent =
    video.title;

  modalText.textContent =
    "Watch 3 ads to unlock this content.";

  preview.textContent =
    video.emoji;

  modal.classList.remove("hidden");

  updateUnlock();

}


/* =========================
   UPDATE PROGRESS
========================= */

function updateUnlock() {

  watchAdBtn.textContent =
    `Watch Ads (${adsWatched}/${requiredAds})`;

  const percent =
    (adsWatched / requiredAds) * 100;

  progressBar.style.width =
    `${percent}%`;


  if (adsWatched >= requiredAds) {

    videoBtn.disabled = false;

    videoBtn.classList.add("unlocked");

    videoBtn.textContent =
      "▶ Watch Video";

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
   WAIT FOR MONETAG SDK
========================= */

function waitForAdSDK(timeout = 10000) {

  return new Promise((resolve, reject) => {

    const start =
      Date.now();

    const timer =
      setInterval(() => {

        if (
          typeof window.show_11571866 ===
          "function"
        ) {

          clearInterval(timer);

          resolve(
            window.show_11571866
          );

          return;
        }


        if (
          Date.now() - start >
          timeout
        ) {

          clearInterval(timer);

          reject(
            new Error(
              "Monetag SDK did not load."
            )
          );

        }

      }, 100);

  });

}


/* =========================
   SHOW AD
========================= */

watchAdBtn.onclick = async () => {

  /*
    IMPORTANT:

    এখানে adsWatched আগে বাড়ানো হচ্ছে না।

    বিজ্ঞাপন সফলভাবে দেখানো/শেষ হওয়ার
    পরে Promise resolve হলে তবেই ১ যোগ হবে।
  */

  if (
    adsWatched >= requiredAds
  ) {
    return;
  }


  if (watchAdBtn.disabled) {
    return;
  }


  watchAdBtn.disabled = true;

  watchAdBtn.textContent =
    "Loading Ad...";


  try {

    const showAd =
      await waitForAdSDK();


    /*
      Monetag Rewarded Interstitial
    */

    await showAd({

      ymid:
        `video_${selected?.id || "unknown"}_${Date.now()}`,

      requestVar:
        "video_unlock"

    });


    /*
      ONLY AFTER THE AD PROMISE
      RESOLVES:

      count +1
    */

    adsWatched++;

    updateUnlock();


  } catch (error) {

    console.log(
      "Ad failed:",
      error
    );

    /*
      IMPORTANT:

      Ad না দেখালে এখানে
      adsWatched বাড়বে না।
    */

    modalText.textContent =
      "Ad is not available right now. Please try again.";

    updateUnlock();

  } finally {

    if (
      adsWatched <
      requiredAds
    ) {

      watchAdBtn.disabled =
        false;

      updateUnlock();

    }

  }

};


/* =========================
   VIDEO BUTTON
========================= */

videoBtn.onclick = () => {

  if (
    adsWatched <
    requiredAds
  ) {

    return;
  }


  /*
    এখানে আপনার আসল ভিডিও URL
    বসাতে হবে।
  */

  alert(
    "Demo unlocked. Replace this with your real video URL/backend."
  );

};


/* =========================
   CLOSE MODAL
========================= */

closeModal.onclick = () => {

  modal.classList.add("hidden");

};


modal.onclick = (event) => {

  if (
    event.target === modal
  ) {

    modal.classList.add("hidden");

  }

};


/* =========================
   CATEGORY TABS
========================= */

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.onclick = () => {

      document
        .querySelectorAll(".tab")
        .forEach(btn => {

          btn.classList.remove(
            "active"
          );

        });


      button.classList.add(
        "active"
      );


      render(
        button.dataset.category
      );

    };

  });


/* =========================
   INITIAL RENDER
========================= */

render();
