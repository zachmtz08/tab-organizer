const KEY = "customRules";
const AUTO_GROUP_KEY = "autoGroup";
const STALE_DAYS_KEY = "staleThresholdDays";
const DEFAULT_STALE_DAYS = 7;
const COLORS = ["blue", "cyan", "green", "yellow", "orange", "red", "pink", "purple", "grey"];

const els = {
  pattern: document.getElementById("pattern"),
  name: document.getElementById("name"),
  color: document.getElementById("color"),
  emoji: document.getElementById("emoji"),
  add: document.getElementById("add"),
  error: document.getElementById("error"),
  list: document.getElementById("rules-list"),
  count: document.getElementById("rules-count"),
  autoGroup: document.getElementById("auto-group"),
  staleDays: document.getElementById("stale-days"),
  theme: document.getElementById("btn-theme-options"),
};

async function loadTheme() {
  const data = await chrome.storage.sync.get("theme");
  applyTheme(data.theme === "light" ? "light" : "dark");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.theme.textContent = theme === "light" ? "🌙" : "☀️";
}

els.theme.addEventListener("click", async () => {
  const current = document.documentElement.dataset.theme || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  await chrome.storage.sync.set({ theme: next });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.theme) {
    applyTheme(changes.theme.newValue === "light" ? "light" : "dark");
  }
});

async function getRules() {
  const data = await chrome.storage.sync.get(KEY);
  return Array.isArray(data[KEY]) ? data[KEY] : [];
}

async function setRules(rules) {
  await chrome.storage.sync.set({ [KEY]: rules });
}

function showError(msg) {
  els.error.textContent = msg;
  els.error.classList.remove("hidden");
}

function clearError() {
  els.error.textContent = "";
  els.error.classList.add("hidden");
}

function clearForm() {
  els.pattern.value = "";
  els.name.value = "";
  els.emoji.value = "";
  els.color.value = "grey";
  els.pattern.focus();
}

function makeRuleEl(rule) {
  const row = document.createElement("div");
  row.className = "rule";
  row.dataset.color = rule.color;

  const meta = document.createElement("div");
  meta.className = "rule-meta";
  const emoji = document.createElement("span");
  emoji.className = "rule-emoji";
  emoji.textContent = rule.emoji;
  const name = document.createElement("span");
  name.className = "rule-name";
  name.textContent = rule.name;
  meta.appendChild(emoji);
  meta.appendChild(name);

  const pattern = document.createElement("code");
  pattern.className = "rule-pattern";
  pattern.textContent = rule.pattern;

  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "Delete";
  del.addEventListener("click", async () => {
    if (!confirm(`Delete rule for "${rule.name}"?`)) return;
    const all = await getRules();
    await setRules(all.filter((r) => r.id !== rule.id));
    render();
  });

  row.appendChild(meta);
  row.appendChild(pattern);
  row.appendChild(del);
  return row;
}

async function render() {
  const rules = await getRules();
  els.count.textContent = `${rules.length} ${rules.length === 1 ? "rule" : "rules"}`;
  els.list.innerHTML = "";

  if (rules.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No custom rules yet. Add one above.";
    els.list.appendChild(empty);
    return;
  }

  rules.forEach((rule) => els.list.appendChild(makeRuleEl(rule)));
}

async function addRule() {
  clearError();
  const pattern = els.pattern.value.trim();
  const name = els.name.value.trim();
  const color = els.color.value;
  const emoji = els.emoji.value.trim() || "📌";

  if (!pattern) return showError("Pattern is required.");
  if (!name) return showError("Category name is required.");
  if (!COLORS.includes(color)) return showError("Pick a valid color.");

  try {
    new RegExp(pattern, "i");
  } catch (e) {
    return showError(`Invalid regex: ${e.message}`);
  }

  const rules = await getRules();
  rules.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pattern,
    name,
    color,
    emoji,
  });
  await setRules(rules);
  clearForm();
  render();
}

async function loadAutoGroup() {
  const data = await chrome.storage.sync.get(AUTO_GROUP_KEY);
  els.autoGroup.checked = data[AUTO_GROUP_KEY] !== false; // default ON
}

els.autoGroup.addEventListener("change", async () => {
  await chrome.storage.sync.set({ [AUTO_GROUP_KEY]: els.autoGroup.checked });
});

async function loadStaleDays() {
  const data = await chrome.storage.sync.get(STALE_DAYS_KEY);
  const v = data[STALE_DAYS_KEY];
  els.staleDays.value = Number.isInteger(v) && v > 0 ? v : DEFAULT_STALE_DAYS;
}

els.staleDays.addEventListener("change", async () => {
  const v = parseInt(els.staleDays.value, 10);
  if (!Number.isInteger(v) || v < 1) {
    els.staleDays.value = DEFAULT_STALE_DAYS;
    await chrome.storage.sync.set({ [STALE_DAYS_KEY]: DEFAULT_STALE_DAYS });
    return;
  }
  await chrome.storage.sync.set({ [STALE_DAYS_KEY]: v });
});

els.add.addEventListener("click", addRule);
[els.pattern, els.name, els.emoji].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addRule();
  });
});

loadTheme();
loadAutoGroup();
loadStaleDays();
render();
