const KEY = "customRules";
const AUTO_GROUP_KEY = "autoGroup";
const STALE_DAYS_KEY = "staleThresholdDays";
const DEFAULT_STALE_DAYS = 7;
const COLORS = ["blue", "cyan", "green", "yellow", "orange", "red", "pink", "purple", "grey"];

const els = {
  pattern: document.getElementById("pattern"),
  ruleGroup: document.getElementById("rule-group"),
  ruleRegex: document.getElementById("rule-regex"),
  add: document.getElementById("add"),
  error: document.getElementById("error"),
  list: document.getElementById("rules-list"),
  count: document.getElementById("rules-count"),
  groupName: document.getElementById("group-name"),
  groupColor: document.getElementById("group-color"),
  groupEmoji: document.getElementById("group-emoji"),
  addGroup: document.getElementById("btn-add-group"),
  groupsList: document.getElementById("groups-list"),
  groupsCount: document.getElementById("groups-count"),
  groupError: document.getElementById("group-error"),
  autoGroup: document.getElementById("auto-group"),
  staleDays: document.getElementById("stale-days"),
  theme: document.getElementById("btn-theme-options"),
  blockInput: document.getElementById("block-input"),
  blockAdd: document.getElementById("btn-add-block"),
  blockList: document.getElementById("block-list"),
  blockCount: document.getElementById("block-count"),
  activeGrid: document.getElementById("active-grid"),
  activeCount: document.getElementById("active-count"),
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
  els.ruleRegex.checked = false;
  els.pattern.focus();
}

function showGroupError(msg) {
  els.groupError.textContent = msg;
  els.groupError.classList.remove("hidden");
}

function clearGroupError() {
  els.groupError.textContent = "";
  els.groupError.classList.add("hidden");
}

function clearGroupForm() {
  els.groupName.value = "";
  els.groupEmoji.value = "";
  els.groupColor.value = "grey";
  els.groupName.focus();
}

async function getCustomGroupsList() {
  const data = await chrome.storage.sync.get("customGroups");
  return Array.isArray(data.customGroups) ? data.customGroups : [];
}

async function setCustomGroupsList(list) {
  await chrome.storage.sync.set({ customGroups: list });
}

function resolveRuleDisplay(rule, customGroupsList) {
  if (rule.groupName) {
    const custom = customGroupsList.find((g) => g.name === rule.groupName);
    if (custom) return custom;
    const builtin = BUILT_IN_TASKS.find((t) => t.name === rule.groupName);
    if (builtin) return { name: builtin.name, color: builtin.color, emoji: builtin.emoji };
    return { name: rule.groupName, color: "grey", emoji: "📌", orphaned: true };
  }
  if (rule.name) return { name: rule.name, color: rule.color, emoji: rule.emoji || "📌" };
  return { name: "?", color: "grey", emoji: "❓" };
}

async function populateRuleGroupDropdown() {
  const customGroupsList = await getCustomGroupsList();
  els.ruleGroup.innerHTML = "";

  const builtinOG = document.createElement("optgroup");
  builtinOG.label = "Built-in categories";
  BUILT_IN_TASKS.forEach((task) => {
    const opt = document.createElement("option");
    opt.value = task.name;
    opt.textContent = `${task.emoji} ${task.name}`;
    builtinOG.appendChild(opt);
  });
  els.ruleGroup.appendChild(builtinOG);

  if (customGroupsList.length > 0) {
    const customOG = document.createElement("optgroup");
    customOG.label = "Your groups";
    customGroupsList.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g.name;
      opt.textContent = `${g.emoji || "📌"} ${g.name}`;
      customOG.appendChild(opt);
    });
    els.ruleGroup.appendChild(customOG);
  }
}

function makeGroupEl(group, onDelete) {
  const row = document.createElement("div");
  row.className = "group-item";
  row.dataset.color = group.color;

  const meta = document.createElement("div");
  meta.className = "group-meta";
  const emoji = document.createElement("span");
  emoji.className = "group-item-emoji";
  emoji.textContent = group.emoji || "📌";
  const name = document.createElement("span");
  name.className = "group-item-name";
  name.textContent = group.name;
  meta.appendChild(emoji);
  meta.appendChild(name);

  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "Delete";
  del.addEventListener("click", onDelete);

  row.appendChild(meta);
  row.appendChild(del);
  return row;
}

async function renderGroups() {
  const list = await getCustomGroupsList();
  els.groupsCount.textContent = `${list.length} ${list.length === 1 ? "group" : "groups"}`;
  els.groupsList.innerHTML = "";
  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No custom groups yet. Add one above to use in rules.";
    els.groupsList.appendChild(empty);
  } else {
    list.forEach((g, idx) => {
      els.groupsList.appendChild(
        makeGroupEl(g, async () => {
          if (!confirm(`Delete group "${g.name}"? Rules referencing it will fall back to Other.`)) return;
          const all = await getCustomGroupsList();
          all.splice(idx, 1);
          await setCustomGroupsList(all);
          const activeData = await chrome.storage.sync.get("activeGroups");
          if (Array.isArray(activeData.activeGroups)) {
            const active = new Set(activeData.activeGroups);
            active.delete(g.name);
            await chrome.storage.sync.set({ activeGroups: Array.from(active) });
          }
          await populateRuleGroupDropdown();
          render();
          renderGroups();
          renderActiveGrid();
        })
      );
    });
  }
  await populateRuleGroupDropdown();
}

async function addGroup() {
  clearGroupError();
  const name = els.groupName.value.trim();
  const color = els.groupColor.value;
  const emoji = els.groupEmoji.value.trim() || "📌";

  if (!name) return showGroupError("Name is required.");
  if (!COLORS.includes(color)) return showGroupError("Pick a valid color.");

  const existing = await getCustomGroupsList();
  if (existing.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
    return showGroupError("A group with that name already exists.");
  }
  if (BUILT_IN_TASKS.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    return showGroupError("That name collides with a built-in category. Pick another.");
  }

  existing.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    color,
    emoji,
  });
  await setCustomGroupsList(existing);

  // If the active-groups list has been explicitly materialized, add this
  // new group so it doesn't silently start out disabled.
  const activeData = await chrome.storage.sync.get("activeGroups");
  if (Array.isArray(activeData.activeGroups)) {
    const active = new Set(activeData.activeGroups);
    active.add(name);
    await chrome.storage.sync.set({ activeGroups: Array.from(active) });
  }

  clearGroupForm();
  renderGroups();
  renderActiveGrid();
  render();
}

function makeRuleEl(rule, customGroupsList) {
  const info = resolveRuleDisplay(rule, customGroupsList);
  const row = document.createElement("div");
  row.className = "rule";
  row.dataset.color = info.color;

  const meta = document.createElement("div");
  meta.className = "rule-meta";
  const emoji = document.createElement("span");
  emoji.className = "rule-emoji";
  emoji.textContent = info.emoji;
  const name = document.createElement("span");
  name.className = "rule-name";
  name.textContent = info.name + (info.orphaned ? " (deleted)" : "");
  meta.appendChild(emoji);
  meta.appendChild(name);

  const pattern = document.createElement("code");
  pattern.className = "rule-pattern";
  pattern.textContent = rule.pattern;
  // Legacy rules without an explicit `match` were always regex — show that
  // so users can spot ones that may need to be re-added in "contains" mode.
  const mode = rule.match === "contains" ? "contains" : "regex";
  if (mode === "regex") {
    const badge = document.createElement("span");
    badge.className = "rule-mode-badge";
    badge.textContent = "regex";
    pattern.appendChild(badge);
  }

  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "Delete";
  del.addEventListener("click", async () => {
    if (!confirm(`Delete rule for "${info.name}"?`)) return;
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
  const [rules, customGroupsList] = await Promise.all([
    getRules(),
    getCustomGroupsList(),
  ]);
  els.count.textContent = `${rules.length} ${rules.length === 1 ? "rule" : "rules"}`;
  els.list.innerHTML = "";

  if (rules.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No custom rules yet. Add one above.";
    els.list.appendChild(empty);
    return;
  }

  rules.forEach((rule) => els.list.appendChild(makeRuleEl(rule, customGroupsList)));
}

async function addRule() {
  clearError();
  const pattern = els.pattern.value.trim();
  const groupName = els.ruleGroup.value;
  const useRegex = els.ruleRegex.checked;

  if (!pattern) return showError("Pattern is required.");
  if (!groupName) return showError("Pick a category.");

  if (useRegex) {
    try {
      new RegExp(pattern, "i");
    } catch (e) {
      return showError(`Invalid regex: ${e.message}`);
    }
  }

  const rules = await getRules();
  rules.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pattern,
    groupName,
    match: useRegex ? "regex" : "contains",
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
els.pattern.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addRule();
});

els.addGroup.addEventListener("click", addGroup);
[els.groupName, els.groupEmoji].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addGroup();
  });
});

async function getBlocklist() {
  const data = await chrome.storage.sync.get("mobBlocklist");
  return Array.isArray(data.mobBlocklist) ? data.mobBlocklist : [];
}

async function setBlocklist(list) {
  await chrome.storage.sync.set({ mobBlocklist: list });
}

function makeBlockEl(pattern, onDelete) {
  const row = document.createElement("div");
  row.className = "block-item";

  const code = document.createElement("code");
  code.className = "block-pattern";
  code.textContent = pattern;

  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "Remove";
  del.addEventListener("click", onDelete);

  row.appendChild(code);
  row.appendChild(del);
  return row;
}

async function renderBlocklist() {
  const list = await getBlocklist();
  els.blockCount.textContent = `${list.length} ${list.length === 1 ? "site" : "sites"}`;
  els.blockList.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "block-empty";
    empty.textContent = "Nothing blocked. Buddies appear everywhere.";
    els.blockList.appendChild(empty);
    return;
  }

  list.forEach((pattern, idx) => {
    els.blockList.appendChild(
      makeBlockEl(pattern, async () => {
        const current = await getBlocklist();
        current.splice(idx, 1);
        await setBlocklist(current);
        renderBlocklist();
      })
    );
  });
}

async function addBlockPattern() {
  const value = els.blockInput.value.trim();
  if (!value) return;
  const list = await getBlocklist();
  if (list.includes(value)) {
    els.blockInput.value = "";
    return;
  }
  list.push(value);
  await setBlocklist(list);
  els.blockInput.value = "";
  els.blockInput.focus();
  renderBlocklist();
}

els.blockAdd.addEventListener("click", addBlockPattern);
els.blockInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addBlockPattern();
});

async function setActiveGroupNames(set) {
  await chrome.storage.sync.set({ activeGroups: Array.from(set) });
}

async function renderActiveGrid() {
  const [active, customGroupsList] = await Promise.all([
    getActiveGroupNames(),
    getCustomGroupsList(),
  ]);
  els.activeGrid.innerHTML = "";

  const all = [
    ...BUILT_IN_TASKS.map((t) => ({ name: t.name, color: t.color, emoji: t.emoji, source: "built-in" })),
    ...customGroupsList.map((g) => ({ name: g.name, color: g.color, emoji: g.emoji || "📌", source: "custom" })),
  ];

  all.forEach((entry) => {
    const isActive = active.has(entry.name);
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "active-tile" + (isActive ? " selected" : "");
    tile.dataset.color = entry.color;
    tile.title = isActive
      ? `${entry.name} — in use (tap to disable)`
      : `Activate ${entry.name}`;
    const customBadge = entry.source === "custom" ? ' <span class="active-tile-badge">custom</span>' : "";
    tile.innerHTML =
      `<span class="active-tile-emoji">${entry.emoji}</span>` +
      `<span class="active-tile-name">${entry.name}${customBadge}</span>`;
    tile.addEventListener("click", async () => {
      const current = await getActiveGroupNames();
      if (current.has(entry.name)) current.delete(entry.name);
      else current.add(entry.name);
      await setActiveGroupNames(current);
      renderActiveGrid();
    });
    els.activeGrid.appendChild(tile);
  });

  els.activeCount.textContent = `${active.size} / ${all.length} active`;
}

async function getActiveGroupNames() {
  const data = await chrome.storage.sync.get("activeGroups");
  if (Array.isArray(data.activeGroups)) return new Set(data.activeGroups);
  const customGroupsList = await getCustomGroupsList();
  return new Set([
    ...BUILT_IN_TASKS.map((t) => t.name),
    ...customGroupsList.map((g) => g.name),
  ]);
}

loadTheme();
loadAutoGroup();
loadStaleDays();
renderBlocklist();
renderActiveGrid();
renderGroups();
render();
