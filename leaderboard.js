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


console.log("SESSION DEBUG — sessionCode:", localStorage.getItem("sessionCode"));
console.log("SESSION DEBUG — deviceID:", localStorage.getItem("deviceID"));
console.log("SESSION DEBUG — nickname:", localStorage.getItem("nickname"));


// =========================
// URL PARAMETERS
// =========================
const params = new URLSearchParams(window.location.search);
const topic = decodeURIComponent(params.get("topic") || "");

// For title
const sessionCodeForTitle = localStorage.getItem("sessionCode");
const currentUserForTitle = getCurrentUser();

const titleEl = document.getElementById("leaderboardTitle");
if (titleEl) {
  if (sessionCodeForTitle && (!currentUserForTitle || currentUserForTitle.school?.startsWith("SESSION_"))) {
    titleEl.innerText = topic
      ? `${topic} — Session ${sessionCodeForTitle} Leaderboard`
      : `Session ${sessionCodeForTitle} — Leaderboard`;
  } else if (currentUserForTitle && currentUserForTitle.school) {
    titleEl.innerText = topic
      ? `${topic} — ${currentUserForTitle.school.toUpperCase()} Leaderboard`
      : `${currentUserForTitle.school.toUpperCase()} — Leaderboard`;
  } else if (topic) {
    titleEl.innerText = `${topic} — Leaderboard`;
  } else {
    titleEl.innerText = `Leaderboard`;
  }
}


// =========================
// SAFE TOPIC NAME
// =========================
function safeTopicName(topic) {
  return topic
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}


// =========================
// FIREBASE AUTH GATE
// =========================
onAuthStateChanged(auth, (firebaseUser) => {
  const currentUser = getCurrentUser();
  const sessionCode = localStorage.getItem("sessionCode");

  // session user: no firebaseUser, but has sessionCode
  const isSessionUser = !firebaseUser && !!sessionCode;

  if (!firebaseUser && !isSessionUser) {
    window.location.href = "login.html";
    return;
  }

  const start = () => initLeaderboards(currentUser, sessionCode, isSessionUser);

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
  return `${safeTopicName(topic)}_${mode}`;
}

function schoolLeaderboardDocId(school, topic, mode) {
  const safe = safeTopicName(topic);
  return `${school}_${safe}_${mode}`;
}


// =========================
// LOAD PERSONAL SCORES (SESSION-AWARE + LOGS)
// =========================
async function loadPersonalScores(currentUser, topic, mode) {
  console.log("🔍 loadPersonalScores() START — topic:", topic, "mode:", mode);

  if (!currentUser) {
    console.warn("⚠️ loadPersonalScores(): no currentUser");
    return [];
  }

  const safe = safeTopicName(topic);
  const sessionCode = localStorage.getItem("sessionCode");
  const deviceID = localStorage.getItem("deviceID");

  console.log("🧩 loadPersonalScores context:", {
    uid: currentUser.id,
    school: currentUser.school,
    sessionCode,
    deviceID,
    safe
  });

  let docRef;
  let sourceType = "";

  // SESSION USER → read from sessions/{sessionCode}/players/{deviceID}/topics/{safe}
  if (sessionCode && deviceID && currentUser.school?.startsWith("SESSION_")) {
    docRef = doc(db, "sessions", sessionCode, "players", deviceID, "topics", safe);
    sourceType = "sessionTopic";
  } else {
    // SCHOOL / NORMAL USER → read from users/{uid}/scores/{safe_mode}
    const docId = personalScoreDocId(topic, mode);
    docRef = doc(db, "users", currentUser.id, "scores", docId);
    sourceType = "userScores";
  }

  console.log("📄 loadPersonalScores docRef.path:", docRef.path, "sourceType:", sourceType);

  const snap = await getDoc(docRef);
  console.log("📄 loadPersonalScores snap.exists():", snap.exists());

  if (!snap.exists()) {
    console.warn("⚠️ loadPersonalScores(): no personal doc found at", docRef.path);
    return [];
  }

  const data = snap.data();
  console.log("✅ loadPersonalScores raw data:", data);

  // Normalise for EXAM so formatter always has totalCorrect, totalWrong, netScore
  if (mode === "exam") {
    const correct = Number(data.totalCorrect ?? data.examCorrect ?? 0);
    const wrong = Number(data.totalWrong ?? data.examWrong ?? 0);
    const net = Number(data.netScore ?? data.examNet ?? (correct - wrong));

    const normalised = {
      ...data,
      totalCorrect: correct,
      totalWrong: wrong,
      netScore: net
    };

    console.log("🧮 loadPersonalScores normalised EXAM data:", normalised);
    return [normalised];
  }

  // For theory / matching / binary, raw data is fine
  return [data];
}


// =========================
// LOAD SCHOOL EXAM LEADERBOARD (TOP 5, FIXED + LOGS)
// =========================
async function loadSchoolExam(currentUser, topic) {
  if (!currentUser || !currentUser.school) {
    console.warn("⚠️ loadSchoolExam(): no currentUser or no school");
    return [];
  }

  const school = currentUser.school;
  const docId = schoolLeaderboardDocId(school, topic, "exam");
  const entriesRef = collection(db, "schoolLeaderboards", docId, "entries");

  console.log("🔍 loadSchoolExam() — path:", `schoolLeaderboards/${docId}/entries`);

  const q = query(entriesRef, orderBy("netScore", "desc"), limit(5));

  const snap = await getDocs(q);
  const rows = snap.docs.map(d => d.data());

  console.log("✅ loadSchoolExam() rows:", rows);
  return rows;
}


// =========================
// LOAD SCHOOL LEADERBOARD (TOP 5, ALL MODES)
// =========================
async function loadSchoolLeaderboard(currentUser, topic, mode) {
  console.log("🔍 loadSchoolLeaderboard() START — mode:", mode, "topic:", topic);

  if (!currentUser || !currentUser.school) {
    console.warn("⚠️ loadSchoolLeaderboard(): no currentUser or no school");
    return [];
  }

  const school = currentUser.school;
  const docId = schoolLeaderboardDocId(school, topic, mode);
  const entriesRef = collection(db, "schoolLeaderboards", docId, "entries");

  console.log("🔍 loadSchoolLeaderboard() path:", `schoolLeaderboards/${docId}/entries`);

  let q;

  if (mode === "theory") {
    q = query(
      entriesRef,
      orderBy("score", "desc"),
      orderBy("accuracy", "desc"),
      limit(5)
    );
  } else if (mode === "matching") {
    q = query(
      entriesRef,
      orderBy("time", "asc"),
      orderBy("score", "desc"),
      orderBy("accuracy", "desc"),
      limit(5)
    );
  } else if (
    mode === "btd" || mode === "btd_easy" ||
    mode === "dtb" || mode === "dtb_easy" ||
    mode === "ba"  || mode === "ba_easy"
  ) {
    q = query(
      entriesRef,
      orderBy("score", "desc"),
      orderBy("accuracy", "desc"),
      limit(5)
    );
  } else if (mode === "exam") {
    // Fallback if called here
    q = query(
      entriesRef,
      orderBy("netScore", "desc"),
      limit(5)
    );
  } else {
    console.warn("⚠️ loadSchoolLeaderboard(): unsupported mode", mode);
    return [];
  }

  const snap = await getDocs(q);
  const rows = snap.docs.map(d => d.data());

  console.log("✅ loadSchoolLeaderboard() rows:", rows);
  return rows;
}

// =========================
// SESSION MODE LEADERBOARD (TOPIC-BASED, FIXED VERSION + LOGS)
// =========================
async function loadSessionLeaderboard(topic, mode) {
  const sessionCode = localStorage.getItem("sessionCode");
  if (!sessionCode) {
    console.warn("⚠️ loadSessionLeaderboard(): no sessionCode");
    return [];
  }

  const safe = safeTopicName(topic);
  console.log("🔍 loadSessionLeaderboard() START — sessionCode:", sessionCode, "topic:", topic, "safe:", safe, "mode:", mode);

  const playersRef = collection(db, "sessions", sessionCode, "players");
  const playersSnap = await getDocs(playersRef);

  console.log("📄 loadSessionLeaderboard() players count:", playersSnap.size);

  const results = [];

  for (const playerDoc of playersSnap.docs) {
    const player = playerDoc.data();
    const deviceID = player.deviceID;
    if (!deviceID) {
      console.warn("⚠️ Player without deviceID, skipping:", playerDoc.id);
      continue;
    }

    // Try to read topic doc, but DO NOT require it
    const topicRef = doc(db, "sessions", sessionCode, "players", deviceID, "topics", safe);
    const topicSnap = await getDoc(topicRef);

    const t = topicSnap.exists() ? topicSnap.data() : {};

    // Prefer topic doc values, fallback to player doc
    const theoryScore     = t.theoryScore     ?? player.theoryScore     ?? 0;
    const theoryAccuracy  = t.theoryAccuracy  ?? player.theoryAccuracy  ?? 0;
    const matchScore      = t.matchScore      ?? player.matchScore      ?? 0;
    const examNet         = t.examNet         ?? player.examNet         ?? 0;

    // Build entry
    const entry = {
      nickname: player.nickname,
      deviceID,
      theoryScore,
      theoryAccuracy,
      matchScore,
      examNet
    };

    // Only include players with a real score
    if (mode === "theory" && theoryScore > 0) {
      results.push(entry);
    }

    if (mode === "matching" && matchScore > 0) {
      results.push(entry);
    }

    if (mode === "exam" && examNet > 0) {
      results.push(entry);
    }
  }

  console.log("📊 loadSessionLeaderboard() raw results:", results);

  // ===== SORTING & TOP 5 FILTER =====
  let sorted = [];

  if (mode === "theory") {
    sorted = results
      .sort((a, b) =>
        (b.theoryScore ?? 0) - (a.theoryScore ?? 0) ||
        (b.theoryAccuracy ?? 0) - (a.theoryAccuracy ?? 0)
      );
  }

  else if (mode === "matching") {
    sorted = results
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }

  else if (mode === "exam") {
    sorted = results
      .sort((a, b) => Number(b.examNet ?? 0) - Number(a.examNet ?? 0));
  }

  const top5 = sorted.slice(0, 5);

  console.log("📊 loadSessionLeaderboard() FINAL TOP 5:", top5);
  return top5;
}



// =========================
// RENDER TOP 5
// =========================
function renderTop5(containerId, entries, formatFn) {
  console.log("🖥 renderTop5() for:", containerId, "entries:", entries);

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn("⚠️ renderTop5(): container not found:", containerId);
    return;
  }

  container.innerHTML = "";

  if (!entries || entries.length === 0) {
    container.innerHTML = "<p class='no-data'>No scores yet.</p>";
    return;
  }

  entries.forEach((e, i) => {
    const div = document.createElement("div");
    div.className = "entry";
    div.textContent = `${i + 1}. ${formatFn(e)}`;
    container.appendChild(div);
  });
}


// =========================
// MODE RENDERERS — THEORY
// =========================
async function showTheory(currentUser, isSessionUser) {
  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "");
  console.log("🔍 showTheory() START — topic:", topic, "isSessionUser:", isSessionUser);
  console.log("🔍 currentUser:", currentUser);

  const personal = await loadPersonalScores(currentUser, topic, "theory");
  console.log("✅ showTheory() personal:", personal);

  let schoolOrSession;
  if (isSessionUser) {
    schoolOrSession = await loadSessionLeaderboard(topic, "theory");
    console.log("✅ showTheory() session leaderboard:", schoolOrSession);
  } else {
    schoolOrSession = await loadSchoolLeaderboard(currentUser, topic, "theory");
    console.log("✅ showTheory() school leaderboard:", schoolOrSession);
  }

  renderTop5("theoryPersonal", personal, e =>
    `Score: ${e.score ?? e.theoryScore ?? 0}, Accuracy: ${(e.accuracy ?? e.theoryAccuracy ?? 0).toFixed(0)}%`
  );

  renderTop5("theorySchool", schoolOrSession, e =>
    `${e.nickname || e.username} — Score: ${e.theoryScore ?? e.score ?? 0}, Accuracy: ${(e.theoryAccuracy ?? e.accuracy ?? 0).toFixed(0)}%`
  );

  console.log("✅ showTheory() END");
}


// =========================
// MODE RENDERERS — MATCHING
// =========================
async function showMatching(currentUser, isSessionUser) {
  console.log("🔵 showMatching() START");

  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "");
  console.log("🔍 Topic:", topic);

  const personal = await loadPersonalScores(currentUser, topic, "matching");
  console.log("📄 Personal matching scores:", personal);

  let schoolOrSession = null;
  if (isSessionUser) {
    console.log("🟣 Loading SESSION matching leaderboard");
    schoolOrSession = await loadSessionLeaderboard(topic, "matching");
  } else {
    console.log("🟢 Loading SCHOOL matching leaderboard");
    schoolOrSession = await loadSchoolLeaderboard(currentUser, topic, "matching");
  }

  console.log("📄 School/Session matching scores:", schoolOrSession);

  renderTop5("matchingPersonal", personal, e =>
    `Time: ${Number(e.time ?? e.matchTime ?? 0).toFixed(2)}s, Score: ${e.score ?? e.matchScore ?? 0}, Accuracy: ${Number(e.accuracy ?? e.matchAccuracy ?? 0).toFixed(2)}%, Date: ${e.date ?? ""}`
  );

  renderTop5("matchingSchool", schoolOrSession, e =>
    `${e.nickname || e.username} — Time: ${Number(e.time ?? e.matchTime ?? 0).toFixed(2)}s, Score: ${e.score ?? e.matchScore ?? 0}, Accuracy: ${Number(e.accuracy ?? e.matchAccuracy ?? 0).toFixed(2)}%`
  );

  console.log("🔵 showMatching() END");
}


// =========================
// EXAM MODE RENDERER (SESSION + SCHOOL, FIXED + LOGS)
// =========================
async function showExam(currentUser, isSessionUser) {
  console.log("========== SHOW EXAM START ==========");
  console.log("Current User:", currentUser);
  console.log("Topic (global param):", topic);
  console.log("Is Session User:", isSessionUser);

  const personal = await loadPersonalScores(currentUser, topic, "exam");
  console.log("RAW PERSONAL EXAM DATA:", personal);

  let schoolOrSession = null;

  if (isSessionUser) {
    console.log("Loading SESSION exam leaderboard...");
    schoolOrSession = await loadSessionLeaderboard(topic, "exam");
  } else {
    console.log("Loading SCHOOL exam leaderboard...");
    schoolOrSession = await loadSchoolExam(currentUser, topic);
  }

  console.log("RAW SCHOOL/SESSION EXAM DATA:", schoolOrSession);

  // PERSONAL BEST
  console.log("---- PERSONAL BEST RENDER ----");
  renderTop5("examPersonal", personal, e => {
    console.log("PERSONAL ENTRY BEFORE FORMAT:", e);

    const correct = Number(e.totalCorrect ?? e.examCorrect ?? 0);
    const wrong = Number(e.totalWrong ?? e.examWrong ?? 0);
    const net = Number(e.netScore ?? e.examNet ?? (correct - wrong));

    console.log("PERSONAL FIELDS:", { correct, wrong, net });

    if (isNaN(correct) || isNaN(wrong) || isNaN(net)) {
      console.warn("⚠ PERSONAL SCORE HAS INVALID NUMBERS:", e);
    }

    return `Correct: ${correct}, Wrong: ${wrong}, Net: ${net}, Date: ${e.date ?? ""}`;
  });

  // SCHOOL / SESSION TOP 5
  console.log("---- SCHOOL / SESSION RENDER ----");
  renderTop5("examSchool", schoolOrSession, e => {
    console.log("SCHOOL/SESSION ENTRY BEFORE FORMAT:", e);

    const correct = Number(e.totalCorrect ?? e.examCorrect ?? 0);
    const wrong = Number(e.totalWrong ?? e.examWrong ?? 0);
    const net = Number(e.netScore ?? e.examNet ?? (correct - wrong));

    console.log("SCHOOL/SESSION FIELDS:", { correct, wrong, net });

    if (isNaN(correct) || isNaN(wrong) || isNaN(net)) {
      console.warn("⚠ SCHOOL/SESSION SCORE HAS INVALID NUMBERS:", e);
    }

    return `${e.nickname || e.username} — Net: ${net}, Correct: ${correct}, Wrong: ${wrong}`;
  });

  console.log("========== SHOW EXAM END ==========");
}


// =========================
// BINARY MODES
// =========================
async function showBinaryMode(currentUser, mode, personalId, schoolId, isSessionUser) {
  console.log("🔍 showBinaryMode() START — mode:", mode, "topic:", topic, "isSessionUser:", isSessionUser);

  const personal = await loadPersonalScores(currentUser, topic, mode);

  let schoolOrSession = null;
  if (isSessionUser) {
    schoolOrSession = await loadSessionLeaderboard(topic, mode);
  } else {
    schoolOrSession = await loadSchoolLeaderboard(currentUser, topic, mode);
  }

  console.log("📄 showBinaryMode() personal:", personal);
  console.log("📄 showBinaryMode() schoolOrSession:", schoolOrSession);

  renderTop5(personalId, personal, e =>
    `Score: ${e.score ?? 0}, Accuracy: ${Number(e.accuracy ?? 0).toFixed(2)}%, Date: ${e.date ?? ""}`
  );

  renderTop5(schoolId, schoolOrSession, e =>
    `${e.nickname || e.username} — Score: ${e.theoryScore ?? e.score ?? 0}, Accuracy: ${Number(e.theoryAccuracy ?? e.accuracy ?? 0).toFixed(2)}%`
  );

  console.log("🔍 showBinaryMode() END — mode:", mode);
}


// =========================
// AVAILABLE MODES (BY USER / TOPIC)
// =========================
function getAvailableModes(currentUser, topic) {
  // Right now: allow all modes; hook for future restrictions
  return [
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
}

// =========================
// INIT LEADERBOARDS (FINAL + LOGS)
// =========================
async function initLeaderboards(currentUser, sessionCode, isSessionUser) {
  // Recalculate session info from localStorage
  sessionCode = localStorage.getItem("sessionCode");
  isSessionUser = !!sessionCode;

  console.log("=======================================");
  console.log("🔍 initLeaderboards() START");
  console.log("🔍 currentUser:", currentUser);
  console.log("🔍 sessionCode:", sessionCode);
  console.log("🔍 isSessionUser:", isSessionUser);
  console.log("=======================================");

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

  // Hide all sections first
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

  // Determine topic and valid modes
  const params = new URLSearchParams(window.location.search);
  const rawTopic = decodeURIComponent(params.get("topic") || "");
  const topicLower = rawTopic.toLowerCase();
  console.log("🔍 initLeaderboards() topic:", rawTopic, "(lower:", topicLower, ")");

  const topicModes = {
    "variables and values": ["theory", "matching", "exam"],
    "data types": ["theory", "matching", "exam"],
    "binary": ["btd", "btd_easy", "dtb", "dtb_easy", "ba", "ba_easy"]
  };

  const validModes = topicModes[topicLower] || ["theory", "matching", "exam"];
  console.log("🔍 initLeaderboards() validModes:", validModes);

  // =========================
  // SESSION MODE
  // =========================
  if (isSessionUser) {
    console.log("🔵 SESSION MODE ACTIVE");
    if (loadingDiv && container) container.removeChild(loadingDiv);

    if (validModes.includes("theory")) {
      console.log("➡ Showing THEORY (session)");
      const sec = document.getElementById("theorySection");
      if (sec) sec.style.display = "block";
      await showTheory(currentUser, true);
    }

    if (validModes.includes("matching")) {
      console.log("➡ Showing MATCHING (session)");
      const sec = document.getElementById("matchingSection");
      if (sec) sec.style.display = "block";
      await showMatching(currentUser, true);
    }

    if (validModes.includes("exam")) {
      console.log("➡ Showing EXAM (session)");
      const sec = document.getElementById("examSection");
      if (sec) sec.style.display = "block";
      await showExam(currentUser, true);
    }

    if (validModes.includes("btd")) {
      console.log("➡ Showing BTD (session)");
      const sec = document.getElementById("btdSection");
      if (sec) sec.style.display = "block";
      await showBinaryMode(currentUser, "btd", "btdPersonal", "btdSchool", true);
    }

    if (validModes.includes("btd_easy")) {
      console.log("➡ Showing BTD EASY (session)");
      const sec = document.getElementById("btdEasySection");
      if (sec) sec.style.display = "block";
      await showBinaryMode(currentUser, "btd_easy", "btdEasyPersonal", "btdEasySchool", true);
    }

    if (validModes.includes("dtb")) {
      console.log("➡ Showing DTB (session)");
      const sec = document.getElementById("dtbSection");
      if (sec) sec.style.display = "block";
      await showBinaryMode(currentUser, "dtb", "dtbPersonal", "dtbSchool", true);
    }

    if (validModes.includes("dtb_easy")) {
      console.log("➡ Showing DTB EASY (session)");
      const sec = document.getElementById("dtbEasySection");
      if (sec) sec.style.display = "block";
      await showBinaryMode(currentUser, "dtb_easy", "dtbEasyPersonal", "dtbEasySchool", true);
    }

    if (validModes.includes("ba")) {
      console.log("➡ Showing BA (session)");
      const sec = document.getElementById("baSection");
      if (sec) sec.style.display = "block";
      await showBinaryMode(currentUser, "ba", "baPersonal", "baSchool", true);
    }

    if (validModes.includes("ba_easy")) {
      console.log("➡ Showing BA EASY (session)");
      const sec = document.getElementById("baEasySection");
      if (sec) sec.style.display = "block";
      await showBinaryMode(currentUser, "ba_easy", "baEasyPersonal", "baEasySchool", true);
    }

    console.log("🔵 SESSION MODE COMPLETE");
    return;
  }

  // =========================
  // SCHOOL MODE
  // =========================
  console.log("🟢 SCHOOL MODE ACTIVE");
  if (loadingDiv && container) container.removeChild(loadingDiv);

  if (validModes.includes("theory")) {
    console.log("➡ Showing THEORY (school)");
    const sec = document.getElementById("theorySection");
    if (sec) sec.style.display = "block";
    await showTheory(currentUser, false);
  }

  if (validModes.includes("matching")) {
    console.log("➡ Showing MATCHING (school)");
    const sec = document.getElementById("matchingSection");
    if (sec) sec.style.display = "block";
    await showMatching(currentUser, false);
  }

  if (validModes.includes("exam")) {
    console.log("➡ Showing EXAM (school)");
    const sec = document.getElementById("examSection");
    if (sec) sec.style.display = "block";
    await showExam(currentUser, false);
  }

  if (validModes.includes("btd")) {
    console.log("➡ Showing BTD (school)");
    const sec = document.getElementById("btdSection");
    if (sec) sec.style.display = "block";
    await showBinaryMode(currentUser, "btd", "btdPersonal", "btdSchool", false);
  }

  if (validModes.includes("btd_easy")) {
    console.log("➡ Showing BTD EASY (school)");
    const sec = document.getElementById("btdEasySection");
    if (sec) sec.style.display = "block";
    await showBinaryMode(currentUser, "btd_easy", "btdEasyPersonal", "btdEasySchool", false);
  }

  if (validModes.includes("dtb")) {
    console.log("➡ Showing DTB (school)");
    const sec = document.getElementById("dtbSection");
    if (sec) sec.style.display = "block";
    await showBinaryMode(currentUser, "dtb", "dtbPersonal", "dtbSchool", false);
  }

  if (validModes.includes("dtb_easy")) {
    console.log("➡ Showing DTB EASY (school)");
    const sec = document.getElementById("dtbEasySection");
    if (sec) sec.style.display = "block";
    await showBinaryMode(currentUser, "dtb_easy", "dtbEasyPersonal", "dtbEasySchool", false);
  }

  if (validModes.includes("ba")) {
    console.log("➡ Showing BA (school)");
    const sec = document.getElementById("baSection");
    if (sec) sec.style.display = "block";
    await showBinaryMode(currentUser, "ba", "baPersonal", "baSchool", false);
  }

  if (validModes.includes("ba_easy")) {
    console.log("➡ Showing BA EASY (school)");
    const sec = document.getElementById("baEasySection");
    if (sec) sec.style.display = "block";
    await showBinaryMode(currentUser, "ba_easy", "baEasyPersonal", "baEasySchool", false);
  }

  console.log("🟢 SCHOOL MODE COMPLETE");
}

