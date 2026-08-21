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


/*
  আপনার বর্তমান Supabase anon public key
*/

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmxlIiwicmVmIjoibXNob2Z0Z3ViZmJrdnluZG10bnUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NjY0OTA5NCwiZXhwIjoyMTAyMjI1MDk0fQ.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";


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
   LOAD POSTS
========================================================= */

async function loadPosts() {

  videoGrid.innerHTML = `
    <div class="loading">
      Loading videos...
    </div>
  `;


  try {

    console.log(
      "Loading Supabase posts..."
    );


    /*
      IMPORTANT:

      Only select columns that are required.

      created_at is NOT required for
      displaying the videos.
    */

    const url =
      `${POSTS_API}?select=id,title,category,thumbnail_url,video_url`;


    console.log(
      "Supabase URL:",
      url
    );


    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {

            "apikey":
              SUPABASE_ANON_KEY,

            "Authorization":
              `Bearer ${SUPABASE_ANON_KEY}`,

            "Accept":
              "application/json"

          }

        }
      );


    /* =====================================================
       HTTP ERROR
    ===================================================== */

    if (
      !response.ok
    ) {

      const errorText =
        await response.text();


      console.error(
        "Supabase error:",
        response.status,
        errorText
      );


      throw new Error(
        `Supabase Error ${response.status}: ${errorText}`
      );

    }


    /* =====================================================
       JSON
    ===================================================== */

    const data =
      await response.json();


    console.log(
      "Supabase data:",
      data
    );


    /* =====================================================
       CHECK ARRAY
    ===================================================== */

    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Supabase did not return a video list."
      );

    }


    /* =====================================================
       CLEAR OLD VIDEOS
    ===================================================== */

    videos.length = 0;


    /* =====================================================
       CONVERT POSTS
    ===================================================== */

    data.forEach(
      post => {

        /*
          Ignore completely empty rows.
        */

        if (
          !post ||
          !post.id
        ) {

          return;

        }


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
            ""

        });

      }
    );


    console.log(
      "Videos loaded:",
      videos.length
    );


    /* =====================================================
       NO DATA
    ===================================================== */

    if (
      videos.length === 0
    ) {

      videoGrid.innerHTML = `
        <div class="loading">

          <h3>
            No videos found
          </h3>

          <p>
            Supabase returned 0 posts.
          </p>

        </div>
      `;

      return;

    }


    /* =====================================================
       SHOW VIDEOS
    ===================================================== */

    render(
      "All"
    );


  } catch (error) {

    console.error(
      "Failed to load posts:",
      error
    );


    videoGrid.innerHTML = `

      <div class="error-box">

        <h3>
          ❌ Videos could not be loaded
        </h3>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

        <button
          type="button"
          onclick="loadPosts()"
        >
          🔄 Retry
        </button>

      </div>

    `;

  }

}


/* =========================================================
   RENDER
========================================================= */

function render(
  category = "All"
) {

  videoGrid.innerHTML = "";


  const wantedCategory =
    String(
      category
    )
      .trim()
      .toLowerCase();


  const filteredVideos =
    wantedCategory === "all"

      ? videos

      : videos.filter(
          video => {

            const currentCategory =
              String(
                video.category ||
                ""
              )
                .trim()
                .toLowerCase();


            return (
              currentCategory ===
              wantedCategory
            );

          }
        );


  /* =======================================================
     EMPTY CATEGORY
  ======================================================= */

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


  /* =======================================================
     CREATE VIDEO CARDS
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
        video.thumbnail &&
        String(
          video.thumbnail
        ).trim() !== ""
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
            onerror="this.style.display='none'; this.parentElement.classList.add('thumb-error');"
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
         OPEN BUTTON
      =================================================== */

      const openBtn =
        card.querySelector(
          ".open-btn"
        );


      if (
        openBtn
      ) {

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
         THUMB CLICK
      =================================================== */

      const thumb =
        card.querySelector(
          ".thumb"
        );


      if (
        thumb
      ) {

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


  modalTitle.textContent =
    video.title ||
    "Video";


  modalText.textContent =
    "Watch 3 ads to unlock this video.";


  /* =======================================================
     PREVIEW
  ======================================================= */

  if (
    video.thumbnail &&
    String(
      video.thumbnail
    ).trim() !== ""
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


  adCount.textContent =
    `${adsWatched} / ${requiredAds} Ads Completed`;


  /* =======================================================
     COMPLETE
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
     NOT COMPLETE
  ======================================================= */

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
   MONETAG REWARDED AD
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


  try {

    /* =====================================================
       CHECK MONETAG
    ===================================================== */

    if (
      typeof window.show_11571866 !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded. Check the SDK script in index.html."
      );

    }


    console.log(
      "Opening Monetag rewarded ad..."
    );


    /*
      DO NOT increment the counter
      before this finishes.
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag completed:",
      result
    );


    /*
      Promise completed.
      Count one completed ad.
    */

    adsWatched =
      Math.min(
        requiredAds,
        adsWatched + 1
      );


    updateUnlockUI();


  } catch (
    error
  ) {

    console.error(
      "Rewarded ad failed:",
      error
    );


    /*
      IMPORTANT:
      No counter increase.
    */

    modalText.textContent =
      "Ad could not be completed. Please tap Watch Ad and try again.";


    watchAdBtn.disabled =
      false;


    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${requiredAds})`;

  } finally {

    adLoading =
      false;

  }

}


/* =========================================================
   WATCH AD
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
        requiredAds
      ) {

        return;

      }


      /*
        Open video.html with post ID.
      */

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
   OUTSIDE MODAL
========================================================= */

if (
  modal
) {

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
