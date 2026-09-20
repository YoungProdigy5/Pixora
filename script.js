/* =========================================================
   PIXORA — FRONTEND ENGINE
   Wallpapers + Videos + Auth + Live Search
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

    const $ = id => document.getElementById(id);

    const body = document.body;
    const themeToggle = $("themeToggle");
    const searchTrigger = $("searchTrigger");
    const searchPanel = $("searchPanel");
    const searchInput = $("searchInput");
    const clearSearch = $("clearSearch");
    const authButton = $("authButton");
    const accountNavBtn = $("accountNavBtn");

    const categoryList = $("categoryList");
    const trendingGrid = $("trendingGrid");
    const wallpaperGrid = $("wallpaperGrid");
    const videoGrid = $("videoGrid");
    const resultsCount = $("resultsCount");
    const videoResultsCount = $("videoResultsCount");
    const emptyState = $("emptyState");
    const videoEmptyState = $("videoEmptyState");
    const loadMoreBtn = $("loadMoreBtn");
    const loadMoreContainer = $("loadMoreContainer");
    const resetFilters = $("resetFilters");
    const randomBtn = $("randomBtn");
    const exploreBtn = $("exploreBtn");

    const previewModal = $("previewModal");
    const modalClose = $("modalClose");
    const modalArt = $("modalArt");
    const modalTitle = $("modalTitle");
    const modalDetails = $("modalDetails");
    const modalLike = $("modalLike");
    const modalDownload = $("modalDownload");

    const videoPreviewModal = $("videoPreviewModal");
    const videoModalClose = $("videoModalClose");
    const videoPlayer = $("videoPlayer");
    const videoModalTitle = $("videoModalTitle");
    const videoModalDetails = $("videoModalDetails");
    const videoModalDownload = $("videoModalDownload");

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
    let currentUserIsAdmin = false;
    let currentWallpaper = null;
    let currentVideo = null;

    let likes = {};

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
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
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
        try {
            localStorage.setItem("pixoraLikes", JSON.stringify(likes));
        } catch {
            /* storage unavailable */
        }
    }

    function wallpaperId(item) {
        return item.id != null ? String(item.id) : normalize(item.title);
    }

    function imageUrl(item) {
        return String(item.image_url || item.image || "").trim();
    }

    function tagsText(item) {
        return Array.isArray(item.tags) ? item.tags.join(", ") : item.tags || "";
    }

    function itemSearchText(item) {
        return [
            item.title,
            item.category,
            item.tags,
            item.description,
            Array.isArray(item.keywords) ? item.keywords.join(" ") : item.keywords
        ]
            .join(" ")
            .toLowerCase();
    }

    function scrollToSection(id) {
        const section = $(id);

        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /* Download a file from any URL (cross-origin safe) */
    async function saveFile(url, baseName, fallbackExtension) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Download failed (" + response.status + ")");
            }

            const blob = await response.blob();

            const extension =
                (blob.type.split("/")[1] || fallbackExtension)
                    .replace("jpeg", "jpg")
                    .replace("quicktime", "mov");

            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileSafeName(baseName) + "." + extension;

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        } catch (error) {
            console.error("PIXORA download:", error);
            window.open(url, "_blank", "noopener");
        }
    }

    /* =====================================================
       AUTH
       ===================================================== */

    async function getSessionUser() {
        try {
            const { data } = await supabase.auth.getSession();
            return data?.session?.user || null;
        } catch {
            return null;
        }
    }

    async function isAdmin(user) {
        if (!user) return false;

        const { data, error } = await supabase
            .from("pixora_admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            console.error("PIXORA admin check:", error);
            return false;
        }

        return !!data;
    }

    async function updateAuthUI() {
        currentUser = await getSessionUser();
        currentUserIsAdmin = await isAdmin(currentUser);

        if (authButton) {
            authButton.textContent = currentUser ? "Account" : "Login / Sign Up";
        }

        if (accountNavBtn) {
            accountNavBtn.hidden = !currentUser;
        }
    }

    authButton?.addEventListener("click", () => {
        window.location.href = currentUser ? "account.html" : "login.html";
    });

    accountNavBtn?.addEventListener("click", () => {
        window.location.href = currentUser ? "account.html" : "login.html";
    });

    /* =====================================================
       CATEGORIES
       ===================================================== */

    async function loadCategories() {
        if (!categoryList) return;

        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            console.error("PIXORA categories:", error);
            categories = [];
        } else {
            categories = data || [];
        }

        renderCategories();
    }

    function renderCategories() {
        if (!categoryList) return;

        categoryList.innerHTML = "";

        const allButton = document.createElement("button");
        allButton.type = "button";
        allButton.className = "category-btn active";
        allButton.dataset.category = "all";
        allButton.textContent = "All";
        allButton.addEventListener("click", () => setCategory("all"));
        categoryList.appendChild(allButton);

        categories.forEach(category => {
            const name = category.name || category.title || category.category;

            if (!name) return;

            const button = document.createElement("button");
            button.type = "button";
            button.className = "category-btn";
            button.dataset.category = normalize(name);
            button.textContent = capitalize(name);
            button.addEventListener("click", () => setCategory(name));
            categoryList.appendChild(button);
        });
    }

    function markActiveCategory() {
        document.querySelectorAll(".category-btn").forEach(button => {
            button.classList.toggle(
                "active",
                normalize(button.dataset.category) === activeCategory
            );
        });
    }

    function setCategory(category) {
        activeCategory = normalize(category) || "all";
        displayedLimit = INITIAL_LOAD;

        markActiveCategory();
        renderWallpapers();
        renderVideos();
    }

    /* =====================================================
       WALLPAPERS
       ===================================================== */

    async function loadWallpapers() {
        if (!wallpaperGrid) return;

        const { data, error } = await supabase
            .from("wallpapers")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("PIXORA wallpapers:", error);
            wallpapers = [];
        } else {
            wallpapers = data || [];
        }

        randomizedFeed = shuffle(wallpapers);

        renderWallpapers();
        renderTrending();
        refreshSearchSuggestions();
    }

    function matchesFilters(item) {
        const categoryMatch =
            activeCategory === "all" ||
            normalize(item.category) === activeCategory;

        const searchMatch =
            !searchTerm || itemSearchText(item).includes(searchTerm);

        return categoryMatch && searchMatch;
    }

    function filteredWallpapers() {
        return wallpapers.filter(matchesFilters);
    }

    function renderWallpapers() {
        if (!wallpaperGrid) return;

        const filtered = filteredWallpapers();
        const visible = filtered.slice(0, displayedLimit);

        wallpaperGrid.innerHTML = "";

        visible.forEach(item => {
            wallpaperGrid.appendChild(createWallpaperCard(item));
        });

        if (resultsCount) {
            resultsCount.textContent =
                filtered.length + (filtered.length === 1 ? " wallpaper" : " wallpapers");
        }

        if (emptyState) {
            emptyState.hidden = filtered.length !== 0;
        }

        if (loadMoreContainer) {
            loadMoreContainer.hidden = filtered.length <= displayedLimit;
        }
    }

    function makeButton(className, label, text) {
        const button = document.createElement("button");
        button.className = className;
        button.type = "button";
        button.setAttribute("aria-label", label);
        button.title = label;
        button.textContent = text;
        return button;
    }

    function setLikeAppearance(button, liked) {
        button.classList.toggle("liked", liked);
        button.textContent = liked ? "♥" : "♡";
        button.setAttribute("aria-label", liked ? "Unlike wallpaper" : "Like wallpaper");
        button.title = liked ? "Unlike" : "Like";
    }

    function createWallpaperCard(item) {
        const id = wallpaperId(item);
        const url = imageUrl(item);

        const card = document.createElement("article");
        card.className = "wallpaper-card";
        card.dataset.id = id;

        const art = document.createElement("div");
        art.className = "wallpaper-art";

        if (url) {
            const image = document.createElement("img");
            image.className = "wallpaper-image";
            image.src = url;
            image.alt = item.title || "PIXORA wallpaper";
            image.loading = "lazy";
            image.onerror = () => {
                image.style.display = "none";
            };
            art.appendChild(image);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "art-placeholder";
            placeholder.textContent = "🖼️";
            art.appendChild(placeholder);
        }

        const likeButton = makeButton("like-btn", "Like wallpaper", "♡");
        setLikeAppearance(likeButton, !!likes[id]);

        const previewButton = makeButton("preview-btn", "Preview wallpaper", "👁");
        const downloadButton = makeButton("download-btn", "Download wallpaper", "↓");

        art.appendChild(likeButton);
        art.appendChild(previewButton);
        art.appendChild(downloadButton);

        const info = document.createElement("div");
        info.className = "wallpaper-info";

        const title = document.createElement("h3");
        title.textContent = item.title || "Untitled Wallpaper";

        const category = document.createElement("p");
        category.textContent = item.category || "Wallpaper";

        info.appendChild(title);
        info.appendChild(category);

        card.appendChild(art);
        card.appendChild(info);

        likeButton.addEventListener("click", event => {
            event.stopPropagation();

            if (likes[id]) {
                delete likes[id];
            } else {
                likes[id] = true;
            }

            saveLikes();
            setLikeAppearance(likeButton, !!likes[id]);

            if (currentWallpaper && wallpaperId(currentWallpaper) === id) {
                updateModalLikeState();
            }
        });

        previewButton.addEventListener("click", event => {
            event.stopPropagation();
            openWallpaperPreview(item);
        });

        downloadButton.addEventListener("click", event => {
            event.stopPropagation();
            downloadWallpaper(item);
        });

        card.addEventListener("click", event => {
            if (event.target.closest("button")) return;
            openWallpaperPreview(item);
        });

        return card;
    }

    /* =====================================================
       TRENDING
       ===================================================== */

    function renderTrending() {
        if (!trendingGrid) return;

        const trending = [...wallpapers]
            .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
            .slice(0, 6);

        trendingGrid.innerHTML = "";

        trending.forEach(item => {
            trendingGrid.appendChild(createWallpaperCard(item));
        });
    }

    /* =====================================================
       WALLPAPER PREVIEW
       ===================================================== */

    function openWallpaperPreview(item) {
        if (!previewModal) return;

        currentWallpaper = item;

        const url = imageUrl(item);

        if (modalArt) {
            modalArt.innerHTML = "";

            if (url) {
                const image = document.createElement("img");
                image.src = url;
                image.alt = item.title || "PIXORA wallpaper";
                modalArt.appendChild(image);
            } else {
                const placeholder = document.createElement("div");
                placeholder.className = "art-placeholder";
                placeholder.textContent = "🖼️";
                modalArt.appendChild(placeholder);
            }
        }

        if (modalTitle) {
            modalTitle.textContent = item.title || "Untitled Wallpaper";
        }

        if (modalDetails) {
            modalDetails.textContent = [item.category || "Wallpaper", tagsText(item)]
                .filter(Boolean)
                .join(" • ");
        }

        updateModalLikeState();

        previewModal.classList.add("active");
        previewModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        incrementWallpaperView(item);
    }

    function closeWallpaperPreview() {
        if (!previewModal) return;

        previewModal.classList.remove("active");
        previewModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");

        currentWallpaper = null;
    }

    function updateModalLikeState() {
        if (!modalLike || !currentWallpaper) return;

        const liked = !!likes[wallpaperId(currentWallpaper)];

        modalLike.textContent = liked ? "♥ Liked" : "♡ Like";
        modalLike.classList.toggle("liked", liked);
    }

    modalClose?.addEventListener("click", closeWallpaperPreview);

    /* Clicking the dark area behind either modal closes it */
    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
        backdrop.addEventListener("click", () => {
            closeWallpaperPreview();
            closeVideoPreview();
        });
    });

    modalLike?.addEventListener("click", () => {
        if (!currentWallpaper) return;

        const id = wallpaperId(currentWallpaper);

        if (likes[id]) {
            delete likes[id];
        } else {
            likes[id] = true;
        }

        saveLikes();
        updateModalLikeState();
        renderWallpapers();
        renderTrending();
    });

    modalDownload?.addEventListener("click", () => {
        if (currentWallpaper) {
            downloadWallpaper(currentWallpaper);
        }
    });

    /* =====================================================
       WALLPAPER VIEWS + DOWNLOADS
       ===================================================== */

    async function incrementWallpaperView(item) {
        if (!item?.id) return;

        try {
            await supabase.rpc("increment_wallpaper_view", { p_id: item.id });
        } catch (error) {
            console.error("PIXORA wallpaper view:", error);
        }
    }

    async function downloadWallpaper(item) {
        const url = imageUrl(item);

        if (!url) {
            alert("This wallpaper is not available for download.");
            return;
        }

        if (item?.id) {
            try {
                await supabase.rpc("increment_wallpaper_download", { p_id: item.id });
            } catch (error) {
                console.error("PIXORA wallpaper download:", error);
            }
        }

        await saveFile(url, item.title || "PIXORA-wallpaper", "jpg");
    }

    /* =====================================================
       LOAD MORE
       ===================================================== */

    loadMoreBtn?.addEventListener("click", () => {
        displayedLimit += LOAD_MORE_AMOUNT;
        renderWallpapers();
    });

    /* =====================================================
       LIVE SEARCH AUTOCOMPLETE
       ===================================================== */

    let searchSuggestionsBox = null;

    function ensureSearchSuggestionsBox() {
        if (searchSuggestionsBox && document.body.contains(searchSuggestionsBox)) {
            return searchSuggestionsBox;
        }

        if (!searchInput) return null;

        const parent = searchInput.parentElement;

        if (!parent) return null;

        searchSuggestionsBox = document.createElement("div");
        searchSuggestionsBox.id = "pixoraSearchSuggestions";
        searchSuggestionsBox.style.display = "none";

        if (window.getComputedStyle(parent).position === "static") {
            parent.style.position = "relative";
        }

        parent.appendChild(searchSuggestionsBox);

        return searchSuggestionsBox;
    }

    function hideSuggestions() {
        if (searchSuggestionsBox) {
            searchSuggestionsBox.style.display = "none";
        }
    }

    function getSearchSuggestionValues() {
        const values = [];
        const seen = new Set();

        function addValue(value) {
            const text = String(value || "").trim();
            const key = normalize(text);

            if (!text || seen.has(key)) return;

            seen.add(key);
            values.push(text);
        }

        [...wallpapers, ...videos].forEach(item => {
            addValue(item.title);
            addValue(item.category);

            if (Array.isArray(item.keywords)) {
                item.keywords.forEach(addValue);
            }

            String(item.tags || "").split(",").forEach(addValue);
        });

        categories.forEach(category => addValue(category.name));

        return values;
    }

    function applySearch(value) {
        searchTerm = normalize(value);
        displayedLimit = INITIAL_LOAD;

        renderWallpapers();
        renderVideos();
    }

    function renderSearchSuggestions() {
        if (!searchInput) return;

        const box = ensureSearchSuggestionsBox();

        if (!box) return;

        const query = normalize(searchInput.value);

        box.innerHTML = "";

        if (!query) {
            box.style.display = "none";
            return;
        }

        const suggestions = getSearchSuggestionValues()
            .filter(value => normalize(value).includes(query))
            .sort((a, b) => {
                const aStarts = normalize(a).startsWith(query);
                const bStarts = normalize(b).startsWith(query);

                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                return a.localeCompare(b);
            })
            .slice(0, 8);

        if (!suggestions.length) {
            box.style.display = "none";
            return;
        }

        suggestions.forEach(value => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "🔎 " + value;

            button.addEventListener("click", () => {
                searchInput.value = value;
                applySearch(value);
                hideSuggestions();
                closeSearch();

                wallpaperGrid?.scrollIntoView({ behavior: "smooth", block: "start" });
            });

            box.appendChild(button);
        });

        box.style.display = "block";
    }

    function refreshSearchSuggestions() {
        if (searchInput && normalize(searchInput.value)) {
            renderSearchSuggestions();
        }
    }

    /* =====================================================
       SEARCH PANEL
       ===================================================== */

    function openSearch() {
        if (!searchPanel) return;

        searchPanel.hidden = false;
        searchPanel.classList.add("active");

        setTimeout(() => {
            searchInput?.focus();
            renderSearchSuggestions();
        }, 100);
    }

    function closeSearch() {
        if (!searchPanel) return;

        searchPanel.classList.remove("active");
        searchPanel.hidden = true;

        hideSuggestions();
    }

    function performSearch() {
        const query = normalize(searchInput?.value || "");

        applySearch(query);
        hideSuggestions();

        if (query) {
            closeSearch();
            wallpaperGrid?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    searchTrigger?.addEventListener("click", () => {
        if (searchPanel?.classList.contains("active")) {
            performSearch();
        } else {
            openSearch();
        }
    });

    searchInput?.addEventListener("input", () => {
        applySearch(searchInput.value);
        renderSearchSuggestions();
    });

    searchInput?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            performSearch();
        }

        if (event.key === "Escape") {
            closeSearch();
        }
    });

    clearSearch?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";

        applySearch("");
        hideSuggestions();

        searchInput?.focus();
    });

    document.addEventListener("click", event => {
        if (!searchSuggestionsBox || !searchInput) return;

        if (
            !searchSuggestionsBox.contains(event.target) &&
            event.target !== searchInput
        ) {
            hideSuggestions();
        }
    });

    /* =====================================================
       FILTER RESET
       ===================================================== */

    resetFilters?.addEventListener("click", () => {
        activeCategory = "all";
        searchTerm = "";
        displayedLimit = INITIAL_LOAD;

        if (searchInput) searchInput.value = "";

        markActiveCategory();
        hideSuggestions();
        renderWallpapers();
        renderVideos();
    });

    /* =====================================================
       RANDOM WALLPAPER
       ===================================================== */

    randomBtn?.addEventListener("click", () => {
        if (!randomizedFeed.length) {
            randomizedFeed = shuffle(wallpapers);
        }

        const item = randomizedFeed.shift();

        if (item) {
            openWallpaperPreview(item);
        }

        if (!randomizedFeed.length) {
            randomizedFeed = shuffle(wallpapers);
        }
    });

    exploreBtn?.addEventListener("click", () => scrollToSection("new"));

    document.querySelectorAll("[data-scroll]").forEach(button => {
        button.addEventListener("click", () => scrollToSection(button.dataset.scroll));
    });

    document.querySelectorAll(".text-btn[data-category]").forEach(button => {
        button.addEventListener("click", () => {
            setCategory(button.dataset.category);
            scrollToSection("new");
        });
    });

    /* =====================================================
       VIDEOS
       ===================================================== */

    async function loadVideos() {
        if (!videoGrid) return;

        const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("PIXORA videos:", error);
            videos = [];
        } else {
            videos = data || [];
        }

        renderVideos();
        refreshSearchSuggestions();
    }

    function filteredVideos() {
        return videos.filter(matchesFilters);
    }

    function renderVideos() {
        if (!videoGrid) return;

        const filtered = filteredVideos();

        videoGrid.innerHTML = "";

        filtered.forEach(item => {
            videoGrid.appendChild(createVideoCard(item));
        });

        if (videoResultsCount) {
            videoResultsCount.textContent =
                filtered.length + (filtered.length === 1 ? " video" : " videos");
        }

        if (videoEmptyState) {
            videoEmptyState.hidden = filtered.length !== 0;
        }
    }

    function createVideoCard(item) {
        const card = document.createElement("article");
        card.className = "video-card";

        const thumbnail = item.thumbnail_url;

        card.innerHTML = `
            <div class="video-card-media">
                ${
                    thumbnail
                        ? `<img src="${escapeHtml(thumbnail)}"
                                alt="${escapeHtml(item.title || "PIXORA video")}"
                                loading="lazy">`
                        : `<div class="video-placeholder">🎬</div>`
                }
                <div class="video-play-icon">▶</div>
            </div>

            <div class="video-card-info">
                <h3>${escapeHtml(item.title || "Untitled Video")}</h3>
                <p>${escapeHtml(item.category || "Video")}</p>
            </div>
        `;

        card.addEventListener("click", () => openVideoPreview(item));

        return card;
    }

    /* =====================================================
       VIDEO PREVIEW
       ===================================================== */

    function openVideoPreview(item) {
        if (!videoPreviewModal) return;

        currentVideo = item;

        if (videoModalTitle) {
            videoModalTitle.textContent = item.title || "Untitled Video";
        }

        if (videoModalDetails) {
            videoModalDetails.textContent = [item.category || "Video", tagsText(item)]
                .filter(Boolean)
                .join(" • ");
        }

        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.src = item.video_url || "";
            videoPlayer.load();
        }

        videoPreviewModal.classList.add("active");
        videoPreviewModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        incrementVideoView(item);
    }

    function closeVideoPreview() {
        if (!videoPreviewModal) return;

        videoPreviewModal.classList.remove("active");
        videoPreviewModal.setAttribute("aria-hidden", "true");

        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.removeAttribute("src");
            videoPlayer.load();
        }

        document.body.classList.remove("modal-open");

        currentVideo = null;
    }

    videoModalClose?.addEventListener("click", closeVideoPreview);

    videoModalDownload?.addEventListener("click", () => {
        if (currentVideo) {
            downloadVideo(currentVideo);
        }
    });

    async function incrementVideoView(item) {
        if (!item?.id) return;

        try {
            await supabase.rpc("increment_video_view", { p_id: item.id });
        } catch (error) {
            console.error("PIXORA video view:", error);
        }
    }

    async function downloadVideo(item) {
        const url = String(item.video_url || "").trim();

        if (!url) {
            alert("This video is not available for download.");
            return;
        }

        if (item?.id) {
            try {
                await supabase.rpc("increment_video_download", { p_id: item.id });
            } catch (error) {
                console.error("PIXORA video download:", error);
            }
        }

        await saveFile(url, item.title || "PIXORA-video", "mp4");
    }

    /* =====================================================
       THEME
       ===================================================== */

    function applyTheme(theme) {
        const light = theme === "light";

        body.classList.toggle("light-mode", light);

        try {
            localStorage.setItem("pixoraTheme", theme);
        } catch {
            /* storage unavailable */
        }

        themeToggle?.setAttribute("aria-pressed", light ? "true" : "false");
    }

    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem("pixoraTheme");
    } catch {
        savedTheme = null;
    }

    if (savedTheme) {
        applyTheme(savedTheme);
    }

    themeToggle?.addEventListener("click", () => {
        applyTheme(body.classList.contains("light-mode") ? "dark" : "light");
    });

    /* =====================================================
       BOTTOM NAVIGATION
       ===================================================== */

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.dataset.target;

            if (!target) return;

            if (target === "account") {
                window.location.href = currentUser ? "account.html" : "login.html";
                return;
            }

            navItems.forEach(nav => {
                nav.classList.toggle("active", nav === item);
            });

            scrollToSection(target);
        });
    });

    const navigationSections = ["home", "trending", "new", "videos", "categories"];

    function updateNavigation() {
        const scrollPosition = window.scrollY + 180;

        let activeTarget = "home";

        navigationSections.forEach(id => {
            const section = $(id);

            if (section && !section.hidden && section.offsetTop <= scrollPosition) {
                activeTarget = id;
            }
        });

        navItems.forEach(item => {
            item.classList.toggle("active", item.dataset.target === activeTarget);
        });
    }

    window.addEventListener("scroll", updateNavigation, { passive: true });

    /* =====================================================
       KEYBOARD
       ===================================================== */

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeWallpaperPreview();
            closeVideoPreview();
            closeSearch();
        }
    });

    /* =====================================================
       AUTH STATE CHANGES
       (never await Supabase calls directly inside this callback)
       ===================================================== */

    supabase.auth.onAuthStateChange(() => {
        setTimeout(updateAuthUI, 0);
    });

    /* =====================================================
       INITIALIZE
       ===================================================== */

    await Promise.all([
        loadCategories(),
        loadWallpapers(),
        loadVideos(),
        updateAuthUI()
    ]);

    updateNavigation();

    console.log(
        `PIXORA initialized — ${wallpapers.length} wallpapers, ${videos.length} videos, admin: ${currentUserIsAdmin}.`
    );
});


/* =========================================================
   PIXORA HERO SLIDER
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const heroSlides = document.querySelectorAll(".hero-slide");
    const heroDots = document.querySelectorAll(".hero-dot");

    if (!heroSlides.length) return;

    let currentHeroSlide = 0;
    let heroTimer;

    function showHeroSlide(index) {
        if (index >= heroSlides.length) index = 0;
        if (index < 0) index = heroSlides.length - 1;

        heroSlides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });

        heroDots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
        });

        currentHeroSlide = index;
    }

    function startHeroSlider() {
        clearInterval(heroTimer);

        heroTimer = setInterval(() => {
            showHeroSlide(currentHeroSlide + 1);
        }, 5000);
    }

    heroDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            showHeroSlide(index);
            startHeroSlider();
        });
    });

    showHeroSlide(0);
    startHeroSlider();
});
