্/* =========================================================
   TELEGRAM
========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  try {
    tg.ready();
    tg.expand();
  } catch (e) {
    console.warn("Telegram error:", e);
  }
}


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";

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
   LOAD POSTS
========================================================= */

async function loadPosts() {

  if (!videoGrid) return;

  videoGrid.innerHTML = `
    <div class="loading">
      Loading videos...
    </div>
  `;

  try {

    const response =
      await fetch(
        `${POSTS_API}?select=*&order=created_at.desc`,
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


    const text =
      await response.text();


    if (!response.ok) {

      throw new Error(
        `Supabase ${response.status}: ${text}`
      );

    }


    const data =
      JSON.parse(text);


    videos.length = 0;


    if (Array.isArray(data)) {

      data.forEach(post => {

        if (!post) return;


        videos.push({

          id:
            post.id ??
            post.post_id ??
            "",

          title:
            post.title ??
            post.name ??
            "Untitled Video",

          category:
            post.category ??
            "Trending",

          thumbnail:
            post.thumbnail_url ??
            post.thumbnail ??
            post.image_url ??
            post.image ??
            post.poster_url ??
            "",

          videoUrl:
            post.video_url ??
            post.video ??
            post.video_link ??
            post.url ??
            post.link ??
            "",

          createdAt:
            post.created_at ??
            ""

        });

      });

    }


    console.log(
      "Videos loaded:",
      videos.length
    );


    render("All");


  } catch (error) {

    console.error(
      "Video loading error:",
      error
    );


    videoGrid.innerHTML = `
      <div class="error-box">

        <h3>
          Unable to load videos
        </h3>

        <p>
          Please refresh the app.
        </p>

        <button
          id="retryVideos"
          type="button"
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
   RENDER
========================================================= */

function render(
  category = "All"
) {

  if (!videoGrid) return;


  videoGrid.innerHTML = "";


  const filtered =
    category === "All"
      ? videos
      : videos.filter(
          video =>
            String(
              video.category
            )
              .trim()
              .toLowerCase() ===
            String(
              category
            )
              .trim()
              .toLowerCase()
        );


  if (!filtered.length) {

    videoGrid.innerHTML = `
      <div class="loading">
        No videos found.
      </div>
    `;

    return;

  }


  filtered.forEach(video => {

    const card =
      document.createElement(
        "article"
      );


    card.className =
      "video-card";


    let thumbnailHTML;


    if (
      video.thumbnail &&
      isValidUrl(video.thumbnail)
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


    if (openBtn) {

      openBtn.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          openVideo(video);

        }
      );

    }


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

  });

}


/* =========================================================
   OPEN VIDEO
========================================================= */

function openVideo(video) {

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


  if (
    preview &&
    video.thumbnail &&
    isValidUrl(video.thumbnail)
  ) {

    preview.innerHTML = `
      <img
        src="${escapeHTML(
          video.thumbnail
        )}"
        alt=""
      >
    `;

  } else if (preview) {

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
        (adsWatched / requiredAds) * 100,
        100
      );

    progressBar.style.width =
      `${percent}%`;

  }


  /* ================= 3/3 UNLOCKED ================= */

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


    if (watchAdBtn) {

      watchAdBtn.disabled =
        true;

      watchAdBtn.textContent =
        "✓ Ads Completed";

    }


    return;

  }


  /* ================= 0/3, 1/3, 2/3 ================= */

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


  if (watchAdBtn) {

    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "⏳ Loading Ad...";

  }


  try {

    /* ================= CHECK SDK ================= */

    if (
      typeof window.show_11571866 !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    /*
      Open Rewarded Ad.

      IMPORTANT:
      We do NOT change the counter
      before the SDK call finishes.
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag result:",
      result
    );


    /*
      Keep the existing behavior:
      when the SDK call successfully
      finishes, count one completed ad.
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


    /*
      X / closed / failed:

      No message.
      No counter increase.
    */

    if (watchAdBtn) {

      watchAdBtn.textContent =
        `▶ Watch Ad (${adsWatched}/${requiredAds})`;

      watchAdBtn.disabled =
        false;

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
   OUTSIDE MODAL
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
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".category-btn"
          )
          .forEach(btn => {

            btn.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        render(
          button.dataset.category
        );

      }
    );

  });


/* =========================================================
   BOTTOM NAV
========================================================= */

document
  .querySelectorAll(
    ".bottom-nav button"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const category =
          button.dataset.bottomCategory;


        document
          .querySelectorAll(
            ".bottom-nav button"
          )
          .forEach(btn => {

            btn.classList.remove(
              "bottom-active"
            );

          });


        button.classList.add(
          "bottom-active"
        );


        document
          .querySelectorAll(
            ".category-btn"
          )
          .forEach(btn => {

            btn.classList.toggle(
              "active",
              btn.dataset.category ===
              category
            );

          });


        render(
          category
        );

      }
    );

  });


/* =========================================================
   URL VALIDATION
========================================================= */

function isValidUrl(value) {

  if (!value) {
    return false;
  }


  try {

    new URL(value);

    return true;

  } catch (e) {

    return false;

  }

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

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
