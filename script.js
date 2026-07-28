const APP_PREFIX = "fit303-";
const paperSelect = document.getElementById("paperSelect");
const difficultySelect = document.getElementById("difficultySelect");
const modeSelect = document.getElementById("modeSelect");
const availability = document.getElementById("availability");
let papers = [];

async function initialise() {
  try {
    const response = await fetch("data/papers.json");
    if (!response.ok) throw new Error("data/papers.json was not found.");
    papers = await response.json();
    const settings = JSON.parse(localStorage.getItem(`${APP_PREFIX}settings`) || "{}");
    paperSelect.innerHTML = papers.map(({ paper }) => `<option value="${paper}">${paper.replace("paper", "Paper ")}</option>`).join("");
    paperSelect.value = papers.some(p => p.paper === settings.paper) ? settings.paper : papers[0]?.paper;
    difficultySelect.value = settings.difficulty || "hard";
    modeSelect.value = settings.mode || "full";
    updateAvailability();
  } catch (error) {
    availability.textContent = `Cannot load papers: ${error.message}`;
    document.getElementById("startBtn").disabled = true;
  }
}

function selectedPaper() { return papers.find(p => p.paper === paperSelect.value); }

function updateAvailability() {
  const paper = selectedPaper();
  if (!paper) return;
  const count = paper[difficultySelect.value] || 0;
  availability.textContent = `${paper.paper.replace("paper", "Paper ")} has ${count} ${difficultySelect.value} question${count === 1 ? "" : "s"}.`;
  document.getElementById("startBtn").disabled = count === 0;
}

function settings() {
  return { paper: paperSelect.value, difficulty: difficultySelect.value, mode: modeSelect.value };
}

function openExam(exam, fresh = false) {
  localStorage.setItem(`${APP_PREFIX}settings`, JSON.stringify(exam));
  const query = new URLSearchParams(exam);
  if (fresh) query.set("fresh", "1");
  window.location.href = `exam.html?${query}`;
}

document.getElementById("startBtn").addEventListener("click", () => openExam(settings(), true));
document.getElementById("continueBtn").addEventListener("click", () => {
  const attempt = JSON.parse(localStorage.getItem(`${APP_PREFIX}last-attempt`) || "null");
  if (!attempt) return alert("There is no saved attempt yet.");
  openExam(attempt.config);
});
document.getElementById("clearProgressBtn").addEventListener("click", () => {
  if (!confirm("Clear all saved answers, timers, and results for FIT303?")) return;
  Object.keys(localStorage).filter(key => key.startsWith(APP_PREFIX)).forEach(key => localStorage.removeItem(key));
  alert("Saved progress cleared.");
});
paperSelect.addEventListener("change", updateAvailability);
difficultySelect.addEventListener("change", updateAvailability);
modeSelect.addEventListener("change", () => localStorage.setItem(`${APP_PREFIX}settings`, JSON.stringify(settings())));
initialise();
