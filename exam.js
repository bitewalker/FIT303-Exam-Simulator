const APP_PREFIX = "fit303-";
const params = new URLSearchParams(location.search);
const config = { paper: params.get("paper"), difficulty: params.get("difficulty"), mode: params.get("mode") || "full" };
const freshAttempt = params.get("fresh") === "1";
const attemptKey = `${APP_PREFIX}attempt-${config.paper}-${config.difficulty}-${config.mode}`;
let questions = [], answers = {}, current = 0, startedAt = Date.now(), timerId;
const radios = [...document.querySelectorAll('input[name="answer"]')];

function shuffle(items) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function duration() { return Math.floor((Date.now() - startedAt) / 1000); }
function formatTime(seconds) { const h = String(Math.floor(seconds / 3600)).padStart(2, "0"); const m = String(Math.floor(seconds % 3600 / 60)).padStart(2, "0"); const s = String(seconds % 60).padStart(2, "0"); return `${h}:${m}:${s}`; }
function persist() {
  const attempt = { config, questions, answers, current, startedAt, updatedAt: Date.now() };
  localStorage.setItem(attemptKey, JSON.stringify(attempt));
  localStorage.setItem(`${APP_PREFIX}last-attempt`, JSON.stringify(attempt));
}

async function loadExam() {
  if (!config.paper || !config.difficulty) return location.replace("index.html");
  const saved = freshAttempt ? null : JSON.parse(localStorage.getItem(attemptKey) || "null");
  if (saved?.questions?.length) {
    ({ questions, answers, current, startedAt } = saved);
  } else {
    const response = await fetch(`data/${config.paper}.json`);
    if (!response.ok) throw new Error("Paper data could not be loaded.");
    const data = await response.json();
    const pool = data[config.difficulty] || [];
    if (!pool.length) throw new Error("This question group is empty.");
    const amount = config.mode === "full" ? pool.length : Math.min(Number(config.mode), pool.length);
    questions = config.mode === "full" ? pool : shuffle(pool).slice(0, amount);
    persist();
  }
  document.getElementById("title").textContent = `${config.paper.replace("paper", "Paper ")} · ${config.difficulty} · ${config.mode === "full" ? "Full paper" : `Random ${config.mode}`}`;
  setInterval(() => document.getElementById("timer").textContent = formatTime(duration()), 1000);
  showQuestion();
}

function showQuestion() {
  const q = questions[current];
  document.getElementById("questionNumber").textContent = `Question ${q.number} · ${current + 1} of ${questions.length}`;
  document.getElementById("questionImage").src = q.image;
  radios.forEach(radio => radio.checked = answers[q.number] === radio.value);
  document.getElementById("prevBtn").disabled = current === 0;
  document.getElementById("nextBtn").disabled = current === questions.length - 1;
  persist();
}

radios.forEach(radio => radio.addEventListener("change", () => { answers[questions[current].number] = radio.value; persist(); }));
document.getElementById("clearAnswerBtn").addEventListener("click", () => { delete answers[questions[current].number]; radios.forEach(radio => radio.checked = false); persist(); });
document.getElementById("prevBtn").addEventListener("click", () => { if (current) { current--; showQuestion(); } });
document.getElementById("nextBtn").addEventListener("click", () => { if (current < questions.length - 1) { current++; showQuestion(); } });
document.getElementById("homeBtn").addEventListener("click", () => { persist(); location.href = "index.html"; });
document.getElementById("finishBtn").addEventListener("click", () => { if (!confirm("Finish this exam and view results?")) return; persist(); localStorage.setItem(`${APP_PREFIX}result`, JSON.stringify({ config, questions, answers, startedAt, finishedAt: Date.now() })); location.href = "results.html"; });
document.addEventListener("keydown", event => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  const key = event.key.toUpperCase();
  if (["A", "B", "C", "D", "E"].includes(key)) { const radio = radios.find(item => item.value === key); radio.checked = true; radio.dispatchEvent(new Event("change")); }
  if (event.key === "ArrowLeft") document.getElementById("prevBtn").click();
  if (event.key === "ArrowRight") document.getElementById("nextBtn").click();
});
loadExam().catch(error => { document.querySelector(".exam-shell").innerHTML = `<section class="card"><h1>Cannot open exam</h1><p>${error.message}</p><a href="index.html">Return home</a></section>`; });
