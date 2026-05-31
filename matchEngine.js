// ===============================
// IMPORTS
// ===============================
import { hideAllScreens } from "./navigation.js";
import { getCurrentUser } from "./userManager.js";
import { db } from "./firebaseConfig.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ===============================
// UNIVERSAL SAFE TOPIC NAME
// ===============================
function safeTopicName(raw) {
  return raw
    .replace(/\//g, "_")
    .replace(/\\/g, "_")
    .replace(/ /g, "_")
    .replace(/[^\w\-]/g, "_");
}


// ===============================
// GO BACK ONE LEVEL
// ===============================
function goBackToTopicOptions() {
  const params = new URLSearchParams(window.location.search);
  const course = params.get("course");
  const unit = params.get("unit");
  const topic = params.get("topic");

  let page = "";

  if (course.startsWith("KS3")) page = "ks3-topic-options.html";
  else if (course.startsWith("KS4")) page = "ks4-topic-options.html";
  else if (course.startsWith("KS5")) page = "ks5-topic-options.html";
  else page = "ks3-topic-options.html";

  window.location.href =
    `${page}?course=${encodeURIComponent(course)}&unit=${encodeURIComponent(unit)}&topic=${encodeURIComponent(topic)}`;
}



// ===============================
// FIRESTORE SAVE FUNCTION
// ===============================
async function saveMatchingScore(topic, time, score, accuracy) {
  const user = getCurrentUser();
  if (!user) return;

  const uid = user.id;
  const school = user.school;
  const date = new Date().toLocaleString();
  const safe = safeTopicName(topic);

  // ⭐ PERSONAL BEST
  const personalRef = doc(db, "users", uid, "scores", `${safe}_matching`);
  const snap = await getDoc(personalRef);

  if (
    !snap.exists() ||
    time < snap.data().time ||
    (time === snap.data().time && score > snap.data().score)
  ) {
    await setDoc(personalRef, {
      topic,
      mode: "matching",
      time,
      score,
      accuracy: Number(accuracy.toFixed(2)),
      date
    });
  }

  // ⭐ SCHOOL LEADERBOARD
  const schoolDocId = `${school}_${safe}_matching`;
  const entryRef = doc(db, "schoolLeaderboards", schoolDocId, "entries", uid);

  const existing = await getDoc(entryRef);

 // ⭐ NEW MATCHING MODE RANKING LOGIC
// Highest score wins. If tied, fastest time wins.
if (
  !existing.exists() ||
  score > existing.data().score ||
  (score === existing.data().score && time < existing.data().time)
){

    await setDoc(entryRef, {
      username: user.username,
      time,
      score,
      accuracy: Number(accuracy.toFixed(2)),
      date,
      userId: uid
    });
  }
}



// ========================================
// MATCHING GAME ENGINE
// ========================================
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
// MATCHING GAME SCORING SYSTEM
// ===============================
let matchScore = 0;
let matchAttempts = 0;
let matchAccuracy = 0;

function updateMatchStats() {
  document.getElementById("matchScore").textContent = matchScore;
  document.getElementById("matchAttempts").textContent = matchAttempts;
  document.getElementById("matchAccuracy").textContent = `${matchAccuracy.toFixed(2)}%`;
}


// POPUP ELEMENTS
const rulesPopup = document.getElementById("matchRulesPopup");
const endPopup = document.getElementById("matchEndPopup");
const endTitle = document.getElementById("matchEndTitle");
const startBtn = document.getElementById("startMatchBtn");
const playAgainBtn = document.getElementById("playAgainMatchBtn");
const revealBtn = document.getElementById("matchRevealBtn");


// ===============================
// RESET STATE
// ===============================
function resetMatchState() {
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
  clearInterval(matchState.matchTimer);

  matchState.matchTimer = setInterval(() => {
    matchState.matchTime += 0.01;
    const timeEl = document.getElementById("matchTime");
    if (timeEl) timeEl.textContent = matchState.matchTime.toFixed(3);
  }, 10);
}

function stopMatchTimer() {
  clearInterval(matchState.matchTimer);
  matchState.matchTimer = null;
}


// ===============================
// END GAME
// ===============================
function endMatchGame() {
  matchState.gameActive = false;
  clearInterval(matchState.matchTimer);

  endTitle.textContent =
    `You matched all pairs in ${matchState.matchTime.toFixed(3)} seconds!`;

  document.getElementById("matchEndScore").textContent =
    `Final Score: ${matchScore}`;

  document.getElementById("matchEndAccuracy").textContent =
    `Accuracy: ${matchAccuracy.toFixed(2)}%`;

  const topic = window.currentTopic;
  saveMatchingScore(topic, matchState.matchTime, matchScore, matchAccuracy);

  endPopup.style.display = "flex";
}


// ===============================
// REVEAL CARD
// ===============================
function revealCard(box) {
  if (!matchState.gameActive) return;
  if (matchState.boardLocked) return;
  if (matchState.revealActive) return;

  const index = Number(box.dataset.index);
  const card = matchState.matchCards[index];
  if (!card) return;

  if (matchState.firstPick === box) return;

  box.textContent = card.text;

  if (!matchState.firstPick) {
    matchState.firstPick = box;
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

  if (isMatch) {
    matchState.firstPick.style.background = "#2ecc71";
    matchState.secondPick.style.background = "#2ecc71";

    matchState.firstPick.onclick = null;
    matchState.secondPick.onclick = null;

    matchState.matchesFound++;

    matchState.firstPick = null;
    matchState.secondPick = null;
    matchState.boardLocked = false;

    if (matchState.matchesFound === matchState.totalPairs) {
      endMatchGame();
    }

  } else {
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
  matchState.matchCards = [];

  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const selectedPairs = shuffled.slice(0, 10);

  selectedPairs.forEach(pair => {
    matchState.matchCards.push({ text: pair.left, match: pair.right });
    matchState.matchCards.push({ text: pair.right, match: pair.left });
  });

  matchState.matchCards.sort(() => Math.random() - 0.5);

  matchState.totalPairs = 10;
}


// ===============================
// RENDER GRID FACE UP
// ===============================
function renderMatchGridFaceUp() {
  const grid = document.getElementById("matchGrid");
  if (!grid) return;

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
// –===============================
function revealAllCards() {
  if (!matchState.gameActive) return;
  if (matchState.revealActive) return;

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

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error("No match data found");
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
  resetMatchState();
  hideAllScreens();
  document.getElementById("matchGameScreen").style.display = "block";
  rulesPopup.style.display = "flex";
}


// ===============================
// START GAME DIRECTLY
// ===============================
export function startMatchGame() {
  startMatchCountdown(window.currentMatchData);
}


// ===============================
// BUTTON EVENTS
// ===============================
if (startBtn) {
  startBtn.onclick = () => startMatchCountdown(window.currentMatchData);
}

if (playAgainBtn) {
  playAgainBtn.onclick = () => {
    endPopup.style.display = "none";
    startMatchCountdown(window.currentMatchData);
  };
}

if (revealBtn) {
  revealBtn.onclick = () => revealAllCards();
}


// ===============================
// QUIT BUTTON (FIXED)
//===============================
const quitBtn = document.getElementById("matchQuitBtn");
if (quitBtn) {
  quitBtn.onclick = () => {
    stopMatchTimer();
    goBackToTopicOptions();
  };
}






