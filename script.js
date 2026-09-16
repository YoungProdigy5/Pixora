document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       PIXORA — MAIN JAVASCRIPT
       Built specifically for the current PIXORA HTML
    ===================================================== */

    const body = document.body;

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const themeToggle = document.getElementById("themeToggle");

    const searchTrigger = document.getElementById("searchTrigger");
    const searchPanel = document.getElementById("searchPanel");
    const searchInput = document.getElementById("searchInput");
    const clearSearch = document.getElementById("clearSearch");

    const categoryButtons =
        document.querySelectorAll(".category-btn");

    const wallpaperCards =
        Array.from(document.querySelectorAll(".wallpaper-card"));

    const resultsCount =
        document.getElementById("resultsCount");

    const emptyState =
        document.getElementById("emptyState");

    const previewModal =
        document.getElementById("previewModal");

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

    const randomBtn =
        document.getElementById("randomBtn");

    const exploreBtn =
        document.getElementById("exploreBtn");

    const navItems =
        document.querySelectorAll(".nav-item");


    /* =====================================================
       HELPER FUNCTIONS
    ===================================================== */

    function getCardTitle(card) {

        return (
            card.dataset.title ||
            card.querySelector("h3")?.textContent.trim() ||
            "PIXORA Wallpaper"
        );

    }


    function getCardCategory(card) {

        return (
            card.dataset.category ||
            card.querySelector(".wallpaper-info span")
                ?.textContent
                .trim()
                .split("•")[0]
                .toLowerCase() ||
            "wallpaper"
        );

    }


    function getCardImage(card) {

        return card.dataset.image || "";

    }


    function getCardId(card) {

        return (
            getCardTitle(card)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
        );

    }


    function capitalize(text) {

        if (!text) return "";

        return text.charAt(0).toUpperCase() +
            text.slice(1);

    }


    /* =====================================================
       AUTOMATIC IMAGE SETUP
       
       If a card has data-image, automatically place the
       image onto the wallpaper artwork.
    ===================================================== */

    wallpaperCards.forEach(card => {

        const image = getCardImage(card);

        const art =
            card.querySelector(".wallpaper-art");

        if (image && art) {

            art.style.backgroundImage =
                `url("${image}")`;

            art.classList.add("has-wallpaper-image");

        }

    });


    /* =====================================================
       DAY / NIGHT MODE
    ===================================================== */

    const savedTheme =
        localStorage.getItem("pixoraTheme");

    if (savedTheme === "light") {

        body.classList.add("light");

    }


    function updateThemeColor() {

        const meta =
            document.querySelector(
                'meta[name="theme-color"]'
            );

        if (!meta) return;

        meta.setAttribute(
            "content",
            body.classList.contains("light")
                ? "#f4f5f8"
                : "#0b0b10"
        );

    }


    updateThemeColor();


    if (themeToggle) {

        themeToggle.addEventListener("click", () => {

            body.classList.toggle("light");

            const isLight =
                body.classList.contains("light");

            localStorage.setItem(
                "pixoraTheme",
                isLight ? "light" : "dark"
            );

            updateThemeColor();

        });

    }


    /* =====================================================
       SEARCH PANEL
    ===================================================== */

    function openSearch() {

        if (!searchPanel) return;

        searchPanel.classList.add("active");

        setTimeout(() => {

            searchInput?.focus();

        }, 150);

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
                    searchPanel.classList.contains("active")
                ) {

                    closeSearch();

                } else {

                    openSearch();

                }

            }
        );

    }


    /* =====================================================
       SEARCH + CATEGORY FILTER
    ===================================================== */

    let activeCategory = "all";


    function filterWallpapers() {

        const searchTerm =
            searchInput?.value
                .trim()
                .toLowerCase() || "";


        let visibleCount = 0;


        wallpaperCards.forEach(card => {

            const title =
                getCardTitle(card).toLowerCase();

            const category =
                getCardCategory(card).toLowerCase();

            const info =
                card
                    .querySelector(".wallpaper-info")
                    ?.textContent
                    .toLowerCase() || "";


            const matchesSearch =
                searchTerm === "" ||
                title.includes(searchTerm) ||
                category.includes(searchTerm) ||
                info.includes(searchTerm);


            const matchesCategory =
                activeCategory === "all" ||
                category === activeCategory;


            const show =
                matchesSearch &&
                matchesCategory;


            card.hidden = !show;


            if (show) {

                visibleCount++;

            }

        });


        if (resultsCount) {

            resultsCount.textContent =
                `${visibleCount} wallpaper${
                    visibleCount === 1 ? "" : "s"
                }`;

        }


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

    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            () => {

                if (searchInput) {

                    searchInput.value = "";

                }

                filterWallpapers();

                searchInput?.focus();

            }
        );

    }


    /* =====================================================
       CATEGORY BUTTONS
    ===================================================== */

    function selectCategory(category) {

        activeCategory =
            (category || "all").toLowerCase();


        categoryButtons.forEach(button => {

            const buttonCategory =
                (
                    button.dataset.category ||
                    "all"
                ).toLowerCase();


            button.classList.toggle(
                "active",
                buttonCategory === activeCategory
            );

        });


        filterWallpapers();

    }


    categoryButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectCategory(
                    button.dataset.category
                );


                document
                    .getElementById("new")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

            }
        );

    });


    /* =====================================================
       VIEW ALL BUTTONS
    ===================================================== */

    document
        .querySelectorAll(".view-all")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectCategory(
                        button.dataset.category || "all"
                    );


                    document
                        .getElementById("new")
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                }
            );

        });


    /* =====================================================
       HERO SLIDER
    ===================================================== */

    const heroSlides =
        document.querySelectorAll(".hero-slide");

    const heroDots =
        document.querySelectorAll(".hero-dot");

    let currentSlide = 0;

    let heroTimer;


    function showSlide(index) {

        if (!heroSlides.length) return;


        currentSlide =
            (index + heroSlides.length) %
            heroSlides.length;


        heroSlides.forEach((slide, i) => {

            slide.classList.toggle(
                "active",
                i === currentSlide
            );

        });


        heroDots.forEach((dot, i) => {

            dot.classList.toggle(
                "active",
                i === currentSlide
            );

        });

    }


    function startHeroSlider() {

        if (heroSlides.length <= 1) return;


        clearInterval(heroTimer);


        heroTimer = setInterval(() => {

            showSlide(currentSlide + 1);

        }, 5000);

    }


    heroDots.forEach(dot => {

        dot.addEventListener(
            "click",
            () => {

                showSlide(
                    Number(dot.dataset.slide) || 0
                );

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

        const target =
            document.getElementById(id);

        if (!target) return;

        target.scrollIntoView({
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
       FAVORITES
    ===================================================== */

    let likedWallpapers = [];

    try {

        likedWallpapers =
            JSON.parse(
                localStorage.getItem("pixoraLikes") ||
                "[]"
            );

        if (!Array.isArray(likedWallpapers)) {

            likedWallpapers = [];

        }

    } catch {

        likedWallpapers = [];

    }


    function saveLikes() {

        localStorage.setItem(
            "pixoraLikes",
            JSON.stringify(likedWallpapers)
        );

    }


    function isLiked(card) {

        return likedWallpapers.includes(
            getCardId(card)
        );

    }


    function updateCardLike(card) {

        const button =
            card.querySelector(".like-btn");

        if (!button) return;


        const liked =
            isLiked(card);


        button.classList.toggle(
            "liked",
            liked
        );


        button.textContent =
            liked ? "♥" : "♡";


        button.setAttribute(
            "aria-label",
            liked
                ? "Unlike wallpaper"
                : "Like wallpaper"
        );

    }


    function toggleLike(card) {

        const id =
            getCardId(card);


        const index =
            likedWallpapers.indexOf(id);


        if (index === -1) {

            likedWallpapers.push(id);

        } else {

            likedWallpapers.splice(
                index,
                1
            );

        }


        saveLikes();

        updateCardLike(card);

    }


    wallpaperCards.forEach(card => {

        updateCardLike(card);


        const likeButton =
            card.querySelector(".like-btn");


        if (likeButton) {

            likeButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleLike(card);

                    updateModalLike();

                }
            );

        }

    });


    /* =====================================================
       PREVIEW MODAL
    ===================================================== */

    let currentCard = null;


    function openPreview(card) {

        if (!previewModal) return;


        currentCard = card;


        const image =
            getCardImage(card);

        const title =
            getCardTitle(card);

        const category =
            getCardCategory(card);


        /* CLEAR OLD MODAL CONTENT */

        if (modalArt) {

            modalArt.innerHTML = "";

            modalArt.style.backgroundImage = "";


            if (image) {

                const img =
                    document.createElement("img");


                img.src = image;

                img.alt = title;

                img.loading = "eager";


                img.onerror = () => {

                    img.style.display = "none";

                    modalArt.style.backgroundImage =
                        "none";

                    modalArt.textContent =
                        "Wallpaper image could not be loaded.";

                };


                modalArt.appendChild(img);

            } else {

                const art =
                    card.querySelector(
                        ".wallpaper-art"
                    );


                if (art) {

                    const background =
                        getComputedStyle(art)
                            .backgroundImage;


                    if (
                        background &&
                        background !== "none"
                    ) {

                        modalArt.style.backgroundImage =
                            background;

                    }

                }

            }

        }


        if (modalTitle) {

            modalTitle.textContent =
                title;

        }


        if (modalDetails) {

            modalDetails.textContent =
                `${capitalize(category)} • PIXORA`;

        }


        updateModalLike();


        previewModal.classList.add("active");

        previewModal.setAttribute(
            "aria-hidden",
            "false"
        );


        body.style.overflow = "hidden";

    }


    function closePreview() {

        if (!previewModal) return;


        previewModal.classList.remove("active");

        previewModal.setAttribute(
            "aria-hidden",
            "true"
        );


        body.style.overflow = "";

        currentCard = null;


        if (modalArt) {

            modalArt.innerHTML = "";

            modalArt.style.backgroundImage = "";

        }

    }


    /* =====================================================
       CARD PREVIEW BUTTONS
    ===================================================== */

    wallpaperCards.forEach(card => {

        const previewButton =
            card.querySelector(".preview-btn");


        if (previewButton) {

            previewButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openPreview(card);

                }
            );

        }


        card.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest("button")
                ) {

                    return;

                }


                openPreview(card);

            }
        );

    });


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closePreview
        );

    }


    const modalBackdrop =
        document.querySelector(".modal-backdrop");


    if (modalBackdrop) {

        modalBackdrop.addEventListener(
            "click",
            closePreview
        );

    }


    /* =====================================================
       MODAL LIKE
    ===================================================== */

    function updateModalLike() {

        if (!modalLike || !currentCard)
            return;


        modalLike.textContent =
            isLiked(currentCard)
                ? "♥ Liked"
                : "♡ Like";

    }


    if (modalLike) {

        modalLike.addEventListener(
            "click",
            () => {

                if (!currentCard)
                    return;


                toggleLike(currentCard);

                updateModalLike();

            }
        );

    }


    /* =====================================================
       DOWNLOAD
    ===================================================== */

    async function downloadWallpaper(card) {

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
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = objectURL;


            const extension =
                image
                    .split("?")[0]
                    .split(".")
                    .pop()
                    .toLowerCase();


            link.download =
                `${title
                    .replace(/[^a-z0-9]+/gi, "-")
                    .toLowerCase()}.${extension || "jpg"}`;


            document.body.appendChild(link);

            link.click();

            link.remove();


            setTimeout(() => {

                URL.revokeObjectURL(objectURL);

            }, 1000);


        } catch (error) {

            /*
                GitHub Pages / browser restrictions can
                sometimes prevent fetch-based downloads.
                In that case, open the original image.
            */

            window.open(
                image,
                "_blank"
            );

        }

    }


    document
        .querySelectorAll(".download-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    const card =
                        button.closest(
                            ".wallpaper-card"
                        );


                    if (card) {

                        downloadWallpaper(card);

                    }

                }
            );

        });


    if (modalDownload) {

        modalDownload.addEventListener(
            "click",
            () => {

                if (currentCard) {

                    downloadWallpaper(
                        currentCard
                    );

                }

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
                    wallpaperCards.filter(
                        card => !card.hidden
                    );


                if (!visibleCards.length) {

                    alert(
                        "No wallpapers found."
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

                const targetId =
                    item.dataset.target;


                if (targetId === "home") {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                } else {

                    scrollToSection(
                        targetId
                    );

                }


                navItems.forEach(nav => {

                    nav.classList.remove(
                        "active"
                    );

                });


                item.classList.add("active");

            }
        );

    });


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closePreview();

                closeSearch();

            }

        }
    );


    /* =====================================================
       CLICK OUTSIDE SEARCH
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (!searchPanel?.classList.contains("active"))
                return;


            if (
                event.target.closest(".search-panel") ||
                event.target.closest(".search-trigger")
            ) {

                return;

            }


            closeSearch();

        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    filterWallpapers();


    console.log(
        "PIXORA 🚀 — Wallpaper engine loaded successfully."
    );

});
