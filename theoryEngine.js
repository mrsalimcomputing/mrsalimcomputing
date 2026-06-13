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
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


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
// SAVE THEORY SCORE (CLEAN VERSION)
// ===============================
export async function saveTheoryScore(score, accuracy) {
  const user = getCurrentUser();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "");
  const safe = safeTopicName(topic);

  const uid = user.id;
  const date = new Date().toLocaleString();

  const sessionCode = localStorage.getItem("sessionCode");
  const deviceID = localStorage.getItem("deviceID");
  const nickname = localStorage.getItem("nickname") || user.username || "Guest";

  // ============================================================
  // 1) PERSONAL BEST
  // ============================================================
  const personalDocId = `${safe}_theory`;
  const personalRef = doc(db, "users", uid, "scores", personalDocId);
  const personalSnap = await getDoc(personalRef);

  let bestScore = score;
  let bestAccuracy = accuracy;

  if (personalSnap.exists()) {
    const prev = personalSnap.data();
    const prevScore = prev.score ?? 0;
    const prevAccuracy = prev.accuracy ?? 0;

    if (prevScore > bestScore) {
      bestScore = prevScore;
      bestAccuracy = prevAccuracy;
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

  // ============================================================
  // 2) SESSION MODE LEADERBOARD
  // ============================================================
  if (sessionCode && deviceID) {
    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    const existingSnap = await getDoc(playerRef);

    let shouldUpdate = false;

    if (existingSnap.exists()) {
      const prev = existingSnap.data();
      const prevScore = prev.theoryScore ?? 0;
      const prevAccuracy = prev.theoryAccuracy ?? 0;

      if (score > prevScore || (score === prevScore && accuracy > prevAccuracy)) {
        shouldUpdate = true;
      }
    } else {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      await setDoc(playerRef, {
        deviceID,
        nickname,
        topic,
        safeTopic: safe,
        theoryScore: score,
        theoryAccuracy: accuracy,
        lastUpdated: Date.now()
      }, { merge: true });

      const topicRef = doc(db, "sessions", sessionCode, "players", deviceID, "topics", safe);
      await setDoc(topicRef, {
        topic,
        safeTopic: safe,
        theoryScore: score,
        theoryAccuracy: accuracy,
        updatedAt: Date.now()
      }, { merge: true });
    }

    return;
  }

  // ============================================================
  // 3) SCHOOL LEADERBOARD (NON-SESSION USERS)
  // ============================================================
  const school = user.school;
  if (!school) return;

  const schoolDocId = `${school}_${safe}_theory`;
  const entryRef = doc(db, "schoolLeaderboards", schoolDocId, "entries", uid);
  const existing = await getDoc(entryRef);

  const prevScore = existing.exists() ? existing.data().score ?? 0 : 0;
  const prevAccuracy = existing.exists() ? existing.data().accuracy ?? 0 : 0;

  if (!existing.exists() || bestScore > prevScore || bestAccuracy > prevAccuracy) {
    await setDoc(entryRef, {
      username: user.username,
      score: bestScore,
      accuracy: bestAccuracy,
      date,
      userId: uid,
      topic
    });
  }
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

      if (course && course.startsWith("KS4")) goBackKS4();
      else goBack();
    };
  }
});

// ===============================
// SHOW RULES
// ===============================
export function showTheoryRules(questions) {
  storedQuestions = questions;
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
// START QUIZ (CLEAN, NO DUPLICATE LISTENERS)
// ===============================
export function startTheoryQuiz(questions = storedQuestions) {

  if (!questions || questions.length === 0) {
    alert("No questions available for this topic.");
    return;
  }

  // RESET UI
  if (rulesPopup) rulesPopup.style.display = "none";
  if (endPopup) endPopup.style.display = "none";
  hideAllScreens();

  // RESET STATE
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

  // START QUIZ
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






