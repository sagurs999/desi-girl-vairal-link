/* =========================================================
   TELEGRAM
========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  try {
    tg.ready();
    tg.expand();
  } catch (error) {
    console.warn("Telegram error:", error);
  }
}


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";

/*
  আপনার Supabase project-এর public/anon key
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

    /*
      IMPORTANT:

      এখানে created_at ব্যবহার করছি না।
      তাই created_at column না থাকলেও
      query fail করবে না।
    */

    const url =
      `${POSTS_API}?select=*`;


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
              "application/json",

            "Content-Type":
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


    console.log(
      "Supabase response:",
      responseText
    );


    if (!response.ok) {

      throw new Error(
        `Supabase ${response.status}: ${responseText}`
      );

    }


    let data;


    try {

      data =
        JSON.parse(
          responseText
        );

    } catch (error) {

      throw new Error(
        "Supabase returned invalid JSON."
      );

    }


    if (!Array.isArray(data)) {

      throw new Error(
        "Supabase response is not an array."
      );

    }


    /*
      Clear old videos
    */

    videos.length = 0;


    /*
      Convert Supabase rows
      into our app format.
    */

    data.forEach(
      post => {

        if (!post) {
          return;
        }


        /*
          ID
        */

        const id =
          post.id ??
          post.post_id ??
          post.ID ??
          "";


        /*
          TITLE
        */

        const title =
          post.title ??
          post.name ??
          post.video_title ??
          post.caption ??
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

          Multiple possible column names
          are supported.
        */

        const thumbnail =
          post.thumbnail_url ??
          post.thumbnail ??
          post.thumbnailUrl ??
          post.image_url ??
          post.image ??
          post.poster_url ??
          post.poster ??
          "";


        /*
          VIDEO URL

          Multiple possible column names
          are supported.
        */

        const videoUrl =
          post.video_url ??
          post.video ??
          post.videoUrl ??
          post.video_link ??
          post.videoLink ??
          post.url ??
          post.link ??
          "";


        videos.push({

          id:
            id,

          title:
            title,

          category:
            category,

          thumbnail:
            thumbnail,

          videoUrl:
            videoUrl,

          createdAt:
            post.created_at ??
            ""

        });

      }
    );


    console.log(
      "Total posts:",
      data.length
    );


    console.log(
      "Videos converted:",
      videos.length
    );


    /*
      If database contains rows
      but no usable data.
    */

    if (!videos.length) {

      videoGrid.innerHTML = `
        <div class="loading">
          No videos found.
        </div>
      `;

      return;

    }


    /*
      Render videos
    */

    render("All");


  } catch (error) {

    console.error(
      "VIDEO LOADING ERROR:",
      error
    );


    /*
      Show a simple message to users.
      Full error stays in console.
    */

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
        () => {

          loadPosts();

        }
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


      /*
        Thumbnail
      */

      let thumbnailHTML =
        `
          <div class="thumb-placeholder">
            🎬
          </div>
        `;


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
            onerror="this.style.display='none';"
          >
        `;

      }


      /*
        Card
      */

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


      /*
        Open button
      */

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


      /*
        Thumbnail click
      */

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


  /*
    Reset only for new video
  */

  adsWatched =
    0;

  adLoading =
    false;


  /*
    Title
  */

  if (modalTitle) {

    modalTitle.textContent =
      video.title ||
      "Video";

  }


  /*
    Default message
  */

  if (modalText) {

    modalText.textContent =
      "Watch 3 ads to unlock this video.";

  }


  /*
    Preview
  */

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


  /*
    Show modal
  */

  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }


  /*
    Reset UI
  */

  updateUnlockUI();

}


/* =========================================================
   UPDATE UNLOCK UI
========================================================= */

function updateUnlockUI() {

  /*
    Counter
  */

  if (adCount) {

    adCount.textContent =
      `${adsWatched} / ${requiredAds} Ads Completed`;

  }


  /*
    Progress
  */

  if (progressBar) {

    const percentage =
      Math.min(
        100,
        (
          adsWatched /
          requiredAds
        ) * 100
      );


    progressBar.style.width =
      `${percentage}%`;

  }


  /*
    3/3 = UNLOCKED
  */

  if (
    adsWatched >=
    requiredAds
  ) {

    if (watchAdBtn) {

      watchAdBtn.disabled =
        true;

      watchAdBtn.textContent =
        "✓ Ads Completed";

    }


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


    return;

  }


  /*
    0/3, 1/3, 2/3

    এখানে কোনো X message নেই।
  */

  if (watchAdBtn) {

    watchAdBtn.disabled =
      false;

    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${requiredAds})`;

  }


  if (videoBtn) {

    videoBtn.disabled =
      true;

    videoBtn.textContent =
      "🔒 Video Locked";

  }

}


/* =========================================================
   MONETAG REWARDED AD
========================================================= */

async function showRewardedAd() {

  /*
    Prevent double click
  */

  if (adLoading) {
    return;
  }


  /*
    Already completed
  */

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


    console.log(
      "Opening Monetag rewarded ad..."
    );


    /*
      DO NOT increase counter
      before this finishes.
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag ad result:",
      result
    );


    /*
      Successful SDK completion
    */

    if (
      adsWatched <
      requiredAds
    ) {

      adsWatched++;

    }


    /*
      Update UI
    */

    updateUnlockUI();


  } catch (error) {

    console.error(
      "Monetag rewarded ad error:",
      error
    );


    /*
      X / close / unavailable:

      No warning text.
      No counter increase.
    */

    updateUnlockUI();

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

      /*
        No selected video
      */

      if (!selectedVideo) {
        return;
      }


      /*
        Must complete 3 ads
      */

      if (
        adsWatched <
        requiredAds
      ) {

        return;

      }


      /*
        Video ID
      */

      const videoId =
        encodeURIComponent(
          selectedVideo.id
        );


      /*
        Go to video.html
      */

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

      /*
        X চাপলে শুধু modal বন্ধ হবে।

        কোনো message দেখাবে না।
        Counter বাড়বে না।
      */

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
        event.target === modal
      ) {

        /*
          বাইরে চাপলেও শুধু বন্ধ হবে।
        */

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

          /*
            Active category
          */

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


          /*
            Render category
          */

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


          /*
            Bottom active
          */

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


          /*
            Sync top category
          */

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


          /*
            Render
          */

          render(
            category
          );

        }
      );

    }
  );


/* =========================================================
   URL VALIDATION
========================================================= */

function isValidUrl(
  value
) {

  if (!value) {
    return false;
  }


  try {

    const url =
      new URL(value);


    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );

  } catch (error) {

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
