"use strict";


/* =========================================================
   DOODSTREAM CONFIG
========================================================= */

// এখানে আপনার নতুন DoodStream API Key বসাবেন
const DOODSTREAM_API_KEY = "YOUR_DOODSTREAM_API_KEY";


const DOOD_API =
  "https://doodapi.co/api";


/* =========================================================
   MONETAG
========================================================= */

const MONETAG_ZONE = "11571866";

const MONETAG_FUNCTION =
  "show_" + MONETAG_ZONE;

const REQUIRED_ADS = 3;


/* =========================================================
   TELEGRAM
========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {

  tg.ready();

  tg.expand();

  const user =
    tg.initDataUnsafe?.user;

  const tgUser =
    document.getElementById("tgUser");

  if (user) {

    tgUser.textContent =
      user.first_name ||
      user.username ||
      "Telegram User";

  }

}


/* =========================================================
   DOM
========================================================= */

const videoGrid =
  document.getElementById("videoGrid");

const loading =
  document.getElementById("loading");

const errorBox =
  document.getElementById("errorBox");

const errorText =
  document.getElementById("errorText");

const emptyBox =
  document.getElementById("emptyBox");

const retryBtn =
  document.getElementById("retryBtn");

const refreshBtn =
  document.getElementById("refreshBtn");

const unlockModal =
  document.getElementById("unlockModal");

const closeModal =
  document.getElementById("closeModal");

const watchAdBtn =
  document.getElementById("watchAdBtn");

const openVideoBtn =
  document.getElementById("openVideoBtn");

const progressFill =
  document.getElementById("progressFill");

const adCounter =
  document.getElementById("adCounter");


/* =========================================================
   VARIABLES
========================================================= */

let videos = [];

let selectedVideo = null;

let adsWatched = 0;

let currentCategory = "all";


/* =========================================================
   DOODSTREAM REQUEST
========================================================= */

async function doodRequest(endpoint, params = {}) {

  const url =
    new URL(
      `${DOOD_API}/${endpoint}`
    );

  url.searchParams.set(
    "key",
    DOODSTREAM_API_KEY
  );


  Object.entries(params).forEach(
    ([key, value]) => {

      if (
        value !== undefined &&
        value !== null
      ) {

        url.searchParams.set(
          key,
          value
        );

      }

    }
  );


  const response =
    await fetch(url.toString());


  if (!response.ok) {

    throw new Error(
      `DoodStream HTTP ${response.status}`
    );

  }


  const json =
    await response.json();


  if (
    json.status !== undefined &&
    Number(json.status) !== 200
  ) {

    throw new Error(
      json.msg ||
      "DoodStream API error"
    );

  }


  return json;

}


/* =========================================================
   LOAD ROOT FILES
========================================================= */

async function loadPosts() {

  showLoading();

  try {

    /*
      fld_id=0
      = root folder
    */

    const data =
      await doodRequest(
        "folder/list",
        {
          fld_id: 0,
          only_folders: 0
        }
      );


    const result =
      data.result || {};


    const files =
      Array.isArray(result.files)
        ? result.files
        : [];


    videos =
      files
        .map(normalizeFile)
        .filter(Boolean);


    /*
      Newest first
    */

    videos.sort(
      (a, b) =>
        getTime(b.uploaded) -
        getTime(a.uploaded)
    );


    hideLoading();


    if (!videos.length) {

      videoGrid.innerHTML = "";

      emptyBox.classList.remove(
        "hidden"
      );

      return;

    }


    emptyBox.classList.add(
      "hidden"
    );


    render();


  } catch (error) {

    console.error(error);

    hideLoading();

    showError(
      error.message ||
      "Unable to load videos."
    );

  }

}


/* =========================================================
   NORMALIZE DOODSTREAM FILE
========================================================= */

function normalizeFile(file) {

  if (!file) {
    return null;
  }


  const code =
    file.file_code ||
    file.filecode ||
    file.code;


  if (!code) {
    return null;
  }


  return {

    id: code,

    fileCode: code,

    title:
      file.title ||
      file.name ||
      "Untitled Video",

    thumbnail:
      file.single_img ||
      file.splash_img ||
      file.image ||
      "",

    duration:
      file.length ||
      file.duration ||
      "",

    views:
      file.views ||
      0,

    uploaded:
      file.uploaded ||
      "",

    folderId:
      file.fld_id ||
      0,

    canPlay:
      file.canplay !== false

  };

}


/* =========================================================
   RENDER
========================================================= */

function render() {

  let list = [...videos];


  if (currentCategory === "trending") {

    list.sort(
      (a, b) =>
        Number(b.views || 0) -
        Number(a.views || 0)
    );

  }


  videoGrid.innerHTML = "";


  list.forEach(video => {

    const card =
      document.createElement("article");

    card.className =
      "video-card";


    card.innerHTML = `

      <div class="video-thumb">

        ${
          video.thumbnail

          ?

          `<img
            src="${escapeHtml(video.thumbnail)}"
            alt="${escapeHtml(video.title)}"
            loading="lazy"
          >`

          :

          `<div class="no-thumb">
            🎬
          </div>`
        }


        <div class="video-play">
          ▶
        </div>


        ${
          video.duration

          ?

          `<span class="duration">
            ${escapeHtml(video.duration)}
          </span>`

          :

          ""
        }

      </div>


      <div class="video-info">

        <h3>
          ${escapeHtml(video.title)}
        </h3>


        <div class="video-meta">

          <span>
            👁 ${formatNumber(video.views)}
          </span>

          <span>
            🔒 Locked
          </span>

        </div>


        <button
          class="open-video-btn"
          data-id="${escapeHtml(video.fileCode)}"
        >
          🔓 Unlock Video
        </button>

      </div>

    `;


    const button =
      card.querySelector(
        ".open-video-btn"
      );


    button.addEventListener(
      "click",
      () => openVideo(video)
    );


    videoGrid.appendChild(card);

  });

}


/* =========================================================
   OPEN VIDEO
========================================================= */

function openVideo(video) {

  selectedVideo =
    video;

  adsWatched = 0;

  updateProgress();


  openVideoBtn.classList.add(
    "hidden"
  );

  watchAdBtn.classList.remove(
    "hidden"
  );

  unlockModal.classList.remove(
    "hidden"
  );


  /*
    Already unlocked?
  */

  const unlocked =
    sessionStorage.getItem(
      `video_unlocked_${video.fileCode}`
    );


  if (unlocked === "1") {

    adsWatched =
      REQUIRED_ADS;

    updateProgress();

  }

}


/* =========================================================
   WATCH AD
========================================================= */

watchAdBtn.addEventListener(
  "click",
  async () => {

    if (!selectedVideo) {
      return;
    }


    if (adsWatched >= REQUIRED_ADS) {

      unlockVideo();

      return;

    }


    watchAdBtn.disabled = true;

    watchAdBtn.textContent =
      "Loading Ad...";


    try {

      /*
        Monetag rewarded/interstitial
      */

      if (
        typeof window[MONETAG_FUNCTION]
        === "function"
      ) {

        await window[
          MONETAG_FUNCTION
        ]();

      } else {

        /*
          If Monetag is not loaded,
          don't automatically reward.
        */

        throw new Error(
          "Monetag ad is not ready."
        );

      }


      /*
        Reward ONLY after ad promise
        completes successfully.
      */

      adsWatched++;

      updateProgress();


      if (
        adsWatched >= REQUIRED_ADS
      ) {

        unlockVideo();

      }


    } catch (error) {

      console.error(
        "Ad error:",
        error
      );


      alert(
        "Ad could not be completed. Please try again."
      );


    } finally {

      watchAdBtn.disabled =
        false;

      watchAdBtn.textContent =
        "▶ Watch Ad";

    }

  }
);


/* =========================================================
   UNLOCK VIDEO
========================================================= */

function unlockVideo() {

  if (!selectedVideo) {
    return;
  }


  sessionStorage.setItem(
    `video_unlocked_${selectedVideo.fileCode}`,
    "1"
  );


  watchAdBtn.classList.add(
    "hidden"
  );


  openVideoBtn.classList.remove(
    "hidden"
  );


  openVideoBtn.onclick =
    () => {

      window.location.href =
        `video.html?id=${
          encodeURIComponent(
            selectedVideo.fileCode
          )
        }`;

    };


  adCounter.textContent =
    "✅ Video Unlocked";

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

  const percentage =
    Math.min(
      100,
      (adsWatched /
        REQUIRED_ADS) * 100
    );


  progressFill.style.width =
    percentage + "%";


  adCounter.textContent =
    `${adsWatched} / ${REQUIRED_ADS} Ads Completed`;

}


/* =========================================================
   CLOSE MODAL
========================================================= */

closeModal.addEventListener(
  "click",
  () => {

    unlockModal.classList.add(
      "hidden"
    );

  }
);


unlockModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      unlockModal
    ) {

      unlockModal.classList.add(
        "hidden"
      );

    }

  }
);


/* =========================================================
   CATEGORY
========================================================= */

document
  .querySelectorAll(".category")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".category")
          .forEach(btn =>
            btn.classList.remove(
              "active"
            )
          );


        button.classList.add(
          "active"
        );


        currentCategory =
          button.dataset.category;


        render();

      }
    );

  });


/* =========================================================
   REFRESH
========================================================= */

retryBtn.addEventListener(
  "click",
  loadPosts
);


refreshBtn.addEventListener(
  "click",
  loadPosts
);


/* =========================================================
   UI HELPERS
========================================================= */

function showLoading() {

  loading.classList.remove(
    "hidden"
  );

  errorBox.classList.add(
    "hidden"
  );

  emptyBox.classList.add(
    "hidden"
  );

}


function hideLoading() {

  loading.classList.add(
    "hidden"
  );

}


function showError(message) {

  errorBox.classList.remove(
    "hidden"
  );

  errorText.textContent =
    message;

}


function getTime(value) {

  if (!value) {
    return 0;
  }

  const time =
    new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;

}


function formatNumber(value) {

  const number =
    Number(value || 0);

  return number.toLocaleString();

}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   START
========================================================= */

loadPosts();
