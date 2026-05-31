import { getCurrentUser, clearCurrentUser } from "./userManager.js";

window.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("userWelcome");
  const logoutBtn = document.getElementById("logoutBtn");

  const user = getCurrentUser();

  if (el) {
    if (!user) {
      el.textContent = "Welcome, Guest";
    } else {
      el.textContent = `Welcome, ${user.username}`;
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearCurrentUser();
      window.location.href = "login.html";
    });
  }
});

