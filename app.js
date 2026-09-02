/* =========================================
   DESI GIRL VAIRAL LINK
   Appwrite + Telegram + Monetag
   ========================================= */

// ===============================
// TELEGRAM
// ===============================

const tg = window.Telegram?.WebApp || null;

if (tg) {
    tg.ready();
    tg.expand();
}

const tgUser = document.getElementById("tgUser");

if (tgUser && tg?.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    tgUser.textContent =
        user.first_name ||
        user.username ||
        "User";
}


// ===============================
// APPWRITE CONFIG
// ===============================

const APPWRITE_ENDPOINT =
    "https://cloud.appwrite.io/v1";

const APPWRITE_PROJECT_ID =
    "6a953702002468f915bf";

const APPWRITE_DATABASE_ID =
    "6a97f8710010ad20905d";

const APPWRITE_TABLE_ID =
    "6a97fa98002d5e65d0f4";

const APPWRITE_BUCKET_ID =
    "6a9539820022110c710";


// ===============================
// APPWRITE INIT
// ===============================

const client = new Appwrite.Client();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const tablesDB = new Appwrite.TablesDB(client);


// ===============================
// MONETAG
// ===============================

const MONETAG_ZONE = "11571866";
const MONETAG_FUNCTION = `show_${MONETAG_ZONE}`;

const REQUIRED_ADS = 3;


// ===============================
// DOM
// ===============================

const videoGrid =
    document.getElementById("videoGrid");

const modal =
    document.getElementById("modal");

const closeModal =
    document.getElementById("closeModal");

const preview =
    document.getElementById("preview");

const modalTitle =
    document.getElementById("modalTitle");

const modalText =
    document.getElementById("modalText");

const progressBar =
    document.getElementById("progressBar");

const adCount =
    document.getElementById("adCount");

const watchAdBtn =
    document.getElementById("watchAdBtn");

const videoBtn =
    document.getElementById("videoBtn");


// ===============================
// STATE
// ===============================

let videos = [];
let selectedVideo = null;
let adsWatched = 0;
let adLoading = false;
let activeCategory = "All";


// ===============================
// VIDEO URL BUILDER
// ===============================

function buildVideoUrl(value) {

    if (!value) {
        return "";
    }

    let url = String(value).trim();

    // If already full Appwrite URL
    if (url.startsWith("http://") || url.startsWith("https://")) {

        try {

            const parsed = new URL(url);

            // Remove admin mode if present
            parsed.searchParams.delete("mode");

            // Make sure project exists
            if (!parsed.searchParams.has("project")) {
                parsed.searchParams.set(
                    "project",
                    APPWRITE_PROJECT_ID
                );
            }

            return parsed.toString();

        } catch (error) {

            console.warn(
                "Invalid video URL:",
                url
            );

            return url;
        }
    }


    // If only Appwrite file ID was saved
    return (
        `${APPWRITE_ENDPOINT}` +
        `/storage/buckets/${APPWRITE_BUCKET_ID}` +
        `/files/${encodeURIComponent(url)}` +
        `/view?project=${APPWRITE_PROJECT_ID}`
    );
}


// ===============================
// THUMBNAIL URL
// ===============================

function buildThumbnailUrl(value) {

    if (!value) {
        return "";
    }

    const url = String(value).trim();

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    // If thumbnail is an Appwrite file ID
    return (
        `${APPWRITE_ENDPOINT}` +
        `/storage/buckets/${APPWRITE_BUCKET_ID}` +
        `/files/${encodeURIComponent(url)}` +
        `/view?project=${APPWRITE_PROJECT_ID}`
    );
}


// ===============================
// LOAD POSTS
// ===============================

async function loadPosts() {

    videoGrid.innerHTML = `
        <div class="loading">
            Loading videos...
        </div>
    `;

    try {

        console.log("Loading Appwrite rows...");

        const response =
            await tablesDB.listRows({

                databaseId:
                    APPWRITE_DATABASE_ID,

                tableId:
                    APPWRITE_TABLE_ID,

                queries: [
                    Appwrite.Query.orderDesc(
                        "$createdAt"
                    )
                ]

            });

        console.log(
            "Appwrite response:",
            response
        );

        videos = (response.rows || [])
            .map(post => {

                // IMPORTANT:
                // Supports both new and old field names

                const videoValue =
                    post.videoUrl ??
                    post.video_url ??
                    "";

                const thumbnailValue =
                    post.thumbnail ??
                    post.thumbnail_url ??
                    "";

                return {

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
                        buildThumbnailUrl(
                            thumbnailValue
                        ),

                    videoUrl:
                        buildVideoUrl(
                            videoValue
                        ),

                    createdAt:
                        post.$createdAt ??
                        ""

                };

            })
            .filter(video => video.id);

        console.log(
            "Processed videos:",
            videos
        );

        applyCategoryFilter();

    } catch (error) {

        console.error(
            "Appwrite load error:",
            error
        );

        videoGrid.innerHTML = `
            <div class="loading">
                ❌ ভিডিও লোড করা যাচ্ছে না।<br><br>
                <small>
                    ${escapeHtml(
                        error?.message ||
                        "Unknown Appwrite error"
                    )}
                </small>
            </div>
        `;
    }
}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHtml(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ===============================
// RENDER
// ===============================

function render(list) {

    if (!list.length) {

        videoGrid.innerHTML = `
            <div class="loading">
                No videos found.
            </div>
        `;

        return;
    }

    videoGrid.innerHTML = "";

    list.forEach(video => {

        const card =
            document.createElement("article");

        card.className = "video-card";

        const image =
            video.thumbnail
                ? `
                    <img
                        src="${escapeHtml(video.thumbnail)}"
                        alt="${escapeHtml(video.title)}"
                        loading="lazy"
                    >
                  `
                : `
                    <div class="video-placeholder">
                        🎬
                    </div>
                  `;

        card.innerHTML = `

            <div class="video-thumb">

                ${image}

                <div class="video-play">
                    ▶
                </div>

            </div>

            <div class="video-info">

                <h3>
                    ${escapeHtml(video.title)}
                </h3>

                <div class="video-meta">
                    <span>
                        ${escapeHtml(video.category)}
                    </span>

                    <button
                        class="open-video-btn"
                        type="button"
                    >
                        Watch
                    </button>
                </div>

            </div>

        `;

        card.addEventListener(
            "click",
            () => openVideo(video)
        );

        videoGrid.appendChild(card);

    });
}


// ===============================
// CATEGORY FILTER
// ===============================

function applyCategoryFilter() {

    if (activeCategory === "All") {

        render(videos);

        return;
    }

    const filtered =
        videos.filter(video => {

            return String(video.category)
                .toLowerCase()
                .trim() ===
                String(activeCategory)
                    .toLowerCase()
                    .trim();

        });

    render(filtered);
}


// ===============================
// CATEGORY BUTTONS
// ===============================

document
    .querySelectorAll(".category-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".category-btn")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );

                button.classList.add("active");

                activeCategory =
                    button.dataset.category ||
                    "All";

                applyCategoryFilter();

            }
        );

    });


// ===============================
// BOTTOM NAV
// ===============================

document
    .querySelectorAll("[data-bottom-category]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                activeCategory =
                    button.dataset.bottomCategory ||
                    "All";

                document
                    .querySelectorAll(".category-btn")
                    .forEach(btn => {

                        btn.classList.toggle(
                            "active",
                            btn.dataset.category ===
                            activeCategory
                        );

                    });

                applyCategoryFilter();

            }
        );

    });


// ===============================
// OPEN VIDEO MODAL
// ===============================

function openVideo(video) {

    selectedVideo = video;

    // Every newly selected video starts from 0
    adsWatched = 0;

    adLoading = false;

    // Remove previous unlock
    if (video.id) {

        sessionStorage.removeItem(
            getUnlockKey(video.id)
        );

    }

    modalTitle.textContent =
        video.title || "Video";

    modalText.textContent =
        "Watch 3 ads to unlock this video.";

    // Preview
    if (video.thumbnail) {

        preview.innerHTML = `
            <img
                src="${escapeHtml(video.thumbnail)}"
                alt=""
            >
        `;

    } else {

        preview.innerHTML = "🎬";

    }

    modal.classList.remove("hidden");

    updateUnlockUI();
}


// ===============================
// CLOSE MODAL
// ===============================

closeModal.addEventListener(
    "click",
    () => {

        modal.classList.add("hidden");

        selectedVideo = null;

    }
);


// Close when clicking outside
modal.addEventListener(
    "click",
    event => {

        if (event.target === modal) {

            modal.classList.add("hidden");

            selectedVideo = null;

        }

    }
);


// ===============================
// UNLOCK KEY
// ===============================

function getUnlockKey(videoId) {

    return `video_unlocked_${videoId}`;

}


// ===============================
// UPDATE UI
// ===============================

function updateUnlockUI() {

    const progress =
        Math.min(
            adsWatched / REQUIRED_ADS,
            1
        ) * 100;

    progressBar.style.width =
        `${progress}%`;

    adCount.textContent =
        `${adsWatched} / ${REQUIRED_ADS} Ads Completed`;


    // =========================
    // UNLOCKED
    // =========================

    if (adsWatched >= REQUIRED_ADS) {

        watchAdBtn.textContent =
            "✓ Ads Completed";

        watchAdBtn.disabled = true;

        videoBtn.textContent =
            "▶ Watch Video";

        videoBtn.disabled = false;

        modalText.textContent =
            "✅ Video unlocked! You can watch it now.";

        return;
    }


    // =========================
    // LOCKED
    // =========================

    watchAdBtn.disabled =
        adLoading;

    watchAdBtn.textContent =
        adLoading
            ? "⏳ Loading Ad..."
            : `▶ Watch Ad (${adsWatched}/${REQUIRED_ADS})`;

    videoBtn.textContent =
        "🔒 Video Locked";

    videoBtn.disabled = true;

    modalText.textContent =
        `Watch ${
            REQUIRED_ADS - adsWatched
        } more ad${
            REQUIRED_ADS - adsWatched === 1
                ? ""
                : "s"
        } to unlock this video.`;
}


// ===============================
// WATCH REWARDED AD
// ===============================

async function showRewardedAd() {

    if (adLoading) {
        return;
    }

    if (adsWatched >= REQUIRED_ADS) {
        return;
    }

    const showAd =
        window[MONETAG_FUNCTION];


    if (typeof showAd !== "function") {

        console.error(
            "Monetag function not found:",
            MONETAG_FUNCTION
        );

        alert(
            "Ad system এখনো load হয়নি। একটু পরে আবার চেষ্টা করুন।"
        );

        return;
    }


    adLoading = true;

    updateUnlockUI();


    try {

        console.log(
            "Starting rewarded ad..."
        );

        // IMPORTANT:
        // Reward ONLY after Promise resolves.
        await showAd();

        console.log(
            "Rewarded ad completed."
        );


        if (adsWatched < REQUIRED_ADS) {

            adsWatched += 1;

        }


        // Save unlock after exactly 3 ads
        if (
            adsWatched >= REQUIRED_ADS &&
            selectedVideo?.id
        ) {

            sessionStorage.setItem(
                getUnlockKey(
                    selectedVideo.id
                ),
                "true"
            );

        }

    } catch (error) {

        console.error(
            "Rewarded ad error:",
            error
        );

        // DO NOT reward failed ad
        alert(
            "Ad সম্পূর্ণ হয়নি। তাই কোনো reward দেওয়া হয়নি। আবার চেষ্টা করুন।"
        );

    } finally {

        adLoading = false;

        updateUnlockUI();

    }
}


// ===============================
// AD BUTTON
// ===============================

watchAdBtn.addEventListener(
    "click",
    showRewardedAd
);


// ===============================
// VIDEO BUTTON
// ===============================

videoBtn.addEventListener(
    "click",
    () => {

        if (!selectedVideo) {
            return;
        }

        // Safety check
        if (adsWatched < REQUIRED_ADS) {

            alert(
                "আগে 3টি Ad সম্পূর্ণ করুন।"
            );

            return;
        }


        if (!selectedVideo.id) {

            alert(
                "Video ID পাওয়া যায়নি।"
            );

            return;
        }


        // Save unlock
        sessionStorage.setItem(
            getUnlockKey(
                selectedVideo.id
            ),
            "true"
        );


        // Open video page
        const url =
            `video.html?id=${encodeURIComponent(
                selectedVideo.id
            )}`;

        window.location.href = url;

    }
);


// ===============================
// START
// ===============================

loadPosts();
