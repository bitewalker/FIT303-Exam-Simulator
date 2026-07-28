const APP_PREFIX = "fit303-";
const result = JSON.parse(localStorage.getItem(`${APP_PREFIX}result`) || "null");
const formatTime = seconds => `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

async function getKey(config) {
  try {
    const keyPath = config.type === "unit" ? `images/units/${config.unit}/answers.json` : `answers/${config.paper}.json`;
    const response = await fetch(keyPath);
    if (!response.ok) return {};
    const data = await response.json();
    const answers = Array.isArray(data) ? Object.fromEntries(data.map(item => [item.number, item.answer || item.correct || ""])) : (data[config.difficulty] || data);
    return Object.fromEntries(Object.entries(answers).map(([number, answer]) => [number, String(answer).trim().toUpperCase()]));
  } catch { return {}; }
}

async function showResults() {
  if (!result) { location.replace("index.html"); return; }
  const key = await getKey(result.config);
  const known = result.questions.filter(q => key[q.number]);
  const correct = known.filter(q => result.answers[q.number] === key[q.number]).length;
  const wrong = known.filter(q => result.answers[q.number] && result.answers[q.number] !== key[q.number]).length;
  const blank = result.questions.filter(q => !result.answers[q.number]).length;
  const isUnitPractice = result.config.type === "unit";
  document.getElementById("summary").textContent = isUnitPractice
    ? `Unit Practice · ${result.config.unitTitle || result.config.unit} · ${result.questions.length} questions`
    : `${result.config.paper.replace("paper", "Paper ")} · ${result.config.difficulty} · ${result.questions.length} questions`;
  const elapsed = Number.isFinite(result.duration) ? result.duration : Math.max(0, Math.floor((result.finishedAt - result.startedAt) / 1000));
  document.getElementById("timeTaken").textContent = `Time taken: ${formatTime(elapsed)}`;
  if (known.length) {
    const percentage = Math.round(correct / known.length * 100);
    document.getElementById("score").textContent = `${percentage}%`;
    document.getElementById("breakdown").textContent = `Correct: ${correct} · Wrong: ${wrong} · Blank: ${blank}`;
    document.getElementById("reviewMessage").textContent = "Marked questions are shown below.";
  } else {
    document.getElementById("score").textContent = isUnitPractice ? "" : "No answer key yet";
    document.getElementById("breakdown").textContent = isUnitPractice
      ? `Questions Answered: ${result.questions.length - blank} · Questions Unanswered: ${blank}`
      : `Answered: ${result.questions.length - blank} · Blank: ${blank}`;
    document.getElementById("reviewMessage").textContent = isUnitPractice
      ? "This unit is in practice mode. Add images/units/your-unit/answers.json to enable marking."
      : "Add answers/paperX.json to enable marking. Example: { \"3\": \"B\", \"7\": \"D\" }.";
  }
  document.getElementById("review").innerHTML = result.questions.map(q => {
    const your = result.answers[q.number] || "Blank";
    const correctAnswer = key[q.number] || "Not set";
    const state = !key[q.number] || !result.answers[q.number] ? "" : your === correctAnswer ? "correct" : "wrong";
    return `<div class="review-row ${state}"><strong>Question ${q.number}</strong><span>Your answer: ${your}</span><span>Correct: ${correctAnswer}</span></div>`;
  }).join("");
}
showResults();
