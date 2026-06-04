// ===============================
// KS4‑ONLY BACK NAVIGATION
// ===============================
export function goBackKS4() {

    const current = window.location.pathname.split("/").pop();
    const params = new URLSearchParams(window.location.search);

    const course = params.get("course");
    const unit   = params.get("unit");
    const topic  = params.get("topic");

    // Helper to rebuild URLs with parameters
    function build(url) {
        const q = [];
        if (course) q.push(`course=${encodeURIComponent(course)}`);
        if (unit)   q.push(`unit=${encodeURIComponent(unit)}`);
        if (topic)  q.push(`topic=${encodeURIComponent(topic)}`);
        return q.length ? `${url}?${q.join("&")}` : url;
    }

    // ===============================
    // KS4‑ONLY BACK MAP
    // ===============================
    const backMapKS4 = {

        // QUIZ PAGES → back to KS4 topic options
        "theory-quiz.html": () => build("ks4-topic-options.html"),
        "matching-game.html": () => build("ks4-topic-options.html"),
        "exam-mode.html": () => build("ks4-topic-options.html"),

        // TOPIC OPTIONS → back to KS4 UNIT PAGE
        "ks4-topic-options.html": () =>
            `ks4-unit.html?course=${encodeURIComponent(course)}&unit=${encodeURIComponent(unit)}`,

        // UNIT PAGE → back to KS4 MAIN
        "ks4-unit.html": "ks4.html",

        // KS4 MAIN → home
        "ks4.html": "home.html",

        // HOME → index
        "home.html": "index.html"
    };

    const target = backMapKS4[current];

    if (typeof target === "function") {
        window.location.href = target();
    } else if (target) {
        window.location.href = target;
    } else {
        window.location.href = "ks4.html";
    }
}
