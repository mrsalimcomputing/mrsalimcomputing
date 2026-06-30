// ===============================
// IMPORTS
// ===============================
import { hideAllScreens } from "./navigation.js";
import { getCurrentUser } from "./userManager.js";
import { goBack } from "./navigation.js";
import { goBackKS4 } from "./ks4-navigation.js";

import { db } from "./firebaseConfig.js";
import {
  doc,
  setDoc,
  getDoc,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function updateSessionTopic(safe, topic) {
  const sessionCode = localStorage.getItem("sessionCode");
  const deviceID = localStorage.getItem("deviceID");
  if (!sessionCode || !deviceID) return;

  const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);

  await setDoc(playerRef, {
    safeTopic: safe,
    topic: topic
  }, { merge: true });

  console.log("✅ updateSessionTopic → safeTopic set to:", safe);
}


// ===============================
// SAFE TOPIC NAME
// ===============================
function safeTopicName(topic) {
  return topic.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}


// ===============================
// GET TOPIC FROM URL
// ===============================
function getTopicFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return decodeURIComponent(params.get("topic") || "");
}


// ===============================
// THEORY QUIZ ENGINE STATE
// ===============================
let currentQuestionIndex = 0;
let shuffledQuestions = [];
let theoryScore = 0;
let theoryTimeLeft = 60;
let theoryTimer = null;
let storedQuestions = [];
let lockInput = false;

let questionsAttempted = 0;
let accuracy = 0;


// ===============================
// DOM ELEMENTS
// ===============================
let rulesPopup, endPopup, endScoreText, endAccuracyText;

document.addEventListener("DOMContentLoaded", () => {
  rulesPopup = document.getElementById("theoryRulesPopup");
  endPopup = document.getElementById("theoryEndPopup");
  endScoreText = document.getElementById("theoryEndScore");
  endAccuracyText = document.getElementById("endAccuracyText");

  const startBtn = document.getElementById("startTheoryBtn");
  const playAgainBtn = document.getElementById("playAgainTheoryBtn");
  const quitBtn = document.getElementById("theoryQuitBtn");

  if (startBtn) startBtn.onclick = () => startTheoryQuiz();
  if (playAgainBtn) playAgainBtn.onclick = () => startTheoryQuiz();

  if (quitBtn) {
    quitBtn.onclick = () => {
      clearInterval(theoryTimer);

      const params = new URLSearchParams(window.location.search);
      const course = params.get("course");

      if (course && course.startsWith("KS4")) {
        goBackKS4();
      } else {
        goBack();
      }
    };
  }
});


// ===============================
// SAVE THEORY SCORE (FINAL, FIXED + SAFEGUARD)
// ===============================
export async function saveTheoryScore(score, accuracy) {
  console.log("🔍 saveTheoryScore() START — score:", score, "accuracy:", accuracy);

  const user = getCurrentUser();
  if (!user) {
    console.warn("❌ No current user found — aborting saveTheoryScore");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "");
  const safe = safeTopicName(topic);

  const uid = user.id;
  const date = new Date().toLocaleString();

  const sessionCode = localStorage.getItem("sessionCode");
  const deviceID = localStorage.getItem("deviceID");
  const nickname = localStorage.getItem("nickname") || user.username || "Guest";

  console.log("🧩 Context — uid:", uid, "sessionCode:", sessionCode, "deviceID:", deviceID, "school:", user.school);

  // ============================================================
  // 1) PERSONAL BEST
  // ============================================================
  const personalDocId = `${safe}_theory`;
  const personalRef = doc(db, "users", uid, "scores", personalDocId);
  const personalSnap = await getDoc(personalRef);
  console.log("📄 Checking personalRef:", personalRef.path, "exists:", personalSnap.exists());

  let bestScore = score;
  let bestAccuracy = accuracy;

  if (personalSnap.exists()) {
    const prev = personalSnap.data();
    console.log("📄 Previous personal score:", prev);
    const prevScore = prev.score ?? 0;
    const prevAccuracy = prev.accuracy ?? 0;

    if (prevScore > bestScore) {
      bestScore = prevScore;
      bestAccuracy = prevAccuracy;
      console.log("⚠️ Keeping previous personal best:", bestScore, bestAccuracy);
    }
  }

  await setDoc(personalRef, {
    username: user.username,
    nickname,
    topic,
    safeTopic: safe,
    mode: "theory",
    score: bestScore,
    accuracy: bestAccuracy,
    date,
    updatedAt: Date.now()
  }, { merge: true });

  console.log("✅ Personal best saved:", bestScore, bestAccuracy);

 // ============================================================
// 2) SESSION MODE LEADERBOARD (PLAYER + TOPIC DOCS) — FIXED WITH TRANSACTION
// ============================================================
if (sessionCode && deviceID) {
  const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
  const topicRef = doc(db, "sessions", sessionCode, "players", deviceID, "topics", safe);

  console.log("🔒 Running Firestore TRANSACTION for session theory score...");

  await runTransaction(db, async (tx) => {
    const playerSnap = await tx.get(playerRef);

    let prevScore = 0;
    let prevAccuracy = 0;

    if (playerSnap.exists()) {
      const prev = playerSnap.data();
      prevScore = prev.theoryScore ?? 0;
      prevAccuracy = prev.theoryAccuracy ?? 0;
      console.log("📄 Transaction read — prevScore:", prevScore, "prevAccuracy:", prevAccuracy);
    }

    // Only update if new score is higher
  if (!playerSnap.exists() || score > prevScore || (score === prevScore && accuracy > prevAccuracy)) {
    console.log("🔁 Transaction: creating or updating session score to:", score, accuracy);

      tx.set(playerRef, {
        deviceID,
        nickname,
        topic,
        safeTopic: safe,
        theoryScore: score,
        theoryAccuracy: accuracy,
        lastUpdated: Date.now()
      }, { merge: true });

      tx.set(topicRef, {
        topic,
        safeTopic: safe,
        theoryScore: score,
        theoryAccuracy: accuracy,
        updatedAt: Date.now()
      }, { merge: true });
    } else {
      console.log("⏩ Transaction: lower score ignored:", score, accuracy);
    }
  });

  console.log("✅ Transaction complete — session leaderboard protected");
}

  // ============================================================
  // 3) SCHOOL / SESSION LEADERBOARD (Your School / Session Top 5)
  // ============================================================
  const school = user.school; // For session users: "SESSION_54321"
  console.log("🏫 School value:", school);
  if (school) {
    const schoolDocId = `${school}_${safe}_theory`;
    const entryRef = doc(db, "schoolLeaderboards", schoolDocId, "entries", uid);
    const existing = await getDoc(entryRef);
    console.log("📄 Checking school leaderboard entry:", entryRef.path, "exists:", existing.exists());

    const prevScore = existing.exists() ? existing.data().score ?? 0 : 0;
    const prevAccuracy = existing.exists() ? existing.data().accuracy ?? 0 : 0;

    if (!existing.exists() || bestScore > prevScore || bestAccuracy > prevAccuracy) {
      await setDoc(entryRef, {
        username: user.username,
        nickname,
        score: bestScore,
        accuracy: bestAccuracy,
        date,
        userId: uid,
        topic,
        safeTopic: safe,
        mode: "theory"
      }, { merge: true });

      console.log("✅ SCHOOL LEADERBOARD UPDATED:", nickname, bestScore, bestAccuracy);
    } else {
      console.log("⏩ School leaderboard not updated — previous entry is better");
    }
  } else {
    console.warn("⚠️ No school value found — skipping school leaderboard update");
  }

  // ⭐ SAFEGUARD: short delay before leaderboard read
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log("⏳ Delay complete — ready for leaderboard read");

  // ============================================================
  // 4) UPDATE SESSION PLAYER DOC SO SESSION TOP 5 SHOWS CORRECT SCORE
  // ============================================================
  if (sessionCode && deviceID) {
    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    await setDoc(playerRef, {
      theoryScore: score,
      theoryAccuracy: accuracy,
      safeTopic: safe,
      topic: topic,
      lastUpdated: Date.now()
    }, { merge: true });

    console.log("✅ Session player updated for leaderboard:", nickname, score, accuracy);
  }

  console.log("🎯 saveTheoryScore() END *********************");
}




// ===============================
// SHOW RULES
// ===============================
export function showTheoryRules(questions) {

  storedQuestions = questions;

  const topic = getTopicFromUrl();
  const safe = safeTopicName(topic);

  updateSessionTopic(safe, topic);   // ⭐ REQUIRED FIX

  if (rulesPopup) rulesPopup.style.display = "flex";
}


// ===============================
// TIMER
// ===============================
function startTheoryTimer() {
  clearInterval(theoryTimer);

  theoryTimer = setInterval(() => {
    theoryTimeLeft--;
    document.getElementById("theoryTime").textContent = theoryTimeLeft;

    if (theoryTimeLeft <= 0) {
      clearInterval(theoryTimer);
      endTheoryQuiz();
    }
  }, 1000);
}


// ===============================
// START QUIZ
// ===============================
export function startTheoryQuiz(questions = storedQuestions) {
  if (!questions || questions.length === 0) {
    alert("No questions available for this topic.");
    return;
  }

  if (rulesPopup) rulesPopup.style.display = "none";
  if (endPopup) endPopup.style.display = "none";
  hideAllScreens();

  currentQuestionIndex = 0;
  theoryScore = 0;
  theoryTimeLeft = 60;
  lockInput = false;

  questionsAttempted = 0;
  accuracy = 0;
  updateStatsBar();

  shuffledQuestions = shuffleArray([...questions]);

  document.getElementById("theoryScore").textContent = theoryScore;
  document.getElementById("theoryTime").textContent = theoryTimeLeft;

  startTheoryTimer();
  document.getElementById("theoryQuizScreen").style.display = "block";

  loadTheoryQuestion();
}


// ===============================
// LOAD QUESTION
// ===============================
function loadTheoryQuestion() {
  const q = shuffledQuestions[currentQuestionIndex];
  if (!q || !q.correct || !q.wrong) return;

  lockInput = false;

  const correct = q.correct[Math.floor(Math.random() * q.correct.length)];
  const wrongShuffled = q.wrong.sort(() => Math.random() - 0.5);
  const selectedWrong = wrongShuffled.slice(0, Math.min(8, wrongShuffled.length));

  const answers = [...selectedWrong, correct].sort(() => Math.random() - 0.5);

  document.getElementById("theoryQuestionBox").textContent = q.question;

  const buttons = document.querySelectorAll(".quiz-btn");
  buttons.forEach((btn, index) => {
    btn.disabled = false;
    btn.textContent = answers[index];
    btn.onclick = () => checkTheoryAnswer(answers[index], correct);
  });
}


// ===============================
// CHECK ANSWER
// ===============================
function checkTheoryAnswer(selected, correct) {
  if (lockInput) return;
  lockInput = true;

  const buttons = document.querySelectorAll(".quiz-btn");
  buttons.forEach(btn => btn.disabled = true);

  const isCorrect = selected === correct;

  questionsAttempted++;

  if (isCorrect) {
    theoryScore++;
    flashTheoryCorrect();
  } else {
    theoryScore = Math.max(0, theoryScore - 1);
    flashTheoryWrong();
  }

  accuracy = (questionsAttempted > 0)
    ? (theoryScore / questionsAttempted) * 100
    : 0;

  updateStatsBar();

  currentQuestionIndex++;
  if (currentQuestionIndex >= shuffledQuestions.length) currentQuestionIndex = 0;

  loadTheoryQuestion();
}


// ===============================
// END QUIZ
// ===============================
function endTheoryQuiz() {
  clearInterval(theoryTimer);

  if (endScoreText) endScoreText.textContent = `Final Score: ${theoryScore}`;
  if (endAccuracyText) endAccuracyText.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;

  saveTheoryScore(theoryScore, accuracy);

  if (endPopup) endPopup.style.display = "flex";
}


// ===============================
// SHUFFLE
// ===============================
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}


// ===============================
// STOP QUIZ
// ===============================
export function stopTheoryQuiz() {
  clearInterval(theoryTimer);
  theoryTimer = null;

  currentQuestionIndex = 0;
  shuffledQuestions = [];
  theoryScore = 0;
  theoryTimeLeft = 0;
}


// ===============================
// UPDATE TOP BAR
// ===============================
function updateStatsBar() {
  document.getElementById("theoryScore").textContent = theoryScore;
  document.getElementById("questionCount").textContent = questionsAttempted;
  document.getElementById("accuracy").textContent = `${accuracy.toFixed(0)}%`;
}


// ===============================
// FLASH FEEDBACK
// ===============================
function flashTheoryCorrect() {
  const box = document.getElementById("theoryQuestionBox");
  box.style.background = "#c8ffcc";
  setTimeout(() => box.style.background = "#ffffff", 150);
}

function flashTheoryWrong() {
  const box = document.getElementById("theoryQuestionBox");
  box.style.background = "#ffcccc";
  setTimeout(() => box.style.background = "#ffffff", 150);
}






