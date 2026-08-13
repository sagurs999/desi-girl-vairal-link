document.addEventListener("DOMContentLoaded", function () {

  console.log("APP STARTED");


  // Telegram
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();

    console.log("Telegram WebApp ready");
  }


  // User
  const user = tg?.initDataUnsafe?.user;

  const userElement = document.getElementById("tgUser");

  if (userElement) {
    userElement.textContent =
      user?.first_name || "Guest";
  }


  // Videos
  const videos = [
    {
      id: 1,
      title: "Trending Video 01",
      category: "Trending",
      emoji: "🔥"
    },
    {
      id: 2,
      title: "Funny Video 02",
      category: "Funny",
      emoji: "😂"
    },
    {
      id: 3,
      title: "Popular Video 03",
      category: "Popular",
      emoji: "⭐"
    },
    {
      id: 4,
      title: "Trending Video 04",
      category: "Trending",
      emoji: "🎬"
    },
    {
      id: 5,
      title: "Funny Video 05",
      category: "Funny",
      emoji: "🤣"
    },
    {
      id: 6,
      title: "Popular Video 06",
      category: "Popular",
      emoji: "🔥"
    }
  ];


  // Elements
  const grid = document.getElementById("videoGrid");

  const modal = document.getElementById("modal");

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

  const closeModal =
    document.getElementById("closeModal");


  // Check elements
  if (!grid) {
    console.error("videoGrid not found!");
    return;
  }


  let selectedVideo = null;

  let adsWatched = 0;

  const requiredAds = 3;


  // =========================
  // TADS
  // =========================

  let adController = null;


  function setupAds() {

    if (
      window.tads &&
      typeof window.tads.init === "function"
    ) {

      try {

        adController = window.tads.init({
          widgetId: "11498",
          type: "fullscreen",
          debug: false,

          onShowReward: function (result) {

            console.log("Ad completed", result);

            adsWatched++;

            updateUnlock();

          },

          onAdsNotFound: function () {

            console.log("No ad found");

            watchAdBtn.disabled = false;

            watchAdBtn.textContent =
              `Watch Ads (${adsWatched}/${requiredAds})`;

          }
        });

        console.log("TADS initialized");

      } catch (error) {

        console.error(
          "TADS initialization error:",
          error
        );

        adController = null;
      }

    } else {

      console.log("TADS not available");

    }

  }


  setupAds();


  // =========================
  // RENDER VIDEOS
  // =========================

  function render(category = "All") {

    grid.innerHTML = "";

    const filteredVideos =
      category === "All"
        ? videos
        : videos.filter(
            video => video.category === category
          );


    filteredVideos.forEach(video => {

      const card =
        document.createElement("article");

      card.className = "card";


      card.innerHTML = `
        <div class="thumb">
          ${video.emoji}
        </div>

        <div class="card-body">

          <h3>${video.title}</h3>

          <div class="meta">
            ${video.category}
          </div>

          <button class="open-btn">
            Open
          </button>

        </div>
      `;


      const openButton =
        card.querySelector(".open-btn");


      openButton.addEventListener(
        "click",
        function () {

          openVideo(video);

        }
      );


      grid.appendChild(card);

    });


    console.log(
      "Rendered:",
      filteredVideos.length,
      "videos"
    );

  }


  // =========================
  // OPEN VIDEO
  // =========================

  function openVideo(video) {

    selectedVideo = video;

    adsWatched = 0;


    modalTitle.textContent =
      video.title;


    modalText.textContent =
      `Watch ${requiredAds} ads to unlock this content.`;


    preview.textContent =
      video.emoji;


    updateUnlock();


    modal.classList.remove("hidden");

  }


  // =========================
  // UPDATE UNLOCK
  // =========================

  function updateUnlock() {

    watchAdBtn.textContent =
      `Watch Ads (${adsWatched}/${requiredAds})`;


    const percentage =
      Math.min(
        (adsWatched / requiredAds) * 100,
        100
      );


    progressBar.style.width =
      percentage + "%";


    if (adsWatched >= requiredAds) {

      videoBtn.disabled = false;

      videoBtn.classList.add("unlocked");

      videoBtn.textContent =
        "▶ Watch Video";


      modalText.textContent =
        "Unlocked. You can now open the content.";

    } else {

      videoBtn.disabled = true;

      videoBtn.classList.remove("unlocked");

      videoBtn.textContent =
        "🔒 Video Locked";

    }

  }


  // =========================
  // WATCH AD
  // =========================

  watchAdBtn.addEventListener(
    "click",
    async function () {

      if (adsWatched >= requiredAds) {
        return;
      }


      if (!adController) {

        alert(
          "Advertisement is not available right now."
        );

        return;

      }


      watchAdBtn.disabled = true;

      watchAdBtn.textContent =
        "Loading Ad...";


      try {

        if (
          typeof adController.showAd === "function"
        ) {

          await adController.showAd();

        } else {

          throw new Error(
            "TADS showAd function not available"
          );

        }

      } catch (error) {

        console.error(
          "TADS error:",
          error
        );


        watchAdBtn.disabled = false;

        watchAdBtn.textContent =
          `Watch Ads (${adsWatched}/${requiredAds})`;

      }

    }
  );


  // =========================
  // VIDEO BUTTON
  // =========================

  videoBtn.addEventListener(
    "click",
    function () {

      if (adsWatched < requiredAds) {
        return;
      }


      /*
        এখানে আপনার নিজের বৈধ ভিডিও URL
        বা backend endpoint বসাবেন।
      */

      alert(
        "Video unlocked. Add your video URL/backend here."
      );

    }
  );


  // =========================
  // CLOSE MODAL
  // =========================

  closeModal.addEventListener(
    "click",
    function () {

      modal.classList.add("hidden");

    }
  );


  modal.addEventListener(
    "click",
    function (event) {

      if (event.target === modal) {

        modal.classList.add("hidden");

      }

    }
  );


  // =========================
  // CATEGORY TABS
  // =========================

  document
    .querySelectorAll(".tab")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          document
            .querySelectorAll(".tab")
            .forEach(function (btn) {

              btn.classList.remove("active");

            });


          button.classList.add("active");


          render(
            button.dataset.category
          );

        }
      );

    });


  // =========================
  // INITIAL RENDER
  // =========================

  render("All");


  console.log("APP FINISHED");

});
