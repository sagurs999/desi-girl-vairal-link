const tg = window.Telegram && window.Telegram.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaG9mdGd1YmZia3Z5bm5kdG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDkwOTQsImV4cCI6MjEwMjIyNTA5NH0.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";

const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;

const videos = [];

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


/* Telegram user */

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
  const user = tg.initDataUnsafe.user;
  tgUser.textContent = user.first_name || "Telegram User";
}


/* =========================================================
   LOAD POSTS FROM SUPABASE
   ========================================================= */

async function loadPosts() {

  videoGrid.innerHTML = `
    <div style="
      width:100%;
      text-align:center;
      padding:40px 10px;
      color:#aaa;
    ">
      Loading videos...
    </div>
  `;

  try {

    const response = await fetch(
      `${POSTS_API}?select=*`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Supabase error: ${response.status}`
      );
    }

    const data = await response.json();

    videos.length = 0;

    data.forEach(post => {

      videos.push({
        id: post.id,
        title: post.title || "Untitled Video",

        category:
          post.category || "Trending",

        thumbnail:
          post.thumbnail_url ||
          post.thumbnail ||
          "",

        videoUrl:
          post.video_url ||
          post.video ||
          ""
      });

    });

    render("All");

  } catch (error) {

    console.error(
      "Failed to load posts:",
      error
    );

    videoGrid.innerHTML = `
      <div style="
        text-align:center;
        padding:40px 15px;
        color:#ff6b6b;
      ">
        <h3>Unable to load videos</h3>
        <p>Please try again later.</p>
      </div>
    `;

  }

}


/* =========================================================
   RENDER VIDEO CARDS
   ========================================================= */

function render(category = "All") {

  videoGrid.innerHTML = "";

  const filteredVideos =
    category === "All"
      ? videos
      : videos.filter(
          video => video.category === category
        );

  if (!filteredVideos.length) {

    videoGrid.innerHTML = `
      <div style="
        text-align:center;
        padding:40px;
        color:#aaa;
      ">
        No videos found.
      </div>
    `;

    return;
  }


  filteredVideos.forEach(video => {

    const card =
      document.createElement("article");

    card.className = "card";


    const thumbnailHTML =
      video.thumbnail
        ? `
          <img
            src="${escapeHTML(video.thumbnail)}"
            alt="${escapeHTML(video.title)}"
            loading="lazy"
          >
        `
        : `
          <div class="thumb-placeholder">
            🎬
          </div>
        `;


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

        <button class="open-btn">
          Watch Ad
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


/* =========================================================
   OPEN VIDEO MODAL
   ========================================================= */

function openVideo(video) {

  selectedVideo = video;

  adsWatched = 0;

  adLoading = false;

  modalTitle.textContent =
    video.title;

  modalText.textContent =
    "Watch 3 ads to unlock this video.";

  preview.innerHTML =
    video.thumbnail
      ? `
        <img
          src="${escapeHTML(video.thumbnail)}"
          alt=""
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            border-radius:15px;
          "
        >
      `
      : "🎬";


  modal.classList.remove("hidden");

  videoBtn.disabled = true;

  videoBtn.textContent =
    "🔒 Video Locked";

  updateUnlockUI();

}


/* =========================================================
   UPDATE AD / UNLOCK UI
   ========================================================= */

function updateUnlockUI() {

  watchAdBtn.textContent =
    `Watch Ad (${adsWatched}/${requiredAds})`;


  const percent =
    (adsWatched / requiredAds) * 100;


  progressBar.style.width =
    `${percent}%`;


  if (adsWatched >= requiredAds) {

    videoBtn.disabled = false;

    videoBtn.textContent =
      "▶ Watch Video";

    modalText.textContent =
      "🎉 All ads completed! Your video is unlocked.";

    watchAdBtn.disabled = true;

    watchAdBtn.textContent =
      "✓ Ads Completed";

  } else {

    videoBtn.disabled = true;

    videoBtn.textContent =
      "🔒 Video Locked";

    watchAdBtn.disabled = false;

  }

}


/* =========================================================
   MONETAG REWARDED AD
   ========================================================= */

async function showRewardedAd() {

  if (adLoading) {
    return;
  }

  if (adsWatched >= requiredAds) {
    return;
  }


  adLoading = true;

  watchAdBtn.disabled = true;

  watchAdBtn.textContent =
    "Loading Ad...";


  try {

    if (
      typeof window.show_11571866 !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    /*
      IMPORTANT:

      Counter is NOT increased here.

      It increases ONLY after the
      Monetag promise resolves.
    */

    const result =
      await window.show_11571866();


    adsWatched++;

    console.log(
      "Monetag ad completed:",
      result
    );


    updateUnlockUI();


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


/* =========================================================
   WATCH VIDEO
   ========================================================= */

videoBtn.addEventListener(
  "click",
  () => {

    if (!selectedVideo) {
      return;
    }

    if (adsWatched < requiredAds) {
      return;
    }


    /*
      Send only the post ID.

      video.html will load the
      correct video from Supabase.
    */

    const videoId =
      encodeURIComponent(
        selectedVideo.id
      );


    window.location.href =
      `video.html?id=${videoId}`;

  }
);


/* =========================================================
   CLOSE MODAL
   ========================================================= */

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


/* =========================================================
   CATEGORY TABS
   ========================================================= */

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


/* START */

loadPosts();
