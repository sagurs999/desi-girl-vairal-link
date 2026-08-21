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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmZ1YmZia3Z5bm5kdG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDkwOTQsImV4cCI6MjEwMjIyNTA5NH0.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";

const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   MONETAG
========================================================= */

const MONETAG_ZONE =
  "11571866";

const MONETAG_FUNCTION =
  "show_11571866";


/* =========================================================
   SETTINGS
========================================================= */

const requiredAds = 3;


/* =========================================================
   STATE
========================================================= */

const videos = [];

let selectedVideo = null;

let adsWatched = 0;

let adLoading = false;


/*
   This prevents an accidental second click while
   the Monetag ad is already opening.
*/
let rewardRequestActive = false;


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
      `${POSTS_API}` +
      `?select=id,title,category,thumbnail_url,video_url,created_at` +
      `&order=created_at.desc`;


    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            apikey:
              SUPABASE_ANON_KEY,

            Authorization:
              `Bearer ${SUPABASE_ANON_KEY}`,

            "Content-Type":
              "application/json"
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


    render("All");


  } catch (error) {

    console.error(
      "Supabase load error:",
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
            ).toLowerCase() ===
            String(
              category
            ).toLowerCase()
        );


  if (
    filteredVideos.length === 0
  ) {

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


      /* =====================================================
         THUMBNAIL
      ===================================================== */

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


      /* =====================================================
         CARD
      ===================================================== */

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


      /* =====================================================
         WATCH BUTTON
      ===================================================== */

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


      /* =====================================================
         THUMBNAIL CLICK
      ===================================================== */

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

  adsWatched =
    0;

  adLoading =
    false;

  rewardRequestActive =
    false;


  modalTitle.textContent =
    video.title ||
    "Video";


  /*
     BILINGUAL INSTRUCTION

     This is shown BEFORE the user starts the ad.
  */

  modalText.innerHTML = `
    <strong>
      বিজ্ঞাপন দেখার পর Ad-এর ভিতরের
      “Continue” বাটনে ক্লিক করুন।
    </strong>
    <br>
    <span>
      After the ad appears, click the
      “Continue” button inside the ad.
    </span>
  `;


  /* =====================================================
     PREVIEW
  ===================================================== */

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

  /* =====================================================
     COUNTER
  ===================================================== */

  adCount.textContent =
    `${adsWatched} / ${requiredAds} Ads Completed`;


  /* =====================================================
     PROGRESS
  ===================================================== */

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


  /* =====================================================
     UNLOCKED
  ===================================================== */

  if (
    adsWatched >=
    requiredAds
  ) {

    videoBtn.disabled =
      false;

    videoBtn.textContent =
      "▶ Watch Video";


    /*
       IMPORTANT:
       After 3/3, no X/Continue warning.
    */

    modalText.textContent =
      "🎉 All ads completed! Your video is unlocked.";


    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "✓ Ads Completed";


    return;
  }


  /* =====================================================
     LOCKED
  ===================================================== */

  videoBtn.disabled =
    true;

  videoBtn.textContent =
    "🔒 Video Locked";


  watchAdBtn.disabled =
    false;


  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${requiredAds})`;

}


/* =========================================================
   SHOW MONETAG REWARDED AD
========================================================= */

async function showRewardedAd() {

  /*
     Prevent double click
  */

  if (
    adLoading ||
    rewardRequestActive
  ) {

    return;
  }


  /*
     Already completed
  */

  if (
    adsWatched >=
    requiredAds
  ) {

    return;
  }


  adLoading =
    true;

  rewardRequestActive =
    true;


  watchAdBtn.disabled =
    true;


  watchAdBtn.textContent =
    "⏳ Loading Ad...";


  /*
     Do NOT increase adsWatched here.

     Count will ONLY increase after
     Monetag's returned Promise resolves.
  */


  try {

    /* ===================================================
       CHECK MONETAG SDK
    =================================================== */

    const showAd =
      window[
        MONETAG_FUNCTION
      ];


    if (
      typeof showAd !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded. Please wait and try again."
      );

    }


    console.log(
      "Opening Monetag Rewarded Ad:",
      MONETAG_ZONE
    );


    /* ===================================================
       SHOW AD

       The user sees the Monetag ad.

       If the user presses X / closes the ad:
       Promise should not be treated as a completed
       reward.

       If the reward/Continue flow completes:
       Promise resolves.
    =================================================== */

    const result =
      await showAd();


    console.log(
      "Monetag Rewarded result:",
      result
    );


    /* ===================================================
       SUCCESS

       ONLY NOW count 1/3, 2/3, 3/3.
    =================================================== */

    adsWatched =
      Math.min(
        adsWatched + 1,
        requiredAds
      );


    /*
       IMPORTANT:
       No "X pressed" message.
       No failure message after a normal close.
    */

    updateUnlockUI();


  } catch (
    error
  ) {

    console.warn(
      "Monetag ad did not complete:",
      error
    );


    /*
       IMPORTANT:

       Count stays exactly the same.

       Example:
       1/3 -> user presses X -> remains 1/3
       2/3 -> user presses X -> remains 2/3
    */


    updateUnlockUI();


  } finally {

    adLoading =
      false;

    rewardRequestActive =
      false;


    /*
       If not unlocked, allow retry.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      watchAdBtn.disabled =
        false;

      watchAdBtn.textContent =
        `▶ Watch Ad (${adsWatched}/${requiredAds})`;

    }

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


      const videoId =
        encodeURIComponent(
          selectedVideo.id
        );


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
