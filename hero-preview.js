/* PIXORA hero phone preview — add-on.
   Reuses wallpapers script.js already rendered (no extra database requests).
   To undo: remove the <link> and <script> tags for this file from index.html. */
(function () {
    "use strict";

    /* Categories shown in the hero first. Edit freely. If none of the
       wallpapers match, any approved wallpaper is used instead. */
    var PREFERRED = ["Cars", "Nature", "Space", "Aesthetic", "Art", "AMOLED",
                     "Technology", "Travel", "Cities", "Animals"];
    var MAX_ITEMS = 5;
    var INTERVAL_MS = 4500;

    var slide = document.querySelector(".hero-slide");
    var grid = document.getElementById("wallpaperGrid");
    if (!slide || !grid || slide.querySelector(".hero-phone")) return;

    var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var items = [];
    var index = 0;
    var front = 0;
    var phone, imgs, elDate, elTime, elCat, elTitle, timer;

    function norm(v) { return String(v || "").trim().toLowerCase(); }

    function shuffle(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function snapshot() {
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
        var preferred = all.filter(function (x) {
            return wanted.indexOf(norm(x.category)) !== -1;
        });
        items = shuffle(preferred.length ? preferred : all).slice(0, MAX_ITEMS);
        return true;
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text) n.textContent = text;
        return n;
    }

    function build() {
        phone = el("button", "hero-phone");
        phone.type = "button";

        var frame = el("span", "hp-frame");
        frame.appendChild(el("span", "hp-notch"));
        var screen = el("span", "hp-screen");

        imgs = [el("img", "hp-img"), el("img", "hp-img")];
        imgs.forEach(function (im) {
            im.alt = "";
            im.decoding = "async";
            screen.appendChild(im);
        });

        screen.appendChild(el("span", "hp-shade"));

        var lock = el("span", "hp-lock");
        elDate = el("span", "hp-date");
        elTime = el("span", "hp-time");
        lock.appendChild(elDate);
        lock.appendChild(elTime);
        screen.appendChild(lock);

        var cap = el("span", "hp-caption");
        elCat = el("small");
        elTitle = el("strong");
        cap.appendChild(elCat);
        cap.appendChild(elTitle);
        screen.appendChild(cap);
        screen.appendChild(el("span", "hp-tap", "Preview"));

        frame.appendChild(screen);
        phone.appendChild(frame);

        slide.classList.add("has-phone");
        slide.appendChild(phone);

        phone.addEventListener("click", openCurrent);
    }

    function tickClock() {
        var now = new Date();
        try {
            elDate.textContent = now.toLocaleDateString([], {
                weekday: "long", day: "numeric", month: "long"
            });
            elTime.textContent = now.toLocaleTimeString([], {
                hour: "numeric", minute: "2-digit"
            });
        } catch (e) { /* ignore */ }
    }

    function show(i, instant) {
        var item = items[i];
        if (!item) return;
        var next = instant ? front : 1 - front;
        var im = imgs[next];

        function reveal() {
            imgs[front].classList.remove("show");
            im.classList.add("show");
            front = next;
            index = i;
            elCat.textContent = item.category;
            elTitle.textContent = item.title;
            phone.setAttribute("aria-label", "Preview wallpaper: " + item.title);
        }

        im.onload = reveal;
        im.onerror = function () {
            /* skip images that fail to load */
            items.splice(i, 1);
            if (!items.length) { phone.hidden = true; stop(); return; }
            show(i % items.length, instant);
        };
        im.src = item.src;
        if (im.complete && im.naturalWidth) { reveal(); }
    }

    function openCurrent() {
        var item = items[index];
        if (!item) return;
        var btn = null;
        try {
            btn = document.querySelector(
                '.wallpaper-card[data-id="' + (window.CSS && CSS.escape ? CSS.escape(item.id) : item.id) +
                '"] .preview-btn');
        } catch (e) { btn = null; }

        if (btn) {
            btn.click();
        } else {
            var target = document.getElementById("new");
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function stop() { clearInterval(timer); timer = null; }

    function start() {
        stop();
        if (reduceMotion || items.length < 2) return;
        timer = setInterval(function () {
            if (document.hidden || !slide.classList.contains("active")) return;
            show((index + 1) % items.length, false);
        }, INTERVAL_MS);
    }

    function init() {
        if (!snapshot()) return false;
        build();
        tickClock();
        setInterval(tickClock, 30000);
        show(0, true);
        start();
        return true;
    }

    /* script.js fills the grid after it loads data; wait for the cards. */
    if (!init()) {
        var observer = new MutationObserver(function () {
            if (init()) observer.disconnect();
        });
        observer.observe(grid, { childList: true });
    }
})();
