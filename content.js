(() => {
  const HOST_CLASS = "tabsorg-mob-host";
  let host = null;
  let selected = [];

  function ensureHost() {
    if (host && document.body && document.body.contains(host)) return host;
    if (!document.body) return null;
    host = document.createElement("div");
    host.className = HOST_CLASS;
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
    return host;
  }

  function render() {
    if (!selected.length) {
      if (host && host.parentNode) host.remove();
      host = null;
      return;
    }
    const root = ensureHost();
    if (!root) return;
    root.textContent = "";
    selected.forEach((id) => {
      const mob = MOBS.find((m) => m.id === id);
      if (!mob) return;
      const wrap = document.createElement("div");
      wrap.className = `tabsorg-mob tabsorg-mob-${mob.id}`;
      wrap.innerHTML = mobSVG(mob);
      root.appendChild(wrap);
    });
  }

  async function load() {
    const data = await chrome.storage.sync.get("selectedMobs");
    selected = Array.isArray(data.selectedMobs) ? data.selectedMobs : [];
    render();
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes.selectedMobs) return;
    selected = Array.isArray(changes.selectedMobs.newValue)
      ? changes.selectedMobs.newValue
      : [];
    render();
  });

  load();
})();
