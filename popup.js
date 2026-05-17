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
const btnSettings = document.getElementById("btn-settings");
const btnTheme = document.getElementById("btn-theme");
const btnParty = document.getElementById("btn-party");
const btnDance = document.getElementById("btn-dance");
const mobPicker = document.getElementById("mob-picker");
const mobGrid = document.getElementById("mob-grid");
const pickerCountEl = document.getElementById("picker-count");
const toolbar = document.querySelector(".toolbar");
const staleBanner = document.getElementById("stale-banner");
const staleBannerText = document.getElementById("stale-banner-text");
const btnStaleReview = document.getElementById("btn-stale-review");
const staleToolbar = document.getElementById("stale-toolbar");
const staleInfoCount = document.getElementById("stale-info-count");
const staleInfoSub = document.getElementById("stale-info-sub");
const btnStaleSaveClose = document.getElementById("btn-stale-save-close");
const btnStaleClose = document.getElementById("btn-stale-close");
const btnStaleBack = document.getElementById("btn-stale-back");

let staleMode = false;
let pickerMode = false;
let selectedMobs = [];
let tabAccessMap = {};
let staleThresholdDays = 7;

// ─── Task detection lives in tasks.js (shared with background.js) ────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getQuery() {
  return searchInput.value.trim().toLowerCase();
}

function filterTabs(tabs) {
  let result = tabs;
  if (staleMode) result = result.filter(isStaleTab);
  const q = getQuery();
  if (!q) return result;
  return result.filter(
    (t) =>
      (t.title || "").toLowerCase().includes(q) ||
      (t.url || "").toLowerCase().includes(q)
  );
}

function isStaleTab(tab) {
  if (tab.active) return false;
  if (tab.pinned) return false;
  if (!tab.url) return false;
  if (tab.url.startsWith("chrome://")) return false;
  if (tab.url.startsWith("chrome-extension://")) return false;
  if (tab.url === "about:blank") return false;
  const last = tabAccessMap[tab.id];
  if (typeof last !== "number") return false;
  return last < Date.now() - staleThresholdDays * 86400000;
}

function staleAgeLabel(tab) {
  const last = tabAccessMap[tab.id];
  if (typeof last !== "number") return "";
  const days = Math.floor((Date.now() - last) / 86400000);
  return `idle ${days}d`;
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
  if (!tab.url) return null;
  if (tab.url.startsWith("chrome://")) return null;
  if (tab.url.startsWith("chrome-extension://")) return null;
  if (tab.url.startsWith("about:")) return null;
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
  const domain = getDomain(tab.url);
  urlEl.textContent = staleMode ? `${domain} · ${staleAgeLabel(tab)}` : domain;

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
  updateStaleBanner();
  const filtered = filterTabs(allTabs);

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    if (staleMode) empty.textContent = "No stale tabs left. Nice work.";
    else if (getQuery()) empty.textContent = "No tabs match your search.";
    else empty.textContent = "No tabs open.";
    container.appendChild(empty);
    return;
  }

  groupMode ? renderGrouped(filtered) : renderFlat(filtered);
}

function updateStaleBanner() {
  if (sessionsMode || staleMode || pickerMode) {
    staleBanner.classList.add("hidden");
    return;
  }
  const stale = allTabs.filter(isStaleTab);
  if (stale.length === 0) {
    staleBanner.classList.add("hidden");
    return;
  }
  staleBanner.classList.remove("hidden");
  const word = stale.length === 1 ? "tab" : "tabs";
  staleBannerText.textContent = `⏰ ${stale.length} ${word} idle ${staleThresholdDays}+ days`;
}

function enterStaleMode() {
  if (sessionsMode) setSessionsMode(false);
  if (pickerMode) setPickerMode(false);
  staleMode = true;
  staleToolbar.classList.remove("hidden");
  const stale = allTabs.filter(isStaleTab);
  const word = stale.length === 1 ? "tab" : "tabs";
  staleInfoCount.textContent = `${stale.length} stale ${word}`;
  staleInfoSub.textContent = `Idle ${staleThresholdDays}+ days`;
  render();
}

function exitStaleMode() {
  staleMode = false;
  staleToolbar.classList.add("hidden");
  render();
}

async function saveAndCloseStale() {
  const stale = allTabs.filter(isStaleTab).filter(isSaveableTab);
  if (stale.length === 0) return;
  const sessions = await getSessions();
  sessions.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `Stale tabs · ${new Date().toLocaleDateString()}`,
    createdAt: Date.now(),
    tabs: stale.map((t) => ({
      url: t.url,
      title: t.title || t.url,
      favIconUrl: t.favIconUrl || null,
    })),
  });
  await setSessions(sessions);
  await chrome.tabs.remove(stale.map((t) => t.id));
  exitStaleMode();
  loadTabs();
}

async function justCloseStale() {
  const stale = allTabs.filter(isStaleTab);
  if (stale.length === 0) return;
  if (!confirm(`Close ${stale.length} stale tabs without saving?`)) return;
  await chrome.tabs.remove(stale.map((t) => t.id));
  exitStaleMode();
  loadTabs();
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
      color: normalizeGroupColor(task.color),
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
  if (on && staleMode) exitStaleMode();
  if (on && pickerMode) setPickerMode(false);
  sessionsMode = on;
  btnSessions.classList.toggle("active", sessionsMode);
  container.classList.toggle("hidden", sessionsMode);
  sessionsContainer.classList.toggle("hidden", !sessionsMode);
  searchInput.disabled = sessionsMode;
  searchInput.placeholder = sessionsMode ? "Search disabled in Sessions view" : "Search tabs...";
  updateStaleBanner();
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

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.customRules) {
    loadCustomRules().then(render);
  }
});

btnSettings.addEventListener("click", () => chrome.runtime.openOptionsPage());

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

async function loadTheme() {
  const data = await chrome.storage.sync.get("theme");
  applyTheme(data.theme === "light" ? "light" : "dark");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  btnTheme.textContent = theme === "light" ? "🌙" : "☀️";
  btnTheme.title = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
}

btnTheme.addEventListener("click", async () => {
  const current = document.documentElement.dataset.theme || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  await chrome.storage.sync.set({ theme: next });
});

async function loadMobs() {
  const data = await chrome.storage.sync.get(["selectedMobs", "danceMode"]);
  selectedMobs = Array.isArray(data.selectedMobs) ? data.selectedMobs : [];
  applyDanceUi(!!data.danceMode);
  renderMobGrid();
}

function applyDanceUi(on) {
  btnDance.classList.toggle("active", on);
  btnDance.querySelector(".dance-label").textContent = on ? "Stop the chaos" : "Dance Mode";
}

btnDance.addEventListener("click", async () => {
  const next = !btnDance.classList.contains("active");
  applyDanceUi(next);
  await chrome.storage.sync.set({ danceMode: next });
});

function renderMobGrid() {
  mobGrid.innerHTML = "";
  MOBS.forEach((mob) => {
    const isSelected = selectedMobs.includes(mob.id);
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "mob-tile" + (isSelected ? " selected" : "");
    tile.dataset.id = mob.id;
    tile.title = isSelected
      ? `${mob.name} — in use (tap to remove)`
      : `Pick ${mob.name}`;
    tile.innerHTML =
      `<div class="mob mob-${mob.id}">${mobSVG(mob)}</div>` +
      `<span class="mob-tile-name">${mob.name}</span>`;
    tile.addEventListener("click", () => toggleMob(mob.id));
    mobGrid.appendChild(tile);
  });
  pickerCountEl.textContent = `${selectedMobs.length} / ${MAX_MOBS}`;
  pickerCountEl.classList.toggle("at-max", selectedMobs.length >= MAX_MOBS);
}

async function toggleMob(id) {
  const idx = selectedMobs.indexOf(id);
  if (idx >= 0) {
    selectedMobs.splice(idx, 1);
  } else {
    if (selectedMobs.length >= MAX_MOBS) {
      pickerCountEl.classList.remove("flash");
      void pickerCountEl.offsetWidth;
      pickerCountEl.classList.add("flash");
      return;
    }
    selectedMobs.push(id);
  }
  await chrome.storage.sync.set({ selectedMobs });
  renderMobGrid();
}

function setPickerMode(on) {
  if (on && sessionsMode) setSessionsMode(false);
  if (on && staleMode) exitStaleMode();
  if (on) closeSaveForm();
  pickerMode = on;
  btnParty.classList.toggle("active", on);
  mobPicker.classList.toggle("hidden", !on);
  container.classList.toggle("hidden", on);
  toolbar.classList.toggle("hidden", on);
  updateStaleBanner();
  if (on) renderMobGrid();
}

btnParty.addEventListener("click", () => setPickerMode(!pickerMode));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.theme) {
    applyTheme(changes.theme.newValue === "light" ? "light" : "dark");
  }
});

btnStaleReview.addEventListener("click", enterStaleMode);
btnStaleBack.addEventListener("click", exitStaleMode);
btnStaleSaveClose.addEventListener("click", saveAndCloseStale);
btnStaleClose.addEventListener("click", justCloseStale);

searchInput.addEventListener("input", render);

async function loadStaleData() {
  const local = await chrome.storage.session.get("tabAccess");
  tabAccessMap = local.tabAccess || {};
  const sync = await chrome.storage.sync.get("staleThresholdDays");
  const v = sync.staleThresholdDays;
  staleThresholdDays = Number.isInteger(v) && v > 0 ? v : 7;
}

(async () => {
  await Promise.all([loadTheme(), loadMobs(), loadCustomRules(), loadStaleData()]);
  await loadTabs();
})();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.selectedMobs) {
    selectedMobs = Array.isArray(changes.selectedMobs.newValue)
      ? changes.selectedMobs.newValue
      : [];
    renderMobGrid();
  }
  if (changes.danceMode) {
    applyDanceUi(!!changes.danceMode.newValue);
  }
});
