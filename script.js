/* =========================================================
   PIXORA — COMPLETE JAVASCRIPT
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

    const wallpaperCards =
        document.querySelectorAll(".wallpaper-card");

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

    const navItems =
        document.querySelectorAll(".nav-item");

    /* Modal */

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
       GLOBAL STATE
    ===================================================== */

    let activeCategory = "all";

    let currentCard = null;

    let currentSlide = 0;

    let heroTimer = null;


    /* =====================================================
       HELPERS
    ===================================================== */

    function getCardTitle(card) {

        return (
            card.dataset.title ||
            card.querySelector("h3")?.textContent ||
            "Wallpaper"
        ).trim();

    }


    function getCardCategory(card) {

        return (
            card.dataset.category ||
            ""
        ).trim().toLowerCase();

    }


    function getCardKeywords(card) {

        return (
            card.dataset.keywords ||
            ""
        ).trim().toLowerCase();

    }


    function getCardImage(card) {

        return (
            card.dataset.image ||
            ""
        ).trim();

    }


    function getCardId(card) {

        return (
            getCardTitle(card)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
        );

    }


    function getCardSearchText(card) {

        const title =
            getCardTitle(card).toLowerCase();

        const category =
            getCardCategory(card);

        const keywords =
            getCardKeywords(card);

        const visibleText =
            card.innerText
                .toLowerCase();

        return `
            ${title}
            ${category}
            ${keywords}
            ${visibleText}
        `.replace(/\s+/g, " ");

    }


    /* =====================================================
       IMAGE SETUP
    ===================================================== */

    wallpaperCards.forEach(card => {

        const image =
            getCardImage(card);

        if (!image) return;

        const art =
            card.querySelector(".wallpaper-art");

        if (!art) return;

        art.style.backgroundImage =
            `url("${image}")`;

    });


    /* =====================================================
       DAY / NIGHT MODE
    ===================================================== */

    function updateThemeButton() {

        const isLight =
            body.classList.contains("light");

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
            localStorage.getItem("pixoraTheme");

        if (savedTheme === "light") {

            body.classList.add("light");

        } else {

            body.classList.remove("light");

        }

        updateThemeButton();

    }


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                body.classList.toggle("light");

                const isLight =
                    body.classList.contains("light");

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
       SEARCH PANEL
    ===================================================== */

    function openSearch() {

        if (!searchPanel) return;

        searchPanel.classList.add("active");

        if (searchInput) {

            setTimeout(() => {

                searchInput.focus();

            }, 150);

        }

    }


    function closeSearch() {

        if (!searchPanel) return;

        searchPanel.classList.remove("active");

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
       FILTERING
    ===================================================== */

    function filterWallpapers() {

        const searchTerm =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        let visibleCount = 0;


        wallpaperCards.forEach(card => {

            const category =
                getCardCategory(card);

            const searchableText =
                getCardSearchText(card);


            const categoryMatches =
                activeCategory === "all" ||
                category === activeCategory;


            const searchMatches =
                searchTerm === "" ||
                searchableText.includes(
                    searchTerm
                );


            const shouldShow =
                categoryMatches &&
                searchMatches;


            card.style.display =
                shouldShow
                    ? ""
                    : "none";


            if (shouldShow) {

                visibleCount++;

            }

        });


        /* Results count */

        if (resultsCount) {

            resultsCount.textContent =
                `${visibleCount} ${
                    visibleCount === 1
                        ? "wallpaper"
                        : "wallpapers"
                }`;

        }


        /* Empty state */

        if (emptyState) {

            emptyState.hidden =
                visibleCount !== 0;

        }

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterWallpapers
        );

    }


    /* =====================================================
       CLEAR SEARCH
    ===================================================== */

    function resetAllFilters() {

        activeCategory = "all";

        if (searchInput) {

            searchInput.value = "";

        }


        categoryButtons.forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.category === "all"
            );

        });


        filterWallpapers();

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
       CATEGORY FILTER
    ===================================================== */

    categoryButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                activeCategory =
                    (
                        button.dataset.category ||
                        "all"
                    ).toLowerCase();


                categoryButtons.forEach(
                    categoryButton => {

                        categoryButton.classList.toggle(
                            "active",
                            categoryButton === button
                        );

                    }
                );


                filterWallpapers();


                const newSection =
                    document.getElementById("new");

                if (newSection) {

                    newSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
        );

    });


    /* =====================================================
       VIEW ALL BUTTONS
    ===================================================== */

    document
        .querySelectorAll(
            '[data-category="all"]'
        )
        .forEach(button => {

            /*
             * Only treat buttons outside the
             * category list as "View All".
             */

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

                    const newSection =
                        document.getElementById("new");

                    if (newSection) {

                        newSection.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                }
            );

        });


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
                    slideIndex === currentSlide
                );

            }
        );


        heroDots.forEach(
            (dot, dotIndex) => {

                dot.classList.toggle(
                    "active",
                    dotIndex === currentSlide
                );

            }
        );

    }


    function startHeroSlider() {

        if (heroSlides.length <= 1) return;


        clearInterval(heroTimer);


        heroTimer =
            setInterval(() => {

                showSlide(
                    currentSlide + 1
                );

            }, 5000);

    }


    heroDots.forEach(dot => {

        dot.addEventListener(
            "click",
            () => {

                const index =
                    Number(
                        dot.dataset.slide
                    );


                showSlide(index);

                startHeroSlider();

            }
        );

    });


    showSlide(0);

    startHeroSlider();


    /* =====================================================
       SCROLL BUTTONS
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

                scrollToSection("new");

            }
        );

    }


    document
        .querySelectorAll("[data-scroll]")
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
       LIKES / FAVORITES
    ===================================================== */

    let likes = {};


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


    function saveLikes() {

        localStorage.setItem(
            "pixoraLikes",
            JSON.stringify(likes)
        );

    }


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


    function updateCardLikeState(card) {

        if (!card) return;


        const id =
            getCardId(card);

        const liked =
            Boolean(likes[id]);


        const button =
            card.querySelector(
                ".like-btn"
            );


        updateLikeButton(
            button,
            liked
        );

    }


    wallpaperCards.forEach(
        card => {

            updateCardLikeState(card);

        }
    );


    function toggleLike(card) {

        if (!card) return;


        const id =
            getCardId(card);


        likes[id] =
            !likes[id];


        saveLikes();


        updateCardLikeState(card);


        if (
            currentCard === card
        ) {

            updateLikeButton(
                modalLike,
                likes[id]
            );

        }

    }


    wallpaperCards.forEach(
        card => {

            const likeButton =
                card.querySelector(
                    ".like-btn"
                );


            if (!likeButton) return;


            likeButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleLike(card);

                }
            );

        }
    );


    /* =====================================================
       PREVIEW MODAL
    ===================================================== */

    function openPreview(card) {

        if (!card || !previewModal) return;


        currentCard = card;


        const title =
            getCardTitle(card);

        const category =
            getCardCategory(card);

        const image =
            getCardImage(card);


        modalTitle.textContent =
            title;


        modalDetails.textContent =
            category
                ? `PIXORA • ${capitalize(category)}`
                : "PIXORA Wallpaper";


        /* Reset modal image */

        modalArt.innerHTML = "";

        modalArt.style.backgroundImage = "";


        if (image) {

            const img =
                document.createElement("img");


            img.src = image;

            img.alt =
                `${title} wallpaper`;


            img.loading = "eager";


            img.onerror = () => {

                modalArt.innerHTML = "";

                modalArt.style.backgroundImage =
                    card.querySelector(
                        ".wallpaper-art"
                    )?.style.backgroundImage ||
                    "";

            };


            modalArt.appendChild(img);

        } else {

            const cardArt =
                card.querySelector(
                    ".wallpaper-art"
                );


            if (cardArt) {

                const computed =
                    getComputedStyle(cardArt);


                modalArt.style.background =
                    computed.background;

                modalArt.style.backgroundImage =
                    computed.backgroundImage;

                modalArt.style.backgroundSize =
                    "cover";

                modalArt.style.backgroundPosition =
                    "center";

            }

        }


        const id =
            getCardId(card);


        updateLikeButton(
            modalLike,
            Boolean(likes[id])
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


        currentCard = null;

    }


    wallpaperCards.forEach(
        card => {

            const previewButton =
                card.querySelector(
                    ".preview-btn"
                );


            if (previewButton) {

                previewButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        openPreview(card);

                    }
                );

            }


            /*
             * Clicking the card itself
             * also opens preview.
             */

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


                    openPreview(card);

                }
            );

        }
    );


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

                if (!currentCard) return;

                toggleLike(currentCard);

            }
        );

    }


    /* =====================================================
       DOWNLOAD
    ===================================================== */

    async function downloadWallpaper(card) {

        if (!card) return;


        const image =
            getCardImage(card);


        if (!image) {

            alert(
                "This wallpaper does not have a downloadable image yet."
            );

            return;

        }


        const title =
            getCardTitle(card);


        try {

            const response =
                await fetch(image);


            if (!response.ok) {

                throw new Error(
                    "Image could not be loaded."
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
                    .replace(/[^a-z0-9]+/gi, "-")
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

        } catch (error) {

            /*
             * GitHub Pages / browser
             * restrictions may prevent fetch.
             * Open the image instead.
             */

            window.open(
                image,
                "_blank"
            );

        }

    }


    wallpaperCards.forEach(
        card => {

            const downloadButton =
                card.querySelector(
                    ".download-btn"
                );


            if (!downloadButton) return;


            downloadButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    downloadWallpaper(card);

                }
            );

        }
    );


    if (modalDownload) {

        modalDownload.addEventListener(
            "click",
            () => {

                if (!currentCard) return;

                downloadWallpaper(
                    currentCard
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

                const visibleCards =
                    Array.from(
                        wallpaperCards
                    ).filter(card => {

                        return (
                            card.style.display !==
                            "none"
                        );

                    });


                if (!visibleCards.length) {

                    alert(
                        "No wallpapers available. Reset your filters first."
                    );

                    return;

                }


                const randomIndex =
                    Math.floor(
                        Math.random() *
                        visibleCards.length
                    );


                openPreview(
                    visibleCards[randomIndex]
                );

            }
        );

    }


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


    /* =====================================================
       ACTIVE NAVIGATION WHILE SCROLLING
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
                    document.getElementById(id);


                if (!section) return;


                if (
                    section.offsetTop <=
                    scrollPosition
                ) {

                    activeTarget = id;

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
       KEYBOARD CONTROLS
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
       CLOSE SEARCH WHEN CLICKING OUTSIDE
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


            const clickedInsideSearch =
                searchPanel.contains(
                    event.target
                );


            const clickedTrigger =
                searchTrigger.contains(
                    event.target
                );


            if (
                !clickedInsideSearch &&
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

    filterWallpapers();

    updateNavigation();


    console.log(
        "PIXORA initialized successfully."
    );

});
