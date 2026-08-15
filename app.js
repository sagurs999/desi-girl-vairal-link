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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaG9mdGd1YmZia3Z5bm5kdG51Iiwic2VjcmV0IjoiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDkwOTQsImV4cCI6MjEwMjIyNTA5NH0.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";


const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


const RPC_VIEW_API =
  `${SUPABASE_URL}/rest/v1/rpc/increment_post_view`;


/* =========================================================
   STATE
========================================================= */

const videos = [];

let selectedVideo = null;

let adsWatched = 0;

const requiredAds = 3;

let adLoading = false;

let viewCounting = false;


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
   DATE FORMAT
========================================================= */

function formatDate(
  dateValue
) {

  if (!dateValue) {

    return "Date unavailable";

  }


  const date =
    new Date(
      dateValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "Date unavailable";

  }


  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


/* =========================================================
   VIEWS FORMAT
========================================================= */

function formatViews(
  value
) {

  const views =
    Number(value || 0);


  if (views >= 1000000) {

    return (
      (views / 1000000)
        .toFixed(1)
        .replace(".0", "")
      + "M"
    );

  }


  if (views >= 1000) {

    return (
      (views / 1000)
        .toFixed(1)
        .replace(".0", "")
      + "K"
    );

  }


  return String(
    views
  );

}


/* =========================================================
   CATEGORY NORMALIZATION
========================================================= */

function normalizeCategory(
  category
) {

  const value =
    String(
      category || ""
    )
      .trim()
      .toLowerCase();


  if (
    value === "trending" ||
    value === "trend"
  ) {

    return "Trending";

  }


  if (
    value === "hot" ||
    value === "hot video" ||
    value === "hotvideo"
  ) {

    return "Hot Video";

  }


  if (
    value === "popular" ||
    value === "populer"
  ) {

    return "Popular";

  }


  if (
    value === "funny"
  ) {

    return "Funny";

  }


  return category ||
    "Trending";

}


/* =========================================================
   CATEGORY MATCH
========================================================= */

function categoryMatches(
  videoCategory,
  selectedCategory
) {

  if (
    selectedCategory === "All"
  ) {

    return true;

  }


  const actual =
    normalizeCategory(
      videoCategory
    );


  return (
    actual.toLowerCase() ===
    selectedCategory.toLowerCase()
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

    const response =
      await fetch(
        `${POSTS_API}?select=id,title,category,thumbnail_url,video_url,created_at,views&order=created_at.desc`,
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


    data.forEach(
      post => {

        videos.push({

          id:
            post.id,

          title:
            post.title ||
            "Untitled Video",

          category:
            normalizeCategory(
              post.category
            ),

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
   RENDER
========================================================= */

function render(
  category = "All"
) {

  videoGrid.innerHTML = "";


  const filteredVideos =
    videos.filter(
      video =>
        categoryMatches(
          video.category,
          category
        )
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


          <div class="post-info">

            <span class="post-views">
              ▶ ${formatViews(
                video.views
              )} views
            </span>


            <span class="post-date">
              📅 ${escapeHTML(
                formatDate(
                  video.createdAt
                )
              )}
            </span>

          </div>


          <button
            class="open-btn"
            type="button"
          >
            🔒 Watch Ad
          </button>

        </div>

      `;


      /* =================================================
         WATCH BUTTON
      ================================================= */

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


      /* =================================================
         THUMB CLICK
      ================================================= */

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


  viewCounting =
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
   UNLOCK UI
========================================================= */

function updateUnlockUI() {

  watchAdBtn.textContent =
    `🔒 Watch Ad (${adsWatched}/${requiredAds})`;


  adCount.textContent =
    `${adsWatched} / ${requiredAds} Ads Completed`;


  const percent =
    (
      adsWatched /
      requiredAds
    ) * 100;


  progressBar.style.width =
    `${percent}%`;


  if (
    adsWatched >=
    requiredAds
  ) {

    videoBtn.disabled =
      false;


    videoBtn.textContent =
      "▶ Watch Video";


    modalText.textContent =
      "🎉 All 3 ads completed! Video unlocked.";


    watchAdBtn.disabled =
      true;


    watchAdBtn.textContent =
      "✓ Ads Completed";

  } else {

    videoBtn.disabled =
      true;


    videoBtn.textContent =
      "🔒 Video Locked";


    watchAdBtn.disabled =
      false;

  }

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


    /* =================================================
       IMPORTANT

       Counter only increases AFTER
       Monetag promise completes.
    ================================================= */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag ad completed:",
      result
    );


    /*
      Ad successfully completed.
      Now increase counter.
    */

    adsWatched++;


    updateUnlockUI();


  } catch (
    error
  ) {

    console.error(
      "Monetag ad failed:",
      error
    );


    modalText.textContent =
      "Ad is not available right now. Please try again.";


    watchAdBtn.textContent =
      `🔒 Watch Ad (${adsWatched}/${requiredAds})`;


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
   INCREMENT VIEW
   ONLY AFTER 3 ADS + WATCH VIDEO
========================================================= */

async function incrementView(
  postId
) {

  if (
    viewCounting
  ) {

    return null;

  }


  viewCounting =
    true;


  try {

    const response =
      await fetch(
        RPC_VIEW_API,
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
                String(
                  postId
                )
            })

        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();


      throw new Error(
        `View update failed: ${response.status} ${errorText}`
      );

    }


    const newViews =
      await response.json();


    console.log(
      "View added:",
      newViews
    );


    return newViews;


  } catch (error) {

    console.error(
      "View increment error:",
      error
    );


    return null;

  }

}


/* =========================================================
   WATCH VIDEO
========================================================= */

videoBtn.addEventListener(
  "click",
  async () => {

    if (
      !selectedVideo
    ) {

      return;

    }


    /*
      Security check:
      3 ads must be completed.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      return;

    }


    const videoId =
      selectedVideo.id;


    /*
      Save unlock state for video.html
    */

    sessionStorage.setItem(
      `video_unlocked_${videoId}`,
      "1"
    );


    /*
      IMPORTANT:
      View increases ONLY here,
      after all 3 ads are completed
      and user clicks Watch Video.
    */

    await incrementView(
      videoId
    );


    /*
      Update local view count too.
    */

    selectedVideo.views =
      Number(
        selectedVideo.views || 0
      ) + 1;


    /*
      Go to video page
    */

    const encodedId =
      encodeURIComponent(
        videoId
      );


    window.location.href =
      `video.html?id=${encodedId}`;

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
   START
========================================================= */

loadPosts();
