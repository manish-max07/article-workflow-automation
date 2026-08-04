// Your n8n production webhook URL
const WEBHOOK_URL = "https://manishmax.app.n8n.cloud/webhook/generate-article";

const form = document.getElementById("assignmentForm");
const topicInput = document.getElementById("topic");
const topicError = document.getElementById("topicError");
const wordCountSelect = document.getElementById("wordCount");
const toneSelect = document.getElementById("tone");
const audienceSelect = document.getElementById("audience");
const languageSelect = document.getElementById("language");
const generateBtn = document.getElementById("generateBtn");
const recentList = document.getElementById("recentList");
const topicCounter = document.getElementById("topicCounter");
const dispatchPanel = document.querySelector(".dispatch-panel");
const statusLive = document.getElementById("statusLive");
const errorLive = document.getElementById("errorLive");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const retryBtn = document.getElementById("retryBtn");
const articleState = document.getElementById("articleState");
const articleTopic = document.getElementById("articleTopic");
const articleWordCount = document.getElementById("articleWordCount");
const articleGeneratedTime = document.getElementById("articleGeneratedTime");
const articleBody = document.getElementById("articleBody");
const articleActions = document.getElementById("articleActions");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

const recentTopics = [];
let currentArticle = "";
let currentTopic = "";
let revealTimers = [];

const DEFAULT_FORM_VALUES = {
  wordCount: "500",
  tone: "professional",
  audience: "general",
  language: "english"
};

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markdownToHtml(markdown) {
  const safe = escapeHtml((markdown || "").trim());

  if (!safe) {
    return "<p>No article returned.</p>";
  }

  const formatInline = (text) => text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  return safe
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();

      if (!trimmed) {
        return "";
      }

      if (trimmed.startsWith("## ")) {
        return `<h2>${formatInline(trimmed.slice(3))}</h2>`;
      }

      return `<p>${formatInline(trimmed).replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("");
}

function updateTopicCounter() {
  const raw = topicInput.value.trim();
  const words = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
  const characters = raw.length;
  topicCounter.textContent = `${words} words • ${characters} characters`;
}

function clearTopicError() {
  topicError.textContent = "";
  topicError.hidden = true;
  topicInput.removeAttribute("aria-invalid");
}

function showTopicError(message) {
  topicError.textContent = message;
  topicError.hidden = false;
  topicInput.setAttribute("aria-invalid", "true");
}

function setPanelState(state) {
  emptyState.hidden = state !== "empty";
  loadingState.hidden = state !== "loading";
  errorState.hidden = state !== "error";
  articleState.hidden = state !== "article";
  dispatchPanel.setAttribute("aria-busy", state === "loading" ? "true" : "false");
}

function clearRevealTimers() {
  while (revealTimers.length) {
    window.clearTimeout(revealTimers.pop());
  }
}

function announceStatus(message) {
  statusLive.textContent = message;
}

function announceError(message) {
  errorLive.textContent = message;
}

function renderRecentTopics() {
  recentList.innerHTML = "";

  if (!recentTopics.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "mono-note";
    emptyItem.textContent = "No recent topics yet.";
    recentList.appendChild(emptyItem);
    return;
  }

  recentTopics.forEach((topic) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-item";
    button.dataset.topic = topic;
    button.innerHTML = `<span class="recent-topic">${escapeHtml(topic)}</span><span class="recent-tag">Reuse</span>`;
    button.addEventListener("click", () => {
      topicInput.value = topic;
      updateTopicCounter();
      topicInput.focus();
      announceStatus(`Topic refilled with ${topic}.`);
    });
    item.appendChild(button);
    recentList.appendChild(item);
  });
}

function rememberTopic(topic) {
  const existingIndex = recentTopics.indexOf(topic);
  if (existingIndex !== -1) {
    recentTopics.splice(existingIndex, 1);
  }

  recentTopics.unshift(topic);
  recentTopics.splice(5);
  renderRecentTopics();
}

function updateActionButtons(hasArticle) {
  articleActions.hidden = !hasArticle;
  copyBtn.disabled = !hasArticle;
  downloadBtn.disabled = !hasArticle;
}

function formatDateline() {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date()).toUpperCase();
}

function showEmptyState() {
  clearRevealTimers();
  currentArticle = "";
  updateActionButtons(false);
  setPanelState("empty");
  announceStatus("Your article will appear here.");
}

function showLoadingState(topic) {
  clearRevealTimers();
  setPanelState("loading");
  announceStatus(`Generating your article for ${topic}.`);
}

function showErrorState(message) {
  clearRevealTimers();
  errorMessage.textContent = message;
  setPanelState("error");
  announceError(message);
}

function showArticleState(topic, article) {
  clearRevealTimers();
  currentTopic = topic;
  currentArticle = article;
  articleTopic.textContent = topic;
  articleWordCount.textContent = `${article.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length} words`;
  articleGeneratedTime.textContent = `Generated just now`;
  articleBody.innerHTML = markdownToHtml(article);
  updateActionButtons(true);
  setPanelState("article");

  articleState.classList.remove("is-visible");
  void articleState.offsetWidth;

  revealTimers.push(window.setTimeout(() => {
    articleState.hidden = false;
    articleState.classList.add("is-visible");
  }, 160));

  announceStatus(`Your article is ready for ${topic}.`);
}

async function copyArticle() {
  if (!currentArticle) {
    return;
  }

  await navigator.clipboard.writeText(currentArticle);
  announceStatus("Article copied to clipboard.");
}

function downloadArticle() {
  if (!currentArticle) {
    return;
  }

  const slug = currentTopic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "draftwire-article";

  const fileName = `${slug}.txt`;
  const blob = new Blob([
    `${currentTopic}\nGenerated just now\n\n${currentArticle}`
  ], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  announceStatus("Article downloaded as text.");
}

async function generateArticle() {
  const topic = topicInput.value.trim();

  if (!topic) {
    showTopicError("Topic is required.");
    topicInput.focus();
    return;
  }

  clearTopicError();

  const submittedValues = {
    wordCount: wordCountSelect.value || DEFAULT_FORM_VALUES.wordCount,
    tone: toneSelect.value,
    audience: audienceSelect.value,
    language: languageSelect.value
  };

  const payload = {
    topic,
    wordCount: submittedValues.wordCount || DEFAULT_FORM_VALUES.wordCount,
    tone: submittedValues.tone || DEFAULT_FORM_VALUES.tone,
    audience: submittedValues.audience || DEFAULT_FORM_VALUES.audience,
    language: submittedValues.language || DEFAULT_FORM_VALUES.language
  };

  console.log("Article Generator options", payload);

  generateBtn.disabled = true;
  showLoadingState(topic);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    const article = data.article || "No article returned.";
    rememberTopic(topic);
    showArticleState(topic, article);
  } catch (error) {
    showErrorState(`Something went wrong: ${error.message}`);
  } finally {
    generateBtn.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generateArticle();
});

topicInput.addEventListener("input", updateTopicCounter);
topicInput.addEventListener("input", clearTopicError);

topicInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    generateArticle();
  }
});

retryBtn.addEventListener("click", () => {
  generateArticle();
});

copyBtn.addEventListener("click", () => {
  copyArticle().catch((error) => {
    showErrorState(`Unable to copy article: ${error.message}`);
  });
});

downloadBtn.addEventListener("click", downloadArticle);

updateTopicCounter();
renderRecentTopics();
showEmptyState();