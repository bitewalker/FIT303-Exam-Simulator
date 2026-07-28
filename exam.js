const APP_PREFIX = "fit303-";
const params = new URLSearchParams(location.search);
const config = {
  type: params.get("type") || "paper",
  paper: params.get("paper"),
  difficulty: params.get("difficulty"),
  mode: params.get("mode") || "full",
  unit: params.get("unit"),
  unitTitle: params.get("unitTitle") || ""
};
const freshAttempt = params.get("fresh") === "1";
const attemptKey = config.type === "unit"
  ? `${APP_PREFIX}attempt-unit-${config.unit}`
  : `${APP_PREFIX}attempt-${config.paper}-${config.difficulty}-${config.mode}`;
let questions = [], answers = {}, current = 0, elapsedMilliseconds = 0, resumedAt = null, timerId, finished = false;
const radios = [...document.querySelectorAll('input[name="answer"]')];

function shuffle(items) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function duration() { return Math.floor((elapsedMilliseconds + (resumedAt !== null ? Date.now() - resumedAt : 0)) / 1000); }
function formatTime(seconds) { const h = String(Math.floor(seconds / 3600)).padStart(2, "0"); const m = String(Math.floor(seconds % 3600 / 60)).padStart(2, "0"); const s = String(seconds % 60).padStart(2, "0"); return `${h}:${m}:${s}`; }
function persist(pause = false) {
  if (resumedAt !== null) elapsedMilliseconds += Date.now() - resumedAt;
  resumedAt = pause ? null : Date.now();
  const attempt = { config, questions, answers, current, elapsedMilliseconds, updatedAt: Date.now() };
  localStorage.setItem(attemptKey, JSON.stringify(attempt));
  localStorage.setItem(`${APP_PREFIX}last-attempt`, JSON.stringify(attempt));
}
function updateTimer() { document.getElementById("timer").textContent = formatTime(duration()); }

async function loadExam() {
  if (config.type === "unit" ? !config.unit : !config.paper || !config.difficulty) return location.replace("index.html");
  const saved = freshAttempt ? null : JSON.parse(localStorage.getItem(attemptKey) || "null");
  if (saved?.questions?.length) {
    questions = saved.questions;
    answers = saved.answers || {};
    current = Math.min(Math.max(saved.current || 0, 0), questions.length - 1);
    elapsedMilliseconds = Number.isFinite(saved.elapsedMilliseconds)
      ? saved.elapsedMilliseconds
      : Number.isFinite(saved.elapsedSeconds)
        ? saved.elapsedSeconds * 1000
        : Math.max(0, (saved.updatedAt || Date.now()) - (saved.startedAt || Date.now()));
  } else {
    questions = await loadQuestions();
  }
  resumedAt = Date.now();
  document.getElementById("title").textContent = examTitle();
  updateTimer();
  timerId = setInterval(updateTimer, 1000);
  buildQuestionNavigator();
  showQuestion();
}

async function loadQuestions() {
  if (config.type === "unit") {
    const response = await fetch("data/units.json");
    if (!response.ok) throw new Error("Unit data could not be loaded.");
    const { units = [] } = await response.json();
    const unit = units.find(item => item.id === config.unit);
    if (!unit?.questions?.length) throw new Error("This unit has no questions.");
    config.unitTitle = unit.title;
    return unit.questions;
  }
  const response = await fetch(`data/${config.paper}.json`);
  if (!response.ok) throw new Error("Paper data could not be loaded.");
  const data = await response.json();
  const pool = data[config.difficulty] || [];
  if (!pool.length) throw new Error("This question group is empty.");
  const amount = config.mode === "full" ? pool.length : Math.min(Number(config.mode), pool.length);
  return config.mode === "full" ? pool : shuffle(pool).slice(0, amount);
}

function examTitle() {
  if (config.type === "unit") return `Unit Practice · ${config.unitTitle || config.unit}`;
  return `${config.paper.replace("paper", "Paper ")} · ${config.difficulty} · ${config.mode === "full" ? "Full paper" : `Random ${config.mode}`}`;
}

function buildQuestionNavigator() {
  const jumpSelect = document.getElementById("jumpSelect");
  const navigator = document.getElementById("questionNavigator");
  jumpSelect.replaceChildren(...questions.map((question, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `Question ${question.number}`;
    return option;
  }));
  jumpSelect.addEventListener("change", () => { current = Number(jumpSelect.value); showQuestion(); });
  navigator.replaceChildren(...questions.map((question, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = question.number;
    button.addEventListener("click", () => { current = index; showQuestion(); });
    return button;
  }));
}

function showQuestion() {
  const q = questions[current];
  document.getElementById("questionNumber").textContent = `Question ${q.number} · ${current + 1} of ${questions.length}`;
  document.getElementById("questionImage").src = q.image;
  radios.forEach(radio => radio.checked = answers[q.number] === radio.value);
  document.getElementById("prevBtn").disabled = current === 0;
  document.getElementById("nextBtn").disabled = current === questions.length - 1;
  document.getElementById("jumpSelect").value = current;
  [...document.getElementById("questionNavigator").children].forEach((button, index) => {
    button.classList.toggle("current", index === current);
    button.classList.toggle("answered", Boolean(answers[questions[index].number]));
  });
  persist();
}

radios.forEach(radio => radio.addEventListener("change", () => { answers[questions[current].number] = radio.value; showQuestion(); }));
document.getElementById("clearAnswerBtn").addEventListener("click", () => { delete answers[questions[current].number]; radios.forEach(radio => radio.checked = false); showQuestion(); });
document.getElementById("prevBtn").addEventListener("click", () => { if (current) { current--; showQuestion(); } });
document.getElementById("nextBtn").addEventListener("click", () => { if (current < questions.length - 1) { current++; showQuestion(); } });
document.getElementById("homeBtn").addEventListener("click", () => { persist(true); location.href = "index.html"; });
document.getElementById("finishBtn").addEventListener("click", () => {
  if (!confirm("Finish this exam and view results?")) return;
  const totalTime = duration();
  finished = true;
  clearInterval(timerId);
  localStorage.setItem(`${APP_PREFIX}result`, JSON.stringify({ config, questions, answers, duration: totalTime, finishedAt: Date.now() }));
  localStorage.removeItem(attemptKey);
  const lastAttempt = JSON.parse(localStorage.getItem(`${APP_PREFIX}last-attempt`) || "null");
  if (lastAttempt && JSON.stringify(lastAttempt.config) === JSON.stringify(config)) localStorage.removeItem(`${APP_PREFIX}last-attempt`);
  location.href = "results.html";
});
window.addEventListener("pagehide", () => { if (!finished) persist(true); });
document.addEventListener("keydown", event => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  const key = event.key.toUpperCase();
  if (["A", "B", "C", "D", "E"].includes(key)) { const radio = radios.find(item => item.value === key); radio.checked = true; radio.dispatchEvent(new Event("change")); }
  if (event.key === "ArrowLeft") document.getElementById("prevBtn").click();
  if (event.key === "ArrowRight") document.getElementById("nextBtn").click();
});
loadExam().catch(error => { document.querySelector(".exam-shell").innerHTML = `<section class="card"><h1>Cannot open exam</h1><p>${error.message}</p><a href="index.html">Return home</a></section>`; });
