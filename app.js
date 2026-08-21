/* =========================================================
   TELEGRAM
========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  try {
    tg.ready();
    tg.expand();
  } catch (e) {
    console.warn("Telegram WebApp error:", e);
  }
}


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";

/*
  আপনার Supabase anon key
*/
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmxlIiwicmVmIjoibXNob2Z0Z3Via3ZueW5uZHRudSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg2NjQ5MDk0LCJleHAiOjIxMDIyMjUwOTR9.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";

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

if (tgUser) {

  const user =
    tg?.initDataUnsafe?.user;

  if (user) {

    tgUser.textContent =
      user.first_name ||
      "Telegram User";

  }

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

    console.log("Loading Supabase posts...");


    /*
      IMPORTANT:

      select=* ব্যবহার করছি যাতে
      posts table-এর column mismatch-এর কারণে
      ভিডিও loading বন্ধ না হয়।
    */

    const url =
      `${POSTS_API}?select=*&order=created_at.desc`;


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


    const responseText =
      await response.text();


    console.log(
      "Supabase status:",
      response.status
    );


    if (!response.ok) {

      console.error(
        "Supabase response:",
        responseText
      );

      throw new Error(
        `Supabase Error ${response.status}`
      );

    }


    let data;


    try {

      data =
        JSON.parse(
          responseText
        );

    } catch (e) {

      throw new Error(
        "Supabase returned invalid JSON."
      );

    }


    console.log(
      "Supabase posts:",
      data
    );


    if (!Array.isArray(data)) {

      throw new Error(
        "Supabase data is not an array."
      );

    }


    videos.length = 0;


    /*
      Convert Supabase rows
      into the app format.
    */

    data.forEach(
      post => {

        if (!post) return;


        /*
          ID
        */

        const id =
          post.id ??
          post.ID ??
          post.post_id ??
          "";


        /*
          TITLE
        */

        const title =
          post.title ??
          post.name ??
          post.video_title ??
          "Untitled Video";


        /*
          CATEGORY
        */

        const category =
          post.category ??
          post.categories ??
          "Trending";


        /*
          THUMBNAIL

          Supports:
          thumbnail_url
          thumbnail
          image_url
          image
          poster_url
        */

        const thumbnail =
          post.thumbnail_url ??
          post.thumbnail ??
          post.image_url ??
          post.image ??
          post.poster_url ??
          "";


        /*
          VIDEO

          Supports:
          video_url
          video
          video_link
          url
          link
        */

        const videoUrl =
          post.video_url ??
          post.video ??
          post.video_link ??
          post.url ??
          post.link ??
          "";


        /*
          CREATED DATE
        */

        const createdAt =
          post.created_at ??
          post.createdAt ??
          "";


        videos.push({

          id: id,

          title:
            String(title),

          category:
            String(category),

          thumbnail:
            String(thumbnail),

          videoUrl:
            String(videoUrl),

          createdAt:
            createdAt

        });

      }
    );


    console.log(
      "Converted videos:",
      videos
    );


    /*
      Render ALL
    */

    render("All");


  } catch (error) {

    console.error(
      "FAILED TO LOAD VIDEOS:",
      error
    );


    videoGrid.innerHTML = `

      <div class="error-box">

        <h3>
          Unable to load videos
        </h3>

        <p>
          Please refresh the app and try again.
        </p>

        <button
          type="button"
          id="retryVideos"
          style="
            margin-top:12px;
            padding:12px 18px;
            border:0;
            border-radius:10px;
            cursor:pointer;
          "
        >
          🔄 Retry
        </button>

      </div>

    `;


    const retry =
      document.getElementById(
        "retryVideos"
      );


    if (retry) {

      retry.addEventListener(
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

  if (!videoGrid) return;


  videoGrid.innerHTML = "";


  /*
    All = সব ভিডিও
  */

  const filteredVideos =
    category === "All"
      ? videos
      : videos.filter(
          video => {

            return (
              String(
                video.category
              )
                .trim()
                .toLowerCase()
              ===
              String(
                category
              )
                .trim()
                .toLowerCase()
            );

          }
        );


  /*
    No videos
  */

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


  /*
    Create cards
  */

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
        video.thumbnail &&
        isValidUrl(
          video.thumbnail
        )
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
            onerror="this.style.display='none';this.parentElement.classList.add('thumb-error');"
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

            openVideo(
              video
            );

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


  if (modalTitle) {

    modalTitle.textContent =
      video.title ||
      "Video";

  }


  if (modalText) {

    modalText.textContent =
      "Watch 3 ads to unlock this video.";

  }


  /* =====================================================
     PREVIEW
  ===================================================== */

  if (
    preview &&
    video.thumbnail &&
    isValidUrl(
      video.thumbnail
    )
  ) {

    preview.innerHTML = `

      <img
        src="${escapeHTML(
          video.thumbnail
        )}"
        alt=""
        onerror="this.style.display='none';"
      >

    `;

  }

  else if (preview) {

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

  if (!watchAdBtn) return;


  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${requiredAds})`;


  if (adCount) {

    adCount.textContent =
      `${adsWatched} / ${requiredAds} Ads Completed`;

  }


  if (progressBar) {

    const percent =
      Math.min(
        (
          adsWatched /
          requiredAds
        ) * 100,
        100
      );


    progressBar.style.width =
      `${percent}%`;

  }


  /*
    UNLOCKED
  */

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


    if (modalText) {

      modalText.textContent =
        "🎉 All ads completed! Your video is unlocked.";

    }


    watchAdBtn.disabled =
      true;


    watchAdBtn.textContent =
      "✓ Ads Completed";

  }


  /*
    LOCKED
  */

  else {

    if (videoBtn) {

      videoBtn.disabled =
        true;

      videoBtn.textContent =
        "🔒 Video Locked";

    }


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
      Check Monetag SDK
    */

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

      Counter increases ONLY
      after SDK promise finishes.
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag completed:",
      result
    );


    /*
      Ad completed
    */

    if (
      adsWatched <
      requiredAds
    ) {

      adsWatched++;

    }


    updateUnlockUI();


  } catch (error) {

    console.error(
      "Monetag ad error:",
      error
    );


    if (modalText) {

      modalText.textContent =
        "Ad is not available right now. Please try again.";

    }


    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${requiredAds})`;


    watchAdBtn.disabled =
      false;

  }


  adLoading =
    false;

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
   VIDEO BUTTON
========================================================= */

if (videoBtn) {

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


      /*
        Use the post ID.

        video.html will load the
        corresponding Supabase post.
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
   CLICK OUTSIDE MODAL
========================================================= */

if (modal) {

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
   URL CHECK
========================================================= */

function isValidUrl(
  value
) {

  if (!value) {
    return false;
  }


  try {

    new URL(
      value
    );

    return true;

  } catch (e) {

    return false;

  }

}


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
   START APP
========================================================= */

loadPosts();
