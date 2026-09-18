/* =========================================================
   PIXORA — UNIFIED FRONTEND ENGINE
   Wallpapers + Videos + Auth + User Uploads + Statistics
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

    const themeToggle = document.getElementById("themeToggle");
    const searchTrigger = document.getElementById("searchTrigger");
    const searchPanel = document.getElementById("searchPanel");
    const searchInput = document.getElementById("searchInput");
    const clearSearch = document.getElementById("clearSearch");
    const authButton = document.getElementById("authButton");

    const categoryList = document.getElementById("categoryList");
    const trendingGrid = document.getElementById("trendingGrid");
    const wallpaperGrid = document.getElementById("wallpaperGrid");
    const videoGrid = document.getElementById("videoGrid");

    const resultsCount = document.getElementById("resultsCount");
    const videoResultsCount = document.getElementById("videoResultsCount");
    const emptyState = document.getElementById("emptyState");
    const videoEmptyState = document.getElementById("videoEmptyState");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const loadMoreContainer = document.getElementById("loadMoreContainer");
    const resetFilters = document.getElementById("resetFilters");
    const randomBtn = document.getElementById("randomBtn");
    const exploreBtn = document.getElementById("exploreBtn");

    /* Account */
    const accountSection = document.getElementById("account");
    const accountNavBtn = document.getElementById("accountNavBtn");
    const accountUserName = document.getElementById("accountUserName");
    const accountUserEmail = document.getElementById("accountUserEmail");
    const showUploadWallpaperBtn = document.getElementById("showUploadWallpaperBtn");
    const showUploadVideoBtn = document.getElementById("showUploadVideoBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    /* Statistics */
    const accountStats = document.getElementById("accountStats");

    /* Upload panel */
    const userUploadPanel = document.getElementById("userUploadPanel");
    const uploadWallpaperTab = document.getElementById("uploadWallpaperTab");
    const uploadVideoTab = document.getElementById("uploadVideoTab");

    /* Wallpaper upload */
    const wallpaperUploadForm = document.getElementById("wallpaperUploadForm");
    const wallpaperTitle = document.getElementById("wallpaperTitle");
    const wallpaperCategory = document.getElementById("wallpaperCategory");
    const wallpaperTags = document.getElementById("wallpaperTags");
    const wallpaperFile = document.getElementById("wallpaperFile");
    const wallpaperRightsConfirmation = document.getElementById("wallpaperRightsConfirmation");
    const submitWallpaperUpload = document.getElementById("submitWallpaperUpload");
    const wallpaperUploadMessage = document.getElementById("wallpaperUploadMessage");

    /* Video upload */
    const videoUploadForm = document.getElementById("videoUploadForm");
    const videoTitle = document.getElementById("videoTitle");
    const videoCategory = document.getElementById("videoCategory");
    const videoTags = document.getElementById("videoTags");
    const videoThumbnail = document.getElementById("videoThumbnail");
    const videoFile = document.getElementById("videoFile");
    const videoRightsConfirmation = document.getElementById("videoRightsConfirmation");
    const submitVideoUpload = document.getElementById("submitVideoUpload");
    const videoUploadMessage = document.getElementById("videoUploadMessage");

    /* My uploads */
    const myUploadsGrid = document.getElementById("myUploadsGrid");
    const myUploadsEmpty = document.getElementById("myUploadsEmpty");

    /* Wallpaper preview */
    const previewModal = document.getElementById("previewModal");
    const modalBackdrop = document.querySelector(".modal-backdrop");
    const modalClose = document.getElementById("modalClose");
    const modalArt = document.getElementById("modalArt");
    const modalTitle = document.getElementById("modalTitle");
    const modalDetails = document.getElementById("modalDetails");
    const modalLike = document.getElementById("modalLike");
    const modalDownload = document.getElementById("modalDownload");

    /* Video preview */
    const videoPreviewModal = document.getElementById("videoPreviewModal");
    const videoModalClose = document.getElementById("videoModalClose");
    const videoPlayer = document.getElementById("videoPlayer");
    const videoModalTitle = document.getElementById("videoModalTitle");
    const videoModalDetails = document.getElementById("videoModalDetails");
    const videoModalDownload = document.getElementById("videoModalDownload");

    /* Delete */
    const deleteConfirmModal = document.getElementById("deleteConfirmModal");
    const deleteConfirmClose = document.getElementById("deleteConfirmClose");
    const deleteConfirmTitle = document.getElementById("deleteConfirmTitle");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    const navItems = document.querySelectorAll(".nav-item");

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
        likes = JSON.parse(localStorage.getItem("pixoraLikes")) || {};
    } catch {
        likes = {};
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
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
        const text = String(value || "");
        return text
            ? text.charAt(0).toUpperCase() + text.slice(1)
            : "";
    }

    function shuffle(array) {
        const copy = [...array];

        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }

        return copy;
    }

    function fileSafeName(name) {
        return String(name || "file")
            .replace(/[^a-zA-Z0-9._-]/g, "-")
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
            Array.isArray(item.keywords)
                ? item.keywords.join(" ")
                : item.keywords
        ]
            .join(" ")
            .toLowerCase();
    }

    function scrollToSection(id) {
        const section = document.getElementById(id);

        if (section) {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    function setMessage(element, text, error = false) {
        if (!element) return;

        element.textContent = text;
        element.style.display = "block";
        element.style.color = error
            ? "#ff1744"
            : "#22c55e";
    }

    function getStoragePath(url, bucket) {
        if (!url) return null;

        try {
            const parsed = new URL(url);

            const marker =
                `/storage/v1/object/public/${bucket}/`;

            const index =
                parsed.pathname.indexOf(marker);

            if (index === -1) return null;

            return decodeURIComponent(
                parsed.pathname.slice(
                    index + marker.length
                )
            );
        } catch {
            return null;
        }
    }

    async function uploadToBucket(bucket, file, userId) {
        const path =
            `${userId}/${Date.now()}-${fileSafeName(file.name)}`;

        const { error } =
            await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type || undefined
                });

        if (error) {
            throw error;
        }

        const { data } =
            supabase.storage
                .from(bucket)
                .getPublicUrl(path);

        return {
            path,
            url: data.publicUrl
        };
    }

    /* =====================================================
       STATISTICS
       ===================================================== */

    function renderAccountStats() {
        if (!accountStats) return;

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
        if (!currentUser) return;

        const [
            wallpaperResult,
            videoResult
        ] = await Promise.all([
            supabase
                .from("wallpapers")
                .select("views,downloads")
                .eq("user_id", currentUser.id),

            supabase
                .from("videos")
                .select("views,downloads")
                .eq("user_id", currentUser.id)
        ]);

        if (wallpaperResult.error) {
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
            wallpaperResult.data || [];

        const videoRows =
            videoResult.data || [];

        accountStatsData = {
            wallpapers: wallpaperRows.length,
            videos: videoRows.length,
            views:
                wallpaperRows.reduce(
                    (sum, item) =>
                        sum + Number(item.views || 0),
                    0
                ) +
                videoRows.reduce(
                    (sum, item) =>
                        sum + Number(item.views || 0),
                    0
                ),
            downloads:
                wallpaperRows.reduce(
                    (sum, item) =>
                        sum + Number(item.downloads || 0),
                    0
                ) +
                videoRows.reduce(
                    (sum, item) =>
                        sum + Number(item.downloads || 0),
                    0
                )
        };

        renderAccountStats();
    }

    async function incrementView(type, id) {
        try {
            const functionName =
                type === "wallpaper"
                    ? "increment_wallpaper_view"
                    : "increment_video_view";

            await supabase.rpc(
                functionName,
                {
                    p_id: id
                }
            );
        } catch (error) {
            console.error(
                "PIXORA view counter:",
                error
            );
        }
    }

    async function incrementDownload(type, id) {
        try {
            const functionName =
                type === "wallpaper"
                    ? "increment_wallpaper_download"
                    : "increment_video_download";

            await supabase.rpc(
                functionName,
                {
                    p_id: id
                }
            );
        } catch (error) {
            console.error(
                "PIXORA download counter:",
                error
            );
        }
    }

    /* =====================================================
       AUTH
       ===================================================== */

    async function getSessionUser() {
        const {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {
            console.error(
                "PIXORA session:",
                error
            );

            return null;
        }

        return data?.session?.user || null;
    }

    async function isAdmin(userId) {
        if (!userId) return false;

        const {
            data,
            error
        } = await supabase
            .from("pixora_admin_users")
            .select("user_id")
            .eq("user_id", userId)
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
        currentUser = await getSessionUser();

        if (authButton) {
            authButton.textContent =
                currentUser
                    ? "My Account"
                    : "Login / Sign Up";
        }

        if (accountSection) {
            accountSection.hidden =
                !currentUser;
        }

        if (accountNavBtn) {
            accountNavBtn.hidden =
                !currentUser;
        }

        if (currentUser) {
            const metadata =
                currentUser.user_metadata || {};

            const displayName =
                metadata.full_name ||
                metadata.name ||
                currentUser.email?.split("@")[0] ||
                "PIXORA User";

            if (accountUserName) {
                accountUserName.textContent =
                    displayName;
            }

            if (accountUserEmail) {
                accountUserEmail.textContent =
                    currentUser.email || "";
            }

            await Promise.all([
                loadMyUploads(),
                loadAccountStats()
            ]);
        } else {
            if (accountUserName) {
                accountUserName.textContent =
                    "Guest";
            }

            if (accountUserEmail) {
                accountUserEmail.textContent =
                    "";
            }

            if (myUploadsGrid) {
                myUploadsGrid.innerHTML = "";
            }

            if (accountStats) {
                accountStats.innerHTML = "";
            }
        }
    }

    authButton?.addEventListener(
        "click",
        async () => {
            if (currentUser) {
                scrollToSection("account");
            } else {
                window.location.href = "login.html";
            }
        }
    );

    logoutBtn?.addEventListener(
        "click",
        async () => {
            const {
                error
            } = await supabase.auth.signOut();

            if (error) {
                alert(
                    "Logout failed: " +
                    error.message
                );

                return;
            }

            currentUser = null;

            window.location.href =
                "index.html";
        }
    );

    supabase.auth.onAuthStateChange(
        async () => {
            setTimeout(
                updateAuthUI,
                0
            );
        }
    );

    /* =====================================================
       CATEGORIES
       ===================================================== */

    async function loadCategories() {
        if (!categoryList) return;

        const {
            data,
            error
        } = await supabase
            .from("categories")
            .select("*")
            .order("name", {
                ascending: true
            });

        if (error) {
            console.error(
                "PIXORA categories:",
                error
            );

            categories = [];
            return;
        }

        categories = data || [];

        renderCategoryButtons();
        populateUploadCategories();
    }

    function categoryName(category) {
        if (typeof category === "string") {
            return category;
        }

        return (
            category?.name ||
            category?.title ||
            category?.category ||
            ""
        );
    }

    function renderCategoryButtons() {
        if (!categoryList) return;

        const buttons = [
            {
                name: "All",
                value: "all"
            }
        ];

        categories.forEach(category => {
            const name =
                categoryName(category);

            if (name) {
                buttons.push({
                    name,
                    value: normalize(name)
                });
            }
        });

        categoryList.innerHTML =
            buttons
                .map(item => `
                    <button
                        type="button"
                        class="category-btn ${
                            activeCategory === item.value
                                ? "active"
                                : ""
                        }"
                        data-category="${escapeHtml(item.value)}"
                    >
                        ${escapeHtml(item.name)}
                    </button>
                `)
                .join("");

        bindCategoryButtons();
    }

    function populateUploadCategories() {
        const selects = [
            wallpaperCategory,
            videoCategory
        ];

        selects.forEach(select => {
            if (!select) return;

            const current =
                select.value;

            select.innerHTML =
                `<option value="">Select category</option>`;

            categories.forEach(category => {
                const name =
                    categoryName(category);

                if (!name) return;

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = name;
                option.textContent = name;

                select.appendChild(option);
            });

            if (current) {
                select.value = current;
            }
        });
    }

    function bindCategoryButtons() {
        const buttons =
            document.querySelectorAll(
                ".category-btn"
            );

        buttons.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    activeCategory =
                        normalize(
                            button.dataset.category
                        ) || "all";

                    displayedLimit =
                        INITIAL_LOAD;

                    renderCategoryButtons();

                    renderAll();
                }
            );
        });
    }

    /* =====================================================
       WALLPAPERS
       ===================================================== */

    async function loadWallpapers() {
        if (!wallpaperGrid) return;

        const {
            data,
            error
        } = await supabase
            .from("wallpapers")
            .select("*")
            .eq("status", "approved")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error(
                "PIXORA wallpapers:",
                error
            );

            wallpapers = [];
            renderAll();

            return;
        }

        wallpapers = data || [];

        randomizedFeed =
            shuffle(wallpapers);

        renderAll();
    }

    function getFilteredWallpapers() {
        return wallpapers.filter(item => {
            const matchesCategory =
                activeCategory === "all" ||
                normalize(item.category) ===
                    activeCategory;

            const matchesSearch =
                !searchTerm ||
                itemSearchText(item).includes(
                    searchTerm
                );

            return (
                matchesCategory &&
                matchesSearch
            );
        });
    }

    function createWallpaperCard(item) {
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

        card.dataset.id = id;

        card.innerHTML = `
            <div class="wallpaper-art">
                ${
                    url
                        ? `
                            <img
                                class="wallpaper-image"
                                src="${escapeHtml(url)}"
                                alt="${escapeHtml(item.title || "PIXORA wallpaper")}"
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="art-placeholder">
                                🖼️
                            </div>
                        `
                }

                <button
                    class="like-btn ${
                        liked ? "liked" : ""
                    }"
                    type="button"
                    aria-label="Like wallpaper"
                >
                    ${liked ? "♥" : "♡"}
                </button>
            </div>

            <div class="wallpaper-info">
                <h3>
                    ${escapeHtml(
                        item.title ||
                        "Untitled Wallpaper"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        item.category ||
                        "Wallpaper"
                    )}
                </p>

                <div class="modal-actions">
                    <button
                        type="button"
                        class="preview-btn"
                    >
                        Preview
                    </button>

                    <button
                        type="button"
                        class="download-btn"
                    >
                        Download
                    </button>
                </div>
            </div>
        `;

        const likeButton =
            card.querySelector(
                ".like-btn"
            );

        const previewButton =
            card.querySelector(
                ".preview-btn"
            );

        const downloadButton =
            card.querySelector(
                ".download-btn"
            );

        likeButton?.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                if (likes[id]) {
                    delete likes[id];
                } else {
                    likes[id] = true;
                }

                saveLikes();

                likeButton.classList.toggle(
                    "liked",
                    !!likes[id]
                );

                likeButton.textContent =
                    likes[id]
                        ? "♥"
                        : "♡";
            }
        );

        previewButton?.addEventListener(
            "click",
            () => {
                openWallpaperPreview(
                    item
                );
            }
        );

        downloadButton?.addEventListener(
            "click",
            () => {
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

    function renderTrending() {
        if (!trendingGrid) return;

        const trending =
            shuffle(
                wallpapers
            ).slice(0, 6);

        trendingGrid.innerHTML = "";

        trending.forEach(item => {
            trendingGrid.appendChild(
                createWallpaperCard(item)
            );
        });
    }

    function renderWallpapers() {
        if (!wallpaperGrid) return;

        const filtered =
            getFilteredWallpapers();

        const visible =
            filtered.slice(
                0,
                displayedLimit
            );

        wallpaperGrid.innerHTML = "";

        visible.forEach(item => {
            wallpaperGrid.appendChild(
                createWallpaperCard(item)
            );
        });

        if (resultsCount) {
            resultsCount.textContent =
                `${filtered.length} wallpaper${
                    filtered.length === 1
                        ? ""
                        : "s"
                }`;
        }

        if (emptyState) {
            emptyState.hidden =
                filtered.length !== 0;
        }

        if (loadMoreContainer) {
            loadMoreContainer.hidden =
                filtered.length <=
                displayedLimit;
        }
    }

    /* =====================================================
       VIDEOS
       ===================================================== */

    async function loadVideos() {
        if (!videoGrid) return;

        const {
            data,
            error
        } = await supabase
            .from("videos")
            .select("*")
            .eq("status", "approved")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error(
                "PIXORA videos:",
                error
            );

            videos = [];
            renderVideos();

            return;
        }

        videos = data || [];

        renderVideos();
    }

    function getFilteredVideos() {
        return videos.filter(item => {
            const matchesCategory =
                activeCategory === "all" ||
                normalize(item.category) ===
                    activeCategory;

            const matchesSearch =
                !searchTerm ||
                itemSearchText(item).includes(
                    searchTerm
                );

            return (
                matchesCategory &&
                matchesSearch
            );
        });
    }

    function createVideoCard(item) {
        const card =
            document.createElement(
                "article"
            );

        card.className =
            "video-card";

        const thumbnail =
            item.thumbnail_url ||
            "";

        card.innerHTML = `
            <div class="video-thumb">
                ${
                    thumbnail
                        ? `
                            <img
                                src="${escapeHtml(thumbnail)}"
                                alt="${escapeHtml(item.title || "PIXORA video")}"
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="video-placeholder">
                                🎬
                            </div>
                        `
                }

                <button
                    type="button"
                    class="video-play"
                    aria-label="Play video"
                >
                    ▶
                </button>
            </div>

            <div class="video-info">
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

                <small>
                    ${Number(
                        item.views || 0
                    )} views
                </small>
            </div>
        `;

        card.addEventListener(
            "click",
            () => {
                openVideoPreview(item);
            }
        );

        return card;
    }

    function renderVideos() {
        if (!videoGrid) return;

        const filtered =
            getFilteredVideos();

        videoGrid.innerHTML = "";

        filtered.forEach(item => {
            videoGrid.appendChild(
                createVideoCard(item)
            );
        });

        if (videoResultsCount) {
            videoResultsCount.textContent =
                `${filtered.length} video${
                    filtered.length === 1
                        ? ""
                        : "s"
                }`;
        }

        if (videoEmptyState) {
            videoEmptyState.hidden =
                filtered.length !== 0;
        }
    }

    /* =====================================================
       RENDER EVERYTHING
       ===================================================== */

    function renderAll() {
        renderTrending();
        renderWallpapers();
        renderVideos();
    }

    /* =====================================================
       WALLPAPER PREVIEW
       ===================================================== */

    function openWallpaperPreview(item) {
        currentWallpaper = item;

        const url =
            imageUrl(item);

        if (modalArt) {
            if (url) {
                modalArt.innerHTML = `
                    <img
                        src="${escapeHtml(url)}"
                        alt="${escapeHtml(item.title || "Wallpaper")}"
                    >
                `;
            } else {
                modalArt.innerHTML = `
                    <div class="art-placeholder">
                        🖼️
                    </div>
                `;
            }
        }

        if (modalTitle) {
            modalTitle.textContent =
                item.title ||
                "Wallpaper";
        }

        if (modalDetails) {
            modalDetails.textContent =
                [
                    item.category,
                    item.tags
                ]
                    .filter(Boolean)
                    .join(" • ");
        }

        if (modalLike) {
            const id =
                wallpaperId(item);

            modalLike.textContent =
                likes[id]
                    ? "♥ Liked"
                    : "♡ Like";
        }

        previewModal?.classList.add(
            "active"
        );

        previewModal?.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        if (item.id) {
            incrementView(
                "wallpaper",
                item.id
            );
        }
    }

    function closeWallpaperPreview() {
        previewModal?.classList.remove(
            "active"
        );

        previewModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        currentWallpaper = null;

        document.body.classList.remove(
            "modal-open"
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
            if (!currentWallpaper) return;

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

            modalLike.textContent =
                likes[id]
                    ? "♥ Liked"
                    : "♡ Like";

            renderWallpapers();
        }
    );

    modalDownload?.addEventListener(
        "click",
        () => {
            if (!currentWallpaper) return;

            downloadWallpaper(
                currentWallpaper
            );
        }
    );

    async function downloadWallpaper(item) {
        const url =
            imageUrl(item);

        if (!url) {
            alert(
                "This wallpaper does not have a downloadable file."
            );

            return;
        }

        if (item.id) {
            incrementDownload(
                "wallpaper",
                item.id
            );
        }

        const link =
            document.createElement(
                "a"
            );

        link.href = url;
        link.download =
            fileSafeName(
                item.title ||
                "pixora-wallpaper"
            );

        link.target = "_blank";
        link.rel = "noopener";

        document.body.appendChild(
            link
        );

        link.click();
        link.remove();
    }

    /* =====================================================
       VIDEO PREVIEW
       ===================================================== */

    function openVideoPreview(item) {
        currentVideo = item;

        if (videoModalTitle) {
            videoModalTitle.textContent =
                item.title ||
                "PIXORA Video";
        }

        if (videoModalDetails) {
            videoModalDetails.textContent =
                [
                    item.category,
                    item.tags,
                    `${Number(
                        item.views || 0
                    )} views`
                ]
                    .filter(Boolean)
                    .join(" • ");
        }

        if (videoPlayer) {
            videoPlayer.pause();

            videoPlayer.src =
                item.video_url || "";

            videoPlayer.poster =
                item.thumbnail_url || "";

            videoPlayer.load();
        }

        videoPreviewModal?.classList.add(
            "active"
        );

        videoPreviewModal?.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        if (item.id) {
            incrementView(
                "video",
                item.id
            );
        }
    }

    function closeVideoPreview() {
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.removeAttribute(
                "src"
            );
            videoPlayer.load();
        }

        videoPreviewModal?.classList.remove(
            "active"
        );

        videoPreviewModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        currentVideo = null;

        document.body.classList.remove(
            "modal-open"
        );
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
            if (!currentVideo) return;

            const url =
                currentVideo.video_url;

            if (!url) {
                alert(
                    "This video does not have a downloadable file."
                );

                return;
            }

            if (currentVideo.id) {
                incrementDownload(
                    "video",
                    currentVideo.id
                );
            }

            const link =
                document.createElement(
                    "a"
                );

            link.href = url;
            link.download =
                fileSafeName(
                    currentVideo.title ||
                    "pixora-video"
                );

            link.target = "_blank";
            link.rel = "noopener";

            document.body.appendChild(
                link
            );

            link.click();
            link.remove();
        }
    );

    /* =====================================================
       SEARCH
       ===================================================== */

    function openSearch() {
        searchPanel?.classList.add(
            "active"
        );

        searchPanel?.removeAttribute(
            "hidden"
        );

        setTimeout(
            () => searchInput?.focus(),
            50
        );
    }

    function closeSearch() {
        searchPanel?.classList.remove(
            "active"
        );
    }

    searchTrigger?.addEventListener(
        "click",
        () => {
            if (
                searchPanel?.classList.contains(
                    "active"
                )
            ) {
                closeSearch();
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

            renderAll();

            if (clearSearch) {
                clearSearch.hidden =
                    !searchTerm;
            }
        }
    );

    clearSearch?.addEventListener(
        "click",
        () => {
            if (searchInput) {
                searchInput.value = "";
            }

            searchTerm = "";

            displayedLimit =
                INITIAL_LOAD;

            clearSearch.hidden = true;

            renderAll();

            searchInput?.focus();
        }
    );

    resetFilters?.addEventListener(
        "click",
        () => {
            activeCategory = "all";
            searchTerm = "";
            displayedLimit =
                INITIAL_LOAD;

            if (searchInput) {
                searchInput.value = "";
            }

            if (clearSearch) {
                clearSearch.hidden =
                    true;
            }

            renderCategoryButtons();
            renderAll();
        }
    );

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
       RANDOM WALLPAPER
       ===================================================== */

    randomBtn?.addEventListener(
        "click",
        () => {
            if (!randomizedFeed.length) {
                randomizedFeed =
                    shuffle(
                        wallpapers
                    );
            }

            const item =
                randomizedFeed.shift();

            if (!item) return;

            openWallpaperPreview(
                item
            );
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
       THEME
       ===================================================== */

    function applyTheme(theme) {
        if (theme === "light") {
            body.classList.add(
                "light-mode"
            );
        } else {
            body.classList.remove(
                "light-mode"
            );
        }
    }

    const savedTheme =
        localStorage.getItem(
            "pixoraTheme"
        ) || "dark";

    applyTheme(savedTheme);

    themeToggle?.addEventListener(
        "click",
        () => {
            const isLight =
                body.classList.contains(
                    "light-mode"
                );

            const newTheme =
                isLight
                    ? "dark"
                    : "light";

            applyTheme(newTheme);

            localStorage.setItem(
                "pixoraTheme",
                newTheme
            );
        }
    );

    /* =====================================================
       HERO SLIDER
       ===================================================== */

    const heroSlides =
        document.querySelectorAll(
            ".hero-slide"
        );

    const heroDots =
        document.querySelectorAll(
            ".hero-dot"
        );

    let heroIndex = 0;

    function showHeroSlide(index) {
        if (!heroSlides.length) return;

        heroIndex =
            (index + heroSlides.length) %
            heroSlides.length;

        heroSlides.forEach(
            (slide, i) => {
                slide.classList.toggle(
                    "active",
                    i === heroIndex
                );
            }
        );

        heroDots.forEach(
            (dot, i) => {
                dot.classList.toggle(
                    "active",
                    i === heroIndex
                );
            }
        );
    }

    heroDots.forEach(
        (dot, index) => {
            dot.addEventListener(
                "click",
                () => {
                    showHeroSlide(
                        index
                    );
                }
            );
        }
    );

    if (heroSlides.length > 1) {
        showHeroSlide(0);

        setInterval(
            () => {
                showHeroSlide(
                    heroIndex + 1
                );
            },
            5000
        );
    }

    /* =====================================================
       ACCOUNT / UPLOAD PANEL
       ===================================================== */

    function showUploadPanel(tab) {
        if (!userUploadPanel) return;

        userUploadPanel.hidden =
            false;

        const wallpaperActive =
            tab === "wallpaper";

        uploadWallpaperTab?.classList.toggle(
            "active",
            wallpaperActive
        );

        uploadVideoTab?.classList.toggle(
            "active",
            !wallpaperActive
        );

        if (wallpaperUploadForm) {
            wallpaperUploadForm.hidden =
                !wallpaperActive;
        }

        if (videoUploadForm) {
            videoUploadForm.hidden =
                wallpaperActive;
        }

        userUploadPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
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
                alert(
                    "Please log in first."
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

            if (
                !wallpaperCategory?.value.trim()
            ) {
                setMessage(
                    wallpaperUploadMessage,
                    "Please select a category.",
                    true
                );

                return;
            }

            const file =
                wallpaperFile?.files?.[0];

            if (!file) {
                setMessage(
                    wallpaperUploadMessage,
                    "Please select a wallpaper file.",
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
                    "Please confirm that you have the right to upload this wallpaper.",
                    true
                );

                return;
            }

            let uploaded = null;

            try {
                submitWallpaperUpload.disabled =
                    true;

                submitWallpaperUpload.textContent =
                    "Uploading...";

                setMessage(
                    wallpaperUploadMessage,
                    "Uploading wallpaper..."
                );

                uploaded =
                    await uploadToBucket(
                        "wallpapers",
                        file,
                        currentUser.id
                    );

                const {
                    error
                } = await supabase
                    .from("wallpapers")
                    .insert({
                        user_id:
                            currentUser.id,
                        title:
                            wallpaperTitle.value.trim(),
                        category:
                            wallpaperCategory.value.trim(),
                        tags:
                            wallpaperTags?.value.trim() ||
                            "",
                        image_url:
                            uploaded.url,
                        views: 0,
                        downloads: 0,
                        status:
                            "pending"
                    });

                if (error) {
                    await supabase
                        .storage
                        .from("wallpapers")
                        .remove([
                            uploaded.path
                        ]);

                    throw error;
                }

                wallpaperUploadForm.reset();

                setMessage(
                    wallpaperUploadMessage,
                    "✅ Uploaded! Your wallpaper is now waiting for admin review."
                );

                await loadMyUploads();
                await loadAccountStats();

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
                alert(
                    "Please log in first."
                );

                return;
            }

            if (
                !videoTitle?.value.trim()
            ) {
                setMessage(
                    videoUploadMessage,
                    "Please enter a video title.",
                    true
                );

                return;
            }

            if (
                !videoCategory?.value.trim()
            ) {
                setMessage(
                    videoUploadMessage,
                    "Please select a video category.",
                    true
                );

                return;
            }

            const file =
                videoFile?.files?.[0];

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
                    "Please confirm that you have the right to upload this video.",
                    true
                );

                return;
            }

            let uploadedVideo = null;
            let thumbnailPath = null;

            try {
                submitVideoUpload.disabled =
                    true;

                submitVideoUpload.textContent =
                    "Uploading...";

                setMessage(
                    videoUploadMessage,
                    "Uploading video..."
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
                    videoThumbnail?.files?.[0];

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

                const {
                    error
                } = await supabase
                    .from("videos")
                    .insert({
                        user_id:
                            currentUser.id,
                        title:
                            videoTitle.value.trim(),
                        category:
                            videoCategory.value.trim(),
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
                            "pending"
                    });

                if (error) {
                    await supabase
                        .storage
                        .from("videos")
                        .remove([
                            uploadedVideo.path
                        ]);

                    if (thumbnailPath) {
                        await supabase
                            .storage
                            .from("wallpapers")
                            .remove([
                                thumbnailPath
                            ]);
                    }

                    throw error;
                }

                videoUploadForm.reset();

                setMessage(
                    videoUploadMessage,
                    "✅ Uploaded! Your video is now waiting for admin review."
                );

                await loadMyUploads();
                await loadAccountStats();

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

        const [
            wallpaperResult,
            videoResult
        ] = await Promise.all([
            supabase
                .from("wallpapers")
                .select(
                    "id,created_at,title,category,image_url,status,user_id,views,downloads"
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                ),

            supabase
                .from("videos")
                .select(
                    "id,created_at,title,category,video_url,thumbnail_url,status,user_id,views,downloads"
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
        ]);

        if (wallpaperResult.error) {
            console.error(
                wallpaperResult.error
            );
        }

        if (videoResult.error) {
            console.error(
                videoResult.error
            );
        }

        const items = [
            ...(wallpaperResult.data || [])
                .map(item => ({
                    ...item,
                    mediaType:
                        "wallpaper"
                })),

            ...(videoResult.data || [])
                .map(item => ({
                    ...item,
                    mediaType:
                        "video"
                }))
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

        items.forEach(item => {
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
                    •
                    ${escapeHtml(
                        capitalize(
                            normalize(
                                item.status
                            )
                        )
                    )}
                    •
                    ${Number(
                        item.views || 0
                    )} views
                    •
                    ${Number(
                        item.downloads || 0
                    )} downloads
                </span>
            `;

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
                () => askDelete(item);

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
        });
    }

    /* =====================================================
       DELETE UPLOAD
       ===================================================== */

    function askDelete(item) {
        pendingDelete = item;

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
        pendingDelete = null;

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

                const {
                    error
                } = await supabase
                    .from(table)
                    .delete()
                    .eq(
                        "id",
                        item.id
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );

                if (error) {
                    throw error;
                }

                const path =
                    getStoragePath(
                        fileUrl,
                        bucket
                    );

                if (path) {
                    await supabase
                        .storage
                        .from(bucket)
                        .remove([
                            path
                        ]);
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
                        await supabase
                            .storage
                            .from(
                                "wallpapers"
                            )
                            .remove([
                                thumbPath
                            ]);
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
       BOTTOM NAVIGATION
       ===================================================== */

    navItems.forEach(item => {
        item.addEventListener(
            "click",
            () => {
                const target =
                    item.dataset.target;

                if (!target) return;

                navItems.forEach(
                    nav => {
                        nav.classList.toggle(
                            "active",
                            nav === item
                        );
                    }
                );

                scrollToSection(
                    target
                );
            }
        );
    });

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
            window.scrollY + 180;

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

        navItems.forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.target ===
                    activeTarget
            );
        });
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
       INITIALIZE
       ===================================================== */

    currentUser =
        await getSessionUser();

    await Promise.all([
        loadCategories(),
        loadWallpapers(),
        loadVideos()
    ]);

    await updateAuthUI();

    updateNavigation();

    console.log(
        `PIXORA initialized — ${wallpapers.length} wallpapers, ${videos.length} videos.`
    );
});
