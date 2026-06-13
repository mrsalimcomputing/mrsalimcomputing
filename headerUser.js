// ===============================
// GOOGLE ANALYTICS (GLOBAL TRACKING)
// ===============================
(function () {
    const GA_ID = "G-2NYYN3NQLH"; // <-- replace with your real GA ID

    // Load GA script
    const ga = document.createElement("script");
    ga.async = true;
    ga.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(ga);

    // Init GA
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_ID);
})();


// ===============================
// USER BANNER + LOGOUT LOGIC
// ===============================
import { getCurrentUser, clearCurrentUser } from "./userManager.js";

window.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("userWelcome");
    const logoutBtn = document.getElementById("logoutBtn");

    const isPlayMode = localStorage.getItem("isPlayMode") === "true";
    const user = getCurrentUser();
    const sessionNickname = localStorage.getItem("nickname");
    const sessionCode = localStorage.getItem("sessionCode");

    let displayName = "Guest";

    // ==============================
    // DISPLAY NAME PRIORITY
    // ==============================
    if (isPlayMode) {
        displayName = "Guest";

    } else if (user && user.username) {
        displayName = user.username;

    } else if (sessionNickname && sessionCode) {
        displayName = sessionNickname;
    }

    // ==============================
    // UPDATE BANNER
    // ==============================
    if (el) {
        el.textContent = `Welcome, ${displayName}`;
    }

    // ==============================
    // LOGOUT BUTTON
    // ==============================
    if (logoutBtn) {
        logoutBtn.onclick = () => {

            // Remove Google/Microsoft login ONLY
            clearCurrentUser();

            // Keep sessionCode, nickname, deviceID
            // (needed for session leaderboard)
            
            // Remove play mode flag
            localStorage.removeItem("isPlayMode");

            // Redirect to login
            window.location.href = "index.html";
        };
    }
});



