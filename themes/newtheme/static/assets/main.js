!function () {
    var e, t, n, o, i, d, c, s, r, a, l;
    e = document.querySelector(".container"),
        t = document.querySelector(".menu"),
        n = document.querySelector(".menu-trigger"),
        document.querySelector(".menu__inner--desktop"),
        o = document.querySelector(".menu__sub-inner-more-trigger"),
        i = document.querySelector(".menu__sub-inner-more"),
        d = getComputedStyle(document.body).getPropertyValue("--phoneWidth"),
        c = function () { return window.matchMedia(d).matches },
        s = function () {
            // n && n.classList.toggle("hidden", !c()),
            t && t.classList.toggle("hidden", c()),
            i && i.classList.toggle("hidden", !c())
        },
        t && t.addEventListener("click", (function (e) { return e.stopPropagation() })),
        i && i.addEventListener("click", (function (e) { return e.stopPropagation() })),
        s(),
        document.body.addEventListener("click", (function () { c() || !i || i.classList.contains("hidden") ? c() && !t.classList.contains("hidden") && t.classList.add("hidden") : i.classList.add("hidden") })),
        window.addEventListener("resize", s), n && n.addEventListener("click",
            (function (e) { e.stopPropagation(), t && t.classList.toggle("hidden") })),
        o && o.addEventListener("click", (function (t) {
            t.stopPropagation(), i && i.classList.toggle("hidden"),
                i && i.getBoundingClientRect().right > e.getBoundingClientRect().right && (i.style.left = "auto", i.style.right = 0)
        })),
        r = window.localStorage && window.localStorage.getItem("theme"), 
        a = document.querySelector(".theme-toggle"), 
        l = "dark" === r, 
        null !== r && document.body.classList.toggle("dark-theme", l),
        a.addEventListener(
            "click", (
            function () {
                document.body.classList.toggle("dark-theme"),
                    window.localStorage && window.localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light")
            }))
}();