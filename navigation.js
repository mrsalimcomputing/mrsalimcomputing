// ===============================
// GLOBAL CLEANUP FUNCTION
// ===============================
function cleanupEverything() {

    // 1. Kill ALL intervals
    for (let i = 1; i < 99999; i++) {
        clearInterval(i);
    }

    // 2. Kill ALL timeouts
    for (let i = 1; i < 99999; i++) {
        clearTimeout(i);
    }

    // IMPORTANT:
    // Do NOT clone/replace buttons here.
    // That was breaking all existing event listeners.
}


// ===============================
// HIDE ALL SCREENS
// ===============================
export function hideAllScreens() {
    cleanupEverything();
    const screens = document.querySelectorAll(".screen");
    screens.forEach(screen => screen.style.display = "none");
}


// ===============================
// RETURN TO TOPICS (SAFE)
// ===============================
export function returnToTopics() {
    cleanupEverything();
    window.location.href = "ks3.html";
}


// ===============================
// QUIT TO MAIN MENU (SAFE)
// ===============================
export function quitToMainMenu() {
    cleanupEverything();
    window.location.href = "ks3.html";
}


// ===============================
// FIXED BACK NAVIGATION (NO HISTORY)
// ===============================
export function goBack() {

    const current = window.location.pathname.split("/").pop();
    const params = new URLSearchParams(window.location.search);

    // Extract parameters if they exist
    const course = params.get("course");
    const unit   = params.get("unit") || params.get("category");
    const topic  = params.get("topic");

    // Helper to rebuild URLs with parameters
    function build(url) {
        let q = [];
        if (course) q.push(`course=${encodeURIComponent(course)}`);
        if (unit)   q.push(`unit=${encodeURIComponent(unit)}`);
        if (topic)  q.push(`topic=${encodeURIComponent(topic)}`);
        return q.length ? `${url}?${q.join("&")}` : url;
    }

    // Navigation map
    const backMap = {

        // QUIZ PAGES → back to topic options (with params)
        "theory-quiz.html": () => build("ks3-topic-options.html"),
        "matching-game.html": () => build("ks3-topic-options.html"),
        "exam-mode.html": () => build("ks3-topic-options.html"),

        // TOPIC OPTIONS → back to KS3 subtopics (needs category/unit)
        "ks3-topic-options.html": () => {
            if (unit) {
                return `ks3-topics.html?category=${encodeURIComponent(unit)}`;
            }
            return "ks3-topics.html";
        },

        // KS3 SUBTOPICS → back to KS3 main
        "ks3-topics.html": "ks3.html",

        // KS3 MAIN → home
        "ks3.html": "home.html",

        // HOME → index
        "home.html": "index.html"
    };

    const target = backMap[current];

    if (typeof target === "function") {
        window.location.href = target();
    } else if (target) {
        window.location.href = target;
    } else {
        window.location.href = "home.html";
    }
}



