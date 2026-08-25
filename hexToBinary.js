import { hideAllScreens } from "../navigation.js";
import { saveBinaryScore } from "../saveBinaryScore.js";

// ===============================
// HEX → BINARY QUIZ ENGINE
// ===============================

let score = 0;
let timeLeft = 60;
let correctAnswer = null;
let timerInterval = null;
let lockInput = false;

let questionsAttempted = 0;
let accuracy = 0;

// DOM elements
const rulesPopup = document.getElementById("hexBinaryRulesPopup");
const endPopup = document.getElementById("hexBinaryEndPopup");
const endScoreText = document.getElementById("hexBinaryEndScore");
const endAccuracyText = document.getElementById("hexBinaryEndAccuracy");
const startBtn = document.getElementById("startHexBinaryBtn");
const playAgainBtn = document.getElementById("playAgainHexBinaryBtn");
const quitBtn = document.getElementById("hexBinaryQuitBtn");

// ===============================
// SHOW RULES
// ===============================
export function showHexBinaryRules() {
    rulesPopup.style.display = "flex";
}

// ===============================
// TIMER
// ===============================
function startHexBinaryTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("time").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endHexBinaryQuiz();
        }
    }, 1000);
}

// ===============================
// START QUIZ
// ===============================
export function startHexBinaryQuiz() {

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

    startHexBinaryTimer();
    generateQuestion();
}

// ===============================
// GENERATE QUESTION
// ===============================
function generateQuestion() {

    lockInput = false;

    // Generate random hex (1 or 2 digits)
    const hexDigits = "0123456789ABCDEF";
    const length = Math.random() < 0.5 ? 1 : 2;

    let hex = "";
    for (let i = 0; i < length; i++) {
        hex += hexDigits[Math.floor(Math.random() * 16)];
    }

    // Convert hex → binary (4 bits per hex digit)
    correctAnswer = parseInt(hex, 16).toString(2).padStart(length * 4, "0");

    document.getElementById("questionBox").textContent =
        `Convert ${hex} to binary`;

    let answers = [correctAnswer];

    // Generate wrong answers
    while (answers.length < 12) {
        let wrong = (parseInt(hex, 16) + Math.floor(Math.random() * 20) - 10)
            .toString(2)
            .padStart(length * 4, "0");

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
// CHECK ANSWER
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
function endHexBinaryQuiz() {

    clearInterval(timerInterval);

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach(btn => btn.disabled = true);

    endScoreText.textContent = `Final Score: ${score}`;
    endAccuracyText.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;

    saveBinaryScore("hex to binary", "htb", score, accuracy);

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

if (quitBtn) {
    quitBtn.onclick = () => {
        clearInterval(timerInterval);
        window.history.back();
    };
}
