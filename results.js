const APP_PREFIX = "fit303-";
const result = JSON.parse(localStorage.getItem(`${APP_PREFIX}result`) || "null");
const formatTime = seconds => `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

async function getKey(paper, difficulty) {
  try {
    const response = await fetch(`answers/${paper}.json`);
    if (!response.ok) return {};
    const data = await response.json();
    if (Array.isArray(data)) return Object.fromEntries(data.map(item => [item.number, item.answer || item.correct || ""]));
    return data[difficulty] || data;
  } catch { return {}; }
}

async function showResults() {
  if (!result) { location.replace("index.html"); return; }
  const key = await getKey(result.config.paper, result.config.difficulty);
  const known = result.questions.filter(q => key[q.number]);
  const correct = known.filter(q => result.answers[q.number] === key[q.number]).length;
  const wrong = known.filter(q => result.answers[q.number] && result.answers[q.number] !== key[q.number]).length;
  const blank = result.questions.filter(q => !result.answers[q.number]).length;
  document.getElementById("summary").textContent = `${result.config.paper.replace("paper", "Paper ")} · ${result.config.difficulty} · ${result.questions.length} questions`;
  document.getElementById("timeTaken").textContent = `Time taken: ${formatTime(Math.floor((result.finishedAt - result.startedAt) / 1000))}`;
  if (known.length) {
    const percentage = Math.round(correct / known.length * 100);
    document.getElementById("score").textContent = `${percentage}%`;
    document.getElementById("breakdown").textContent = `Correct: ${correct} · Wrong: ${wrong} · Blank: ${blank}`;
    document.getElementById("reviewMessage").textContent = "Marked questions are shown below.";
  } else {
    document.getElementById("score").textContent = "No answer key yet";
    document.getElementById("breakdown").textContent = `Answered: ${result.questions.length - blank} · Blank: ${blank}`;
    document.getElementById("reviewMessage").textContent = "Add answers/paperX.json to enable marking. Example: { \"3\": \"B\", \"7\": \"D\" }.";
  }
  document.getElementById("review").innerHTML = result.questions.map(q => {
    const your = result.answers[q.number] || "Blank";
    const correctAnswer = key[q.number] || "Not set";
    const state = !key[q.number] ? "" : your === correctAnswer ? "correct" : "wrong";
    return `<div class="review-row ${state}"><strong>Question ${q.number}</strong><span>Your answer: ${your}</span><span>Correct: ${correctAnswer}</span></div>`;
  }).join("");
}
showResults();
