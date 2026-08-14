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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaG9mdGd1YmZia3Z5bm5kdG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDkwOTQsImV4cCI6MjEwMjIyNTA5NH0.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";

const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   SETTINGS
========================================================= */

const requiredAds = 3;

let adsWatched = 0;

let selectedVideo = null;

let adLoading = false;

const videos = [];


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

const progressText =
  document.getElementById("progressText");

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

  tgUser.textContent =
    user.first_name ||
    "Telegram User";
}


/* =========================================================
   SUPABASE STORAGE URL HELPER
========================================================= */

function getStorageUrl(value) {

  if (!value) {
    return "";
  }

  value = String(value).trim();

  /*
    Already a full URL
  */

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  /*
    Supabase storage path
  */

  if (
    value.startsWith("media/")
  ) {

    return (
      `${SUPABASE_URL}/storage/v1/object/public/${value}`
    );

  }

  /*
    Only filename
  */

  return (
    `${SUPABASE_URL}/storage/v1/object/public/media/${value}`
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


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Supabase ${response.status}: ${errorText}`
      );
    }


    const data =
      await response.json();


    if (!Array.isArray(data)) {

      throw new Error(
        "Invalid posts response."
      );
    }


    videos.length = 0;


    data.forEach(post => {

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
          getStorageUrl(
            post.thumbnail_url ||
            post.thumbnail ||
            ""
          ),

        videoUrl:
          getStorageUrl(
            post.video_url ||
            post.video ||
            ""
          )

      });

    });


    render("All");


  } catch (error) {

    console.error(
      "LOAD POSTS ERROR:",
      error
    );


    videoGrid.innerHTML = `
      <div class="error-box">

        <h3>
          Unable to load videos
        </h3>

        <p>
          Supabase থেকে ভিডিও লোড করা যাচ্ছে না।
        </p>

        <p style="margin-top:10px;font-size:12px;">
          ${escapeHTML(error.message)}
        </p>

      </div>
    `;

  }

}


/* =========================================================
   RENDER
========================================================= */

function render(category = "All") {

  videoGrid.innerHTML = "";


  const filteredVideos =
    category === "All"
      ? videos
      : videos.filter(
          video =>
            video.category === category
        );


  if (!filteredVideos.length) {

    videoGrid.innerHTML = `
      <div class="loading">
        No videos found.
      </div>
    `;

    return;
  }


  filteredVideos.forEach(
    (video, index) => {

      const card =
        document.createElement("article");

      card.className =
        "video-card";


      let thumbnailHTML = "";


      if (video.thumbnail) {

        thumbnailHTML = `
          <img
            src="${escapeHTML(video.thumbnail)}"
            alt="${escapeHTML(video.title)}"
            loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=&quot;thumbnail-placeholder&quot;>🎬</div>'"
          >
        `;

      } else {

        thumbnailHTML = `
          <div class="thumbnail-placeholder">
            🎬
          </div>
        `;

      }


      card.innerHTML = `

        <div class="thumbnail">

          ${thumbnailHTML}

        </div>


        <div class="card-content">

          <div class="card-title">
            ${escapeHTML(video.title)}
          </div>

          <div class="card-category">
            ${escapeHTML(video.category)}
          </div>

          <button
            class="watch-btn">

            🔓 Watch Ad

          </button>

        </div>

      `;


      const button =
        card.querySelector(
          ".watch-btn"
        );


      button.addEventListener(
        "click",
        () => {

          openVideo(video);

        }
      );


      videoGrid.appendChild(card);

    }
  );

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


  modalTitle.textContent =
    video.title;


  modalText.textContent =
    "Watch 3 ads to unlock this video.";


  if (video.thumbnail) {

    preview.innerHTML = `
      <img
        src="${escapeHTML(video.thumbnail)}"
        alt=""
      >
    `;

  } else {

    preview.innerHTML = `
      <div
        class="thumbnail-placeholder"
        style="height:100%;"
      >
        🎬
      </div>
    `;

  }


  modal.classList.remove(
    "hidden"
  );


  updateUnlockUI();

}


/* =========================================================
   UPDATE UNLOCK UI
========================================================= */

function updateUnlockUI() {

  const percent =
    Math.min(
      100,
      (adsWatched / requiredAds) * 100
    );


  progressBar.style.width =
    `${percent}%`;


  progressText.textContent =
    `${adsWatched} / ${requiredAds}`;


  watchAdBtn.textContent =
    `Watch Ad (${adsWatched}/${requiredAds})`;


  if (
    adsWatched >= requiredAds
  ) {

    videoBtn.disabled =
      false;

    videoBtn.textContent =
      "▶ Watch Video";

    watchAdBtn.disabled =
      true;

    watchAdBtn.textContent =
      "✓ Ads Completed";

    modalText.textContent =
      "🎉 All ads completed! Your video is unlocked.";

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

  if (adLoading) {
    return;
  }


  if (
    adsWatched >= requiredAds
  ) {
    return;
  }


  adLoading =
    true;

  watchAdBtn.disabled =
    true;

  watchAdBtn.textContent =
    "Loading Ad...";


  try {

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

      এখানে counter আগে বাড়বে না।

      SDK promise সফলভাবে resolve
      করার পরেই 1/3, 2/3, 3/3 হবে।
    */

    const result =
      await window.show_11571866();


    console.log(
      "Rewarded ad completed:",
      result
    );


    /*
      AD COMPLETION SUCCESS
    */

    adsWatched++;


    updateUnlockUI();


  } catch (error) {

    console.error(
      "MONETAG ERROR:",
      error
    );


    modalText.textContent =
      "Ad is not available right now. Please try again.";


    watchAdBtn.disabled =
      false;


    watchAdBtn.textContent =
      `Watch Ad (${adsWatched}/${requiredAds})`;

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
   WATCH VIDEO BUTTON
========================================================= */

videoBtn.addEventListener(
  "click",
  () => {

    if (!selectedVideo) {
      return;
    }


    if (
      adsWatched < requiredAds
    ) {
      return;
    }


    if (!selectedVideo.id) {

      alert(
        "Video ID পাওয়া যায়নি।"
      );

      return;
    }


    /*
      শুধু post ID পাঠানো হচ্ছে।

      video.html আবার Supabase থেকে
      সেই post-এর video_url নেবে।
    */

    const id =
      encodeURIComponent(
        selectedVideo.id
      );


    window.location.href =
      `video.html?id=${id}`;

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


        const category =
          button.dataset.category ||
          "All";


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


        render(category);

      }
    );

  });


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value)

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
