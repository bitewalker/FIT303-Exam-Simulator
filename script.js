// ======================================
// FIT303 Mathematics Exam Simulator
// script.js
// ======================================

const paperSelect = document.getElementById("paperSelect");
const difficultySelect = document.getElementById("difficultySelect");
const modeSelect = document.getElementById("modeSelect");

const startBtn = document.getElementById("startBtn");
const continueBtn = document.getElementById("continueBtn");
const clearBtn = document.getElementById("clearBtn");

// --------------------------------------
// Save last selected options
// --------------------------------------

loadSettings();

paperSelect.addEventListener("change", saveSettings);
difficultySelect.addEventListener("change", saveSettings);
modeSelect.addEventListener("change", saveSettings);

// --------------------------------------
// Start Exam
// --------------------------------------

startBtn.addEventListener("click", () => {

    saveSettings();

    const paper = paperSelect.value;
    const difficulty = difficultySelect.value;
    const mode = modeSelect.value;

    localStorage.removeItem("currentQuestion");

    window.location.href =
        `exam.html?paper=${encodeURIComponent(paper)}&difficulty=${encodeURIComponent(difficulty)}&mode=${encodeURIComponent(mode)}`;

});

// --------------------------------------
// Continue Previous Attempt
// --------------------------------------

continueBtn.addEventListener("click", () => {

    const examInfo = JSON.parse(localStorage.getItem("lastExam"));

    if (!examInfo) {

        alert("No saved exam found.");

        return;

    }

    window.location.href =
        `exam.html?paper=${encodeURIComponent(examInfo.paper)}&difficulty=${encodeURIComponent(examInfo.difficulty)}&mode=${encodeURIComponent(examInfo.mode)}`;

});

// --------------------------------------
// Clear Saved Progress
// --------------------------------------

clearBtn.addEventListener("click", () => {

    if (!confirm("Delete all saved exam progress?")) {

        return;

    }

    const keys = Object.keys(localStorage);

    keys.forEach(key => {

        if (
            key.startsWith("paper") ||
            key === "lastExam" ||
            key === "currentQuestion" ||
            key === "timer" ||
            key === "settings"
        ) {

            localStorage.removeItem(key);

        }

    });

    alert("Saved progress cleared.");

});

// --------------------------------------
// Settings
// --------------------------------------

function saveSettings() {

    const settings = {

        paper: paperSelect.value,
        difficulty: difficultySelect.value,
        mode: modeSelect.value

    };

    localStorage.setItem(
        "settings",
        JSON.stringify(settings)
    );

}

function loadSettings() {

    const settings =
        JSON.parse(localStorage.getItem("settings"));

    if (!settings) return;

    if (settings.paper)
        paperSelect.value = settings.paper;

    if (settings.difficulty)
        difficultySelect.value = settings.difficulty;

    if (settings.mode)
        modeSelect.value = settings.mode;

}

// --------------------------------------
// Save Last Exam Information
// --------------------------------------

function saveLastExam() {

    const exam = {

        paper: paperSelect.value,
        difficulty: difficultySelect.value,
        mode: modeSelect.value

    };

    localStorage.setItem(
        "lastExam",
        JSON.stringify(exam)
    );

}

// Save automatically when starting

startBtn.addEventListener("click", saveLastExam);