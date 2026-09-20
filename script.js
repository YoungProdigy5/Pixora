/* =========================================================
   PIXORA — UNIFIED FRONTEND ENGINE
   Home: Wallpapers + Videos + Auth + Search
   Database-backed with Supabase
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
    const accountNavBtn = document.getElementById("accountNavBtn");

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

    /* Wallpaper modal */
    const previewModal = document.getElementById("previewModal");
    const modalBackdrop = previewModal?.querySelector(".modal-backdrop");
    const modalClose = document.getElementById("modalClose");
    const modalArt = document.getElementById("modalArt");
    const modalTitle = document.getElementById("modalTitle");
    const modalDetails = document.getElementById("modalDetails");
    const modalLike = document.getElementById("modalLike");
    const modalDownload = document.getElementById("modalDownload");

    /* Video modal */
    const videoPreviewModal = document.getElementById("videoPreviewModal");
    const videoModalBackdrop =
        videoPreviewModal?.querySelector(".modal-backdrop");
    const videoModalClose = document.getElementById("videoModalClose");
    const videoPlayer = document.getElementById("videoPlayer");
    const videoModalTitle = document.getElementById("videoModalTitle");
    const videoModalDetails = document.getElementById("videoModalDetails");
    const videoModalDownload = document.getElementById("videoModalDownload");

    const navItems = document.querySelectorAll(".bottom-nav [data-target]");

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

    let likes = {};

    try {
        likes = JSON.parse(localStorage.getItem("pixoraLikes") || "{}");
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
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function shuffle(array) {
        const copy = [...array];

        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }

        return copy;
    }

    function saveLikes() {
        localStorage.setItem("pixoraLikes", JSON.stringify(likes));
    }

    function wallpaperId(item) {
        return String(item?.id ?? "");
    }

    function imageUrl(item) {
        if (!item) return "";

        return (
            item.image_url ||
            item.image ||
            item.url ||
            item.file_url ||
            item.thumbnail_url ||
            ""
        );
    }

    function videoUrl(item) {
        if (!item) return "";

        return (
            item.video_url ||
            item.url ||
            item.file_url ||
            item.storage_url ||
            ""
        );
    }

    function fileSafeName(value) {
        return String(value || "pixora")
            .trim()
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .substring(0, 120);
    }

    function itemSearchText(item) {
        return normalize(
            [
                item?.title,
                item?.name,
                item?.category,
                item?.description,
                item?.keywords,
                item?.tags
            ]
                .filter(Boolean)
                .join(" ")
        );
    }

    function scrollToSection(id) {
        const section = document.getElementById(id);

        if (!section) return;

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /* =====================================================
       AUTH
       ===================================================== */

    async function getSessionUser() {
        try {
            const { data, error } = await supabase.auth.getUser();

            if (error) {
                console.warn("PIXORA auth:", error.message);
                return null;
            }

            return data?.user || null;
        } catch (error) {
            console.warn("PIXORA auth error:", error);
            return null;
        }
    }

    async function isAdmin(user) {
        if (!user) return false;

        try {
            const { data, error } = await supabase
                .from("pixora_admin_users")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) {
                console.warn("PIXORA admin check:", error.message);
                return false;
            }

            return !!data;
        } catch {
            return false;
        }
    }

    async function updateAuthUI() {
        currentUser = await getSessionUser();

        currentUserIsAdmin = await isAdmin(currentUser);

        if (authButton) {
            if (currentUser) {
                authButton.textContent = "Account";
                authButton.setAttribute("aria-label", "Open account");
            } else {
                authButton.textContent = "Login";
                authButton.setAttribute("aria-label", "Login or sign up");
            }
        }

        if (accountNavBtn) {
            accountNavBtn.hidden = false;
        }
    }

    /* =====================================================
       TOP AUTH BUTTON
       ===================================================== */

    authButton?.addEventListener("click", () => {
        if (currentUser) {
            window.location.href = "account.html";
        } else {
            window.location.href = "login.html";
        }
    });

    accountNavBtn?.addEventListener("click", () => {
        if (currentUser) {
            window.location.href = "account.html";
        } else {
            window.location.href = "login.html";
        }
    });

    /* =====================================================
       CATEGORIES
       ===================================================== */

    async function loadCategories() {
        if (!categoryList) return;

        try {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("name", { ascending: true });

            if (error) {
                console.error("PIXORA categories:", error.message);
                categories = [];
                renderCategories();
                return;
            }

            categories = data || [];
            renderCategories();
        } catch (error) {
            console.error("PIXORA category error:", error);
            categories = [];
            renderCategories();
        }
    }

    function renderCategories() {
        if (!categoryList) return;

        const allButton = `
            <button
                type="button"
                class="category-chip ${activeCategory === "all" ? "active" : ""}"
                data-category="all"
            >
                All
            </button>
        `;

        const categoryButtons = categories
            .map((category) => {
                const name = category?.name || "";

                return `
                    <button
                        type="button"
                        class="category-chip ${
                            normalize(activeCategory) === normalize(name)
                                ? "active"
                                : ""
                        }"
                        data-category="${escapeHtml(name)}"
                    >
                        ${escapeHtml(name)}
                    </button>
                `;
            })
            .join("");

        categoryList.innerHTML = allButton + categoryButtons;

        categoryList
            .querySelectorAll("[data-category]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    setCategory(button.dataset.category);
                });
            });
    }

    function setCategory(category) {
        activeCategory = category || "all";
        displayedLimit = INITIAL_LOAD;

        renderCategories();
        renderWallpapers();
        renderVideos();

        scrollToSection("new");
    }

    /* =====================================================
       WALLPAPERS
       ===================================================== */

    async function loadWallpapers() {
        try {
            const { data, error } = await supabase
                .from("wallpapers")
                .select("*")
                .eq("status", "approved")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("PIXORA wallpapers:", error.message);
                wallpapers = [];
                randomizedFeed = [];
                renderWallpapers();
                renderTrending();
                return;
            }

            wallpapers = data || [];
            randomizedFeed = shuffle(wallpapers);

            renderWallpapers();
            renderTrending();
        } catch (error) {
            console.error("PIXORA wallpaper error:", error);
            wallpapers = [];
            randomizedFeed = [];
            renderWallpapers();
            renderTrending();
        }
    }

    function wallpaperMatches(item) {
        const categoryMatch =
            activeCategory === "all" ||
            normalize(item?.category) === normalize(activeCategory);

        const searchMatch =
            !searchTerm || itemSearchText(item).includes(normalize(searchTerm));

        return categoryMatch && searchMatch;
    }

    function getFilteredWallpapers() {
        return wallpapers.filter(wallpaperMatches);
    }

    function renderWallpapers() {
        if (!wallpaperGrid) return;

        const filtered = getFilteredWallpapers();
        const visible = filtered.slice(0, displayedLimit);

        wallpaperGrid.innerHTML = visible
            .map(renderWallpaperCard)
            .join("");

        if (resultsCount) {
            resultsCount.textContent = `${filtered.length} ${
                filtered.length === 1 ? "wallpaper" : "wallpapers"
            }`;
        }

        if (emptyState) {
            emptyState.hidden = filtered.length !== 0;
        }

        if (loadMoreContainer) {
            loadMoreContainer.hidden =
                filtered.length <= displayedLimit;
        }

        attachWallpaperCardEvents();
    }

    function renderWallpaperCard(item) {
        const id = wallpaperId(item);
        const image = imageUrl(item);

        const title =
            item?.title ||
            item?.name ||
            "PIXORA Wallpaper";

        const category =
            item?.category ||
            "Wallpaper";

        const liked = !!likes[`wallpaper-${id}`];

        const views = Number(item?.views || 0);
        const downloads = Number(item?.downloads || 0);

        return `
            <article
                class="wallpaper-card"
                data-wallpaper-id="${escapeHtml(id)}"
                tabindex="0"
            >
                <div class="wallpaper-image-wrap">
                    ${
                        image
                            ? `
                                <img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(title)}"
                                    class="wallpaper-image"
                                    loading="lazy"
                                >
                            `
                            : `
                                <div class="wallpaper-image placeholder">
                                    PIXORA
                                </div>
                            `
                    }

                    <button
                        type="button"
                        class="card-like-btn ${liked ? "liked" : ""}"
                        data-like-wallpaper="${escapeHtml(id)}"
                        aria-label="${liked ? "Unlike" : "Like"} wallpaper"
                    >
                        ${liked ? "♥" : "♡"}
                    </button>

                    <div class="wallpaper-card-overlay">
                        <span>${escapeHtml(capitalize(category))}</span>
                    </div>
                </div>

                <div class="wallpaper-card-info">
                    <h3>${escapeHtml(title)}</h3>

                    <div class="wallpaper-card-meta">
                        <span>${views} views</span>
                        <span>${downloads} downloads</span>
                    </div>
                </div>
            </article>
        `;
    }

    function attachWallpaperCardEvents() {
        if (!wallpaperGrid) return;

        wallpaperGrid
            .querySelectorAll("[data-like-wallpaper]")
            .forEach((button) => {
                button.addEventListener("click", (event) => {
                    event.stopPropagation();

                    toggleLike(
                        `wallpaper-${button.dataset.likeWallpaper}`
                    );
                });
            });

        wallpaperGrid
            .querySelectorAll(".wallpaper-card")
            .forEach((card) => {
                const id = card.dataset.wallpaperId;

                card.addEventListener("click", () => {
                    const wallpaper = wallpapers.find(
                        (item) => wallpaperId(item) === id
                    );

                    if (wallpaper) {
                        openWallpaperPreview(wallpaper);
                    }
                });

                card.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();

                        const wallpaper = wallpapers.find(
                            (item) => wallpaperId(item) === id
                        );

                        if (wallpaper) {
                            openWallpaperPreview(wallpaper);
                        }
                    }
                });
            });
    }

    /* =====================================================
       TRENDING
       ===================================================== */

    function renderTrending() {
        if (!trendingGrid) return;

        const trending = [...wallpapers]
            .sort(
                (a, b) =>
                    Number(b?.views || 0) -
                    Number(a?.views || 0)
            )
            .slice(0, 6);

        trendingGrid.innerHTML = trending
            .map(renderWallpaperCard)
            .join("");

        trendingGrid
            .querySelectorAll("[data-like-wallpaper]")
            .forEach((button) => {
                button.addEventListener("click", (event) => {
                    event.stopPropagation();

                    toggleLike(
                        `wallpaper-${button.dataset.likeWallpaper}`
                    );
                });
            });

        trendingGrid
            .querySelectorAll(".wallpaper-card")
            .forEach((card) => {
                card.addEventListener("click", () => {
                    const wallpaper = wallpapers.find(
                        (item) =>
                            wallpaperId(item) ===
                            card.dataset.wallpaperId
                    );

                    if (wallpaper) {
                        openWallpaperPreview(wallpaper);
                    }
                });
            });
    }

    /* =====================================================
       LIKE SYSTEM
       ===================================================== */

    function toggleLike(key) {
        if (likes[key]) {
            delete likes[key];
        } else {
            likes[key] = true;
        }

        saveLikes();

        renderWallpapers();
        renderTrending();

        if (currentWallpaper) {
            updateWallpaperModalLike();
        }
    }

    function updateWallpaperModalLike() {
        if (!modalLike || !currentWallpaper) return;

        const key = `wallpaper-${wallpaperId(currentWallpaper)}`;
        const liked = !!likes[key];

        modalLike.classList.toggle("liked", liked);
        modalLike.setAttribute(
            "aria-label",
            liked ? "Unlike wallpaper" : "Like wallpaper"
        );

        modalLike.textContent = liked ? "♥" : "♡";
    }

    /* =====================================================
       WALLPAPER PREVIEW
       ===================================================== */

    function openWallpaperPreview(item) {
        if (!previewModal) return;

        currentWallpaper = item;

        const image = imageUrl(item);

        if (modalArt) {
            modalArt.src = image;
            modalArt.alt =
                item?.title ||
                item?.name ||
                "PIXORA Wallpaper";
        }

        if (modalTitle) {
            modalTitle.textContent =
                item?.title ||
                item?.name ||
                "PIXORA Wallpaper";
        }

        if (modalDetails) {
            modalDetails.innerHTML = `
                <span>${escapeHtml(
                    capitalize(item?.category || "Wallpaper")
                )}</span>
                <span>${Number(item?.views || 0)} views</span>
                <span>${Number(item?.downloads || 0)} downloads</span>
            `;
        }

        updateWallpaperModalLike();

        previewModal.hidden = false;
        body.classList.add("modal-open");

        incrementWallpaperView(item);
    }

    function closeWallpaperPreview() {
        if (!previewModal) return;

        previewModal.hidden = true;
        body.classList.remove("modal-open");

        currentWallpaper = null;
    }

    modalClose?.addEventListener("click", closeWallpaperPreview);
    modalBackdrop?.addEventListener("click", closeWallpaperPreview);

    modalLike?.addEventListener("click", () => {
        if (!currentWallpaper) return;

        toggleLike(`wallpaper-${wallpaperId(currentWallpaper)}`);
    });

    modalDownload?.addEventListener("click", () => {
        if (!currentWallpaper) return;

        downloadWallpaper(currentWallpaper);
    });

    async function incrementWallpaperView(item) {
        const id = wallpaperId(item);

        if (!id) return;

        try {
            await supabase.rpc("increment_wallpaper_view", {
                p_id: Number(id)
            });
        } catch (error) {
            console.warn(
                "PIXORA wallpaper view:",
                error?.message || error
            );
        }
    }

    async function incrementWallpaperDownload(item) {
        const id = wallpaperId(item);

        if (!id) return;

        try {
            await supabase.rpc("increment_wallpaper_download", {
                p_id: Number(id)
            });
        } catch (error) {
            console.warn(
                "PIXORA wallpaper download:",
                error?.message || error
            );
        }
    }

    async function downloadWallpaper(item) {
        const url = imageUrl(item);

        if (!url) return;

        const title =
            item?.title ||
            item?.name ||
            "pixora-wallpaper";

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Download failed");
            }

            const blob = await response.blob();

            const objectUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = objectUrl;
            link.download = `${fileSafeName(title)}.jpg`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(objectUrl);

            await incrementWallpaperDownload(item);
        } catch (error) {
            console.warn(
                "PIXORA download:",
                error?.message || error
            );

            window.open(url, "_blank", "noopener,noreferrer");
        }
    }

    /* =====================================================
       LOAD MORE
       ===================================================== */

    loadMoreBtn?.addEventListener("click", () => {
        displayedLimit += LOAD_MORE_AMOUNT;
        renderWallpapers();
    });

    /* =====================================================
       RESET FILTERS
       ===================================================== */

    resetFilters?.addEventListener("click", () => {
        activeCategory = "all";
        searchTerm = "";
        displayedLimit = INITIAL_LOAD;

        if (searchInput) {
            searchInput.value = "";
        }

        renderCategories();
        renderWallpapers();
        renderVideos();

        closeSearchPanel();
    });

    /* =====================================================
       RANDOM WALLPAPER
       ===================================================== */

    randomBtn?.addEventListener("click", () => {
        if (!wallpapers.length) return;

        const randomWallpaper =
            randomizedFeed[
                Math.floor(
                    Math.random() * randomizedFeed.length
                )
            ];

        if (randomWallpaper) {
            openWallpaperPreview(randomWallpaper);
        }
    });

    /* =====================================================
       EXPLORE BUTTON
       ===================================================== */

    exploreBtn?.addEventListener("click", () => {
        scrollToSection("new");
    });

    /* =====================================================
       HERO BUTTONS
       ===================================================== */

    document
        .querySelectorAll(".hero-slide button[data-scroll]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                const target = button.dataset.scroll;

                if (target) {
                    scrollToSection(target);
                }
            });
        });

    /* =====================================================
       TRENDING VIEW ALL
       ===================================================== */

    document
        .querySelectorAll("[data-category]")
        .forEach((element) => {
            if (
                element.closest("#categoryList") ||
                element === resetFilters
            ) {
                return;
            }

            element.addEventListener("click", () => {
                const category = element.dataset.category;

                if (category === "all") {
                    activeCategory = "all";
                    searchTerm = "";
                    displayedLimit = INITIAL_LOAD;

                    if (searchInput) {
                        searchInput.value = "";
                    }

                    renderCategories();
                    renderWallpapers();
                    renderVideos();

                    scrollToSection("new");
                }
            });
        });

    /* =====================================================
       VIDEOS
       ===================================================== */

    async function loadVideos() {
        if (!videoGrid) return;

        try {
            const { data, error } = await supabase
                .from("videos")
                .select("*")
                .eq("status", "approved")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("PIXORA videos:", error.message);
                videos = [];
                renderVideos();
                return;
            }

            videos = data || [];
            renderVideos();
        } catch (error) {
            console.error("PIXORA video error:", error);
            videos = [];
            renderVideos();
        }
    }

    function videoMatches(item) {
        const categoryMatch =
            activeCategory === "all" ||
            normalize(item?.category) === normalize(activeCategory);

        const searchMatch =
            !searchTerm || itemSearchText(item).includes(normalize(searchTerm));

        return categoryMatch && searchMatch;
    }

    function getFilteredVideos() {
        return videos.filter(videoMatches);
    }

    function renderVideos() {
        if (!videoGrid) return;

        const filtered = getFilteredVideos();

        videoGrid.innerHTML = filtered
            .map(renderVideoCard)
            .join("");

        if (videoResultsCount) {
            videoResultsCount.textContent = `${filtered.length} ${
                filtered.length === 1 ? "video" : "videos"
            }`;
        }

        if (videoEmptyState) {
            videoEmptyState.hidden = filtered.length !== 0;
        }

        attachVideoEvents();
    }

    function renderVideoCard(item) {
        const id = String(item?.id ?? "");

        const title =
            item?.title ||
            item?.name ||
            "PIXORA Video";

        const thumbnail =
            item?.thumbnail_url ||
            item?.thumbnail ||
            item?.image_url ||
            "";

        const category =
            item?.category ||
            "Video";

        const views = Number(item?.views || 0);
        const downloads = Number(item?.downloads || 0);

        return `
            <article
                class="video-card"
                data-video-id="${escapeHtml(id)}"
                tabindex="0"
            >
                <div class="video-thumbnail">
                    ${
                        thumbnail
                            ? `
                                <img
                                    src="${escapeHtml(thumbnail)}"
                                    alt="${escapeHtml(title)}"
                                    loading="lazy"
                                >
                            `
                            : `
                                <div class="video-placeholder">
                                    PIXORA
                                </div>
                            `
                    }

                    <span class="video-play-icon">▶</span>
                </div>

                <div class="video-card-info">
                    <h3>${escapeHtml(title)}</h3>

                    <div class="video-card-meta">
                        <span>${escapeHtml(
                            capitalize(category)
                        )}</span>
                        <span>${views} views</span>
                        <span>${downloads} downloads</span>
                    </div>
                </div>
            </article>
        `;
    }

    function attachVideoEvents() {
        videoGrid
            ?.querySelectorAll(".video-card")
            .forEach((card) => {
                const id = card.dataset.videoId;

                const open = () => {
                    const video = videos.find(
                        (item) => String(item?.id) === String(id)
                    );

                    if (video) {
                        openVideoPreview(video);
                    }
                };

                card.addEventListener("click", open);

                card.addEventListener("keydown", (event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        open();
                    }
                });
            });
    }

    function openVideoPreview(item) {
        if (!videoPreviewModal) return;

        currentVideo = item;

        const url = videoUrl(item);

        if (videoPlayer) {
            videoPlayer.src = url;
            videoPlayer.load();
        }

        if (videoModalTitle) {
            videoModalTitle.textContent =
                item?.title ||
                item?.name ||
                "PIXORA Video";
        }

        if (videoModalDetails) {
            videoModalDetails.innerHTML = `
                <span>${escapeHtml(
                    capitalize(item?.category || "Video")
                )}</span>
                <span>${Number(item?.views || 0)} views</span>
                <span>${Number(item?.downloads || 0)} downloads</span>
            `;
        }

        videoPreviewModal.hidden = false;
        body.classList.add("modal-open");

        incrementVideoView(item);
    }

    function closeVideoPreview() {
        if (!videoPreviewModal) return;

        videoPreviewModal.hidden = true;

        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.removeAttribute("src");
            videoPlayer.load();
        }

        body.classList.remove("modal-open");

        currentVideo = null;
    }

    videoModalClose?.addEventListener(
        "click",
        closeVideoPreview
    );

    videoModalBackdrop?.addEventListener(
        "click",
        closeVideoPreview
    );

    videoModalDownload?.addEventListener("click", () => {
        if (!currentVideo) return;

        downloadVideo(currentVideo);
    });

    async function incrementVideoView(item) {
        const id = String(item?.id ?? "");

        if (!id) return;

        try {
            await supabase.rpc("increment_video_view", {
                p_id: Number(id)
            });
        } catch (error) {
            console.warn(
                "PIXORA video view:",
                error?.message || error
            );
        }
    }

    async function incrementVideoDownload(item) {
        const id = String(item?.id ?? "");

        if (!id) return;

        try {
            await supabase.rpc("increment_video_download", {
                p_id: Number(id)
            });
        } catch (error) {
            console.warn(
                "PIXORA video download:",
                error?.message || error
            );
        }
    }

    async function downloadVideo(item) {
        const url = videoUrl(item);

        if (!url) return;

        const title =
            item?.title ||
            item?.name ||
            "pixora-video";

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Video download failed");
            }

            const blob = await response.blob();

            const objectUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = objectUrl;
            link.download = `${fileSafeName(title)}.mp4`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(objectUrl);

            await incrementVideoDownload(item);
        } catch (error) {
            console.warn(
                "PIXORA video download:",
                error?.message || error
            );

            window.open(url, "_blank", "noopener,noreferrer");
        }
    }

    /* =====================================================
       SEARCH
       ===================================================== */

    function openSearchPanel() {
        if (!searchPanel) return;

        searchPanel.hidden = false;
        searchPanel.classList.add("active");

        setTimeout(() => {
            searchInput?.focus();
        }, 50);

        renderSearchSuggestions();
    }

    function closeSearchPanel() {
        if (!searchPanel) return;

        searchPanel.classList.remove("active");
        searchPanel.hidden = true;
    }

    /*
       IMPORTANT:
       The search icon opens the search panel.
    */
    searchTrigger?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (
            searchPanel &&
            !searchPanel.hidden &&
            searchPanel.classList.contains("active")
        ) {
            searchInput?.focus();
        } else {
            openSearchPanel();
        }
    });

    /*
       Search form/button support.

       This catches:
       - Search icon inside the search bar
       - Any submit button
       - Enter on the keyboard
    */
    function performSearch() {
        const value = searchInput?.value?.trim() || "";

        searchTerm = value;
        displayedLimit = INITIAL_LOAD;

        renderWallpapers();
        renderVideos();

        if (value) {
            scrollToSection("new");
        }

        renderSearchSuggestions();
    }

    /*
       Search input itself.
       This also supports HTML forms if your search bar uses one.
    */
    searchInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();

            performSearch();
        }

        if (event.key === "Escape") {
            event.preventDefault();

            clearAndCloseSearch();
        }
    });

    /*
       Search as the user types.
       This keeps the existing live-search behavior.
    */
    searchInput?.addEventListener("input", () => {
        const value = searchInput.value.trim();

        if (!value) {
            searchTerm = "";

            displayedLimit = INITIAL_LOAD;

            renderWallpapers();
            renderVideos();
        }

        renderSearchSuggestions();
    });

    /*
       THIS IS THE IMPORTANT FIX FOR THE SEARCH ICON.

       It supports common search-button selectors without
       requiring a change to your current HTML.
    */
    const searchActionSelectors = [
        "#searchSubmit",
        "#searchButton",
        "#searchBtn",
        ".search-submit",
        ".search-submit-btn",
        ".search-action",
        "[data-search-submit]"
    ];

    searchActionSelectors.forEach((selector) => {
        document
            .querySelectorAll(selector)
            .forEach((button) => {
                button.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    performSearch();
                });
            });
    });

    /*
       If the search controls are inside a form,
       submit the search instead of reloading the page.
    */
    const searchForm =
        searchInput?.closest("form");

    searchForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();

        performSearch();
    });

    /*
       THIS FIXES THE CANCEL / X BUTTON.

       It supports the exact #clearSearch element from your HTML.
    */
    function clearAndCloseSearch() {
        searchTerm = "";
        displayedLimit = INITIAL_LOAD;

        if (searchInput) {
            searchInput.value = "";
        }

        renderWallpapers();
        renderVideos();

        closeSearchPanel();
    }

    clearSearch?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        clearAndCloseSearch();
    });

    /*
       Some CSS/HTML implementations use a button with
       data-search-clear instead of #clearSearch.
    */
    document
        .querySelectorAll("[data-search-clear]")
        .forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();

                clearAndCloseSearch();
            });
        });

    /* =====================================================
       SEARCH AUTOCOMPLETE / SUGGESTIONS
       ===================================================== */

    function getSearchTerms() {
        const values = new Set();

        wallpapers.forEach((item) => {
            [
                item?.title,
                item?.name,
                item?.category
            ].forEach((value) => {
                if (value) values.add(String(value));
            });

            if (Array.isArray(item?.tags)) {
                item.tags.forEach((tag) => {
                    if (tag) values.add(String(tag));
                });
            }

            if (Array.isArray(item?.keywords)) {
                item.keywords.forEach((keyword) => {
                    if (keyword) values.add(String(keyword));
                });
            }
        });

        videos.forEach((item) => {
            [
                item?.title,
                item?.name,
                item?.category
            ].forEach((value) => {
                if (value) values.add(String(value));
            });

            if (Array.isArray(item?.tags)) {
                item.tags.forEach((tag) => {
                    if (tag) values.add(String(tag));
                });
            }

            if (Array.isArray(item?.keywords)) {
                item.keywords.forEach((keyword) => {
                    if (keyword) values.add(String(keyword));
                });
            }
        });

        categories.forEach((category) => {
            if (category?.name) {
                values.add(String(category.name));
            }
        });

        return [...values].sort((a, b) =>
            a.localeCompare(b)
        );
    }

    function renderSearchSuggestions() {
        if (!searchPanel) return;

        const query = normalize(searchInput?.value || "");

        const oldSuggestions =
            searchPanel.querySelector(".pixora-search-suggestions");

        if (oldSuggestions) {
            oldSuggestions.remove();
        }

        if (!query) return;

        const suggestions = getSearchTerms()
            .filter((term) =>
                normalize(term).includes(query)
            )
            .slice(0, 8);

        if (!suggestions.length) return;

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "pixora-search-suggestions";

        suggestions.forEach((suggestion) => {
            const button =
                document.createElement("button");

            button.type = "button";
            button.textContent = suggestion;

            button.addEventListener("click", () => {
                if (searchInput) {
                    searchInput.value = suggestion;
                }

                searchTerm = suggestion;
                displayedLimit = INITIAL_LOAD;

                renderWallpapers();
                renderVideos();

                renderSearchSuggestions();

                scrollToSection("new");
            });

            wrapper.appendChild(button);
        });

        searchPanel.appendChild(wrapper);
    }

    /*
       Clicking outside the search panel closes it.
    */
    document.addEventListener("click", (event) => {
        if (!searchPanel || searchPanel.hidden) return;

        const clickedInsidePanel =
            searchPanel.contains(event.target);

        const clickedSearchTrigger =
            searchTrigger?.contains(event.target);

        if (
            !clickedInsidePanel &&
            !clickedSearchTrigger
        ) {
            closeSearchPanel();
        }
    });

    /* =====================================================
       THEME
       ===================================================== */

    function applyTheme(theme) {
        if (theme === "light") {
            body.classList.add("light-mode");
        } else {
            body.classList.remove("light-mode");
        }
    }

    const savedTheme =
        localStorage.getItem("pixoraTheme") || "dark";

    applyTheme(savedTheme);

    themeToggle?.addEventListener("click", () => {
        const light =
            body.classList.toggle("light-mode");

        const newTheme =
            light ? "light" : "dark";

        localStorage.setItem(
            "pixoraTheme",
            newTheme
        );
    });

    /* =====================================================
       BOTTOM NAVIGATION
       ===================================================== */

    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            const target = item.dataset.target;

            if (!target) return;

            if (target === "account") {
                if (currentUser) {
                    window.location.href =
                        "account.html";
                } else {
                    window.location.href =
                        "login.html";
                }

                return;
            }

            scrollToSection(target);
        });
    });

    const navigationSections = [
        "home",
        "trending",
        "new",
        "videos",
        "categories"
    ];

    function updateActiveNav() {
        let currentSection = "home";

        const scrollPosition =
            window.scrollY + 180;

        navigationSections.forEach((id) => {
            const section =
                document.getElementById(id);

            if (!section) return;

            if (
                section.offsetTop <=
                scrollPosition
            ) {
                currentSection = id;
            }
        });

        navItems.forEach((item) => {
            item.classList.toggle(
                "active",
                item.dataset.target === currentSection
            );
        });
    }

    window.addEventListener(
        "scroll",
        updateActiveNav,
        { passive: true }
    );

    updateActiveNav();

    /* =====================================================
       KEYBOARD ESCAPE
       ===================================================== */

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        closeWallpaperPreview();
        closeVideoPreview();
        clearAndCloseSearch();
    });

    /* =====================================================
       SUPABASE AUTH STATE
       ===================================================== */

    supabase.auth.onAuthStateChange(
        async () => {
            currentUser = await getSessionUser();

            currentUserIsAdmin =
                await isAdmin(currentUser);

            updateAuthUI();
        }
    );

    /* =====================================================
       HERO SLIDER
       ===================================================== */

    const heroSlides =
        document.querySelectorAll(".hero-slide");

    const heroDots =
        document.querySelectorAll(".hero-dot");

    if (heroSlides.length) {
        let currentHeroSlide = 0;
        let heroTimer;

        function showHeroSlide(index) {
            if (index >= heroSlides.length) {
                index = 0;
            }

            if (index < 0) {
                index = heroSlides.length - 1;
            }

            heroSlides.forEach((slide, i) => {
                slide.classList.toggle(
                    "active",
                    i === index
                );
            });

            heroDots.forEach((dot, i) => {
                dot.classList.toggle(
                    "active",
                    i === index
                );
            });

            currentHeroSlide = index;
        }

        function nextHeroSlide() {
            showHeroSlide(
                currentHeroSlide + 1
            );
        }

        function startHeroSlider() {
            clearInterval(heroTimer);

            heroTimer = setInterval(
                nextHeroSlide,
                5000
            );
        }

        heroDots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                showHeroSlide(index);
                startHeroSlider();
            });
        });

        showHeroSlide(0);
        startHeroSlider();
    }

    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    try {
        currentUser = await getSessionUser();
        currentUserIsAdmin =
            await isAdmin(currentUser);

        await Promise.all([
            loadCategories(),
            loadWallpapers(),
            loadVideos()
        ]);

        await updateAuthUI();

        updateActiveNav();

        console.log("PIXORA loaded successfully.");
    } catch (error) {
        console.error(
            "PIXORA initialization error:",
            error
        );
    }
});
