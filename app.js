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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaG9mdGd1YmZia3Z5bm5kdG51Iiwicm9sIjoiYW5vbiIsImlhdCI6MTc4NjY0OTA5NCwiZXhwIjoyMTAyMjI1MDk0fQ.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";


const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   SETTINGS
========================================================= */

const REQUIRED_ADS =
  3;


/* =========================================================
   STATE
========================================================= */

let videos = [];

let selectedVideo = null;

let adsWatched = 0;

let adLoading = false;

let adPreloaded = false;


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


/* =========================================================
   TELEGRAM USER ID
========================================================= */

function getTelegramUserId() {

  if (
    tg &&
    tg.initDataUnsafe &&
    tg.initDataUnsafe.user
  ) {

    return String(
      tg.initDataUnsafe.user.id
    );

  }

  return "";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {

    return "Date unavailable";

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "Date unavailable";

  }


  return date.toLocaleDateString(
    "en-CA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  );

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
      published=true খুব গুরুত্বপূর্ণ।
    */

    const url =
      `${POSTS_API}` +
      `?select=id,title,category,thumbnail_url,video_url,created_at,published` +
      `&published=eq.true` +
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

            Accept:
              "application/json"

          }

        }
      );


    if (!response.ok) {

      const text =
        await response.text();

      throw new Error(
        `Supabase ${response.status}: ${text}`
      );

    }


    const data =
      await response.json();


    videos =
      Array.isArray(data)
        ? data.map(
            post => ({

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
                "",

              views:
                Number(
                  post.views || 0
                )

            })
          )
        : [];


    renderVideos(
      "All"
    );


  } catch (error) {

    console.error(
      "POST LOAD ERROR:",
      error
    );


    videoGrid.innerHTML = `

      <div class="error-box">

        <strong>
          Videos load হচ্ছে না
        </strong>

        <br><br>

        ${escapeHTML(
          error.message
        )}

      </div>

    `;

  }

}


/* =========================================================
   RENDER VIDEOS
========================================================= */

function renderVideos(
  category
) {

  videoGrid.innerHTML = "";


  let filtered =
    videos;


  if (
    category !== "All"
  ) {

    filtered =
      videos.filter(
        video =>
          String(
            video.category
          ).toLowerCase()
          ===
          String(
            category
          ).toLowerCase()
      );

  }


  if (
    !filtered.length
  ) {

    videoGrid.innerHTML = `

      <div class="loading">

        এই category-তে কোনো video নেই।

      </div>

    `;

    return;

  }


  filtered.forEach(
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

      let thumbHTML;


      if (
        video.thumbnail
      ) {

        thumbHTML = `

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

        thumbHTML = `

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

          ${thumbHTML}

        </div>


        <div class="card-body">

          <h3 class="card-title">

            ${escapeHTML(
              video.title
            )}

          </h3>


          <div class="card-meta">

            ▸ ${Number(
              video.views || 0
            )} Views

            &nbsp; 📅

            ${escapeHTML(
              formatDate(
                video.createdAt
              )
            )}

            &nbsp;

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


      const button =
        card.querySelector(
          ".open-btn"
        );


      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          openVideo(
            video
          );

        }
      );


      const thumb =
        card.querySelector(
          ".thumb"
        );


      thumb.addEventListener(
        "click",
        () => {

          openVideo(
            video
          );

        }
      );


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
          font-size:55px;
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


  /*
    View count:
    modal open = one view
  */

  recordView(
    video.id
  );

}


/* =========================================================
   RECORD VIEW
========================================================= */

async function recordView(
  postId
) {

  if (!postId) {

    return;

  }


  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/increment_post_view`,
        {
          method: "POST",

          headers: {

            apikey:
              SUPABASE_ANON_KEY,

            Authorization:
              `Bearer ${SUPABASE_ANON_KEY}`,

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              p_post_id:
                String(postId),

              p_telegram_user_id:
                getTelegramUserId() || null

            })

        }
      );


    if (
      response.ok
    ) {

      const result =
        await response.json();

      console.log(
        "View recorded:",
        result
      );

    } else {

      console.warn(
        "View recording failed:",
        await response.text()
      );

    }

  } catch (
    error
  ) {

    console.warn(
      "View error:",
      error
    );

  }

}


/* =========================================================
   UPDATE UNLOCK UI
========================================================= */

function updateUnlockUI() {

  const percent =
    (
      adsWatched /
      REQUIRED_ADS
    ) * 100;


  progressBar.style.width =
    `${percent}%`;


  adCount.textContent =
    `${adsWatched} / ${REQUIRED_ADS} Ads Completed`;


  /* =======================================================
     UNLOCKED
  ======================================================= */

  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "✓ Ads Completed";


    videoBtn.disabled =
      false;

    videoBtn.textContent =
      "▶ Watch Video";


    modalText.textContent =
      "🎉 All ads completed! Video unlocked.";

    return;

  }


  /* =======================================================
     LOCKED
  ======================================================= */

  videoBtn.disabled =
    true;


  videoBtn.textContent =
    "🔒 Video Locked";


  watchAdBtn.disabled =
    false;


  watchAdBtn.textContent =
    `🔒 Watch Ad (${adsWatched}/${REQUIRED_ADS})`;

}


/* =========================================================
   WAIT FOR MONETAG SDK
========================================================= */

async function waitForAdSDK(
  timeout = 10000
) {

  const start =
    Date.now();


  while (
    Date.now() - start
    <
    timeout
  ) {

    if (
      typeof window.show_11571866
      ===
      "function"
    ) {

      return true;

    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          250
        )
    );

  }


  return false;

}


/* =========================================================
   PRELOAD AD
========================================================= */

async function preloadAd() {

  try {

    const ready =
      await waitForAdSDK(
        10000
      );


    if (!ready) {

      console.warn(
        "Monetag SDK not ready for preload."
      );

      return;

    }


    const userId =
      getTelegramUserId();


    const ymid =
      `preload_${userId || "guest"}_${Date.now()}`;


    await window.show_11571866({

      type:
        "preload",

      ymid:
        ymid

    });


    adPreloaded =
      true;


    console.log(
      "Monetag ad preloaded."
    );


  } catch (
    error
  ) {

    adPreloaded =
      false;


    console.warn(
      "Ad preload failed:",
      error
    );

  }

}


/* =========================================================
   SHOW REWARDED AD
========================================================= */

async function showRewardedAd() {

  if (
    adLoading
  ) {

    return;

  }


  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    return;

  }


  adLoading =
    true;


  watchAdBtn.disabled =
    true;


  watchAdBtn.textContent =
    "⏳ Loading Ad...";


  modalText.textContent =
    "Please complete the ad to receive your reward.";


  try {

    /* =====================================================
       WAIT SDK
    ===================================================== */

    const sdkReady =
      await waitForAdSDK(
        10000
      );


    if (!sdkReady) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    /* =====================================================
       UNIQUE YMID
    ===================================================== */

    const telegramId =
      getTelegramUserId();


    const ymid =
      `video_${selectedVideo?.id || "unknown"}_${telegramId || "guest"}_${adsWatched + 1}_${Date.now()}`;


    console.log(
      "Showing Monetag ad:",
      ymid
    );


    /* =====================================================
       SHOW AD

       IMPORTANT:
       adsWatched++ is NOT here.
    ===================================================== */

    const result =
      await window.show_11571866({

        ymid:
          ymid,

        requestVar:
          "video_unlock"

      });


    console.log(
      "Monetag completed:",
      result
    );


    /*
      Only after the Promise resolves:
      increase the counter.
    */

    adsWatched =
      Math.min(
        adsWatched + 1,
        REQUIRED_ADS
      );


    modalText.textContent =
      `Ad ${adsWatched}/${REQUIRED_ADS} completed successfully.`;


    updateUnlockUI();


  } catch (
    error
  ) {

    console.error(
      "Rewarded ad error:",
      error
    );


    modalText.textContent =
      "Ad could not be completed. Please try again.";


    updateUnlockUI();

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
      REQUIRED_ADS
    ) {

      return;

    }


    if (
      !selectedVideo.videoUrl
    ) {

      modalText.textContent =
        "এই পোস্টে video_url দেওয়া নেই।";

      return;

    }


    const id =
      encodeURIComponent(
        selectedVideo.id
      );


    window.location.href =
      `video.html?id=${id}`;

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
   OUTSIDE CLICK
========================================================= */

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
   BOTTOM NAV
========================================================= */

document
  .querySelectorAll(
    ".bottom-nav-btn"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".bottom-nav-btn"
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


          renderVideos(
            button.dataset.category
          );

        }
      );

    }
  );


/* =========================================================
   ESCAPE HTML
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

loadPosts();


/*
  Preload Monetag after app starts.
*/

setTimeout(
  preloadAd,
  1200
);
