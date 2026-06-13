// ===============================
// IMPORTS
// ===============================
import { hideAllScreens } from "./navigation.js";
import { getCurrentUser } from "./userManager.js";
import { goBack } from "./navigation.js";        // KS3
import { goBackKS4 } from "./ks4-navigation.js"; // KS4

import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ===============================
// SAFE TOPIC NAME
// ===============================
function safeTopicName(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}


// ===============================
// GET TOPIC FROM URL
// ===============================
function getTopicFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get("topic") || "";
  const decoded = decodeURIComponent(t);

  console.log("🔍 getTopicFromUrl() →", decoded);
  return decoded;
}


// ===============================
// MATCHING GAME STATE
// ===============================
window.currentMatchData = window.currentMatchData || [];

const matchState = {
  matchCards: [],
  firstPick: null,
  secondPick: null,
  matchesFound: 0,
  totalPairs: 0,
  matchTimer: null,
  matchTime: 0,
  boardLocked: false,
  countdownInterval: null,
  gameActive: false,
  revealActive: false
};


// ===============================
// SCORING
// ===============================
let matchScore = 0;
let matchAttempts = 0;
let matchAccuracy = 0;

function updateMatchStats() {
  console.log("📊 updateMatchStats()", {
    matchScore,
    matchAttempts,
    matchAccuracy
  });

  document.getElementById("matchScore").textContent = matchScore;
  document.getElementById("matchAttempts").textContent = matchAttempts;
  document.getElementById("matchAccuracy").textContent = `${matchAccuracy.toFixed(2)}%`;
}


// ===============================
// POPUP ELEMENTS
// ===============================
const rulesPopup = document.getElementById("matchRulesPopup");
const endPopup = document.getElementById("matchEndPopup");
const endTitle = document.getElementById("matchEndTitle");
const startBtn = document.getElementById("startMatchBtn");
const playAgainBtn = document.getElementById("playAgainMatchBtn");
const revealBtn = document.getElementById("matchRevealBtn");


// ===============================
// RESET MATCH STATE
// ===============================
function resetMatchState() {
  console.log("🔄 resetMatchState()");

  matchState.matchCards = [];
  matchState.firstPick = null;
  matchState.secondPick = null;
  matchState.matchesFound = 0;
  matchState.totalPairs = 0;
  matchState.matchTime = 0;
  matchState.boardLocked = false;
  matchState.gameActive = false;
  matchState.revealActive = false;

  clearInterval(matchState.matchTimer);
  clearInterval(matchState.countdownInterval);

  matchState.matchTimer = null;
  matchState.countdownInterval = null;

  const timeEl = document.getElementById("matchTime");
  if (timeEl) timeEl.textContent = "0.000";

  const grid = document.getElementById("matchGrid");
  if (grid) grid.innerHTML = "";

  const overlay = document.getElementById("countdownOverlay");
  if (overlay) overlay.remove();

  matchScore = 0;
  matchAttempts = 0;
  matchAccuracy = 0;

  updateMatchStats();
}


// ===============================
// TIMER
// ===============================
function startMatchTimer() {
  console.log("⏱ startMatchTimer()");

  clearInterval(matchState.matchTimer);

  matchState.matchTimer = setInterval(() => {
    matchState.matchTime += 0.01;
    const timeEl = document.getElementById("matchTime");
    if (timeEl) timeEl.textContent = matchState.matchTime.toFixed(3);
  }, 10);
}

function stopMatchTimer() {
  console.log("⏹ stopMatchTimer()");
  clearInterval(matchState.matchTimer);
  matchState.matchTimer = null;
}

// ===============================
// FIRESTORE SAVE FUNCTION (PERSONAL + SCHOOL)
// ===============================
async function saveMatchingScore(topic, time, score, accuracy) {
  console.log("💾 saveMatchingScore() CALLED with:", { topic, time, score, accuracy });

  const user = getCurrentUser();
  console.log("🔍 getCurrentUser() →", user);
  if (!user) {
    console.warn("⚠️ No user, aborting saveMatchingScore()");
    return;
  }

  const uid = user.id;
  const school = user.school;
  const date = new Date().toLocaleString();
  const safe = safeTopicName(topic);

  console.log("🔍 safeTopicName(topic) →", safe);

  // ===============================
  // 1️⃣ PERSONAL BEST
  // ===============================
  const personalRef = doc(db, "users", uid, "scores", `${safe}_matching`);
  const personalSnap = await getDoc(personalRef);

  console.log("📄 PERSONAL DOC PATH:", `users/${uid}/scores/${safe}_matching`);
  console.log("📄 personalSnap.exists():", personalSnap.exists());

  let shouldUpdatePersonal = false;

  if (!personalSnap.exists()) {
    console.log("🆕 No existing personal matching score, will create new.");
    shouldUpdatePersonal = true;
  } else {
    const prev = personalSnap.data();
    console.log("📄 Existing personal matching data:", prev);

    const prevTime = Number(prev.time ?? Infinity);
    const prevScore = Number(prev.score ?? 0);
    const prevAccuracy = Number(prev.accuracy ?? 0);

    const isBetter =
      time < prevTime ||
      (time === prevTime && score > prevScore) ||
      (time === prevTime && score === prevScore && accuracy > prevAccuracy);

    console.log("🔍 Personal comparison:", {
      prevTime,
      prevScore,
      prevAccuracy,
      newTime: time,
      newScore: score,
      newAccuracy: accuracy,
      isBetter
    });

    if (isBetter) {
      console.log("✅ New personal matching score is better, will update.");
      shouldUpdatePersonal = true;
    } else {
      console.log("ℹ️ New personal matching score is NOT better, skipping update.");
    }
  }

  if (shouldUpdatePersonal) {
    await setDoc(personalRef, {
      topic,
      safeTopic: safe,
      mode: "matching",
      time,
      score,
      accuracy: Number(accuracy.toFixed(2)),
      date,
      username: user.username,
      nickname: user.nickname || user.username || "Guest",
      updatedAt: Date.now()
    }, { merge: true });

    console.log("✅ PERSONAL MATCHING SCORE SAVED/UPDATED.");
  }

  // ===============================
  // 2️⃣ SESSION MODE LEADERBOARD (FIXED FIELD NAMES)
// ===============================
  const sessionCode = localStorage.getItem("sessionCode");
  const deviceID = localStorage.getItem("deviceID");
  const nickname = localStorage.getItem("nickname") || user.username || "Guest";

  console.log("🟣 SESSION DEBUG:", { sessionCode, deviceID, nickname });

  if (sessionCode && deviceID) {
    console.log("📄 SESSION PLAYER PATH:", `sessions/${sessionCode}/players/${deviceID}`);

    await setDoc(doc(db, "sessions", sessionCode, "players", deviceID), {
      deviceID,
      nickname,
      topic,
      safeTopic: safe,
      // use same field names as leaderboard expects
      time,
      score,
      accuracy: Number(accuracy.toFixed(2)),
      lastUpdated: Date.now()
    }, { merge: true });

    console.log("✅ SESSION MATCHING SCORE SAVED:", nickname, score, accuracy, time);
  } else {
    console.log("⚠️ No sessionCode/deviceID found, skipping session leaderboard.");
  }

  // ===============================
  // 3️⃣ SCHOOL LEADERBOARD
  // ===============================
  if (!school) {
    console.log("⚠️ No school on user, skipping school leaderboard.");
    return;
  }

  const schoolDocId = `${school}_${safe}_matching`;
  const entryRef = doc(db, "schoolLeaderboards", schoolDocId, "entries", uid);

  console.log("📄 SCHOOL ENTRY PATH:", `schoolLeaderboards/${schoolDocId}/entries/${uid}`);

  const existing = await getDoc(entryRef);
  console.log("📄 existing school entry exists:", existing.exists());

  let shouldUpdateSchool = false;

  if (!existing.exists()) {
    console.log("🆕 No existing school matching entry, will create new.");
    shouldUpdateSchool = true;
  } else {
    const prev = existing.data();
    console.log("📄 Existing school matching data:", prev);

    const prevTime = Number(prev.time ?? Infinity);
    const prevScore = Number(prev.score ?? 0);
    const prevAccuracy = Number(prev.accuracy ?? 0);

    const isBetter =
      time < prevTime ||
      (time === prevTime && score > prevScore) ||
      (time === prevTime && score === prevScore && accuracy > prevAccuracy);

    console.log("🔍 School comparison:", {
      prevTime,
      prevScore,
      prevAccuracy,
      newTime: time,
      newScore: score,
      newAccuracy: accuracy,
      isBetter
    });

    if (isBetter) {
      console.log("✅ New school matching score is better, will update.");
      shouldUpdateSchool = true;
    } else {
      console.log("ℹ️ New school matching score is NOT better, skipping update.");
    }
  }

  if (shouldUpdateSchool) {
    await setDoc(entryRef, {
      username: user.username,
      nickname: user.nickname || user.username || "Guest",
      time,
      score,
      accuracy: Number(accuracy.toFixed(2)),
      date,
      userId: uid,
      topic,
      safeTopic: safe,
      mode: "matching",
      updatedAt: Date.now()
    }, { merge: true });

    console.log("✅ SCHOOL MATCHING SCORE SAVED/UPDATED.");
  }
}




// ===============================
// END GAME
// ===============================
function endMatchGame() {

  console.log("SESSION DEBUG:", {
  sessionCode: localStorage.getItem("sessionCode"),
  deviceID: localStorage.getItem("deviceID"),
  nickname: localStorage.getItem("nickname")
});


  console.log("🏁 endMatchGame() CALLED");

  matchState.gameActive = false;
  clearInterval(matchState.matchTimer);

  endTitle.textContent =
    `You matched all pairs in ${matchState.matchTime.toFixed(3)} seconds!`;

  document.getElementById("matchEndScore").textContent =
    `Final Score: ${matchScore}`;

  document.getElementById("matchEndAccuracy").textContent =
    `Accuracy: ${matchAccuracy.toFixed(2)}%`;

  const topic = getTopicFromUrl();
  console.log("🔍 endMatchGame() topic:", topic);

  saveMatchingScore(topic, matchState.matchTime, matchScore, matchAccuracy)
    .catch(err => console.error("❌ Error in saveMatchingScore:", err));

  endPopup.style.display = "flex";
}


// ===============================
// REVEAL CARD
// ===============================
function revealCard(box) {
  if (!matchState.gameActive) {
    console.log("⛔ revealCard() ignored: game not active");
    return;
  }
  if (matchState.boardLocked) {
    console.log("⛔ revealCard() ignored: board locked");
    return;
  }
  if (matchState.revealActive) {
    console.log("⛔ revealCard() ignored: revealActive");
    return;
  }

  const index = Number(box.dataset.index);
  const card = matchState.matchCards[index];
  if (!card) {
    console.warn("⚠️ revealCard(): no card at index", index);
    return;
  }

  if (matchState.firstPick === box) {
    console.log("ℹ️ Same card clicked again, ignoring.");
    return;
  }

  box.textContent = card.text;

  if (!matchState.firstPick) {
    matchState.firstPick = box;
    console.log("🃏 First pick set:", index, card);
    return;
  }

  matchState.secondPick = box;
  matchState.boardLocked = true;

  const firstCard = matchState.matchCards[Number(matchState.firstPick.dataset.index)];
  const secondCard = matchState.matchCards[Number(matchState.secondPick.dataset.index)];

  const isMatch =
    firstCard.match === secondCard.text ||
    secondCard.match === firstCard.text;

  matchAttempts++;

  if (isMatch) {
    matchScore += 1;
  } else {
    matchScore = Math.max(0, matchScore - 1);
  }

  matchAccuracy = (matchScore / matchAttempts) * 100;
  updateMatchStats();

  console.log("🎯 Match attempt:", {
    isMatch,
    matchScore,
    matchAttempts,
    matchAccuracy
  });

  if (isMatch) {
    matchState.firstPick.style.background = "#2ecc71";
    matchState.secondPick.style.background = "#2ecc71";

    matchState.firstPick.onclick = null;
    matchState.secondPick.onclick = null;

    matchState.matchesFound++;

    console.log("✅ Match found. Total matches:", matchState.matchesFound);

    matchState.firstPick = null;
    matchState.secondPick = null;
    matchState.boardLocked = false;

    if (matchState.matchesFound === matchState.totalPairs) {
      console.log("🏆 All pairs matched!");
      endMatchGame();
    }

  } else {
    console.log("❌ Not a match, flipping back in 800ms");

    setTimeout(() => {
      if (matchState.firstPick) matchState.firstPick.textContent = "";
      if (matchState.secondPick) matchState.secondPick.textContent = "";

      matchState.firstPick = null;
      matchState.secondPick = null;
      matchState.boardLocked = false;

    }, 800);
  }
}


// ===============================
// BUILD CARDS
// ===============================
function buildMatchCardsFromData(data) {
  console.log("🧩 buildMatchCardsFromData() with", data?.length, "pairs");

  matchState.matchCards = [];

  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const selectedPairs = shuffled.slice(0, 10);

  selectedPairs.forEach(pair => {
    matchState.matchCards.push({ text: pair.left, match: pair.right });
    matchState.matchCards.push({ text: pair.right, match: pair.left });
  });

  matchState.matchCards.sort(() => Math.random() - 0.5);

  matchState.totalPairs = 10;

  console.log("🧩 matchCards built:", matchState.matchCards);
}


// ===============================
// RENDER GRID FACE UP
// ===============================
function renderMatchGridFaceUp() {
  console.log("🖼 renderMatchGridFaceUp()");

  const grid = document.getElementById("matchGrid");
  if (!grid) {
    console.error("❌ renderMatchGridFaceUp(): #matchGrid not found");
    return;
  }

  grid.innerHTML = "";

  matchState.matchCards.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "match-box";
    div.dataset.index = index.toString();
    div.textContent = card.text;
    grid.appendChild(div);
  });
}


// ===============================
// FLIP DOWN + ACTIVATE
// ===============================
function flipGridFaceDownAndActivate() {
  console.log("🔄 flipGridFaceDownAndActivate()");

  const boxes = document.querySelectorAll(".match-box");

  boxes.forEach(box => {
    box.textContent = "";
    box.style.background = "#4a90e2";
    box.onclick = () => revealCard(box);
  });

  matchState.gameActive = true;
  startMatchTimer();
}


// ===============================
// REVEAL ALL CARDS (3 SECONDS)
// ===============================
function revealAllCards() {
  console.log("👀 revealAllCards() CALLED");

  if (!matchState.gameActive) {
    console.log("⛔ revealAllCards(): game not active");
    return;
  }
  if (matchState.revealActive) {
    console.log("⛔ revealAllCards(): already revealing");
    return;
  }

  matchState.revealActive = true;
  matchState.boardLocked = true;

  const boxes = document.querySelectorAll(".match-box");

  boxes.forEach((box, index) => {
    const card = matchState.matchCards[index];
    box.textContent = card.text;
  });

  const overlay = document.createElement("div");
  overlay.id = "countdownOverlay";
  overlay.style.position = "absolute";
  overlay.style.top = "50%";
  overlay.style.left = "50%";
  overlay.style.transform = "translate(-50%, -50%)";
  overlay.style.fontSize = "60px";
  overlay.style.fontWeight = "bold";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.color = "white";
  overlay.style.padding = "20px 40px";
  overlay.style.borderRadius = "10px";
  overlay.style.zIndex = "999";
  overlay.textContent = "3";

  document.getElementById("matchGameScreen").appendChild(overlay);

  let timeLeft = 3;

  matchState.countdownInterval = setInterval(() => {

    timeLeft--;
    overlay.textContent = timeLeft.toString();

    if (timeLeft <= 0) {

      clearInterval(matchState.countdownInterval);
      matchState.countdownInterval = null;

      overlay.remove();

      boxes.forEach((box, index) => {
        if (box.style.background === "rgb(46, 204, 113)") return;
        box.textContent = "";
      });

      matchState.revealActive = false;
      matchState.boardLocked = false;
    }

  }, 1000);
}


// ===============================
// START MATCH COUNTDOWN
// ===============================
export function startMatchCountdown(data = window.currentMatchData) {
  console.log("⏳ startMatchCountdown() CALLED");

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error("❌ No match data found for countdown");
    return;
  }

  rulesPopup.style.display = "none";
  endPopup.style.display = "none";

  hideAllScreens();
  document.getElementById("matchGameScreen").style.display = "block";

  resetMatchState();
  buildMatchCardsFromData(data);
  renderMatchGridFaceUp();

  const overlay = document.createElement("div");
  overlay.id = "countdownOverlay";
  overlay.style.position = "absolute";
  overlay.style.top = "50%";
  overlay.style.left = "50%";
  overlay.style.transform = "translate(-50%, -50%)";
  overlay.style.fontSize = "60px";
  overlay.style.fontWeight = "bold";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.color = "white";
  overlay.style.padding = "20px 40px";
  overlay.style.borderRadius = "10px";
  overlay.style.zIndex = "999";
  overlay.textContent = "5";

  document.getElementById("matchGameScreen").appendChild(overlay);

  let timeLeft = 5;

  matchState.countdownInterval = setInterval(() => {
    timeLeft--;
    overlay.textContent = timeLeft.toString();

    if (timeLeft <= 0) {
      clearInterval(matchState.countdownInterval);
      matchState.countdownInterval = null;

      overlay.remove();
      flipGridFaceDownAndActivate();
    }
  }, 1000);
}


// ===============================
// SHOW RULES
// ===============================
export function showMatchRules() {
  console.log("📘 showMatchRules()");
  resetMatchState();
  hideAllScreens();
  document.getElementById("matchGameScreen").style.display = "block";
  rulesPopup.style.display = "flex";
}


// ===============================
// START GAME DIRECTLY
// ===============================
export function startMatchGame() {
  console.log("▶️ startMatchGame()");
  startMatchCountdown(window.currentMatchData);
}


// ===============================
// BUTTON EVENTS
// ===============================
if (startBtn) {
  startBtn.onclick = () => {
    console.log("🟢 Start button clicked");
    startMatchCountdown(window.currentMatchData);
  };
}

if (playAgainBtn) {
  playAgainBtn.onclick = () => {
    console.log("🔁 Play Again clicked");
    endPopup.style.display = "none";
    startMatchCountdown(window.currentMatchData);
  };
}

if (revealBtn) {
  revealBtn.onclick = () => {
    console.log("👀 Reveal button clicked");
    revealAllCards();
  };
}


// ===============================
// QUIT BUTTON (MATCHING MODE)
// — behaves EXACTLY like theory engine
// ===============================
const quitBtn = document.getElementById("matchQuitBtn");

if (quitBtn) {
  quitBtn.onclick = () => {
    console.log("🚪 Quit button clicked in matching mode");

    stopMatchTimer();

    const params = new URLSearchParams(window.location.search);
    const course = params.get("course");

    console.log("🔍 Quit course param:", course);

    if (course && course.startsWith("KS4")) {
      console.log("↩️ Using goBackKS4()");
      goBackKS4();
    } else {
      console.log("↩️ Using goBack()");
      goBack();
    }
  };
}

console.log("✅ Matching Engine Loaded Successfully");







