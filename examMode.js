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
// SAFE TOPIC NAME
// ===============================
function safeTopicName(topic) {
  return topic
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}


// ===============================
// UPDATE SESSION TOPIC
// ===============================
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
// GO BACK
// ===============================
function goBackToTopicOptions() {
  const params = new URLSearchParams(window.location.search);
  const course = params.get("course") || "KS3";
  const unit = params.get("unit") || "";
  const topic = params.get("topic") || "";

  let page = "";
  if (course.startsWith("KS3")) page = "ks3-topic-options.html";
  else if (course.startsWith("KS4")) page = "ks4-topic-options.html";
  else if (course.startsWith("KS5")) page = "ks5-topic-options.html";
  else page = "ks3-topic-options.html";

  window.location.href =
    `${page}?course=${encodeURIComponent(course)}&unit=${encodeURIComponent(unit)}&topic=${encodeURIComponent(topic)}`;
}


// ===============================
// SAVE EXAM SCORE (FINAL FIXED VERSION)
// ===============================
export async function saveExamScore(totalCorrect, totalWrong) {
  console.log("🔍 saveExamScore() START — totalCorrect:", totalCorrect, "totalWrong:", totalWrong);

  const user = getCurrentUser();
  if (!user) {
    console.warn("❌ saveExamScore aborted — no current user");
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

  const netScore = totalCorrect - totalWrong;

  console.log("🧩 Context — uid:", uid,
    "| topic:", topic,
    "| safe:", safe,
    "| sessionCode:", sessionCode,
    "| deviceID:", deviceID,
    "| nickname:", nickname,
    "| school:", user.school,
    "| netScore:", netScore
  );

  // ============================================================
  // 1) PERSONAL SCORE
  // ============================================================
  const personalRef = doc(db, "users", uid, "scores", `${safe}_exam`);
  console.log("📄 Personal ref path:", personalRef.path);

  const personalSnap = await getDoc(personalRef);
  console.log("📄 Personal doc exists:", personalSnap.exists(), "data:", personalSnap.exists() ? personalSnap.data() : null);

  let lifetimeCorrect = totalCorrect;
  let lifetimeWrong = totalWrong;

  if (personalSnap.exists()) {
    const prev = personalSnap.data();
    const prevCorrect = prev.totalCorrect || 0;
    const prevWrong = prev.totalWrong || 0;

    console.log("📄 Previous lifetime — correct:", prevCorrect, "wrong:", prevWrong);

    lifetimeCorrect += prevCorrect;
    lifetimeWrong += prevWrong;
  }

  const lifetimeNet = lifetimeCorrect - lifetimeWrong;
  console.log("🧮 Lifetime totals — correct:", lifetimeCorrect, "wrong:", lifetimeWrong, "net:", lifetimeNet);

  await setDoc(personalRef, {
    username: user.username,
    nickname,
    topic,
    safeTopic: safe,
    mode: "exam",
    totalCorrect: lifetimeCorrect,
    totalWrong: lifetimeWrong,
    netScore: lifetimeNet,
    date,
    updatedAt: Date.now()
  });

  console.log("✅ Personal exam score saved:", {
    path: personalRef.path,
    totalCorrect: lifetimeCorrect,
    totalWrong: lifetimeWrong,
    netScore: lifetimeNet
  });

  // ============================================================
  // 2) SESSION MODE (PLAYER + TOPIC DOCS)
  // ============================================================
  if (sessionCode && deviceID) {
    const playerRef = doc(db, "sessions", sessionCode, "players", deviceID);
    const topicRef = doc(db, "sessions", sessionCode, "players", deviceID, "topics", safe);

    console.log("📄 Session player ref:", playerRef.path);
    console.log("📄 Session topic ref:", topicRef.path);

    await Promise.all([
      setDoc(playerRef, {
        deviceID,
        nickname,
        topic,
        safeTopic: safe,
        examNet: lifetimeNet,
        examCorrect: lifetimeCorrect,
        examWrong: lifetimeWrong,
        lastUpdated: Date.now()
      }, { merge: true }),

      setDoc(topicRef, {
        topic,
        safeTopic: safe,
        examNet: lifetimeNet,
        examCorrect: lifetimeCorrect,
        examWrong: lifetimeWrong,
        updatedAt: Date.now()
      }, { merge: true })
    ]);

    console.log("✅ Session exam score saved:", {
      playerPath: playerRef.path,
      topicPath: topicRef.path,
      examNet: lifetimeNet,
      examCorrect: lifetimeCorrect,
      examWrong: lifetimeWrong
    });
  } else {
    console.warn("⚠️ Skipping SESSION save — missing sessionCode or deviceID", {
      sessionCode,
      deviceID
    });
  }

  // ============================================================
  // 3) SCHOOL / SESSION LEADERBOARD
  // ============================================================
  const school = user.school;
  console.log("🏫 School value:", school);

  if (!school) {
    console.warn("⚠️ No school value — skipping school leaderboard update");
    console.log("🎯 saveExamScore() END (no school)");
    return;
  }

  const schoolDocId = `${school}_${safe}_exam`;
  const entryRef = doc(db, "schoolLeaderboards", schoolDocId, "entries", uid);

  console.log("📄 School leaderboard entry path:", entryRef.path);

  const existing = await getDoc(entryRef);
  console.log("📄 Existing school entry exists:", existing.exists(), "data:", existing.exists() ? existing.data() : null);

  const prevNet = existing.exists() ? (existing.data().netScore ?? -9999) : -9999;
  console.log("🧮 Previous net on leaderboard:", prevNet, "| new lifetimeNet:", lifetimeNet);

  if (!existing.exists() || lifetimeNet > prevNet) {
    await setDoc(entryRef, {
      username: user.username,
      nickname,
      totalCorrect: lifetimeCorrect,
      totalWrong: lifetimeWrong,
      netScore: lifetimeNet,
      date,
      userId: uid,
      topic,
      safeTopic: safe,
      mode: "exam"
    });

    console.log("✅ School leaderboard updated:", {
      path: entryRef.path,
      netScore: lifetimeNet
    });
  } else {
    console.log("⏩ School leaderboard NOT updated — existing net is higher or equal");
  }

  console.log("🎯 saveExamScore() END");
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


// ===============================
// DOM ELEMENTS
// ===============================
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

  const topic = decodeURIComponent(new URLSearchParams(window.location.search).get("topic") || "");
  const safe = safeTopicName(topic);
  updateSessionTopic(safe, topic); // ⭐ ensures leaderboard filtering works

  if (rulesPopup) rulesPopup.style.display = "flex";
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
    const btn = document.getElementById("answer" + i);
    if (btn) btn.disabled = true;
  }

  const netScore = examMode.score - examMode.wrong;
  endScoreText.textContent =
    `You scored ${examMode.score} out of ${examMode.questions.length} (Net: ${netScore})`;

  saveExamScore(examMode.score, examMode.wrong);

  endPopup.style.display = "flex";
}


// ===============================
// QUIT BUTTON
// ===============================
if (quitBtn) {
  quitBtn.onclick = () => {
    examMode.active = false;
    clearInterval(examMode.timer);
    goBackToTopicOptions();
  };
}


// ===============================
// FLASH FEEDBACK
// ===============================
function flashExamCorrect() {
  const box = document.getElementById("questionText");
  if (!box) return;
  box.style.background = "#c8ffcc";
  setTimeout(() => {
    box.style.background = "#ffffff";
  }, 150);
}

function flashExamWrong() {
  const box = document.getElementById("questionText");
  if (!box) return;
  box.style.background = "#ffcccc";
  setTimeout(() => {
    box.style.background = "#ffffff";
  }, 150);
}


// ===============================
// BUTTON EVENTS
// ===============================
if (startBtn) startBtn.onclick = () => startExam();
if (playAgainBtn) playAgainBtn.onclick = () => startExam();

