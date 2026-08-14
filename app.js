/* =========================================
   TELEGRAM
========================================= */

const tg =
  window.Telegram &&
  window.Telegram.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


/* =========================================
   SUPABASE
========================================= */

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaG9mdGd1YmZia3Z5bm5kdG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDkwOTQsImV4cCI6MjEwMjIyNTA5NH0.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";


/* =========================================
   SETTINGS
========================================= */

const REQUIRED_ADS = 3;


/* =========================================
   ELEMENTS
========================================= */

const videoGrid =
  document.getElementById("videoGrid");

const tgUser =
  document.getElementById("tgUser");


/* =========================================
   USER
========================================= */

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


/* =========================================
   STATE
========================================= */

let allVideos = [];

let currentCategory = "All";


/* =========================================
   STORAGE KEY
========================================= */

function unlockKey(id) {

  return `video_unlocked_${id}`;

}


function adCountKey(id) {

  return `video_ads_${id}`;

}


/* =========================================
   GET AD COUNT
========================================= */

function getAdCount(id) {

  const value =
    localStorage.getItem(
      adCountKey(id)
    );

  return value
    ? parseInt(value, 10)
    : 0;

}


/* =========================================
   SAVE AD COUNT
========================================= */

function saveAdCount(id, count) {

  localStorage.setItem(
    adCountKey(id),
    String(count)
  );

}


/* =========================================
   CHECK UNLOCK
========================================= */

function isUnlocked(id) {

  return (
    localStorage.getItem(
      unlockKey(id)
    ) === "true"
  );

}


/* =========================================
   SET UNLOCKED
========================================= */

function setUnlocked(id) {

  localStorage.setItem(
    unlockKey(id),
    "true"
  );

}


/* =========================================
   SUPABASE FETCH
========================================= */

async function loadVideos() {

  try {

    videoGrid.innerHTML = `
      <div class="loading">
        <div class="loader"></div>
        <p>Loading videos...</p>
      </div>
    `;


    /*
      প্রথমে video_url নিচ্ছি না।

      এতে Home page-এ
      video URL unnecessaryভাবে
      render হবে না।
    */

    const url =
      `${SUPABASE_URL}/rest/v1/posts` +
      `?select=id,title,thumbnail_url,category,created_at` +
      `&published=eq.true` +
      `&order=id.desc`;


    const response =
      await fetch(url, {

        headers: {

          apikey:
            SUPABASE_ANON_KEY,

          Authorization:
            `Bearer ${SUPABASE_ANON_KEY}`

        }

      });


    if (!response.ok) {

      throw new Error(
        `Supabase error: ${response.status}`
      );

    }


    allVideos =
      await response.json();


    renderVideos();

  } catch (error) {

    console.error(error);

    videoGrid.innerHTML = `
      <div class="empty">
        <h3>⚠️ Videos Load হয়নি</h3>
        <p>
          Supabase connection check করুন।
        </p>
      </div>
    `;

  }

}


/* =========================================
   RENDER
========================================= */

function renderVideos() {

  let videos =
    allVideos;


  if (currentCategory !== "All") {

    videos =
      videos.filter(
        video =>
          String(video.category || "")
            .toLowerCase() ===
          currentCategory.toLowerCase()
      );

  }


  if (!videos.length) {

    videoGrid.innerHTML = `
      <div class="empty">
        <h3>😔 No Videos Found</h3>
        <p>
          এই category-তে কোনো video নেই।
        </p>
      </div>
    `;

    return;

  }


  videoGrid.innerHTML = "";


  videos.forEach(
    (video, index) => {

      const card =
        createVideoCard(
          video,
          index
        );

      videoGrid.appendChild(card);

    }
  );

}


/* =========================================
   CREATE CARD
========================================= */

function createVideoCard(
  video,
  index
) {

  const card =
    document.createElement("article");

  card.className =
    "video-card";


  const count =
    Math.min(
      getAdCount(video.id),
      REQUIRED_ADS
    );


  const unlocked =
    isUnlocked(video.id) ||
    count >= REQUIRED_ADS;


  if (
    count >= REQUIRED_ADS &&
    !isUnlocked(video.id)
  ) {

    setUnlocked(video.id);

  }


  const thumbnail =
    video.thumbnail_url ||
    "https://via.placeholder.com/600x400?text=Video";


  const category =
    video.category ||
    "Popular";


  let progressHTML = "";


  for (
    let i = 1;
    i <= REQUIRED_ADS;
    i++
  ) {

    progressHTML += `
      <span
        class="progress-segment ${
          i <= count ? "done" : ""
        }"
      ></span>
    `;

  }


  card.innerHTML = `

    <div class="thumbnail-box">

      <img
        class="thumbnail"
        src="${escapeHtml(thumbnail)}"
        alt="${escapeHtml(video.title || "Video")}"
        loading="lazy"
        onerror="
          this.src='https://via.placeholder.com/600x400?text=Video'
        "
      >

      <div class="play-overlay">
        ▶
      </div>

      <div class="number-badge">
        #${index + 1}
      </div>

    </div>


    <div class="card-content">

      <h3 class="card-title">
        ${escapeHtml(
          video.title || "Untitled Video"
        )}
      </h3>


      <span class="card-category">
        ${escapeHtml(category)}
      </span>


      <div class="progress">
        ${progressHTML}
      </div>


      <button
        class="watch-btn ${
          unlocked ? "unlocked" : ""
        }"
        data-id="${video.id}"
      >

        ${
          unlocked
            ? "▶ Watch Video"
            : `Watch Ads (${count}/3)`
        }

      </button>

    </div>

  `;


  const button =
    card.querySelector(".watch-btn");


  button.addEventListener(
    "click",
    async () => {

      if (isUnlocked(video.id)) {

        openVideoPage(video.id);

        return;

      }


      await watchAd(
        video,
        button,
        card
      );

    }
  );


  return card;

}


/* =========================================
   WATCH MONETAG AD
========================================= */

async function watchAd(
  video,
  button,
  card
) {

  let count =
    getAdCount(video.id);


  if (count >= REQUIRED_ADS) {

    setUnlocked(video.id);

    openVideoPage(video.id);

    return;

  }


  /*
    Double click protection
  */

  if (
    button.dataset.loading === "true"
  ) {

    return;

  }


  button.dataset.loading =
    "true";

  button.disabled =
    true;

  button.textContent =
    `Loading Ad...`;


  try {

    /*
      Monetag function
    */

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

      Counter এখানে বাড়ছে না।

      আগে Monetag ad complete হবে।
      Promise successfulভাবে resolve
      হওয়ার পরেই count + 1 হবে।
    */

    const result =
      await window.show_11571866();


    console.log(
      "Monetag completed:",
      result
    );


    /*
      AD SUCCESS
    */

    count =
      Math.min(
        count + 1,
        REQUIRED_ADS
      );


    saveAdCount(
      video.id,
      count
    );


    if (
      count >= REQUIRED_ADS
    ) {

      setUnlocked(
        video.id
      );

    }


    /*
      Card update
    */

    updateCard(
      video,
      card
    );


  } catch (error) {

    console.error(
      "Monetag error:",
      error
    );


    button.disabled =
      false;

    button.dataset.loading =
      "false";

    button.textContent =
      `Watch Ads (${count}/3)`;


    /*
      Telegram popup থাকলে message
    */

    if (
      tg &&
      typeof tg.showPopup ===
      "function"
    ) {

      tg.showPopup({

        title: "Ad unavailable",

        message:
          "Ad এখন available নেই। কিছুক্ষণ পরে আবার চেষ্টা করুন।",

        buttons: [
          {
            type: "ok"
          }
        ]

      });

    } else {

      alert(
        "Ad এখন available নেই। আবার চেষ্টা করুন।"
      );

    }

    return;

  }


  button.dataset.loading =
    "false";


  /*
    যদি ৩টি complete হয়ে যায়,
    সঙ্গে সঙ্গে Watch Video দেখাবে।
  */

  if (
    getAdCount(video.id) >=
    REQUIRED_ADS
  ) {

    button.disabled =
      false;

    button.textContent =
      "▶ Watch Video";

    button.classList.add(
      "unlocked"
    );

  } else {

    button.disabled =
      false;

  }

}


/* =========================================
   UPDATE CARD
========================================= */

function updateCard(
  video,
  card
) {

  const count =
    Math.min(
      getAdCount(video.id),
      REQUIRED_ADS
    );


  const button =
    card.querySelector(
      ".watch-btn"
    );


  const segments =
    card.querySelectorAll(
      ".progress-segment"
    );


  segments.forEach(
    (segment, index) => {

      if (
        index < count
      ) {

        segment.classList.add(
          "done"
        );

      } else {

        segment.classList.remove(
          "done"
        );

      }

    }
  );


  if (
    count >= REQUIRED_ADS
  ) {

    button.classList.add(
      "unlocked"
    );

    button.disabled =
      false;

    button.textContent =
      "▶ Watch Video";


    button.onclick =
      () => {

        openVideoPage(
          video.id
        );

      };

  } else {

    button.classList.remove(
      "unlocked"
    );

    button.disabled =
      false;

    button.textContent =
      `Watch Ads (${count}/3)`;

  }

}


/* =========================================
   OPEN VIDEO PAGE
========================================= */

function openVideoPage(id) {

  if (!isUnlocked(id)) {

    return;

  }


  window.location.href =
    `video.html?id=${encodeURIComponent(id)}`;

}


/* =========================================
   CATEGORY BUTTONS
========================================= */

document
  .querySelectorAll(".category-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".category-btn"
          )
          .forEach(
            btn =>
              btn.classList.remove(
                "active"
              )
          );


        button.classList.add(
          "active"
        );


        currentCategory =
          button.dataset.category;


        renderVideos();

      }
    );

  });


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(value) {

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


/* =========================================
   START
========================================= */

loadVideos();
