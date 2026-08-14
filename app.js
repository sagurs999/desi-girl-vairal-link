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


/*
   Each post will have its own ad counter.

   Example:

   post 1 = 0/3
   post 2 = 0/3

   One post's ads will NOT affect another post.
*/

const adCounts = {};

const adLoading = {};

let allPosts = [];

let currentCategory = "All";


/* =========================================
   ELEMENTS
========================================= */

const videoGrid =
  document.getElementById("videoGrid");

const tgUser =
  document.getElementById("tgUser");

const videoModal =
  document.getElementById("videoModal");

const videoModalTitle =
  document.getElementById("videoModalTitle");

const mainVideo =
  document.getElementById("mainVideo");

const closeVideoModal =
  document.getElementById("closeVideoModal");


/* =========================================
   TELEGRAM USER
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
   LOAD POSTS FROM SUPABASE
========================================= */

async function loadPosts() {

  videoGrid.innerHTML = `
    <div class="loading">
      Loading videos...
    </div>
  `;

  try {

    const url =
      `${SUPABASE_URL}/rest/v1/posts` +
      `?select=id,title,thumbnail_url,video_url,category,published,created_at` +
      `&published=eq.true` +
      `&order=created_at.desc`;


    const response =
      await fetch(url, {

        method: "GET",

        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization":
            `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type":
            "application/json"
        }

      });


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Supabase Error ${response.status}: ${errorText}`
      );
    }


    const posts =
      await response.json();


    allPosts = posts || [];


    /*
      Make sure every post starts at 0/3.
    */

    allPosts.forEach(post => {

      if (adCounts[post.id] === undefined) {

        adCounts[post.id] = 0;

      }

      if (adLoading[post.id] === undefined) {

        adLoading[post.id] = false;

      }

    });


    renderPosts();

  } catch (error) {

    console.error(
      "Failed to load posts:",
      error
    );


    videoGrid.innerHTML = `
      <div class="error">
        ভিডিও লোড করা যাচ্ছে না।<br><br>
        আবার চেষ্টা করুন।
      </div>
    `;
  }
}


/* =========================================
   RENDER POSTS
========================================= */

function renderPosts() {

  videoGrid.innerHTML = "";


  let posts = allPosts;


  if (currentCategory !== "All") {

    posts =
      allPosts.filter(
        post =>
          post.category === currentCategory
      );

  }


  if (!posts.length) {

    videoGrid.innerHTML = `
      <div class="loading">
        এই category-তে কোনো ভিডিও নেই।
      </div>
    `;

    return;
  }


  posts.forEach(post => {

    const card =
      createPostCard(post);

    videoGrid.appendChild(card);

  });

}


/* =========================================
   CREATE POST CARD
========================================= */

function createPostCard(post) {

  const card =
    document.createElement("article");

  card.className = "card";


  const count =
    adCounts[post.id] || 0;


  const thumbnail =
    post.thumbnail_url ||
    "https://via.placeholder.com/700x400?text=Video";


  const description =
    post.description ||
    "Watch ads to unlock this video";


  card.innerHTML = `

    <div class="thumb-wrapper">

      <img
        class="thumb"
        src="${escapeHTML(thumbnail)}"
        alt="${escapeHTML(post.title || "Video")}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/700x400?text=Video';"
      >

    </div>


    <div class="card-body">

      <h2 class="card-title">
        ${escapeHTML(post.title || "Untitled Video")}
      </h2>


      <div class="card-category">
        ${escapeHTML(post.category || "Popular")}
      </div>


      <p class="card-description">
        ${escapeHTML(description)}
      </p>


      <div
        class="progress"
        id="progress-${post.id}">
      </div>


      <button
        class="watch-ad-btn"
        id="ad-btn-${post.id}">
      </button>


      <button
        class="watch-video-btn"
        id="video-btn-${post.id}"
        style="display:none;">
        ▶ Watch Video
      </button>

    </div>
  `;


  updatePostUI(post);


  const adButton =
    card.querySelector(
      `#ad-btn-${post.id}`
    );


  const videoButton =
    card.querySelector(
      `#video-btn-${post.id}`
    );


  adButton.addEventListener(
    "click",
    () => {

      showRewardedAd(post);

    }
  );


  videoButton.addEventListener(
    "click",
    () => {

      openVideo(post);

    }
  );


  return card;
}


/* =========================================
   UPDATE ONE POST UI
========================================= */

function updatePostUI(post) {

  const count =
    adCounts[post.id] || 0;


  const progress =
    document.getElementById(
      `progress-${post.id}`
    );


  const adButton =
    document.getElementById(
      `ad-btn-${post.id}`
    );


  const videoButton =
    document.getElementById(
      `video-btn-${post.id}`
    );


  if (!progress || !adButton) {
    return;
  }


  /*
    3 progress bars
  */

  progress.innerHTML = "";


  for (
    let i = 0;
    i < REQUIRED_ADS;
    i++
  ) {

    const segment =
      document.createElement("span");

    segment.className =
      "progress-segment";


    if (i < count) {

      segment.classList.add(
        "completed"
      );

    }


    progress.appendChild(
      segment
    );
  }


  /*
    After 3 completed ads
  */

  if (count >= REQUIRED_ADS) {

    adButton.style.display =
      "none";


    videoButton.style.display =
      "block";


    return;
  }


  /*
    Still needs ads
  */

  adButton.style.display =
    "block";


  videoButton.style.display =
    "none";


  if (adLoading[post.id]) {

    adButton.disabled =
      true;

    adButton.textContent =
      "Loading Ad...";

  } else {

    adButton.disabled =
      false;

    adButton.textContent =
      `Watch Ads (${count}/${REQUIRED_ADS})`;

  }

}


/* =========================================
   MONETAG REWARDED AD
========================================= */

async function showRewardedAd(post) {

  if (!post) {
    return;
  }


  const postId =
    post.id;


  /*
    Prevent double click
  */

  if (adLoading[postId]) {

    return;

  }


  /*
    Already completed
  */

  if (
    (adCounts[postId] || 0)
    >= REQUIRED_ADS
  ) {

    return;

  }


  adLoading[postId] = true;


  updatePostUI(post);


  try {

    /*
      Make sure Monetag SDK exists
    */

    if (
      typeof window.show_11571866
      !== "function"
    ) {

      throw new Error(
        "Monetag SDK is not loaded."
      );

    }


    console.log(
      "Starting Monetag ad for post:",
      postId
    );


    /*
      IMPORTANT:

      DO NOT increase the counter here.

      We wait for Monetag's Promise
      to resolve successfully.
    */

    const result =
      await window.show_11571866();


    /*
      Monetag completed successfully.

      NOW and ONLY NOW increase count.
    */

    adCounts[postId] =
      (adCounts[postId] || 0) + 1;


    console.log(
      "Monetag ad completed:",
      result
    );


    /*
      Update the exact post
    */

    updatePostUI(post);


  } catch (error) {

    console.error(
      "Monetag ad failed:",
      error
    );


    alert(
      "Ad is not available right now. Please try again."
    );


  } finally {

    adLoading[postId] =
      false;


    updatePostUI(post);

  }

}


/* =========================================
   OPEN VIDEO
========================================= */

function openVideo(post) {

  const count =
    adCounts[post.id] || 0;


  /*
    Safety check:
    video cannot open before 3 ads.
  */

  if (count < REQUIRED_ADS) {

    return;

  }


  if (!post.video_url) {

    alert(
      "এই ভিডিওর URL পাওয়া যায়নি।"
    );

    return;

  }


  videoModalTitle.textContent =
    post.title || "Video";


  mainVideo.src =
    post.video_url;


  videoModal.classList.remove(
    "hidden"
  );


  /*
    Try autoplay after user click
  */

  mainVideo.play().catch(
    () => {}
  );

}


/* =========================================
   CLOSE VIDEO
========================================= */

closeVideoModal.addEventListener(
  "click",
  closeVideo
);


videoModal.addEventListener(
  "click",
  event => {

    if (
      event.target === videoModal
    ) {

      closeVideo();

    }

  }
);


function closeVideo() {

  mainVideo.pause();

  mainVideo.removeAttribute(
    "src"
  );

  mainVideo.load();

  videoModal.classList.add(
    "hidden"
  );

}


/* =========================================
   CATEGORY BUTTONS
========================================= */

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".tab")
          .forEach(tab => {

            tab.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        currentCategory =
          button.dataset.category;


        renderPosts();

      }
    );

  });


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(value) {

  if (value === null ||
      value === undefined) {

    return "";

  }


  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================
   START APP
========================================= */

loadPosts();
