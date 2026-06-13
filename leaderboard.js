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

// For title
const sessionCodeForTitle = localStorage.getItem("sessionCode");
const currentUserForTitle = getCurrentUser();

const titleEl = document.getElementById("leaderboardTitle");
if (titleEl) {
  if (sessionCodeForTitle && (!currentUserForTitle || currentUserForTitle.school?.startsWith("session-"))) {
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
/* SAFE TOPIC NAME */
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
// LOAD PERSONAL SCORES (FIXED + LOGS)
// =========================
async function loadPersonalScores(currentUser, topic, mode) {
  console.log("🔍 loadPersonalScores() started for:", topic, "mode:", mode);

  if (!currentUser) {
    console.warn("⚠️ No currentUser provided.");
    return [];
  }

  // ⭐ LOG RAW TOPIC
  console.log("🔍 RAW TOPIC:", topic);

  // ⭐ LOG SAFE TOPIC
  const safe = safeTopicName(topic);
  console.log("🔍 safeTopicName(topic):", safe);

  // ⭐ LOG DOC ID
  const docId = personalScoreDocId(topic, mode);
  console.log("📄 personalScoreDocId() returned:", docId);

  const uid = currentUser.id;

  // ⭐ LOG FULL PATH
  const fullPath = `users/${uid}/scores/${docId}`;
  console.log("📄 Checking Firestore path:", fullPath);

  const docRef = doc(db, "users", uid, "scores", docId);
  const snap = await getDoc(docRef);

  // ⭐ LOG SNAP EXISTS
  console.log("📄 snap.exists():", snap.exists());

  if (!snap.exists()) {
    console.warn("⚠️ No personal score document found for:", currentUser.username || currentUser.nickname);
    return [];
  }

  const data = snap.data();
  console.log("✅ Personal score document found:", data);

  // ⭐ LOG USER MATCH CHECK
  const matchesUser =
    (data.username || data.nickname) === currentUser.username ||
    data.nickname === currentUser.nickname;

  console.log("🔍 matchesUser:", matchesUser);

  if (matchesUser) {
    console.log("✅ Personal score matches current user:", currentUser.username || currentUser.nickname);
    return [data];
  }

  console.warn("⚠️ Personal score document exists but does not match current user.");
  return [];
}




// =========================
// LOAD SCHOOL EXAM LEADERBOARD (TOP 5)
// =========================
async function loadSchoolExam(currentUser, topic) {
  const school = currentUser.school;
  const docId = schoolLeaderboardDocId(school, topic, "exam");
  const entriesRef = collection(db, "schoolLeaderboards", docId, "entries");

  const q = query(entriesRef, orderBy("", "desc"), limit(5));

  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// =========================
// LOAD SCHOOL LEADERBOARD (TOP 5)
// =========================
async function loadSchoolLeaderboard(currentUser, topic, mode) {

  // ⭐ Prevent crash if currentUser is null (session users)
  if (!currentUser || !currentUser.school) return [];

  const school = currentUser.school;
  const docId = schoolLeaderboardDocId(school, topic, mode);
  const entriesRef = collection(db, "schoolLeaderboards", docId, "entries");

  let q;

  if (mode === "theory") {
    q = query(
      entriesRef,
      orderBy("score", "desc"),
      orderBy("accuracy", "desc"),
      limit(5)
    );
  }
  else if (mode === "matching") {
    q = query(
      entriesRef,
      orderBy("time", "asc"),
      orderBy("score", "desc"),
      orderBy("accuracy", "desc"),
      limit(5)
    );
  }
  else if (
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
  }
  else {
    return [];
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// =========================
// SESSION MODE LEADERBOARD (BEST SCORE ONLY)
// =========================
async function loadSessionLeaderboard(topic, mode) {
  const sessionCode = localStorage.getItem("sessionCode");
  if (!sessionCode) return [];

  const playersRef = collection(db, "sessions", sessionCode, "players");
  const snap = await getDocs(playersRef);

  const safe = safeTopicName(topic);
  const playerMap = {}; // ⭐ store best attempt per deviceID

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const dataSafe = data.safeTopic || safeTopicName(data.topic || "");

    // Only include players for this topic
    if (dataSafe.toLowerCase() !== safe.toLowerCase()) return;

    const id = data.deviceID;
    if (!id) return;

    // If first time seeing this player → store
    if (!playerMap[id]) {
      playerMap[id] = data;
      return;
    }

    // Compare with existing best
    const prev = playerMap[id];

    if (mode === "theory") {
      const prevScore = prev.theoryScore ?? 0;
      const newScore = data.theoryScore ?? 0;

      const prevAcc = prev.theoryAccuracy ?? 0;
      const newAcc = data.theoryAccuracy ?? 0;

      // Keep only better score (or equal score but better accuracy)
      if (newScore > prevScore || (newScore === prevScore && newAcc > prevAcc)) {
        playerMap[id] = data;
      }
    }

    else if (mode === "matching") {
      const prevScore = prev.matchScore ?? 0;
      const newScore = data.matchScore ?? 0;

      if (newScore > prevScore) {
        playerMap[id] = data;
      }
    }

    else if (mode === "exam") {
      const prevNet = Number(prev.examNet) || 0;
      const newNet = Number(data.examNet) || 0;

      if (newNet > prevNet) {
        playerMap[id] = data;
      }
    }

    else {
      // Binary modes use theoryScore
      const prevScore = prev.theoryScore ?? 0;
      const newScore = data.theoryScore ?? 0;

      if (newScore > prevScore) {
        playerMap[id] = data;
      }
    }
  });

  // Convert map → array
  const players = Object.values(playerMap);

  // Sort final list
  if (mode === "theory") {
    return players
      .sort((a, b) => b.theoryScore - a.theoryScore || b.theoryAccuracy - a.theoryAccuracy)
      .slice(0, 5);
  }

  if (mode === "matching") {
    return players
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  if (mode === "exam") {
    return players
      .sort((a, b) => Number(b.examNet) - Number(a.examNet))
      .slice(0, 5);
  }

  // Binary modes
  return players
    .sort((a, b) => b.theoryScore - a.theoryScore)
    .slice(0, 5);
}






// =========================
// RENDER TOP 5
// =========================
function renderTop5(containerId, entries, formatFn) {
  
  console.log("🖥 renderTop5() for:", containerId, "entries:", entries);

  const container = document.getElementById(containerId);
  if (!container) return;

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
// MODE RENDERERS
// =========================
async function showTheory(currentUser, isSessionUser) {
  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "");
  console.log("🔍 showTheory() started for topic:", topic);
  console.log("🔍 currentUser:", currentUser);
  console.log("🔍 isSessionUser:", isSessionUser);

  const personal = await loadPersonalScores(currentUser, topic, "theory");
  console.log("✅ personal scores loaded:", personal);

  let schoolOrSession;
  if (isSessionUser) {
    schoolOrSession = await loadSessionLeaderboard(topic, "theory");
    console.log("✅ session leaderboard loaded:", schoolOrSession);
  } else {
    schoolOrSession = await loadSchoolLeaderboard(currentUser, topic, "theory");
    console.log("✅ school leaderboard loaded:", schoolOrSession);
  }

  renderTop5("theoryPersonal", personal, e =>
    `Score: ${e.score ?? e.theoryScore ?? 0}, Accuracy: ${(e.accuracy ?? e.theoryAccuracy ?? 0).toFixed(0)}%`
  );

  renderTop5("theorySchool", schoolOrSession, e =>
    `${e.nickname || e.username} — Score: ${e.theoryScore ?? e.score ?? 0}, Accuracy: ${(e.theoryAccuracy ?? e.accuracy ?? 0).toFixed(0)}%`
  );

  console.log("✅ renderTop5 called for theoryPersonal and theorySchool");
}








async function showMatching(currentUser, isSessionUser) {
  console.log("🔵 showMatching() START");

  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "");
  console.log("🔍 Topic:", topic);

  // PERSONAL BEST
  const personal = await loadPersonalScores(currentUser, topic, "matching");
  console.log("📄 Personal matching scores:", personal);

  // SCHOOL OR SESSION
  let schoolOrSession = null;
  if (isSessionUser) {
    console.log("🟣 Loading SESSION matching leaderboard");
    schoolOrSession = await loadSessionLeaderboard(topic, "matching");
  } else {
    console.log("🟢 Loading SCHOOL matching leaderboard");
    schoolOrSession = await loadSchoolLeaderboard(currentUser, topic, "matching");
  }

  console.log("📄 School/Session matching scores:", schoolOrSession);

  // PERSONAL RENDER
  renderTop5("matchingPersonal", personal, e =>
    `Time: ${Number(e.time).toFixed(2)}s, Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%, Date: ${e.date}`
  );

  // SCHOOL / SESSION RENDER
  renderTop5("matchingSchool", schoolOrSession, e =>
    `${e.nickname || e.username} — Time: ${Number(e.time).toFixed(2)}s, Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%`
  );

  console.log("🔵 showMatching() END");
}


// =========================
// EXAM MODE RENDERER (FIXED)
// =========================
// =========================
// EXAM MODE RENDERER (DEBUG VERSION)
// =========================
async function showExam(currentUser, isSessionUser) {

  console.log("========== SHOW EXAM START ==========");
  console.log("Current User:", currentUser);
  console.log("Topic:", topic);
  console.log("Is Session User:", isSessionUser);

  // ---------------------------
  // LOAD PERSONAL SCORES
  // ---------------------------
  const personal = await loadPersonalScores(currentUser, topic, "exam");
  console.log("RAW PERSONAL EXAM DATA:", personal);

  // ---------------------------
  // LOAD SCHOOL OR SESSION
  // ---------------------------
  let schoolOrSession = null;

  if (isSessionUser) {
    console.log("Loading SESSION leaderboard...");
    schoolOrSession = await loadSessionLeaderboard(topic, "exam");
  } else {
    console.log("Loading SCHOOL leaderboard...");
    schoolOrSession = await loadSchoolExam(currentUser, topic);
  }

  console.log("RAW SCHOOL/SESSION DATA:", schoolOrSession);

  // ---------------------------
  // PERSONAL BEST RENDER
  // ---------------------------
  console.log("---- PERSONAL BEST RENDER ----");

  renderTop5("examPersonal", personal, e => {

    console.log("PERSONAL ENTRY BEFORE FORMAT:", e);

    const correct = Number(e.totalCorrect);
    const wrong = Number(e.totalWrong);
    const net = Number(e.netScore);

    console.log("PERSONAL FIELDS:", { correct, wrong, net });

    if (isNaN(correct) || isNaN(wrong) || isNaN(net)) {
      console.warn("⚠ PERSONAL SCORE HAS INVALID NUMBERS:", e);
    }

    return `Correct: ${correct}, Wrong: ${wrong}, Net: ${net}, Date: ${e.date}`;
  });

  // ---------------------------
  // SCHOOL / SESSION RENDER
  // ---------------------------
  console.log("---- SCHOOL / SESSION RENDER ----");

  renderTop5("examSchool", schoolOrSession, e => {

    console.log("SCHOOL/SESSION ENTRY BEFORE FORMAT:", e);

    const correct = Number(e.totalCorrect ?? e.examCorrect ?? 0);
    const wrong = Number(e.totalWrong ?? e.examWrong ?? 0);
    const net = Number(e.netScore ?? e.examNet ?? 0);

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
  const personal = await loadPersonalScores(currentUser, topic, mode);

  let schoolOrSession = null;
  if (isSessionUser) {
    schoolOrSession = await loadSessionLeaderboard(topic, mode);
  } else {
    schoolOrSession = await loadSchoolLeaderboard(currentUser, topic, mode);
  }

  renderTop5(personalId, personal, e =>
    `Score: ${e.score}, Accuracy: ${Number(e.accuracy).toFixed(2)}%, Date: ${e.date}`
  );

  renderTop5(schoolId, schoolOrSession, e =>
    `${e.nickname || e.username} — Score: ${e.theoryScore ?? e.score}, Accuracy: ${Number(e.theoryAccuracy ?? e.accuracy ?? 0).toFixed(2)}%`
  );
}


// =========================
// DETECT AVAILABLE MODES (SCHOOL MODE ONLY)
// =========================
// =========================
// AVAILABLE MODES (BY USER / TOPIC)
// =========================
function getAvailableModes(currentUser, topic) {
  // ✅ If no user or no school, just allow all modes
  if (!currentUser || !currentUser.school) {
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

  // ✅ If you later want per‑school/per‑topic logic, add it here.
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
// INIT LEADERBOARDS
// =========================
// =========================
// INIT LEADERBOARDS (FINAL + LOGS)
// =========================
// =========================
// INIT LEADERBOARDS (FIXED)
// =========================
async function initLeaderboards(currentUser, sessionCode, isSessionUser) {
  // 🔍 Recalculate session info
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

  // =========================
  // Determine topic and valid modes
  // =========================
  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "").toLowerCase();
  console.log("🔍 Topic:", topic);

  // Map topics to their valid modes
  const topicModes = {
    "variables and values": ["theory", "matching", "exam"],
    "data types": ["theory", "matching", "exam"],
    "binary": ["btd", "btd_easy", "dtb", "dtb_easy", "ba", "ba_easy"]
  };

  const validModes = topicModes[topic] || ["theory", "matching", "exam"];
  console.log("🔍 Valid modes for topic:", validModes);

  // =========================
  // SESSION MODE
  // =========================
  if (isSessionUser) {
    console.log("🔵 SESSION MODE ACTIVE");
    if (loadingDiv && container) container.removeChild(loadingDiv);

    // Show only relevant modes for this topic
    if (validModes.includes("theory")) {
      console.log("➡ Showing THEORY (session)");
      document.getElementById("theorySection").style.display = "block";
      await showTheory(currentUser, true);
    }

    if (validModes.includes("matching")) {
      console.log("➡ Showing MATCHING (session)");
      document.getElementById("matchingSection").style.display = "block";
      await showMatching(currentUser, true);
    }

    if (validModes.includes("exam")) {
      console.log("➡ Showing EXAM (session)");
      document.getElementById("examSection").style.display = "block";
      await showExam(currentUser, true);
    }

    if (validModes.includes("btd")) {
      console.log("➡ Showing BTD (session)");
      document.getElementById("btdSection").style.display = "block";
      await showBinaryMode(currentUser, "btd", "btdPersonal", "btdSchool", true);
    }

    if (validModes.includes("btd_easy")) {
      console.log("➡ Showing BTD EASY (session)");
      document.getElementById("btdEasySection").style.display = "block";
      await showBinaryMode(currentUser, "btd_easy", "btdEasyPersonal", "btdEasySchool", true);
    }

    if (validModes.includes("dtb")) {
      console.log("➡ Showing DTB (session)");
      document.getElementById("dtbSection").style.display = "block";
      await showBinaryMode(currentUser, "dtb", "dtbPersonal", "dtbSchool", true);
    }

    if (validModes.includes("dtb_easy")) {
      console.log("➡ Showing DTB EASY (session)");
      document.getElementById("dtbEasySection").style.display = "block";
      await showBinaryMode(currentUser, "dtb_easy", "dtbEasyPersonal", "dtbEasySchool", true);
    }

    if (validModes.includes("ba")) {
      console.log("➡ Showing BA (session)");
      document.getElementById("baSection").style.display = "block";
      await showBinaryMode(currentUser, "ba", "baPersonal", "baSchool", true);
    }

    if (validModes.includes("ba_easy")) {
      console.log("➡ Showing BA EASY (session)");
      document.getElementById("baEasySection").style.display = "block";
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
    document.getElementById("theorySection").style.display = "block";
    await showTheory(currentUser, false);
  }

  if (validModes.includes("matching")) {
    console.log("➡ Showing MATCHING (school)");
    document.getElementById("matchingSection").style.display = "block";
    await showMatching(currentUser, false);
  }

  if (validModes.includes("exam")) {
    console.log("➡ Showing EXAM (school)");
    document.getElementById("examSection").style.display = "block";
    await showExam(currentUser, false);
  }

  if (validModes.includes("btd")) {
    console.log("➡ Showing BTD (school)");
    document.getElementById("btdSection").style.display = "block";
    await showBinaryMode(currentUser, "btd", "btdPersonal", "btdSchool", false);
  }

  if (validModes.includes("btd_easy")) {
    console.log("➡ Showing BTD EASY (school)");
    document.getElementById("btdEasySection").style.display = "block";
    await showBinaryMode(currentUser, "btd_easy", "btdEasyPersonal", "btdEasySchool", false);
  }

  if (validModes.includes("dtb")) {
    console.log("➡ Showing DTB (school)");
    document.getElementById("dtbSection").style.display = "block";
    await showBinaryMode(currentUser, "dtb", "dtbPersonal", "dtbSchool", false);
  }

  if (validModes.includes("dtb_easy")) {
    console.log("➡ Showing DTB EASY (school)");
    document.getElementById("dtbEasySection").style.display = "block";
    await showBinaryMode(currentUser, "dtb_easy", "dtbEasyPersonal", "dtbEasySchool", false);
  }

  if (validModes.includes("ba")) {
    console.log("➡ Showing BA (school)");
    document.getElementById("baSection").style.display = "block";
    await showBinaryMode(currentUser, "ba", "baPersonal", "baSchool", false);
  }

  if (validModes.includes("ba_easy")) {
    console.log("➡ Showing BA EASY (school)");
    document.getElementById("baEasySection").style.display = "block";
    await showBinaryMode(currentUser, "ba_easy", "baEasyPersonal", "baEasySchool", false);
  }

  console.log("🟢 SCHOOL MODE COMPLETE");
}
