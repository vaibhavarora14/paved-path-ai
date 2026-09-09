const form = document.querySelector("#review-form");
const emptyState = document.querySelector("#empty-state");
const result = document.querySelector("#result");
const decision = document.querySelector("#decision");
const checks = document.querySelector("#checks");
const guidance = document.querySelector("#guidance");
const resultTime = document.querySelector("#result-time");
const history = document.querySelector("#history");

const storageKey = "paved-path-session";
const sessionId = localStorage.getItem(storageKey) || crypto.randomUUID();
localStorage.setItem(storageKey, sessionId);

function headers() {
  return { "content-type": "application/json", "x-session-id": sessionId };
}

function showReview(review) {
  emptyState.hidden = true;
  result.hidden = false;
  decision.textContent = review.decision.replace("-", " ");
  decision.className = `decision ${review.decision}`;
  resultTime.textContent = new Date(review.createdAt).toLocaleString();
  guidance.textContent = review.guidance;
  checks.replaceChildren();

  if (!review.checks.length) {
    const item = document.createElement("div");
    item.className = "check";
    item.textContent = "✓ Deterministic checks passed";
    checks.append(item);
  } else {
    review.checks.forEach((check) => {
      const item = document.createElement("div");
      item.className = "check";
      const label = document.createElement("strong");
      label.textContent = check.severity;
      item.append(label, document.createTextNode(check.message));
      checks.append(item);
    });
  }
}

function showHistory(entries) {
  history.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No reviews in this session yet.";
    history.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "history-card";
    const state = document.createElement("span");
    state.textContent = entry.decision;
    const title = document.createElement("h3");
    title.textContent = entry.request.summary.slice(0, 120);
    const date = document.createElement("p");
    date.textContent = new Date(entry.createdAt).toLocaleString();
    card.append(state, title, date);
    card.addEventListener("click", () => showReview(entry));
    history.append(card);
  });
}

async function loadHistory() {
  try {
    const response = await fetch("/api/history", { headers: headers() });
    if (!response.ok) return;
    showHistory((await response.json()).history);
  } catch {
    // The form remains usable even when history is temporarily unavailable.
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  submit.firstElementChild.textContent = "Reviewing at the edge…";

  const data = new FormData(form);
  const payload = {
    summary: data.get("summary"),
    riskLevel: data.get("riskLevel"),
    touchesProduction: data.get("touchesProduction") === "on",
    tests: data.get("tests"),
    rollbackPlan: data.get("rollbackPlan"),
    dataClassification: data.get("dataClassification"),
  };

  try {
    const response = await fetch("/api/review", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Review failed");
    showReview(body);
    await loadHistory();
  } catch (error) {
    emptyState.hidden = true;
    result.hidden = false;
    decision.textContent = "retry";
    decision.className = "decision blocked";
    checks.replaceChildren();
    guidance.textContent = error instanceof Error ? error.message : "Review failed";
    resultTime.textContent = "";
  } finally {
    submit.disabled = false;
    submit.firstElementChild.textContent = "Run guarded review";
  }
});

loadHistory();
