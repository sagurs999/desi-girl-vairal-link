const tg = window.Telegram?.WebApp;


/* =========================
   TELEGRAM
========================= */

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
    emoji: "🌟"
  }

];


/* =========================
   SETTINGS
========================= */

const REQUIRED_ADS = 3;

const ZONE_ID = "3448210";

let selectedVideo = null;

let adsWatched = 0;

let adShowing = false;


/* =========================
   ELEMENTS
========================= */

const videoGrid =
  document.getElementById("videoGrid");

const modal =
  document.getElementById("modal");

const closeModal =
  document.getElementById("closeModal");

const modalTitle =
  document.getElementById("modalTitle");

const modalText =
  document.getElementById("modalText");

const preview =
  document.getElementById("preview");

const watchAdBtn =
  document.getElementById("watchAdBtn");

const videoBtn =
  document.getElementById("videoBtn");

const progressBar =
  document.getElementById("progressBar");

const tgUser =
  document.getElementById("tg-user");


/* =========================
   TELEGRAM USER
========================= */

if (tg?.initDataUnsafe?.user) {

  const user =
    tg.initDataUnsafe.user;

  tgUser.textContent =
    user.first_name ||
    user.username ||
    "Telegram User";
}


/* =========================
   RENDER VIDEOS
========================= */

function render(category = "All") {

  videoGrid.innerHTML = "";

  const filteredVideos =
    category === "All"
      ? videos
      : videos.filter(
          video =>
            video.category === category
        );


  filteredVideos.forEach(video => {

    const card =
      document.createElement("article");

    card.className = "card";


    card.innerHTML = `

      <div class="thumb">
        ${video.emoji}
      </div>

      <div class="card-body">

        <h3>
          ${video.title}
        </h3>

        <div class="meta">
          ${video.category}
        </div>

        <button class="open-btn">
          Open
        </button>

      </div>

    `;


    card
      .querySelector(".open-btn")
      .addEventListener(
        "click",
        () => openVideo(video)
      );


    videoGrid.appendChild(card);

  });

}


/* =========================
   OPEN VIDEO
========================= */

function openVideo(video) {

  selectedVideo = video;

  adsWatched = 0;

  adShowing = false;


  modalTitle.textContent =
    video.title;


  modalText.textContent =
    "Watch 3 ads to unlock this content.";


  preview.textContent =
    video.emoji;


  progressBar.style.width =
    "0%";


  watchAdBtn.disabled =
    false;


  watchAdBtn.textContent =
    "Watch Ad (0/3)";


  videoBtn.disabled =
    true;


  videoBtn.textContent =
    "🔒 Video Locked";


  modal.classList.remove(
    "hidden"
  );

}


/* =========================
   MONETAG AD
========================= */

async function showAd() {

  if (adShowing) {
    return false;
  }


  adShowing = true;


  watchAdBtn.disabled =
    true;


  watchAdBtn.textContent =
    "Loading Ad...";


  try {

    const adFunction =
      window["show_" + ZONE_ID];


    if (
      typeof adFunction !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    /*
      IMPORTANT:

      catchIfNoFeed = true

      If no advertisement is
      available, the Promise rejects.

      Therefore the counter will
      NOT increase.
    */

    const result =
      await adFunction({

        catchIfNoFeed: true,

        requestVar:
          "video_" +
          selectedVideo.id

      });


    console.log(
      "Monetag result:",
      result
    );


    /*
      Only after successful
      Promise resolution do we
      consider this ad completed.
    */

    return true;

  } catch (error) {

    console.error(
      "Monetag ad error:",
      error
    );


    modalText.textContent =
      "Ad is not available right now. Please try again.";


    return false;

  } finally {

    adShowing = false;

  }

}


/* =========================
   WATCH AD
========================= */

watchAdBtn.addEventListener(
  "click",
  async () => {

    if (adShowing) {
      return;
    }


    if (
      adsWatched >=
      REQUIRED_ADS
    ) {
      return;
    }


    watchAdBtn.disabled =
      true;


    watchAdBtn.textContent =
      "Loading Ad...";


    /*
      The counter does NOT
      increase here.
    */

    const success =
      await showAd();


    /*
      If ad failed or no ad
      was available, counter
      stays exactly the same.
    */

    if (!success) {

      watchAdBtn.disabled =
        false;


      watchAdBtn.textContent =
        `Watch Ad (${adsWatched}/${REQUIRED_ADS})`;


      return;

    }


    /*
      IMPORTANT:

      Counter increases ONLY
      after successful ad result.
    */

    adsWatched++;


    const percentage =
      (
        adsWatched /
        REQUIRED_ADS
      ) * 100;


    progressBar.style.width =
      percentage + "%";


    if (
      adsWatched >=
      REQUIRED_ADS
    ) {

      modalText.textContent =
        "All ads completed. Video unlocked.";


      watchAdBtn.textContent =
        "Ads Completed ✓";


      watchAdBtn.disabled =
        true;


      videoBtn.disabled =
        false;


      videoBtn.textContent =
        "▶ Watch Video";

    } else {

      const remaining =
        REQUIRED_ADS -
        adsWatched;


      modalText.textContent =
        `Ad completed. Watch ${remaining} more ad(s).`;


      watchAdBtn.disabled =
        false;


      watchAdBtn.textContent =
        `Watch Ad (${adsWatched}/${REQUIRED_ADS})`;

    }

  }
);


/* =========================
   VIDEO BUTTON
========================= */

videoBtn.addEventListener(
  "click",
  () => {

    if (
      adsWatched <
      REQUIRED_ADS
    ) {
      return;
    }


    /*
      Replace this alert
      with your real video URL
      or backend later.
    */

    alert(
      "Video unlocked."
    );

  }
);


/* =========================
   CLOSE MODAL
========================= */

closeModal.addEventListener(
  "click",
  () => {

    modal.classList.add(
      "hidden"
    );

  }
);


modal.addEventListener(
  "click",
  event => {

    if (
      event.target === modal
    ) {

      modal.classList.add(
        "hidden"
      );

    }

  }
);


/* =========================
   CATEGORY FILTER
========================= */

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

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

      }
    );

  });


/* =========================
   INITIAL RENDER
========================= */

render();
