/*
=========================================================
 PIXORA — UI FIXES + DOWNLOAD OPTIONS + CREATOR CHANNEL
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const supabase = window.pixoraSupabase;

    if (!supabase) {
        console.error("PIXORA: Supabase client not found.");
        return;
    }

    /*
    =====================================================
    HELPERS
    =====================================================
    */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getWallpaperId(card) {
        return (
            card?.dataset?.wallpaperId ||
            card?.getAttribute("data-wallpaper-id") ||
            ""
        );
    }

    function findWallpaper(id) {
        const possibleArrays = [
            window.pixoraWallpapers,
            window.wallpapers,
            window.PIXORA_WALLPAPERS
        ];

        for (const list of possibleArrays) {
            if (!Array.isArray(list)) continue;

            const found = list.find(
                item => String(item?.id ?? "") === String(id)
            );

            if (found) return found;
        }

        return null;
    }

    function getImageFromCard(card) {
        const img = card?.querySelector("img");

        return img?.src || "";
    }

    function getImageFromWallpaper(item) {
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

    /*
    =====================================================
    CATEGORY FIX
    =====================================================
    */

    function fixCategories() {
        document
            .querySelectorAll(".category-chip")
            .forEach(button => {
                button.classList.add("category-btn");
            });
    }

    /*
    =====================================================
    WALLPAPER CARD BUTTONS
    =====================================================
    */

    function addCardControls() {
        const cards = document.querySelectorAll(
            ".wallpaper-card"
        );

        cards.forEach(card => {
            if (
                card.querySelector(
                    ".pixora-card-controls"
                )
            ) {
                return;
            }

            const id = getWallpaperId(card);

            if (!id) return;

            const imageWrap =
                card.querySelector(
                    ".wallpaper-image-wrap"
                );

            if (!imageWrap) return;

            const controls =
                document.createElement("div");

            controls.className =
                "pixora-card-controls";

            controls.innerHTML = `
                <button
                    type="button"
                    class="pixora-card-action pixora-view-button"
                    data-pixora-view="${escapeHtml(id)}"
                    aria-label="View wallpaper"
                    title="View"
                >
                    👁
                </button>

                <button
                    type="button"
                    class="pixora-card-action pixora-download-button"
                    data-pixora-download="${escapeHtml(id)}"
                    aria-label="Download wallpaper"
                    title="Download"
                >
                    ↓
                </button>
            `;

            imageWrap.appendChild(controls);

            /*
            ---------------------------------------------
            CHANNEL BUTTON
            ---------------------------------------------
            */

            const item = findWallpaper(id);

            const creatorId =
                item?.user_id ||
                item?.creator_id ||
                "";

            if (creatorId) {
                const channelButton =
                    document.createElement("button");

                channelButton.type = "button";

                channelButton.className =
                    "pixora-channel-button";

                channelButton.innerHTML =
                    "Channel";

                channelButton.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        event.stopPropagation();

                        window.location.href =
                            `creator.html?id=${encodeURIComponent(
                                creatorId
                            )}`;
                    }
                );

                const overlay =
                    card.querySelector(
                        ".wallpaper-card-overlay"
                    );

                if (overlay) {
                    overlay.appendChild(
                        channelButton
                    );
                } else {
                    card.appendChild(
                        channelButton
                    );
                }
            }
        });
    }

    /*
    =====================================================
    DOWNLOAD MODAL
    =====================================================
    */

    let currentDownloadImage = "";
    let currentDownloadTitle = "PIXORA-Wallpaper";

    function createDownloadModal() {
        if (
            document.getElementById(
                "pixoraDownloadModal"
            )
        ) {
            return;
        }

        const modal =
            document.createElement("div");

        modal.id =
            "pixoraDownloadModal";

        modal.className =
            "pixora-download-modal";

        modal.hidden = true;

        modal.innerHTML = `
            <div
                class="pixora-download-backdrop"
                data-download-close
            ></div>

            <div
                class="pixora-download-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pixoraDownloadTitle"
            >

                <button
                    type="button"
                    class="pixora-download-close"
                    data-download-close
                    aria-label="Close download options"
                >
                    ×
                </button>

                <div class="pixora-download-heading">
                    <span class="pixora-download-label">
                        PIXORA
                    </span>

                    <h2 id="pixoraDownloadTitle">
                        Download wallpaper
                    </h2>

                    <p>
                        Choose how you want your wallpaper.
                    </p>
                </div>

                <div class="pixora-download-group">

                    <h3>Aspect ratio</h3>

                    <div class="pixora-option-grid">

                        <button
                            type="button"
                            class="pixora-option active"
                            data-ratio="original"
                        >
                            <strong>Original</strong>
                            <span>Keep original</span>
                        </button>

                        <button
                            type="button"
                            class="pixora-option"
                            data-ratio="9:16"
                        >
                            <strong>9:16</strong>
                            <span>Phone</span>
                        </button>

                        <button
                            type="button"
                            class="pixora-option"
                            data-ratio="16:9"
                        >
                            <strong>16:9</strong>
                            <span>Landscape</span>
                        </button>

                        <button
                            type="button"
                            class="pixora-option"
                            data-ratio="1:1"
                        >
                            <strong>1:1</strong>
                            <span>Square</span>
                        </button>

                        <button
                            type="button"
                            class="pixora-option"
                            data-ratio="4:5"
                        >
                            <strong>4:5</strong>
                            <span>Portrait</span>
                        </button>

                    </div>
                </div>

                <div class="pixora-download-group">

                    <h3>Quality</h3>

                    <div class="pixora-quality-list">

                        <button
                            type="button"
                            class="pixora-quality active"
                            data-quality="original"
                        >
                            <strong>Original quality</strong>
                            <span>Best available quality</span>
                        </button>

                        <button
                            type="button"
                            class="pixora-quality"
                            data-quality="high"
                        >
                            <strong>High</strong>
                            <span>Large phone wallpaper</span>
                        </button>

                        <button
                            type="button"
                            class="pixora-quality"
                            data-quality="standard"
                        >
                            <strong>Standard</strong>
                            <span>Smaller download</span>
                        </button>

                    </div>
                </div>

                <button
                    type="button"
                    id="pixoraStartDownload"
                    class="pixora-download-main"
                >
                    Download wallpaper
                </button>

                <p
                    id="pixoraDownloadStatus"
                    class="pixora-download-status"
                ></p>

            </div>
        `;

        document.body.appendChild(modal);

        modal
            .querySelectorAll("[data-download-close]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    closeDownloadModal
                );
            });

        modal
            .querySelectorAll("[data-ratio]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        modal
                            .querySelectorAll(
                                "[data-ratio]"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );

                        button.classList.add(
                            "active"
                        );
                    }
                );
            });

        modal
            .querySelectorAll("[data-quality]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        modal
                            .querySelectorAll(
                                "[data-quality]"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );

                        button.classList.add(
                            "active"
                        );
                    }
                );
            });

        document
            .getElementById(
                "pixoraStartDownload"
            )
            .addEventListener(
                "click",
                processDownload
            );
    }

    function openDownloadModal(
        image,
        title
    ) {
        createDownloadModal();

        currentDownloadImage = image;
        currentDownloadTitle =
            title || "PIXORA-Wallpaper";

        const modal =
            document.getElementById(
                "pixoraDownloadModal"
            );

        const status =
            document.getElementById(
                "pixoraDownloadStatus"
            );

        if (status) {
            status.textContent = "";
        }

        modal.hidden = false;

        document.body.classList.add(
            "pixora-modal-open"
        );
    }

    function closeDownloadModal() {
        const modal =
            document.getElementById(
                "pixoraDownloadModal"
            );

        if (!modal) return;

        modal.hidden = true;

        document.body.classList.remove(
            "pixora-modal-open"
        );
    }

    /*
    =====================================================
    IMAGE PROCESSING
    =====================================================
    */

    function calculateCrop(
        width,
        height,
        ratio
    ) {
        if (ratio === "original") {
            return {
                width,
                height
            };
        }

        const parts =
            ratio.split(":");

        const targetRatio =
            Number(parts[0]) /
            Number(parts[1]);

        const currentRatio =
            width / height;

        let cropWidth = width;
        let cropHeight = height;

        if (currentRatio > targetRatio) {
            cropWidth =
                Math.round(
                    height * targetRatio
                );
        } else {
            cropHeight =
                Math.round(
                    width / targetRatio
                );
        }

        return {
            width: cropWidth,
            height: cropHeight
        };
    }

    function qualityMultiplier(
        quality
    ) {
        if (quality === "standard") {
            return 0.55;
        }

        if (quality === "high") {
            return 0.8;
        }

        return 1;
    }

    async function processDownload() {
        if (!currentDownloadImage) {
            return;
        }

        const modal =
            document.getElementById(
                "pixoraDownloadModal"
            );

        const status =
            document.getElementById(
                "pixoraDownloadStatus"
            );

        const ratio =
            modal.querySelector(
                "[data-ratio].active"
            )?.dataset.ratio ||
            "original";

        const quality =
            modal.querySelector(
                "[data-quality].active"
            )?.dataset.quality ||
            "original";

        const button =
            document.getElementById(
                "pixoraStartDownload"
            );

        try {
            button.disabled = true;

            button.textContent =
                "Preparing download...";

            if (status) {
                status.textContent =
                    "Preparing your wallpaper.";
            }

            const image =
                new Image();

            image.crossOrigin =
                "anonymous";

            image.src =
                currentDownloadImage;

            await new Promise(
                (resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = reject;
                }
            );

            const sourceWidth =
                image.naturalWidth;

            const sourceHeight =
                image.naturalHeight;

            const crop =
                calculateCrop(
                    sourceWidth,
                    sourceHeight,
                    ratio
                );

            const multiplier =
                qualityMultiplier(
                    quality
                );

            const finalWidth =
                Math.max(
                    1,
                    Math.round(
                        crop.width *
                            multiplier
                    )
                );

            const finalHeight =
                Math.max(
                    1,
                    Math.round(
                        crop.height *
                            multiplier
                    )
                );

            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                finalWidth;

            canvas.height =
                finalHeight;

            const context =
                canvas.getContext(
                    "2d"
                );

            context.imageSmoothingEnabled =
                true;

            context.imageSmoothingQuality =
                "high";

            const sourceX =
                (sourceWidth -
                    crop.width) /
                2;

            const sourceY =
                (sourceHeight -
                    crop.height) /
                2;

            context.drawImage(
                image,
                sourceX,
                sourceY,
                crop.width,
                crop.height,
                0,
                0,
                finalWidth,
                finalHeight
            );

            const blob =
                await new Promise(
                    resolve =>
                        canvas.toBlob(
                            resolve,
                            "image/jpeg",
                            0.92
                        )
                );

            if (!blob) {
                throw new Error(
                    "Could not create image."
                );
            }

            const blobUrl =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href =
                blobUrl;

            const safeTitle =
                currentDownloadTitle
                    .replace(
                        /[^a-z0-9]+/gi,
                        "-"
                    )
                    .replace(
                        /^-+|-+$/g,
                        ""
                    )
                    .toLowerCase() ||
                "pixora-wallpaper";

            const ratioName =
                ratio === "original"
                    ? "original"
                    : ratio.replace(
                          ":",
                          "x"
                      );

            link.download =
                `${safeTitle}-${ratioName}.jpg`;

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            setTimeout(() => {
                URL.revokeObjectURL(
                    blobUrl
                );
            }, 3000);

            if (status) {
                status.textContent =
                    "Download started.";
            }

            button.textContent =
                "Download again";

        } catch (error) {
            console.error(
                "PIXORA download error:",
                error
            );

            if (status) {
                status.textContent =
                    "This image cannot be processed here. Try Original quality.";
            }

            button.textContent =
                "Try again";
        }

        button.disabled = false;
    }

    /*
    =====================================================
    CLICK EVENTS
    =====================================================
    */

    document.addEventListener(
        "click",
        event => {
            const viewButton =
                event.target.closest(
                    "[data-pixora-view]"
                );

            const downloadButton =
                event.target.closest(
                    "[data-pixora-download]"
                );

            if (
                viewButton ||
                downloadButton
            ) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (viewButton) {
                const card =
                    viewButton.closest(
                        ".wallpaper-card"
                    );

                const id =
                    viewButton.dataset
                        .pixoraView;

                if (card) {
    card.click();
}

return;
}

return;
            }

            if (downloadButton) {
                const card =
                    downloadButton.closest(
                        ".wallpaper-card"
                    );

                const id =
                    downloadButton.dataset
                        .pixoraDownload;

                const item =
                    findWallpaper(id);

                const image =
                    getImageFromWallpaper(
                        item
                    ) ||
                    getImageFromCard(
                        card
                    );

                if (!image) {
                    alert(
                        "Wallpaper image not found."
                    );
                    return;
                }

                const title =
                    item?.title ||
                    item?.name ||
                    "PIXORA-Wallpaper";

                openDownloadModal(
                    image,
                    title
                );
            }
        },
        true
    );

    /*
    =====================================================
    OBSERVER
    =====================================================
    */

    function refreshUI() {
        fixCategories();
        addCardControls();
    }

    let uiRefreshQueued = false;

const queueUIRefresh = () => {
    if (uiRefreshQueued) return;

    uiRefreshQueued = true;

    requestAnimationFrame(() => {
        uiRefreshQueued = false;
        refreshUI();
    });
};

const observer =
    new MutationObserver(
        mutations => {
            if (
                mutations.some(
                    mutation =>
                        mutation.addedNodes.length > 0
                )
            ) {
                queueUIRefresh();
            }
        }
    );

[
    document.getElementById("categoryList"),
    document.getElementById("wallpaperGrid"),
    document.getElementById("trendingGrid")
]
    .filter(Boolean)
    .forEach(target => {
        observer.observe(target, {
            childList: true,
            subtree: true
        });
    });

createDownloadModal();

refreshUI();

    /*
    =====================================================
    ESC KEY
    =====================================================
    */

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape"
            ) {
                closeDownloadModal();
            }
        }
    );

    console.log(
        "PIXORA UI fixes loaded."
    );
});
