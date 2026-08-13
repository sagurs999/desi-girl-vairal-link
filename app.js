const tg = window.Telegram.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}


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
        emoji: "💥"
    }

];


let selected = null;

let adsWatched = 0;

const requiredAds = 3;


/* =========================
   DOM ELEMENTS
========================= */

const grid =
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

const closeModal =
    document.getElementById("closeModal");

const tgUser =
    document.getElementById("tgUser");


/* =========================
   TELEGRAM USER
========================= */

try {

    const user =
        tg &&
        tg.initDataUnsafe &&
        tg.initDataUnsafe.user;

    if (user) {

        tgUser.textContent =
            user.first_name || "Telegram User";
    }

} catch (error) {

    console.log("Telegram user error:", error);

}


/* =========================
   TADS CONFIG
========================= */

const WIDGET_ID = "11498";

let adController = null;

let tadsReady = false;


/* =========================
   WAIT FOR TADS
========================= */

function waitForTads(timeout = 10000) {

    return new Promise((resolve, reject) => {

        if (
            window.tads &&
            typeof window.tads.init === "function"
        ) {

            resolve();

            return;
        }


        const start =
            Date.now();


        const timer =
            setInterval(() => {

                if (
                    window.tads &&
                    typeof window.tads.init === "function"
                ) {

                    clearInterval(timer);

                    resolve();

                    return;
                }


                if (
                    Date.now() - start > timeout
                ) {

                    clearInterval(timer);

                    reject(
                        new Error(
                            "TADS widget script not loaded"
                        )
                    );
                }

            }, 100);

    });

}


/* =========================
   INITIALIZE TADS
========================= */

async function initTads() {

    try {

        await waitForTads();


        adController =
            window.tads.init({

                widgetId: WIDGET_ID,

                type: "fullscreen",

                debug: false,


                /*
                 * This callback runs after
                 * the ad has been shown.
                 */

                onShowReward: function(result) {

                    console.log(
                        "Ad shown:",
                        result
                    );


                    /*
                     * IMPORTANT:
                     *
                     * The counter is increased
                     * ONLY here.
                     */

                    if (
                        adsWatched < requiredAds
                    ) {

                        adsWatched++;
                    }


                    updateUnlock();

                },


                /*
                 * No ad available.
                 */

                onAdsNotFound: function() {

                    console.log(
                        "No ads found"
                    );


                    watchAdBtn.disabled =
                        false;


                    watchAdBtn.textContent =
                        `Watch Ads (${adsWatched}/${requiredAds})`;

                }

            });


        tadsReady = true;


        console.log(
            "TADS initialized"
        );


    } catch (error) {

        console.error(
            "TADS initialization failed:",
            error
        );


        tadsReady = false;

    }

}


/* =========================
   RENDER VIDEOS
========================= */

function render(category = "All") {

    grid.innerHTML = "";


    videos
        .filter(function(video) {

            return (
                category === "All" ||
                video.category === category
            );

        })
        .forEach(function(video) {

            const card =
                document.createElement("article");


            card.className = "card";


            card.innerHTML = `

                <div class="thumb">
                    ${video.emoji}
                </div>

                <div class="card-body">

                    <h3>
                        ${video.title}
                    </h3>

                    <div class="meta">
                        ${video.category} · ${requiredAds} ads to unlock
                    </div>

                    <button class="open-btn">
                        Open
                    </button>

                </div>

            `;


            const openButton =
                card.querySelector(
                    ".open-btn"
                );


            openButton.onclick =
                function() {

                    openVideo(video);

                };


            grid.appendChild(card);

        });

}


/* =========================
   OPEN VIDEO
========================= */

function openVideo(video) {

    selected = video;

    adsWatched = 0;


    modalTitle.textContent =
        video.title;


    modalText.textContent =
        `Watch ${requiredAds} ads to unlock this content.`;


    preview.textContent =
        video.emoji;


    updateUnlock();


    modal.classList.remove(
        "hidden"
    );

}


/* =========================
   UPDATE UNLOCK STATUS
========================= */

function updateUnlock() {

    watchAdBtn.textContent =
        `Watch Ads (${adsWatched}/${requiredAds})`;


    const percentage =
        Math.min(
            (adsWatched / requiredAds) * 100,
            100
        );


    progressBar.style.width =
        `${percentage}%`;


    if (
        adsWatched >= requiredAds
    ) {

        videoBtn.disabled =
            false;


        videoBtn.classList.add(
            "unlocked"
        );


        videoBtn.textContent =
            "▶ Watch Video";


        modalText.textContent =
            "Unlocked. You can now open the content.";


    } else {

        videoBtn.disabled =
            true;


        videoBtn.classList.remove(
            "unlocked"
        );


        videoBtn.textContent =
            "🔒 Video Locked";

    }

}


/* =========================
   WATCH AD
========================= */

watchAdBtn.onclick =
    async function() {

        if (
            adsWatched >= requiredAds
        ) {

            return;
        }


        watchAdBtn.disabled =
            true;


        watchAdBtn.textContent =
            "Loading Ad...";


        try {

            /*
             * Make sure TADS is ready.
             */

            if (
                !tadsReady ||
                !adController
            ) {

                await initTads();

            }


            if (
                !adController
            ) {

                throw new Error(
                    "TADS controller is not ready"
                );

            }


            /*
             * Show the ad.
             *
             * DO NOT increment adsWatched here.
             */

            await adController.showAd();


            /*
             * The count is handled
             * by onShowReward().
             */


        } catch (error) {

            console.error(
                "Ad show error:",
                error
            );


            watchAdBtn.disabled =
                false;


            watchAdBtn.textContent =
                `Watch Ads (${adsWatched}/${requiredAds})`;

        }

    };


/* =========================
   VIDEO BUTTON
========================= */

videoBtn.onclick =
    function() {

        if (
            adsWatched < requiredAds
        ) {

            return;
        }


        alert(
            "Video unlocked. Replace this with your real video URL."
        );

    };


/* =========================
   CLOSE MODAL
========================= */

closeModal.onclick =
    function() {

        modal.classList.add(
            "hidden"
        );

    };


modal.onclick =
    function(event) {

        if (
            event.target === modal
        ) {

            modal.classList.add(
                "hidden"
            );

        }

    };


/* =========================
   CATEGORY TABS
========================= */

document
    .querySelectorAll(".tab")
    .forEach(function(button) {

        button.onclick =
            function() {

                document
                    .querySelectorAll(".tab")
                    .forEach(function(tab) {

                        tab.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                render(
                    button.dataset.category
                );

            };

    });


/* =========================
   START
========================= */

render();

initTads();
