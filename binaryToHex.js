import { hideAllScreens } from "../navigation.js";
import { saveBinaryScore } from "../saveBinaryScore.js";

// ===============================
// BINARY → HEX QUIZ ENGINE
// ===============================

let score = 0;
let timeLeft = 60;
let correctAnswer = null;
let timerInterval = null;
let lockInput = false;

let questionsAttempted = 0;
let accuracy = 0;

// DOM elements
const rulesPopup = document.getElementById("binaryHexRulesPopup");
const endPopup = document.getElementById("binaryHexEndPopup");
const endScoreText = document.getElementById("binaryHexEndScore");
const endAccuracyText = document.getElementById("binaryHexEndAccuracy");
const startBtn = document.getElementById("startBinaryHexBtn");
const playAgainBtn = document.getElementById("playAgainBinaryHexBtn");
const quitBtn = document.getElementById("binaryHexQuitBtn");

// ===============================
// SHOW RULES
// ===============================
export function showBinaryHexRules() {
    rulesPopup.style.display = "flex";
}

// ===============================
// TIMER
// ===============================
function startBinaryHexTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("time").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endBinaryHexQuiz();
        }
    }, 1000);
}

// ===============================
// START QUIZ
// ===============================
export function startBinaryHexQuiz() {

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

    startBinaryHexTimer();
    generateQuestion();
}

// ===============================
// GENERATE QUESTION
// ===============================
function generateQuestion() {

    lockInput = false;

    // Generate random binary (4, 8, or 12 bits)
    const bitLength = [4, 8, 12][Math.floor(Math.random() * 3)];

    let binary = "";
    for (let i = 0; i < bitLength; i++) {
        binary += Math.random() < 0.5 ? "0" : "1";
    }

    correctAnswer = parseInt(binary, 2).toString(16).toUpperCase();

    document.getElementById("questionBox").textContent =
        `Convert ${binary} to hex`;

    let answers = [correctAnswer];

    // Generate wrong answers
    while (answers.length < 12) {
        let wrong = parseInt(binary, 2) + Math.floor(Math.random() * 30) - 15;
        wrong = wrong.toString(16).toUpperCase();

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
function endBinaryHexQuiz() {

    clearInterval(timerInterval);

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach(btn => btn.disabled = true);

    endScoreText.textContent = `Final Score: ${score}`;
    endAccuracyText.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;

    saveBinaryScore("binary to hex", "bth", score, accuracy);

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
