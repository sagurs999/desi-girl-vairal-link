/* =========================================================
   DOODSTREAM
========================================================= */

/*
   DoodStream API Key
   Already configured.
*/

const DOODSTREAM_API_KEY =
    "577640ki1zlnwq28ruachu";


const DOOD_API =
    "https://doodapi.co/api";


/* =========================================================
   SETTINGS
========================================================= */

const REQUIRED_ADS = 3;

const MONETAG_ZONE =
    "11571866";

const MONETAG_FUNCTION =
    "show_" + MONETAG_ZONE;


/*
   প্রতি API request-এ সর্বোচ্চ 200 file
*/

const FILES_PER_PAGE = 200;


/*
   নিরাপত্তার জন্য infinite loop আটকানো
*/

const MAX_PAGES = 50;


/* =========================================================
   TELEGRAM
========================================================= */

const tg =
    window.Telegram?.WebApp;


if (tg) {

    tg.ready();

    tg.expand();


    const user =
        tg.initDataUnsafe?.user;


    const tgUser =
        document.getElementById("tgUser");


    if (user && tgUser) {

        tgUser.textContent =
            user.first_name ||
            user.username ||
            "Telegram User";

    }

}


/* =========================================================
   DOM
========================================================= */

const videoGrid =
    document.getElementById(
        "videoGrid"
    );


const loading =
    document.getElementById(
        "loading"
    );


const errorBox =
    document.getElementById(
        "errorBox"
    );


const errorText =
    document.getElementById(
        "errorText"
    );


const emptyBox =
    document.getElementById(
        "emptyBox"
    );


const retryBtn =
    document.getElementById(
        "retryBtn"
    );


const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );


const unlockModal =
    document.getElementById(
        "unlockModal"
    );


const closeModal =
    document.getElementById(
        "closeModal"
    );


const watchAdBtn =
    document.getElementById(
        "watchAdBtn"
    );


const openVideoBtn =
    document.getElementById(
        "openVideoBtn"
    );


const progressFill =
    document.getElementById(
        "progressFill"
    );


const adCounter =
    document.getElementById(
        "adCounter"
    );


/* =========================================================
   VARIABLES
========================================================= */

let videos = [];

let selectedVideo = null;

let adsWatched = 0;

let currentCategory = "all";


/* =========================================================
   DOOD API REQUEST
========================================================= */

async function doodRequest(
    endpoint,
    params = {}
) {

    const url =
        new URL(
            `${DOOD_API}/${endpoint}`
        );


    /*
      API KEY automatically added
    */

    url.searchParams.set(
        "key",
        DOODSTREAM_API_KEY
    );


    Object.entries(params).forEach(
        ([key, value]) => {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                url.searchParams.set(
                    key,
                    value
                );

            }

        }
    );


    console.log(
        "Dood API:",
        endpoint
    );


    const response =
        await fetch(
            url.toString(),
            {
                method: "GET",
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            `DoodStream HTTP ${response.status}`
        );

    }


    const data =
        await response.json();


    console.log(
        "Dood API response:",
        endpoint,
        data
    );


    if (
        data.status !== undefined &&
        Number(data.status) !== 200
    ) {

        throw new Error(
            data.msg ||
            "DoodStream API returned an error."
        );

    }


    return data;

}


/* =========================================================
   GET FILES FROM ONE FOLDER
========================================================= */

async function getFolderFiles(
    folderId
) {

    let allFiles = [];


    for (
        let page = 1;
        page <= MAX_PAGES;
        page++
    ) {

        const data =
            await doodRequest(
                "file/list",
                {
                    page: page,
                    per_page:
                        FILES_PER_PAGE,
                    fld_id:
                        folderId
                }
            );


        const result =
            data.result || {};


        const files =
            Array.isArray(
                result.files
            )
                ? result.files
                : [];


        if (!files.length) {

            break;

        }


        allFiles.push(
            ...files
        );


        /*
          যদি 200-এর কম আসে,
          সাধারণত এটাই শেষ page।
        */

        if (
            files.length <
            FILES_PER_PAGE
        ) {

            break;

        }

    }


    return allFiles;

}


/* =========================================================
   GET SUB FOLDERS
========================================================= */

async function getFolders(
    parentFolderId
) {

    const data =
        await doodRequest(
            "folder/list",
            {
                fld_id:
                    parentFolderId,

                only_folders: 1
            }
        );


    const result =
        data.result || {};


    const folders =
        Array.isArray(
            result.folders
        )
            ? result.folders
            : [];


    return folders;

}


/* =========================================================
   RECURSIVE FOLDER LOADER
========================================================= */

async function loadFolderTree(
    folderId = 0,
    visited = new Set()
) {

    /*
      একই folder দ্বিতীয়বার
      load হতে দেবে না
    */

    if (
        visited.has(
            String(folderId)
        )
    ) {

        return [];

    }


    visited.add(
        String(folderId)
    );


    let files = [];


    /*
      এই folder-এর files
    */

    try {

        const folderFiles =
            await getFolderFiles(
                folderId
            );


        files.push(
            ...folderFiles
        );

    } catch (error) {

        console.warn(
            "Could not load folder files:",
            folderId,
            error
        );

    }


    /*
      এই folder-এর subfolders
    */

    let folders = [];


    try {

        folders =
            await getFolders(
                folderId
            );

    } catch (error) {

        console.warn(
            "Could not load subfolders:",
            folderId,
            error
        );

    }


    /*
      প্রতিটি subfolder
      recursively load
    */

    for (
        const folder of folders
    ) {

        const childId =
            folder.fld_id ??
            folder.id ??
            folder.folder_id;


        if (
            childId === undefined ||
            childId === null
        ) {

            continue;

        }


        const childFiles =
            await loadFolderTree(
                childId,
                visited
            );


        files.push(
            ...childFiles
        );

    }


    return files;

}


/* =========================================================
   LOAD ALL POSTS
========================================================= */

async function loadPosts() {

    showLoading();


    videos = [];


    try {

        /*
          Root থেকে শুরু করে
          সব folder scan
        */

        const rawFiles =
            await loadFolderTree(
                0
            );


        console.log(
            "TOTAL RAW FILES:",
            rawFiles.length
        );


        /*
          Normalize
        */

        const normalized =
            rawFiles
                .map(
                    normalizeFile
                )
                .filter(Boolean);


        /*
          Duplicate remove
        */

        const unique =
            new Map();


        normalized.forEach(
            video => {

                if (
                    !unique.has(
                        video.fileCode
                    )
                ) {

                    unique.set(
                        video.fileCode,
                        video
                    );

                }

            }
        );


        videos =
            Array.from(
                unique.values()
            );


        /*
          Newest first
        */

        videos.sort(
            (a, b) =>
                getTime(
                    b.uploaded
                ) -
                getTime(
                    a.uploaded
                )
        );


        hideLoading();


        errorBox.classList.add(
            "hidden"
        );


        if (
            videos.length === 0
        ) {

            videoGrid.innerHTML =
                "";

            emptyBox.classList.remove(
                "hidden"
            );

            return;

        }


        emptyBox.classList.add(
            "hidden"
        );


        render();


    } catch (error) {

        console.error(
            "LOAD POSTS ERROR:",
            error
        );


        hideLoading();


        showError(
            getFriendlyError(
                error
            )
        );

    }

}


/* =========================================================
   NORMALIZE FILE
========================================================= */

function normalizeFile(
    file
) {

    if (!file) {

        return null;

    }


    const fileCode =
        file.file_code ||
        file.filecode ||
        file.code;


    if (!fileCode) {

        return null;

    }


    const title =
        file.title ||
        file.name ||
        "Untitled Video";


    const thumbnail =
        file.single_img ||
        file.splash_img ||
        file.image ||
        file.thumbnail ||
        "";


    const duration =
        file.length ||
        file.duration ||
        "";


    const views =
        Number(
            file.views || 0
        );


    const uploaded =
        file.uploaded ||
        file.upload_date ||
        "";


    const folderId =
        file.fld_id ??
        file.folder_id ??
        0;


    return {

        id: String(
            fileCode
        ),

        fileCode: String(
            fileCode
        ),

        title: String(
            title
        ),

        thumbnail: String(
            thumbnail
        ),

        duration: String(
            duration
        ),

        views: views,

        uploaded:
            uploaded,

        folderId:
            String(
                folderId
            ),

        canPlay:
            file.canplay !== false

    };

}


/* =========================================================
   RENDER POSTS
========================================================= */

function render() {

    let list =
        [...videos];


    /*
      Trending
    */

    if (
        currentCategory ===
        "trending"
    ) {

        list.sort(
            (a, b) =>
                b.views -
                a.views
        );

    }


    videoGrid.innerHTML =
        "";


    if (!list.length) {

        emptyBox.classList.remove(
            "hidden"
        );

        return;

    }


    emptyBox.classList.add(
        "hidden"
    );


    list.forEach(
        video => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "video-card";


            card.innerHTML = `

                <div class="video-thumb">

                    ${
                        video.thumbnail

                        ?

                        `
                        <img
                            src="${escapeHtml(video.thumbnail)}"
                            alt="${escapeHtml(video.title)}"
                            loading="lazy"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        >

                        <div
                            class="thumbnail-fallback"
                            style="display:none;">
                            🎬
                        </div>
                        `

                        :

                        `
                        <div class="thumbnail-fallback">
                            🎬
                        </div>
                        `
                    }


                    <div class="video-play">
                        ▶
                    </div>


                    ${
                        video.duration

                        ?

                        `
                        <span class="duration">
                            ${escapeHtml(
                                video.duration
                            )}
                        </span>
                        `

                        :

                        ""
                    }

                </div>


                <div class="video-info">

                    <h3>
                        ${escapeHtml(
                            video.title
                        )}
                    </h3>


                    <div class="video-meta">

                        <span>
                            👁 ${formatNumber(
                                video.views
                            )}
                        </span>


                        <span>
                            🔒 Locked
                        </span>

                    </div>


                    <button
                        class="open-video-btn"
                        data-id="${escapeHtml(
                            video.fileCode
                        )}">
                        🔓 Unlock Video
                    </button>

                </div>

            `;


            const button =
                card.querySelector(
                    ".open-video-btn"
                );


            button.addEventListener(
                "click",
                () => {

                    openVideo(
                        video
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
   OPEN VIDEO
========================================================= */

function openVideo(
    video
) {

    selectedVideo =
        video;


    adsWatched = 0;


    updateProgress();


    watchAdBtn.classList.remove(
        "hidden"
    );


    openVideoBtn.classList.add(
        "hidden"
    );


    unlockModal.classList.remove(
        "hidden"
    );


    const unlocked =
        sessionStorage.getItem(
            `video_unlocked_${video.fileCode}`
        );


    if (
        unlocked === "1"
    ) {

        adsWatched =
            REQUIRED_ADS;


        updateProgress();


        unlockVideo();

    }

}


/* =========================================================
   WATCH AD
========================================================= */

if (watchAdBtn) {

    watchAdBtn.addEventListener(
        "click",
        async () => {

            if (
                !selectedVideo
            ) {

                return;

            }


            if (
                adsWatched >=
                REQUIRED_ADS
            ) {

                unlockVideo();

                return;

            }


            watchAdBtn.disabled =
                true;


            watchAdBtn.textContent =
                "Loading Ad...";


            try {

                const adFunction =
                    window[
                        MONETAG_FUNCTION
                    ];


                if (
                    typeof adFunction !==
                    "function"
                ) {

                    throw new Error(
                        "Monetag ad is not ready."
                    );

                }


                /*
                  Reward only after
                  ad promise completes.
                */

                await adFunction();


                adsWatched++;


                updateProgress();


                if (
                    adsWatched >=
                    REQUIRED_ADS
                ) {

                    unlockVideo();

                }


            } catch (error) {

                console.error(
                    "MONETAG ERROR:",
                    error
                );


                alert(
                    "Ad could not be completed. Please try again."
                );


            } finally {

                watchAdBtn.disabled =
                    false;


                watchAdBtn.textContent =
                    "▶ Watch Ad";

            }

        }
    );

}


/* =========================================================
   UNLOCK
========================================================= */

function unlockVideo() {

    if (
        !selectedVideo
    ) {

        return;

    }


    sessionStorage.setItem(
        `video_unlocked_${selectedVideo.fileCode}`,
        "1"
    );


    watchAdBtn.classList.add(
        "hidden"
    );


    openVideoBtn.classList.remove(
        "hidden"
    );


    openVideoBtn.textContent =
        "🎬 Watch Video";


    adCounter.textContent =
        "✅ Video Unlocked";


    openVideoBtn.onclick =
        () => {

            window.location.href =
                `video.html?id=${
                    encodeURIComponent(
                        selectedVideo.fileCode
                    )
                }`;

        };

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const percentage =
        Math.min(
            100,
            (
                adsWatched /
                REQUIRED_ADS
            ) * 100
        );


    if (progressFill) {

        progressFill.style.width =
            percentage + "%";

    }


    if (adCounter) {

        adCounter.textContent =
            `${adsWatched} / ${REQUIRED_ADS} Ads Completed`;

    }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

if (closeModal) {

    closeModal.addEventListener(
        "click",
        () => {

            unlockModal.classList.add(
                "hidden"
            );

        }
    );

}


if (unlockModal) {

    unlockModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                unlockModal
            ) {

                unlockModal.classList.add(
                    "hidden"
                );

            }

        }
    );

}


/* =========================================================
   CATEGORY
========================================================= */

document
    .querySelectorAll(
        ".category"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".category"
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


                    render();

                }
            );

        }
    );


/* =========================================================
   BOTTOM TRENDING
========================================================= */

const trendingNav =
    document.getElementById(
        "trendingNav"
    );


if (trendingNav) {

    trendingNav.addEventListener(
        "click",
        () => {

            const trendingButton =
                document.querySelector(
                    '[data-category="trending"]'
                );


            if (
                trendingButton
            ) {

                trendingButton.click();

            }

        }
    );

}


/* =========================================================
   REFRESH
========================================================= */

if (retryBtn) {

    retryBtn.addEventListener(
        "click",
        loadPosts
    );

}


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadPosts
    );

}


/* =========================================================
   HELPERS
========================================================= */

function showLoading() {

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (errorBox) {

        errorBox.classList.add(
            "hidden"
        );

    }


    if (emptyBox) {

        emptyBox.classList.add(
            "hidden"
        );

    }

}


function hideLoading() {

    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }

}


function showError(
    message
) {

    if (errorBox) {

        errorBox.classList.remove(
            "hidden"
        );

    }


    if (errorText) {

        errorText.textContent =
            message;

    }

}


function getFriendlyError(
    error
) {

    const message =
        error?.message ||
        "";


    if (
        message.includes(
            "Failed to fetch"
        )
    ) {

        return (
            "DoodStream API থেকে data পাওয়া যাচ্ছে না। " +
            "Browser CORS/API access অথবা API Key সমস্যা হতে পারে।"
        );

    }


    return message ||
        "Videos could not be loaded.";

}


function getTime(
    value
) {

    if (!value) {

        return 0;

    }


    const timestamp =
        new Date(
            value
        ).getTime();


    return Number.isNaN(
        timestamp
    )
        ? 0
        : timestamp;

}


function formatNumber(
    value
) {

    return Number(
        value || 0
    ).toLocaleString();

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   START
========================================================= */

loadPosts();
