const tg = window.Telegram?.WebApp;

if (tg) {
  try {
    tg.ready();
    tg.expand();
  } catch (e) {
    console.log(e);
  }
}


/* =========================
   TADS SETTINGS
========================= */

const WIDGET_ID = "11498";

const REQUIRED_ADS = 3;


/* =========================
   VIDEO DATA
========================= */

const videos = [

  {
    id: 1,
    title: "Trending Video 01",
    category: "Trending",
    emoji: "🔥",
    views: 0,
    created_at: "2026-08-15",

    thumbnail_url: "",
    video_url: ""
  },

  {
    id: 2,
    title: "Funny Video 02",
    category: "Funny",
    emoji: "😂",
    views: 0,
    created_at: "2026-08-15",

    thumbnail_url: "",
    video_url: ""
  },

  {
    id: 3,
    title: "Popular Video 03",
    category: "Popular",
    emoji: "⭐",
    views: 0,
    created_at: "2026-08-14",

    thumbnail_url: "",
    video_url: ""
  },

  {
    id: 4,
    title: "Trending Video 04",
    category: "Trending",
    emoji: "🎬",
    views: 0,
    created_at: "2026-08-14",

    thumbnail_url: "",
    video_url: ""
  },

  {
    id: 5,
    title: "Funny Video 05",
    category: "Funny",
    emoji: "🤣",
    views: 0,
    created_at: "2026-08-13",

    thumbnail_url: "",
    video_url: ""
  },

  {
    id: 6,
    title: "Popular Video 06",
    category: "Popular",
    emoji: "💥",
    views: 0,
    created_at: "2026-08-13",

    thumbnail_url: "",
    video_url: ""
  }

];


/* =========================
   VARIABLES
========================= */

let selected = null;

let adsWatched = 0;

let adController = null;

let adShowing = false;

let rewardGrantedThisAd = false;


/* =========================
   ELEMENTS
========================= */

const grid =
  document.getElementById("videoGrid");

const modal =
  document.getElementById("modal");

const modalTitle =
  document.getElementById("modalTitle");

const modalText =
  document.getElementById("modalText");

const modalViews =
  document.getElementById("modalViews");

const modalDate =
  document.getElementById("modalDate");

const modalCategory =
  document.getElementById("modalCategory");

const preview =
  document.getElementById("preview");

const watchAdBtn =
  document.getElementById("watchAdBtn");

const videoBtn =
  document.getElementById("videoBtn");

const progressBar =
  document.getElementById("progressBar");

const progressText =
  document.getElementById("progressText");

const tgUser =
  document.getElementById("tgUser");


/* =========================
   TELEGRAM USER
========================= */

const user =
  tg?.initDataUnsafe?.user;

if (user) {

  tgUser.textContent =
    user.first_name ||
    "Telegram User";

}


/* =========================
   HELPERS
========================= */

function safeNumber(value) {

  const n = Number(value);

  if (
    Number.isFinite(n) &&
    n >= 0
  ) {

    return n;

  }

  return 0;

}


function formatViews(value) {

  const n =
    safeNumber(value);


  if (n >= 1000000) {

    return (
      n / 1000000
    ).toFixed(
      n >= 10000000 ? 0 : 1
    ) + "M";

  }


  if (n >= 1000) {

    return (
      n / 1000
    ).toFixed(
      n >= 10000 ? 0 : 1
    ) + "K";

  }


  return String(
    Math.floor(n)
  );

}


function formatDate(value) {

  if (!value) {

    return "📅 Date unavailable";

  }


  const s =
    String(value).slice(0, 10);


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(s)
  ) {

    return `📅 ${s}`;

  }


  return `📅 ${String(value)}`;

}


function escapeHtml(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>'"]/g,
    character => {

      const map = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"

      };

      return map[character];

    }
  );

}


/* =========================
   THUMBNAIL
========================= */

function thumbMarkup(
  video,
  modalMode = false
) {

  const src =
    video.thumbnail_url ||
    video.thumbnail ||
    video.image_url ||
    video.image;


  if (src) {

    return `
      <img
        src="${escapeHtml(src)}"
        alt=""
        loading="lazy"
      >
    `;

  }


  return `
    <div
      class="${
        modalMode
          ? "preview-placeholder"
          : "thumb-placeholder"
      }"
    >
      ${escapeHtml(
        video.emoji || "🎬"
      )}
    </div>
  `;

}


/* =========================
   RENDER POSTS
========================= */

function render(category = "All") {

  grid.innerHTML = "";


  const list =
    videos

      .filter(video => {

        if (category === "All") {

          return true;

        }

        return String(
          video.category || ""
        ).toLowerCase()
        ===
        category.toLowerCase();

      })

      .sort((a, b) => {

        const dateCompare =
          String(
            b.created_at || ""
          ).localeCompare(
            String(
              a.created_at || ""
            )
          );


        if (dateCompare !== 0) {

          return dateCompare;

        }


        return (
          Number(b.id || 0)
          -
          Number(a.id || 0)
        );

      });


  if (!list.length) {

    grid.innerHTML = `
      <div class="empty">
        কোনো পোস্ট পাওয়া যায়নি।
      </div>
    `;

    return;

  }


  list.forEach(video => {

    const card =
      document.createElement(
        "article"
      );

    card.className = "card";


    card.innerHTML = `

      <div
        class="thumb"
        data-open="1"
      >

        ${thumbMarkup(video)}

      </div>


      <div class="card-body">

        <h3 data-open="1">
          ${escapeHtml(
            video.title
          )}
        </h3>


        <div class="meta">

          <span>
            ▸ ${formatViews(
              video.views
            )} views
          </span>

          <span>
            ${formatDate(
              video.created_at
            )}
          </span>

          <span>
            ${escapeHtml(
              video.category ||
              "Video"
            )}
          </span>

        </div>


        <button
          class="open-btn"
        >
          🔒 Watch Ad
        </button>

      </div>

    `;


    /*
      Thumbnail click
      = same modal
    */

    card
      .querySelectorAll(
        '[data-open="1"]'
      )
      .forEach(element => {

        element.onclick =
          () => openVideo(video);

      });


    /*
      Watch Ad click
      = same modal
    */

    card
      .querySelector(
        ".open-btn"
      )
      .onclick =
      () => openVideo(video);


    grid.appendChild(card);

  });

}


/* =========================
   OPEN MODAL
========================= */

function openVideo(video) {

  selected = video;

  adsWatched = 0;


  modalTitle.textContent =
    video.title ||
    "Video";


  modalViews.textContent =
    `▸ ${formatViews(
      video.views
    )} views`;


  modalDate.textContent =
    formatDate(
      video.created_at
    );


  modalCategory.textContent =
    video.category ||
    "Video";


  modalText.textContent =
    `Watch ${REQUIRED_ADS} ads to unlock this video.`;


  preview.innerHTML =
    thumbMarkup(
      video,
      true
    );


  updateUnlock();


  modal.classList.remove(
    "hidden"
  );

}


/* =========================
   UPDATE AD PROGRESS
========================= */

function updateUnlock() {

  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${REQUIRED_ADS})`;


  const percentage =
    Math.min(
      adsWatched /
      REQUIRED_ADS *
      100,
      100
    );


  progressBar.style.width =
    `${percentage}%`;


  progressText.textContent =
    `${adsWatched} / ${REQUIRED_ADS} Ads Completed`;


  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    videoBtn.disabled =
      false;

    videoBtn.classList.add(
      "unlocked"
    );

    videoBtn.textContent =
      "▶ Watch Video";


    modalText.textContent =
      "ভিডিও আনলক হয়েছে। এখন Watch Video চাপুন।";

  }

  else {

    videoBtn.disabled =
      true;

    videoBtn.classList.remove(
      "unlocked"
    );

    videoBtn.textContent =
      "🔒 Video Locked";

  }

}


/* =========================
   TADS CONTROLLER
========================= */

function createAdController() {

  if (
    !window.tads ||
    typeof window.tads.init !==
    "function"
  ) {

    console.error(
      "TADS widget.js is not loaded"
    );

    return null;

  }


  try {

    return window.tads.init({

      widgetId:
        WIDGET_ID,

      type:
        "fullscreen",

      debug:
        false,


      /*
        IMPORTANT:

        Counter only increases
        after TADS reward callback.
      */

      onShowReward:
        result => {

          console.log(
            "TADS reward:",
            result
          );


          if (
            rewardGrantedThisAd
          ) {

            return;

          }


          rewardGrantedThisAd =
            true;


          adShowing =
            false;


          if (
            adsWatched <
            REQUIRED_ADS
          ) {

            adsWatched++;

          }


          updateUnlock();


          watchAdBtn.disabled =
            false;


          if (
            adsWatched <
            REQUIRED_ADS
          ) {

            modalText.textContent =
              `Ad completed. আরও ${
                REQUIRED_ADS -
                adsWatched
              }টি ad দেখুন।`;

          }

        },


      onAdsNotFound:
        () => {

          console.log(
            "TADS: No ad found"
          );


          adShowing =
            false;


          watchAdBtn.disabled =
            false;


          updateUnlock();


          modalText.textContent =
            "এই মুহূর্তে কোনো ad পাওয়া যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।";

        }

    });

  }

  catch (error) {

    console.error(
      "TADS init error:",
      error
    );

    return null;

  }

}


/* =========================
   SHOW REWARDED AD
========================= */

async function showRewardedAd() {

  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    return;

  }


  if (adShowing) {

    return;

  }


  if (!adController) {

    adController =
      createAdController();

  }


  if (
    !adController ||
    typeof adController.showAd !==
    "function"
  ) {

    modalText.textContent =
      "Ad system is not ready. Please try again.";

    return;

  }


  adShowing =
    true;


  rewardGrantedThisAd =
    false;


  watchAdBtn.disabled =
    true;


  watchAdBtn.textContent =
    "Loading Ad...";


  try {

    if (
      typeof adController.loadAd ===
      "function"
    ) {

      await adController.loadAd();

    }


    await adController.showAd();


    if (
      !rewardGrantedThisAd &&
      adShowing
    ) {

      watchAdBtn.textContent =
        "Ad is showing...";

    }

  }

  catch (error) {

    console.error(
      "TADS show error:",
      error
    );


    adShowing =
      false;


    watchAdBtn.disabled =
      false;


    updateUnlock();


    modalText.textContent =
      "The ad could not be shown. Please try again.";

  }

}


/* =========================
   LOCAL VIEW COUNT
========================= */

function incrementLocalView(video) {

  const key =
    `dgv_views_${video.id}`;


  const old =
    safeNumber(
      localStorage.getItem(key)
    );


  const next =
    old + 1;


  localStorage.setItem(
    key,
    String(next)
  );


  video.views =
    Math.max(
      safeNumber(video.views),
      next
    );

}


/* =========================
   WATCH VIDEO
========================= */

function openUnlockedVideo() {

  if (!selected) {

    return;

  }


  if (
    adsWatched <
    REQUIRED_ADS
  ) {

    return;

  }


  /*
    View count increases
    only when actual unlocked
    video button is pressed.
  */

  incrementLocalView(
    selected
  );


  modalViews.textContent =
    `▸ ${formatViews(
      selected.views
    )} views`;


  render(
    document
      .querySelector(
        ".tab.active"
      )
      ?.dataset.category
      ||
      "All"
  );


  const url =
    selected.video_url ||
    selected.video;


  if (url) {

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    return;

  }


  modalText.textContent =
    "ভিডিও URL এখনো এই পোস্টে দেওয়া হয়নি। Supabase-এর video_url/video ফিল্ডে URL দিন।";

}


/* =========================
   BUTTON EVENTS
========================= */

watchAdBtn.onclick =
  showRewardedAd;


videoBtn.onclick =
  openUnlockedVideo;


document
  .getElementById(
    "closeModal"
  )
  .onclick =
  () => {

    modal.classList.add(
      "hidden"
    );

  };


modal.onclick =
  event => {

    if (
      event.target ===
      modal
    ) {

      modal.classList.add(
        "hidden"
      );

    }

  };


/* =========================
   CATEGORY TABS
========================= */

document
  .querySelectorAll(
    ".tab"
  )
  .forEach(button => {

    button.onclick =
      () => {

        document
          .querySelectorAll(
            ".tab"
          )
          .forEach(item => {

            item.classList.remove(
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
   RESTORE LOCAL VIEWS
========================= */

videos.forEach(video => {

  const saved =
    safeNumber(
      localStorage.getItem(
        `dgv_views_${video.id}`
      )
    );


  if (
    saved >
    safeNumber(video.views)
  ) {

    video.views =
      saved;

  }

});


/* =========================
   START APP
========================= */

render();
