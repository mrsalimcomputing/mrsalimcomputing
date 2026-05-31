// ===============================
// IMPORTS
// ===============================
import { hideAllScreens } from "./navigation.js";
import { getCurrentUser } from "./userManager.js";

import { db } from "./firebaseConfig.js";
import {
  doc,
  setDoc,
  getDoc
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
// GO BACK ONE LEVEL (TOPIC OPTIONS PAGE)
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
  else page = "ks3-topic-options.html"; // fallback

  window.location.href =
    `${page}?course=${encodeURIComponent(course)}&unit=${encodeURIComponent(unit)}&topic=${encodeURIComponent(topic)}`;
}



// ===============================
// FIRESTORE SAVE FUNCTION
// ===============================
export async function saveTheoryScore(topic, score, accuracy) {
  const user = getCurrentUser();
  if (!user) return;

  const uid = user.id;
  const school = user.school;
  const date = new Date().toLocaleString();
  const safe = safeTopicName(topic);

  // ⭐ PERSONAL BEST
  const personalDocRef = doc(db, "users", uid, "scores", `${safe}_theory`);
  const personalSnap = await getDoc(personalDocRef);

  if (!personalSnap.exists() || score > personalSnap.data().score) {
    await setDoc(personalDocRef, {
      topic,
      mode: "theory",
      score,
      accuracy,
      date
    });
  }

  // ⭐ SCHOOL LEADERBOARD
  const schoolDocId = `${school}_${safe}_theory`;
  const entryRef = doc(db, "schoolLeaderboards", schoolDocId, "entries", uid);

  const existing = await getDoc(entryRef);

  if (!existing.exists() || score > existing.data().score) {
    await setDoc(entryRef, {
      username: user.username,
      score,
      accuracy,
      date,
      userId: uid
    });
  }
}


// ===============================
// THEORY QUIZ ENGINE
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

// DOM elements
const rulesPopup = document.getElementById("theoryRulesPopup");
const endPopup = document.getElementById("theoryEndPopup");
const endScoreText = document.getElementById("theoryEndScore");
const endAccuracyText = document.getElementById("endAccuracyText");
const startBtn = document.getElementById("startTheoryBtn");
const playAgainBtn = document.getElementById("playAgainTheoryBtn");
const quitBtn = document.getElementById("theoryQuitBtn");


// ===============================
// SHOW RULES
// ===============================
export function showTheoryRules(questions) {
  storedQuestions = questions;
  rulesPopup.style.display = "flex";
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

  rulesPopup.style.display = "none";
  endPopup.style.display = "none";

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

  lockInput = false;

  const q = shuffledQuestions[currentQuestionIndex];

  const correct = q.correct[Math.floor(Math.random() * q.correct.length)];

  let wrongShuffled = q.wrong.sort(() => Math.random() - 0.5);
  let selectedWrong = wrongShuffled.slice(0, Math.min(8, wrongShuffled.length));

  let answers = [...selectedWrong, correct].sort(() => Math.random() - 0.5);

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
    theoryScore += 1;
    flashTheoryCorrect();
  } else {
    theoryScore = Math.max(0, theoryScore - 1);
    flashTheoryWrong();
  }

  accuracy = (theoryScore / questionsAttempted) * 100;

  updateStatsBar();

  currentQuestionIndex++;

  if (currentQuestionIndex >= shuffledQuestions.length) {
    currentQuestionIndex = 0;
  }

  loadTheoryQuestion();
}


// ===============================
// END QUIZ
// ===============================
function endTheoryQuiz() {

  clearInterval(theoryTimer);

  endScoreText.textContent = `Final Score: ${theoryScore}`;
  endAccuracyText.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;

  const topic = window.currentTopic;
  saveTheoryScore(topic, theoryScore, accuracy);

  endPopup.style.display = "flex";
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


// ===============================
// BUTTON EVENTS
// ===============================
startBtn.onclick = () => startTheoryQuiz();
playAgainBtn.onclick = () => startTheoryQuiz();

if (quitBtn) {
  quitBtn.onclick = () => {
    clearInterval(theoryTimer);
    goBackToTopicOptions();   // ⭐ FIXED: goes one level back
  };
}


