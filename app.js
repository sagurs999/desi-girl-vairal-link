/* =========================================================
   VIDEO APP - APPWRITE + MONETAG
   3 ADS -> VIDEO UNLOCK
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     TELEGRAM
     ========================================================= */

  const tg = window.Telegram?.WebApp || null;

  if (tg) {
    tg.ready();
    tg.expand();
  }


  /* =========================================================
     APPWRITE CONFIG
     ========================================================= */

  const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";

  const APPWRITE_PROJECT_ID = "6a953702002468f915bf";

  const APPWRITE_DATABASE_ID = "6a97f8710010ad20905d";

  const APPWRITE_TABLE_ID = "6a97fa98002d5e65d0f4";

  const APPWRITE_BUCKET_ID = "6a9539820022110c710";


  /* =========================================================
     MONETAG
     ========================================================= */

  const MONETAG_ZONE = "11571866";

  const MONETAG_FUNCTION = `show_${MONETAG_ZONE}`;


  /* =========================================================
     ADS
     ========================================================= */

  const requiredAds = 3;

  let adsWatched = 0;

  let adLoading = false;


  /* =========================================================
     APPWRITE INITIALIZE
     ========================================================= */

  if (!window.Appwrite) {
    console.error("Appwrite SDK is not loaded.");
    return;
  }

  const client = new Appwrite.Client();

  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);


  const tablesDB = new Appwrite.TablesDB(client);


  /* =========================================================
     STATE
     ========================================================= */

  const videos = [];

  let selectedVideo = null;


  /* =========================================================
     DOM HELPERS
     ========================================================= */

  function findElement(...selectors) {

    for (const selector of selectors) {

      const element = document.querySelector(selector);

      if (element) {
        return element;
      }

    }

    return null;
  }


  /* =========================================================
     DOM ELEMENTS
     ========================================================= */

  const videoList = findElement(
    "#videoList",
    "#videos",
    "#videoGrid",
    ".video-grid",
    ".videos"
  );

  const modal = findElement(
    "#videoModal",
    "#modal",
    ".video-modal"
  );

  const modalTitle = findElement(
    "#modalTitle",
    "#videoTitle",
    ".modal-title"
  );

  const modalText = findElement(
    "#modalText",
    "#videoText",
    ".modal-text"
  );

  const modalThumbnail = findElement(
    "#modalThumbnail",
    "#videoThumbnail",
    ".modal-thumbnail"
  );

  const adBtn = findElement(
    "#adBtn",
    "#watchAdBtn",
    "#watchAd",
    ".watch-ad-btn"
  );

  const videoBtn = findElement(
    "#videoBtn",
    "#watchVideoBtn",
    "#playVideoBtn",
    ".watch-video-btn"
  );

  const closeModal = findElement(
    "#closeModal",
    "#modalClose",
    ".modal-close"
  );


  /* =========================================================
     ERROR MESSAGE
     ========================================================= */

  function showError(message) {

    console.error(message);

    if (videoList) {

      videoList.innerHTML = `
        <div style="
          padding:25px;
          text-align:center;
          color:#ff6b6b;
          background:rgba(255,0,0,.08);
          border-radius:15px;
          margin:15px 0;
        ">
          <div style="font-size:35px;margin-bottom:10px;">
            ⚠️
          </div>

          <div style="font-size:16px;font-weight:600;">
            ${escapeHTML(message)}
          </div>
        </div>
      `;

    }

  }


  /* =========================================================
     HTML ESCAPE
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
     APPWRITE VIEW URL
     ========================================================= */

  function buildAppwriteViewUrl(fileId) {

    if (!fileId) {
      return "";
    }

    return (
      `${APPWRITE_ENDPOINT}` +
      `/storage/buckets/${encodeURIComponent(APPWRITE_BUCKET_ID)}` +
      `/files/${encodeURIComponent(fileId)}` +
      `/view?project=${encodeURIComponent(APPWRITE_PROJECT_ID)}`
    );

  }


  /* =========================================================
     NORMALIZE FILE URL
     ========================================================= */

  function normalizeFileUrl(value) {

    if (!value) {
      return "";
    }

    const raw = String(value).trim();

    if (!raw) {
      return "";
    }


    /* -----------------------------------------
       যদি শুধু File ID দেওয়া থাকে
       ----------------------------------------- */

    if (
      !raw.startsWith("http://") &&
      !raw.startsWith("https://")
    ) {

      return buildAppwriteViewUrl(raw);

    }


    /* -----------------------------------------
       Full URL
       ----------------------------------------- */

    try {

      const url = new URL(raw);

      /*
       admin mode frontend-এ ব্যবহার করব না
      */

      url.searchParams.delete("mode");

      /*
       project ID না থাকলে যোগ করব
      */

      if (!url.searchParams.get("project")) {

        url.searchParams.set(
          "project",
          APPWRITE_PROJECT_ID
        );

      }

      return url.toString();

    } catch (error) {

      console.warn(
        "Could not parse file URL:",
        raw
      );

      return raw;

    }

  }


  /* =========================================================
     SESSION UNLOCK KEY
     ========================================================= */

  function getUnlockKey(videoId) {

    return `video_unlocked_${videoId}`;

  }


  /* =========================================================
     CHECK UNLOCK
     ========================================================= */

  function isVideoUnlocked(videoId) {

    if (!videoId) {
      return false;
    }

    return (
      sessionStorage.getItem(
        getUnlockKey(videoId)
      ) === "true"
    );

  }


  /* =========================================================
     SAVE UNLOCK
     ========================================================= */

  function unlockVideo(videoId) {

    if (!videoId) {
      return;
    }

    sessionStorage.setItem(
      getUnlockKey(videoId),
      "true"
    );

  }


  /* =========================================================
     LOAD POSTS FROM APPWRITE
     ========================================================= */

  async function loadPosts() {

    if (!videoList) {

      console.error(
        "Video list container was not found."
      );

      return;

    }


    videoList.innerHTML = `
      <div style="
        padding:30px;
        text-align:center;
        opacity:.8;
      ">
        Loading videos...
      </div>
    `;


    try {

      /*
       * Current Appwrite TablesDB syntax
       */

      const response = await tablesDB.listRows({

        databaseId: APPWRITE_DATABASE_ID,

        tableId: APPWRITE_TABLE_ID,

        queries: [

          Appwrite.Query.orderDesc("$createdAt")

        ]

      });


      console.log(
        "Appwrite rows:",
        response.rows
      );


      videos.length = 0;


      for (const post of response.rows || []) {

        /*
         * IMPORTANT:
         *
         * Appwrite screenshot:
         * thumbnail
         * videoUrl
         *
         * তাই আমরা দুটো নামই support করছি।
         */

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
            post.thumbnail ??
            post.thumbnail_url ??
            "",

          videoUrl:
            post.videoUrl ??
            post.video_url ??
            "",

          createdAt:
            post.$createdAt ??
            ""

        };


        /*
         * Video URL clean করা
         */

        video.videoUrl =
          normalizeFileUrl(
            video.videoUrl
          );


        /*
         * Thumbnail URL clean করা
         */

        video.thumbnail =
          normalizeFileUrl(
            video.thumbnail
          );


        videos.push(video);

      }


      render();


    } catch (error) {

      console.error(
        "Appwrite load error:",
        error
      );

      showError(
        "ভিডিও লোড করা যাচ্ছে না। Appwrite Table permission চেক করুন।"
      );

    }

  }


  /* =========================================================
     RENDER VIDEOS
     ========================================================= */

  function render() {

    if (!videoList) {
      return;
    }


    if (!videos.length) {

      videoList.innerHTML = `
        <div style="
          padding:30px;
          text-align:center;
          opacity:.8;
        ">
          No videos found.
        </div>
      `;

      return;

    }


    videoList.innerHTML = "";


    videos.forEach((video, index) => {

      const card = document.createElement("div");

      card.className = "video-card";


      const thumbnailHTML =
        video.thumbnail
          ? `
            <img
              src="${escapeHTML(video.thumbnail)}"
              alt="${escapeHTML(video.title)}"
              class="video-thumbnail"
              loading="lazy"
              onerror="this.style.display='none'"
            >
          `
          : `
            <div class="video-thumbnail-placeholder">
              ▶
            </div>
          `;


      card.innerHTML = `

        <div class="video-card-media">

          ${thumbnailHTML}

          <div class="play-overlay">
            ▶
          </div>

        </div>

        <div class="video-card-content">

          <div class="video-category">
            ${escapeHTML(video.category)}
          </div>

          <h3 class="video-card-title">
            ${escapeHTML(video.title)}
          </h3>

          <button
            class="watch-ad-card-btn"
            type="button"
          >
            🔒 Watch Ad
          </button>

        </div>

      `;


      const button =
        card.querySelector(
          ".watch-ad-card-btn"
        );


      if (button) {

        button.addEventListener(
          "click",
          () => openVideo(video)
        );

      }


      /*
       * Card click
       */

      card.addEventListener(
        "click",
        (event) => {

          if (
            event.target.closest(
              ".watch-ad-card-btn"
            )
          ) {
            return;
          }

          openVideo(video);

        }
      );


      videoList.appendChild(card);

    });

  }


  /* =========================================================
     OPEN VIDEO MODAL
     ========================================================= */

  function openVideo(video) {

    selectedVideo = video;

    /*
     * প্রতিবার নতুন করে 3 ads
     */

    adsWatched = 0;


    /*
     * আগের unlock সরিয়ে দেওয়া
     */

    if (video.id) {

      sessionStorage.removeItem(
        getUnlockKey(video.id)
      );

    }


    if (modalTitle) {

      modalTitle.textContent =
        video.title || "Video";

    }


    if (modalText) {

      modalText.textContent =
        `Watch ${requiredAds} ads to unlock this video.`;

    }


    if (modalThumbnail) {

      if (video.thumbnail) {

        modalThumbnail.src =
          video.thumbnail;

        modalThumbnail.style.display =
          "block";

      } else {

        modalThumbnail.style.display =
          "none";

      }

    }


    updateUnlockUI();


    if (modal) {

      modal.style.display = "flex";

    }

  }


  /* =========================================================
     CLOSE MODAL
     ========================================================= */

  function closeVideoModal() {

    if (modal) {

      modal.style.display = "none";

    }

    selectedVideo = null;

    adsWatched = 0;

    adLoading = false;

  }


  if (closeModal) {

    closeModal.addEventListener(
      "click",
      closeVideoModal
    );

  }


  /* =========================================================
     UPDATE UNLOCK UI
     ========================================================= */

  function updateUnlockUI() {

    const unlocked =
      adsWatched >= requiredAds;


    if (videoBtn) {

      videoBtn.disabled =
        !unlocked;

      videoBtn.style.opacity =
        unlocked ? "1" : ".5";

      videoBtn.style.cursor =
        unlocked
          ? "pointer"
          : "not-allowed";


      videoBtn.textContent =
        unlocked
          ? "▶ Watch Video"
          : `🔒 Watch Video (${adsWatched}/${requiredAds})`;

    }


    if (adBtn) {

      adBtn.disabled =
        unlocked || adLoading;

      adBtn.textContent =
        unlocked
          ? "✓ Ads Completed"
          : adLoading
            ? "⏳ Loading Ad..."
            : `▶ Watch Ad (${adsWatched}/${requiredAds})`;

    }


    if (modalText) {

      if (unlocked) {

        modalText.textContent =
          "✅ Video unlocked. You can watch it now.";

      } else {

        modalText.textContent =
          `Watch ${requiredAds - adsWatched} more ad(s) to unlock the video.`;

      }

    }


    /*
     * 3 ads completed
     */

    if (
      unlocked &&
      selectedVideo &&
      selectedVideo.id
    ) {

      unlockVideo(
        selectedVideo.id
      );

    }

  }


  /* =========================================================
     SHOW MONETAG REWARDED AD
     ========================================================= */

  async function showRewardedAd() {

    if (!selectedVideo) {
      return;
    }


    if (adsWatched >= requiredAds) {
      return;
    }


    if (adLoading) {
      return;
    }


    adLoading = true;

    updateUnlockUI();


    try {

      const showAd =
        window[MONETAG_FUNCTION];


      if (
        typeof showAd !== "function"
      ) {

        throw new Error(
          "Monetag SDK is not loaded."
        );

      }


      console.log(
        "Showing Monetag rewarded ad..."
      );


      /*
       * IMPORTANT:
       *
       * Ad Promise resolve হওয়ার পরেই
       * reward +1 হবে।
       */

      const result =
        await showAd();


      console.log(
        "Monetag result:",
        result
      );


      /*
       * Maximum 3
       */

      if (
        adsWatched < requiredAds
      ) {

        adsWatched += 1;

      }


      console.log(
        `Ads completed: ${adsWatched}/${requiredAds}`
      );


      /*
       * 3 হলে unlock save হবে
       */

      if (
        adsWatched >= requiredAds &&
        selectedVideo?.id
      ) {

        unlockVideo(
          selectedVideo.id
        );

      }


      updateUnlockUI();


    } catch (error) {

      console.error(
        "Monetag error:",
        error
      );


      /*
       * Error হলে reward দেওয়া হবে না।
       */

      if (modalText) {

        modalText.textContent =
          "❌ Ad complete হয়নি। আবার চেষ্টা করুন।";

      }

    } finally {

      adLoading = false;

      updateUnlockUI();

    }

  }


  /* =========================================================
     AD BUTTON
     ========================================================= */

  if (adBtn) {

    adBtn.addEventListener(
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


        /*
         * 3 ads ছাড়া কখনো যাবে না
         */

        if (
          adsWatched < requiredAds
        ) {

          return;

        }


        /*
         * Row ID লাগবে
         */

        if (!selectedVideo.id) {

          console.error(
            "Video row ID missing."
          );

          return;

        }


        /*
         * Unlock নিশ্চিত করা
         */

        unlockVideo(
          selectedVideo.id
        );


        /*
         * video.html?id=ROW_ID
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
     CLICK OUTSIDE MODAL
     ========================================================= */

  if (modal) {

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === modal
        ) {

          closeVideoModal();

        }

      }
    );

  }


  /* =========================================================
     ESC KEY
     ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {

        closeVideoModal();

      }

    }
  );


  /* =========================================================
     START
     ========================================================= */

  loadPosts();

});
