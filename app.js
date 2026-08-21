/* =========================================================
   DESI GIRL VIRAL LINK
   COMPLETE APP.JS
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


/*
   IMPORTANT:

   This is your NEW Supabase Publishable Key.

   Do NOT put this key inside:
   Authorization: Bearer ...

   It is used only in:
   apikey: ...
*/

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2L716MuF36gsDT5fGu_k9Q_LzGLqTk0";


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

const REQUIRED_ADS =
  3;


/* =========================================================
   STATE
========================================================= */

const videos = [];

let selectedVideo = null;

let adsWatched = 0;

let adLoading = false;

let rewardRequestActive = false;


/* =========================================================
   DOM
========================================================= */

const videoGrid =
  document.getElementById(
    "videoGrid"
  );

const modal =
  document.getElementById(
    "modal"
  );

const modalTitle =
  document.getElementById(
    "modalTitle"
  );

const modalText =
  document.getElementById(
    "modalText"
  );

const preview =
  document.getElementById(
    "preview"
  );

const watchAdBtn =
  document.getElementById(
    "watchAdBtn"
  );

const videoBtn =
  document.getElementById(
    "videoBtn"
  );

const progressBar =
  document.getElementById(
    "progressBar"
  );

const adCount =
  document.getElementById(
    "adCount"
  );

const closeModal =
  document.getElementById(
    "closeModal"
  );

const tgUser =
  document.getElementById(
    "tgUser"
  );


/* =========================================================
   TELEGRAM USER
========================================================= */

if (
  tg &&
  tg.initDataUnsafe &&
  tg.initDataUnsafe.user &&
  tgUser
) {

  const user =
    tg.initDataUnsafe.user;

  tgUser.textContent =
    user.first_name ||
    "Telegram User";
}


/* =========================================================
   SUPABASE REQUEST HEADERS
========================================================= */

/*
   VERY IMPORTANT:

   New Supabase publishable keys are NOT JWT keys.

   Therefore:

   GOOD:
   apikey: sb_publishable_...

   NOT:
   Authorization: Bearer sb_publishable_...

   Supabase REST API requires the API key
   through the apikey header.
*/

function getSupabaseHeaders() {

  return {

    apikey:
      SUPABASE_PUBLISHABLE_KEY,

    "Content-Type":
      "application/json"

  };

}


/* =========================================================
   LOAD POSTS
========================================================= */

async function loadPosts() {

  if (!videoGrid) {
    return;
  }


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


    console.log(
      "Loading Supabase posts..."
    );


    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers:
            getSupabaseHeaders(),

          cache:
            "no-store"
        }
      );


    /* =====================================================
       ERROR
    ===================================================== */

    if (!response.ok) {

      let errorMessage =
        `Supabase HTTP ${response.status}`;


      try {

        const errorData =
          await response.json();


        if (
          errorData &&
          errorData.message
        ) {

          errorMessage =
            errorData.message;

        } else if (
          errorData &&
          errorData.error
        ) {

          errorMessage =
            errorData.error;

        }

      } catch (_) {

        const text =
          await response.text();

        if (text) {
          errorMessage =
            text;
        }

      }


      throw new Error(
        `Supabase ${response.status}: ${errorMessage}`
      );

    }


    /* =====================================================
       JSON
    ===================================================== */

    const data =
      await response.json();


    console.log(
      "Supabase posts:",
      data
    );


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


    /* =====================================================
       RENDER
    ===================================================== */

    render(
      "All"
    );


  } catch (error) {

    console.error(
      "Supabase load error:",
      error
    );


    showLoadError(
      error
    );

  }

}


/* =========================================================
   SHOW LOAD ERROR
========================================================= */

function showLoadError(
  error
) {

  if (!videoGrid) {
    return;
  }


  const message =
    error &&
    error.message
      ? error.message
      : "Failed to load videos.";


  videoGrid.innerHTML = `

    <div class="error-box">

      <h3>
        Unable to load videos
      </h3>

      <p>
        ${escapeHTML(
          message
        )}
      </p>

      <button
        id="retryVideosBtn"
        type="button"
        class="open-btn"
        style="
          margin-top:15px;
          width:100%;
        "
      >
        🔄 Retry
      </button>

    </div>

  `;


  const retryBtn =
    document.getElementById(
      "retryVideosBtn"
    );


  if (retryBtn) {

    retryBtn.addEventListener(
      "click",
      loadPosts
    );

  }

}


/* =========================================================
   RENDER VIDEOS
========================================================= */

function render(
  category = "All"
) {

  if (!videoGrid) {
    return;
  }


  videoGrid.innerHTML = "";


  const selectedCategory =
    String(
      category || "All"
    ).toLowerCase();


  const filteredVideos =
    selectedCategory === "all"

      ? videos

      : videos.filter(
          video => {

            return (
              String(
                video.category ||
                ""
              ).toLowerCase()
              ===
              selectedCategory
            );

          }
        );


  /* =====================================================
     NO VIDEOS
  ===================================================== */

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


  /* =====================================================
     VIDEO CARDS
  ===================================================== */

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
         CARD
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

            openVideo(
              video
            );

          }
        );

      }


      /* ===================================================
         THUMBNAIL
      =================================================== */

      const thumb =
        card.querySelector(
          ".thumb"
        );


      if (thumb) {

        thumb.addEventListener(
          "click",
          () => {

            openVideo(
              video
            );

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
   OPEN VIDEO MODAL
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


  /* =====================================================
     TITLE
  ===================================================== */

  if (modalTitle) {

    modalTitle.textContent =
      video.title ||
      "Video";

  }


  /* =====================================================
     BILINGUAL INSTRUCTION
  ===================================================== */

  if (modalText) {

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

  }


  /* =====================================================
     PREVIEW
  ===================================================== */

  if (
    preview
  ) {

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

  }


  /* =====================================================
     OPEN MODAL
  ===================================================== */

  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }


  updateUnlockUI();

}


/* =========================================================
   UPDATE UNLOCK UI
========================================================= */

function updateUnlockUI() {

  /* =====================================================
     COUNTER
  ===================================================== */

  if (adCount) {

    adCount.textContent =
      `${adsWatched} / ${REQUIRED_ADS} Ads Completed`;

  }


  /* =====================================================
     PROGRESS
  ===================================================== */

  const percent =
    Math.min(
      100,
      (
        adsWatched /
        REQUIRED_ADS
      ) * 100
    );


  if (
    progressBar
  ) {

    progressBar.style.width =
      `${percent}%`;

  }


  /* =====================================================
     3/3 COMPLETED
  ===================================================== */

  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    if (
      videoBtn
    ) {

      videoBtn.disabled =
        false;

      videoBtn.textContent =
        "▶ Watch Video";

    }


    if (
      modalText
    ) {

      modalText.textContent =
        "🎉 All ads completed! Your video is unlocked.";

    }


    if (
      watchAdBtn
    ) {

      watchAdBtn.disabled =
        true;

      watchAdBtn.textContent =
        "✓ Ads Completed";

    }


    return;

  }


  /* =====================================================
     STILL LOCKED
  ===================================================== */

  if (
    videoBtn
  ) {

    videoBtn.disabled =
      true;

    videoBtn.textContent =
      "🔒 Video Locked";

  }


  if (
    watchAdBtn
  ) {

    watchAdBtn.disabled =
      false;

    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${REQUIRED_ADS})`;

  }

}


/* =========================================================
   MONETAG SDK READY CHECK
========================================================= */

function getMonetagFunction() {

  const showAd =
    window[
      MONETAG_FUNCTION
    ];


  if (
    typeof showAd !==
    "function"
  ) {

    return null;

  }


  return showAd;

}


/* =========================================================
   WAIT FOR MONETAG SDK
========================================================= */

async function waitForMonetag(
  timeout = 10000
) {

  const start =
    Date.now();


  while (
    Date.now() -
    start <
    timeout
  ) {

    const showAd =
      getMonetagFunction();


    if (
      showAd
    ) {

      return showAd;

    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          250
        )
    );

  }


  return null;

}


/* =========================================================
   SHOW REWARDED AD
========================================================= */

async function showRewardedAd() {

  /* =====================================================
     PREVENT DOUBLE CLICK
  ===================================================== */

  if (
    adLoading ||
    rewardRequestActive
  ) {

    return;

  }


  /* =====================================================
     3/3 ALREADY DONE
  ===================================================== */

  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    return;

  }


  adLoading =
    true;


  rewardRequestActive =
    true;


  if (
    watchAdBtn
  ) {

    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "⏳ Loading Ad...";

  }


  try {

    /* ===================================================
       GET MONETAG FUNCTION
    =================================================== */

    const showAd =
      await waitForMonetag(
        10000
      );


    if (
      !showAd
    ) {

      throw new Error(
        "Monetag SDK is not loaded yet."
      );

    }


    console.log(
      "Opening Monetag Rewarded Ad:",
      MONETAG_ZONE
    );


    /* ===================================================
       SHOW AD

       IMPORTANT:

       Counter is NOT increased here.

       Only after the SDK's promise resolves
       do we consider the rewarded flow completed.
    =================================================== */

    const result =
      await showAd();


    console.log(
      "Monetag rewarded result:",
      result
    );


    /* ===================================================
       REWARD SUCCESS
    =================================================== */

    adsWatched =
      Math.min(
        adsWatched + 1,
        REQUIRED_ADS
      );


    console.log(
      `Reward accepted: ${adsWatched}/${REQUIRED_ADS}`
    );


    updateUnlockUI();


    /*
       IMPORTANT:

       If 3/3 is reached, don't show any
       X/Continue instruction anymore.
    */

    if (
      adsWatched <
      REQUIRED_ADS
    ) {

      if (
        modalText
      ) {

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

      }

    }


  } catch (
    error
  ) {

    console.warn(
      "Monetag rewarded ad did not complete:",
      error
    );


    /*
       VERY IMPORTANT:

       Do NOT increase adsWatched.

       Example:

       0/3 + X = 0/3
       1/3 + X = 1/3
       2/3 + X = 2/3
    */


    updateUnlockUI();


    /*
       Do NOT put:
       "Ad is not available right now"

       after every normal close.

       Keep the normal UI clean.
    */

  } finally {

    adLoading =
      false;


    rewardRequestActive =
      false;


    if (
      adsWatched <
      REQUIRED_ADS &&
      watchAdBtn
    ) {

      watchAdBtn.disabled =
        false;

      watchAdBtn.textContent =
        `▶ Watch Ad (${adsWatched}/${REQUIRED_ADS})`;

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
   WATCH VIDEO
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
        REQUIRED_ADS
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

      if (
        modal
      ) {

        modal.classList.add(
          "hidden"
        );

      }

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
   BOTTOM NAVIGATION
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
    value ?? ""
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
   START
========================================================= */

console.log(
  "Desi Girl Viral Link started."
);

console.log(
  "Supabase:",
  SUPABASE_URL
);

console.log(
  "Monetag zone:",
  MONETAG_ZONE
);


loadPosts();
