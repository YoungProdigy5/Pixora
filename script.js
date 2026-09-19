/* =========================================================
   PIXORA — UNIFIED FRONTEND ENGINE
   Wallpapers + Videos + Auth + User Uploads + Statistics
   Admin-aware + Legacy Upload Support + Live Search
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const supabase = window.pixoraSupabase;

    if (!supabase) {
        console.error("PIXORA: Supabase client not found.");
        return;
    }

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const body = document.body;

    const themeToggle =
        document.getElementById("themeToggle");

    const searchTrigger =
        document.getElementById("searchTrigger");

    const searchPanel =
        document.getElementById("searchPanel");

    const searchInput =
        document.getElementById("searchInput");

    const clearSearch =
        document.getElementById("clearSearch");

    const authButton =
        document.getElementById("authButton");

    const categoryList =
        document.getElementById("categoryList");

    const trendingGrid =
        document.getElementById("trendingGrid");

    const wallpaperGrid =
        document.getElementById("wallpaperGrid");

    const videoGrid =
        document.getElementById("videoGrid");

    const resultsCount =
        document.getElementById("resultsCount");

    const videoResultsCount =
        document.getElementById("videoResultsCount");

    const emptyState =
        document.getElementById("emptyState");

    const videoEmptyState =
        document.getElementById("videoEmptyState");

    const loadMoreBtn =
        document.getElementById("loadMoreBtn");

    const loadMoreContainer =
        document.getElementById("loadMoreContainer");

    const resetFilters =
        document.getElementById("resetFilters");

    const randomBtn =
        document.getElementById("randomBtn");

    const exploreBtn =
        document.getElementById("exploreBtn");

    /* Account */
    const accountSection =
        document.getElementById("account");

    const accountNavBtn =
        document.getElementById("accountNavBtn");

    const accountUserName =
        document.getElementById("accountUserName");

    const accountUserEmail =
        document.getElementById("accountUserEmail");

    const showUploadWallpaperBtn =
        document.getElementById(
            "showUploadWallpaperBtn"
        );

    const showUploadVideoBtn =
        document.getElementById(
            "showUploadVideoBtn"
        );

    const logoutBtn =
        document.getElementById("logoutBtn");

    /* Statistics */
    const accountStats =
        document.getElementById("accountStats");

    /* Upload panel */
    const userUploadPanel =
        document.getElementById("userUploadPanel");

    const uploadWallpaperTab =
        document.getElementById(
            "uploadWallpaperTab"
        );

    const uploadVideoTab =
        document.getElementById(
            "uploadVideoTab"
        );

    /* Wallpaper upload */
    const wallpaperUploadForm =
        document.getElementById(
            "wallpaperUploadForm"
        );

    const wallpaperTitle =
        document.getElementById(
            "wallpaperTitle"
        );

    const wallpaperCategory =
        document.getElementById(
            "wallpaperCategory"
        );

    const wallpaperTags =
        document.getElementById(
            "wallpaperTags"
        );

    const wallpaperFile =
        document.getElementById(
            "wallpaperFile"
        );

    const wallpaperRightsConfirmation =
        document.getElementById(
            "wallpaperRightsConfirmation"
        );

    const submitWallpaperUpload =
        document.getElementById(
            "submitWallpaperUpload"
        );

    const wallpaperUploadMessage =
        document.getElementById(
            "wallpaperUploadMessage"
        );

    /* Video upload */
    const videoUploadForm =
        document.getElementById(
            "videoUploadForm"
        );

    const videoTitle =
        document.getElementById(
            "videoTitle"
        );

    const videoCategory =
        document.getElementById(
            "videoCategory"
        );

    const videoTags =
        document.getElementById(
            "videoTags"
        );

    const videoThumbnail =
        document.getElementById(
            "videoThumbnail"
        );

    const videoFile =
        document.getElementById(
            "videoFile"
        );

    const videoRightsConfirmation =
        document.getElementById(
            "videoRightsConfirmation"
        );

    const submitVideoUpload =
        document.getElementById(
            "submitVideoUpload"
        );

    const videoUploadMessage =
        document.getElementById(
            "videoUploadMessage"
        );

    /* My uploads */
    const myUploadsGrid =
        document.getElementById(
            "myUploadsGrid"
        );

    const myUploadsEmpty =
        document.getElementById(
            "myUploadsEmpty"
        );

    /* Wallpaper preview */
    const previewModal =
        document.getElementById(
            "previewModal"
        );

    const modalBackdrop =
        document.querySelector(
            ".modal-backdrop"
        );

    const modalClose =
        document.getElementById(
            "modalClose"
        );

    const modalArt =
        document.getElementById(
            "modalArt"
        );

    const modalTitle =
        document.getElementById(
            "modalTitle"
        );

    const modalDetails =
        document.getElementById(
            "modalDetails"
        );

    const modalLike =
        document.getElementById(
            "modalLike"
        );

    const modalDownload =
        document.getElementById(
            "modalDownload"
        );

    /* Video preview */
    const videoPreviewModal =
        document.getElementById(
            "videoPreviewModal"
        );

    const videoModalClose =
        document.getElementById(
            "videoModalClose"
        );

    const videoPlayer =
        document.getElementById(
            "videoPlayer"
        );

    const videoModalTitle =
        document.getElementById(
            "videoModalTitle"
        );

    const videoModalDetails =
        document.getElementById(
            "videoModalDetails"
        );

    const videoModalDownload =
        document.getElementById(
            "videoModalDownload"
        );

    /* Delete */
    const deleteConfirmModal =
        document.getElementById(
            "deleteConfirmModal"
        );

    const deleteConfirmClose =
        document.getElementById(
            "deleteConfirmClose"
        );

    const deleteConfirmTitle =
        document.getElementById(
            "deleteConfirmTitle"
        );

    const cancelDeleteBtn =
        document.getElementById(
            "cancelDeleteBtn"
        );

    const confirmDeleteBtn =
        document.getElementById(
            "confirmDeleteBtn"
        );

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    /* =====================================================
       STATE
       ===================================================== */

    const INITIAL_LOAD = 12;
    const LOAD_MORE_AMOUNT = 12;

    let wallpapers = [];
    let videos = [];
    let categories = [];
    let randomizedFeed = [];

    let activeCategory = "all";
    let searchTerm = "";
    let displayedLimit = INITIAL_LOAD;

    let currentUser = null;
    let currentUserIsAdmin = false;

    let currentWallpaper = null;
    let currentVideo = null;
    let pendingDelete = null;

    let likes = {};

    let accountStatsData = {
        wallpapers: 0,
        videos: 0,
        views: 0,
        downloads: 0
    };

    try {
        likes =
            JSON.parse(
                localStorage.getItem(
                    "pixoraLikes"
                )
            ) || {};
    } catch {
        likes = {};
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    function normalize(value) {
        return String(value || "")
            .trim()
            .toLowerCase();
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function capitalize(value) {
        const text =
            String(value || "");

        return text
            ? text.charAt(0).toUpperCase() +
                  text.slice(1)
            : "";
    }

    function shuffle(array) {
        const copy = [...array];

        for (
            let i = copy.length - 1;
            i > 0;
            i--
        ) {
            const j =
                Math.floor(
                    Math.random() *
                        (i + 1)
                );

            [
                copy[i],
                copy[j]
            ] = [
                copy[j],
                copy[i]
            ];
        }

        return copy;
    }

    function fileSafeName(name) {
        return String(
            name || "file"
        )
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "-"
            )
            .slice(0, 120);
    }

    function saveLikes() {
        localStorage.setItem(
            "pixoraLikes",
            JSON.stringify(likes)
        );
    }

    function wallpaperId(item) {
        return item.id != null
            ? String(item.id)
            : normalize(item.title);
    }

    function imageUrl(item) {
        return String(
            item.image_url ||
                item.image ||
                ""
        ).trim();
    }

    function itemSearchText(item) {
        return [
            item.title,
            item.category,
            item.tags,
            item.description,
            Array.isArray(
                item.keywords
            )
                ? item.keywords.join(" ")
                : item.keywords
        ]
            .join(" ")
            .toLowerCase();
    }

    function scrollToSection(id) {
        const section =
            document.getElementById(id);

        if (section) {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    function setMessage(
        element,
        text,
        error = false
    ) {
        if (!element) return;

        element.textContent = text;

        element.style.display =
            "block";

        element.style.color =
            error
                ? "#ff1744"
                : "#22c55e";
    }

    function getStoragePath(
        url,
        bucket
    ) {
        if (!url) return null;

        try {
            const parsed =
                new URL(url);

            const marker =
                `/storage/v1/object/public/${bucket}/`;

            const index =
                parsed.pathname.indexOf(
                    marker
                );

            if (index === -1) {
                return null;
            }

            return decodeURIComponent(
                parsed.pathname.slice(
                    index +
                        marker.length
                )
            );
        } catch {
            return null;
        }
    }

    async function uploadToBucket(
        bucket,
        file,
        userId
    ) {
        const path =
            `${userId}/${Date.now()}-${fileSafeName(
                file.name
            )}`;

        const {
            error
        } =
            await supabase.storage
                .from(bucket)
                .upload(
                    path,
                    file,
                    {
                        cacheControl:
                            "3600",
                        upsert: false,
                        contentType:
                            file.type ||
                            undefined
                    }
                );

        if (error) {
            throw error;
        }

        const { data } =
            supabase.storage
                .from(bucket)
                .getPublicUrl(
                    path
                );

        return {
            path,
            url: data.publicUrl
        };
    }

    /* =====================================================
       STATISTICS
       ===================================================== */

    function renderAccountStats() {
        if (!accountStats)
            return;

        accountStats.innerHTML = `
            <div class="pixora-stat">
                <strong>${accountStatsData.wallpapers}</strong>
                <span>Wallpapers</span>
            </div>

            <div class="pixora-stat">
                <strong>${accountStatsData.videos}</strong>
                <span>Videos</span>
            </div>

            <div class="pixora-stat">
                <strong>${accountStatsData.views}</strong>
                <span>Views</span>
            </div>

            <div class="pixora-stat">
                <strong>${accountStatsData.downloads}</strong>
                <span>Downloads</span>
            </div>
        `;
    }

    async function loadAccountStats() {
        if (!currentUser)
            return;

        let wallpaperQuery =
            supabase
                .from("wallpapers")
                .select(
                    "views,downloads,user_id"
                );

        let videoQuery =
            supabase
                .from("videos")
                .select(
                    "views,downloads,user_id"
                );

        if (!currentUserIsAdmin) {
            wallpaperQuery =
                wallpaperQuery.eq(
                    "user_id",
                    currentUser.id
                );

            videoQuery =
                videoQuery.eq(
                    "user_id",
                    currentUser.id
                );
        }

        const [
            wallpaperResult,
            videoResult
        ] =
            await Promise.all([
                wallpaperQuery,
                videoQuery
            ]);

        if (
            wallpaperResult.error
        ) {
            console.error(
                "PIXORA wallpaper stats:",
                wallpaperResult.error
            );
        }

        if (videoResult.error) {
            console.error(
                "PIXORA video stats:",
                videoResult.error
            );
        }

        const wallpaperRows =
            wallpaperResult.data ||
            [];

        const videoRows =
            videoResult.data || [];

        accountStatsData = {
            wallpapers:
                wallpaperRows.length,

            videos:
                videoRows.length,

            views:
                wallpaperRows.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.views ||
                                0
                        ),
                    0
                ) +
                videoRows.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.views ||
                                0
                        ),
                    0
                ),

            downloads:
                wallpaperRows.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.downloads ||
                                0
                        ),
                    0
                ) +
                videoRows.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.downloads ||
                                0
                        ),
                    0
                )
        };

        renderAccountStats();
    }

    /* =====================================================
       AUTH
       ===================================================== */

    async function getSessionUser() {
        try {
            const {
                data,
                error
            } =
                await supabase.auth.getUser();

            if (error) {
                console.error(
                    "PIXORA auth:",
                    error
                );

                return null;
            }

            return (
                data?.user || null
            );
        } catch {
            return null;
        }
    }

    async function isAdmin(user) {
        if (!user) return false;

        const {
            data,
            error
        } =
            await supabase
                .from(
                    "pixora_admin_users"
                )
                .select("user_id")
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();

        if (error) {
            console.error(
                "PIXORA admin check:",
                error
            );

            return false;
        }

        return !!data;
    }

    async function updateAuthUI() {
        currentUser =
            await getSessionUser();

        currentUserIsAdmin =
            await isAdmin(
                currentUser
            );

        if (currentUser) {
            if (authButton) {
                authButton.textContent =
                    "Account";
            }

            if (accountUserEmail) {
                accountUserEmail.textContent =
                    currentUser.email ||
                    "";
            }

            const metadata =
                currentUser.user_metadata ||
                {};

            if (accountUserName) {
                const name =
                    metadata.full_name ||
                    metadata.name ||
                    currentUser.email?.split(
                        "@"
                    )[0] ||
                    "PIXORA User";

                accountUserName.textContent =
                    currentUserIsAdmin
                        ? `${name} • Admin`
                        : name;
            }

            if (accountSection) {
                accountSection.hidden =
                    true;
            }

            if (accountNavBtn) {
                accountNavBtn.hidden =
                    false;
            }

            await loadMyUploads();
            await loadAccountStats();
        } else {
            currentUserIsAdmin =
                false;

            if (authButton) {
                authButton.textContent =
                    "Login / Sign Up";
            }

            if (accountNavBtn) {
                accountNavBtn.hidden =
                    true;
            }

            if (accountSection) {
                accountSection.hidden =
                    true;
            }

            if (userUploadPanel) {
                userUploadPanel.hidden =
                    true;
            }

            if (accountStats) {
                accountStats.innerHTML =
                    "";
            }

            if (myUploadsGrid) {
                myUploadsGrid.innerHTML =
                    "";
            }

            if (myUploadsEmpty) {
                myUploadsEmpty.hidden =
                    false;
            }
        }
    }

    authButton?.addEventListener(
        "click",
        async () => {
            if (currentUser) {
                if (accountSection) {
                    accountSection.hidden =
                        false;
                }

                scrollToSection(
                    "account"
                );

                return;
            }

            window.location.href =
                "login.html";
        }
    );

    accountNavBtn?.addEventListener(
        "click",
        () => {
            if (!currentUser) {
                window.location.href =
                    "login.html";

                return;
            }

            if (accountSection) {
                accountSection.hidden =
                    false;
            }

            scrollToSection(
                "account"
            );

            loadMyUploads();
            loadAccountStats();
        }
    );

    logoutBtn?.addEventListener(
        "click",
        async () => {
            const {
                error
            } =
                await supabase.auth.signOut();

            if (error) {
                alert(
                    "Logout failed: " +
                        error.message
                );

                return;
            }

            currentUser = null;
            currentUserIsAdmin =
                false;

            window.location.reload();
        }
    );

    /* =====================================================
       CATEGORIES
       ===================================================== */

    async function loadCategories() {
        if (!categoryList)
            return;

        const {
            data,
            error
        } =
            await supabase
                .from("categories")
                .select("*")
                .order(
                    "name",
                    {
                        ascending:
                            true
                    }
                );

        if (error) {
            console.error(
                "PIXORA categories:",
                error
            );

            categories = [];
        } else {
            categories =
                data || [];
        }

        renderCategories();
        populateUploadCategories();
    }

    function renderCategories() {
        if (!categoryList)
            return;

        categoryList.innerHTML =
            "";

        const allButton =
            document.createElement(
                "button"
            );

        allButton.type =
            "button";

        allButton.className =
            "category-btn active";

        allButton.dataset.category =
            "all";

        allButton.textContent =
            "All";

        allButton.addEventListener(
            "click",
            () => {
                setCategory("all");
            }
        );

        categoryList.appendChild(
            allButton
        );

        categories.forEach(
            category => {
                const name =
                    category.name ||
                    category.title ||
                    category.category;

                if (!name) return;

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "category-btn";

                button.dataset.category =
                    normalize(name);

                button.textContent =
                    capitalize(name);

                button.addEventListener(
                    "click",
                    () => {
                        setCategory(
                            name
                        );
                    }
                );

                categoryList.appendChild(
                    button
                );
            }
        );
    }

    function populateUploadCategories() {
        const selects = [
            wallpaperCategory,
            videoCategory
        ];

        selects.forEach(
            select => {
                if (!select)
                    return;

                const current =
                    select.value;

                select.innerHTML =
                    `<option value="">Select category</option>`;

                categories.forEach(
                    category => {
                        const name =
                            category.name ||
                            category.title ||
                            category.category;

                        if (!name)
                            return;

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            name;

                        option.textContent =
                            capitalize(
                                name
                            );

                        select.appendChild(
                            option
                        );
                    }
                );

                if (current) {
                    select.value =
                        current;
                }
            }
        );
    }

    function setCategory(category) {
        activeCategory =
            normalize(
                category
            ) || "all";

        displayedLimit =
            INITIAL_LOAD;

        document
            .querySelectorAll(
                ".category-btn"
            )
            .forEach(
                button => {
                    button.classList.toggle(
                        "active",
                        normalize(
                            button
                                .dataset
                                .category
                        ) ===
                            activeCategory
                    );
                }
            );

        renderWallpapers();
        renderVideos();
    }

    /* =====================================================
       WALLPAPER DATA
       ===================================================== */

    async function loadWallpapers() {
        if (!wallpaperGrid)
            return;

        const {
            data,
            error
        } =
            await supabase
                .from("wallpapers")
                .select("*")
                .eq(
                    "status",
                    "approved"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );

        if (error) {
            console.error(
                "PIXORA wallpapers:",
                error
            );

            wallpapers = [];
        } else {
            wallpapers =
                data || [];
        }

        randomizedFeed =
            shuffle(
                wallpapers
            );

        renderWallpapers();
        renderTrending();

        /*
         * Search suggestions depend on
         * current database content.
         */
        refreshSearchSuggestions();
    }

    function filteredWallpapers() {
        return wallpapers.filter(
            item => {
                const categoryMatch =
                    activeCategory ===
                        "all" ||
                    normalize(
                        item.category
                    ) ===
                        activeCategory;

                const searchMatch =
                    !searchTerm ||
                    itemSearchText(
                        item
                    ).includes(
                        searchTerm
                    );

                return (
                    categoryMatch &&
                    searchMatch
                );
            }
        );
    }

    function renderWallpapers() {
        if (!wallpaperGrid)
            return;

        const filtered =
            filteredWallpapers();

        const visible =
            filtered.slice(
                0,
                displayedLimit
            );

        wallpaperGrid.innerHTML =
            "";

        visible.forEach(
            item => {
                wallpaperGrid.appendChild(
                    createWallpaperCard(
                        item
                    )
                );
            }
        );

        if (resultsCount) {
            resultsCount.textContent =
                `${filtered.length} ${
                    filtered.length ===
                    1
                        ? "wallpaper"
                        : "wallpapers"
                }`;
        }

        if (emptyState) {
            emptyState.hidden =
                filtered.length !==
                0;
        }

        if (loadMoreContainer) {
            loadMoreContainer.hidden =
                filtered.length <=
                displayedLimit;
        }
    }

    /* =====================================================
       WALLPAPER CARD
       ===================================================== */

    function createWallpaperCard(
        item
    ) {
        const id =
            wallpaperId(item);

        const liked =
            !!likes[id];

        const url =
            imageUrl(item);

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "wallpaper-card";

        card.dataset.id =
            id;

        const art =
            document.createElement(
                "div"
            );

        art.className =
            "wallpaper-art";

        if (url) {
            const image =
                document.createElement(
                    "img"
                );

            image.className =
                "wallpaper-image";

            image.src =
                url;

            image.alt =
                item.title ||
                "PIXORA wallpaper";

            image.loading =
                "lazy";

            image.onerror =
                () => {
                    image.style.display =
                        "none";
                };

            art.appendChild(
                image
            );
        } else {
            const placeholder =
                document.createElement(
                    "div"
                );

            placeholder.className =
                "art-placeholder";

            placeholder.textContent =
                "🖼️";

            art.appendChild(
                placeholder
            );
        }

        const likeButton =
            document.createElement(
                "button"
            );

        likeButton.className =
            "like-btn" +
            (liked
                ? " liked"
                : "");

        likeButton.type =
            "button";

        likeButton.setAttribute(
            "aria-label",
            liked
                ? "Unlike wallpaper"
                : "Like wallpaper"
        );

        likeButton.title =
            liked
                ? "Unlike"
                : "Like";

        likeButton.textContent =
            liked
                ? "♥"
                : "♡";

        const previewButton =
            document.createElement(
                "button"
            );

        previewButton.className =
            "preview-btn";

        previewButton.type =
            "button";

        previewButton.setAttribute(
            "aria-label",
            "Preview wallpaper"
        );

        previewButton.title =
            "Preview";

        previewButton.textContent =
            "👁";

        const downloadButton =
            document.createElement(
                "button"
            );

        downloadButton.className =
            "download-btn";

        downloadButton.type =
            "button";

        downloadButton.setAttribute(
            "aria-label",
            "Download wallpaper"
        );

        downloadButton.title =
            "Download";

        downloadButton.textContent =
            "↓";

        art.appendChild(
            likeButton
        );

        art.appendChild(
            previewButton
        );

        art.appendChild(
            downloadButton
        );

        const info =
            document.createElement(
                "div"
            );

        info.className =
            "wallpaper-info";

        const title =
            document.createElement(
                "h3"
            );

        title.textContent =
            item.title ||
            "Untitled Wallpaper";

        const category =
            document.createElement(
                "p"
            );

        category.textContent =
            item.category ||
            "Wallpaper";

        info.appendChild(title);
        info.appendChild(category);

        card.appendChild(art);
        card.appendChild(info);

        likeButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                if (likes[id]) {
                    delete likes[id];
                } else {
                    likes[id] = true;
                }

                saveLikes();

                const isLiked =
                    !!likes[id];

                likeButton.classList.toggle(
                    "liked",
                    isLiked
                );

                likeButton.textContent =
                    isLiked
                        ? "♥"
                        : "♡";

                likeButton.setAttribute(
                    "aria-label",
                    isLiked
                        ? "Unlike wallpaper"
                        : "Like wallpaper"
                );

                likeButton.title =
                    isLiked
                        ? "Unlike"
                        : "Like";

                if (
                    currentWallpaper &&
                    wallpaperId(
                        currentWallpaper
                    ) === id
                ) {
                    updateModalLikeState();
                }
            }
        );

        previewButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                openWallpaperPreview(
                    item
                );
            }
        );

        downloadButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                downloadWallpaper(
                    item
                );
            }
        );

        card.addEventListener(
            "click",
            event => {
                if (
                    event.target.closest(
                        "button"
                    )
                ) {
                    return;
                }

                openWallpaperPreview(
                    item
                );
            }
        );

        return card;
    }

    /* =====================================================
       TRENDING
       ===================================================== */

    function renderTrending() {
        if (!trendingGrid)
            return;

        const trending =
            [...wallpapers]
                .sort(
                    (a, b) =>
                        Number(
                            b.views ||
                                0
                        ) -
                        Number(
                            a.views ||
                                0
                        )
                )
                .slice(0, 6);

        trendingGrid.innerHTML =
            "";

        trending.forEach(
            item => {
                trendingGrid.appendChild(
                    createWallpaperCard(
                        item
                    )
                );
            }
        );
    }

    /* =====================================================
       WALLPAPER PREVIEW
       ===================================================== */

    function openWallpaperPreview(
        item
    ) {
        if (!previewModal)
            return;

        currentWallpaper =
            item;

        const url =
            imageUrl(item);

        if (modalArt) {
            modalArt.innerHTML =
                "";

            if (url) {
                const image =
                    document.createElement(
                        "img"
                    );

                image.src = url;

                image.alt =
                    item.title ||
                    "PIXORA wallpaper";

                modalArt.appendChild(
                    image
                );
            } else {
                const placeholder =
                    document.createElement(
                        "div"
                    );

                placeholder.className =
                    "art-placeholder";

                placeholder.textContent =
                    "🖼️";

                modalArt.appendChild(
                    placeholder
                );
            }
        }

        if (modalTitle) {
            modalTitle.textContent =
                item.title ||
                "Untitled Wallpaper";
        }

        if (modalDetails) {
            const tags =
                Array.isArray(
                    item.tags
                )
                    ? item.tags.join(
                          ", "
                      )
                    : item.tags ||
                      "";

            modalDetails.textContent =
                [
                    item.category ||
                        "Wallpaper",
                    tags
                ]
                    .filter(Boolean)
                    .join(
                        " • "
                    );
        }

        updateModalLikeState();

        previewModal.classList.add(
            "active"
        );

        previewModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        incrementWallpaperView(
            item
        );
    }

    function closeWallpaperPreview() {
        if (!previewModal)
            return;

        previewModal.classList.remove(
            "active"
        );

        previewModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

        currentWallpaper =
            null;
    }

    function updateModalLikeState() {
        if (
            !modalLike ||
            !currentWallpaper
        ) {
            return;
        }

        const id =
            wallpaperId(
                currentWallpaper
            );

        const liked =
            !!likes[id];

        modalLike.textContent =
            liked
                ? "♥ Liked"
                : "♡ Like";

        modalLike.classList.toggle(
            "liked",
            liked
        );
    }

    modalClose?.addEventListener(
        "click",
        closeWallpaperPreview
    );

    modalBackdrop?.addEventListener(
        "click",
        closeWallpaperPreview
    );

    modalLike?.addEventListener(
        "click",
        () => {
            if (!currentWallpaper)
                return;

            const id =
                wallpaperId(
                    currentWallpaper
                );

            if (likes[id]) {
                delete likes[id];
            } else {
                likes[id] = true;
            }

            saveLikes();

            updateModalLikeState();
            renderWallpapers();
        }
    );

    modalDownload?.addEventListener(
        "click",
        () => {
            if (currentWallpaper) {
                downloadWallpaper(
                    currentWallpaper
                );
            }
        }
    );

    /* =====================================================
       WALLPAPER VIEWS
       ===================================================== */

    async function incrementWallpaperView(
        item
    ) {
        if (!item?.id)
            return;

        try {
            await supabase.rpc(
                "increment_wallpaper_view",
                {
                    p_id: item.id
                }
            );
        } catch (error) {
            console.error(
                "PIXORA wallpaper view:",
                error
            );
        }
    }

    /* =====================================================
       WALLPAPER DOWNLOAD
       ===================================================== */

    async function downloadWallpaper(
        item
    ) {
        const url =
            imageUrl(item);

        if (!url) {
            alert(
                "This wallpaper is not available for download."
            );

            return;
        }

        if (item?.id) {
            try {
                await supabase.rpc(
                    "increment_wallpaper_download",
                    {
                        p_id: item.id
                    }
                );
            } catch (error) {
                console.error(
                    "PIXORA wallpaper download:",
                    error
                );
            }
        }

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            `${fileSafeName(
                item.title ||
                    "PIXORA-wallpaper"
            )}.jpg`;

        link.target = "_blank";
        link.rel =
            "noopener";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();
    }

    /* =====================================================
       LOAD MORE
       ===================================================== */

    loadMoreBtn?.addEventListener(
        "click",
        () => {
            displayedLimit +=
                LOAD_MORE_AMOUNT;

            renderWallpapers();
        }
    );

    /* =====================================================
       LIVE SEARCH AUTOCOMPLETE
       ===================================================== */

    let searchSuggestionsBox =
        null;

    function ensureSearchSuggestionsBox() {
        if (
            searchSuggestionsBox &&
            document.body.contains(
                searchSuggestionsBox
            )
        ) {
            return searchSuggestionsBox;
        }

        if (!searchInput)
            return null;

        searchSuggestionsBox =
            document.createElement(
                "div"
            );

        searchSuggestionsBox.id =
            "pixoraSearchSuggestions";

        searchSuggestionsBox.style.cssText =
            `
            position:absolute;
            left:0;
            right:0;
            top:100%;
            z-index:9999;
            background:var(--card-bg,#15151f);
            color:inherit;
            border-radius:12px;
            margin-top:6px;
            overflow:hidden;
            box-shadow:0 12px 30px rgba(0,0,0,.25);
            display:none;
            `;

        const parent =
            searchInput.parentElement;

        if (!parent)
            return null;

        const parentPosition =
            window.getComputedStyle(
                parent
            ).position;

        if (
            parentPosition ===
            "static"
        ) {
            parent.style.position =
                "relative";
        }

        parent.appendChild(
            searchSuggestionsBox
        );

        return searchSuggestionsBox;
    }

    function getSearchSuggestionValues() {
        const values = [];
        const seen =
            new Set();

        function addValue(value) {
            const text =
                String(
                    value || ""
                ).trim();

            const key =
                normalize(text);

            if (
                !text ||
                !key ||
                seen.has(key)
            ) {
                return;
            }

            seen.add(key);
            values.push(text);
        }

        wallpapers.forEach(
            item => {
                addValue(
                    item.title
                );

                addValue(
                    item.category
                );

                if (
                    Array.isArray(
                        item.keywords
                    )
                ) {
                    item.keywords.forEach(
                        keyword =>
                            addValue(
                                keyword
                            )
                    );
                }

                String(
                    item.tags || ""
                )
                    .split(",")
                    .forEach(
                        tag =>
                            addValue(
                                tag
                            )
                    );
            }
        );

        videos.forEach(
            item => {
                addValue(
                    item.title
                );

                addValue(
                    item.category
                );

                if (
                    Array.isArray(
                        item.keywords
                    )
                ) {
                    item.keywords.forEach(
                        keyword =>
                            addValue(
                                keyword
                            )
                    );
                }

                String(
                    item.tags || ""
                )
                    .split(",")
                    .forEach(
                        tag =>
                            addValue(
                                tag
                            )
                    );
            }
        );

        categories.forEach(
            category => {
                addValue(
                    category.name
                );
            }
        );

        return values;
    }

    function renderSearchSuggestions() {
        if (!searchInput)
            return;

        const box =
            ensureSearchSuggestionsBox();

        if (!box)
            return;

        const query =
            normalize(
                searchInput.value
            );

        box.innerHTML =
            "";

        if (!query) {
            box.style.display =
                "none";

            return;
        }

        const allValues =
            getSearchSuggestionValues();

        const suggestions =
            allValues
                .filter(
                    value =>
                        normalize(
                            value
                        ).includes(
                            query
                        )
                )
                .sort(
                    (a, b) => {
                        const ak =
                            normalize(
                                a
                            );

                        const bk =
                            normalize(
                                b
                            );

                        const aStarts =
                            ak.startsWith(
                                query
                            );

                        const bStarts =
                            bk.startsWith(
                                query
                            );

                        if (
                            aStarts &&
                            !bStarts
                        ) {
                            return -1;
                        }

                        if (
                            !aStarts &&
                            bStarts
                        ) {
                            return 1;
                        }

                        return a.localeCompare(
                            b
                        );
                    }
                )
                .slice(
                    0,
                    8
                );

        if (!suggestions.length) {
            box.style.display =
                "none";

            return;
        }

        suggestions.forEach(
            value => {
                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.textContent =
                    "🔎 " + value;

                button.style.cssText =
                    `
                    display:block;
                    width:100%;
                    padding:12px 14px;
                    border:0;
                    background:transparent;
                    color:inherit;
                    text-align:left;
                    cursor:pointer;
                    font:inherit;
                    `;

                button.addEventListener(
                    "mouseenter",
                    () => {
                        button.style.background =
                            "rgba(255,255,255,.08)";
                    }
                );

                button.addEventListener(
                    "mouseleave",
                    () => {
                        button.style.background =
                            "transparent";
                    }
                );

                button.addEventListener(
                    "click",
                    () => {
                        searchInput.value =
                            value;

                        searchTerm =
                            normalize(
                                value
                            );

                        displayedLimit =
                            INITIAL_LOAD;

                        box.style.display =
                            "none";

                        renderWallpapers();
                        renderVideos();

                        if (
                            wallpaperGrid
                        ) {
                            wallpaperGrid.scrollIntoView(
                                {
                                    behavior:
                                        "smooth",
                                    block:
                                        "start"
                                }
                            );
                        }
                    }
                );

                box.appendChild(
                    button
                );
            }
        );

        box.style.display =
            "block";
    }

    function refreshSearchSuggestions() {
        if (
            searchInput &&
            normalize(
                searchInput.value
            )
        ) {
            renderSearchSuggestions();
        }
    }

    /* =====================================================
       SEARCH
       ===================================================== */

    function openSearch() {
        if (!searchPanel)
            return;

        searchPanel.classList.add(
            "active"
        );

        searchPanel.hidden =
            false;

        setTimeout(
            () => {
                searchInput?.focus();
                renderSearchSuggestions();
            },
            100
        );
    }

    function closeSearch() {
        if (!searchPanel)
            return;

        searchPanel.classList.remove(
            "active"
        );

        searchPanel.hidden =
            true;

        if (
            searchSuggestionsBox
        ) {
            searchSuggestionsBox.style.display =
                "none";
        }
    }

    function performSearch() {
        const query =
            normalize(
                searchInput?.value ||
                    ""
            );

        searchTerm =
            query;

        displayedLimit =
            INITIAL_LOAD;

        renderWallpapers();
        renderVideos();

        if (
            searchSuggestionsBox
        ) {
            searchSuggestionsBox.style.display =
                "none";
        }

        if (query) {
            closeSearch();

            if (wallpaperGrid) {
                wallpaperGrid.scrollIntoView(
                    {
                        behavior:
                            "smooth",
                        block:
                            "start"
                    }
                );
            }
        }
    }

    searchTrigger?.addEventListener(
        "click",
        () => {
            const panelIsOpen =
                searchPanel?.classList.contains(
                    "active"
                );

            if (panelIsOpen) {
                performSearch();
            } else {
                openSearch();
            }
        }
    );

    searchInput?.addEventListener(
        "input",
        () => {
            searchTerm =
                normalize(
                    searchInput.value
                );

            displayedLimit =
                INITIAL_LOAD;

            renderWallpapers();
            renderVideos();
            renderSearchSuggestions();
        }
    );

    searchInput?.addEventListener(
        "keydown",
        event => {
            if (
                event.key ===
                "Enter"
            ) {
                event.preventDefault();

                performSearch();
            }

            if (
                event.key ===
                "Escape"
            ) {
                closeSearch();
            }
        }
    );

    clearSearch?.addEventListener(
        "click",
        () => {
            if (searchInput) {
                searchInput.value =
                    "";
            }

            searchTerm =
                "";

            displayedLimit =
                INITIAL_LOAD;

            renderWallpapers();
            renderVideos();

            if (
                searchSuggestionsBox
            ) {
                searchSuggestionsBox.style.display =
                    "none";
            }

            searchInput?.focus();
        }
    );

    document.addEventListener(
        "click",
        event => {
            if (
                !searchSuggestionsBox ||
                !searchInput
            ) {
                return;
            }

            if (
                !searchSuggestionsBox.contains(
                    event.target
                ) &&
                event.target !==
                    searchInput
            ) {
                searchSuggestionsBox.style.display =
                    "none";
            }
        }
    );

    /* =====================================================
       FILTER RESET
       ===================================================== */

    resetFilters?.addEventListener(
        "click",
        () => {
            activeCategory =
                "all";

            searchTerm =
                "";

            displayedLimit =
                INITIAL_LOAD;

            if (searchInput) {
                searchInput.value =
                    "";
            }

            document
                .querySelectorAll(
                    ".category-btn"
                )
                .forEach(
                    button => {
                        button.classList.toggle(
                            "active",
                            normalize(
                                button
                                    .dataset
                                    .category
                            ) ===
                                "all"
                        );
                    }
                );

            if (
                searchSuggestionsBox
            ) {
                searchSuggestionsBox.style.display =
                    "none";
            }

            renderWallpapers();
            renderVideos();
        }
    );

    /* =====================================================
       RANDOM WALLPAPER
       ===================================================== */

    randomBtn?.addEventListener(
        "click",
        () => {
            if (
                !randomizedFeed.length
            ) {
                randomizedFeed =
                    shuffle(
                        wallpapers
                    );
            }

            const item =
                randomizedFeed.shift();

            if (item) {
                openWallpaperPreview(
                    item
                );
            }

            if (
                !randomizedFeed.length
            ) {
                randomizedFeed =
                    shuffle(
                        wallpapers
                    );
            }
        }
    );

    exploreBtn?.addEventListener(
        "click",
        () => {
            scrollToSection(
                "new"
            );
        }
    );

    /* =====================================================
       VIDEOS
       ===================================================== */

    async function loadVideos() {
        if (!videoGrid)
            return;

        const {
            data,
            error
        } =
            await supabase
                .from("videos")
                .select("*")
                .eq(
                    "status",
                    "approved"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );

        if (error) {
            console.error(
                "PIXORA videos:",
                error
            );

            videos = [];
        } else {
            videos =
                data || [];
        }

        renderVideos();
        refreshSearchSuggestions();
    }

    function filteredVideos() {
        return videos.filter(
            item => {
                const categoryMatch =
                    activeCategory ===
                        "all" ||
                    normalize(
                        item.category
                    ) ===
                        activeCategory;

                const searchMatch =
                    !searchTerm ||
                    itemSearchText(
                        item
                    ).includes(
                        searchTerm
                    );

                return (
                    categoryMatch &&
                    searchMatch
                );
            }
        );
    }

    function renderVideos() {
        if (!videoGrid)
            return;

        const filtered =
            filteredVideos();

        videoGrid.innerHTML =
            "";

        filtered.forEach(
            item => {
                videoGrid.appendChild(
                    createVideoCard(
                        item
                    )
                );
            }
        );

        if (videoResultsCount) {
            videoResultsCount.textContent =
                `${filtered.length} ${
                    filtered.length ===
                    1
                        ? "video"
                        : "videos"
                }`;
        }

        if (videoEmptyState) {
            videoEmptyState.hidden =
                filtered.length !==
                0;
        }
    }

    function createVideoCard(
        item
    ) {
        const card =
            document.createElement(
                "article"
            );

        card.className =
            "video-card";

        const thumbnail =
            item.thumbnail_url;

        card.innerHTML = `
            <div class="video-card-media">

                ${
                    thumbnail
                        ? `
                            <img
                                src="${escapeHtml(
                                    thumbnail
                                )}"
                                alt="${escapeHtml(
                                    item.title ||
                                        "PIXORA video"
                                )}"
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="video-placeholder">
                                🎬
                            </div>
                        `
                }

                <div class="video-play-icon">
                    ▶
                </div>

            </div>

            <div class="video-card-info">

                <h3>
                    ${escapeHtml(
                        item.title ||
                            "Untitled Video"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        item.category ||
                            "Video"
                    )}
                </p>

            </div>
        `;

        card.addEventListener(
            "click",
            () => {
                openVideoPreview(
                    item
                );
            }
        );

        return card;
    }

    /* =====================================================
       VIDEO PREVIEW
       ===================================================== */

    function openVideoPreview(
        item
    ) {
        if (!videoPreviewModal)
            return;

        currentVideo =
            item;

        if (videoModalTitle) {
            videoModalTitle.textContent =
                item.title ||
                "Untitled Video";
        }

        if (videoModalDetails) {
            const tags =
                Array.isArray(
                    item.tags
                )
                    ? item.tags.join(
                          ", "
                      )
                    : item.tags ||
                      "";

            videoModalDetails.textContent =
                [
                    item.category ||
                        "Video",
                    tags
                ]
                    .filter(Boolean)
                    .join(
                        " • "
                    );
        }

        if (videoPlayer) {
            videoPlayer.pause();

            videoPlayer.src =
                item.video_url ||
                "";

            videoPlayer.load();
        }

        videoPreviewModal.classList.add(
            "active"
        );

        videoPreviewModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        incrementVideoView(
            item
        );
    }

    function closeVideoPreview() {
        if (!videoPreviewModal)
            return;

        videoPreviewModal.classList.remove(
            "active"
        );

        videoPreviewModal.setAttribute(
            "aria-hidden",
            "true"
        );

        if (videoPlayer) {
            videoPlayer.pause();

            videoPlayer.removeAttribute(
                "src"
            );

            videoPlayer.load();
        }

        document.body.classList.remove(
            "modal-open"
        );

        currentVideo =
            null;
    }

    videoModalClose?.addEventListener(
        "click",
        closeVideoPreview
    );

    videoPreviewModal?.addEventListener(
        "click",
        event => {
            if (
                event.target ===
                videoPreviewModal
            ) {
                closeVideoPreview();
            }
        }
    );

    videoModalDownload?.addEventListener(
        "click",
        () => {
            if (currentVideo) {
                downloadVideo(
                    currentVideo
                );
            }
        }
    );

    /* =====================================================
       VIDEO VIEWS
       ===================================================== */

    async function incrementVideoView(
        item
    ) {
        if (!item?.id)
            return;

        try {
            await supabase.rpc(
                "increment_video_view",
                {
                    p_id: item.id
                }
            );
        } catch (error) {
            console.error(
                "PIXORA video view:",
                error
            );
        }
    }

    /* =====================================================
       VIDEO DOWNLOAD
       ===================================================== */

    async function downloadVideo(
        item
    ) {
        const url =
            String(
                item.video_url ||
                    ""
            ).trim();

        if (!url) {
            alert(
                "This video is not available for download."
            );

            return;
        }

        if (item?.id) {
            try {
                await supabase.rpc(
                    "increment_video_download",
                    {
                        p_id: item.id
                    }
                );
            } catch (error) {
                console.error(
                    "PIXORA video download:",
                    error
                );
            }
        }

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            fileSafeName(
                item.title ||
                    "PIXORA-video"
            );

        link.target = "_blank";
        link.rel =
            "noopener";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();
    }

    /* =====================================================
       UPLOAD PANEL
       ===================================================== */

    function showUploadPanel(
        type = "wallpaper"
    ) {
        if (!currentUser) {
            window.location.href =
                "login.html";

            return;
        }

        if (userUploadPanel) {
            userUploadPanel.hidden =
                false;
        }

        if (wallpaperUploadForm) {
            wallpaperUploadForm.hidden =
                type !==
                "wallpaper";
        }

        if (videoUploadForm) {
            videoUploadForm.hidden =
                type !==
                "video";
        }

        uploadWallpaperTab?.classList.toggle(
            "active",
            type ===
                "wallpaper"
        );

        uploadVideoTab?.classList.toggle(
            "active",
            type === "video"
        );

        userUploadPanel?.scrollIntoView({
            behavior:
                "smooth",
            block:
                "start"
        });
    }

    showUploadWallpaperBtn?.addEventListener(
        "click",
        () => {
            showUploadPanel(
                "wallpaper"
            );
        }
    );

    showUploadVideoBtn?.addEventListener(
        "click",
        () => {
            showUploadPanel(
                "video"
            );
        }
    );

    uploadWallpaperTab?.addEventListener(
        "click",
        () => {
            showUploadPanel(
                "wallpaper"
            );
        }
    );

    uploadVideoTab?.addEventListener(
        "click",
        () => {
            showUploadPanel(
                "video"
            );
        }
    );

    /* =====================================================
       WALLPAPER UPLOAD
       ===================================================== */

    wallpaperUploadForm?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (!currentUser) {
                window.location.href =
                    "login.html";

                return;
            }

            const file =
                wallpaperFile
                    ?.files?.[0];

            if (!file) {
                setMessage(
                    wallpaperUploadMessage,
                    "Please select a wallpaper image.",
                    true
                );

                return;
            }

            if (
                wallpaperRightsConfirmation &&
                !wallpaperRightsConfirmation.checked
            ) {
                setMessage(
                    wallpaperUploadMessage,
                    "Please confirm that you own the rights to this upload.",
                    true
                );

                return;
            }

            if (
                !wallpaperTitle?.value.trim()
            ) {
                setMessage(
                    wallpaperUploadMessage,
                    "Please enter a title.",
                    true
                );

                return;
            }

            let uploaded =
                null;

            try {
                submitWallpaperUpload.disabled =
                    true;

                submitWallpaperUpload.textContent =
                    "Uploading...";

                setMessage(
                    wallpaperUploadMessage,
                    currentUserIsAdmin
                        ? "Uploading wallpaper..."
                        : "Uploading wallpaper for admin review..."
                );

                uploaded =
                    await uploadToBucket(
                        "wallpapers",
                        file,
                        currentUser.id
                    );

                const uploadStatus =
                    currentUserIsAdmin
                        ? "approved"
                        : "pending";

                const {
                    error
                } =
                    await supabase
                        .from(
                            "wallpapers"
                        )
                        .insert({
                            user_id:
                                currentUser.id,

                            title:
                                wallpaperTitle.value.trim(),

                            category:
                                wallpaperCategory?.value.trim() ||
                                "General",

                            tags:
                                wallpaperTags?.value.trim() ||
                                "",

                            image_url:
                                uploaded.url,

                            views: 0,
                            downloads: 0,

                            status:
                                uploadStatus
                        });

                if (error) {
                    await supabase.storage
                        .from(
                            "wallpapers"
                        )
                        .remove([
                            uploaded.path
                        ]);

                    throw error;
                }

                wallpaperUploadForm.reset();

                setMessage(
                    wallpaperUploadMessage,
                    currentUserIsAdmin
                        ? "✅ Wallpaper uploaded and approved."
                        : "✅ Uploaded! Your wallpaper is now waiting for admin review."
                );

                await loadMyUploads();
                await loadAccountStats();
                await loadWallpapers();
            } catch (error) {
                console.error(
                    "PIXORA wallpaper upload:",
                    error
                );

                setMessage(
                    wallpaperUploadMessage,
                    "❌ Upload failed: " +
                        error.message,
                    true
                );
            } finally {
                submitWallpaperUpload.disabled =
                    false;

                submitWallpaperUpload.textContent =
                    "Upload Wallpaper";
            }
        }
    );

    /* =====================================================
       VIDEO UPLOAD
       ===================================================== */

    videoUploadForm?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (!currentUser) {
                window.location.href =
                    "login.html";

                return;
            }

            const file =
                videoFile
                    ?.files?.[0];

            if (!file) {
                setMessage(
                    videoUploadMessage,
                    "Please select a video file.",
                    true
                );

                return;
            }

            if (
                videoRightsConfirmation &&
                !videoRightsConfirmation.checked
            ) {
                setMessage(
                    videoUploadMessage,
                    "Please confirm that you own the rights to this upload.",
                    true
                );

                return;
            }

            if (
                !videoTitle?.value.trim()
            ) {
                setMessage(
                    videoUploadMessage,
                    "Please enter a title.",
                    true
                );

                return;
            }

            let uploadedVideo =
                null;

            let thumbnailPath =
                null;

            try {
                submitVideoUpload.disabled =
                    true;

                submitVideoUpload.textContent =
                    "Uploading...";

                setMessage(
                    videoUploadMessage,
                    currentUserIsAdmin
                        ? "Uploading video..."
                        : "Uploading video for admin review..."
                );

                uploadedVideo =
                    await uploadToBucket(
                        "videos",
                        file,
                        currentUser.id
                    );

                let thumbnailUrl =
                    null;

                const thumb =
                    videoThumbnail
                        ?.files?.[0];

                if (thumb) {
                    const uploadedThumb =
                        await uploadToBucket(
                            "wallpapers",
                            thumb,
                            currentUser.id
                        );

                    thumbnailUrl =
                        uploadedThumb.url;

                    thumbnailPath =
                        uploadedThumb.path;
                }

                const uploadStatus =
                    currentUserIsAdmin
                        ? "approved"
                        : "pending";

                const {
                    error
                } =
                    await supabase
                        .from("videos")
                        .insert({
                            user_id:
                                currentUser.id,

                            title:
                                videoTitle.value.trim(),

                            category:
                                videoCategory?.value.trim() ||
                                "General",

                            tags:
                                videoTags?.value.trim() ||
                                "",

                            video_url:
                                uploadedVideo.url,

                            thumbnail_url:
                                thumbnailUrl,

                            views: 0,
                            downloads: 0,

                            status:
                                uploadStatus
                        });

                if (error) {
                    await supabase.storage
                        .from(
                            "videos"
                        )
                        .remove([
                            uploadedVideo.path
                        ]);

                    if (
                        thumbnailPath
                    ) {
                        await supabase.storage
                            .from(
                                "wallpapers"
                            )
                            .remove([
                                thumbnailPath
                            ]);
                    }

                    throw error;
                }

                videoUploadForm.reset();

                setMessage(
                    videoUploadMessage,
                    currentUserIsAdmin
                        ? "✅ Video uploaded and approved."
                        : "✅ Uploaded! Your video is now waiting for admin review."
                );

                await loadMyUploads();
                await loadAccountStats();
                await loadVideos();
            } catch (error) {
                console.error(
                    "PIXORA video upload:",
                    error
                );

                setMessage(
                    videoUploadMessage,
                    "❌ Upload failed: " +
                        error.message,
                    true
                );
            } finally {
                submitVideoUpload.disabled =
                    false;

                submitVideoUpload.textContent =
                    "Upload Video";
            }
        }
    );

    /* =====================================================
       MY UPLOADS
       ===================================================== */

    async function loadMyUploads() {
        if (
            !currentUser ||
            !myUploadsGrid
        ) {
            return;
        }

        let wallpaperQuery =
            supabase
                .from(
                    "wallpapers"
                )
                .select(
                    "id,created_at,title,category,image_url,status,user_id,views,downloads,tags"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );

        let videoQuery =
            supabase
                .from("videos")
                .select(
                    "id,created_at,title,category,video_url,thumbnail_url,status,user_id,views,downloads,tags"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );

        /*
         * ADMIN:
         * See all wallpaper/video records that the
         * admin is allowed to manage.
         *
         * This is important for the original 12
         * wallpapers whose user_id is NULL.
         *
         * NORMAL USER:
         * Only see their own uploads.
         */
        if (!currentUserIsAdmin) {
            wallpaperQuery =
                wallpaperQuery.eq(
                    "user_id",
                    currentUser.id
                );

            videoQuery =
                videoQuery.eq(
                    "user_id",
                    currentUser.id
                );
        }

        const [
            wallpaperResult,
            videoResult
        ] =
            await Promise.all([
                wallpaperQuery,
                videoQuery
            ]);

        if (
            wallpaperResult.error
        ) {
            console.error(
                "PIXORA My Uploads wallpapers:",
                wallpaperResult.error
            );
        }

        if (videoResult.error) {
            console.error(
                "PIXORA My Uploads videos:",
                videoResult.error
            );
        }

        const items = [
            ...(wallpaperResult.data ||
                [])
                .map(
                    item => ({
                        ...item,
                        mediaType:
                            "wallpaper"
                    })
                ),

            ...(videoResult.data ||
                [])
                .map(
                    item => ({
                        ...item,
                        mediaType:
                            "video"
                    })
                )
        ].sort(
            (a, b) =>
                new Date(
                    b.created_at
                ) -
                new Date(
                    a.created_at
                )
        );

        myUploadsGrid.innerHTML =
            "";

        if (!items.length) {
            if (myUploadsEmpty) {
                myUploadsEmpty.hidden =
                    false;
            }

            return;
        }

        if (myUploadsEmpty) {
            myUploadsEmpty.hidden =
                true;
        }

        items.forEach(
            item => {
                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "my-upload-card";

                const media =
                    document.createElement(
                        "div"
                    );

                media.className =
                    "my-upload-media";

                const mediaUrl =
                    item.mediaType ===
                    "wallpaper"
                        ? item.image_url
                        : item.thumbnail_url;

                if (mediaUrl) {
                    const img =
                        document.createElement(
                            "img"
                        );

                    img.src =
                        mediaUrl;

                    img.alt =
                        item.title ||
                        "PIXORA upload";

                    img.loading =
                        "lazy";

                    media.appendChild(
                        img
                    );
                } else {
                    media.textContent =
                        item.mediaType ===
                        "video"
                            ? "🎬"
                            : "🖼️";
                }

                const info =
                    document.createElement(
                        "div"
                    );

                info.className =
                    "my-upload-info";

                info.innerHTML = `
                    <h3>
                        ${escapeHtml(
                            item.title ||
                                "Untitled"
                        )}
                    </h3>

                    <span>
                        ${escapeHtml(
                            capitalize(
                                item.mediaType
                            )
                        )}

                        • ${escapeHtml(
                            capitalize(
                                normalize(
                                    item.status
                                )
                            )
                        )}

                        • ${Number(
                            item.views ||
                                0
                        )} views

                        • ${Number(
                            item.downloads ||
                                0
                        )} downloads
                    </span>
                `;

                /*
                 * Admins can delete ALL records visible
                 * to the admin dashboard, including the
                 * original NULL-user wallpapers.
                 *
                 * Normal users can delete only their own.
                 */
                const deleteButton =
                    document.createElement(
                        "button"
                    );

                deleteButton.type =
                    "button";

                deleteButton.className =
                    "danger-btn";

                deleteButton.textContent =
                    "Delete";

                deleteButton.onclick =
                    () =>
                        askDelete(
                            item
                        );

                info.appendChild(
                    deleteButton
                );

                card.appendChild(
                    media
                );

                card.appendChild(
                    info
                );

                myUploadsGrid.appendChild(
                    card
                );
            }
        );
    }

    /* =====================================================
       DELETE
       ===================================================== */

    function askDelete(item) {
        pendingDelete =
            item;

        if (deleteConfirmTitle) {
            deleteConfirmTitle.textContent =
                `Delete "${
                    item.title ||
                    "this upload"
                }"?`;
        }

        deleteConfirmModal?.classList.add(
            "active"
        );

        deleteConfirmModal?.setAttribute(
            "aria-hidden",
            "false"
        );
    }

    function closeDeleteModal() {
        pendingDelete =
            null;

        deleteConfirmModal?.classList.remove(
            "active"
        );

        deleteConfirmModal?.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    deleteConfirmClose?.addEventListener(
        "click",
        closeDeleteModal
    );

    cancelDeleteBtn?.addEventListener(
        "click",
        closeDeleteModal
    );

    confirmDeleteBtn?.addEventListener(
        "click",
        async () => {
            if (
                !pendingDelete ||
                !currentUser
            ) {
                return;
            }

            confirmDeleteBtn.disabled =
                true;

            try {
                const item =
                    pendingDelete;

                const table =
                    item.mediaType ===
                    "wallpaper"
                        ? "wallpapers"
                        : "videos";

                const bucket =
                    item.mediaType ===
                    "wallpaper"
                        ? "wallpapers"
                        : "videos";

                const fileUrl =
                    item.mediaType ===
                    "wallpaper"
                        ? item.image_url
                        : item.video_url;

                /*
                 * ADMIN:
                 * Delete by ID only.
                 *
                 * NORMAL USER:
                 * Delete only when user_id matches.
                 *
                 * This is what allows an admin to
                 * remove the original legacy rows
                 * where user_id is NULL.
                 */
                let deleteQuery =
                    supabase
                        .from(table)
                        .delete()
                        .eq(
                            "id",
                            item.id
                        );

                if (
                    !currentUserIsAdmin
                ) {
                    deleteQuery =
                        deleteQuery.eq(
                            "user_id",
                            currentUser.id
                        );
                }

                const {
                    error
                } =
                    await deleteQuery;

                if (error) {
                    throw error;
                }

                const path =
                    getStoragePath(
                        fileUrl,
                        bucket
                    );

                if (path) {
                    const {
                        error:
                            storageError
                    } =
                        await supabase.storage
                            .from(
                                bucket
                            )
                            .remove([
                                path
                            ]);

                    if (
                        storageError
                    ) {
                        console.warn(
                            "PIXORA storage delete:",
                            storageError
                        );
                    }
                }

                if (
                    item.mediaType ===
                        "video" &&
                    item.thumbnail_url
                ) {
                    const thumbPath =
                        getStoragePath(
                            item.thumbnail_url,
                            "wallpapers"
                        );

                    if (thumbPath) {
                        const {
                            error:
                                thumbError
                        } =
                            await supabase.storage
                                .from(
                                    "wallpapers"
                                )
                                .remove([
                                    thumbPath
                                ]);

                        if (
                            thumbError
                        ) {
                            console.warn(
                                "PIXORA thumbnail delete:",
                                thumbError
                            );
                        }
                    }
                }

                closeDeleteModal();

                await loadMyUploads();
                await loadAccountStats();
                await loadWallpapers();
                await loadVideos();
            } catch (error) {
                console.error(
                    "PIXORA delete upload:",
                    error
                );

                alert(
                    "Delete failed: " +
                        error.message
                );
            } finally {
                confirmDeleteBtn.disabled =
                    false;
            }
        }
    );

    /* =====================================================
       THEME
       ===================================================== */

    function applyTheme(theme) {
        const light =
            theme === "light";

        body.classList.toggle(
            "light-mode",
            light
        );

        localStorage.setItem(
            "pixoraTheme",
            theme
        );

        if (themeToggle) {
            themeToggle.setAttribute(
                "aria-pressed",
                light
                    ? "true"
                    : "false"
            );
        }
    }

    const savedTheme =
        localStorage.getItem(
            "pixoraTheme"
        );

    if (savedTheme) {
        applyTheme(
            savedTheme
        );
    }

    themeToggle?.addEventListener(
        "click",
        () => {
            const isLight =
                body.classList.contains(
                    "light-mode"
                );

            applyTheme(
                isLight
                    ? "dark"
                    : "light"
            );
        }
    );

    /* =====================================================
       BOTTOM NAVIGATION
       ===================================================== */

    navItems.forEach(
        item => {
            item.addEventListener(
                "click",
                () => {
                    const target =
                        item.dataset
                            .target;

                    if (!target)
                        return;

                    navItems.forEach(
                        nav => {
                            nav.classList.toggle(
                                "active",
                                nav ===
                                    item
                            );
                        }
                    );

                    scrollToSection(
                        target
                    );
                }
            );
        }
    );

    const navigationSections = [
        "home",
        "trending",
        "new",
        "videos",
        "categories",
        "account"
    ];

    function updateNavigation() {
        const scrollPosition =
            window.scrollY +
            180;

        let activeTarget =
            "home";

        navigationSections.forEach(
            id => {
                const section =
                    document.getElementById(
                        id
                    );

                if (
                    section &&
                    !section.hidden &&
                    section.offsetTop <=
                        scrollPosition
                ) {
                    activeTarget =
                        id;
                }
            }
        );

        navItems.forEach(
            item => {
                item.classList.toggle(
                    "active",
                    item.dataset
                        .target ===
                        activeTarget
                );
            }
        );
    }

    window.addEventListener(
        "scroll",
        updateNavigation,
        {
            passive: true
        }
    );

    /* =====================================================
       KEYBOARD
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key ===
                "Escape"
            ) {
                closeWallpaperPreview();
                closeVideoPreview();
                closeSearch();
                closeDeleteModal();
            }
        }
    );

    /* =====================================================
       SUPABASE AUTH STATE
       ===================================================== */

    supabase.auth.onAuthStateChange(
        async () => {
            currentUser =
                await getSessionUser();

            currentUserIsAdmin =
                await isAdmin(
                    currentUser
                );

            await updateAuthUI();
        }
    );

    /* =====================================================
       INITIALIZE
       ===================================================== */

    currentUser =
        await getSessionUser();

    currentUserIsAdmin =
        await isAdmin(
            currentUser
        );

    await Promise.all([
        loadCategories(),
        loadWallpapers(),
        loadVideos()
    ]);

    await updateAuthUI();

    updateNavigation();

    console.log(
        `PIXORA initialized — ${wallpapers.length} wallpapers, ${videos.length} videos, admin: ${currentUserIsAdmin}.`
    );
});


/* =========================================================
   PIXORA HERO SLIDER — COLOR / SLIDE TRANSITION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const heroSlides =
            document.querySelectorAll(
                ".hero-slide"
            );

        const heroDots =
            document.querySelectorAll(
                ".hero-dot"
            );

        if (
            !heroSlides.length
        ) {
            return;
        }

        let currentHeroSlide = 0;
        let heroTimer;

        function showHeroSlide(
            index
        ) {
            if (
                index >=
                heroSlides.length
            ) {
                index = 0;
            }

            if (index < 0) {
                index =
                    heroSlides.length -
                    1;
            }

            heroSlides.forEach(
                (
                    slide,
                    i
                ) => {
                    slide.classList.toggle(
                        "active",
                        i === index
                    );
                }
            );

            heroDots.forEach(
                (
                    dot,
                    i
                ) => {
                    dot.classList.toggle(
                        "active",
                        i === index
                    );
                }
            );

            currentHeroSlide =
                index;
        }

        function nextHeroSlide() {
            showHeroSlide(
                currentHeroSlide +
                    1
            );
        }

        function startHeroSlider() {
            clearInterval(
                heroTimer
            );

            heroTimer =
                setInterval(
                    () => {
                        nextHeroSlide();
                    },
                    5000
                );
        }

        heroDots.forEach(
            (
                dot,
                index
            ) => {
                dot.addEventListener(
                    "click",
                    () => {
                        showHeroSlide(
                            index
                        );

                        startHeroSlider();
                    }
                );
            }
        );

        showHeroSlide(0);
        startHeroSlider();
    }
);
