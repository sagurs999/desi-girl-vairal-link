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

/*
   IMPORTANT:

   This is the correct Supabase project URL.
*/

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";


/*
   NEW SUPABASE PUBLISHABLE KEY

   Use ONLY in apikey header.

   Do NOT use:
   Authorization: Bearer sb_publishable_...
*/

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
  tg.initDataUnsafe.user
) {

  const user =
    tg.initDataUnsafe.user;


  tgUser.textContent =
    user.first_name ||
    "Telegram User";

}


/* =========================================================
   MONETAG SDK CHECK
========================================================= */

function monetagReady() {

  return (
    typeof window.show_11571866 ===
    "function"
  );

}


/* =========================================================
   IN-APP INTERSTITIAL
   SEPARATE FROM REWARDED ADS
========================================================= */

/*
   This is NOT part of the 3-ad unlock counter.

   It is a separate Monetag In-App Interstitial.
*/

function startInAppInterstitial() {

  if (!monetagReady()) {

    console.warn(
      "Monetag SDK is not ready for In-App Interstitial."
    );

    return;

  }


  try {

    window.show_11571866({

      type: "inApp",

      inAppSettings: {

        frequency: 2,

        capping: 0.1,

        interval: 30,

        timeout: 5,

        everyPage: false

      }

    });


    console.log(
      "In-App Interstitial started."
    );


  } catch (error) {

    console.error(
      "In-App Interstitial error:",
      error
    );

  }

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

    /*
       IMPORTANT:

       Only apikey is sent.

       We DO NOT send:
       Authorization: Bearer sb_publishable_...
    */

    const url =
      `${POSTS_API}?select=id,title,category,thumbnail_url,video_url,created_at&order=created_at.desc`;


    console.log(
      "Loading posts from:",
      url
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

          },

          cache:
            "no-store"

        }
      );


    /* =====================================================
       HTTP ERROR
    ====================================================== */

    if (!response.ok) {

      const errorText =
        await response.text();


      throw new Error(
        `Supabase ${response.status}: ${errorText}`
      );

    }


    /* =====================================================
       JSON
    ====================================================== */

    const data =
      await response.json();


    console.log(
      "Supabase posts:",
      data
    );


    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Supabase returned invalid data."
      );

    }


    /* =====================================================
       CLEAR OLD DATA
    ====================================================== */

    videos.length = 0;


    /* =====================================================
       ADD POSTS
    ====================================================== */

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


    /* =====================================================
       RENDER
    ====================================================== */

    render("All");


    console.log(
      `Loaded ${videos.length} videos.`
    );


  } catch (error) {

    console.error(
      "Failed to load posts:",
      error
    );


    /*
       Better error message
       instead of only "Failed to fetch".
    */

    let message =
      error.message ||
      "Unknown error";


    if (
      error.name ===
      "TypeError"
    ) {

      message =
        "Network connection failed. Please check your Supabase Project URL, Publishable Key, and RLS SELECT policy.";

    }


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


  /* =======================================================
     NO VIDEO
  ====================================================== */

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
  ====================================================== */

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
      ================================================== */

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

          <div
            class="thumb-placeholder"
          >
            🎬
          </div>

        `;

      }


      /* ===================================================
         CARD HTML
      ================================================== */

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
      ================================================== */

      const openBtn =
        card.querySelector(
          ".open-btn"
        );


      openBtn.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          openVideo(
            video
          );

        }
      );


      /* ===================================================
         THUMBNAIL CLICK
      ================================================== */

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


  modalTitle.textContent =
    video.title ||
    "Video";


  /*
     IMPORTANT:

     No error message here.

     The X/close message will only appear
     when an actual rewarded ad is closed
     before completion.
  */

  modalText.textContent =
    "Watch 3 ads to unlock this video.";


  /* =======================================================
     PREVIEW
  ====================================================== */

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
  ====================================================== */

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
  ====================================================== */

  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${requiredAds})`;


  adCount.textContent =
    `${adsWatched} / ${requiredAds} Ads Completed`;


  /* =======================================================
     PROGRESS
  ====================================================== */

  const percent =
    (
      adsWatched /
      requiredAds
    ) * 100;


  progressBar.style.width =
    `${percent}%`;


  /* =======================================================
     UNLOCKED
  ====================================================== */

  if (
    adsWatched >=
    requiredAds
  ) {

    videoBtn.disabled =
      false;


    videoBtn.textContent =
      "▶ Watch Video";


    /*
       After 3 completed ads:
       NO warning/error message.
    */

    modalText.textContent =
      "";


    watchAdBtn.disabled =
      true;


    watchAdBtn.textContent =
      "✓ Ads Completed";


    return;

  }


  /* =======================================================
     LOCKED
  ====================================================== */

  videoBtn.disabled =
    true;


  videoBtn.textContent =
    "🔒 Video Locked";


  watchAdBtn.disabled =
    false;

}


/* =========================================================
   REWARDED AD
========================================================= */

async function showRewardedAd() {

  if (
    adLoading
  ) {

    return;

  }


  if (
    adsWatched >=
    requiredAds
  ) {

    return;

  }


  adLoading =
    true;


  watchAdBtn.disabled =
    true;


  watchAdBtn.textContent =
    "⏳ Loading Ad...";


  /*
     Save current count.

     If user closes the ad,
     the count will NOT increase.
  */

  const previousCount =
    adsWatched;


  try {

    /* =====================================================
       SDK CHECK
    ====================================================== */

    if (
      !monetagReady()
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    console.log(
      "Starting Monetag Rewarded Ad..."
    );


    /* =====================================================
       REWARDED AD
    ====================================================== */

    const result =
      await window.show_11571866();


    console.log(
      "Rewarded ad result:",
      result
    );


    /*
       Only after the SDK promise resolves
       do we count the ad.

       X / close / failed ad:
       NO COUNT.
    */

    adsWatched =
      previousCount + 1;


    updateUnlockUI();


    /*
       IMPORTANT:

       If completed:
       do NOT show the X warning.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      modalText.textContent =
        "";

    }


  } catch (
    error
  ) {

    console.error(
      "Rewarded ad failed or closed:",
      error
    );


    /*
       COUNT DOES NOT CHANGE.
    */

    adsWatched =
      previousCount;


    /*
       X / close / failed:
       show bilingual message.
    */

    modalText.innerHTML = `

      <strong>
        ⚠️ Ad was not completed
      </strong>
      <br>
      আপনি বিজ্ঞাপনটি সম্পূর্ণ না করে বাইরে চলে গেছেন।
      <br>
      You left the ad before completing it.
      <br><br>
      দয়া করে <b>Continue</b> চাপুন এবং বিজ্ঞাপনটি সম্পূর্ণ করুন।
      <br>
      Please tap <b>Continue</b> and complete the ad.

    `;


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

watchAdBtn.addEventListener(
  "click",
  showRewardedAd
);


/* =========================================================
   WATCH VIDEO BUTTON
========================================================= */

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


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

modal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      modal
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


/* =========================================================
   START SEPARATE IN-APP INTERSTITIAL
========================================================= */

/*
   Wait a little so that the page can load first.
*/

setTimeout(
  () => {

    startInAppInterstitial();

  },
  5000
);
