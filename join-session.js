import { db } from "./firebaseConfig.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { setCurrentUser } from "./userManager.js";

// -----------------------------
// 1. GET SESSION CODE
// -----------------------------
const sessionCode = localStorage.getItem("sessionCode");
if (!sessionCode) {
  alert("No session code found. Please join again.");
  window.location.href = "index.html";
}

// -----------------------------
// 2. STABLE DEVICE ID
// -----------------------------
let deviceID = localStorage.getItem("deviceID");
if (!deviceID) {
  deviceID = crypto.randomUUID();
  localStorage.setItem("deviceID", deviceID);
}

// -----------------------------
// 3. STABLE RANDOM COUNTRY NICKNAME
// -----------------------------
let nickname = localStorage.getItem("nickname");

function generateNickname() {
  const countries = [
    "USA","Canada","Mexico","Australia","Iraq","Iran","Japan","Jordan","South Korea",
    "Qatar","Saudi Arabia","Uzbekistan","Algeria","Cabo Verde","DR Congo","Ivory Coast",
    "Egypt","Ghana","Morocco","Senegal","South Africa","Tunisia","Curaçao","Haiti",
    "Panama","Argentina","Brazil","Colombia","Ecuador","Paraguay","Uruguay","New Zealand",
    "Austria","Belgium","Bosnia and Herzegovina","Croatia","Czechia","England","France",
    "Germany","Netherlands","Norway","Portugal","Scotland","Spain","Sweden","Switzerland","Turkey"
  ];

  const country = countries[Math.floor(Math.random() * countries.length)];
  const number = Math.floor(Math.random() * 900) + 100;

  return `${country}${number}`;
}

if (!nickname) {
  nickname = generateNickname();
  localStorage.setItem("nickname", nickname);
}

// -----------------------------
// 4. ADD / UPDATE PLAYER IN SESSION
// -----------------------------
async function joinSession() {
  try {
    const sessionRef = doc(db, "sessions", sessionCode);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      alert("Invalid session code. Please try again.");
      window.location.href = "index.html";
      return;
    }

    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    const existing = await getDoc(playerRef);

    if (!existing.exists()) {
      // First time joining this session
      await setDoc(playerRef, {
        deviceID,
        nickname,
        theoryScore: 0,
        theoryAccuracy: 0,
        matchScore: 0,
        examNet: 0,
        examCorrect: 0,
        examWrong: 0,
        safeTopic: "",
        joinedAt: Date.now()
      });
    }

    // -----------------------------
    // 5. CREATE CURRENT USER OBJECT
    // -----------------------------
    const userObj = {
      id: deviceID,
      username: nickname,
      provider: "session",
      school: `SESSION_${sessionCode}`, // session = school
      createdAt: Date.now()
    };

    // Store user identity
    setCurrentUser(userObj);

    // Save nickname for header
    localStorage.setItem("userWelcomeName", nickname);

    // Redirect to main menu
    window.location.href = "home.html";

  } catch (err) {
    console.error("Error joining session:", err);
    alert("Could not join session. Check Firestore rules or network.");
    window.location.href = "index.html";
  }
}

joinSession();



