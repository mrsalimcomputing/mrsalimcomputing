import { hideAllScreens } from "../navigation.js";
import { saveBinaryScore } from "../saveBinaryScore.js";

// ===============================
// DENARY → BINARY QUIZ ENGINE (ACCURACY SYSTEM)
// ===============================

let score = 0;
let timeLeft = 60;
let correctBinary = null;
let timerInterval = null;
let lockInput = false;

let questionsAttempted = 0;
let accuracy = 0;

// DOM elements
const rulesPopup = document.getElementById("binaryRulesPopup");
const endPopup = document.getElementById("binaryEndPopup");
const endScoreText = document.getElementById("binaryEndScore");
const endAccuracyText = document.getElementById("binaryEndAccuracy");
const startBtn = document.getElementById("startBinaryBtn");
const playAgainBtn = document.getElementById("playAgainBinaryBtn");
const quitBtn = document.getElementById("binaryQuitBtn");

// ===============================
// SHOW RULES
// ===============================
export function showDenaryToBinaryRules() {
    rulesPopup.style.display = "flex";
}

// ===============================
// TIMER
// ===============================
function startTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("time").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endQuiz();
        }
    }, 1000);
}

// ===============================
// START QUIZ
// ===============================
export function startDenaryToBinaryQuiz() {

    rulesPopup.style.display = "none";
    endPopup.style.display = "none";

    hideAllScreens();
    document.getElementById("gameScreen").style.display = "block";

    score = 0;
    timeLeft = 60;
    lockInput = false;

    questionsAttempted = 0;
    accuracy = 0;
    updateStatsBar();

    document.getElementById("time").textContent = timeLeft;

    startTimer();
    generateQuestion();
}

// ===============================
// GENERATE QUESTION
// ===============================
function generateQuestion() {

    lockInput = false;

    // ⭐ Generate a decimal number 0–255
    const denary = Math.floor(Math.random() * 256);

    // ⭐ Convert to EXACT 8-bit binary
    correctBinary = denary.toString(2).padStart(8, "0");

    document.getElementById("questionBox").textContent =
        `Convert ${denary} to 8-bit binary`;

    let answers = [correctBinary];

    // ⭐ Generate wrong answers (8-bit only)
    while (answers.length < 12) {
        let wrong = Math.floor(Math.random() * 256)
            .toString(2)
            .padStart(8, "0");

        if (!answers.includes(wrong)) answers.push(wrong);
    }

    answers.sort(() => Math.random() - 0.5);

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach((btn, index) => {
        btn.disabled = false;
        btn.textContent = answers[index];
        btn.onclick = () => checkAnswer(answers[index]);
    });
}

// ===============================
// CHECK ANSWER (ACCURACY SYSTEM)
// ===============================
function checkAnswer(selected) {

    if (lockInput) return;
    lockInput = true;

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = selected === correctBinary;

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

    generateQuestion();
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
function endQuiz() {

    clearInterval(timerInterval);

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach(btn => btn.disabled = true);

    endScoreText.textContent = `Final Score: ${score}`;
    endAccuracyText.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;

    // ⭐ SAVE SCORE FOR LEADERBOARD
    saveBinaryScore("denary to binary", "dtb", score, accuracy);

    endPopup.style.display = "flex";
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
// BUTTON EVENTS
// ===============================
startBtn.onclick = () => startDenaryToBinaryQuiz();
playAgainBtn.onclick = () => startDenaryToBinaryQuiz();

if (quitBtn) {
    quitBtn.onclick = () => {
        clearInterval(timerInterval);
        window.location.href = "ks3.html";
    };
}
