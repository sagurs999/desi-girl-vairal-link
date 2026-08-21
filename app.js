/* =========================================================
   DESI GIRL VAIRAL LINK
   APP.JS
========================================================= */


/* =========================================================
   TELEGRAM
========================================================= */

const tg =
  window.Telegram &&
  window.Telegram.WebApp;


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
   IMPORTANT

   This is a Supabase PUBLISHABLE key.

   It must be sent through:
   apikey

   NOT:
   Authorization: Bearer publishable-key
*/

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2L716MuF36gsDT5fGu_k9Q_LzGLqTk0";


const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   MONETAG
========================================================= */

const MONETAG_ZONE =
  "11571866";


const MONETAG_FUNCTION =
  "show_11571866";


/* =========================================================
   SETTINGS
========================================================= */

const REQUIRED_ADS =
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


/*
   This remembers that an ad was started
   but was not successfully completed.

   It helps us show the warning when the
   user returns after leaving the ad/app.
*/

const PENDING_AD_KEY =
  "desi_girl_pending_rewarded_ad";


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
       IMPORTANT:

       Only apikey is sent.

       We DO NOT send:

       Authorization:
       Bearer sb_publishable_...

       because publishable keys are API keys,
       not user JWT tokens.
    */

    const response =
      await fetch(
        `${POSTS_API}?select=id,title,category,thumbnail_url,video_url,created_at&order=created_at.desc`,
        {

          method: "GET",

          headers: {

            "apikey":
              SUPABASE_PUBLISHABLE_KEY,

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


    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Supabase returned invalid data."
      );

    }


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


    console.log(
      `Loaded ${videos.length} videos from Supabase.`
    );


    render(
      "All"
    );


  } catch (
    error
  ) {

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

        <button
          type="button"
          id="retryLoadBtn"
          class="open-btn"
        >
          🔄 Retry
        </button>

      </div>

    `;


    const retryButton =
      document.getElementById(
        "retryLoadBtn"
      );


    if (retryButton) {

      retryButton.addEventListener(
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

  videoGrid.innerHTML =
    "";


  const selectedCategory =
    String(
      category
    ).toLowerCase();


  const filteredVideos =
    selectedCategory === "all"

      ? videos

      : videos.filter(
          video =>
            String(
              video.category
            )
            .toLowerCase() ===
            selectedCategory
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


      if (
        thumb
      ) {

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


  /*
     New video = new ad session
  */

  clearPendingAd();


  modalTitle.textContent =
    video.title ||
    "Video";


  modalText.textContent =
    "Watch 3 ads to unlock this video.";


  /* =======================================================
     PREVIEW
  ======================================================== */

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

  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${REQUIRED_ADS})`;


  adCount.textContent =
    `${adsWatched} / ${REQUIRED_ADS} Ads Completed`;


  const percent =
    (
      adsWatched /
      REQUIRED_ADS
    ) * 100;


  progressBar.style.width =
    `${Math.min(
      percent,
      100
    )}%`;


  /* =======================================================
     UNLOCKED
  ======================================================== */

  if (
    adsWatched >=
    REQUIRED_ADS
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


    /*
       Important:
       Successful completion means
       there is no pending warning.
    */

    clearPendingAd();

    return;

  }


  /* =======================================================
     LOCKED
  ======================================================== */

  videoBtn.disabled =
    true;


  videoBtn.textContent =
    "🔒 Video Locked";


  watchAdBtn.disabled =
    false;

}


/* =========================================================
   PENDING AD STORAGE
========================================================= */

function savePendingAd() {

  try {

    const data = {

      videoId:
        selectedVideo
          ? selectedVideo.id
          : null,

      adsWatched:
        adsWatched,

      time:
        Date.now()

    };


    localStorage.setItem(
      PENDING_AD_KEY,
      JSON.stringify(
        data
      )
    );

  } catch (
    error
  ) {

    console.warn(
      "Could not save pending ad:",
      error
    );

  }

}


/* =========================================================
   CLEAR PENDING AD
========================================================= */

function clearPendingAd() {

  try {

    localStorage.removeItem(
      PENDING_AD_KEY
    );

  } catch (
    error
  ) {

    console.warn(
      "Could not clear pending ad:",
      error
    );

  }

}


/* =========================================================
   SHOW INCOMPLETE AD MESSAGE
========================================================= */

function showIncompleteAdMessage() {

  /*
     IMPORTANT:

     This message is shown ONLY when
     an ad attempt did not complete.

     It does NOT appear after 1/3 or 2/3
     just because the user watched normally.

     It also does NOT appear at 3/3.
  */

  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    return;

  }


  modalText.innerHTML = `

    <strong>
      ⚠️ বিজ্ঞাপন সম্পূর্ণ হয়নি
    </strong>
    <br><br>

    আপনি যদি <b>×</b> চাপ দিয়ে বিজ্ঞাপন থেকে বের হয়ে যান,
    তাহলে এই বিজ্ঞাপনটি গণনা হবে না।
    <br><br>

    <strong>
      ⚠️ Ad Not Completed
    </strong>
    <br><br>

    If you press <b>×</b> and leave the ad,
    this ad will not be counted.
    <br><br>

    <b>
      অনুগ্রহ করে Continue চাপ দিয়ে বিজ্ঞাপনটি সম্পূর্ণ করুন।
    </b>
    <br>

    Please tap <b>Continue</b> to complete the ad.

  `;


  watchAdBtn.disabled =
    false;


  watchAdBtn.textContent =
    `▶ Watch Ad (${adsWatched}/${REQUIRED_ADS})`;

}


/* =========================================================
   MONETAG SDK CHECK
========================================================= */

function getMonetagFunction() {

  const adFunction =
    window[
      MONETAG_FUNCTION
    ];


  if (
    typeof adFunction !==
    "function"
  ) {

    return null;

  }


  return adFunction;

}


/* =========================================================
   WAIT FOR MONETAG SDK
========================================================= */

async function waitForMonetag(
  maxWait = 10000
) {

  const start =
    Date.now();


  while (
    Date.now() -
    start <
    maxWait
  ) {

    const adFunction =
      getMonetagFunction();


    if (
      adFunction
    ) {

      return adFunction;

    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          250
        )
    );

  }


  return null;

}


/* =========================================================
   SHOW REWARDED AD
========================================================= */

async function showRewardedAd() {

  if (
    adLoading
  ) {

    return;

  }


  if (
    adsWatched >=
    REQUIRED_ADS
  ) {

    return;

  }


  if (
    !selectedVideo
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
     Save pending attempt BEFORE opening ad.

     If user leaves the ad/app before completion,
     this attempt will not be counted.
  */

  savePendingAd();


  try {

    const showAd =
      await waitForMonetag(
        10000
      );


    if (
      !showAd
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    console.log(
      "Starting Monetag Rewarded Interstitial..."
    );


    /*
       IMPORTANT:

       type "end" means the Promise
       resolves after the rewarded ad
       has completed/closed successfully.

       ONLY AFTER resolve do we increase
       adsWatched.
    */

    await showAd({

      type:
        "end",

      requestVar:
        "video_unlock",

      ymid:
        getTelegramUserId()

    });


    /*
       SUCCESS

       The ad Promise completed.

       Now and ONLY now:
       increase counter.
    */

    adsWatched =
      Math.min(
        adsWatched + 1,
        REQUIRED_ADS
      );


    console.log(
      `Rewarded ad completed: ${adsWatched}/${REQUIRED_ADS}`
    );


    /*
       Successful ad = remove pending state.
    */

    clearPendingAd();


    /*
       IMPORTANT:

       If this is 1/3 or 2/3,
       do NOT show any warning.

       If 3/3,
       do NOT show warning.
    */

    if (
      adsWatched <
      REQUIRED_ADS
    ) {

      modalText.textContent =
        `Ad completed successfully. ${adsWatched}/${REQUIRED_ADS} ads completed.`;

    }


    updateUnlockUI();


  } catch (
    error
  ) {

    console.error(
      "Rewarded ad failed or was not completed:",
      error
    );


    /*
       DO NOT increase adsWatched.
    */


    showIncompleteAdMessage();


  } finally {

    adLoading =
      false;


    /*
       If not completed, allow retry.
    */

    if (
      adsWatched <
      REQUIRED_ADS
    ) {

      watchAdBtn.disabled =
        false;

    }

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
   WATCH VIDEO BUTTON
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
        REQUIRED_ADS
      ) {

        return;

      }


      const videoId =
        encodeURIComponent(
          selectedVideo.id
        );


      /*
         Successful 3/3:
         no warning.
      */

      clearPendingAd();


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
   TELEGRAM USER ID
========================================================= */

function getTelegramUserId() {

  try {

    if (
      tg &&
      tg.initDataUnsafe &&
      tg.initDataUnsafe.user &&
      tg.initDataUnsafe.user.id
    ) {

      return String(
        tg.initDataUnsafe.user.id
      );

    }

  } catch (
    error
  ) {

    console.warn(
      "Telegram user ID unavailable:",
      error
    );

  }


  /*
     Fallback for users outside Telegram.
  */

  return (
    "guest_" +
    Date.now()
  );

}


/* =========================================================
   HANDLE RETURN AFTER INCOMPLETE AD
========================================================= */

function checkPendingAd() {

  try {

    const raw =
      localStorage.getItem(
        PENDING_AD_KEY
      );


    if (
      !raw
    ) {

      return;

    }


    const pending =
      JSON.parse(
        raw
      );


    /*
       Only consider a recent attempt.

       30 minutes maximum.
    */

    const age =
      Date.now() -
      Number(
        pending.time || 0
      );


    if (
      age >
      30 * 60 * 1000
    ) {

      clearPendingAd();

      return;

    }


    /*
       We don't automatically increase
       the counter.

       The ad was pending but not confirmed.
    */

    console.log(
      "Previous rewarded ad was not confirmed."
    );


    /*
       If modal is already open,
       show warning.
    */

    if (
      modal &&
      !modal.classList.contains(
        "hidden"
      ) &&
      adsWatched <
        REQUIRED_ADS
    ) {

      showIncompleteAdMessage();

    }


    /*
       Remove it after handling so the
       same warning isn't repeated forever.
    */

    clearPendingAd();


  } catch (
    error
  ) {

    console.warn(
      "Pending ad check failed:",
      error
    );


    clearPendingAd();

  }

}


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    /*
       When user returns to the Mini App,
       don't increase counter automatically.

       The Monetag Promise is the only
       success confirmation.
    */

    if (
      document.visibilityState ===
      "visible"
    ) {

      console.log(
        "User returned to Mini App."
      );

    }

  }
);


/* =========================================================
   PAGE START
========================================================= */

loadPosts();


/*
   Check old unfinished attempt
   after app UI has loaded.
*/

setTimeout(
  checkPendingAd,
  700
);
