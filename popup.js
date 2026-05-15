let allTabs = [];
let groupMode = false;
let sessionsMode = false;

const container = document.getElementById("tabs-container");
const sessionsContainer = document.getElementById("sessions-container");
const searchInput = document.getElementById("search");
const tabCountEl = document.getElementById("tab-count");
const btnGroup = document.getElementById("btn-group");
const btnApply = document.getElementById("btn-apply-groups");
const btnDuplicates = document.getElementById("btn-duplicates");
const btnSaveSession = document.getElementById("btn-save-session");
const btnSessions = document.getElementById("btn-sessions");
const saveForm = document.getElementById("save-form");
const sessionNameInput = document.getElementById("session-name");
const btnSaveConfirm = document.getElementById("btn-save-confirm");
const btnSaveCancel = document.getElementById("btn-save-cancel");

// ─── Task detection ───────────────────────────────────────────────────────────

const TASKS = [
  {
    name: "Development",
    color: "blue",
    emoji: "💻",
    patterns: [
      /github\.com/, /gitlab\.com/, /bitbucket\.org/, /stackoverflow\.com/,
      /npmjs\.com/, /developer\.mozilla\.org/, /localhost/, /127\.0\.0\.1/,
      /codepen\.io/, /codesandbox\.io/, /replit\.com/, /vercel\.app/,
      /netlify\.app/, /heroku\.com/, /docs\.(python|ruby|rust|go|php)\.org/,
      /jsfiddle\.net/, /devdocs\.io/, /crates\.io/, /pkg\.go\.dev/,
    ],
  },
  {
    name: "Social",
    color: "pink",
    emoji: "💬",
    patterns: [
      /twitter\.com/, /x\.com/, /facebook\.com/, /instagram\.com/,
      /linkedin\.com/, /reddit\.com/, /tiktok\.com/, /snapchat\.com/,
      /discord\.com/, /threads\.net/, /mastodon\./, /bluesky\.social/,
    ],
  },
  {
    name: "Shopping",
    color: "green",
    emoji: "🛒",
    patterns: [
      /amazon\.com/, /ebay\.com/, /etsy\.com/, /walmart\.com/,
      /target\.com/, /bestbuy\.com/, /shopify\.com/, /shop\.app/,
      /aliexpress\.com/, /newegg\.com/, /wayfair\.com/, /chewy\.com/,
    ],
  },
  {
    name: "Entertainment",
    color: "red",
    emoji: "🎬",
    patterns: [
      /youtube\.com/, /netflix\.com/, /twitch\.tv/, /hulu\.com/,
      /disneyplus\.com/, /spotify\.com/, /soundcloud\.com/, /vimeo\.com/,
      /peacocktv\.com/, /hbomax\.com/, /max\.com/, /primevideo\.com/,
      /crunchyroll\.com/, /funimation\.com/,
    ],
  },
  {
    name: "News",
    color: "orange",
    emoji: "📰",
    patterns: [
      /cnn\.com/, /bbc\.com/, /bbc\.co\.uk/, /nytimes\.com/,
      /theguardian\.com/, /washingtonpost\.com/, /reuters\.com/,
      /techcrunch\.com/, /theverge\.com/, /wired\.com/, /arstechnica\.com/,
      /apnews\.com/, /foxnews\.com/, /nbcnews\.com/, /forbes\.com/,
      /bloomberg\.com/, /wsj\.com/, /axios\.com/, /politico\.com/,
    ],
  },
  {
    name: "Productivity",
    color: "teal",
    emoji: "📋",
    patterns: [
      /docs\.google\.com/, /sheets\.google\.com/, /slides\.google\.com/,
      /notion\.so/, /trello\.com/, /asana\.com/, /monday\.com/,
      /jira\.atlassian\.com/, /confluence\.atlassian\.com/,
      /slack\.com/, /teams\.microsoft\.com/, /zoom\.us/,
      /airtable\.com/, /clickup\.com/, /linear\.app/, /figma\.com/,
      /canva\.com/, /miro\.com/, /loom\.com/,
    ],
  },
  {
    name: "Research",
    color: "purple",
    emoji: "🔍",
    patterns: [
      /google\.com\/search/, /bing\.com\/search/, /duckduckgo\.com/,
      /wikipedia\.org/, /scholar\.google\.com/, /pubmed\.ncbi/, /arxiv\.org/,
      /jstor\.org/, /semanticscholar\.org/, /wolframalpha\.com/,
      /quora\.com/, /medium\.com/, /substack\.com/,
    ],
  },
  {
    name: "AI Tools",
    color: "cyan",
    emoji: "🤖",
    patterns: [
      /claude\.ai/, /chat\.openai\.com/, /chatgpt\.com/, /gemini\.google\.com/,
      /copilot\.microsoft\.com/, /perplexity\.ai/, /poe\.com/,
      /huggingface\.co/, /replicate\.com/, /midjourney\.com/,
      /elevenlabs\.io/, /runway\.ml/,
    ],
  },
];

const OTHER_TASK = { name: "Other", color: "grey", emoji: "🌐" };

function detectTask(tab) {
  const url = (tab.url || "").toLowerCase();
  const title = (tab.title || "").toLowerCase();
  for (const task of TASKS) {
    if (task.patterns.some((p) => p.test(url) || p.test(title))) {
      return task;
    }
  }
  return OTHER_TASK;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getQuery() {
  return searchInput.value.trim().toLowerCase();
}

function filterTabs(tabs) {
  const q = getQuery();
  if (!q) return tabs;
  return tabs.filter(
    (t) =>
      (t.title || "").toLowerCase().includes(q) ||
      (t.url || "").toLowerCase().includes(q)
  );
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getFaviconUrl(tab) {
  if (tab.favIconUrl && !tab.favIconUrl.startsWith("chrome://")) {
    return tab.favIconUrl;
  }
  try {
    return `${new URL(tab.url).origin}/favicon.ico`;
  } catch {
    return null;
  }
}

function makePlaceholder() {
  const el = document.createElement("div");
  el.className = "tab-favicon-placeholder";
  return el;
}

// ─── Tab element ──────────────────────────────────────────────────────────────

function createTabEl(tab) {
  const item = document.createElement("div");
  item.className = "tab-item" + (tab.active ? " active-tab" : "");

  const faviconUrl = getFaviconUrl(tab);
  let faviconEl;
  if (faviconUrl) {
    faviconEl = document.createElement("img");
    faviconEl.className = "tab-favicon";
    faviconEl.src = faviconUrl;
    faviconEl.onerror = () => faviconEl.replaceWith(makePlaceholder());
  } else {
    faviconEl = makePlaceholder();
  }

  const info = document.createElement("div");
  info.className = "tab-info";

  const titleEl = document.createElement("div");
  titleEl.className = "tab-title";
  titleEl.textContent = tab.title || tab.url;

  const urlEl = document.createElement("div");
  urlEl.className = "tab-url";
  urlEl.textContent = getDomain(tab.url);

  info.appendChild(titleEl);
  info.appendChild(urlEl);

  const closeBtn = document.createElement("button");
  closeBtn.className = "tab-close";
  closeBtn.textContent = "×";
  closeBtn.title = "Close tab";
  closeBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await chrome.tabs.remove(tab.id);
    allTabs = allTabs.filter((t) => t.id !== tab.id);
    tabCountEl.textContent = `${allTabs.length} tabs`;
    item.remove();
  });

  item.appendChild(faviconEl);
  item.appendChild(info);
  item.appendChild(closeBtn);

  item.addEventListener("click", () => {
    chrome.tabs.update(tab.id, { active: true });
    window.close();
  });

  return item;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderFlat(tabs) {
  tabs.forEach((tab) => container.appendChild(createTabEl(tab)));
}

function renderGrouped(tabs) {
  // Build task → tabs map, preserving TASKS order
  const taskMap = new Map();
  tabs.forEach((tab) => {
    const task = detectTask(tab);
    if (!taskMap.has(task.name)) taskMap.set(task.name, { task, tabs: [] });
    taskMap.get(task.name).tabs.push(tab);
  });

  // Sort: tasks with more tabs first; Other always last
  const entries = [...taskMap.values()].sort((a, b) => {
    if (a.task.name === "Other") return 1;
    if (b.task.name === "Other") return -1;
    return b.tabs.length - a.tabs.length;
  });

  entries.forEach(({ task, tabs: taskTabs }) => {
    const header = document.createElement("div");
    header.className = "group-header";
    header.dataset.color = task.color;

    const emoji = document.createElement("span");
    emoji.className = "group-emoji";
    emoji.textContent = task.emoji;

    const label = document.createElement("span");
    label.className = "group-label";
    label.textContent = task.name;

    const count = document.createElement("span");
    count.className = "group-count";
    count.textContent = taskTabs.length;

    header.appendChild(emoji);
    header.appendChild(label);
    header.appendChild(count);
    container.appendChild(header);

    taskTabs.forEach((tab) => container.appendChild(createTabEl(tab)));
  });
}

function render() {
  container.innerHTML = "";
  const filtered = filterTabs(allTabs);

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = getQuery() ? "No tabs match your search." : "No tabs open.";
    container.appendChild(empty);
    return;
  }

  groupMode ? renderGrouped(filtered) : renderFlat(filtered);
}

// ─── Apply Chrome Tab Groups ──────────────────────────────────────────────────

async function applyChromGroups() {
  btnApply.textContent = "Grouping…";
  btnApply.disabled = true;

  // Remove all existing groups in this window first
  const existingGroups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  for (const g of existingGroups) {
    // Ungroup tabs in this group so we start clean
    const groupedTabs = await chrome.tabs.query({ groupId: g.id });
    if (groupedTabs.length) {
      await chrome.tabs.ungroup(groupedTabs.map((t) => t.id));
    }
  }

  // Build task map
  const taskMap = new Map();
  allTabs.forEach((tab) => {
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) return;
    const task = detectTask(tab);
    if (!taskMap.has(task.name)) taskMap.set(task.name, { task, tabIds: [] });
    taskMap.get(task.name).tabIds.push(tab.id);
  });

  // Create a Chrome group per task
  for (const { task, tabIds } of taskMap.values()) {
    if (tabIds.length === 0) continue;
    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, {
      title: `${task.emoji} ${task.name}`,
      color: task.color,
      collapsed: false,
    });
  }

  btnApply.textContent = "Applied!";
  setTimeout(() => {
    btnApply.textContent = "Apply Groups";
    btnApply.disabled = false;
  }, 1800);

  loadTabs();
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

const SESSIONS_KEY = "sessions";

async function getSessions() {
  const data = await chrome.storage.local.get(SESSIONS_KEY);
  return Array.isArray(data[SESSIONS_KEY]) ? data[SESSIONS_KEY] : [];
}

async function setSessions(sessions) {
  await chrome.storage.local.set({ [SESSIONS_KEY]: sessions });
}

function isSaveableTab(tab) {
  if (!tab.url) return false;
  if (tab.url.startsWith("chrome://")) return false;
  if (tab.url.startsWith("chrome-extension://")) return false;
  if (tab.url === "about:blank") return false;
  return true;
}

async function saveSession(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const tabsToSave = allTabs.filter(isSaveableTab).map((t) => ({
    url: t.url,
    title: t.title || t.url,
    favIconUrl: t.favIconUrl || null,
  }));

  if (tabsToSave.length === 0) return false;

  const sessions = await getSessions();
  sessions.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    createdAt: Date.now(),
    tabs: tabsToSave,
  });
  await setSessions(sessions);
  return true;
}

async function restoreSession(id) {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === id);
  if (!session) return;
  await Promise.all(
    session.tabs.map((t) => chrome.tabs.create({ url: t.url, active: false }))
  );
}

async function deleteSession(id) {
  const sessions = await getSessions();
  await setSessions(sessions.filter((s) => s.id !== id));
}

function formatTimestamp(ts) {
  const diff = Date.now() - ts;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function createSessionEl(session) {
  const item = document.createElement("div");
  item.className = "session-item";

  const info = document.createElement("div");
  info.className = "session-info";

  const name = document.createElement("div");
  name.className = "session-name";
  name.textContent = session.name;

  const meta = document.createElement("div");
  meta.className = "session-meta";
  const tabWord = session.tabs.length === 1 ? "tab" : "tabs";
  meta.textContent = `${session.tabs.length} ${tabWord} · ${formatTimestamp(session.createdAt)}`;

  info.appendChild(name);
  info.appendChild(meta);

  const restoreBtn = document.createElement("button");
  restoreBtn.className = "session-restore";
  restoreBtn.textContent = "Restore";
  restoreBtn.title = "Open all tabs from this session";
  restoreBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    restoreBtn.textContent = "Opening…";
    restoreBtn.disabled = true;
    await restoreSession(session.id);
    window.close();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "session-delete";
  deleteBtn.textContent = "×";
  deleteBtn.title = "Delete this session";
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete session "${session.name}"?`)) return;
    await deleteSession(session.id);
    item.remove();
    renderSessionsIfEmpty();
  });

  item.appendChild(info);
  item.appendChild(restoreBtn);
  item.appendChild(deleteBtn);
  return item;
}

async function renderSessions() {
  sessionsContainer.innerHTML = "";
  const sessions = await getSessions();
  if (sessions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No saved sessions yet. Click 'Save Session' to capture your current tabs.";
    sessionsContainer.appendChild(empty);
    return;
  }
  sessions.forEach((s) => sessionsContainer.appendChild(createSessionEl(s)));
}

async function renderSessionsIfEmpty() {
  if (sessionsContainer.children.length === 0 || !sessionsContainer.querySelector(".session-item")) {
    await renderSessions();
  }
}

function setSessionsMode(on) {
  sessionsMode = on;
  btnSessions.classList.toggle("active", sessionsMode);
  container.classList.toggle("hidden", sessionsMode);
  sessionsContainer.classList.toggle("hidden", !sessionsMode);
  searchInput.disabled = sessionsMode;
  searchInput.placeholder = sessionsMode ? "Search disabled in Sessions view" : "Search tabs...";
  if (sessionsMode) renderSessions();
}

function openSaveForm() {
  saveForm.classList.remove("hidden");
  sessionNameInput.value = "";
  sessionNameInput.focus();
}

function closeSaveForm() {
  saveForm.classList.add("hidden");
}

async function handleSaveConfirm() {
  const name = sessionNameInput.value;
  const ok = await saveSession(name);
  if (!ok) {
    sessionNameInput.placeholder = "Need a name and at least one savable tab";
    sessionNameInput.value = "";
    return;
  }
  closeSaveForm();
  btnSaveSession.textContent = "Saved!";
  setTimeout(() => (btnSaveSession.textContent = "Save Session"), 1500);
  if (sessionsMode) renderSessions();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function loadTabs() {
  allTabs = await chrome.tabs.query({ currentWindow: true });
  tabCountEl.textContent = `${allTabs.length} tabs`;
  render();
}

btnGroup.addEventListener("click", () => {
  groupMode = !groupMode;
  btnGroup.classList.toggle("active", groupMode);
  render();
});

btnApply.addEventListener("click", applyChromGroups);

btnDuplicates.addEventListener("click", async () => {
  const seen = new Set();
  const toClose = [];
  allTabs.forEach((tab) => {
    const key = (tab.url || "").split("#")[0];
    if (seen.has(key)) toClose.push(tab.id);
    else seen.add(key);
  });

  if (toClose.length === 0) {
    btnDuplicates.textContent = "None found";
    setTimeout(() => (btnDuplicates.textContent = "Close Dupes"), 1500);
    return;
  }

  await chrome.tabs.remove(toClose);
  btnDuplicates.textContent = `Closed ${toClose.length}`;
  setTimeout(() => (btnDuplicates.textContent = "Close Dupes"), 1500);
  loadTabs();
});

btnSaveSession.addEventListener("click", openSaveForm);
btnSaveCancel.addEventListener("click", closeSaveForm);
btnSaveConfirm.addEventListener("click", handleSaveConfirm);
sessionNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSaveConfirm();
  else if (e.key === "Escape") closeSaveForm();
});

btnSessions.addEventListener("click", () => setSessionsMode(!sessionsMode));

searchInput.addEventListener("input", render);

loadTabs();
