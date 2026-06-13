// js/userManager.js

const USER_KEY = "msc_currentUser";

// ===============================
// SAVE USER (Google / Microsoft)
// ===============================
export function setCurrentUser(userObj) {

  // Ensure school ALWAYS exists
  if (!userObj.school) {
    userObj.school = "hfed.net";
  }

  localStorage.setItem(USER_KEY, JSON.stringify(userObj));
}

// ===============================
// LOAD USER (Google / Microsoft)
// ===============================
export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);

    // Guarantee school exists
    if (!user.school) {
      user.school = "hfed.net";
    }

    // Guarantee ID exists
    if (!user.id) {
      user.id = "guest-" + Date.now();
    }

    return user;
  } catch {
    return null;
  }
}

// ===============================
// CLEAR USER (Google / Microsoft ONLY)
// ===============================
export function clearCurrentUser() {
  // ❗ DO NOT clear deviceID, nickname, or sessionCode
  // These are needed for session leaderboard identity
  localStorage.removeItem(USER_KEY);
}

// ===============================
// GOOGLE NICKNAME GENERATOR
// ===============================
export function generateGoogleNickname() {
  const colors = [
    "Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Silver", "Golden",
    "Crimson", "Aqua", "Teal", "Maroon", "Navy", "Lime", "Cyan"
  ];

  const animals = [
    "Tiger", "Falcon", "Wolf", "Panther", "Eagle", "Lion", "Fox", "Hawk",
    "Bear", "Shark", "Leopard", "Cobra", "Raven", "Jaguar", "Puma"
  ];

  const color = colors[Math.floor(Math.random() * colors.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(100 + Math.random() * 900);

  return `${color}${animal}${number}`;
}


