document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       ELEMENTS
    ========================= */

    const body = document.body;

    const themeToggle = document.getElementById("themeToggle");

    const searchTrigger = document.getElementById("searchTrigger");
    const searchPanel = document.getElementById("searchPanel");
    const searchInput = document.getElementById("searchInput");
    const clearSearch = document.getElementById("clearSearch");

    const categoryButtons =
        document.querySelectorAll(".category-btn");

    const wallpaperCards =
        document.querySelectorAll(".wallpaper-card");

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


    /* =========================
       DAY / NIGHT MODE
    ========================= */

    const savedTheme =
        localStorage.getItem("pixoraTheme");

    if (savedTheme === "light") {
        body.classList.add("light");
    }

    function updateThemeColor() {

        const themeMeta =
            document.querySelector(
                'meta[name="theme-color"]'
            );

        if (!themeMeta) return;

        themeMeta.setAttribute(
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

            themeToggle.setAttribute(
                "aria-label",
                isLight
                    ? "Switch to night mode"
                    : "Switch to day mode"
            );

        });

    }


    /* =========================
       SEARCH
    ========================= */

    function openSearch() {

        if (!searchPanel) return;

        searchPanel.classList.add("active");

        setTimeout(() => {

            if (searchInput) {
                searchInput.focus();
            }

        }, 100);

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


    /* =========================
       FILTER WALLPAPERS
    ========================= */

    let activeCategory = "all";


    function filterWallpapers() {

        const searchTerm =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        let visibleCount = 0;


        wallpaperCards.forEach(card => {

            const title =
                (
                    card.dataset.title || ""
                ).toLowerCase();

            const category =
                (
                    card.dataset.category || ""
                ).toLowerCase();


            const matchesSearch =
                !searchTerm ||
                title.includes(searchTerm) ||
                category.includes(searchTerm);


            const matchesCategory =
                activeCategory === "all" ||
                category === activeCategory;


            if (
                matchesSearch &&
                matchesCategory
            ) {

                card.style.display = "";

                visibleCount++;

            } else {

                card.style.display = "none";

            }

        });


        if (resultsCount) {

            resultsCount.textContent =
                `${visibleCount} wallpaper${visibleCount === 1 ? "" : "s"}`;

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


    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            () => {

                if (searchInput) {
                    searchInput.value = "";
                }

                activeCategory = "all";


                categoryButtons.forEach(button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.category === "all"
                    );

                });


                filterWallpapers();

                if (searchInput) {
                    searchInput.focus();
                }

            }
        );

    }


    /* =========================
       CATEGORIES
    ========================= */

    categoryButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                activeCategory =
                    button.dataset.category || "all";


                categoryButtons.forEach(
                    categoryButton => {

                        categoryButton.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add("active");


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


    /* =========================
       HERO SLIDER
    ========================= */

    const heroSlides =
        document.querySelectorAll(".hero-slide");

    const heroDots =
        document.querySelectorAll(".hero-dot");

    let currentSlide = 0;


    function showSlide(index) {

        if (!heroSlides.length) return;

        currentSlide =
            (index + heroSlides.length) %
            heroSlides.length;


        heroSlides.forEach(
            (slide, i) => {

                slide.classList.toggle(
                    "active",
                    i === currentSlide
                );

            }
        );


        heroDots.forEach(
            (dot, i) => {

                dot.classList.toggle(
                    "active",
                    i === currentSlide
                );

            }
        );

    }


    heroDots.forEach(dot => {

        dot.addEventListener(
            "click",
            () => {

                const slideNumber =
                    Number(
                        dot.dataset.slide
                    );

                showSlide(slideNumber);

            }
        );

    });


    if (heroSlides.length > 1) {

        setInterval(() => {

            showSlide(currentSlide + 1);

        }, 5000);

    }


    /* =========================
       HERO BUTTONS
    ========================= */

    if (exploreBtn) {

        exploreBtn.addEventListener(
            "click",
            () => {

                const newSection =
                    document.getElementById("new");

                if (newSection) {

                    newSection.scrollIntoView({
                        behavior: "smooth"
                    });

                }

            }
        );

    }


    document.querySelectorAll(
        "[data-scroll]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    document.getElementById(
                        button.dataset.scroll
                    );

                if (target) {

                    target.scrollIntoView({
                        behavior: "smooth"
                    });

                }

            }
        );

    });


    /* =========================
       LIKE SYSTEM
    ========================= */

    let likedWallpapers =
        JSON.parse(
            localStorage.getItem(
                "pixoraLikes"
            ) || "[]"
        );


    function getWallpaperId(card) {

        return (
            card.dataset.title ||
            "unknown-wallpaper"
        );

    }


    function updateLikeButton(
        card,
        button
    ) {

        const id =
            getWallpaperId(card);

        const liked =
            likedWallpapers.includes(id);


        button.classList.toggle(
            "liked",
            liked
        );


        button.textContent =
            liked ? "♥" : "♡";

    }


    wallpaperCards.forEach(card => {

        const likeButton =
            card.querySelector(".like-btn");

        if (!likeButton) return;


        updateLikeButton(
            card,
            likeButton
        );


        likeButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                const id =
                    getWallpaperId(card);

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


                localStorage.setItem(
                    "pixoraLikes",
                    JSON.stringify(
                        likedWallpapers
                    )
                );


                updateLikeButton(
                    card,
                    likeButton
                );


                if (
                    modalLike.dataset.cardId === id
                ) {

                    modalLike.textContent =
                        likedWallpapers.includes(id)
                            ? "♥ Liked"
                            : "♡ Like";

                }

            }
        );

    });


    /* =========================
       PREVIEW MODAL
    ========================= */

    let currentModalCard = null;


    function openModal(card) {

        if (!previewModal) return;


        currentModalCard = card;


        const art =
            card.querySelector(
                ".wallpaper-art"
            );


        const title =
            card.dataset.title ||
            "PIXORA Wallpaper";


        const category =
            card.dataset.category ||
            "Wallpaper";


        if (modalArt && art) {

            modalArt.className =
                "modal-art " +
                Array.from(
                    art.classList
                )
                .filter(
                    className =>
                        className !==
                        "wallpaper-art"
                )
                .join(" ");

        }


        if (modalTitle) {

            modalTitle.textContent =
                title;

        }


        if (modalDetails) {

            modalDetails.textContent =
                `${category.charAt(0).toUpperCase() + category.slice(1)} • PIXORA`;

        }


        if (modalLike) {

            const id =
                getWallpaperId(card);

            modalLike.dataset.cardId =
                id;

            modalLike.textContent =
                likedWallpapers.includes(id)
                    ? "♥ Liked"
                    : "♡ Like";

        }


        previewModal.classList.add(
            "active"
        );

        previewModal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";

    }


    function closeModal() {

        if (!previewModal) return;


        previewModal.classList.remove(
            "active"
        );

        previewModal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";

        currentModalCard = null;

    }


    wallpaperCards.forEach(card => {

        const previewButton =
            card.querySelector(
                ".preview-btn"
            );


        if (previewButton) {

            previewButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openModal(card);

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
                ) return;

                openModal(card);

            }
        );

    });


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closeModal
        );

    }


    const modalBackdrop =
        document.querySelector(
            ".modal-backdrop"
        );


    if (modalBackdrop) {

        modalBackdrop.addEventListener(
            "click",
            closeModal
        );

    }


    /* =========================
       MODAL LIKE
    ========================= */

    if (modalLike) {

        modalLike.addEventListener(
            "click",
            () => {

                if (!currentModalCard)
                    return;


                const id =
                    getWallpaperId(
                        currentModalCard
                    );


                const index =
                    likedWallpapers.indexOf(
                        id
                    );


                if (index === -1) {

                    likedWallpapers.push(id);

                } else {

                    likedWallpapers.splice(
                        index,
                        1
                    );

                }


                localStorage.setItem(
                    "pixoraLikes",
                    JSON.stringify(
                        likedWallpapers
                    )
                );


                modalLike.textContent =
                    likedWallpapers.includes(id)
                        ? "♥ Liked"
                        : "♡ Like";


                const cardLike =
                    currentModalCard.querySelector(
                        ".like-btn"
                    );


                if (cardLike) {

                    updateLikeButton(
                        currentModalCard,
                        cardLike
                    );

                }

            }
        );

    }


    /* =========================
       DOWNLOAD BUTTONS
    ========================= */

    function downloadMessage() {

        alert(
            "Your wallpaper download system is ready. Add real wallpaper image files next to enable downloads."
        );

    }


    document.querySelectorAll(
        ".download-btn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                downloadMessage();

            }
        );

    });


    if (modalDownload) {

        modalDownload.addEventListener(
            "click",
            downloadMessage
        );

    }


    /* =========================
       RANDOM WALLPAPER
    ========================= */

    if (randomBtn) {

        randomBtn.addEventListener(
            "click",
            () => {

                const visibleCards =
                    Array.from(
                        wallpaperCards
                    ).filter(
                        card =>
                            card.style.display !==
                            "none"
                    );


                if (!visibleCards.length) {

                    alert(
                        "No wallpapers available."
                    );

                    return;

                }


                const randomCard =
                    visibleCards[
                        Math.floor(
                            Math.random() *
                            visibleCards.length
                        )
                    ];


                openModal(randomCard);

            }
        );

    }


    /* =========================
       BOTTOM NAVIGATION
    ========================= */

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const targetId =
                    item.dataset.target;


                let target;


                if (
                    targetId === "home"
                ) {

                    target =
                        document.body;

                } else {

                    target =
                        document.getElementById(
                            targetId
                        );

                }


                if (target) {

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }


                navItems.forEach(
                    nav => {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                item.classList.add(
                    "active"
                );

            }
        );

    });


    /* =========================
       ESCAPE KEY
    ========================= */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeModal();

                closeSearch();

            }

        }
    );


    /* =========================
       INITIAL FILTER
    ========================= */

    filterWallpapers();


    console.log(
        "PIXORA JavaScript loaded successfully 🚀"
    );

});
