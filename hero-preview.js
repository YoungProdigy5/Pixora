/* PIXORA hero visuals — add-on.
   Slide 1: phone preview.  Slide 2: fan of wallpapers.  Slide 3: wallpaper mosaic
   (one tile becomes a real video when one exists).
   EVERY slide change shows new pictures, and announces the lead picture with a
   "pixora-hero" event so the site can match its colours to it (see pixora-immersive.js).
   Reuses what script.js already put on the page (no extra database requests).
   To undo: remove the <link> and <script> tags for hero-preview from index.html. */
(function () {
    "use strict";

    /* Categories shown in the hero first. Edit freely. If none match,
       any approved wallpaper is used instead. */
    var PREFERRED = ["Cars", "Nature", "Space", "Aesthetic", "Art", "AMOLED",
                     "Technology", "Travel", "Cities", "Animals"];

    var slider = document.querySelector(".hero-slider");
    var slides = document.querySelectorAll(".hero-slide");
    var grid = document.getElementById("wallpaperGrid");
    var videoGrid = document.getElementById("videoGrid");
    if (!slider || !slides.length || !grid ||
        slider.querySelector(".hero-phone, .hero-fan, .hero-mosaic")) return;

    var pool = [];                 /* shuffled wallpapers used by the hero */
    var tick = -1;                 /* how many slide changes so far (0 = first picture) */
    var wallpapersReady = false;
    var videoInfo = null;

    var phone, phoneImg, elDate, elTime, elCat, elTitle, phoneItem = null;
    var fan = null, fanBtns = [];
    var mosaic = null, mosaicTiles = [];

    /* ---------- helpers ---------- */
    function norm(v) { return String(v || "").trim().toLowerCase(); }
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    }
    function shuffle(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function later(fn) {
        if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 3000 });
        else setTimeout(fn, 1500);
    }
    function take(k, start) {
        var out = [];
        for (var i = 0; i < k; i++) out.push(pool[(start + i) % pool.length]);
        return out;
    }
    function setImg(im, item) {
        if (!item) return;
        if (im.getAttribute("src") !== item.src) im.src = item.src;
        im.alt = "";
    }
    function openWallpaper(id) {
        var btn = null;
        try {
            btn = document.querySelector('.wallpaper-card[data-id="' +
                (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"] .preview-btn');
        } catch (e) { btn = null; }
        if (btn) btn.click();
        else {
            var t = document.getElementById("new");
            if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /* ---------- read wallpapers already rendered by script.js ---------- */
    function snapshotWallpapers() {
        var all = [];
        grid.querySelectorAll(".wallpaper-card").forEach(function (card) {
            var img = card.querySelector("img.wallpaper-image");
            var src = img && (img.getAttribute("src") || "");
            if (!src) return;
            var h3 = card.querySelector("h3");
            var cat = card.querySelector(".wallpaper-info p");
            all.push({
                id: card.dataset.id || "",
                src: src,
                title: h3 ? h3.textContent : "Wallpaper",
                category: cat ? cat.textContent : ""
            });
        });
        if (!all.length) return false;
        var wanted = PREFERRED.map(norm);
        var preferred = all.filter(function (x) { return wanted.indexOf(norm(x.category)) !== -1; });
        pool = shuffle(preferred.length ? preferred : all);
        return true;
    }

    /* ---------- slide 1: phone ---------- */
    function buildPhone() {
        phone = el("button", "hero-phone");
        phone.type = "button";
        var frame = el("span", "hp-frame");
        frame.appendChild(el("span", "hp-notch"));
        var screen = el("span", "hp-screen");
        phoneImg = el("img", "hp-img show");
        phoneImg.alt = ""; phoneImg.decoding = "async";
        phoneImg.onerror = function () { phone.hidden = true; };
        screen.appendChild(phoneImg);
        screen.appendChild(el("span", "hp-shade"));

        var lock = el("span", "hp-lock");
        elDate = el("span", "hp-date");
        elTime = el("span", "hp-time");
        lock.appendChild(elDate); lock.appendChild(elTime);
        screen.appendChild(lock);

        var cap = el("span", "hp-caption");
        elCat = el("small"); elTitle = el("strong");
        cap.appendChild(elCat); cap.appendChild(elTitle);
        screen.appendChild(cap);
        screen.appendChild(el("span", "hp-tap", "Preview"));

        frame.appendChild(screen);
        phone.appendChild(frame);
        slides[0].classList.add("has-phone");
        slides[0].appendChild(phone);
        phone.addEventListener("click", function () { if (phoneItem) openWallpaper(phoneItem.id); });
    }
    function tickClock() {
        var now = new Date();
        try {
            elDate.textContent = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
            elTime.textContent = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" })
                .formatToParts(now)
                .filter(function (p) { return p.type !== "dayPeriod"; })
                .map(function (p) { return p.value; })
                .join("").trim();
        } catch (e) { /* ignore */ }
    }

    /* ---------- slide 2: fan ---------- */
    function buildFan() {
        if (!slides[1]) return;
        fan = el("div", "hero-fan");
        fan.setAttribute("role", "group");
        fan.setAttribute("aria-label", "New wallpapers");
        var slots = pool.length >= 3 ? ["l", "c", "r"] : pool.length === 2 ? ["l", "r"] : ["c"];
        slots.forEach(function (slot) {
            var b = el("button", "hf-card hf-" + slot);
            b.type = "button";
            var im = el("img", "hf-img");
            im.alt = ""; im.decoding = "async";
            im.onerror = function () { b.hidden = true; };
            b.appendChild(im);
            b.addEventListener("click", function () { if (b.dataset.id) openWallpaper(b.dataset.id); });
            fan.appendChild(b);
            fanBtns.push({ btn: b, img: im, slot: slot });
        });
        slides[1].classList.add("has-phone");
        slides[1].appendChild(fan);
    }

    /* ---------- slide 3: mosaic ---------- */
    function buildMosaic() {
        if (!slides[2]) return;
        mosaic = el("div", "hero-mosaic");
        mosaic.setAttribute("role", "group");
        mosaic.setAttribute("aria-label", "Wallpapers");
        var n = Math.min(4, Math.max(1, pool.length));
        for (var i = 0; i < n; i++) {
            (function () {
                var b = el("button", "hm-tile");
                b.type = "button";
                var im = el("img", "hm-img");
                im.alt = ""; im.decoding = "async";
                im.onerror = function () { b.hidden = true; };
                b.appendChild(im);
                b.addEventListener("click", function () { if (b.dataset.id) openWallpaper(b.dataset.id); });
                mosaic.appendChild(b);
                mosaicTiles.push({ btn: b, img: im });
            })();
        }
        slides[2].classList.add("has-phone");
        slides[2].appendChild(mosaic);
        applyVideoTile();
    }
    function readVideo() {
        if (!videoGrid) return false;
        var card = videoGrid.querySelector(".video-card");
        if (!card) return false;
        var thumb = card.querySelector("img");
        var src = thumb ? (thumb.getAttribute("src") || "") : "";
        if (!src) return true;
        var h3 = card.querySelector("h3");
        videoInfo = { src: src, title: h3 ? h3.textContent : "Video" };
        return true;
    }
    function applyVideoTile() {
        if (!mosaic || !videoInfo || mosaic.querySelector(".hm-vid") || mosaicTiles.length < 2) return;
        var title = videoInfo.title;
        var b = el("button", "hm-tile hm-vid");
        b.type = "button";
        b.setAttribute("aria-label", "Play video: " + title);
        var im = el("img", "hm-img");
        im.alt = ""; im.decoding = "async"; im.src = videoInfo.src;
        b.appendChild(im);
        b.appendChild(el("span", "hm-play", "\u25B6"));
        b.addEventListener("click", function () {
            var target = Array.prototype.find.call(
                videoGrid.querySelectorAll(".video-card"),
                function (c) { var t = c.querySelector("h3"); return t && t.textContent === title; });
            if (target) target.click();
            else {
                var sec = document.getElementById("videos");
                if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
        var last = mosaicTiles.pop();
        mosaic.replaceChild(b, last.btn);
    }

    /* ---------- give a slide its pictures for a given slide-change number ---------- */
    function assign(si, t) {
        if (!pool.length || t < 0) return null;
        var start = t % pool.length;
        var lead = null;

        if (si === 0 && phone) {
            lead = pool[start];
            phoneItem = lead;
            setImg(phoneImg, lead);
            elCat.textContent = lead.category;
            elTitle.textContent = lead.title;
            phone.setAttribute("aria-label", "Preview wallpaper: " + lead.title);
        } else if (si === 1 && fan) {
            var f = take(fanBtns.length, start);
            /* the middle card is the lead picture */
            var order = fanBtns.length === 3 ? { c: f[0], l: f[1], r: f[2] }
                      : fanBtns.length === 2 ? { l: f[0], r: f[1] } : { c: f[0] };
            fanBtns.forEach(function (x) {
                var it = order[x.slot];
                x.btn.hidden = false;
                x.btn.dataset.id = it.id;
                x.btn.setAttribute("aria-label", "Preview wallpaper: " + it.title);
                setImg(x.img, it);
            });
            lead = order.c || f[0];
        } else if (si === 2 && mosaic) {
            var tiles = mosaicTiles;
            var m = take(Math.max(tiles.length, 1), start);
            tiles.forEach(function (x, i) {
                x.btn.hidden = false;
                x.btn.dataset.id = m[i].id;
                x.btn.setAttribute("aria-label", "Preview wallpaper: " + m[i].title);
                setImg(x.img, m[i]);
            });
            lead = m[0];
        }
        return lead;
    }

    /* tell the rest of the site which picture just became the lead */
    function announce(si, t, lead) {
        if (!lead) return;
        try {
            document.dispatchEvent(new CustomEvent("pixora-hero", {
                detail: { slide: si, tick: t, src: lead.src, category: lead.category, title: lead.title }
            }));
        } catch (e) { /* ignore */ }
    }

    /* ---------- slide switching (no timers) ---------- */
    function activeIndex() {
        for (var i = 0; i < slides.length; i++) {
            if (slides[i].classList.contains("active")) return i;
        }
        return -1;
    }
    var lastActive = -1;
    function startWatching() {
        if (!window.MutationObserver) return;
        lastActive = activeIndex();
        new MutationObserver(function () {
            var a = activeIndex();
            if (a < 0 || a === lastActive) return;
            lastActive = a;
            tick++;
            var lead = assign(a, tick);            /* new pictures for this slide */
            announce(a, tick, lead);
            assign((a + 1) % slides.length, tick + 1);   /* get the next slide ready */
        }).observe(slider, { subtree: true, attributes: true, attributeFilter: ["class"] });
    }

    /* ---------- start: wait for script.js to fill the grids ---------- */
    function whenReady(target, test, done) {
        if (test()) { done(); return; }
        var ob = new MutationObserver(function () {
            if (test()) { ob.disconnect(); done(); }
        });
        ob.observe(target, { childList: true });
    }
    function initWallpapers() {
        if (wallpapersReady || !snapshotWallpapers()) return false;
        wallpapersReady = true;
        buildPhone();
        tickClock();
        setInterval(tickClock, 30000);
        buildFan();
        buildMosaic();

        tick = 0;
        var a = Math.max(0, activeIndex());
        lastActive = a;
        var lead = assign(a, 0);
        announce(a, 0, lead);
        later(function () {                          /* prepare the other slides quietly */
            for (var i = 0; i < slides.length; i++) {
                if (i !== a) assign(i, ((i - a + slides.length) % slides.length));
            }
        });
        startWatching();
        return true;
    }

    whenReady(grid, initWallpapers, function () { /* built */ });
    if (videoGrid) whenReady(videoGrid, readVideo, applyVideoTile);
})();
