// ===============================
// SESSION.JS — Join Live Session
// ===============================

import { db } from "./firebaseConfig.js";
import { doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDeviceID, getNickname } from "./auth.js";


// Join a session using the code stored in localStorage
export async function joinLiveSession() {
    const sessionCode = localStorage.getItem("sessionCode");

    console.log("🚀 joinLiveSession() START — sessionCode:", sessionCode);

    if (!sessionCode) {
        alert("No session code found. Please join again.");
        window.location.href = "index.html";
        return;
    }

    const deviceID = getDeviceID();
    const nickname = getNickname();

    console.log("🧩 joinLiveSession() — deviceID:", deviceID, "nickname:", nickname);

    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    const existing = await getDoc(playerRef);

    if (!existing.exists()) {
        console.log("🆕 Creating NEW PLAYER:", deviceID);

        await setDoc(playerRef, {
            deviceID,
            nickname,
            theoryScore: 0,
            matchScore: 0,
            examNet: 0
        });
    } else {
        console.log("ℹ️ Player already exists:", deviceID);
    }

    localStorage.setItem("userWelcomeName", nickname);

    return { sessionCode, deviceID, nickname };
}


// Save score for a specific mode
export async function saveScore(mode, value) {
    const sessionCode = localStorage.getItem("sessionCode");
    const deviceID = localStorage.getItem("deviceID");

    console.log("💾 saveScore() — mode:", mode, "value:", value, "deviceID:", deviceID);

    if (!sessionCode || !deviceID) return;

    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
        console.warn("⚠️ saveScore(): player not found:", deviceID);
        return;
    }

    const data = playerSnap.data();

    if (mode === "examNet") {
        data.examNet = value;
    } else {
        if (value > (data[mode] || 0)) {
            data[mode] = value;
        }
    }

    await setDoc(playerRef, data);
    console.log("✅ saveScore() COMPLETE");
}


// Fetch all players in the session (for leaderboard)
export async function getSessionPlayers() {
    const sessionCode = localStorage.getItem("sessionCode");
    if (!sessionCode) return [];

    console.log("📥 getSessionPlayers() — sessionCode:", sessionCode);

    const playersRef = collection(db, "sessions", sessionCode, "players");
    const snapshot = await getDocs(playersRef);

    const players = [];
    snapshot.forEach(doc => players.push(doc.data()));

    console.log("📊 getSessionPlayers() — found players:", players);
    return players;
}

