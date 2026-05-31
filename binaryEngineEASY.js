import { hideAllScreens } from "../navigation.js";
import { saveBinaryScore } from "../saveBinaryScore.js";

// ===============================
// BINARY → DENARY (EASY) — 4-BIT ENGINE
// ===============================

let score = 0;
let timeLeft = 60;
let correctAnswer = null;
let timerInterval = null;
let lockInput = false;

let questionsAttempted = 0;
let accuracy = 0;

// DOM elements (USE EXISTING HTML IDS)
const rulesPopup = document.getElementById("binaryRulesPopup");
const endPopup = document.getElementById("binaryEndPopup");
const endScoreText = document.getElementById("binaryEndScore");
const endAccuracyText = document.getElementById("binaryEndAccuracy");
const quitBtn = document.getElementById("binaryQuitBtn");

// ===============================
// SHOW RULES
// ===============================
export function showBinaryEasyRules() {
    if (rulesPopup) rulesPopup.style.display = "flex";
}

// ===============================
// TIMER
// ===============================
function startBinaryEasyTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("time").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endBinaryEasyQuiz();
        }
    }, 1000);
}

// ===============================
// START QUIZ
// ===============================
export function startBinaryEasyQuiz() {

    if (rulesPopup) rulesPopup.style.display = "none";
    if (endPopup) endPopup.style.display = "none";

    hideAllScreens();
    document.getElementById("gameScreen").style.display = "block";

    score = 0;
    timeLeft = 60;
    lockInput = false;

    questionsAttempted = 0;
    accuracy = 0;
    updateStatsBar();

    document.getElementById("time").textContent = timeLeft;

    startBinaryEasyTimer();
    generateEasyQuestion();
}

// ===============================
// GENERATE QUESTION (4 BITS ONLY)
// ===============================
function generateEasyQuestion() {

    lockInput = false;

    let binary = "";
    for (let i = 0; i < 4; i++) {
        binary += Math.random() < 0.5 ? "0" : "1";
    }

    correctAnswer = parseInt(binary, 2);

    document.getElementById("questionBox").textContent =
        `Convert ${binary} to decimal`;

    let answers = [correctAnswer];

    while (answers.length < 12) {
        let wrong = Math.floor(Math.random() * 16); // 0–15
        if (!answers.includes(wrong)) answers.push(wrong);
    }

    answers.sort(() => Math.random() - 0.5);

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach((btn, index) => {
        btn.disabled = false;
        btn.textContent = answers[index];
        btn.onclick = () => checkEasyAnswer(answers[index]);
    });
}

// ===============================
// CHECK ANSWER (ACCURACY SYSTEM)
// ===============================
function checkEasyAnswer(selected) {

    if (lockInput) return;
    lockInput = true;

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = selected === correctAnswer;

    questionsAttempted++;

    if (isCorrect) {
        score += 1;
        flashCorrect();
    } else {
        score = Math.max(0, score - 1);
        flashWrong();
    }

    accuracy = (score / questionsAttempted) * 100;

    updateStatsBar();

    generateEasyQuestion();
}

// ===============================
// VISUAL FEEDBACK
// ===============================
function flashCorrect() {
    const box = document.getElementById("questionBox");
    box.style.background = "#c8ffcc";
    setTimeout(() => box.style.background = "#ffffff", 150);
}

function flashWrong() {
    const box = document.getElementById("questionBox");
    box.style.background = "#ffcccc";
    setTimeout(() => box.style.background = "#ffffff", 150);
}

// ===============================
// END QUIZ
// ===============================
function endBinaryEasyQuiz() {

    clearInterval(timerInterval);

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach(btn => btn.disabled = true);

    endScoreText.textContent = `Final Score: ${score}`;
    endAccuracyText.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;

    // ⭐ SAVE SCORE FOR LEADERBOARD
    saveBinaryScore("binary to denary (easy)", "btd_easy", score, accuracy);

    if (endPopup) endPopup.style.display = "flex";
}

// ===============================
// UPDATE TOP BAR
// ===============================
function updateStatsBar() {
    document.getElementById("score").textContent = score;
    document.getElementById("questionCount").textContent = questionsAttempted;
    document.getElementById("accuracy").textContent = `${accuracy.toFixed(0)}%`;
}

// ===============================
// QUIT BUTTON
// ===============================
if (quitBtn) {
    quitBtn.onclick = () => {
        clearInterval(timerInterval);
        window.location.href = "index.html";
    };
}


