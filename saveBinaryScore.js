import { auth, db } from "./firebaseConfig.js";
import { getCurrentUser } from "./userManager.js";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function safeTopicName(raw) {
  return raw
    .replace(/\//g, "_")
    .replace(/\\/g, "_")
    .replace(/ /g, "_")
    .replace(/[^\w\-]/g, "_");
}

export async function saveBinaryScore(topic, mode, score, accuracy) {
  const user = getCurrentUser();
  if (!user) return;

  const uid = user.id;
  const school = user.school;
  const safe = safeTopicName(topic);

  const personalId = `${safe}_${mode}`;
  const schoolId = `${school}_${safe}_${mode}`;

  // PERSONAL BEST
  await setDoc(
    doc(db, "users", uid, "scores", personalId),
    {
      score,
      accuracy,
      date: new Date().toLocaleString()
    },
    { merge: true }
  );

  // SCHOOL LEADERBOARD ENTRY
  await addDoc(
    collection(db, "schoolLeaderboards", schoolId, "entries"),
    {
      username: user.username,
      school: user.school,   // ⭐ REQUIRED FOR FIRESTORE RULES
      score,
      accuracy,
      date: new Date().toLocaleString(),
      timestamp: serverTimestamp()
    }
  );

}
