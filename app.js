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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmxlIiwicmVmIjoibXNoZnRnYnViZmJrdnlubmR0bnUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NjY0OTA5NCwiZXhwIjoyMTAyMjI1MDk0fQ.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";


const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts_with_views`;


const POSTS_TABLE_API =
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
   DATE FORMAT
========================================================= */

function formatDate(
  dateValue
) {

  if (!dateValue) {
    return "Date unavailable";
  }


  const date =
    new Date(dateValue);


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
      posts_with_views থেকে:

      id
      title
      category
      thumbnail_url
      video_url
      created_at
      views
      last_viewed_at

      সব আসবে।
    */

    const url =
      `${POSTS_API}` +
      `?select=id,title,category,thumbnail_url,video_url,created_at,views,last_viewed_at` +
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
            "",

          views:
            Number(
              post.views || 0
            ),

          lastViewedAt:
            post.last_viewed_at ||
            null

        });

      }
    );


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
   RENDER
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


      if (video.thumbnail) {

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

            <span class="views">
              ▸ ${Number(
                video.views || 0
              )} Views
            </span>

            <span>
              &nbsp;
            </span>

            <span class="date">
              ${escapeHTML(
                formatDate(
                  video.createdAt
                )
              )}
            </span>

            <span>
              &nbsp;${escapeHTML(
                video.category
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

          openVideo(video);

        }
      );


      /* =================================================
         THUMBNAIL
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


  /* =================================================
     PREVIEW
  ================================================= */

  if (video.thumbnail) {

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

  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${requiredAds})`;


  adCount.textContent =
    `${adsWatched} / ${requiredAds} Ads Completed`;


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


    modalText.textContent =
      "🎉 All ads completed! Your video is unlocked.";


    watchAdBtn.disabled =
      true;


    watchAdBtn.textContent =
      "✓ Ads Completed";

  }

  else {

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

  if (adLoading) {
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

    /*
      SDK check
    */

    if (
      typeof window.show_11571866 !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded. Please wait and try again."
      );

    }


    /*
      IMPORTANT:

      Counter BEFORE ad:
      ❌ adsWatched++

      Counter AFTER successful
      SDK promise:
      ✅ adsWatched++
    */

    const result =
      await window.show_11571866();


    console.log(
      "Rewarded ad completed:",
      result
    );


    /*
      Ad promise successfully completed.
      এখনই counter increase হবে।
    */

    adsWatched++;


    updateUnlockUI();


  } catch (error) {

    console.error(
      "Rewarded ad error:",
      error
    );


    modalText.textContent =
      "⚠️ Ad is not available right now. Please try again.";


    watchAdBtn.disabled =
      false;


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
   VIDEO BUTTON
========================================================= */

videoBtn.addEventListener(
  "click",
  () => {

    if (!selectedVideo) {
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
   ESCAPE HTML
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
