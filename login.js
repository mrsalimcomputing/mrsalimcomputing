// js/login.js
console.log("login.js is running");
console.log("LOADING");


import { app, db } from "./firebaseConfig.js";

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  setCurrentUser,
  generateGoogleNickname
} from "./userManager.js";


// --------------------------------------------------
// FIREBASE AUTH SETUP
// --------------------------------------------------
const auth = getAuth(app);

// GOOGLE PROVIDER
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// MICROSOFT PROVIDER
const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.setCustomParameters({ prompt: "select_account" });

auth.useDeviceLanguage();


// --------------------------------------------------
// REDIRECT TO MAIN MENU
// --------------------------------------------------
function goToMainMenu() {
  window.location.href = "home.html";
}


// --------------------------------------------------
// GET OR CREATE NICKNAME
// --------------------------------------------------
async function getOrCreateNickname(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data().nickname;
  }

  const nickname = generateGoogleNickname();
  await setDoc(ref, { nickname });
  return nickname;
}


// --------------------------------------------------
// GOOGLE LOGIN
// --------------------------------------------------
document.getElementById("googleLoginBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const uid = result.user.uid;

    const email = result.user.email;
    const schoolDomain = email.split("@")[1].toLowerCase();

    const nickname = await getOrCreateNickname(uid);

    const userObj = {
      id: uid,
      username: nickname,
      provider: "google",
      school: schoolDomain,
      createdAt: Date.now()
    };

    setCurrentUser(userObj);
    goToMainMenu();

  } catch (err) {
    console.error("Google login error:", err);
    alert("Google sign-in failed. Please try again.");
  }
});


// --------------------------------------------------
// MICROSOFT LOGIN
// --------------------------------------------------
document.getElementById("microsoftLoginBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    const uid = result.user.uid;

    const email = result.user.email;
    const schoolDomain = email.split("@")[1].toLowerCase();

    const nickname = await getOrCreateNickname(uid);

    const userObj = {
      id: uid,
      username: nickname,
      provider: "microsoft",
      school: schoolDomain,
      createdAt: Date.now()
    };

    setCurrentUser(userObj);
    goToMainMenu();

  } catch (err) {
    console.error("Microsoft login error:", err);
    alert("Microsoft sign-in failed. Please try again.");
  }
});


// --------------------------------------------------
// PLAY MODE (NO LOGIN)
// --------------------------------------------------
document.getElementById("playBtn").addEventListener("click", () => {
  goToMainMenu();
});








