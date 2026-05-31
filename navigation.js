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


