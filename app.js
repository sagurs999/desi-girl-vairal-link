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
  Use the NEW Publishable Key.
  Do NOT use the old anon JWT here.
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
   LOAD POSTS FROM SUPABASE
========================================================= */

async function loadPosts() {

  if (!videoGrid) {
    console.error("videoGrid not found");
    return;
  }


  videoGrid.innerHTML = `
    <div class="loading">
      Loading videos...
    </div>
  `;


  try {

    /*
      IMPORTANT:
      Only send the publishable key in the
      apikey header.

      Do NOT send:
      Authorization: Bearer sb_publishable_...
    */

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
            "apikey":
              SUPABASE_PUBLISHABLE_KEY,

            "Accept":
              "application/json"
          },

          cache: "no-store"
        }
      );


    /* =====================================================
       SUPABASE ERROR
    ===================================================== */

    if (!response.ok) {

      let errorMessage =
        `Supabase HTTP ${response.status}`;

      try {

        const errorData =
          await response.json();

        if (errorData.message) {
          errorMessage =
            errorData.message;
        }

        if (errorData.hint) {
          errorMessage +=
            ` ${errorData.hint}`;
        }

      } catch (_) {

        const text =
          await response.text();

        if (text) {
          errorMessage = text;
        }

      }


      throw new Error(
        errorMessage
      );
    }


    /* =====================================================
       GET DATA
    ===================================================== */

    const data =
      await response.json();


    if (!Array.isArray(data)) {

      throw new Error(
        "Supabase returned invalid video data."
      );
    }


    videos.length = 0;


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


    console.log(
      "Videos loaded:",
      videos.length
    );


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

        <button
          id="retryBtn"
          type="button"
          class="retry-btn"
        >
          🔄 Retry
        </button>

      </div>

    `;


    const retryBtn =
      document.getElementById(
        "retryBtn"
      );


    if (retryBtn) {

      retryBtn.addEventListener(
        "click",
        loadPosts
      );

    }

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


  if (modalTitle) {

    modalTitle.textContent =
      video.title ||
      "Video";

  }


  if (modalText) {

    modalText.textContent =
      "Watch 3 ads to unlock this video.";

  }


  /* =======================================================
     PREVIEW
  ======================================================= */

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


  /* =======================================================
     SHOW MODAL
  ======================================================= */

  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }


  if (videoBtn) {

    videoBtn.disabled =
      true;

    videoBtn.textContent =
      "🔒 Video Locked";

  }


  if (watchAdBtn) {

    watchAdBtn.disabled =
      false;

  }


  updateUnlockUI();

}


/* =========================================================
   UPDATE UNLOCK UI
========================================================= */

function updateUnlockUI() {

  if (watchAdBtn) {

    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${requiredAds})`;

  }


  if (adCount) {

    adCount.textContent =
      `${adsWatched} / ${requiredAds} Ads Completed`;

  }


  if (progressBar) {

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

  }


  /* =======================================================
     VIDEO UNLOCKED
  ======================================================= */

  if (
    adsWatched >=
    requiredAds
  ) {

    if (videoBtn) {

      videoBtn.disabled =
        false;

      videoBtn.textContent =
        "▶ Watch Video";

    }


    /*
      IMPORTANT:
      When all 3 ads are completed,
      do NOT show an error message.
    */

    if (modalText) {

      modalText.textContent =
        "";

    }


    if (watchAdBtn) {

      watchAdBtn.disabled =
        true;

      watchAdBtn.textContent =
        "✓ Ads Completed";

    }

  }

  /* =======================================================
     STILL LOCKED
  ======================================================= */

  else {

    if (videoBtn) {

      videoBtn.disabled =
        true;

      videoBtn.textContent =
        "🔒 Video Locked";

    }


    if (watchAdBtn) {

      watchAdBtn.disabled =
        false;

    }

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
    requiredAds
  ) {

    return;

  }


  /* =======================================================
     CHECK MONETAG SDK
  ======================================================= */

  if (
    typeof window.show_11571866 !==
    "function"
  ) {

    if (modalText) {

      modalText.textContent =
        "Ad system is still loading. Please try again.";

    }

    return;

  }


  adLoading =
    true;


  if (watchAdBtn) {

    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "⏳ Loading Ad...";

  }


  try {

    /*
      IMPORTANT:

      Counter does NOT increase here.

      It increases only after the
      Monetag rewarded-ad promise resolves.
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag result:",
      result
    );


    /*
      Reward completed.
    */

    adsWatched++;


    updateUnlockUI();


  } catch (error) {

    console.error(
      "Monetag rewarded ad error:",
      error
    );


    /*
      IMPORTANT:
      Do NOT change adsWatched here.
    */

    /*
      Don't show an error message
      after every failed/closed attempt.
      The user can simply try again.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      if (watchAdBtn) {

        watchAdBtn.textContent =
          `▶ Watch Ad (${adsWatched}/${requiredAds})`;

        watchAdBtn.disabled =
          false;

      }

    }

  } finally {

    adLoading =
      false;

  }

}


/* =========================================================
   WATCH AD BUTTON
========================================================= */

if (watchAdBtn) {

  watchAdBtn.addEventListener(
    "click",
    showRewardedAd
  );

}


/* =========================================================
   WATCH VIDEO BUTTON
========================================================= */

if (videoBtn) {

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

if (closeModal) {

  closeModal.addEventListener(
    "click",
    () => {

      if (modal) {

        modal.classList.add(
          "hidden"
        );

      }

    }
  );

}


/* =========================================================
   OUTSIDE MODAL CLICK
========================================================= */

if (modal) {

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
