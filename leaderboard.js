// =========================
// IMPORTS
// =========================
import { auth, db } from "./firebaseConfig.js";
import { getCurrentUser } from "./userManager.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// =========================
// URL PARAMETERS
// =========================
const params = new URLSearchParams(window.location.search);
const topic = decodeURIComponent(params.get("topic") || "");

const titleEl = document.getElementById("leaderboardTitle");
if (titleEl && topic) {
  titleEl.innerText = `${topic} — Leaderboard`;
}


// =========================
// SAFE TOPIC NAME
// =========================
function safeTopicName(raw) {
  return raw
    .replace(/\//g, "_")
    .replace(/\\/g, "_")
    .replace(/ /g, "_")
    .replace(/[^\w\-]/g, "_");
}


// =========================
// FIREBASE AUTH GATE
// =========================
onAuthStateChanged(auth, (firebaseUser) => {
  if (!firebaseUser) {
    window.location.href = "login.html";
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const start = () => initLeaderboards(currentUser);

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
});


// =========================
// HELPERS
// =========================
function personalScoreDocId(topic, mode) {
  const safe = safeTopicName(topic);
  return `${safe}_${mode}`;
}

function schoolLeaderboardDocId(school, topic, mode) {
  const safe = safeTopicName(topic);
  return `${school}_${safe}_${mode}`;
}


// =========================
// LOAD PERSONAL SCORES
// =========================
async function loadPersonalScores(currentUser, topic, mode) {
  const uid = currentUser.id;
  const docId = personalScoreDocId(topic, mode);
  const docRef = doc(db, "users", uid, "scores", docId);

  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];

  return [snap.data()];
}


// =========================
// LOAD SCHOOL LEADERBOARD
// =========================
async function loadSchoolLeaderboard(currentUser, topic, mode) {
  const school = currentUser.school;
  const docId = schoolLeaderboardDocId(school, topic, mode);
  const entriesRef = collection(db, "schoolLeaderboards", docId, "entries");

  let q;

  // THEORY
  if (mode === "theory") {
    q = query(
      entriesRef,
      orderBy("score", "desc"),
      orderBy("accuracy", "desc"),
      limit(10)
    );
  }

  // MATCHING
  else if (mode === "matching") {
    q = query(
      entriesRef,
      orderBy("time", "asc"),
      orderBy("score", "desc"),
      orderBy("accuracy", "desc"),
      limit(10)
    );
  }

  // BINARY MODES
  else if (
    mode === "btd" ||
    mode === "btd_easy" ||
    mode === "dtb" ||
    mode === "dtb_easy" ||
    mode === "ba" ||
    mode === "ba_easy"
  ) {
    q = query(
      entriesRef,
      orderBy("score", "desc"),
      orderBy("accuracy", "desc"),
      limit(10)
    );
  }

  else {
    return [];
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}


// =========================
// LOAD SCHOOL EXAM LEADERBOARD
// =========================
async function loadSchoolExam(currentUser, topic) {
  const school = currentUser.school;
  const docId = schoolLeaderboardDocId(school, topic, "exam");
  const entriesRef = collection(db, "schoolLeaderboards", docId, "entries");

  const q = query(
    entriesRef,
    orderBy("netScore", "desc"),
    limit(10)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}


// =========================
// RENDERING HELPERS
// =========================
function renderTop10(containerId, data, formatFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `<p class="no-data">No scores yet.</p>`;
    return;
  }

  data.slice(0, 10).forEach((e, i) => {
    container.innerHTML += `
      <div class="entry">
        ${i + 1}. ${formatFn(e)}
      </div>
    `;
  });
}


// =========================
// MODE RENDERERS
// =========================
async function showTheory(currentUser) {
  const personal = await loadPersonalScores(currentUser, topic, "theory");
  const school = await loadSchoolLeaderboard(currentUser, topic, "theory");

  renderTop10("theoryPersonal", personal, e =>
    `Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%, Date: ${e.date}`
  );

  renderTop10("theorySchool", school, e =>
    `${e.username} — Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%`
  );
}

async function showMatching(currentUser) {
  const personal = await loadPersonalScores(currentUser, topic, "matching");
  const school = await loadSchoolLeaderboard(currentUser, topic, "matching");

  renderTop10("matchingPersonal", personal, e =>
    `Time: ${Number(e.time).toFixed(2)}s, Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%, Date: ${e.date}`
  );

  renderTop10("matchingSchool", school, e =>
    `${e.username} — Time: ${Number(e.time).toFixed(2)}s, Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%`
  );
}

async function showExam(currentUser) {
  const personal = await loadPersonalScores(currentUser, topic, "exam");
  const school = await loadSchoolExam(currentUser, topic);

  renderTop10("examPersonal", personal, e =>
    `Correct: ${e.totalCorrect}, Wrong: ${e.totalWrong}, Net: ${e.netScore}, Date: ${e.date}`
  );

  renderTop10("examSchool", school, e =>
    `${e.username} — Net: ${e.netScore}, Correct: ${e.correct}, Wrong: ${e.wrong}`
  );
}


// =========================
// BINARY MODES
// =========================
async function showBinaryMode(currentUser, mode, personalId, schoolId) {
  const personal = await loadPersonalScores(currentUser, topic, mode);
  const school = await loadSchoolLeaderboard(currentUser, topic, mode);

  // PERSONAL
  renderTop10(personalId, personal, e =>
    `Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%, Date: ${e.date}`
  );

  // SCHOOL — keep best score per student
  const bestScores = {};
  school.forEach(entry => {
    const user = entry.username;
    if (!bestScores[user] || entry.score > bestScores[user].score) {
      bestScores[user] = entry;
    }
  });

  const uniqueSchool = Object.values(bestScores).sort((a, b) => {
    if (b.score === a.score) return b.accuracy - a.accuracy;
    return b.score - a.score;
  });

  renderTop10(schoolId, uniqueSchool.slice(0, 10), e =>
    `${e.username} — Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%`
  );
}


// =========================
// DETECT AVAILABLE MODES
// =========================
async function getAvailableModes(currentUser, topic) {
  const school = currentUser.school;
  const safe = safeTopicName(topic);

  const modes = [
    "theory",
    "matching",
    "exam",
    "btd",
    "btd_easy",
    "dtb",
    "dtb_easy",
    "ba",
    "ba_easy"
  ];

  const available = [];

  for (const mode of modes) {
    const docId = `${school}_${safe}_${mode}`;
    const entriesRef = collection(db, "schoolLeaderboards", docId, "entries");
    const snap = await getDocs(entriesRef);

    if (!snap.empty) {
      available.push(mode);
    }
  }

  return available;
}


// =========================
// INIT LEADERBOARDS
// =========================
async function initLeaderboards(currentUser) {

  const container = document.querySelector(".leaderboard-container");

  let loadingDiv = null;
  if (container) {
    loadingDiv = document.createElement("div");
    loadingDiv.style.padding = "20px";
    loadingDiv.style.fontSize = "20px";
    loadingDiv.style.textAlign = "center";
    loadingDiv.style.color = "#34D399";
    loadingDiv.textContent = "Fetching leaderboard...";
    container.prepend(loadingDiv);
  }

  const availableModes = await getAvailableModes(currentUser, topic);

  if (loadingDiv && container) {
    container.removeChild(loadingDiv);
  }

  const sections = [
    "theorySection",
    "matchingSection",
    "examSection",
    "btdSection",
    "btdEasySection",
    "dtbSection",
    "dtbEasySection",
    "baSection",
    "baEasySection"
  ];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  if (availableModes.includes("theory")) {
    document.getElementById("theorySection").style.display = "block";
    showTheory(currentUser);
  }

  if (availableModes.includes("matching")) {
    document.getElementById("matchingSection").style.display = "block";
    showMatching(currentUser);
  }

  if (availableModes.includes("exam")) {
    document.getElementById("examSection").style.display = "block";
    showExam(currentUser);
  }

  if (availableModes.includes("btd")) {
    document.getElementById("btdSection").style.display = "block";
    showBinaryMode(currentUser, "btd", "btdPersonal", "btdSchool");
  }

  if (availableModes.includes("btd_easy")) {
    document.getElementById("btdEasySection").style.display = "block";
    showBinaryMode(currentUser, "btd_easy", "btdEasyPersonal", "btdEasySchool");
  }

  if (availableModes.includes("dtb")) {
    document.getElementById("dtbSection").style.display = "block";
    showBinaryMode(currentUser, "dtb", "dtbPersonal", "dtbSchool");
  }

  if (availableModes.includes("dtb_easy")) {
    document.getElementById("dtbEasySection").style.display = "block";
    showBinaryMode(currentUser, "dtb_easy", "dtbEasyPersonal", "dtbEasySchool");
  }

  if (availableModes.includes("ba")) {
    document.getElementById("baSection").style.display = "block";
    showBinaryMode(currentUser, "ba", "baPersonal", "baSchool");
  }

  if (availableModes.includes("ba_easy")) {
    document.getElementById("baEasySection").style.display = "block";
    showBinaryMode(currentUser, "ba_easy", "baEasyPersonal", "baEasySchool");
  }
}
