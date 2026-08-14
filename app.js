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

const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   SETTINGS
========================================================= */

const REQUIRED_ADS = 3;


/* =========================================================
   STATE
========================================================= */

const videos = [];

let selectedVideo = null;

let adsWatched = 0;

let adLoading = false;


/* =========================================================
   DOM
========================================================= */

const videoGrid =
  document.getElementById("videoGrid");

const modal =
  document.getElementById("modal");

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

const adCounter =
  document.getElementById("adCounter");

const closeModal =
  document.getElementById("closeModal");

const tgUser =
  document.getElementById("tgUser");


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

  videoGrid.innerHTML = `
    <div class="loading">
      Loading videos...
    </div>
  `;

  try {

    const response =
      await fetch(
        `${POSTS_API}?select=*`,
        {
          method: "GET",

          headers: {
            apikey:
              SUPABASE_ANON_KEY,

            Authorization:
              `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Supabase ${response.status}: ${errorText}`
      );

    }


    const data =
      await response.json();


    videos.length = 0;


    data.forEach(post => {

      videos.push({

        id:
          post.id,

        title:
          post.title ||
          "Untitled Video",

        category:
          post.category ||
          "Trending",

        thumbnail:
          post.thumbnail_url ||
          "",

        /*
          IMPORTANT:
          Only video_url
        */

        videoUrl:
          post.video_url ||
          ""

      });

    });


    console.log(
      "Posts loaded:",
      videos
    );


    render("All");


  } catch (error) {

    console.error(
      "LOAD POSTS ERROR:",
      error
    );


    videoGrid.innerHTML = `
      <div class="error-box">

        <h3>
          Unable to load videos
        </h3>

        <p>
          ${escapeHTML(error.message)}
        </p>

      </div>
    `;

  }

}


/* =========================================================
   RENDER
========================================================= */

function render(category = "All") {

  videoGrid.innerHTML = "";


  const filteredVideos =
    category === "All"
      ? videos
      : videos.filter(
          video =>
            String(video.category)
              .toLowerCase() ===
            String(category)
              .toLowerCase()
        );


  if (!filteredVideos.length) {

    videoGrid.innerHTML = `
      <div class="loading">
        No videos found.
      </div>
    `;

    return;
  }


  filteredVideos.forEach(
    video => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "video-card";


      let thumbnailHTML = "";


      if (video.thumbnail) {

        thumbnailHTML = `
          <img
            src="${escapeHTML(video.thumbnail)}"
            alt="${escapeHTML(video.title)}"
            loading="lazy"
          >
        `;

      } else {

        thumbnailHTML = `
          <div class="thumbnail-placeholder">
            🎬
          </div>
        `;

      }


      card.innerHTML = `

        <div class="thumbnail">
          ${thumbnailHTML}
        </div>

        <div class="card-content">

          <div class="card-title">
            ${escapeHTML(video.title)}
          </div>

          <div class="card-category">
            ${escapeHTML(video.category)}
          </div>

          <button
            class="watch-btn">

            🔓 Watch Ad

          </button>

        </div>

      `;


      const button =
        card.querySelector(
          ".watch-btn"
        );


      button.addEventListener(
        "click",
        () => {

          openVideo(video);

        }
      );


      videoGrid.appendChild(card);

    }
  );

}


/* =========================================================
   OPEN VIDEO
========================================================= */

function openVideo(video) {

  selectedVideo =
    video;

  adsWatched = 0;

  adLoading = false;


  modalTitle.textContent =
    video.title;


  modalText.textContent =
    "Watch 3 ads to unlock this video.";


  if (video.thumbnail) {

    preview.innerHTML = `
      <img
        src="${escapeHTML(video.thumbnail)}"
        alt=""
      >
    `;

  } else {

    preview.textContent =
      "🎬";

  }


  modal.classList.remove(
    "hidden"
  );


  updateUnlockUI();

}


/* =========================================================
   UPDATE UI
========================================================= */

function updateUnlockUI() {

  const percent =
    (
      adsWatched /
      REQUIRED_ADS
    ) * 100;


  progressBar.style.width =
    `${percent}%`;


  adCounter.textContent =
    `${adsWatched} / ${REQUIRED_ADS} Ads Completed`;


  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "✓ All Ads Completed";


    videoBtn.disabled =
      false;

    videoBtn.textContent =
      "▶ Watch Video";


    modalText.textContent =
      "🎉 All ads completed! Your video is unlocked.";

  } else {

    watchAdBtn.disabled =
      false;

    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${REQUIRED_ADS})`;


    videoBtn.disabled =
      true;

    videoBtn.textContent =
      "🔒 Video Locked";

  }

}


/* =========================================================
   MONETAG REWARDED AD
========================================================= */

async function showRewardedAd() {

  if (adLoading) {
    return;
  }


  if (
    adsWatched >=
    REQUIRED_ADS
  ) {
    return;
  }


  adLoading = true;

  watchAdBtn.disabled =
    true;

  watchAdBtn.textContent =
    "⏳ Loading Ad...";


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
      VERY IMPORTANT

      Do NOT increment the counter
      before this promise resolves.

      The counter is increased only
      after the ad function completes.
    */

    const result =
      await window.show_11571866();


    console.log(
      "Rewarded ad completed:",
      result
    );


    /*
      Ad completed successfully
    */

    adsWatched =
      adsWatched + 1;


    updateUnlockUI();


  } catch (error) {

    console.error(
      "AD ERROR:",
      error
    );


    modalText.textContent =
      "⚠️ Ad is not available right now. Please try again.";


    watchAdBtn.disabled =
      false;


    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${REQUIRED_ADS})`;

  } finally {

    adLoading =
      false;

  }

}


/* =========================================================
   AD BUTTON
========================================================= */

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


    if (
      adsWatched <
      REQUIRED_ADS
    ) {

      return;

    }


    if (!selectedVideo.id) {

      alert(
        "Video ID missing."
      );

      return;

    }


    const videoId =
      encodeURIComponent(
        selectedVideo.id
      );


    /*
      Only post ID is sent.

      video.html will get
      video_url from Supabase.
    */

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


/* =========================================================
   CATEGORY BUTTONS
========================================================= */

document
  .querySelectorAll(
    ".category-btn"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".category-btn"
            )
            .forEach(
              btn => {

                btn.classList.remove(
                  "active"
                );

              }
            );


          button.classList.add(
            "active"
          );


          render(
            button.dataset.category
          );

        }
      );

    }
  );


/* =========================================================
   BOTTOM NAV
========================================================= */

document
  .querySelectorAll(
    ".bottom-nav button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".bottom-nav button"
            )
            .forEach(
              btn => {

                btn.classList.remove(
                  "bottom-active"
                );

              }
            );


          button.classList.add(
            "bottom-active"
          );


          const category =
            button.dataset.category ||
            "All";


          document
            .querySelectorAll(
              ".category-btn"
            )
            .forEach(
              btn => {

                btn.classList.toggle(
                  "active",
                  btn.dataset.category ===
                  category
                );

              }
            );


          render(category);

        }
      );

    }
  );


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

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
   START
========================================================= */

loadPosts();
