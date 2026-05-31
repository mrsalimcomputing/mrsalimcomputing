// js/userManager.js

const USER_KEY = "msc_currentUser";

// Save user
export function setCurrentUser(userObj) {
  // Ensure school ALWAYS exists
  if (!userObj.school) {
    userObj.school = "hfed.net"; 
  }

  localStorage.setItem(USER_KEY, JSON.stringify(userObj));
}

// Load user
export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);

    // Guarantee school is never undefined
    if (!user.school) {
      user.school = "hfed.net";
    }

    // Guarantee id exists (fallback for older guest accounts)
    if (!user.id) {
      user.id = "guest-" + Date.now();
    }

    return user;
  } catch {
    return null;
  }
}

// Clear user
export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}

// Nickname generator
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


