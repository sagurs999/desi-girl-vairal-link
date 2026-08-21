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
  "https://mshoftgubfbkvynndtn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2L716MuF36gsDT5fGu_k9Q_LzGLqTk0";

const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   STATE
========================================================= */

const videos = [];

let selectedVideo = null;

let adsWatched = 0;

const requiredAds = 3;

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

const adCount =
  document.getElementById("adCount");

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
   LOAD POSTS FROM SUPABASE
========================================================= */

async function loadPosts() {

  videoGrid.innerHTML = `
    <div class="loading">
      Loading videos...
    </div>
  `;


  try {

    const url =
      `${POSTS_API}?select=id,title,category,thumbnail_url,video_url,created_at&order=created_at.desc`;


    console.log(
      "Loading Supabase posts..."
    );


    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            "apikey":
              SUPABASE_PUBLISHABLE_KEY,

            "Content-Type":
              "application/json"
          }
        }
      );


    /* =====================================================
       SUPABASE ERROR
    ===================================================== */

    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Supabase ${response.status}: ${errorText}`
      );
    }


    /* =====================================================
       GET DATA
    ===================================================== */

    const data =
      await response.json();


    console.log(
      "Supabase posts:",
      data
    );


    /* =====================================================
       CLEAR OLD DATA
    ===================================================== */

    videos.length = 0;


    /* =====================================================
       ADD POSTS
    ===================================================== */

    if (
      Array.isArray(data)
    ) {

      data.forEach(
        post => {

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

            videoUrl:
              post.video_url ||
              "",

            createdAt:
              post.created_at ||
              ""

          });

        }
      );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    render("All");


  } catch (error) {

    console.error(
      "Failed to load posts:",
      error
    );


    videoGrid.innerHTML = `
      <div class="error-box">

        <h3>
          Unable to load videos
        </h3>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>
    `;

  }

}


/* =========================================================
   RENDER VIDEOS
========================================================= */

function render(
  category = "All"
) {

  videoGrid.innerHTML = "";


  const filteredVideos =
    category === "All"

      ? videos

      : videos.filter(
          video =>
            String(
              video.category
            ).trim().toLowerCase() ===

            String(
              category
            ).trim().toLowerCase()
        );


  /* =======================================================
     NO VIDEOS
  ======================================================= */

  if (
    !filteredVideos.length
  ) {

    videoGrid.innerHTML = `
      <div class="loading">
        No videos found.
      </div>
    `;

    return;

  }


  /* =======================================================
     CREATE CARDS
  ======================================================= */

  filteredVideos.forEach(
    video => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "video-card";


      /* ===================================================
         THUMBNAIL
      =================================================== */

      let thumbnailHTML;


      if (
        video.thumbnail
      ) {

        thumbnailHTML = `
          <img
            src="${escapeHTML(
              video.thumbnail
            )}"
            alt="${escapeHTML(
              video.title
            )}"
            loading="lazy"
          >
        `;

      } else {

        thumbnailHTML = `
          <div class="thumb-placeholder">
            🎬
          </div>
        `;

      }


      /* ===================================================
         CARD HTML
      =================================================== */

      card.innerHTML = `

        <div class="thumb">
          ${thumbnailHTML}
        </div>

        <div class="card-body">

          <h3>
            ${escapeHTML(
              video.title
            )}
          </h3>

          <div class="meta">
            ${escapeHTML(
              video.category
            )}
          </div>

          <button
            class="open-btn"
            type="button"
          >
            🔒 Watch Ad
          </button>

        </div>

      `;


      /* ===================================================
         WATCH BUTTON
      =================================================== */

      const openBtn =
        card.querySelector(
          ".open-btn"
        );


      if (openBtn) {

        openBtn.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            openVideo(video);

          }
        );

      }


      /* ===================================================
         THUMBNAIL CLICK
      =================================================== */

      const thumb =
        card.querySelector(
          ".thumb"
        );


      if (thumb) {

        thumb.addEventListener(
          "click",
          () => {

            openVideo(video);

          }
        );

      }


      videoGrid.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   OPEN VIDEO
========================================================= */

function openVideo(
  video
) {

  selectedVideo =
    video;


  /* =======================================================
     RESET ONLY FOR NEW VIDEO
  ======================================================= */

  adsWatched =
    0;

  adLoading =
    false;


  /* =======================================================
     TITLE
  ======================================================= */

  modalTitle.textContent =
    video.title ||
    "Video";


  /* =======================================================
     DEFAULT TEXT
  ======================================================= */

  modalText.textContent =
    "Watch 3 ads to unlock this video.";


  /* =======================================================
     PREVIEW
  ======================================================= */

  if (
    video.thumbnail
  ) {

    preview.innerHTML = `
      <img
        src="${escapeHTML(
          video.thumbnail
        )}"
        alt=""
      >
    `;

  } else {

    preview.innerHTML = `
      <div
        style="
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:50px;
        "
      >
        🎬
      </div>
    `;

  }


  /* =======================================================
     SHOW MODAL
  ======================================================= */

  modal.classList.remove(
    "hidden"
  );


  videoBtn.disabled =
    true;

  videoBtn.textContent =
    "🔒 Video Locked";


  watchAdBtn.disabled =
    false;


  updateUnlockUI();

}


/* =========================================================
   UPDATE UNLOCK UI
========================================================= */

function updateUnlockUI() {

  /* =======================================================
     COUNTER
  ======================================================= */

  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${requiredAds})`;


  adCount.textContent =
    `${adsWatched} / ${requiredAds} Ads Completed`;


  /* =======================================================
     PROGRESS
  ======================================================= */

  const percent =
    Math.min(
      100,
      (
        adsWatched /
        requiredAds
      ) * 100
    );


  progressBar.style.width =
    `${percent}%`;


  /* =======================================================
     UNLOCKED
  ======================================================= */

  if (
    adsWatched >=
    requiredAds
  ) {

    videoBtn.disabled =
      false;

    videoBtn.textContent =
      "▶ Watch Video";


    modalText.textContent =
      "🎉 All ads completed! Your video is unlocked.";


    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "✓ Ads Completed";


    return;

  }


  /* =======================================================
     LOCKED
  ======================================================= */

  videoBtn.disabled =
    true;

  videoBtn.textContent =
    "🔒 Video Locked";

}


/* =========================================================
   MONETAG REWARDED AD
========================================================= */

async function showRewardedAd() {

  /* =======================================================
     PREVENT DOUBLE CLICK
  ======================================================= */

  if (
    adLoading
  ) {

    return;

  }


  /* =======================================================
     ALREADY COMPLETE
  ======================================================= */

  if (
    adsWatched >=
    requiredAds
  ) {

    return;

  }


  /* =======================================================
     START LOADING
  ======================================================= */

  adLoading =
    true;

  watchAdBtn.disabled =
    true;

  watchAdBtn.textContent =
    "⏳ Loading Ad...";


  try {

    /* =====================================================
       CHECK MONETAG SDK
    ===================================================== */

    if (
      typeof window.show_11571866 !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    console.log(
      "Starting Monetag Rewarded Ad..."
    );


    /* =====================================================
       SHOW REWARDED AD

       IMPORTANT:
       Counter is NOT increased here.

       It increases only after the SDK
       promise successfully resolves.
    ===================================================== */

    const result =
      await window.show_11571866({
        type: "rewarded"
      });


    console.log(
      "Monetag Rewarded result:",
      result
    );


    /* =====================================================
       AD COMPLETED
    ===================================================== */

    adsWatched =
      Math.min(
        requiredAds,
        adsWatched + 1
      );


    /* =====================================================
       UPDATE UI
    ===================================================== */

    updateUnlockUI();


  } catch (error) {

    console.error(
      "Monetag Rewarded Ad Error:",
      error
    );


    /*
      IMPORTANT:

      DO NOT increase adsWatched.

      User must watch/complete the ad.
    */


    modalText.textContent =
      "Ad is not available right now. Please try again.";


    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${requiredAds})`;


    watchAdBtn.disabled =
      false;

  } finally {

    adLoading =
      false;

  }

}


/* =========================================================
   WATCH AD BUTTON
========================================================= */

if (
  watchAdBtn
) {

  watchAdBtn.addEventListener(
    "click",
    showRewardedAd
  );

}


/* =========================================================
   WATCH VIDEO BUTTON
========================================================= */

if (
  videoBtn
) {

  videoBtn.addEventListener(
    "click",
    () => {

      if (
        !selectedVideo
      ) {

        return;

      }


      if (
        adsWatched <
        requiredAds
      ) {

        return;

      }


      /* ===================================================
         VIDEO ID
      =================================================== */

      const videoId =
        encodeURIComponent(
          selectedVideo.id
        );


      /* ===================================================
         OPEN VIDEO PAGE
      =================================================== */

      window.location.href =
        `video.html?id=${videoId}`;

    }
  );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

if (
  closeModal
) {

  closeModal.addEventListener(
    "click",
    () => {

      modal.classList.add(
        "hidden"
      );

    }
  );

}


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

if (
  modal
) {

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

}


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

          const category =
            button.dataset.bottomCategory;


          /* ===============================================
             ACTIVE BOTTOM BUTTON
          =============================================== */

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


          /* ===============================================
             ACTIVE CATEGORY
          =============================================== */

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


          render(
            category
          );

        }
      );

    }
  );


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value
  )
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
   START APP
========================================================= */

loadPosts();
