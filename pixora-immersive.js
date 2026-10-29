/* PIXORA immersive layer — add-on. Works on top of script.js without changing it.
   1 Masonry layout   3 Full-screen swipe viewer   4 Moods + hide empty categories   5 Hero glow
   To undo: remove this file's <script> and pixora-immersive.css <link> from index.html. */
(function () {
    "use strict";

    /* ---- Moods: edit freely. Each mood is a group of your categories. ---- */
    var MOODS = [
        { id: "dark",   label: "Dark",   cats: ["AMOLED", "Horror", "Space", "Technology", "Gaming"] },
        { id: "calm",   label: "Calm",   cats: ["Nature", "Travel", "Aesthetic", "Animals", "Love"] },
        { id: "energy", label: "Energy", cats: ["Cars", "Sports", "Fitness", "Music"] },
        { id: "dreamy", label: "Dreamy", cats: ["Anime", "Fantasy", "Art", "Cute", "Retro"] },
        { id: "urban",  label: "Urban",  cats: ["Cities", "Luxury", "Movies", "Celebrities", "Schools"] }
    ];
    /* Fallback glow colours (RGB) when an image's colour can't be read. */
    var CAT_RGB = { cars: [60, 130, 255], nature: [50, 190, 120], space: [130, 90, 255], anime: [255, 90, 150],
                    art: [255, 160, 60], cities: [70, 170, 255], sports: [255, 120, 60], amoled: [90, 90, 110] };
    var DEFAULT_RGB = [255, 61, 104];

    var $ = function (id) { return document.getElementById(id); };
    var grid = $("wallpaperGrid"), categoryList = $("categoryList"), resultsCount = $("resultsCount");
    var loadMoreBtn = $("loadMoreBtn"), loadMoreContainer = $("loadMoreContainer");
    var emptyState = $("emptyState"), randomBtn = $("randomBtn");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function norm(v) { return String(v || "").trim().toLowerCase(); }
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    }
    function hash(s) {
        var h = 0; s = String(s);
        for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return h;
    }

    /* =====================================================
       Colour from an image (used for viewer + hero glow)
       Falls back quietly if the image host blocks reading pixels.
       ===================================================== */
    var colorCache = {};
    function dominantColor(src) {
        return new Promise(function (resolve) {
            if (!src) return resolve(null);
            if (colorCache[src] !== undefined) return resolve(colorCache[src]);
            var im = new Image();
            im.crossOrigin = "anonymous";
            im.decoding = "async";
            im.onload = function () {
                var col = null;
                try {
                    var c = document.createElement("canvas");
                    c.width = c.height = 16;
                    var x = c.getContext("2d", { willReadFrequently: true });
                    x.drawImage(im, 0, 0, 16, 16);
                    var d = x.getImageData(0, 0, 16, 16).data;
                    var r = 0, g = 0, b = 0, w = 0;
                    for (var i = 0; i < d.length; i += 4) {
                        var R = d[i], G = d[i + 1], B = d[i + 2];
                        var mx = Math.max(R, G, B), mn = Math.min(R, G, B);
                        var sat = (mx - mn) / (mx || 1), lum = (R + G + B) / 3;
                        var wt = 0.1 + sat * sat * 2 + (lum > 40 && lum < 220 ? 0.3 : 0);
                        r += R * wt; g += G * wt; b += B * wt; w += wt;
                    }
                    col = boost([r / w, g / w, b / w]);
                } catch (e) { col = null; }
                colorCache[src] = col;
                resolve(col);
            };
            im.onerror = function () { colorCache[src] = null; resolve(null); };
            im.src = src;
        });
    }
    function boost(c) {
        var mx = Math.max(c[0], c[1], c[2]) || 1;
        var k = mx < 170 ? 170 / mx : 1;
        return c.map(function (v) { return Math.min(255, Math.round(v * k)); });
    }
    function catColor(cat) { return CAT_RGB[norm(cat)] || DEFAULT_RGB; }

    /* =====================================================
       1. MASONRY
       Every card gets a row span from its real height.
       ===================================================== */
    var ROW = 8, GAP = 12, rafId = 0;

    function ratioFor(natural, id) {
        var r = natural;
        if (!isFinite(r) || r <= 0) r = 0.56;
        r = Math.min(Math.max(r, 0.6), 1.25);
        if (r < 0.78) r = [0.64, 0.74, 0.86][hash(id) % 3];   /* varied heights for portrait images */
        return r;
    }
    function sizeCard(card) {
        var art = card.querySelector(".wallpaper-art");
        var im = card.querySelector("img.wallpaper-image");
        if (!art || card.dataset.pxSized) return;
        card.dataset.pxSized = "1";
        art.style.setProperty("--px-ar", String(ratioFor(0.56, card.dataset.id)));
        if (!im) return;
        function apply() {
            if (im.naturalWidth) {
                art.style.setProperty("--px-ar", String(ratioFor(im.naturalWidth / im.naturalHeight, card.dataset.id)));
                scheduleLayout();
            }
        }
        if (im.complete && im.naturalWidth) apply();
        else im.addEventListener("load", apply, { once: true });
    }
    function scheduleLayout() {
        if (rafId) return;
        rafId = requestAnimationFrame(function () { rafId = 0; layout(); });
    }
    function layout() {
        if (!grid) return;
        var cards = Array.prototype.slice.call(grid.children);
        var heights = cards.map(function (c) {
            return (c.hidden || c.offsetParent === null) ? 0 : c.getBoundingClientRect().height;
        });
        cards.forEach(function (c, i) {
            c.style.gridRowEnd = heights[i] ? "span " + Math.ceil((heights[i] + GAP) / ROW) : "";
        });
    }

    /* =====================================================
       4. CATEGORY COUNTS, EMPTY-CATEGORY HIDING, MOODS
       ===================================================== */
    var wallCounts = null, allCounts = null;
    var activeMood = null, moodRow = null, countOverridden = false;

    function loadCounts() {
        var c = window.pixoraSupabase;
        if (!c || !c.from) return;
        Promise.all([
            c.from("wallpapers").select("category").eq("status", "approved"),
            c.from("videos").select("category").eq("status", "approved")
        ]).then(function (rs) {
            if (!rs[0] || rs[0].error || !rs[0].data) return;      /* on any problem, hide nothing */
            wallCounts = {}; allCounts = {};
            rs[0].data.forEach(function (row) {
                var k = norm(row.category);
                if (k) { wallCounts[k] = (wallCounts[k] || 0) + 1; allCounts[k] = (allCounts[k] || 0) + 1; }
            });
            ((rs[1] && rs[1].data) || []).forEach(function (row) {
                var k = norm(row.category);
                if (k) allCounts[k] = (allCounts[k] || 0) + 1;
            });
            hideEmptyCategories();
            buildMoods();
        }).catch(function () { /* leave everything visible */ });
    }
    function hideEmptyCategories() {
        if (!allCounts || !categoryList) return;
        categoryList.querySelectorAll(".category-btn").forEach(function (b) {
            var k = norm(b.dataset.category);
            if (!k || k === "all") return;
            b.hidden = !(allCounts[k] > 0);
        });
    }

    function buildMoods() {
        if (moodRow || !categoryList || !wallCounts) return;
        var usable = MOODS.filter(function (m) {
            return m.cats.some(function (c) { return wallCounts[norm(c)] > 0; });
        });
        if (usable.length < 2) return;
        moodRow = el("div", "px-moods");
        moodRow.setAttribute("role", "group");
        moodRow.setAttribute("aria-label", "Browse by mood");
        [{ id: null, label: "Any mood" }].concat(usable).forEach(function (m) {
            var b = el("button", "px-mood", m.label);
            b.type = "button";
            b.dataset.mood = m.id || "";
            b.setAttribute("aria-pressed", m.id === null ? "true" : "false");
            b.addEventListener("click", function () { setMood(m.id); });
            moodRow.appendChild(b);
        });
        categoryList.parentNode.insertBefore(moodRow, categoryList);
    }
    function expandAll() {
        var guard = 0;
        while (loadMoreContainer && !loadMoreContainer.hidden && loadMoreBtn && guard++ < 60) loadMoreBtn.click();
    }
    function setMood(id) {
        activeMood = id;
        if (moodRow) moodRow.querySelectorAll(".px-mood").forEach(function (b) {
            b.setAttribute("aria-pressed", String(b.dataset.mood === (id || "")));
        });
        if (id) expandAll();
        applyMood();
    }
    function applyMood() {
        if (!grid) return;
        var set = null;
        if (activeMood) {
            MOODS.forEach(function (m) { if (m.id === activeMood) set = m.cats.map(norm); });
        }
        var shown = 0;
        Array.prototype.forEach.call(grid.children, function (card) {
            var p = card.querySelector(".wallpaper-info p");
            var ok = !set || (p && set.indexOf(norm(p.textContent)) !== -1);
            card.hidden = !ok;
            if (ok) shown++;
        });
        var allLoaded = !loadMoreContainer || loadMoreContainer.hidden;
        if (set || (countOverridden && allLoaded)) {
            if (resultsCount) resultsCount.textContent = shown + (shown === 1 ? " wallpaper" : " wallpapers");
            if (emptyState) emptyState.hidden = shown > 0;
            countOverridden = !!set;
        }
        scheduleLayout();
    }

    /* =====================================================
       3. FULL-SCREEN VIEWER
       ===================================================== */
    var viewer = null, track, panes = {}, ui, elCount, elCat, elTitle, btnLike, btnClose, btnDl;
    var feed = [], idx = 0, animating = false, opener = null, viewed = {};
    var lastWheel = 0;

    function buildViewer() {
        if (viewer) return;
        viewer = el("div", "pxv");
        viewer.setAttribute("role", "dialog");
        viewer.setAttribute("aria-modal", "true");
        viewer.setAttribute("aria-label", "Wallpaper viewer");
        viewer.hidden = true;

        track = el("div", "pxv-track");
        ["prev", "cur", "next"].forEach(function (k) {
            var p = el("div", "pxv-pane " + k);
            var im = el("img");
            im.alt = ""; im.decoding = "async"; im.draggable = false;
            p.appendChild(im);
            track.appendChild(p);
            panes[k] = im;
        });
        viewer.appendChild(track);

        ui = el("div", "pxv-ui");
        var top = el("div", "pxv-top");
        btnClose = el("button", "", "\u2715");
        btnClose.type = "button"; btnClose.setAttribute("aria-label", "Close viewer");
        elCount = el("span", "pxv-count");
        top.appendChild(btnClose); top.appendChild(elCount);

        var bottom = el("div", "pxv-bottom");
        var meta = el("div", "pxv-meta");
        elCat = el("small"); elTitle = el("strong");
        meta.appendChild(elCat); meta.appendChild(elTitle);
        var actions = el("div", "pxv-actions");
        btnLike = el("button", "", "\u2661");
        btnLike.type = "button"; btnLike.setAttribute("aria-label", "Like wallpaper");
        btnDl = el("button", "", "\u2193");
        btnDl.type = "button"; btnDl.setAttribute("aria-label", "Download wallpaper");
        actions.appendChild(btnLike); actions.appendChild(btnDl);
        bottom.appendChild(meta); bottom.appendChild(actions);

        ui.appendChild(top); ui.appendChild(bottom);
        ui.appendChild(el("div", "pxv-hint", "Swipe up or down for more"));
        viewer.appendChild(ui);
        document.body.appendChild(viewer);

        btnClose.addEventListener("click", closeViewer);
        btnLike.addEventListener("click", function () {
            var it = feed[idx];
            var b = it && it.card.isConnected && it.card.querySelector(".like-btn");
            if (b) { b.click(); refreshLike(); }
        });
        btnDl.addEventListener("click", function () {
            var it = feed[idx];
            var b = it && it.card.isConnected && it.card.querySelector(".download-btn");
            if (b) b.click();
        });

        /* swipe / drag (pointer events cover touch and mouse) */
        var startY = 0, startT = 0, dragging = false, moved = false, pid = null;
        track.addEventListener("pointerdown", function (e) {
            if (animating || e.button > 0) return;
            dragging = true; moved = false; startY = e.clientY; startT = Date.now(); pid = e.pointerId;
            try { track.setPointerCapture(pid); } catch (er) { /* ignore */ }
            track.style.transition = "none";
        });
        track.addEventListener("pointermove", function (e) {
            if (!dragging) return;
            var dy = e.clientY - startY;
            if (Math.abs(dy) > 6) moved = true;
            var atEnd = (dy < 0 && idx >= feed.length - 1) || (dy > 0 && idx <= 0);
            track.style.transform = "translate3d(0," + (atEnd ? dy * 0.25 : dy) + "px,0)";
        });
        function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            try { track.releasePointerCapture(pid); } catch (er) { /* ignore */ }
            var dy = e.clientY - startY, dt = Math.max(1, Date.now() - startT);
            if (!moved) { track.style.transform = ""; ui.classList.toggle("off"); return; }
            var v = dy / dt, h = viewer.clientHeight;
            if ((dy < -h * 0.16 || v < -0.5) && idx < feed.length - 1) go(1);
            else if ((dy > h * 0.16 || v > 0.5) && idx > 0) go(-1);
            else snapBack();
        }
        track.addEventListener("pointerup", endDrag);
        track.addEventListener("pointercancel", function () { dragging = false; snapBack(); });

        viewer.addEventListener("wheel", function (e) {
            e.preventDefault();
            var now = Date.now();
            if (animating || now - lastWheel < 450 || Math.abs(e.deltaY) < 20) return;
            lastWheel = now;
            if (e.deltaY > 0 && idx < feed.length - 1) go(1);
            else if (e.deltaY < 0 && idx > 0) go(-1);
        }, { passive: false });
    }

    function snapBack() {
        track.style.transition = reduceMotion ? "none" : "transform .22s cubic-bezier(.2,.7,.2,1)";
        track.style.transform = "translate3d(0,0,0)";
    }
    function go(dir) {
        if (animating) return;
        var target = idx + dir;
        if (target < 0 || target >= feed.length) { snapBack(); return; }
        function finish() {
            track.style.transition = "none";
            track.style.transform = "";
            idx = target;
            bind();
            animating = false;
        }
        animating = true;
        if (reduceMotion) { finish(); return; }
        track.style.transition = "transform .26s cubic-bezier(.2,.7,.2,1)";
        track.style.transform = "translate3d(0," + (dir > 0 ? "-100%" : "100%") + ",0)";
        var done = false;
        function once() { if (done) return; done = true; track.removeEventListener("transitionend", once); finish(); }
        track.addEventListener("transitionend", once);
        setTimeout(once, 400);
    }

    function setPane(im, item, hi) {
        if (!item) { im.removeAttribute("src"); im.style.visibility = "hidden"; return; }
        im.style.visibility = "";
        im.alt = item.title;
        try { im.fetchPriority = hi ? "high" : "low"; } catch (e) { /* ignore */ }
        if (im.getAttribute("src") !== item.src) im.src = item.src;
    }
    function refreshLike() {
        var it = feed[idx];
        var b = it && it.card.isConnected && it.card.querySelector(".like-btn");
        btnLike.hidden = !b;
        var liked = !!(b && b.classList.contains("liked"));
        btnLike.classList.toggle("liked", liked);
        btnLike.textContent = liked ? "\u2665" : "\u2661";
        btnLike.setAttribute("aria-label", liked ? "Unlike wallpaper" : "Like wallpaper");
    }
    function bind() {
        var cur = feed[idx];
        if (!cur) return;
        setPane(panes.cur, cur, true);
        setPane(panes.prev, feed[idx - 1], false);
        setPane(panes.next, feed[idx + 1], false);
        elCount.textContent = feed.length > 1 ? (idx + 1) + " / " + feed.length : "";
        elCat.textContent = cur.category;
        elTitle.textContent = cur.title;
        refreshLike();
        viewer.style.setProperty("--pxv-rgb", catColor(cur.category).join(","));
        dominantColor(cur.src).then(function (col) {
            if (col && feed[idx] === cur) viewer.style.setProperty("--pxv-rgb", col.join(","));
        });
        countView(cur);
    }
    function countView(item) {
        if (!item.id || viewed[item.id]) return;
        viewed[item.id] = true;
        try {
            var c = window.pixoraSupabase;
            if (c && c.rpc) Promise.resolve(c.rpc("increment_wallpaper_view", { p_id: item.id })).catch(function () {});
        } catch (e) { /* ignore */ }
    }

    function itemFromCard(card) {
        var img = card.querySelector("img.wallpaper-image");
        var src = img && (img.getAttribute("src") || "");
        if (!src) return null;
        var h3 = card.querySelector("h3"), p = card.querySelector(".wallpaper-info p");
        return { card: card, id: card.dataset.id || "", src: src,
                 title: h3 ? h3.textContent : "Wallpaper", category: p ? p.textContent : "" };
    }
    function openViewer(card, startAt) {
        buildViewer();
        var parent = card.parentElement;
        var cards = Array.prototype.slice.call(parent.querySelectorAll(".wallpaper-card"))
            .filter(function (c) { return !c.hidden; });
        feed = cards.map(itemFromCard).filter(Boolean);
        if (!feed.length) return false;
        idx = typeof startAt === "number" ? startAt : Math.max(0, cards.indexOf(card));
        idx = Math.min(Math.max(idx, 0), feed.length - 1);
        opener = document.activeElement;
        animating = false;
        track.style.transition = "none"; track.style.transform = "";
        ui.classList.remove("off");
        viewer.hidden = false;
        document.body.classList.add("pxv-open");
        bind();
        try { history.pushState({ pxv: 1 }, ""); } catch (e) { /* ignore */ }
        btnClose.focus();
        return true;
    }
    function hideViewer() {
        if (!viewer || viewer.hidden) return;
        viewer.hidden = true;
        document.body.classList.remove("pxv-open");
        [panes.prev, panes.cur, panes.next].forEach(function (im) { im.removeAttribute("src"); });
        if (opener && opener.focus && opener.isConnected) { try { opener.focus(); } catch (e) { /* ignore */ } }
    }
    function closeViewer() {
        if (history.state && history.state.pxv) history.back();   /* popstate hides it */
        else hideViewer();
    }
    window.addEventListener("popstate", hideViewer);

    document.addEventListener("keydown", function (e) {
        if (!viewer || viewer.hidden) return;
        var k = e.key;
        if (k === "Escape") { e.preventDefault(); closeViewer(); }
        else if (k === "ArrowDown" || k === "ArrowRight" || k === "PageDown") { e.preventDefault(); go(1); }
        else if (k === "ArrowUp" || k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); go(-1); }
        else if (k === "Tab") {
            var f = Array.prototype.filter.call(viewer.querySelectorAll("button"), function (b) { return !b.hidden && !ui.classList.contains("off"); });
            if (!f.length) { e.preventDefault(); return; }
            var i = f.indexOf(document.activeElement);
            e.preventDefault();
            f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
    }, true);

    /* Take over card clicks (capture phase) — like and download keep their own behaviour. */
    document.addEventListener("click", function (e) {
        if (viewer && !viewer.hidden) return;
        var card = e.target.closest && e.target.closest(".wallpaper-card");
        if (!card || !card.dataset.id && !card.querySelector("img.wallpaper-image")) return;
        if (e.target.closest(".like-btn, .download-btn")) return;
        if (!card.closest("#wallpaperGrid, #trendingGrid")) return;
        if (openViewer(card)) { e.stopImmediatePropagation(); e.preventDefault(); }
    }, true);

    if (randomBtn) randomBtn.addEventListener("click", function (e) {
        var cards = grid ? Array.prototype.filter.call(grid.querySelectorAll(".wallpaper-card"), function (c) { return !c.hidden; }) : [];
        if (!cards.length) return;
        var pick = cards[Math.floor(Math.random() * cards.length)];
        if (openViewer(pick)) { e.stopImmediatePropagation(); e.preventDefault(); }
    }, true);

    /* =====================================================
       5. SITE COLOUR THAT FOLLOWS THE HERO PICTURE
       Every hero slide change announces a new lead picture. For the first
       TINT_TRANSITIONS changes the whole site shifts to that picture's colour;
       after that it returns to the normal PIXORA colours while the hero keeps
       showing new wallpapers.
       ===================================================== */
    var TINT_TRANSITIONS = 6;   /* slide changes that recolour the site (6 = two full rounds of 3 slides) */
    var NORMAL_TRANSITIONS = 0; /* 0 = stay normal afterwards. e.g. 6 = go back to colours after 6 normal changes */

    function lum(c) {
        var f = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
    }
    function contrast(a, b) {
        var l1 = lum(a), l2 = lum(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    function toHsl(c) {
        var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0;
        if (mx !== mn) {
            var d = mx - mn;
            s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
            h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h /= 6;
        }
        return [h, s, l];
    }
    function fromHsl(h, s, l) {
        function f(p, q, t) {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
        }
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
        return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map(function (v) { return Math.round(v * 255); });
    }
    /* A button colour that keeps white text readable. */
    function accentFrom(rgb) {
        var hsl = toHsl(rgb), s = Math.max(hsl[1], 0.55), l = Math.min(hsl[2], 0.52), c = fromHsl(hsl[0], s, l);
        for (var i = 0; i < 16 && contrast(c, [255, 255, 255]) < 4.5 && l > 0.18; i++) {
            l -= 0.03; c = fromHsl(hsl[0], s, l);
        }
        return c;
    }
    /* A bright version for text on the dark page. */
    function textFrom(rgb) {
        var hsl = toHsl(rgb), s = Math.max(hsl[1], 0.5), l = Math.max(hsl[2], 0.66), c = fromHsl(hsl[0], s, l);
        for (var i = 0; i < 12 && contrast(c, [11, 11, 16]) < 7 && l < 0.9; i++) {
            l += 0.03; c = fromHsl(hsl[0], s, l);
        }
        return c;
    }

    var root = document.documentElement;
    var tints = [], tintOn = 0, themed = false, themeToken = 0;
    function ensureTints() {
        if (tints.length) return;
        for (var i = 0; i < 2; i++) {
            var t = el("div", "px-tint");
            t.setAttribute("aria-hidden", "true");
            document.body.insertBefore(t, document.body.firstChild);
            tints.push(t);
        }
    }
    function applyTheme(rgb) {
        ensureTints();
        var acc = accentFrom(rgb), txt = textFrom(rgb);
        root.style.setProperty("--px-accent", "rgb(" + acc.join(",") + ")");
        root.style.setProperty("--px-accent-rgb", acc.join(","));
        root.style.setProperty("--px-accent-dark", "rgb(" + acc.join(",") + ")");
        root.style.setProperty("--px-accent-text", "rgb(" + txt.join(",") + ")");
        root.style.setProperty("--px-tint-rgb", rgb.join(","));
        var next = tints[1 - tintOn], prev = tints[tintOn];
        next.style.setProperty("--c", rgb.join(","));
        next.classList.add("on");
        prev.classList.remove("on");
        tintOn = 1 - tintOn;
        themed = true;
    }
    function resetTheme() {
        if (!themed) return;
        ["--px-accent", "--px-accent-rgb", "--px-accent-dark", "--px-accent-text", "--px-tint-rgb"]
            .forEach(function (k) { root.style.removeProperty(k); });
        tints.forEach(function (t) { t.classList.remove("on"); });
        themed = false;
    }
    function shouldTint(tick) {
        if (tick <= TINT_TRANSITIONS) return true;
        if (!NORMAL_TRANSITIONS) return false;
        var cycle = (TINT_TRANSITIONS + 1) + NORMAL_TRANSITIONS;
        return ((tick - 0) % cycle) <= TINT_TRANSITIONS;
    }
    document.addEventListener("pixora-hero", function (e) {
        var d = e.detail;
        if (!d) return;
        var token = ++themeToken;
        if (!shouldTint(d.tick)) { resetTheme(); return; }
        dominantColor(d.src).then(function (col) {
            if (token !== themeToken) return;          /* a newer slide change took over */
            applyTheme(col || catColor(d.category));
        });
    });

    /* =====================================================
       Start-up: watch the grids that script.js fills
       ===================================================== */
    function afterRender() {
        Array.prototype.forEach.call(grid.children, sizeCard);
        if (activeMood) {
            expandAll();
            applyMood();
        }
        scheduleLayout();
    }
    if (grid) {
        new MutationObserver(afterRender).observe(grid, { childList: true });
        if (window.ResizeObserver) new ResizeObserver(scheduleLayout).observe(grid);
        window.addEventListener("resize", scheduleLayout);
        window.addEventListener("load", scheduleLayout);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleLayout);
        afterRender();
    }
    if (categoryList) {
        new MutationObserver(hideEmptyCategories).observe(categoryList, { childList: true });
    }
    loadCounts();
})();
