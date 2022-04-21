window.addEventListener("click", (event) => {
    var container = document.getElementsByClassName("utterances-frame")[0];
    var utteranceUrl = container.getAttribute('src');
    var prefTheme = localStorage.getItem("pref-theme");
    regex = new RegExp('(?<=&theme=).*?(?=&)');

    if (event.target.matches("#theme-toggle") ||
        event.target.parentNode.matches("#theme-toggle") ||
        event.target.parentNode.matches("#moon") ||
        event.target.parentNode.matches("#sun")) {

        if (prefTheme === "dark") {
            var newUtteranceUrl = utteranceUrl.replace(regex, "photon-dark");
        }
        else if (prefTheme === "light") {
            var newUtteranceUrl = utteranceUrl.replace(regex, "github-light")
        }

        container.setAttribute("src", newUtteranceUrl);
    }
})