// ===============================
// IMPORTS
// ===============================
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
// FIRESTORE SAVE FUNCTION (LIFETIME TOTALS)
// ===============================
async function saveExamScore(topic, correct, wrong) {
  const user = getCurrentUser();
  if (!user) return;

  const uid = user.id;
  const school = user.school;
  const date = new Date().toLocaleString();
  const safe = safeTopicName(topic);

  // ⭐ PERSONAL LIFETIME TOTALS
  let lifetimeCorrect = correct;
  let lifetimeWrong = wrong;

  const personalRef = doc(db, "users", uid, "scores", `${safe}_exam`);
  const snap = await getDoc(personalRef);

  if (snap.exists()) {
    lifetimeCorrect += snap.data().totalCorrect || 0;
    lifetimeWrong += snap.data().totalWrong || 0;
  }

  const lifetimeNet = lifetimeCorrect - lifetimeWrong;

  await setDoc(personalRef, {
    topic,
    mode: "exam",
    totalCorrect: lifetimeCorrect,
    totalWrong: lifetimeWrong,
    netScore: lifetimeNet,
    date
  });

  // ⭐ SCHOOL LEADERBOARD
  const schoolDocId = `${school}_${safe}_exam`;
  const entryRef = doc(db, "schoolLeaderboards", schoolDocId, "entries", uid);

  await setDoc(entryRef, {
    username: user.username,
    correct: lifetimeCorrect,
    wrong: lifetimeWrong,
    netScore: lifetimeNet,
    date,
    userId: uid
  });
}


// ===============================
// EXAM MODE ENGINE
// ===============================
export const examMode = {
  currentQuestion: 0,
  score: 0,
  wrong: 0,
  timer: null,
  timeLeft: 30,
  questions: [],
  fullQuestions: [],
  active: false,
  lockInput: false
};

// DOM elements
const rulesPopup = document.getElementById("examRulesPopup");
const endPopup = document.getElementById("examEndPopup");
const endScoreText = document.getElementById("examEndScore");
const startBtn = document.getElementById("startExamBtn");
const playAgainBtn = document.getElementById("playAgainExamBtn");
const quitBtn = document.getElementById("examQuitBtn");

const scoreDisplay = document.getElementById("examScore");
const timerDisplay = document.getElementById("timer");


// ===============================
// SHOW RULES
// ===============================
export function showExamRules(questions) {
  examMode.fullQuestions = Array.isArray(questions) ? questions : [];
  rulesPopup.style.display = "flex";
}


// ===============================
// START EXAM
// ===============================
function startExam() {
  if (!examMode.fullQuestions || examMode.fullQuestions.length === 0) {
    alert("No exam questions available for this topic.");
    return;
  }

  const pool = [...examMode.fullQuestions].sort(() => Math.random() - 0.5);
  examMode.questions = pool.slice(0, 5);

  rulesPopup.style.display = "none";
  endPopup.style.display = "none";

  examMode.currentQuestion = 0;
  examMode.score = 0;
  examMode.wrong = 0;
  examMode.timeLeft = 30;
  examMode.active = true;
  examMode.lockInput = false;

  scoreDisplay.textContent = `Score: 0`;
  timerDisplay.textContent = examMode.timeLeft;

  document.getElementById("quizContainer").style.display = "block";

  loadQuestion();
}


// ===============================
// LOAD QUESTION
// ===============================
function loadQuestion() {
  if (!examMode.active) return;

  examMode.lockInput = false;

  if (examMode.currentQuestion >= examMode.questions.length) {
    endExam();
    return;
  }

  const q = examMode.questions[examMode.currentQuestion];
  document.getElementById("questionText").innerText = q.question;

  q.answers.forEach((ans, i) => {
    const btn = document.getElementById("answer" + i);
    btn.disabled = false;
    btn.innerText = ans;
    btn.onclick = () => selectAnswer(i);
  });

  startTimer();
}


// ===============================
// TIMER
// ===============================
function startTimer() {
  examMode.timeLeft = 30;
  timerDisplay.textContent = examMode.timeLeft;

  clearInterval(examMode.timer);

  examMode.timer = setInterval(() => {
    examMode.timeLeft--;
    timerDisplay.textContent = examMode.timeLeft;

    if (examMode.timeLeft <= 0) {
      clearInterval(examMode.timer);
      examMode.currentQuestion++;
      loadQuestion();
    }
  }, 1000);
}


// ===============================
// SELECT ANSWER
// ===============================
function selectAnswer(index) {
  if (examMode.lockInput) return;
  examMode.lockInput = true;

  clearInterval(examMode.timer);

  const correctIndex = examMode.questions[examMode.currentQuestion].correct;
  const isCorrect = index === correctIndex;

  for (let i = 0; i < 4; i++) {
    document.getElementById("answer" + i).disabled = true;
  }

  if (isCorrect) {
    examMode.score++;
    scoreDisplay.textContent = `Score: ${examMode.score}`;
    flashExamCorrect();
  } else {
    examMode.wrong++;
    flashExamWrong();
  }

  examMode.currentQuestion++;
  loadQuestion();
}


// ===============================
// END EXAM
// ===============================
function endExam() {
  examMode.active = false;
  clearInterval(examMode.timer);

  for (let i = 0; i < 4; i++) {
    document.getElementById("answer" + i).disabled = true;
  }

  const netScore = examMode.score - examMode.wrong;
  endScoreText.textContent =
    `You scored ${examMode.score} out of ${examMode.questions.length} (Net: ${netScore})`;

  const topic = window.examTopic || "Unknown";
  saveExamScore(topic, examMode.score, examMode.wrong);

  endPopup.style.display = "flex";
}


// ===============================
// QUIT BUTTON (FIXED)
// ===============================
if (quitBtn) {
  quitBtn.onclick = () => {
    examMode.active = false;
    clearInterval(examMode.timer);
    goBackToTopicOptions();   // ⭐ FIXED: goes one level back
  };
}


// ===============================
// FLASH FEEDBACK
// ===============================
function flashExamCorrect() {
  const box = document.getElementById("questionText");
  if (!box) return;
  box.style.background = "#c8ffcc";
  setTimeout(() => box.style.background = "#ffffff", 150);
}

function flashExamWrong() {
  const box = document.getElementById("questionText");
  if (!box) return;
  box.style.background = "#ffcccc";
  setTimeout(() => box.style.background = "#ffffff", 150);
}


// ===============================
// BUTTON EVENTS
// ===============================
startBtn.onclick = () => startExam();
playAgainBtn.onclick = () => startExam();

