// =========================================================
// PIXORA — SUPABASE CONNECTION
// =========================================================

const SUPABASE_URL = hlldyvzgvblxmnygldqd
const SUPABASE_PUBLISHABLE_KEY = sb_publishable_mg6WiPQq2BTk_2YTdJkaJA_f4zQwPF-

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
   );
/* =========================================================
   PIXORA — SCALABLE WALLPAPER ENGINE
   Supports 50 wallpapers per category now
   and can scale to 200+ later.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

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

    const categoryButtons =
        document.querySelectorAll(".category-btn");

    const wallpaperGrid =
        document.getElementById("wallpaperGrid");

    const resultsCount =
        document.getElementById("resultsCount");

    const emptyState =
        document.getElementById("emptyState");

    const resetFilters =
        document.getElementById("resetFilters");

    const randomBtn =
        document.getElementById("randomBtn");

    const exploreBtn =
        document.getElementById("exploreBtn");

    const loadMoreBtn =
        document.getElementById("loadMoreBtn");

    const loadMoreContainer =
        document.getElementById("loadMoreContainer");

    const navItems =
        document.querySelectorAll(".nav-item");


    /* =====================================================
       MODAL ELEMENTS
    ===================================================== */

    const previewModal =
        document.getElementById("previewModal");

    const modalBackdrop =
        document.querySelector(".modal-backdrop");

    const modalClose =
        document.getElementById("modalClose");

    const modalArt =
        document.getElementById("modalArt");

    const modalTitle =
        document.getElementById("modalTitle");

    const modalDetails =
        document.getElementById("modalDetails");

    const modalLike =
        document.getElementById("modalLike");

    const modalDownload =
        document.getElementById("modalDownload");


    /* =====================================================
       WALLPAPER DATABASE
    ===================================================== */

    /*
     * wallpaperData comes from wallpaper-data.js.
     *
     * Example:
     *
     * {
     *   id: "anime-001",
     *   title: "Okarun Dandadan",
     *   category: "anime",
     *   image: "wallpapers/...",
     *   keywords: ["anime", "okarun", "dandadan"]
     * }
     */

    const wallpapers =
        Array.isArray(window.pixoraWallpapers)
            ? window.pixoraWallpapers
            : [];


    /* =====================================================
       SETTINGS
    ===================================================== */

    const INITIAL_LOAD = 12;

    const LOAD_MORE_AMOUNT = 12;


    /* =====================================================
       STATE
    ===================================================== */

    let activeCategory = "all";

    let searchTerm = "";

    let displayedLimit = INITIAL_LOAD;

    let currentCard = null;

    let currentWallpaper = null;

    let currentSlide = 0;

    let heroTimer = null;


    /* =====================================================
       LIKES
    ===================================================== */

    let likes = {};

    try {

        likes =
            JSON.parse(
                localStorage.getItem("pixoraLikes")
            ) || {};

    } catch {

        likes = {};

    }


    function saveLikes() {

        localStorage.setItem(
            "pixoraLikes",
            JSON.stringify(likes)
        );

    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function normalize(value) {

        return String(value || "")
            .trim()
            .toLowerCase();

    }


    function getWallpaperId(wallpaper) {

        return (
            wallpaper.id ||
            normalize(wallpaper.title)
                .replace(/[^a-z0-9]+/g, "-")
        );

    }


    function getWallpaperTitle(wallpaper) {

        return (
            wallpaper.title ||
            "PIXORA Wallpaper"
        );

    }


    function getWallpaperCategory(wallpaper) {

        return normalize(
            wallpaper.category
        );

    }


    function getWallpaperImage(wallpaper) {

        return (
            wallpaper.image ||
            ""
        ).trim();

    }


    function getWallpaperKeywords(wallpaper) {

        if (Array.isArray(wallpaper.keywords)) {

            return wallpaper.keywords
                .map(normalize)
                .join(" ");

        }

        return normalize(
            wallpaper.keywords
        );

    }


    function getWallpaperSearchText(wallpaper) {

        return [
            getWallpaperTitle(wallpaper),
            getWallpaperCategory(wallpaper),
            getWallpaperKeywords(wallpaper),
            wallpaper.description || ""
        ]
            .join(" ")
            .toLowerCase();

    }


    /* =====================================================
       FILTER DATABASE
    ===================================================== */

    function getFilteredWallpapers() {

        return wallpapers.filter(
            wallpaper => {

                const category =
                    getWallpaperCategory(
                        wallpaper
                    );

                const categoryMatches =
                    activeCategory === "all" ||
                    category === activeCategory;

                const searchMatches =
                    searchTerm === "" ||
                    getWallpaperSearchText(
                        wallpaper
                    ).includes(searchTerm);

                return (
                    categoryMatches &&
                    searchMatches
                );

            }
        );

    }


    /* =====================================================
       CARD CREATION
    ===================================================== */

    function createWallpaperCard(wallpaper) {

        const card =
            document.createElement("article");

        card.className =
            "wallpaper-card";

        card.dataset.id =
            getWallpaperId(wallpaper);

        card.dataset.category =
            getWallpaperCategory(wallpaper);

        card.dataset.title =
            getWallpaperTitle(wallpaper);

        card.dataset.keywords =
            getWallpaperKeywords(wallpaper);

        card.dataset.image =
            getWallpaperImage(wallpaper);


        const art =
            document.createElement("div");

        art.className =
            "wallpaper-art";


        const image =
            getWallpaperImage(wallpaper);


        /*
         * If a real image exists,
         * use it as the wallpaper.
         */

        if (image) {

            art.style.backgroundImage =
                `url("${image}")`;

            art.style.backgroundSize =
                "cover";

            art.style.backgroundPosition =
                "center";

        } else {

            /*
             * Missing-image fallback.
             */

            art.classList.add(
                "art-placeholder"
            );

        }


        /* LIKE */

        const likeButton =
            document.createElement("button");

        likeButton.className =
            "like-btn";

        likeButton.type =
            "button";

        likeButton.setAttribute(
            "aria-label",
            `Like ${getWallpaperTitle(wallpaper)}`
        );

        likeButton.textContent =
            "♡";


        /* PREVIEW */

        const previewButton =
            document.createElement("button");

        previewButton.className =
            "preview-btn";

        previewButton.type =
            "button";

        previewButton.setAttribute(
            "aria-label",
            `Preview ${getWallpaperTitle(wallpaper)}`
        );

        previewButton.textContent =
            "👁";


        /* DOWNLOAD */

        const downloadButton =
            document.createElement("button");

        downloadButton.className =
            "download-btn";

        downloadButton.type =
            "button";

        downloadButton.setAttribute(
            "aria-label",
            `Download ${getWallpaperTitle(wallpaper)}`
        );

        downloadButton.textContent =
            "↓";


        /* INFO */

        const info =
            document.createElement("div");

        info.className =
            "wallpaper-info";


        const title =
            document.createElement("h3");

        title.textContent =
            getWallpaperTitle(wallpaper);


        const category =
            document.createElement("span");

        category.textContent =
            capitalize(
                getWallpaperCategory(wallpaper)
            );


        info.appendChild(title);
        info.appendChild(category);


        art.appendChild(likeButton);
        art.appendChild(previewButton);

        if (image) {

            art.appendChild(
                downloadButton
            );

        }

        art.appendChild(info);

        card.appendChild(art);


        /* =================================================
           CARD EVENTS
        ================================================= */

        likeButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleLike(
                    wallpaper,
                    card
                );

            }
        );


        previewButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openPreview(
                    wallpaper,
                    card
                );

            }
        );


        if (image) {

            downloadButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    downloadWallpaper(
                        wallpaper
                    );

                }
            );

        }


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

                openPreview(
                    wallpaper,
                    card
                );

            }
        );


        updateCardLikeState(
            wallpaper,
            card
        );


        return card;

    }


    /* =====================================================
       RENDER WALLPAPERS
    ===================================================== */

    function renderWallpapers() {

        if (!wallpaperGrid) return;


        const filtered =
            getFilteredWallpapers();


        wallpaperGrid.innerHTML =
            "";


        const visible =
            filtered.slice(
                0,
                displayedLimit
            );


        visible.forEach(
            wallpaper => {

                wallpaperGrid.appendChild(
                    createWallpaperCard(
                        wallpaper
                    )
                );

            }
        );


        /* RESULTS COUNT */

        if (resultsCount) {

            resultsCount.textContent =
                `${filtered.length} ${
                    filtered.length === 1
                        ? "wallpaper"
                        : "wallpapers"
                }`;

        }


        /* EMPTY STATE */

        if (emptyState) {

            emptyState.hidden =
                filtered.length !== 0;

        }


        /* LOAD MORE */

        if (loadMoreContainer) {

            loadMoreContainer.style.display =
                filtered.length > displayedLimit
                    ? ""
                    : "none";

        }

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function performSearch() {

        searchTerm =
            searchInput
                ? normalize(
                    searchInput.value
                )
                : "";


        displayedLimit =
            INITIAL_LOAD;


        renderWallpapers();

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            performSearch
        );

    }


    /* =====================================================
       CLEAR / RESET
    ===================================================== */

    function resetAllFilters() {

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


        categoryButtons.forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.category ===
                    "all"
                );

            }
        );


        renderWallpapers();

    }


    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            resetAllFilters
        );

    }


    if (resetFilters) {

        resetFilters.addEventListener(
            "click",
            resetAllFilters
        );

    }


    /* =====================================================
       CATEGORIES
    ===================================================== */

    categoryButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    activeCategory =
                        normalize(
                            button.dataset.category ||
                            "all"
                        );


                    displayedLimit =
                        INITIAL_LOAD;


                    categoryButtons.forEach(
                        categoryButton => {

                            categoryButton.classList.toggle(
                                "active",
                                categoryButton ===
                                button
                            );

                        }
                    );


                    renderWallpapers();


                    const newSection =
                        document.getElementById(
                            "new"
                        );


                    if (newSection) {

                        newSection.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                }
            );

        }
    );


    /* =====================================================
       VIEW ALL
    ===================================================== */

    document
        .querySelectorAll(
            '[data-category="all"]'
        )
        .forEach(button => {

            if (
                button.classList.contains(
                    "category-btn"
                )
            ) {

                return;

            }


            button.addEventListener(
                "click",
                () => {

                    resetAllFilters();

                    scrollToSection(
                        "new"
                    );

                }
            );

        });


    /* =====================================================
       LOAD MORE
    ===================================================== */

    if (loadMoreBtn) {

        loadMoreBtn.addEventListener(
            "click",
            () => {

                displayedLimit +=
                    LOAD_MORE_AMOUNT;

                renderWallpapers();

            }
        );

    }


    /* =====================================================
       SEARCH PANEL
    ===================================================== */

    function openSearch() {

        if (!searchPanel) return;

        searchPanel.classList.add(
            "active"
        );


        if (searchInput) {

            setTimeout(
                () => {

                    searchInput.focus();

                },
                150
            );

        }

    }


    function closeSearch() {

        if (!searchPanel) return;

        searchPanel.classList.remove(
            "active"
        );

    }


    if (searchTrigger) {

        searchTrigger.addEventListener(
            "click",
            () => {

                if (
                    searchPanel.classList.contains(
                        "active"
                    )
                ) {

                    closeSearch();

                } else {

                    openSearch();

                }

            }
        );

    }


    /* =====================================================
       THEME
    ===================================================== */

    function updateThemeButton() {

        const isLight =
            body.classList.contains(
                "light"
            );


        if (!themeToggle) return;


        themeToggle.setAttribute(
            "aria-pressed",
            String(isLight)
        );


        themeToggle.setAttribute(
            "aria-label",
            isLight
                ? "Switch to dark mode"
                : "Switch to light mode"
        );


        const themeMeta =
            document.querySelector(
                'meta[name="theme-color"]'
            );


        if (themeMeta) {

            themeMeta.setAttribute(
                "content",
                isLight
                    ? "#f4f4f7"
                    : "#0b0b10"
            );

        }

    }


    function loadTheme() {

        const savedTheme =
            localStorage.getItem(
                "pixoraTheme"
            );


        if (
            savedTheme === "light"
        ) {

            body.classList.add(
                "light"
            );

        } else {

            body.classList.remove(
                "light"
            );

        }


        updateThemeButton();

    }


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                body.classList.toggle(
                    "light"
                );


                const isLight =
                    body.classList.contains(
                        "light"
                    );


                localStorage.setItem(
                    "pixoraTheme",
                    isLight
                        ? "light"
                        : "dark"
                );


                updateThemeButton();

            }
        );

    }


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


    function showSlide(index) {

        if (!heroSlides.length) return;


        currentSlide =
            (
                index +
                heroSlides.length
            ) %
            heroSlides.length;


        heroSlides.forEach(
            (slide, slideIndex) => {

                slide.classList.toggle(
                    "active",
                    slideIndex ===
                    currentSlide
                );

            }
        );


        heroDots.forEach(
            (dot, dotIndex) => {

                dot.classList.toggle(
                    "active",
                    dotIndex ===
                    currentSlide
                );

            }
        );

    }


    function startHeroSlider() {

        if (
            heroSlides.length <= 1
        ) {

            return;

        }


        clearInterval(
            heroTimer
        );


        heroTimer =
            setInterval(
                () => {

                    showSlide(
                        currentSlide + 1
                    );

                },
                5000
            );

    }


    heroDots.forEach(
        dot => {

            dot.addEventListener(
                "click",
                () => {

                    showSlide(
                        Number(
                            dot.dataset.slide
                        )
                    );


                    startHeroSlider();

                }
            );

        }
    );


    showSlide(0);

    startHeroSlider();


    /* =====================================================
       SCROLLING
    ===================================================== */

    function scrollToSection(id) {

        const section =
            document.getElementById(id);


        if (!section) return;


        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    if (exploreBtn) {

        exploreBtn.addEventListener(
            "click",
            () => {

                scrollToSection(
                    "new"
                );

            }
        );

    }


    document
        .querySelectorAll(
            "[data-scroll]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    scrollToSection(
                        button.dataset.scroll
                    );

                }
            );

        });


    /* =====================================================
       LIKES
    ===================================================== */

    function updateLikeButton(
        button,
        liked
    ) {

        if (!button) return;


        button.classList.toggle(
            "liked",
            liked
        );


        button.textContent =
            liked
                ? "♥"
                : "♡";

    }


    function updateCardLikeState(
        wallpaper,
        card
    ) {

        if (!card) return;


        const id =
            getWallpaperId(
                wallpaper
            );


        updateLikeButton(
            card.querySelector(
                ".like-btn"
            ),
            Boolean(
                likes[id]
            )
        );

    }


    function toggleLike(
        wallpaper,
        card
    ) {

        const id =
            getWallpaperId(
                wallpaper
            );


        likes[id] =
            !likes[id];


        saveLikes();


        updateCardLikeState(
            wallpaper,
            card
        );


        if (
            currentWallpaper ===
            wallpaper
        ) {

            updateLikeButton(
                modalLike,
                likes[id]
            );

        }

    }


    /* =====================================================
       PREVIEW
    ===================================================== */

    function openPreview(
        wallpaper,
        card
    ) {

        if (
            !previewModal
        ) {

            return;

        }


        currentWallpaper =
            wallpaper;

        currentCard =
            card;


        const title =
            getWallpaperTitle(
                wallpaper
            );

        const category =
            getWallpaperCategory(
                wallpaper
            );

        const image =
            getWallpaperImage(
                wallpaper
            );


        modalTitle.textContent =
            title;


        modalDetails.textContent =
            category
                ? `PIXORA • ${capitalize(category)}`
                : "PIXORA Wallpaper";


        modalArt.innerHTML =
            "";

        modalArt.style.backgroundImage =
            "";


        if (image) {

            const img =
                document.createElement(
                    "img"
                );


            img.src =
                image;


            img.alt =
                `${title} wallpaper`;


            img.loading =
                "eager";


            img.onerror =
                () => {

                    modalArt.innerHTML =
                        "";

                    modalArt.classList.add(
                        "art-placeholder"
                    );

                };


            modalArt.appendChild(
                img
            );

        } else {

            modalArt.classList.add(
                "art-placeholder"
            );

        }


        const id =
            getWallpaperId(
                wallpaper
            );


        updateLikeButton(
            modalLike,
            Boolean(
                likes[id]
            )
        );


        previewModal.classList.add(
            "active"
        );


        previewModal.setAttribute(
            "aria-hidden",
            "false"
        );


        body.style.overflow =
            "hidden";

    }


    function closePreview() {

        if (!previewModal) return;


        previewModal.classList.remove(
            "active"
        );


        previewModal.setAttribute(
            "aria-hidden",
            "true"
        );


        body.style.overflow =
            "";


        currentWallpaper =
            null;

        currentCard =
            null;

    }


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closePreview
        );

    }


    if (modalBackdrop) {

        modalBackdrop.addEventListener(
            "click",
            closePreview
        );

    }


    /* =====================================================
       MODAL LIKE
    ===================================================== */

    if (modalLike) {

        modalLike.addEventListener(
            "click",
            () => {

                if (
                    !currentWallpaper
                ) {

                    return;

                }


                toggleLike(
                    currentWallpaper,
                    currentCard
                );

            }
        );

    }


    /* =====================================================
       DOWNLOAD
    ===================================================== */

    async function downloadWallpaper(
        wallpaper
    ) {

        const image =
            getWallpaperImage(
                wallpaper
            );


        if (!image) {

            alert(
                "This wallpaper does not have a downloadable image yet."
            );

            return;

        }


        const title =
            getWallpaperTitle(
                wallpaper
            );


        try {

            const response =
                await fetch(
                    image
                );


            if (!response.ok) {

                throw new Error(
                    "Image unavailable"
                );

            }


            const blob =
                await response.blob();


            const objectURL =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                objectURL;


            link.download =
                `${title
                    .replace(
                        /[^a-z0-9]+/gi,
                        "-"
                    )
                    .toLowerCase()
                }-pixora`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                () => {

                    URL.revokeObjectURL(
                        objectURL
                    );

                },
                1000
            );

        } catch {

            window.open(
                image,
                "_blank"
            );

        }

    }


    if (modalDownload) {

        modalDownload.addEventListener(
            "click",
            () => {

                if (
                    !currentWallpaper
                ) {

                    return;

                }


                downloadWallpaper(
                    currentWallpaper
                );

            }
        );

    }


    /* =====================================================
       RANDOM WALLPAPER
    ===================================================== */

    if (randomBtn) {

        randomBtn.addEventListener(
            "click",
            () => {

                const available =
                    getFilteredWallpapers();


                if (!available.length) {

                    alert(
                        "No wallpapers available. Reset your filters first."
                    );

                    return;

                }


                const randomIndex =
                    Math.floor(
                        Math.random() *
                        available.length
                    );


                const wallpaper =
                    available[
                        randomIndex
                    ];


                openPreview(
                    wallpaper,
                    null
                );

            }
        );

    }


    /* =====================================================
       BOTTOM NAVIGATION
    ===================================================== */

    navItems.forEach(
        item => {

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

        }
    );


    /* =====================================================
       ACTIVE NAVIGATION
    ===================================================== */

    const navigationSections = [
        "home",
        "trending",
        "new",
        "categories"
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


                if (!section) return;


                if (
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
                    item.dataset.target ===
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
                event.key === "Escape"
            ) {

                closePreview();

                closeSearch();

            }

        }
    );


    /* =====================================================
       OUTSIDE SEARCH CLICK
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                !searchPanel ||
                !searchTrigger
            ) {

                return;

            }


            const insideSearch =
                searchPanel.contains(
                    event.target
                );


            const clickedTrigger =
                searchTrigger.contains(
                    event.target
                );


            if (
                !insideSearch &&
                !clickedTrigger
            ) {

                closeSearch();

            }

        }
    );


    /* =====================================================
       UTILITY
    ===================================================== */

    function capitalize(text) {

        if (!text) return "";

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    loadTheme();

    renderWallpapers();

    updateNavigation();


    console.log(
        `PIXORA initialized successfully — ${wallpapers.length} wallpapers loaded.`
    );

});
// =========================================================
// PIXORA — SUPABASE CONNECTION TEST
// =========================================================

async function testSupabaseConnection() {
    const { data, error } = await supabase
        .from("wallpapers")
        .select("id")
        .limit(1);

    if (error) {
        console.error("PIXORA Supabase connection failed:", error);
        return;
    }

    console.log("PIXORA Supabase connection successful!");
    console.log("Database response:", data);
}

testSupabaseConnection();
