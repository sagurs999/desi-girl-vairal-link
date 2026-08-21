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
  This is the PUBLIC / PUBLISHABLE key.
  Never put a secret/service_role key here.
*/

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2L716MuF36gsDT5fGu_k9Q_LzGLqTk5";


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

    /*
      IMPORTANT FIX:

      We only send the apikey header.

      We DO NOT send:

      Authorization:
      Bearer sb_publishable_...

      because publishable keys are not JWT tokens.
    */


    const url =
      `${POSTS_API}?select=id,title,category,thumbnail_url,video_url,created_at`;


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

            "Accept":
              "application/json"

          },

          cache: "no-store"

        }
      );


    /*
      HTTP ERROR
    */

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "Supabase HTTP Error:",
        response.status,
        errorText
      );


      throw new Error(
        `Supabase ${response.status}: ${errorText}`
      );

    }


    /*
      GET JSON
    */

    const data =
      await response.json();


    console.log(
      "Supabase data:",
      data
    );


    /*
      Make sure response is array
    */

    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Supabase returned invalid data."
      );

    }


    /*
      Clear old videos
    */

    videos.length = 0;


    /*
      Convert database rows
    */

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


    /*
      Sort newest first.

      This is done in JavaScript
      instead of using order=created_at.desc
      so that the query doesn't fail if
      created_at has a problem.
    */

    videos.sort(
      (a, b) => {

        const dateA =
          new Date(
            a.createdAt || 0
          ).getTime();

        const dateB =
          new Date(
            b.createdAt || 0
          ).getTime();

        return dateB - dateA;

      }
    );


    console.log(
      "Videos loaded:",
      videos.length
    );


    /*
      Render videos
    */

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
            error.message ||
            "Failed to fetch"
          )}
        </p>

        <button
          id="retryBtn"
          type="button"
          class="open-btn"
          style="margin-top:15px;">
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

  videoGrid.innerHTML = "";


  const filteredVideos =
    category === "All"

      ? videos

      : videos.filter(
          video => {

            return String(
              video.category
            )
              .trim()
              .toLowerCase() ===
            String(
              category
            )
              .trim()
              .toLowerCase();

          }
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


      /* =================================================
         THUMBNAIL
      ================================================= */

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
            onerror="
              this.style.display='none';
              this.parentElement.classList.add('thumb-error');
            "
          >

        `;

      } else {

        thumbnailHTML = `

          <div class="thumb-placeholder">
            🎬
          </div>

        `;

      }


      /* =================================================
         CARD
      ================================================= */

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
            type="button">

            🔒 Watch Ad

          </button>

        </div>

      `;


      /* =================================================
         OPEN BUTTON
      ================================================= */

      const openBtn =
        card.querySelector(
          ".open-btn"
        );


      openBtn.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          openVideo(video);

        }
      );


      /* =================================================
         THUMBNAIL CLICK
      ================================================= */

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


  /* =================================================
     PREVIEW
  ================================================= */

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
        ">

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


  /* =================================================
     UNLOCKED
  ================================================= */

  if (
    adsWatched >=
    requiredAds
  ) {

    videoBtn.disabled =
      false;


    videoBtn.textContent =
      "▶ Watch Video";


    /*
      Important:

      No error message here.
    */

    modalText.textContent =
      "🎉 All ads completed! Your video is unlocked.";


    watchAdBtn.disabled =
      true;


    watchAdBtn.textContent =
      "✓ Ads Completed";


    return;

  }


  /* =================================================
     LOCKED
  ================================================= */

  videoBtn.disabled =
    true;


  videoBtn.textContent =
    "🔒 Video Locked";


  watchAdBtn.disabled =
    false;

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

    /* =================================================
       CHECK SDK
    ================================================= */

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

      Counter is increased ONLY
      after the Monetag promise resolves.
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag rewarded result:",
      result
    );


    /*
      Ad completed
    */

    adsWatched++;


    updateUnlockUI();


  } catch (
    error
  ) {

    console.error(
      "Monetag ad error:",
      error
    );


    /*
      IMPORTANT:

      Do NOT increase adsWatched
      if ad was closed / failed.
    */


    /*
      Only show error if the user
      has not completed all required ads.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      modalText.innerHTML = `
        <span>
          বিজ্ঞাপনটি সম্পূর্ণ হয়নি।
          <br>
          Ad was not completed.
          <br><br>
          আবার চেষ্টা করুন।
          <br>
          Please try again.
        </span>
      `;

    }


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
   WATCH VIDEO
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


    if (
      !selectedVideo.id
    ) {

      alert(
        "Video ID is missing."
      );

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
   OUTSIDE MODAL
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
