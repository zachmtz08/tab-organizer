importScripts("tasks.js");

const AUTO_GROUP_KEY = "autoGroup";
const STALE_DAYS_KEY = "staleThresholdDays";
const TAB_ACCESS_KEY = "tabAccess";
const DEFAULT_STALE_DAYS = 7;
const TAB_GROUP_ID_NONE = -1;
const BADGE_ALARM = "stale-badge-refresh";

let rulesLoaded = false;
let autoGroupCache = null;
let staleDaysCache = null;

async function ensureRulesLoaded() {
  if (!rulesLoaded) {
    await loadCustomRules();
    await loadActiveGroups();
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

async function getStaleDays() {
  if (staleDaysCache === null) {
    const data = await chrome.storage.sync.get(STALE_DAYS_KEY);
    const v = data[STALE_DAYS_KEY];
    staleDaysCache = Number.isInteger(v) && v > 0 ? v : DEFAULT_STALE_DAYS;
  }
  return staleDaysCache;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.customRules || changes.activeGroups) rulesLoaded = false;
  if (changes[AUTO_GROUP_KEY]) {
    autoGroupCache = changes[AUTO_GROUP_KEY].newValue !== false;
  }
  if (changes[STALE_DAYS_KEY]) {
    const v = changes[STALE_DAYS_KEY].newValue;
    staleDaysCache = Number.isInteger(v) && v > 0 ? v : DEFAULT_STALE_DAYS;
    updateBadge();
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
  const desiredTitle = `${task.emoji} ${task.name}`;
  const color = normalizeGroupColor(task.color);

  await withWindowLock(tab.windowId, async () => {
    let current;
    try {
      current = await chrome.tabs.get(tab.id);
    } catch {
      return; // tab closed
    }

    if (current.groupId !== TAB_GROUP_ID_NONE) {
      // Already grouped. Only move it if it's in one of OUR groups and
      // belongs somewhere else now. Manual groups are left alone.
      let currentGroup;
      try {
        currentGroup = await chrome.tabGroups.get(current.groupId);
      } catch {
        return;
      }
      const owned = knownGroupTitles();
      if (!owned.has(currentGroup.title)) return; // manual group, hands off
      if (currentGroup.title === desiredTitle) return; // already correct
      // Else: fall through and re-group into the right slot.
    }

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
  // React to URL navigation, and also to load completion for tabs that
  // never fired a url change (e.g. session restores, prerendered).
  if (changeInfo.url || changeInfo.status === "complete") {
    autoGroupTab(tab);
  }
});

// ─── Stale tab tracking ───────────────────────────────────────────────────────
// Access timestamps live in chrome.storage.session: in-memory, survives SW
// evictions, dies with the browser session (which is fine — tab IDs die with
// the session too).

let writeChain = Promise.resolve();
function serialize(fn) {
  const next = writeChain.then(fn, fn).catch(() => {});
  writeChain = next;
  return next;
}

async function getAccessMap() {
  const data = await chrome.storage.session.get(TAB_ACCESS_KEY);
  return data[TAB_ACCESS_KEY] || {};
}

async function setAccessMap(map) {
  await chrome.storage.session.set({ [TAB_ACCESS_KEY]: map });
}

function recordAccess(tabId, when = Date.now()) {
  return serialize(async () => {
    const map = await getAccessMap();
    map[tabId] = when;
    await setAccessMap(map);
  });
}

function clearAccess(tabId) {
  return serialize(async () => {
    const map = await getAccessMap();
    if (tabId in map) {
      delete map[tabId];
      await setAccessMap(map);
    }
  });
}

async function sweepAccess() {
  return serialize(async () => {
    const map = await getAccessMap();
    const tabs = await chrome.tabs.query({});
    const validIds = new Set(tabs.map((t) => String(t.id)));
    const now = Date.now();
    let changed = false;

    for (const id of Object.keys(map)) {
      if (!validIds.has(id)) {
        delete map[id];
        changed = true;
      }
    }
    for (const tab of tabs) {
      if (!(tab.id in map)) {
        map[tab.id] = typeof tab.lastAccessed === "number" ? tab.lastAccessed : now;
        changed = true;
      }
    }
    if (changed) await setAccessMap(map);
  });
}

function isStaleCandidate(tab) {
  if (!tab.url) return false;
  if (tab.active) return false;
  if (tab.pinned) return false;
  if (tab.url.startsWith("chrome://")) return false;
  if (tab.url.startsWith("chrome-extension://")) return false;
  if (tab.url.startsWith("edge://")) return false;
  if (tab.url.startsWith("about:")) return false;
  return true;
}

async function countStaleTabs() {
  const [map, tabs, days] = await Promise.all([
    getAccessMap(),
    chrome.tabs.query({}),
    getStaleDays(),
  ]);
  const cutoff = Date.now() - days * 86400000;
  let count = 0;
  for (const tab of tabs) {
    if (!isStaleCandidate(tab)) continue;
    const last = map[tab.id];
    if (typeof last === "number" && last < cutoff) count++;
  }
  return count;
}

async function updateBadge() {
  const count = await countStaleTabs();
  if (count > 0) {
    await chrome.action.setBadgeText({ text: String(count) });
    await chrome.action.setBadgeBackgroundColor({ color: "#c83232" });
  } else {
    await chrome.action.setBadgeText({ text: "" });
  }
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  recordAccess(tabId);
});

chrome.tabs.onCreated.addListener((tab) => {
  recordAccess(tab.id);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await clearAccess(tabId);
  await updateBadge();
});

async function bootstrap() {
  await sweepAccess();
  await updateBadge();
  await chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 30 });
}

chrome.runtime.onStartup.addListener(bootstrap);
chrome.runtime.onInstalled.addListener(bootstrap);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BADGE_ALARM) updateBadge();
});
