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
       DAY / NIGHT
    ========================= */

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

        themeToggle.addEventListener(
            "click",
            () => {

                body.classList.toggle("light");

                const light =
                    body.classList.contains("light");

                localStorage.setItem(
                    "pixoraTheme",
                    light ? "light" : "dark"
                );

                updateThemeColor();

            }
        );

    }


    /* =========================
       SEARCH
    ========================= */

    if (searchTrigger) {

        searchTrigger.addEventListener(
            "click",
            () => {

                searchPanel.classList.toggle(
                    "active"
                );

                if (
                    searchPanel.classList.contains(
                        "active"
                    )
                ) {

                    setTimeout(() => {
                        searchInput.focus();
                    }, 100);

                }

            }
        );

    }


    /* =========================
       FILTERING
    ========================= */

    let activeCategory = "all";


    function filterWallpapers() {

        const searchTerm =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        let visible = 0;


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

                visible++;

            } else {

                card.style.display = "none";

            }

        });


        if (resultsCount) {

            resultsCount.textContent =
                `${visible} wallpaper${visible === 1 ? "" : "s"}`;

        }


        if (emptyState) {

            emptyState.hidden =
                visible !== 0;

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

                searchInput.value = "";

                activeCategory = "all";

                categoryButtons.forEach(button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.category === "all"
                    );

                });

                filterWallpapers();

                searchInput.focus();

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
                    btn => {
                        btn.classList.remove("active");
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

                showSlide(
                    Number(dot.dataset.slide)
                );

            }
        );

    });


    if (heroSlides.length > 1) {

        setInterval(
            () => {
                showSlide(currentSlide + 1);
            },
            5000
        );

    }


    /* =========================
       SCROLL BUTTONS
    ========================= */

    if (exploreBtn) {

        exploreBtn.addEventListener(
            "click",
            () => {

                document
                    .getElementById("new")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

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
       LIKES
    ========================= */

    let likedWallpapers =
        JSON.parse(
            localStorage.getItem(
                "pixoraLikes"
            ) || "[]"
        );


    function wallpaperID(card) {

        return (
            card.dataset.title ||
            "wallpaper"
        );

    }


    function updateLikeButton(
        card,
        button
    ) {

        const id =
            wallpaperID(card);

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

        const button =
            card.querySelector(".like-btn");


        if (!button) return;


        updateLikeButton(
            card,
            button
        );


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const id =
                    wallpaperID(card);


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
                    button
                );

            }
        );

    });


    /* =========================
       PREVIEW
    ========================= */

    let currentCard = null;


    function openPreview(card) {

        currentCard = card;


        const image =
            card.dataset.image;

        const title =
            card.dataset.title ||
            "PIXORA Wallpaper";

        const category =
            card.dataset.category ||
            "Wallpaper";


        /* REAL IMAGE */

        if (modalArt) {

            modalArt.innerHTML = "";

            if (image) {

                const img =
                    document.createElement("img");

                img.src = image;

                img.alt = title;

                img.loading = "eager";

                modalArt.appendChild(img);

            } else {

                const art =
                    card.querySelector(
                        ".wallpaper-art"
                    );

                if (art) {

                    modalArt.style.backgroundImage =
                        getComputedStyle(
                            art
                        ).backgroundImage;

                }

            }

        }


        modalTitle.textContent =
            title;


        modalDetails.textContent =
            `${category.charAt(0).toUpperCase() + category.slice(1)} • PIXORA`;


        const id =
            wallpaperID(card);


        modalLike.dataset.cardId =
            id;


        modalLike.textContent =
            likedWallpapers.includes(id)
                ? "♥ Liked"
                : "♡ Like";


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


    function closePreview() {

        previewModal.classList.remove(
            "active"
        );

        previewModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";

        currentCard = null;

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

                    openPreview(card);

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


    const backdrop =
        document.querySelector(
            ".modal-backdrop"
        );


    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closePreview
        );

    }


    /* =========================
       MODAL LIKE
    ========================= */

    if (modalLike) {

        modalLike.addEventListener(
            "click",
            () => {

                if (!currentCard)
                    return;


                const id =
                    wallpaperID(currentCard);


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


                modalLike.textContent =
                    likedWallpapers.includes(id)
                        ? "♥ Liked"
                        : "♡ Like";


                const cardLike =
                    currentCard.querySelector(
                        ".like-btn"
                    );


                if (cardLike) {

                    updateLikeButton(
                        currentCard,
                        cardLike
                    );

                }

            }
        );

    }


    /* =========================
       REAL DOWNLOAD
    ========================= */

    async function downloadWallpaper(card) {

        const image =
            card.dataset.image;


        if (!image) {

            alert(
                "This wallpaper does not have an image file yet."
            );

            return;

        }


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


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                `${card.dataset.title || "pixora-wallpaper"}.jpeg`;


            document.body.appendChild(link);

            link.click();

            link.remove();


            URL.revokeObjectURL(url);

        } catch (error) {

            /*
             If the browser blocks the fetch,
             open the image instead.
            */

            window.open(
                image,
                "_blank"
            );

        }

    }


    document.querySelectorAll(
        ".download-btn"
    ).forEach(button => {

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
                        "No wallpapers found."
                    );

                    return;

                }


                const random =
                    visibleCards[
                        Math.floor(
                            Math.random() *
                            visibleCards.length
                        )
                    ];


                openPreview(random);

            }
        );

    }


    /* =========================
       BOTTOM NAV
    ========================= */

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const targetId =
                    item.dataset.target;


                if (
                    targetId === "home"
                ) {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                } else {

                    const target =
                        document.getElementById(
                            targetId
                        );

                    if (target) {

                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                }


                navItems.forEach(
                    nav =>
                        nav.classList.remove(
                            "active"
                        )
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

                closePreview();

                searchPanel?.classList.remove(
                    "active"
                );

            }

        }
    );


    /* =========================
       START
    ========================= */

    filterWallpapers();

    console.log(
        "PIXORA is running 🚀"
    );

});
