/* =========================================================
   TELEGRAM
========================================================= */

const tg =
  window.Telegram?.WebApp || null;

if (tg) {

  try {

    tg.ready();
    tg.expand();

  } catch (error) {

    console.warn(
      "Telegram initialization error:",
      error
    );

  }

}


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";


/*
  Supabase Publishable Key
*/

const SUPABASE_ANON_KEY =
  "sb_publishable_2L716MuF36gsDT5fGu_k9Q_LzGLqTk0";


const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   MONETAG
========================================================= */

const MONETAG_ZONE =
  "11571866";

const MONETAG_FUNCTION =
  `show_${MONETAG_ZONE}`;


/* =========================================================
   APP STATE
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

if (tgUser) {

  const user =
    tg?.initDataUnsafe?.user || null;


  if (user) {

    tgUser.textContent =
      user.first_name ||
      "Telegram User";

  } else {

    tgUser.textContent =
      "Guest";

  }

}


/* =========================================================
   LOAD POSTS FROM SUPABASE
========================================================= */

async function loadPosts() {

  if (!videoGrid) {

    console.error(
      "videoGrid not found."
    );

    return;

  }


  videoGrid.innerHTML = `

    <div class="loading">
      Loading videos...
    </div>

  `;


  try {

    const url =
      `${POSTS_API}?select=*&order=created_at.desc`;


    console.log(
      "Supabase URL:",
      url
    );


    const response =
      await fetch(
        url,
        {
          method: "GET",

          cache: "no-store",

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


    videos.length = 0;


    /*
      Convert database rows
      into app videos.
    */

    data.forEach(
      post => {

        if (!post) {
          return;
        }


        const video = {

          id:
            post.id ??
            post.post_id ??
            post.uuid ??
            "",


          title:
            post.title ??
            post.name ??
            post.video_title ??
            "Untitled Video",


          category:
            post.category ??
            post.type ??
            "Trending",


          thumbnail:
            post.thumbnail_url ??
            post.thumbnail ??
            post.image_url ??
            post.image ??
            post.poster_url ??
            post.poster ??
            "",


          videoUrl:
            post.video_url ??
            post.video ??
            post.video_link ??
            post.videoUrl ??
            post.url ??
            post.link ??
            "",


          createdAt:
            post.created_at ??
            post.createdAt ??
            ""

        };


        /*
          Keep valid rows.
        */

        if (
          video.id !== "" ||
          video.videoUrl !== ""
        ) {

          videos.push(
            video
          );

        }

      }
    );


    console.log(
      "Total videos:",
      videos.length
    );


    render(
      "All"
    );


  } catch (error) {

    console.error(
      "VIDEO LOADING ERROR:",
      error
    );


    videoGrid.innerHTML = `

      <div class="error-box">

        <h3>
          Unable to load videos
        </h3>

        <p>
          ভিডিও লোড করা যাচ্ছে না।
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

  if (!videoGrid) {
    return;
  }


  videoGrid.innerHTML = "";


  const selectedCategory =
    String(
      category
    )
      .trim()
      .toLowerCase();


  const filteredVideos =
    selectedCategory === "all"

      ? videos

      : videos.filter(
          video => {

            return String(
              video.category
            )
              .trim()
              .toLowerCase() ===
              selectedCategory;

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


      let thumbnailHTML = `

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
          >

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

            openVideo(
              video
            );

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


  /*
    Default text only.
  */

  if (modalText) {

    modalText.textContent =
      "Watch 3 ads to unlock this video.";

  }


  /*
    Thumbnail preview.
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
    3/3 ONLY
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


    if (watchAdBtn) {

      watchAdBtn.disabled =
        true;

      watchAdBtn.textContent =
        "✓ Ads Completed";

    }


    if (modalText) {

      modalText.textContent =
        "🎉 All ads completed! Your video is unlocked.";

    }


    return;

  }


  /*
    0/3, 1/3, 2/3

    No completion message.
  */

  if (videoBtn) {

    videoBtn.disabled =
      true;

    videoBtn.textContent =
      "🔒 Video Locked";

  }


  if (watchAdBtn) {

    watchAdBtn.disabled =
      false;

    watchAdBtn.textContent =
      `▶ Watch Ad (${adsWatched}/${requiredAds})`;

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

    /*
      Monetag function
    */

    const showAd =
      window[
        MONETAG_FUNCTION
      ];


    if (
      typeof showAd !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    console.log(
      "Opening rewarded ad..."
    );


    /*
      IMPORTANT:
      Do not increment before
      the SDK promise completes.
    */

    const result =
      await showAd();


    console.log(
      "Rewarded ad result:",
      result
    );


    /*
      Completed ad.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      adsWatched += 1;

    }


    updateUnlockUI();


  } catch (error) {

    console.error(
      "Rewarded ad error:",
      error
    );


    /*
      If user closes the ad
      or the ad fails:

      Counter stays unchanged.

      No X message is shown.
    */

    updateUnlockUI();

  } finally {

    adLoading =
      false;


    if (
      adsWatched <
      requiredAds &&
      watchAdBtn
    ) {

      watchAdBtn.disabled =
        false;

      watchAdBtn.textContent =
        `▶ Watch Ad (${adsWatched}/${requiredAds})`;

    }

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
        Open video.html using ID.
      */

      if (
        selectedVideo.id !==
        ""
      ) {

        const videoId =
          encodeURIComponent(
            selectedVideo.id
          );


        window.location.href =
          `video.html?id=${videoId}`;

        return;

      }


      /*
        Fallback if ID doesn't exist.
      */

      if (
        selectedVideo.videoUrl
      ) {

        window.location.href =
          selectedVideo.videoUrl;

      }

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
            button.dataset.category ||
            "All"
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
            button.dataset.bottomCategory ||
            "All";


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
                  (
                    btn.dataset.category ||
                    ""
                  ) === category
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
   START
========================================================= */

loadPosts();
