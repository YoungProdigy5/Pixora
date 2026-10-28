/* PIXORA hero visuals — add-on.
   Slide 1: phone preview that shows a different wallpaper each visit.
   Slide 2: fan of the newest wallpapers.
   Slide 3: an approved video, if one exists.
   Reuses what script.js already put on the page (no extra database requests).
   To undo: remove the <link> and <script> tags for hero-preview from index.html. */
(function () {
    "use strict";

    /* Categories shown in the hero first. Edit freely. If none match,
       any approved wallpaper is used instead. */
    var PREFERRED = ["Cars", "Nature", "Space", "Aesthetic", "Art", "AMOLED",
                     "Technology", "Travel", "Cities", "Animals"];
    var MAX_PHONE = 5;

    var slider = document.querySelector(".hero-slider");
    var slides = document.querySelectorAll(".hero-slide");
    var grid = document.getElementById("wallpaperGrid");
    var videoGrid = document.getElementById("videoGrid");
    if (!slider || !slides.length || !grid ||
        slider.querySelector(".hero-phone, .hero-fan, .hero-video")) return;

    var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var phoneItems = [], fanItems = [];
    var phoneIndex = 0, front = 0;
    var phone, phoneImgs, elDate, elTime, elCat, elTitle;
    var wallpapersReady = false, videosReady = false;

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
    function lazyImg(cls, item) {
        var im = el("img", cls);
        im.alt = "";
        im.decoding = "async";
        im.setAttribute("data-src", item.src);
        try { im.fetchPriority = "low"; } catch (e) { /* older browsers */ }
        return im;
    }
    function loadSlide(i) {
        var s = slides[i];
        if (!s) return;
        s.querySelectorAll("img[data-src]").forEach(function (im) {
            im.src = im.getAttribute("data-src");
            im.removeAttribute("data-src");
        });
    }
    function later(fn) {
        if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 3000 });
        else setTimeout(fn, 1500);
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
        var pool = all.filter(function (x) { return wanted.indexOf(norm(x.category)) !== -1; });
        if (!pool.length) pool = all;

        fanItems = pool.slice(0, 3);                    /* newest first */
        var rest = pool.slice(3);
        phoneItems = shuffle(rest.length >= 2 ? rest : pool).slice(0, MAX_PHONE);
        return true;
    }

    /* ---------- slide 1: phone ---------- */
    function buildPhone() {
        phone = el("button", "hero-phone");
        phone.type = "button";
        var frame = el("span", "hp-frame");
        frame.appendChild(el("span", "hp-notch"));
        var screen = el("span", "hp-screen");

        phoneImgs = [el("img", "hp-img"), el("img", "hp-img")];
        phoneImgs.forEach(function (im) { im.alt = ""; im.decoding = "async"; screen.appendChild(im); });
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
        phone.addEventListener("click", function () {
            var it = phoneItems[phoneIndex];
            if (it) openWallpaper(it.id);
        });
    }

    function tickClock() {
        var now = new Date();
        try {
            elDate.textContent = now.toLocaleDateString([], {
                weekday: "long", day: "numeric", month: "long"
            });
            elTime.textContent = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" })
                .formatToParts(now)
                .filter(function (p) { return p.type !== "dayPeriod"; })
                .map(function (p) { return p.value; })
                .join("").trim();
        } catch (e) { /* ignore */ }
    }

    function showPhone(i, instant) {
        var item = phoneItems[i];
        if (!item) return;
        var next = instant ? front : 1 - front;
        var im = phoneImgs[next];

        function reveal() {
            phoneImgs[front].classList.remove("show");
            im.classList.add("show");
            front = next;
            phoneIndex = i;
            elCat.textContent = item.category;
            elTitle.textContent = item.title;
            phone.setAttribute("aria-label", "Preview wallpaper: " + item.title);
        }
        im.onload = reveal;
        im.onerror = function () {
            phoneItems.splice(i, 1);
            if (!phoneItems.length) { phone.hidden = true; return; }
            showPhone(i % phoneItems.length, instant);
        };
        im.src = item.src;
        if (im.complete && im.naturalWidth) reveal();
    }

    /* ---------- slide 2: fan of new wallpapers ---------- */
    function buildFan() {
        if (!fanItems.length || !slides[1]) return;
        var wrap = el("div", "hero-fan");
        wrap.setAttribute("role", "group");
        wrap.setAttribute("aria-label", "New wallpapers");
        var slots = fanItems.length === 3 ? ["l", "c", "r"] :
                    fanItems.length === 2 ? ["l", "r"] : ["c"];
        fanItems.forEach(function (item, i) {
            var b = el("button", "hf-card hf-" + slots[i]);
            b.type = "button";
            b.setAttribute("aria-label", "Preview wallpaper: " + item.title);
            var im = lazyImg("hf-img", item);
            im.onerror = function () { b.hidden = true; };
            b.appendChild(im);
            b.addEventListener("click", function () { openWallpaper(item.id); });
            wrap.appendChild(b);
        });
        slides[1].classList.add("has-phone");
        slides[1].appendChild(wrap);
    }

    /* ---------- slide 3: a real approved video ---------- */
    function buildVideo() {
        if (!videoGrid || !slides[2]) return false;
        var card = videoGrid.querySelector(".video-card");
        if (!card) return false;
        var thumb = card.querySelector("img");
        var src = thumb ? (thumb.getAttribute("src") || "") : "";
        var h3 = card.querySelector("h3");
        var title = h3 ? h3.textContent : "Video";

        var b = el("button", "hero-video");
        b.type = "button";
        b.setAttribute("aria-label", "Play video: " + title);
        var frame = el("span", "hv-frame");
        if (src) frame.appendChild(lazyImg("hv-img", { src: src }));
        frame.appendChild(el("span", "hv-play", "\u25B6"));
        frame.appendChild(el("span", "hv-cap", title));
        b.appendChild(frame);
        b.addEventListener("click", function () {
            var target = Array.prototype.find.call(
                videoGrid.querySelectorAll(".video-card"),
                function (c) { var t = c.querySelector("h3"); return t && t.textContent === title; });
            if (target) target.click();
            else {
                var s = document.getElementById("videos");
                if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
        slides[2].classList.add("has-phone");
        slides[2].appendChild(b);
        return true;
    }

    /* ---------- slide switching hooks (no timers) ---------- */
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
            var prev = lastActive;
            lastActive = a;
            loadSlide(a);
            loadSlide((a + 1) % slides.length);
            if (a === 0 && prev !== -1 && phone && phoneItems.length > 1 &&
                !reduceMotion && !document.hidden) {
                showPhone((phoneIndex + 1) % phoneItems.length, false);
            }
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
        showPhone(0, true);
        buildFan();
        later(function () { loadSlide(1); loadSlide(2); });
        startWatching();
        return true;
    }

    whenReady(grid, initWallpapers, function () { /* built */ });
    if (videoGrid) {
        whenReady(videoGrid, function () {
            if (videosReady) return true;
            if (buildVideo()) { videosReady = true; return true; }
            return false;
        }, function () { later(function () { loadSlide(2); }); });
    }
})();
