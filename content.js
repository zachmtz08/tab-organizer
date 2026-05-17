(() => {
  const HOST_CLASS = "tabsorg-mob-host";
  let host = null;
  let selected = [];
  let blocklist = [];

  function matchesPattern(hostname, pattern) {
    if (!pattern) return false;
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const re = new RegExp("^" + escaped + "$", "i");
    return re.test(hostname);
  }

  function isBlocked() {
    if (!blocklist.length) return false;
    const hostname = location.hostname;
    return blocklist.some((p) => matchesPattern(hostname, p));
  }

  function ensureHost() {
    if (host && document.body && document.body.contains(host)) return host;
    if (!document.body) return null;
    host = document.createElement("div");
    host.className = HOST_CLASS;
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
    return host;
  }

  function clearHost() {
    if (host && host.parentNode) host.remove();
    host = null;
  }

  function makeDraggable(el) {
    let dragX = 0;
    let dragY = 0;
    let vy = 0;
    let lastX = 0;
    let lastY = 0;
    let startMouseX = 0;
    let startMouseY = 0;
    let startDragX = 0;
    let startDragY = 0;
    let isDragging = false;
    let rafId = null;
    let lastT = 0;
    const GRAVITY = 380;
    const BOUNCE = 0.32;
    const MIN_BOUNCE_V = 60;

    function apply() {
      el.style.transform = `translate(${dragX}px, ${dragY}px)`;
    }

    function stopFall() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function tick(now) {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      vy += GRAVITY * dt;
      dragY += vy * dt;
      if (dragY >= 0) {
        if (Math.abs(vy) > MIN_BOUNCE_V) {
          dragY = 0;
          vy = -vy * BOUNCE;
        } else {
          dragY = 0;
          vy = 0;
          apply();
          rafId = null;
          return;
        }
      }
      apply();
      rafId = requestAnimationFrame(tick);
    }

    function startFall() {
      lastT = performance.now();
      stopFall();
      rafId = requestAnimationFrame(tick);
    }

    function onPointerDown(e) {
      stopFall();
      isDragging = true;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startDragX = dragX;
      startDragY = dragY;
      lastX = e.clientX;
      lastY = e.clientY;
      el.classList.add("tabsorg-dragging");
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      dragX = startDragX + (e.clientX - startMouseX);
      dragY = Math.min(0, startDragY + (e.clientY - startMouseY));
      lastX = e.clientX;
      lastY = e.clientY;
      apply();
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove("tabsorg-dragging");
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (_) {}
      vy = 0;
      startFall();
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("dragstart", (e) => e.preventDefault());
  }

  function render() {
    if (!selected.length || isBlocked()) {
      clearHost();
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
      makeDraggable(wrap);
      root.appendChild(wrap);
    });
  }

  async function load() {
    const data = await chrome.storage.sync.get(["selectedMobs", "mobBlocklist"]);
    selected = Array.isArray(data.selectedMobs) ? data.selectedMobs : [];
    blocklist = Array.isArray(data.mobBlocklist) ? data.mobBlocklist : [];
    render();
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    let dirty = false;
    if (changes.selectedMobs) {
      selected = Array.isArray(changes.selectedMobs.newValue)
        ? changes.selectedMobs.newValue
        : [];
      dirty = true;
    }
    if (changes.mobBlocklist) {
      blocklist = Array.isArray(changes.mobBlocklist.newValue)
        ? changes.mobBlocklist.newValue
        : [];
      dirty = true;
    }
    if (dirty) render();
  });

  load();
})();
