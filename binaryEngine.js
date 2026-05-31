import { hideAllScreens } from "../navigation.js";
import { saveBinaryScore } from "../saveBinaryScore.js";

// ===============================
// BINARY QUIZ ENGINE (ACCURACY + CLEAN SCORING)
// ===============================

let score = 0;
let timeLeft = 60;
let correctAnswer = null;
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
export function showBinaryRules() {
    rulesPopup.style.display = "flex";
}

// ===============================
// TIMER
// ===============================
function startBinaryTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("time").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endBinaryQuiz();
        }
    }, 1000);
}

// ===============================
// START QUIZ
// ===============================
export function startBinaryQuiz() {

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

    startBinaryTimer();
    generateQuestion();
}

// ===============================
// GENERATE QUESTION (6, 7, or 8 bits)
// ===============================
function generateQuestion() {

    lockInput = false;

    const bitLength = [6, 7, 8][Math.floor(Math.random() * 3)];

    let binary = "";
    for (let i = 0; i < bitLength; i++) {
        binary += Math.random() < 0.5 ? "0" : "1";
    }

    correctAnswer = parseInt(binary, 2);

    document.getElementById("questionBox").textContent =
        `Convert ${binary} to decimal`;

    const min = Math.pow(2, bitLength - 1);
    const max = Math.pow(2, bitLength) - 1;

    let answers = [correctAnswer];

    while (answers.length < 12) {
        let wrong = Math.floor(Math.random() * (max - min + 1)) + min;
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
function endBinaryQuiz() {

    clearInterval(timerInterval);

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach(btn => btn.disabled = true);

    endScoreText.textContent = `Final Score: ${score}`;
    endAccuracyText.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;

    // ⭐ SAVE SCORE FOR LEADERBOARD
    saveBinaryScore("binary to denary", "btd", score, accuracy);

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
startBtn.onclick = () => startBinaryQuiz();
playAgainBtn.onclick = () => startBinaryQuiz();

if (quitBtn) {
    quitBtn.onclick = () => {
        clearInterval(timerInterval);
        window.location.href = "ks3.html";
    };
}
