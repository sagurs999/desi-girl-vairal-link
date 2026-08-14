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
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://mshoftgubfbkvynndtnu.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaG9mdGd1YmZia3Z5bm5kdG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDkwOTQsImV4cCI6MjEwMjIyNTA5NH0.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";


const POSTS_API =
  `${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   MONETAG
========================================================= */

const MONETAG_FUNCTION =
  "show_11571866";


/* =========================================================
   SETTINGS
========================================================= */

const REQUIRED_ADS = 3;

let allVideos = [];

let currentCategory = "All";


/* =========================================================
   DOM
========================================================= */

const videoGrid =
  document.getElementById("videoGrid");

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
   SUPABASE HEADERS
========================================================= */

function supabaseHeaders() {

  return {

    "apikey":
      SUPABASE_ANON_KEY,

    "Authorization":
      `Bearer ${SUPABASE_ANON_KEY}`,

    "Content-Type":
      "application/json"

  };

}


/* =========================================================
   LOAD POSTS
========================================================= */

async function loadVideos() {

  videoGrid.innerHTML = `
    <div class="loading">
      Loading videos...
    </div>
  `;

  try {

    const response =
      await fetch(
        `${POSTS_API}?select=*&order=id.desc`,
        {
          method: "GET",
          headers:
            supabaseHeaders()
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Supabase Error: ${response.status} ${errorText}`
      );

    }


    const data =
      await response.json();


    allVideos =
      Array.isArray(data)
        ? data
        : [];


    renderVideos(
      currentCategory
    );


  } catch (error) {

    console.error(
      "Load videos error:",
      error
    );


    videoGrid.innerHTML = `
      <div class="error-box">

        ❌ ভিডিও লোড করা যাচ্ছে না।

        <br><br>

        Supabase-এর <b>posts</b> table,
        RLS policy এবং column নামগুলো
        চেক করুন।

      </div>
    `;

  }

}


/* =========================================================
   NORMALIZE POST
========================================================= */

function normalizePost(post, index) {

  return {

    id:
      post.id,

    title:
      post.title ||
      "Untitled Video",

    thumbnail:
      post.thumbnail_url ||
      post.thumbnail ||
      post.image_url ||
      "",

    video:
      post.video_url ||
      post.video ||
      "",

    category:
      post.category ||
      "Popular",

    description:
      post.description ||
      ""

  };

}


/* =========================================================
   UNLOCK STORAGE
========================================================= */

function unlockKey(id) {

  return `video_unlocked_${id}`;

}


function isUnlocked(id) {

  return (
    sessionStorage.getItem(
      unlockKey(id)
    ) === "yes"
  );

}


function setUnlocked(id) {

  sessionStorage.setItem(
    unlockKey(id),
    "yes"
  );

}


/* =========================================================
   AD COUNT
========================================================= */

function getAdCount(id) {

  const value =
    sessionStorage.getItem(
      `video_ads_${id}`
    );

  return Number(value || 0);

}


function setAdCount(id, count) {

  sessionStorage.setItem(
    `video_ads_${id}`,
    String(count)
  );

}


/* =========================================================
   RENDER VIDEOS
========================================================= */

function renderVideos(
  category = "All"
) {

  currentCategory =
    category;


  const filtered =
    allVideos
      .map(normalizePost)
      .filter(video => {

        if (
          category === "All"
        ) {

          return true;

        }

        return (
          video.category ===
          category
        );

      });


  if (!filtered.length) {

    videoGrid.innerHTML = `
      <div class="error-box">
        কোনো ভিডিও পাওয়া যায়নি।
      </div>
    `;

    return;

  }


  videoGrid.innerHTML = "";


  filtered.forEach(
    (video, index) => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "video-card";


      const unlocked =
        isUnlocked(video.id);


      const ads =
        getAdCount(video.id);


      card.innerHTML = `

        <div class="thumbnail">

          ${
            video.thumbnail
            ?

            `<img
              src="${escapeHtml(video.thumbnail)}"
              alt="${escapeHtml(video.title)}"
              loading="lazy"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >`

            :

            ""
          }

          <div
            class="thumbnail-placeholder"
            style="
              display:${video.thumbnail ? "none" : "flex"};
            "
          >
            🎬
          </div>


          <div class="rank">
            #${index + 1}
          </div>

        </div>


        <div class="card-content">

          <div class="card-title">
            ${escapeHtml(video.title)}
          </div>


          <div class="card-category">
            ${escapeHtml(video.category)}
          </div>


          <div class="progress">

            ${[1,2,3]
              .map(number => `
                <span
                  class="${
                    unlocked ||
                    ads >= number
                      ? "done"
                      : ""
                  }">
                </span>
              `)
              .join("")
            }

          </div>


          <button
            class="watch-btn ${
              unlocked
                ? "unlocked"
                : ""
            }"
            data-id="${video.id}"
          >

            ${
              unlocked
                ? "▶ Watch Video"
                : `🔒 Watch Ads (${Math.min(ads, 3)}/3)`
            }

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

          if (
            isUnlocked(video.id)
          ) {

            openVideoPage(
              video.id
            );

            return;

          }


          watchAdsForVideo(
            video,
            button
          );

        }
      );


      videoGrid.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   WATCH 3 REWARDED ADS
========================================================= */

async function watchAdsForVideo(
  video,
  button
) {

  if (
    isUnlocked(video.id)
  ) {

    openVideoPage(
      video.id
    );

    return;

  }


  let count =
    getAdCount(video.id);


  if (
    count >= REQUIRED_ADS
  ) {

    setUnlocked(
      video.id
    );

    renderVideos(
      currentCategory
    );

    return;

  }


  button.disabled =
    true;

  button.textContent =
    "⏳ Loading Ad...";


  try {

    /* -----------------------------------------
       IMPORTANT:
       Monetag function must exist
    ----------------------------------------- */

    const adFunction =
      window[
        MONETAG_FUNCTION
      ];


    if (
      typeof adFunction !==
      "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    console.log(
      "Starting Monetag rewarded ad..."
    );


    /*
      Counter DOES NOT increase here.

      It increases ONLY after the
      Monetag Promise resolves.
    */

    await adFunction();


    /*
      Monetag Promise resolved.
      Now count the completed reward.
    */

    count++;

    setAdCount(
      video.id,
      count
    );


    console.log(
      `Rewarded ad completed: ${count}/${REQUIRED_ADS}`
    );


    if (
      count >= REQUIRED_ADS
    ) {

      setUnlocked(
        video.id
      );

    }


    renderVideos(
      currentCategory
    );


  } catch (error) {

    console.error(
      "Monetag error:",
      error
    );


    button.disabled =
      false;


    button.textContent =
      `🔒 Watch Ads (${count}/3)`;

    alert(
      "Ad এখন available নয়। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
    );

  }

}


/* =========================================================
   OPEN VIDEO PAGE
========================================================= */

function openVideoPage(id) {

  if (
    !isUnlocked(id)
  ) {

    return;

  }


  window.location.href =
    `video.html?id=${encodeURIComponent(id)}`;

}


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


        renderVideos(
          button.dataset.category
        );

      }
    );

  });


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

  return String(value || "")
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

loadVideos();
