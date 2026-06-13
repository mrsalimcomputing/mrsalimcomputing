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
  console.log("🔵 goBack() CALLED");

  const current = window.location.pathname.split("/").pop();
  const params = new URLSearchParams(window.location.search);

  const course = params.get("course") || "KS3";
  const unit   = params.get("unit") || localStorage.getItem("lastUnit") || "";
  const topic  = params.get("topic") || localStorage.getItem("lastTopic") || "";

  function build(url) {
    const q = [];
    if (course) q.push(`course=${encodeURIComponent(course)}`);
    if (unit)   q.push(`unit=${encodeURIComponent(unit)}`);
    if (topic)  q.push(`topic=${encodeURIComponent(topic)}`);
    return q.length ? `${url}?${q.join("&")}` : url;
  }

  // ✅ Hierarchical KS3 back map
  const backMapKS3 = {
    "theory-quiz.html": () => build("ks3-topic-options.html"),
    "matching-game.html": () => build("ks3-topic-options.html"),
    "exam-mode.html": () => build("ks3-topic-options.html"),

    "ks3-topic-options.html": () =>
      `ks3-topics.html?course=${encodeURIComponent(course)}&unit=${encodeURIComponent(unit)}`,

    "ks3-topics.html": "ks3.html",
    "ks3.html": "home.html",
    "home.html": "index.html"
  };

  const target = backMapKS3[current];
  console.log("📄 Current page:", current);
  console.log("🚀 Target:", target);

  if (typeof target === "function") {
    window.location.href = target();
  } else if (target) {
    window.location.href = target;
  } else {
    window.location.href = "home.html";
  }
}







