/* =========================================================
   PIXORA — UNIFIED FRONTEND ENGINE
   Wallpapers + Videos + Auth + User Uploads + Random Feed
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
        document.getElementById("showUploadWallpaperBtn");

    const showUploadVideoBtn =
        document.getElementById("showUploadVideoBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    /* Upload panel */

    const userUploadPanel =
        document.getElementById("userUploadPanel");

    const uploadWallpaperTab =
        document.getElementById("uploadWallpaperTab");

    const uploadVideoTab =
        document.getElementById("uploadVideoTab");

    /* Wallpaper upload */

    const wallpaperUploadForm =
        document.getElementById("wallpaperUploadForm");

    const wallpaperTitle =
        document.getElementById("wallpaperTitle");

    const wallpaperCategory =
        document.getElementById("wallpaperCategory");

    const wallpaperTags =
        document.getElementById("wallpaperTags");

    const wallpaperFile =
        document.getElementById("wallpaperFile");

    const wallpaperRightsConfirmation =
        document.getElementById("wallpaperRightsConfirmation");

    const submitWallpaperUpload =
        document.getElementById("submitWallpaperUpload");

    const wallpaperUploadMessage =
        document.getElementById("wallpaperUploadMessage");

    /* Video upload */

    const videoUploadForm =
        document.getElementById("videoUploadForm");

    const videoTitle =
        document.getElementById("videoTitle");

    const videoCategory =
        document.getElementById("videoCategory");

    const videoTags =
        document.getElementById("videoTags");

    const videoThumbnail =
        document.getElementById("videoThumbnail");

    const videoFile =
        document.getElementById("videoFile");

    const videoRightsConfirmation =
        document.getElementById("videoRightsConfirmation");

    const submitVideoUpload =
        document.getElementById("submitVideoUpload");

    const videoUploadMessage =
        document.getElementById("videoUploadMessage");

    /* My uploads */

    const myUploadsGrid =
        document.getElementById("myUploadsGrid");

    const myUploadsEmpty =
        document.getElementById("myUploadsEmpty");

    /* Wallpaper preview */

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

    /* Video preview */

    const videoPreviewModal =
        document.getElementById("videoPreviewModal");

    const videoModalClose =
        document.getElementById("videoModalClose");

    const videoPlayer =
        document.getElementById("videoPlayer");

    const videoModalTitle =
        document.getElementById("videoModalTitle");

    const videoModalDetails =
        document.getElementById("videoModalDetails");

    const videoModalDownload =
        document.getElementById("videoModalDownload");

    /* Delete */

    const deleteConfirmModal =
        document.getElementById("deleteConfirmModal");

    const deleteConfirmClose =
        document.getElementById("deleteConfirmClose");

    const deleteConfirmTitle =
        document.getElementById("deleteConfirmTitle");

    const cancelDeleteBtn =
        document.getElementById("cancelDeleteBtn");

    const confirmDeleteBtn =
        document.getElementById("confirmDeleteBtn");

    const navItems =
        document.querySelectorAll(".nav-item");


    /* =====================================================
       STATE
       ===================================================== */

    const INITIAL_LOAD = 12;
    const HOME_FEED_INITIAL = 8;
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

    try {
        likes =
            JSON.parse(
                localStorage.getItem("pixoraLikes")
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

        if (!text) return "";

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );
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
                    Math.random() * (i + 1)
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
        return String(name || "file")
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
            Array.isArray(item.keywords)
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
        element.style.display = "block";

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
                    index + marker.length
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
            `${userId}/${Date.now()}-${fileSafeName(file.name)}`;

        const {
            error
        } =
            await supabase.storage
                .from(bucket)
                .upload(
                    path,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType:
                            file.type ||
                            undefined
                    }
                );

        if (error) {
            throw error;
        }

        const {
            data
        } =
            supabase.storage
                .from(bucket)
                .getPublicUrl(path);

        return {
            path,
            url: data.publicUrl
        };
    }


    /* =====================================================
       AUTH
       ===================================================== */

    async function getSessionUser() {

        const {
            data,
            error
        } =
            await supabase.auth.getSession();

        if (error) {
            console.error(
                "PIXORA session error:",
                error
            );

            return null;
        }

        return (
            data.session?.user ||
            null
        );
    }


    async function isAdmin(
        user = currentUser
    ) {

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
            console.warn(
                "PIXORA admin check:",
                error.message
            );

            return false;
        }

        return Boolean(data);
    }


    async function updateAuthUI() {

        if (!currentUser) {

            if (authButton) {
                authButton.textContent =
                    "Login / Sign Up";
            }

            if (accountNavBtn) {
                accountNavBtn.hidden = true;
            }

            if (accountSection) {
                accountSection.hidden = true;
            }

            if (userUploadPanel) {
                userUploadPanel.hidden = true;
            }

            return;
        }


        if (authButton) {
            authButton.textContent =
                "My Account";
        }


        if (accountNavBtn) {
            accountNavBtn.hidden = false;
        }


        if (accountSection) {
            accountSection.hidden = false;
        }


        const displayName =
            currentUser
                .user_metadata
                ?.display_name ||
            currentUser.email
                ?.split("@")[0] ||
            "PIXORA User";


        if (accountUserName) {
            accountUserName.textContent =
                displayName;
        }


        if (accountUserEmail) {
            accountUserEmail.textContent =
                currentUser.email || "";
        }


        const admin =
            await isAdmin();


        if (
            admin &&
            authButton
        ) {
            authButton.textContent =
                "Admin";
        }


        await loadMyUploads();
    }


    if (authButton) {

        authButton.addEventListener(
            "click",
            async () => {

                if (!currentUser) {

                    window.location.href =
                        "login.html";

                    return;
                }


                if (await isAdmin()) {

                    window.location.href =
                        "admin.html";

                } else {

                    scrollToSection(
                        "account"
                    );
                }
            }
        );
    }


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                await supabase.auth.signOut();

                currentUser = null;

                await updateAuthUI();

                scrollToSection("home");
            }
        );
    }


    supabase.auth.onAuthStateChange(
        async (_event, session) => {

            currentUser =
                session?.user || null;

            await updateAuthUI();
        }
    );


    /* =====================================================
       CATEGORIES
       ===================================================== */

    async function loadCategories() {

        const {
            data,
            error
        } =
            await supabase
                .from("categories")
                .select("id,name")
                .order(
                    "name",
                    {
                        ascending: true
                    }
                );

        if (error) {

            console.error(
                "PIXORA categories error:",
                error
            );

            return;
        }


        categories =
            Array.isArray(data)
                ? data
                : [];


        renderCategoryButtons();

        populateUploadCategories();
    }


    function renderCategoryButtons() {

        if (!categoryList) return;

        categoryList.innerHTML = "";


        const all =
            document.createElement(
                "button"
            );

        all.type = "button";

        all.className =
            "category-btn active";

        all.dataset.category =
            "all";

        all.textContent =
            "All";

        categoryList.appendChild(all);


        categories.forEach(
            category => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type = "button";

                button.className =
                    "category-btn";

                button.dataset.category =
                    normalize(
                        category.name
                    );

                button.textContent =
                    category.name;

                categoryList.appendChild(
                    button
                );
            }
        );


        bindCategoryButtons();
    }


    function populateUploadCategories() {

        [
            wallpaperCategory,
            videoCategory
        ].forEach(select => {

            if (
                !select ||
                select.tagName !==
                    "SELECT"
            ) {
                return;
            }


            const current =
                select.value;


            select.innerHTML =
                '<option value="">Choose category</option>';


            categories.forEach(
                category => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        category.name;

                    option.textContent =
                        category.name;

                    select.appendChild(
                        option
                    );
                }
            );


            if (current) {
                select.value =
                    current;
            }
        });
    }


    function bindCategoryButtons() {

        document
            .querySelectorAll(
                ".category-btn"
            )
            .forEach(button => {

                button.onclick =
                    () => {

                        activeCategory =
                            normalize(
                                button.dataset.category ||
                                "all"
                            );

                        displayedLimit =
                            INITIAL_LOAD;


                        document
                            .querySelectorAll(
                                ".category-btn"
                            )
                            .forEach(
                                btn => {

                                    btn.classList.toggle(
                                        "active",
                                        btn ===
                                            button
                                    );
                                }
                            );


                        renderWallpapers();

                        renderVideos();
                    };
            });
    }


    /* =====================================================
       WALLPAPERS
       ===================================================== */

    async function loadWallpapers() {

        const {
            data,
            error
        } =
            await supabase
                .from("wallpapers")
                .select(
                    "id,created_at,title,category,tags,image_url,views,downloads,status,user_id"
                )
                .eq(
                    "status",
                    "approved"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "PIXORA wallpapers error:",
                error
            );

            return;
        }


        wallpapers =
            Array.isArray(data)
                ? data
                : [];


        /*
         * Randomize only when fresh
         * data is loaded.
         * This prevents cards from
         * jumping around every render.
         */

        randomizedFeed =
            shuffle(
                wallpapers
            );


        renderTrending();

        renderWallpapers();
    }


    function getFilteredWallpapers() {

        return wallpapers.filter(
            item => {

                const category =
                    normalize(
                        item.category
                    );


                const categoryMatch =
                    activeCategory ===
                        "all" ||
                    category ===
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


    function createWallpaperCard(
        item
    ) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "wallpaper-card";

        card.dataset.id =
            wallpaperId(item);


        const art =
            document.createElement(
                "div"
            );

        art.className =
            "wallpaper-art";


        const url =
            imageUrl(item);


        /*
         * IMPORTANT:
         * Use a real IMG element
         * instead of only a CSS
         * background image.
         */

        if (url) {

            const img =
                document.createElement(
                    "img"
                );

            img.className =
                "wallpaper-image";

            img.src = url;

            img.alt =
                item.title ||
                "PIXORA wallpaper";

            img.loading =
                "lazy";

            img.decoding =
                "async";


            img.onerror =
                () => {

                    img.remove();

                    art.classList.add(
                        "art-placeholder"
                    );
                };


            art.appendChild(img);

        } else {

            art.classList.add(
                "art-placeholder"
            );
        }


        /* Like */

        const like =
            document.createElement(
                "button"
            );

        like.className =
            "like-btn";

        like.type = "button";

        like.textContent =
            likes[
                wallpaperId(item)
            ]
                ? "♥"
                : "♡";

        like.classList.toggle(
            "liked",
            Boolean(
                likes[
                    wallpaperId(item)
                ]
            )
        );


        like.onclick =
            event => {

                event.stopPropagation();

                const id =
                    wallpaperId(item);

                likes[id] =
                    !likes[id];

                saveLikes();


                like.textContent =
                    likes[id]
                        ? "♥"
                        : "♡";


                like.classList.toggle(
                    "liked",
                    likes[id]
                );
            };


        /* Preview */

        const preview =
            document.createElement(
                "button"
            );

        preview.className =
            "preview-btn";

        preview.type = "button";

        preview.textContent =
            "👁";


        preview.onclick =
            event => {

                event.stopPropagation();

                openWallpaperPreview(
                    item
                );
            };


        art.appendChild(like);

        art.appendChild(preview);


        /* Download */

        if (url) {

            const download =
                document.createElement(
                    "button"
                );

            download.className =
                "download-btn";

            download.type = "button";

            download.textContent =
                "↓";


            download.onclick =
                event => {

                    event.stopPropagation();

                    downloadWallpaper(
                        item
                    );
                };


            art.appendChild(
                download
            );
        }


        /* Info */

        const info =
            document.createElement(
                "div"
            );

        info.className =
            "wallpaper-info";


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
                        item.category ||
                        "Other"
                    )
                )}
            </span>
        `;


        art.appendChild(info);

        card.appendChild(art);


        card.onclick =
            event => {

                if (
                    !event.target.closest(
                        "button"
                    )
                ) {

                    openWallpaperPreview(
                        item
                    );
                }
            };


        return card;
    }


    function renderWallpapers() {

        if (!wallpaperGrid) {
            return;
        }


        const filtered =
            activeCategory ===
                "all" &&
            !searchTerm

                ? randomizedFeed

                : getFilteredWallpapers();


        wallpaperGrid.innerHTML =
            "";


        const visible =
            filtered.slice(
                0,
                displayedLimit
            );


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
                    filtered.length === 1
                        ? "wallpaper"
                        : "wallpapers"
                }`;
        }


        if (emptyState) {

            emptyState.hidden =
                filtered.length !== 0;
        }


        if (loadMoreContainer) {

            loadMoreContainer.style.display =
                filtered.length >
                displayedLimit
                    ? ""
                    : "none";
        }
    }


    function renderTrending() {

        if (!trendingGrid) {
            return;
        }


        const trending =
            [...wallpapers]
                .sort(
                    (a, b) =>
                        Number(
                            b.views || 0
                        ) -
                        Number(
                            a.views || 0
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
       VIDEOS
       ===================================================== */

    async function loadVideos() {

        const {
            data,
            error
        } =
            await supabase
                .from("videos")
                .select(
                    "id,created_at,title,category,tags,video_url,thumbnail_url,views,downloads,status,user_id"
                )
                .eq(
                    "status",
                    "approved"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "PIXORA videos error:",
                error
            );

            return;
        }


        videos =
            Array.isArray(data)
                ? data
                : [];


        renderVideos();
    }


    function getFilteredVideos() {

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


    function createVideoCard(
        item
    ) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "video-card";


        const thumb =
            document.createElement(
                "div"
            );

        thumb.className =
            "video-thumb";


        if (item.thumbnail_url) {

            const img =
                document.createElement(
                    "img"
                );

            img.src =
                item.thumbnail_url;

            img.alt =
                item.title ||
                "PIXORA video";

            img.loading =
                "lazy";


            img.onerror =
                () => {

                    img.remove();
                };


            thumb.appendChild(img);
        }


        const play =
            document.createElement(
                "span"
            );

        play.className =
            "video-play";

        play.textContent =
            "▶";


        thumb.appendChild(play);


        const info =
            document.createElement(
                "div"
            );

        info.className =
            "video-info";


        info.innerHTML = `
            <h3>
                ${escapeHtml(
                    item.title ||
                    "Untitled video"
                )}
            </h3>

            <span>
                ${escapeHtml(
                    capitalize(
                        item.category ||
                        "Other"
                    )
                )}
            </span>
        `;


        card.appendChild(thumb);

        card.appendChild(info);


        card.onclick =
            () => {

                openVideoPreview(
                    item
                );
            };


        return card;
    }


    function renderVideos() {

        if (!videoGrid) {
            return;
        }


        const filtered =
            getFilteredVideos();


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
                    filtered.length === 1
                        ? "video"
                        : "videos"
                }`;
        }


        if (videoEmptyState) {

            videoEmptyState.hidden =
                filtered.length !== 0;
        }
    }


    function openVideoPreview(
        item
    ) {

        if (
            !videoPreviewModal ||
            !videoPlayer
        ) {
            return;
        }


        currentVideo =
            item;


        if (videoModalTitle) {

            videoModalTitle.textContent =
                item.title ||
                "PIXORA Video";
        }


        if (videoModalDetails) {

            videoModalDetails.textContent =
                `PIXORA • ${capitalize(
                    item.category ||
                    "Video"
                )}`;
        }


        videoPlayer.src =
            item.video_url;


        videoPlayer.poster =
            item.thumbnail_url ||
            "";


        videoPlayer.load();


        videoPreviewModal.classList.add(
            "active"
        );


        videoPreviewModal.setAttribute(
            "aria-hidden",
            "false"
        );


        body.style.overflow =
            "hidden";
    }


    function closeVideoPreview() {

        if (
            !videoPreviewModal
        ) {
            return;
        }


        if (videoPlayer) {

            videoPlayer.pause();

            videoPlayer.removeAttribute(
                "src"
            );

            videoPlayer.load();
        }


        videoPreviewModal.classList.remove(
            "active"
        );


        videoPreviewModal.setAttribute(
            "aria-hidden",
            "true"
        );


        body.style.overflow =
            "";


        currentVideo =
            null;
    }


    if (videoModalClose) {

        videoModalClose.onclick =
            closeVideoPreview;
    }


    if (videoModalDownload) {

        videoModalDownload.onclick =
            () => {

                if (
                    !currentVideo?.video_url
                ) {
                    return;
                }


                const link =
                    document.createElement(
                        "a"
                    );

                link.href =
                    currentVideo.video_url;

                link.target =
                    "_blank";

                link.rel =
                    "noopener";


                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();
            };
    }


    /* =====================================================
       WALLPAPER PREVIEW
       ===================================================== */

    function openWallpaperPreview(
        item
    ) {

        if (!previewModal) {
            return;
        }


        currentWallpaper =
            item;


        if (modalTitle) {

            modalTitle.textContent =
                item.title ||
                "PIXORA Wallpaper";
        }


        if (modalDetails) {

            modalDetails.textContent =
                `PIXORA • ${capitalize(
                    item.category ||
                    "Wallpaper"
                )}`;
        }


        if (modalArt) {

            modalArt.innerHTML =
                "";

            modalArt.classList.remove(
                "art-placeholder"
            );


            const url =
                imageUrl(item);


            if (url) {

                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    url;

                img.alt =
                    item.title ||
                    "PIXORA wallpaper";

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
        }


        const liked =
            Boolean(
                likes[
                    wallpaperId(item)
                ]
            );


        if (modalLike) {

            modalLike.textContent =
                liked
                    ? "♥"
                    : "♡";


            modalLike.classList.toggle(
                "liked",
                liked
            );
        }


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


    function closeWallpaperPreview() {

        if (!previewModal) {
            return;
        }


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
    }


    if (modalClose) {

        modalClose.onclick =
            closeWallpaperPreview;
    }


    if (modalBackdrop) {

        modalBackdrop.onclick =
            closeWallpaperPreview;
    }


    if (modalLike) {

        modalLike.onclick =
            () => {

                if (
                    !currentWallpaper
                ) {
                    return;
                }


                const id =
                    wallpaperId(
                        currentWallpaper
                    );


                likes[id] =
                    !likes[id];


                saveLikes();


                modalLike.textContent =
                    likes[id]
                        ? "♥"
                        : "♡";


                modalLike.classList.toggle(
                    "liked",
                    likes[id]
                );


                renderWallpapers();

                renderTrending();
            };
    }


    async function downloadWallpaper(
        item
    ) {

        const url =
            imageUrl(item);


        if (!url) {
            return;
        }


        try {

            const response =
                await fetch(url);


            if (!response.ok) {
                throw new Error(
                    "Image unavailable"
                );
            }


            const blob =
                await response.blob();


            const objectUrl =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                objectUrl;


            link.download =
                `${fileSafeName(
                    item.title ||
                    "pixora-wallpaper"
                ).toLowerCase()}-pixora`;


            document.body.appendChild(
                link
            );


            link.click();

            link.remove();


            setTimeout(
                () =>
                    URL.revokeObjectURL(
                        objectUrl
                    ),
                1000
            );

        } catch {

            window.open(
                url,
                "_blank",
                "noopener"
            );
        }
    }


    if (modalDownload) {

        modalDownload.onclick =
            () => {

                if (
                    currentWallpaper
                ) {

                    downloadWallpaper(
                        currentWallpaper
                    );
                }
            };
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    function performSearch() {

        searchTerm =
            normalize(
                searchInput?.value
            );


        displayedLimit =
            INITIAL_LOAD;


        renderWallpapers();

        renderVideos();
    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            performSearch
        );
    }


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


        document
            .querySelectorAll(
                ".category-btn"
            )
            .forEach(btn => {

                btn.classList.toggle(
                    "active",
                    normalize(
                        btn.dataset.category
                    ) === "all"
                );
            });


        renderWallpapers();

        renderVideos();
    }


    if (clearSearch) {

        clearSearch.onclick =
            resetAllFilters;
    }


    if (resetFilters) {

        resetFilters.onclick =
            resetAllFilters;
    }


    if (loadMoreBtn) {

        loadMoreBtn.onclick =
            () => {

                displayedLimit +=
                    LOAD_MORE_AMOUNT;

                renderWallpapers();
            };
    }


    if (randomBtn) {

        randomBtn.onclick =
            () => {

                const available =
                    getFilteredWallpapers();


                if (
                    !available.length
                ) {

                    alert(
                        "No wallpapers available for the current filter."
                    );

                    return;
                }


                const random =
                    available[
                        Math.floor(
                            Math.random() *
                            available.length
                        )
                    ];


                openWallpaperPreview(
                    random
                );
            };
    }


    /* =====================================================
       SEARCH PANEL
       ===================================================== */

    function openSearch() {

        if (!searchPanel) {
            return;
        }


        searchPanel.classList.add(
            "active"
        );


        setTimeout(
            () =>
                searchInput?.focus(),
            100
        );
    }


    function closeSearch() {

        searchPanel?.classList.remove(
            "active"
        );
    }


    if (searchTrigger) {

        searchTrigger.onclick =
            () => {

                searchPanel?.classList.contains(
                    "active"
                )
                    ? closeSearch()
                    : openSearch();
            };
    }


    document.addEventListener(
        "click",
        event => {

            if (
                !searchPanel ||
                !searchTrigger
            ) {
                return;
            }


            if (
                !searchPanel.contains(
                    event.target
                ) &&
                !searchTrigger.contains(
                    event.target
                )
            ) {

                closeSearch();
            }
        }
    );


    /* =====================================================
       THEME
       ===================================================== */

    function updateThemeButton() {

        const light =
            body.classList.contains(
                "light"
            );


        if (themeToggle) {

            themeToggle.setAttribute(
                "aria-pressed",
                String(light)
            );
        }


        const meta =
            document.querySelector(
                'meta[name="theme-color"]'
            );


        if (meta) {

            meta.content =
                light
                    ? "#f4f4f7"
                    : "#0b0b10";
        }
    }


    const savedTheme =
        localStorage.getItem(
            "pixoraTheme"
        );


    if (
        savedTheme ===
        "light"
    ) {

        body.classList.add(
            "light"
        );
    }


    updateThemeButton();


    if (themeToggle) {

        themeToggle.onclick =
            () => {

                body.classList.toggle(
                    "light"
                );


                localStorage.setItem(
                    "pixoraTheme",
                    body.classList.contains(
                        "light"
                    )
                        ? "light"
                        : "dark"
                );


                updateThemeButton();
            };
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


    let currentSlide =
        0;


    let heroTimer =
        null;


    function showSlide(
        index
    ) {

        if (
            !heroSlides.length
        ) {
            return;
        }


        currentSlide =
            (
                index +
                heroSlides.length
            ) %
            heroSlides.length;


        heroSlides.forEach(
            (slide, i) => {

                slide.classList.toggle(
                    "active",
                    i ===
                        currentSlide
                );
            }
        );


        heroDots.forEach(
            (dot, i) => {

                dot.classList.toggle(
                    "active",
                    i ===
                        currentSlide
                );
            }
        );
    }


    heroDots.forEach(
        dot => {

            dot.onclick =
                () => {

                    showSlide(
                        Number(
                            dot.dataset.slide ||
                            0
                        )
                    );


                    clearInterval(
                        heroTimer
                    );


                    heroTimer =
                        setInterval(
                            () =>
                                showSlide(
                                    currentSlide +
                                    1
                                ),
                            5000
                        );
                };
        }
    );


    if (
        heroSlides.length > 1
    ) {

        showSlide(0);


        heroTimer =
            setInterval(
                () =>
                    showSlide(
                        currentSlide +
                        1
                    ),
                5000
            );
    }


    if (exploreBtn) {

        exploreBtn.onclick =
            () =>
                scrollToSection(
                    "new"
                );
    }


    document
        .querySelectorAll(
            "[data-scroll]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    scrollToSection(
                        button.dataset.scroll
                    );
        });


    /* =====================================================
       USER UPLOAD PANEL
       ===================================================== */

    function showUploadPanel(
        type
    ) {

        if (
            !currentUser ||
            !userUploadPanel
        ) {
            return;
        }


        userUploadPanel.hidden =
            false;


        const wallpaperMode =
            type === "wallpaper";


        if (wallpaperUploadForm) {

            wallpaperUploadForm.hidden =
                !wallpaperMode;
        }


        if (videoUploadForm) {

            videoUploadForm.hidden =
                wallpaperMode;
        }


        uploadWallpaperTab?.classList.toggle(
            "active",
            wallpaperMode
        );


        uploadVideoTab?.classList.toggle(
            "active",
            !wallpaperMode
        );


        userUploadPanel.scrollIntoView(
            {
                behavior: "smooth",
                block: "start"
            }
        );
    }


    if (
        showUploadWallpaperBtn
    ) {

        showUploadWallpaperBtn.onclick =
            () =>
                showUploadPanel(
                    "wallpaper"
                );
    }


    if (
        showUploadVideoBtn
    ) {

        showUploadVideoBtn.onclick =
            () =>
                showUploadPanel(
                    "video"
                );
    }


    uploadWallpaperTab?.addEventListener(
        "click",
        () =>
            showUploadPanel(
                "wallpaper"
            )
    );


    uploadVideoTab?.addEventListener(
        "click",
        () =>
            showUploadPanel(
                "video"
            )
    );


    /* =====================================================
       WALLPAPER UPLOAD
       ===================================================== */

    if (wallpaperUploadForm) {

        wallpaperUploadForm.addEventListener(
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


                if (
                    !file ||
                    !wallpaperTitle.value.trim() ||
                    !wallpaperCategory.value.trim()
                ) {

                    setMessage(
                        wallpaperUploadMessage,
                        "Please complete the title, category and image.",
                        true
                    );

                    return;
                }


                if (
                    !wallpaperRightsConfirmation
                        ?.checked
                ) {

                    setMessage(
                        wallpaperUploadMessage,
                        "Please confirm that you own or have permission to upload this wallpaper.",
                        true
                    );

                    return;
                }


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    setMessage(
                        wallpaperUploadMessage,
                        "Please select a valid image file.",
                        true
                    );

                    return;
                }


                try {

                    submitWallpaperUpload.disabled =
                        true;


                    submitWallpaperUpload.textContent =
                        "Uploading...";


                    setMessage(
                        wallpaperUploadMessage,
                        "Uploading wallpaper..."
                    );


                    const uploaded =
                        await uploadToBucket(
                            "wallpapers",
                            file,
                            currentUser.id
                        );


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
                                    wallpaperTitle
                                        .value
                                        .trim(),

                                category:
                                    wallpaperCategory
                                        .value
                                        .trim(),

                                tags:
                                    wallpaperTags
                                        .value
                                        .trim(),

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
                            .from(
                                "wallpapers"
                            )
                            .remove(
                                [uploaded.path]
                            );

                        throw error;
                    }


                    wallpaperUploadForm.reset();


                    setMessage(
                        wallpaperUploadMessage,
                        "✅ Uploaded! Your wallpaper is now waiting for admin review."
                    );


                    await loadMyUploads();

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
    }


    /* =====================================================
       VIDEO UPLOAD
       ===================================================== */

    if (videoUploadForm) {

        videoUploadForm.addEventListener(
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


                if (
                    !file ||
                    !videoTitle.value.trim() ||
                    !videoCategory.value.trim()
                ) {

                    setMessage(
                        videoUploadMessage,
                        "Please complete the title, category and video.",
                        true
                    );

                    return;
                }


                if (
                    !videoRightsConfirmation
                        ?.checked
                ) {

                    setMessage(
                        videoUploadMessage,
                        "Please confirm that you own or have permission to upload this video.",
                        true
                    );

                    return;
                }


                if (
                    !file.type.startsWith(
                        "video/"
                    )
                ) {

                    setMessage(
                        videoUploadMessage,
                        "Please select a valid video file.",
                        true
                    );

                    return;
                }


                try {

                    submitVideoUpload.disabled =
                        true;


                    submitVideoUpload.textContent =
                        "Uploading...";


                    setMessage(
                        videoUploadMessage,
                        "Uploading video..."
                    );


                    const uploadedVideo =
                        await uploadToBucket(
                            "videos",
                            file,
                            currentUser.id
                        );


                    let thumbnailUrl =
                        null;


                    let thumbnailPath =
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


                    const {
                        error
                    } =
                        await supabase
                            .from(
                                "videos"
                            )
                            .insert({

                                user_id:
                                    currentUser.id,

                                title:
                                    videoTitle
                                        .value
                                        .trim(),

                                category:
                                    videoCategory
                                        .value
                                        .trim(),

                                tags:
                                    videoTags
                                        .value
                                        .trim(),

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
                            .from(
                                "videos"
                            )
                            .remove(
                                [
                                    uploadedVideo.path
                                ]
                            );


                        if (
                            thumbnailPath
                        ) {

                            await supabase
                                .storage
                                .from(
                                    "wallpapers"
                                )
                                .remove(
                                    [
                                        thumbnailPath
                                    ]
                                );
                        }


                        throw error;
                    }


                    videoUploadForm.reset();


                    setMessage(
                        videoUploadMessage,
                        "✅ Uploaded! Your video is now waiting for admin review."
                    );


                    await loadMyUploads();

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
    }


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
        ] =
            await Promise.all([

                supabase
                    .from(
                        "wallpapers"
                    )
                    .select(
                        "id,created_at,title,category,image_url,status,user_id"
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
                    .from(
                        "videos"
                    )
                    .select(
                        "id,created_at,title,category,video_url,thumbnail_url,status,user_id"
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


        if (
            wallpaperResult.error
        ) {

            console.error(
                wallpaperResult.error
            );
        }


        if (
            videoResult.error
        ) {

            console.error(
                videoResult.error
            );
        }


        const items = [

            ...(wallpaperResult.data || [])
                .map(
                    item => ({
                        ...item,
                        mediaType:
                            "wallpaper"
                    })
                ),

            ...(videoResult.data || [])
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


                const status =
                    normalize(
                        item.status
                    );


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
                                status
                            )
                        )}
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


        if (
            deleteConfirmTitle
        ) {

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


    if (confirmDeleteBtn) {

        confirmDeleteBtn.onclick =
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
                    } =
                        await supabase
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
                            .remove(
                                [path]
                            );
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


                        if (
                            thumbPath
                        ) {

                            await supabase
                                .storage
                                .from(
                                    "wallpapers"
                                )
                                .remove(
                                    [thumbPath]
                                );
                        }
                    }


                    closeDeleteModal();


                    await loadMyUploads();

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
            };
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


                    if (!target) {
                        return;
                    }


                    navItems.forEach(
                        nav =>
                            nav.classList.toggle(
                                "active",
                                nav ===
                                    item
                            )
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
