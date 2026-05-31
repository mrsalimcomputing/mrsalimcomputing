import { hideAllScreens } from "../navigation.js";
import { saveBinaryScore } from "../saveBinaryScore.js";

// ===============================
// BINARY ADDITION (EASY) — 4-BIT ENGINE
// ===============================

let score = 0;
let timeLeft = 60;
let correctAnswer = null;
let timerInterval = null;
let lockInput = false;

let questionsAttempted = 0;
let accuracy = 0;

// ⭐ USE THE SAME DOM IDS AS binary-quiz.html
const rulesPopup = document.getElementById("binaryRulesPopup");
const endPopup = document.getElementById("binaryEndPopup");
const endScoreText = document.getElementById("binaryEndScore");
const endAccuracyText = document.getElementById("binaryEndAccuracy");
const quitBtn = document.getElementById("binaryQuitBtn");

// ===============================
// SHOW RULES
// ===============================
export function showBinaryAdditionEasyRules() {
    if (rulesPopup) rulesPopup.style.display = "flex";
}

// ===============================
// TIMER
// ===============================
function startEasyTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("time").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endEasyQuiz();
        }
    }, 1000);
}

// ===============================
// START QUIZ
// ===============================
export function startBinaryAdditionEasyQuiz() {

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

    startEasyTimer();
    generateEasyQuestion();
}

// ===============================
// GENERATE QUESTION (4-BIT ONLY)
// ===============================
function generateEasyQuestion() {

    lockInput = false;

    // ⭐ Generate two 4-bit numbers (0–15)
    const a = Math.floor(Math.random() * 16);
    const b = Math.floor(Math.random() * 16);

    const binA = a.toString(2).padStart(4, "0");
    const binB = b.toString(2).padStart(4, "0");

    // ⭐ Correct 4-bit sum (wrap to 4 bits)
    const sum = (a + b) & 0xF;
    correctAnswer = sum.toString(2).padStart(4, "0");

    document.getElementById("questionBox").textContent =
        `${binA} + ${binB}`;

    let answers = [correctAnswer];

    while (answers.length < 12) {
        let wrong = Math.floor(Math.random() * 16)
            .toString(2)
            .padStart(4, "0");

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
// CHECK ANSWER
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
function endEasyQuiz() {

    clearInterval(timerInterval);

    const buttons = document.querySelectorAll(".quiz-btn");
    buttons.forEach(btn => btn.disabled = true);

    endScoreText.textContent = `Final Score: ${score}`;
    endAccuracyText.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;

    // ⭐ SAVE SCORE FOR LEADERBOARD
    saveBinaryScore("binary addition (easy)", "ba_easy", score, accuracy);

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


