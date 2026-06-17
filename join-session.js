// ===============================
// IMPORTS
// ===============================
import { db } from "./firebaseConfig.js";
import { doc, setDoc, getDoc, getDocFromServer } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { setCurrentUser } from "./userManager.js";


// ===============================
// RESET LOCAL DATA WHEN NEW SESSION STARTS
// ===============================
function resetSessionData(newSessionCode) {
  try {
    console.log("🔄 resetSessionData() START — newSessionCode:", newSessionCode);

    // Clear cached Firestore data
    if (typeof indexedDB !== "undefined") {
      indexedDB.deleteDatabase("firebaseLocalStorageDb");
      indexedDB.deleteDatabase("firestore");
    }

    // DO NOT KEEP OLD deviceID — THIS CAUSED OVERWRITES
    localStorage.removeItem("deviceID");

    // Remove old nickname
    localStorage.removeItem("nickname");

    // Set new session code
    localStorage.setItem("sessionCode", newSessionCode);

    console.log("✅ resetSessionData() COMPLETE — deviceID cleared, nickname cleared");
  } catch (err) {
    console.warn("⚠️ resetSessionData() ERROR:", err);
  }
}



// ===============================
// 1. GET SESSION CODE
// ===============================
const sessionCode = localStorage.getItem("sessionCode");
if (!sessionCode) {
  alert("No session code found. Please join again.");
  window.location.href = "index.html";
}


// ===============================
// 2. ALWAYS GENERATE NEW DEVICE ID
// ===============================
let deviceID = crypto.randomUUID();
localStorage.setItem("deviceID", deviceID);
console.log("🆕 NEW DEVICE ID GENERATED:", deviceID);


// ===============================
// 3. ALWAYS GENERATE NEW RANDOM COUNTRY NICKNAME
// ===============================
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

let nickname = generateNickname();
localStorage.setItem("nickname", nickname);
console.log("🆕 NEW RANDOM NICKNAME:", nickname);


// ===============================
// 4. ADD / UPDATE PLAYER IN SESSION
// ===============================
async function joinSession() {
  try {
    console.log("🚀 joinSession() START — sessionCode:", sessionCode);

    const sessionRef = doc(db, "sessions", sessionCode);
    const sessionSnap = await getDocFromServer(sessionRef);

    if (!sessionSnap.exists()) {
      alert("Invalid session code. Please try again.");
      window.location.href = "index.html";
      return;
    }

    // Reset local data (clears old deviceID)
    resetSessionData(sessionCode);

    // Reapply new deviceID + nickname after reset
    localStorage.setItem("deviceID", deviceID);
    localStorage.setItem("nickname", nickname);

    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    const existing = await getDocFromServer(playerRef);

    if (!existing.exists()) {
      console.log("🆕 Creating NEW PLAYER in session:", deviceID);

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
    } else {
      console.log("ℹ️ Player already existed — SHOULD NOT HAPPEN NOW");
    }

    // Create user object
    const userObj = {
      id: deviceID,
      username: nickname,
      provider: "session",
      school: `SESSION_${sessionCode}`,
      createdAt: Date.now()
    };

    setCurrentUser(userObj);

    localStorage.setItem("userWelcomeName", nickname);

    console.log("🎉 joinSession() COMPLETE — redirecting to home.html");
    window.location.href = "home.html";

  } catch (err) {
    console.error("❌ joinSession() ERROR:", err);
    alert("Could not join session. Check Firestore rules or network.");
    window.location.href = "index.html";
  }
}

joinSession();





