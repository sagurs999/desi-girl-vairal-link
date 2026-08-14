/* =========================================================
   DESI GIRL VIRAL LINK
   SUPABASE + TELEGRAM + MONETAG
   ========================================================= */


/* =========================================================
   TELEGRAM
   ========================================================= */

const tg =
  window.Telegram &&
  window.Telegram.WebApp;


if (tg) {

  tg.ready();

  tg.expand();

}


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";


const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaG9mdGd1YmZia3Z5bm5kdG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDkwOTQsImV4cCI6MjEwMjIyNTA5NH0.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


/* =========================================================
   SETTINGS
   ========================================================= */

const REQUIRED_ADS = 3;


/* =========================================================
   VARIABLES
   ========================================================= */

let videos = [];

let selectedCategory = "All";

let selectedVideo = null;

let adLoading = false;


/*
  Each video keeps its own ad counter.

  Example:

  video 1 = 2/3
  video 2 = 0/3
*/

const videoProgress = {};


/* =========================================================
   DOM
   ========================================================= */

const videoGrid =
  document.getElementById(
    "videoGrid"
  );


const loading =
  document.getElementById(
    "loading"
  );


const emptyState =
  document.getElementById(
    "emptyState"
  );


const tgUser =
  document.getElementById(
    "tgUser"
  );


const categoryTabs =
  document.getElementById(
    "categoryTabs"
  );


const videoModal =
  document.getElementById(
    "videoModal"
  );


const modalVideoArea =
  document.getElementById(
    "modalVideoArea"
  );


const modalTitle =
  document.getElementById(
    "modalTitle"
  );


const modalDescription =
  document.getElementById(
    "modalDescription"
  );


const closeModal =
  document.getElementById(
    "closeModal"
  );


/* =========================================================
   TELEGRAM USER
   ========================================================= */

if (
  tg &&
  tg.initDataUnsafe &&
  tg.initDataUnsafe.user
) {

  const user =
    tg.initDataUnsafe.user;


  tgUser.textContent =
    user.first_name ||
    "Telegram User";

}


/* =========================================================
   LOAD POSTS
   ========================================================= */

async function loadPosts() {

  loading.classList.remove(
    "hidden"
  );


  emptyState.classList.add(
    "hidden"
  );


  videoGrid.innerHTML = "";


  try {

    const {
      data,
      error
    } = await supabaseClient

      .from("posts")

      .select(
        "id,title,thumbnail_url,video_url,category,published,created_at"
      )

      .eq(
        "published",
        true
      )

      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {

      console.error(
        "Supabase error:",
        error
      );


      loading.classList.add(
        "hidden"
      );


      emptyState.classList.remove(
        "hidden"
      );


      emptyState.querySelector(
        "h3"
      ).textContent =
        "Database Error";


      emptyState.querySelector(
        "p"
      ).textContent =
        error.message;


      return;

    }


    videos =
      data || [];


    console.log(
      "Supabase posts:",
      videos
    );


    loading.classList.add(
      "hidden"
    );


    if (
      videos.length === 0
    ) {

      emptyState.classList.remove(
        "hidden"
      );

      return;

    }


    /*
      Create progress state
      for each video.
    */

    videos.forEach(
      video => {

        if (
          videoProgress[video.id] ===
          undefined
        ) {

          videoProgress[video.id] = 0;

        }

      }
    );


    renderVideos();


  } catch (error) {

    console.error(
      "Loading error:",
      error
    );


    loading.classList.add(
      "hidden"
    );


    emptyState.classList.remove(
      "hidden"
    );


    emptyState.querySelector(
      "h3"
    ).textContent =
      "Connection Error";


    emptyState.querySelector(
      "p"
    ).textContent =
      "Please try again.";

  }

}


/* =========================================================
   RENDER VIDEOS
   ========================================================= */

function renderVideos() {

  videoGrid.innerHTML = "";


  const filteredVideos =
    selectedCategory === "All"

      ? videos

      : videos.filter(
          video =>
            normalizeCategory(
              video.category
            ) ===
            normalizeCategory(
              selectedCategory
            )
        );


  if (
    filteredVideos.length === 0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

    return;

  }


  emptyState.classList.add(
    "hidden"
  );


  filteredVideos.forEach(
    video => {

      const card =
        createVideoCard(
          video
        );


      videoGrid.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   CREATE VIDEO CARD
   ========================================================= */

function createVideoCard(
  video
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "video-card";


  const watched =
    videoProgress[video.id] || 0;


  const percent =
    Math.min(
      (watched / REQUIRED_ADS) * 100,
      100
    );


  const unlocked =
    watched >= REQUIRED_ADS;


  const title =
    escapeHTML(
      video.title ||
      "Untitled Video"
    );


  const category =
    escapeHTML(
      video.category ||
      "Popular"
    );


  const thumbnail =
    video.thumbnail_url
      ? escapeHTML(
          video.thumbnail_url
        )
      : "";


  let thumbnailHTML = "";


  if (thumbnail) {

    thumbnailHTML = `

      <img
        class="video-thumbnail"
        src="${thumbnail}"
        alt="${title}"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
      >

      <div
        class="thumbnail-fallback hidden"
      >
        🎬
      </div>

    `;

  } else {

    thumbnailHTML = `

      <div
        class="thumbnail-fallback"
      >
        🎬
      </div>

    `;

  }


  card.innerHTML = `

    <div class="thumbnail-container">

      ${thumbnailHTML}

      <div class="thumbnail-overlay">

        <div class="play-circle">
          ▶
        </div>

      </div>

    </div>


    <div class="card-content">

      <h2 class="video-title">
        ${title}
      </h2>


      <p class="video-description">
        ${category}
      </p>


      <div class="progress-container">

        <span
          class="progress-segment
          ${watched >= 1 ? "filled" : ""}"
        ></span>

        <span
          class="progress-segment
          ${watched >= 2 ? "filled" : ""}"
        ></span>

        <span
          class="progress-segment
          ${watched >= 3 ? "filled" : ""}"
        ></span>

      </div>


      <button
        class="watch-button
        ${unlocked ? "unlocked" : ""}"
        data-id="${video.id}"
      >

        ${
          unlocked
            ? "▶ Watch Video"
            : `Watch Ads (${watched}/${REQUIRED_ADS})`
        }

      </button>

    </div>

  `;


  const button =
    card.querySelector(
      ".watch-button"
    );


  button.addEventListener(
    "click",
    () => {

      handleVideoButton(
        video
      );

    }
  );


  /*
    Clicking thumbnail also
    opens the ad/video flow.
  */

  const thumbnailContainer =
    card.querySelector(
      ".thumbnail-container"
    );


  thumbnailContainer.addEventListener(
    "click",
    () => {

      handleVideoButton(
        video
      );

    }
  );


  return card;

}


/* =========================================================
   VIDEO BUTTON
   ========================================================= */

async function handleVideoButton(
  video
) {

  const watched =
    videoProgress[video.id] || 0;


  /*
    Already unlocked
  */

  if (
    watched >= REQUIRED_ADS
  ) {

    openVideo(
      video
    );

    return;

  }


  /*
    Select current video
  */

  selectedVideo =
    video;


  /*
    Show rewarded ad
  */

  await showRewardedAd(
    video
  );

}


/* =========================================================
   MONETAG REWARDED AD
   ========================================================= */

/*
  IMPORTANT

  Your Monetag code is kept:

  data-zone="11571866"
  data-sdk="show_11571866"

  Counter is increased ONLY after:

  await window.show_11571866()

  successfully resolves.
*/

async function showRewardedAd(
  video
) {

  if (adLoading) {

    return;

  }


  const currentCount =
    videoProgress[video.id] || 0;


  if (
    currentCount >= REQUIRED_ADS
  ) {

    openVideo(
      video
    );

    return;

  }


  adLoading = true;


  /*
    Find clicked button
  */

  const button =
    document.querySelector(
      `.watch-button[data-id="${video.id}"]`
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      "Loading Ad...";

  }


  try {

    /*
      Check Monetag
    */

    if (
      typeof window.show_11571866 !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    console.log(
      "Opening Monetag ad..."
    );


    /*
      KEEP MONETAG CODE
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag result:",
      result
    );


    /*
      IMPORTANT:

      Increase counter ONLY
      after Monetag promise resolves.
    */

    videoProgress[video.id] =
      Math.min(
        currentCount + 1,
        REQUIRED_ADS
      );


    const newCount =
      videoProgress[video.id];


    console.log(
      `Ad completed: ${newCount}/${REQUIRED_ADS}`
    );


    /*
      Re-render cards
    */

    renderVideos();


    /*
      If 3 ads completed
    */

    if (
      newCount >= REQUIRED_ADS
    ) {

      showTelegramAlert(
        "🔓 Video unlocked!"
      );

    }


  } catch (error) {

    console.error(
      "Monetag ad error:",
      error
    );


    if (button) {

      button.disabled =
        false;


      button.textContent =
        `Watch Ads (${currentCount}/${REQUIRED_ADS})`;

    }


    showTelegramAlert(
      "Ad is not available right now. Please try again."
    );


  } finally {

    adLoading =
      false;

  }

}


/* =========================================================
   OPEN VIDEO
   ========================================================= */

function openVideo(
  video
) {

  selectedVideo =
    video;


  const watched =
    videoProgress[video.id] || 0;


  if (
    watched < REQUIRED_ADS
  ) {

    showTelegramAlert(
      `Complete ${REQUIRED_ADS - watched} more ad(s) first.`
    );

    return;

  }


  if (
    !video.video_url
  ) {

    showTelegramAlert(
      "Video URL is missing."
    );

    console.error(
      "Missing video_url:",
      video
    );

    return;

  }


  modalTitle.textContent =
    video.title ||
    "Video";


  modalDescription.textContent =
    "🔓 Video unlocked";


  /*
    HTML video
  */

  const videoURL =
    escapeHTML(
      video.video_url
    );


  modalVideoArea.innerHTML = `

    <video
      class="modal-video"
      controls
      autoplay
      playsinline
      preload="metadata"
    >

      <source
        src="${videoURL}"
        type="video/mp4"
      >

      Your browser does not support
      video playback.

    </video>

  `;


  videoModal.classList.remove(
    "hidden"
  );


  /*
    Telegram fullscreen
  */

  if (
    tg &&
    typeof tg.expand ===
    "function"
  ) {

    tg.expand();

  }

}


/* =========================================================
   CLOSE VIDEO
   ========================================================= */

function closeVideo() {

  const video =
    modalVideoArea.querySelector(
      "video"
    );


  if (video) {

    video.pause();

    video.removeAttribute(
      "src"
    );

    video.load();

  }


  modalVideoArea.innerHTML =
    "";


  videoModal.classList.add(
    "hidden"
  );


  selectedVideo =
    null;

}


/* =========================================================
   CLOSE BUTTON
   ========================================================= */

closeModal.addEventListener(
  "click",
  closeVideo
);


/* =========================================================
   MODAL OVERLAY
   ========================================================= */

const modalOverlay =
  document.querySelector(
    ".modal-overlay"
  );


modalOverlay.addEventListener(
  "click",
  closeVideo
);


/* =========================================================
   CATEGORY TABS
   ========================================================= */

categoryTabs
  .querySelectorAll(".tab")
  .forEach(
    tab => {

      tab.addEventListener(
        "click",
        () => {

          categoryTabs
            .querySelectorAll(
              ".tab"
            )
            .forEach(
              item => {

                item.classList.remove(
                  "active"
                );

              }
            );


          tab.classList.add(
            "active"
          );


          selectedCategory =
            tab.dataset.category;


          renderVideos();

        }
      );

    }
  );


/* =========================================================
   NORMALIZE CATEGORY
   ========================================================= */

function normalizeCategory(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   TELEGRAM ALERT
   ========================================================= */

function showTelegramAlert(
  message
) {

  if (
    tg &&
    typeof tg.showAlert ===
    "function"
  ) {

    tg.showAlert(
      message
    );

  } else {

    alert(
      message
    );

  }

}


/* =========================================================
   START
   ========================================================= */

loadPosts();
