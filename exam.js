// ======================================
// FIT303 Mathematics Exam Simulator
// exam.js
// ======================================

const params = new URLSearchParams(window.location.search);

const paper = params.get("paper");
const difficulty = params.get("difficulty");

let questions = [];
let current = 0;
let answers = {};

const title = document.getElementById("title");
const questionNumber = document.getElementById("questionNumber");
const questionImage = document.getElementById("questionImage");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

const radios = document.querySelectorAll('input[name="answer"]');

const storageKey = `${paper}_${difficulty}`;

// ==============================
// Load Exam
// ==============================

async function loadExam() {

    const response = await fetch(`data/${paper}.json`);
    const data = await response.json();

    questions = data[difficulty];

    title.textContent =
        `${paper.toUpperCase()} - ${difficulty.toUpperCase()}`;

    loadAnswers();

    showQuestion();

}

// ==============================
// Show Question
// ==============================

function showQuestion() {

    if (questions.length === 0) return;

    const q = questions[current];

    questionNumber.textContent =
        `Question ${current + 1} / ${questions.length}`;

    questionImage.src = q.image;

    loadSelectedAnswer();

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === questions.length - 1;

}

// ==============================
// Navigation
// ==============================

prevBtn.addEventListener("click", () => {

    if (current > 0) {

        current--;
        showQuestion();

    }

});

nextBtn.addEventListener("click", () => {

    if (current < questions.length - 1) {

        current++;
        showQuestion();

    }

});

backBtn.addEventListener("click", () => {

    window.location.href = "index.html";

});

// ==============================
// Answers
// ==============================

radios.forEach(radio => {

    radio.addEventListener("change", () => {

        const q = questions[current];

        answers[q.number] = radio.value;

        saveAnswers();

    });

});

function loadSelectedAnswer() {

    const q = questions[current];

    const saved = answers[q.number];

    radios.forEach(radio => {

        radio.checked = (radio.value === saved);

    });

}

// ==============================
// Local Storage
// ==============================

function saveAnswers() {

    localStorage.setItem(

        storageKey,

        JSON.stringify(answers)

    );

}

function loadAnswers() {

    const saved = localStorage.getItem(storageKey);

    answers = saved ? JSON.parse(saved) : {};

}

// ==============================
// Keyboard Shortcuts
// ==============================

document.addEventListener("keydown", (e) => {

    switch (e.key.toLowerCase()) {

        case "arrowleft":
            prevBtn.click();
            break;

        case "arrowright":
            nextBtn.click();
            break;

        case "a":
        case "b":
        case "c":
        case "d":
        case "e":

            const radio = document.querySelector(
                `input[value="${e.key.toUpperCase()}"]`
            );

            if (radio) {

                radio.checked = true;
                radio.dispatchEvent(new Event("change"));

            }

            break;

    }

});

// ==============================

loadExam();