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
   IMPORTANT:
   Publishable key must be sent through "apikey".
   Do NOT send sb_publishable key as Bearer token.
========================================================= */

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";

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
   STATE
========================================================= */

const videos = [];

let selectedVideo = null;

let adsWatched = 0;

const requiredAds = 3;

let adLoading = false;

let adPromisePending = false;

let adWasHidden = false;

let adReturnedFromBackground = false;

let adWarningShown = false;

let adVisibilityTimer = null;


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

  if (tgUser) {

    tgUser.textContent =
      user.first_name ||
      "Telegram User";

  }

}


/* =========================================================
   SAFE HTML ESCAPE
========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   BILINGUAL AD WARNING
========================================================= */

function showAdContinueWarning() {

  if (!modalText) {
    return;
  }

  /*
    IMPORTANT:

    This message appears only when the rewarded
    ad has NOT completed and the user returns
    from the ad.

    It does NOT increase adsWatched.
  */

  modalText.innerHTML = `
    <div class="ad-warning-message">

      <strong>
        ⚠️ Ad not completed / এড সম্পূর্ণ হয়নি
      </strong>

      <br><br>

      <span>
        Please click <b>Continue</b> inside the ad
        to complete the ad and receive your reward.
      </span>

      <br>

      <span>
        রিওয়ার্ড পেতে এডের ভিতরের
        <b>Continue</b> বাটনে ক্লিক করে এডটি সম্পূর্ণ করুন।
      </span>

      <br><br>

      <small>
        Closing the ad with X will not count.
        / X চাপলে এই ad count হবে না।
      </small>

    </div>
  `;

  adWarningShown = true;

}


/* =========================================================
   CLEAR AD WARNING
========================================================= */

function clearAdWarning() {

  adWarningShown = false;

  if (!modalText) {
    return;
  }

  /*
    Do not overwrite the unlocked message.
  */

  if (adsWatched >= requiredAds) {

    modalText.textContent =
      "🎉 All ads completed! Your video is unlocked.";

    return;

  }

  modalText.textContent =
    `Watch ${requiredAds - adsWatched} more ad(s) to unlock this video.`;

}


/* =========================================================
   SUPABASE LOAD POSTS
========================================================= */

async function loadPosts() {

  if (!videoGrid) {
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

      We use ONLY the apikey header.

      Do NOT use:
      Authorization: Bearer sb_publishable_...
    */

    const url =
      `${POSTS_API}?select=id,title,category,thumbnail_url,video_url,created_at&order=created_at.desc`;

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


    if (!response.ok) {

      let errorMessage =
        `Supabase ${response.status}`;

      try {

        const errorData =
          await response.json();

        if (errorData) {

          errorMessage =
            errorData.message ||
            errorData.error ||
            JSON.stringify(errorData);

        }

      } catch (_) {

        const text =
          await response.text();

        if (text) {

          errorMessage =
            text;

        }

      }

      throw new Error(
        errorMessage
      );

    }


    const data =
      await response.json();


    if (!Array.isArray(data)) {

      throw new Error(
        "Supabase returned an invalid response."
      );

    }


    videos.length = 0;


    data.forEach(
      post => {

        /*
          Ignore completely empty rows.
        */

        if (!post) {
          return;
        }


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


    render("All");


  } catch (error) {

    console.error(
      "Supabase load error:",
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
          id="retryPosts"
          type="button"
          class="retry-btn"
        >
          🔄 Retry
        </button>

      </div>

    `;


    const retryBtn =
      document.getElementById(
        "retryPosts"
      );


    if (retryBtn) {

      retryBtn.addEventListener(
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


  const normalizedCategory =
    String(category)
      .trim()
      .toLowerCase();


  const filteredVideos =
    normalizedCategory === "all"

      ? videos

      : videos.filter(
          video =>
            String(
              video.category
            )
              .trim()
              .toLowerCase() ===
            normalizedCategory
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


      /* =====================================================
         THUMBNAIL
      ===================================================== */

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
            onerror="this.style.display='none'; this.parentElement.classList.add('thumb-error');"
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
         OPEN BUTTON
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

            openVideo(video);

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

  adPromisePending =
    false;

  adWasHidden =
    false;

  adReturnedFromBackground =
    false;

  adWarningShown =
    false;


  if (adVisibilityTimer) {

    clearTimeout(
      adVisibilityTimer
    );

    adVisibilityTimer =
      null;

  }


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
    preview
  ) {

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

  }


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

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
        100,
        (
          adsWatched /
          requiredAds
        ) * 100
      );


    progressBar.style.width =
      `${percent}%`;

  }


  /* =====================================================
     FULLY UNLOCKED
  ===================================================== */

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


    /*
      IMPORTANT:
      When all 3 ads are completed,
      NO warning message.
    */

    if (modalText) {

      modalText.textContent =
        "🎉 All ads completed! Your video is unlocked.";

    }


    adWarningShown =
      false;

    return;

  }


  /* =====================================================
     STILL LOCKED
  ===================================================== */

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
   MONETAG SDK CHECK
========================================================= */

function monetagReady() {

  return (
    typeof window[MONETAG_FUNCTION] ===
    "function"
  );

}


/* =========================================================
   AD RETURN DETECTION
========================================================= */

/*
  We cannot directly control the Monetag ad's internal
  X or Continue buttons.

  We can detect when the user leaves/returns to the
  Mini App while a rewarded ad promise is still pending.

  If the promise is still pending after returning,
  we show the bilingual Continue instruction.

  IMPORTANT:
  This NEVER increases the ad counter.
*/


function markAdReturned() {

  if (
    !adLoading ||
    !adPromisePending
  ) {

    return;

  }


  adReturnedFromBackground =
    true;


  if (adVisibilityTimer) {

    clearTimeout(
      adVisibilityTimer
    );

  }


  adVisibilityTimer =
    setTimeout(
      () => {

        /*
          If the SDK has not completed yet,
          show the Continue instruction.

          If it completed during this time,
          this warning will NOT be shown.
        */

        if (
          adLoading &&
          adPromisePending &&
          adsWatched < requiredAds
        ) {

          showAdContinueWarning();

        }

      },
      700
    );

}


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      !adLoading ||
      !adPromisePending
    ) {

      return;

    }


    if (
      document.visibilityState ===
      "hidden"
    ) {

      adWasHidden =
        true;

    } else if (
      document.visibilityState ===
      "visible" &&
      adWasHidden
    ) {

      markAdReturned();

    }

  }
);


/* =========================================================
   WINDOW BLUR / FOCUS
========================================================= */

window.addEventListener(
  "blur",
  () => {

    if (
      adLoading &&
      adPromisePending
    ) {

      adWasHidden =
        true;

    }

  }
);


window.addEventListener(
  "focus",
  () => {

    if (
      adLoading &&
      adPromisePending &&
      adWasHidden
    ) {

      markAdReturned();

    }

  }
);


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


  /* =====================================================
     CHECK MONETAG
  ===================================================== */

  if (
    !monetagReady()
  ) {

    if (modalText) {

      modalText.innerHTML = `

        <strong>
          ⚠️ Ad system is not ready
          / এড সিস্টেম প্রস্তুত নয়
        </strong>

        <br><br>

        Please wait a few seconds and try again.
        <br>
        কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।

      `;

    }

    return;

  }


  /* =====================================================
     START
  ===================================================== */

  adLoading =
    true;

  adPromisePending =
    true;

  adWasHidden =
    false;

  adReturnedFromBackground =
    false;

  adWarningShown =
    false;


  if (watchAdBtn) {

    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "⏳ Loading Ad...";

  }


  /*
    Remove old warning when starting a new ad.
  */

  clearAdWarning();


  try {

    console.log(
      "Starting Monetag rewarded ad..."
    );


    /*
      IMPORTANT:

      Do not increment adsWatched here.

      It will only increment AFTER the SDK
      Promise completes successfully.
    */

    const adFunction =
      window[MONETAG_FUNCTION];


    const result =
      await adFunction();


    /* ===================================================
       AD COMPLETED
    =================================================== */

    console.log(
      "Monetag rewarded ad completed:",
      result
    );


    /*
      Promise completed successfully.

      Now and ONLY now:
      increase the counter.
    */

    adsWatched =
      Math.min(
        requiredAds,
        adsWatched + 1
      );


    /*
      Clear any pending warning.
    */

    adWarningShown =
      false;

    adReturnedFromBackground =
      false;

    adWasHidden =
      false;


    updateUnlockUI();


    /*
      If this was 1/3 or 2/3,
      show normal next-ad text.

      If 3/3:
      updateUnlockUI() already shows unlocked message.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      if (modalText) {

        const remaining =
          requiredAds -
          adsWatched;

        modalText.textContent =
          `✅ Ad completed! / এড সম্পূর্ণ হয়েছে! ${remaining} more ad(s) remaining.`;

      }

    }


  } catch (error) {

    /* ===================================================
       AD DID NOT COMPLETE
    =================================================== */

    console.error(
      "Monetag rewarded ad error:",
      error
    );


    /*
      IMPORTANT:

      Counter stays exactly where it was.

      Example:
      1/3 -> X -> remains 1/3
      2/3 -> X -> remains 2/3
      3/3 is impossible here because unlocked.
    */


    if (
      modalText &&
      !adWarningShown
    ) {

      modalText.innerHTML = `

        <strong>
          ⚠️ Ad not completed
          / এড সম্পূর্ণ হয়নি
        </strong>

        <br><br>

        Please click
        <b>Continue</b>
        inside the ad.
        <br>

        এডের ভিতরের
        <b>Continue</b>
        বাটনে ক্লিক করুন।

        <br><br>

        <small>
          X চাপলে ad count হবে না।
          <br>
          Closing with X will not count.
        </small>

      `;

    }


    /*
      Restore button.
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

    adPromisePending =
      false;

    adWasHidden =
      false;

    adReturnedFromBackground =
      false;

    if (adVisibilityTimer) {

      clearTimeout(
        adVisibilityTimer
      );

      adVisibilityTimer =
        null;

    }


    /*
      Keep UI correct after ad closes.
    */

    updateUnlockUI();

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


      /*
        Use post ID to open video.html.
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

      /*
        Closing our own modal is allowed.

        It does NOT change ad counter.
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
   CLICK OUTSIDE MODAL
========================================================= */

if (modal) {

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
   START APP
========================================================= */

loadPosts();
