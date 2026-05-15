importScripts("tasks.js");

const AUTO_GROUP_KEY = "autoGroup";
const TAB_GROUP_ID_NONE = -1;

let rulesLoaded = false;
let autoGroupCache = null;

async function ensureRulesLoaded() {
  if (!rulesLoaded) {
    await loadCustomRules();
    rulesLoaded = true;
  }
}

async function getAutoGroupEnabled() {
  if (autoGroupCache === null) {
    const data = await chrome.storage.sync.get(AUTO_GROUP_KEY);
    autoGroupCache = data[AUTO_GROUP_KEY] !== false; // default ON
  }
  return autoGroupCache;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.customRules) rulesLoaded = false;
  if (changes[AUTO_GROUP_KEY]) {
    autoGroupCache = changes[AUTO_GROUP_KEY].newValue !== false;
  }
});

// Per-window mutex so concurrent tab events don't create duplicate groups.
const windowLocks = new Map();
function withWindowLock(windowId, fn) {
  const prev = windowLocks.get(windowId) || Promise.resolve();
  const next = prev.then(fn, fn).catch(() => {});
  windowLocks.set(windowId, next);
  return next;
}

function isAutoGroupableTab(tab) {
  if (!tab || !tab.url) return false;
  if (tab.url.startsWith("chrome://")) return false;
  if (tab.url.startsWith("chrome-extension://")) return false;
  if (tab.url.startsWith("edge://")) return false;
  if (tab.url.startsWith("about:")) return false;
  if (tab.pinned) return false;
  return true;
}

async function autoGroupTab(tab) {
  if (!(await getAutoGroupEnabled())) return;
  if (!isAutoGroupableTab(tab)) return;

  await ensureRulesLoaded();
  const task = detectTask(tab);
  if (task === OTHER_TASK) return;

  await withWindowLock(tab.windowId, async () => {
    let current;
    try {
      current = await chrome.tabs.get(tab.id);
    } catch {
      return; // tab closed
    }

    // Leave grouped tabs alone — only touch ungrouped ones, so we never
    // override a manual group the user set up.
    if (current.groupId !== TAB_GROUP_ID_NONE) return;

    const desiredTitle = `${task.emoji} ${task.name}`;
    const color = normalizeGroupColor(task.color);

    const groups = await chrome.tabGroups.query({ windowId: current.windowId });
    const existing = groups.find((g) => g.title === desiredTitle);

    if (existing) {
      await chrome.tabs.group({ groupId: existing.id, tabIds: [current.id] });
    } else {
      const groupId = await chrome.tabs.group({ tabIds: [current.id] });
      await chrome.tabGroups.update(groupId, {
        title: desiredTitle,
        color,
        collapsed: false,
      });
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return; // only react when the URL itself changes
  autoGroupTab(tab);
});
