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
  IMPORTANT

  This is the Publishable Key.

  Do NOT use the old JWT anon key.
*/

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2L716MuF36gsDT5fGu_k9Q_LzGLqTk0";


const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;



/* =========================================================
   STATE
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


/*
  Used to know that an ad was opened.

  This helps us show a message when the
  user leaves/closes an ad without completing it.
*/

let adWasOpened =
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

if (
  tg &&
  tg.initDataUnsafe &&
  tg.initDataUnsafe.user &&
  tgUser
) {

  const user =
    tg.initDataUnsafe.user;


  tgUser.textContent =
    user.first_name ||
    "Telegram User";

}



/* =========================================================
   LOAD POSTS
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

      Only send the Publishable Key
      through the apikey header.
    */

    const url =
      `${POSTS_API}` +
      `?select=id,title,category,thumbnail_url,video_url,created_at` +
      `&order=created_at.desc`;


    const response =
      await fetch(
        url,
        {

          method:
            "GET",

          headers:
            {
              "apikey":
                SUPABASE_PUBLISHABLE_KEY,

              "Accept":
                "application/json"
            },

          cache:
            "no-store"

        }
      );



    /* =====================================================
       ERROR
    ====================================================== */

    if (!response.ok) {

      let message =
        `Supabase HTTP ${response.status}`;


      try {

        const errorData =
          await response.json();


        if (
          errorData.message
        ) {

          message =
            errorData.message;

        }


        if (
          errorData.hint
        ) {

          message +=
            ` ${errorData.hint}`;

        }

      }

      catch (_) {

        const text =
          await response.text();


        if (text) {

          message =
            text;

        }

      }


      throw new Error(
        message
      );

    }



    /* =====================================================
       DATA
    ====================================================== */

    const data =
      await response.json();


    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Invalid Supabase response."
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
      "Supabase videos:",
      videos.length
    );


    render(
      "All"
    );


  }

  catch (error) {

    console.error(
      "Supabase Error:",
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
          id="retryBtn"
          type="button"
          class="retry-btn"
        >
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
    filteredVideos.length ===
    0
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



      /* ===================================================
         THUMBNAIL
      =================================================== */

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

      }

      else {

        thumbnailHTML = `

          <div class="thumb-placeholder">
            🎬
          </div>

        `;

      }



      /* ===================================================
         CARD
      =================================================== */

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



      /* ===================================================
         BUTTON
      =================================================== */

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



      /* ===================================================
         THUMBNAIL
      =================================================== */

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


  adWasOpened =
    false;



  if (modalTitle) {

    modalTitle.textContent =
      video.title ||
      "Video";

  }



  /*
    Initial message only.

    Important:
    If an ad later completes,
    this message disappears.

    If user closes/abandons an ad,
    the bilingual instruction appears.
  */

  if (modalText) {

    modalText.innerHTML = `

      Watch 3 ads to unlock this video.
      <br>

      ভিডিও আনলক করতে ৩টি বিজ্ঞাপন সম্পূর্ণ করুন।

    `;

  }



  /* =======================================================
     PREVIEW
  ======================================================= */

  if (preview) {

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

    }

    else {

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



  /* =======================================================
     SHOW MODAL
  ======================================================= */

  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }



  updateUnlockUI();

}



/* =========================================================
   UPDATE UI
========================================================= */

function updateUnlockUI() {

  /* =======================================================
     COUNTER
  ======================================================= */

  if (adCount) {

    adCount.textContent =
      `${adsWatched} / ${requiredAds} Ads Completed`;

  }



  /* =======================================================
     PROGRESS
  ======================================================= */

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



  /* =======================================================
     COMPLETE
  ======================================================= */

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

      After 3/3, remove all
      warning/error messages.
    */

    if (modalText) {

      modalText.innerHTML =
        "";

    }


    return;

  }



  /* =======================================================
     LOCKED
  ======================================================= */

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
   SHOW X / CONTINUE MESSAGE
========================================================= */

function showAdContinueMessage() {

  /*
    If all ads are already complete,
    never show this message.
  */

  if (
    adsWatched >=
    requiredAds
  ) {

    return;

  }


  if (!modalText) {
    return;
  }


  modalText.innerHTML = `

    ⚠️ আপনি বিজ্ঞাপনের ভিতরের X চাপ দিয়ে বের হয়ে গেছেন।
    <br><br>

    বিজ্ঞাপনটি সম্পূর্ণ করতে আবার
    <b>Continue</b> বাটনে ক্লিক করুন।
    <br><br>

    ⚠️ You closed the ad using the X button.
    <br><br>

    Please click the
    <b>Continue</b>
    button inside the ad to complete it.

  `;

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



  /* =======================================================
     CHECK SDK
  ======================================================= */

  if (
    typeof window.show_11571866 !==
    "function"
  ) {

    if (modalText) {

      modalText.innerHTML = `

        ⚠️ বিজ্ঞাপন সিস্টেম এখনো লোড হচ্ছে।
        <br>
        একটু পরে আবার চেষ্টা করুন।
        <br><br>

        ⚠️ The ad system is still loading.
        <br>
        Please try again in a moment.

      `;

    }

    return;

  }



  /* =======================================================
     LOADING
  ======================================================= */

  adLoading =
    true;


  adWasOpened =
    true;


  if (watchAdBtn) {

    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "⏳ Loading Ad...";

  }



  try {

    /*
      IMPORTANT:

      DO NOT increment the counter
      before this promise completes.
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag rewarded result:",
      result
    );


    /*
      The rewarded ad promise completed.

      NOW count the ad.
    */

    adsWatched++;


    adWasOpened =
      false;


    /*
      If this is the final ad,
      no message will be shown.
    */

    updateUnlockUI();


    /*
      For 1/3 and 2/3:
      keep normal interface.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      if (modalText) {

        modalText.innerHTML = `

          ✅ Ad completed successfully.
          <br>
          বিজ্ঞাপন সম্পূর্ণ হয়েছে।
          <br><br>

          এখন পরের বিজ্ঞাপনটি দেখুন।

        `;

      }

    }

  }

  catch (error) {

    console.error(
      "Monetag rewarded ad error:",
      error
    );


    /*
      IMPORTANT:

      Counter does NOT increase.

      X / close / unavailable =
      no reward.
    */

    if (
      adsWatched <
      requiredAds
    ) {

      showAdContinueMessage();

    }


    if (watchAdBtn) {

      watchAdBtn.disabled =
        false;

      watchAdBtn.textContent =
        `▶ Watch Ad (${adsWatched}/${requiredAds})`;

    }

  }

  finally {

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
   WATCH VIDEO
========================================================= */

if (videoBtn) {

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
