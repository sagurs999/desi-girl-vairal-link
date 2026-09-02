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
   APPWRITE
========================================================= */

const APPWRITE_ENDPOINT =
  "https://cloud.appwrite.io/v1";


const APPWRITE_PROJECT_ID =
  "6a953702002468f915bf";


const APPWRITE_DATABASE_ID =
  "6a97f8710010ad20905d";


const APPWRITE_TABLE_ID =
  "6a97fa98002d5e65d0f4";


const client =
  new Appwrite.Client();


client
  .setEndpoint(
    APPWRITE_ENDPOINT
  )
  .setProject(
    APPWRITE_PROJECT_ID
  );


const tablesDB =
  new Appwrite.TablesDB(
    client
  );


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


let selectedVideo =
  null;


let adsWatched =
  0;


const requiredAds =
  3;


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
   LOAD POSTS FROM APPWRITE
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

    console.log(
      "Loading videos from Appwrite..."
    );


    const response =
      await tablesDB.listRows(
        APPWRITE_DATABASE_ID,
        APPWRITE_TABLE_ID,
        [
          Appwrite.Query.orderDesc(
            "$createdAt"
          )
        ]
      );


    console.log(
      "Appwrite response:",
      response
    );


    const rows =
      response.rows ||
      response.documents ||
      [];


    if (
      !Array.isArray(
        rows
      )
    ) {

      throw new Error(
        "Appwrite response is invalid."
      );

    }


    videos.length =
      0;


    rows.forEach(
      post => {

        if (!post) {
          return;
        }


        const video = {

          id:
            post.$id ??
            post.id ??
            "",


          title:
            post.title ??
            "Untitled Video",


          category:
            post.category ??
            "Trending",


          thumbnail:
            post.thumbnail_url ??
            "",


          videoUrl:
            post.video_url ??
            "",


          createdAt:
            post.$createdAt ??
            ""

        };


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

        <p style="margin-top:10px;font-size:11px;">
          ${escapeHTML(
            error.message
          )}
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


  videoGrid.innerHTML =
    "";


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


  if (modalText) {

    modalText.textContent =
      "Watch 3 ads to unlock this video.";

  }


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


    const result =
      await showAd();


    console.log(
      "Rewarded ad result:",
      result
    );


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
      new URL(
        value
      );


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
