// js/firebaseConfig.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMns9gbvYz1iO5T4lvHgWfvDb-MozdAwo",
  authDomain: "mrsalimcomputing.firebaseapp.com",
  projectId: "mrsalimcomputing",
  storageBucket: "mrsalimcomputing.firebasestorage.app",
  messagingSenderId: "294497459970",
  appId: "1:294497459970:web:44d2533ae4809368546c1b",
  measurementId: "G-2NYYN3NQLH"
};

// ⭐ Initialize Firebase
export const app = initializeApp(firebaseConfig);

// ⭐ Initialize Auth (THIS was missing)
export const auth = getAuth(app);

// ⭐ Initialize Firestore
export const db = getFirestore(app);
