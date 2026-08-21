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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmUiLCJyZWYiOiJtc2hvdGd1YmZia3Z5bm5kdG51IiwiaWF0IjoxNzg2NjQ5MDk0LCJleHAiOjIxMDIyMjUwOTR9.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";


const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   MONETAG
========================================================= */

const MONETAG_FUNCTION =
  "show_11571866";


/* =========================================================
   REWARDED AD SETTINGS
========================================================= */

const requiredAds =
  3;


/* =========================================================
   STATE
========================================================= */

const videos = [];


let selectedVideo =
  null;


let adsWatched =
  0;


let adLoading =
  false;


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

    const response =
      await fetch(

        `${POSTS_API}?select=id,title,category,thumbnail_url,video_url,created_at&order=created_at.desc`,

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


    videos.length =
      0;


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

  videoGrid.innerHTML =
    "";


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
    !filteredVideos.length
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


  /*
    Every new video starts
    a fresh 3-ad session.
  */

  adsWatched =
    0;


  adLoading =
    false;


  modalTitle.textContent =
    video.title ||
    "Video";


  /*
    Normal message.
    No error message.
  */

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

  /*
    For 1/3 and 2/3:
    NO warning message.
  */

  if (
    adsWatched <
    requiredAds
  ) {

    modalText.textContent =
      "Watch 3 ads to unlock this video.";

  }


  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${requiredAds})`;


  adCount.textContent =
    `${adsWatched} / ${requiredAds} Ads Completed`;


  const percent =
    (
      adsWatched /
      requiredAds
    ) * 100;


  progressBar.style.width =
    `${percent}%`;


  /* =======================================================
     3/3 COMPLETE
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


  watchAdBtn.disabled =
    false;

}


/* =========================================================
   INCOMPLETE AD MESSAGE
========================================================= */

function showIncompleteAdMessage() {

  modalText.innerHTML = `

    <strong>
      বিজ্ঞাপনটি সম্পূর্ণ হয়নি।
    </strong>

    <br>

    আপনি X চাপ দিয়ে বিজ্ঞাপন থেকে বের হয়ে গেছেন।
    ভিডিও আনলক করতে আবার Continue / Watch Ad
    বাটনে ক্লিক করুন।

    <br>
    <br>

    <strong>
      The ad was not completed.
    </strong>

    <br>

    You exited the ad using X.
    To unlock the video, please click
    Continue / Watch Ad again.

  `;

}


/* =========================================================
   REWARDED AD
========================================================= */

async function showRewardedAd() {

  /*
    Prevent double click.
  */

  if (
    adLoading
  ) {

    return;

  }


  /*
    Already 3/3.
  */

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
    IMPORTANT:

    Counter is NOT increased here.

    It will only increase after
    the Monetag function completes.
  */


  let completed =
    false;


  try {

    /* =====================================================
       CHECK SDK
    ===================================================== */

    if (
      typeof window[
        MONETAG_FUNCTION
      ] !== "function"
    ) {

      throw new Error(
        "MONETAG_SDK_NOT_LOADED"
      );

    }


    /* =====================================================
       SHOW REWARDED AD
    ===================================================== */

    const result =
      await window[
        MONETAG_FUNCTION
      ]();


    /*
      Monetag promise completed.
    */

    completed =
      true;


    console.log(
      "Monetag rewarded ad completed:",
      result
    );


    /* =====================================================
       ADD ONE REWARD
    ===================================================== */

    if (
      adsWatched <
      requiredAds
    ) {

      adsWatched++;

    }


    /*
      Successful ad:

      - Remove any old warning
      - Update counter
    */

    updateUnlockUI();


  } catch (error) {

    console.error(
      "Monetag rewarded ad:",
      error
    );


    /*
      IMPORTANT:

      X / close / failed ad
      DOES NOT increase counter.
    */

    if (
      !completed
    ) {

      showIncompleteAdMessage();

    }


    /*
      Restore Watch Ad button.
    */

    watchAdBtn.disabled =
      false;


    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${requiredAds})`;


    /*
      Video remains locked.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      videoBtn.disabled =
        true;

      videoBtn.textContent =
        "🔒 Video Locked";

    }

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
            button.dataset
              .bottomCategory;


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
   START
========================================================= */

loadPosts();
