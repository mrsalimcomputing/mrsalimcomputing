// ===============================
// SESSION.JS — Join Live Session
// ===============================

import { db } from "./firebaseConfig.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDeviceID, getNickname } from "./auth.js";

// Join a session using the code stored in localStorage
export async function joinLiveSession() {
    const sessionCode = localStorage.getItem("sessionCode");

    if (!sessionCode) {
        alert("No session code found. Please join again.");
        window.location.href = "index.html";
        return;
    }

    const deviceID = getDeviceID();
    const nickname = getNickname();

    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    const existing = await getDoc(playerRef);

    // If player does not exist in this session → create them
    if (!existing.exists()) {
        await setDoc(playerRef, {
            deviceID,
            nickname,
            theoryScore: 0,
            matchScore: 0,
            examNet: 0
        });
    }

    // Save nickname for header display
    localStorage.setItem("userWelcomeName", nickname);

    return { sessionCode, deviceID, nickname };
}

// Save score for a specific mode
export async function saveScore(mode, value) {
    const sessionCode = localStorage.getItem("sessionCode");
    const deviceID = localStorage.getItem("deviceID");

    if (!sessionCode || !deviceID) return;

    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) return;

    const data = playerSnap.data();

    // Update only if score is higher (except examNet which is total)
    if (mode === "examNet") {
        data.examNet = value;
    } else {
        if (value > (data[mode] || 0)) {
            data[mode] = value;
        }
    }

    await setDoc(playerRef, data);
}

// Fetch all players in the session (for leaderboard)
export async function getSessionPlayers() {
    const sessionCode = localStorage.getItem("sessionCode");
    if (!sessionCode) return [];

    const playersRef = collection(db, "sessions", sessionCode, "players");
    const snapshot = await getDocs(playersRef);

    const players = [];
    snapshot.forEach(doc => players.push(doc.data()));
    return players;
}
