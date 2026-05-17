(() => {
  const HOST_CLASS = "tabsorg-mob-host";
  let host = null;
  let selected = [];
  let blocklist = [];
  let danceMode = false;
  let danceRaf = null;
  let danceLastT = 0;
  let danceMobs = [];

  function matchesPattern(pattern, hostname, url) {
    if (!pattern) return false;
    const p = pattern.toLowerCase().trim();
    if (!p) return false;
    if (p.includes("*")) {
      const escaped = p
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\\*/g, ".*");
      const re = new RegExp("^" + escaped + "$", "i");
      return re.test(hostname) || re.test(url);
    }
    if (hostname === p) return true;
    if (hostname.endsWith("." + p)) return true;
    return url.toLowerCase().includes(p);
  }

  function isBlocked() {
    if (!blocklist.length) return false;
    const hostname = location.hostname.toLowerCase();
    const url = location.href;
    return blocklist.some((p) => matchesPattern(p, hostname, url));
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
      if (danceMode) return;
      stopFall();
      isDragging = true;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startDragX = dragX;
      startDragY = dragY;
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

  function stopDance() {
    if (danceRaf !== null) cancelAnimationFrame(danceRaf);
    danceRaf = null;
    if (host) host.classList.remove("tabsorg-dance");
    danceMobs.forEach((m) => {
      m.el.style.transform = "";
      m.el.style.left = "";
      m.el.style.top = "";
    });
    danceMobs = [];
  }

  function startDance() {
    if (!host) return;
    host.classList.add("tabsorg-dance");
    const mobs = Array.from(host.querySelectorAll(".tabsorg-mob"));
    const W = window.innerWidth;
    const H = window.innerHeight;
    const SIZE = 40;
    danceMobs = mobs.map((el) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 260 + Math.random() * 260;
      return {
        el,
        x: Math.random() * (W - SIZE),
        y: Math.random() * (H - SIZE - 60),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 900,
        nextKick: 0,
      };
    });
    danceLastT = performance.now();
    danceRaf = requestAnimationFrame(danceTick);
  }

  function danceTick(now) {
    const dt = Math.min((now - danceLastT) / 1000, 0.05);
    danceLastT = now;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const SIZE = 40;
    danceMobs.forEach((m) => {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.rot += m.rotV * dt;
      if (m.x < 0) { m.x = 0; m.vx = Math.abs(m.vx); m.rotV = -m.rotV; }
      if (m.x > W - SIZE) { m.x = W - SIZE; m.vx = -Math.abs(m.vx); m.rotV = -m.rotV; }
      if (m.y < 0) { m.y = 0; m.vy = Math.abs(m.vy); }
      if (m.y > H - SIZE) { m.y = H - SIZE; m.vy = -Math.abs(m.vy); }
      m.nextKick -= dt;
      if (m.nextKick <= 0) {
        m.vx += (Math.random() - 0.5) * 180;
        m.vy += (Math.random() - 0.5) * 180;
        m.rotV = (Math.random() - 0.5) * 900;
        m.nextKick = 0.6 + Math.random() * 1.2;
      }
      m.el.style.left = "0";
      m.el.style.top = "0";
      m.el.style.transform = `translate(${m.x}px, ${m.y}px) rotate(${m.rot}deg)`;
    });
    danceRaf = requestAnimationFrame(danceTick);
  }

  function applyDance() {
    if (danceMode && selected.length && !isBlocked() && host) {
      stopDance();
      startDance();
    } else {
      stopDance();
    }
  }

  function render() {
    stopDance();
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
    applyDance();
  }

  async function load() {
    const data = await chrome.storage.sync.get(["selectedMobs", "mobBlocklist", "danceMode"]);
    selected = Array.isArray(data.selectedMobs) ? data.selectedMobs : [];
    blocklist = Array.isArray(data.mobBlocklist) ? data.mobBlocklist : [];
    danceMode = !!data.danceMode;
    render();
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    let rerender = false;
    let danceOnly = false;
    if (changes.selectedMobs) {
      selected = Array.isArray(changes.selectedMobs.newValue)
        ? changes.selectedMobs.newValue
        : [];
      rerender = true;
    }
    if (changes.mobBlocklist) {
      blocklist = Array.isArray(changes.mobBlocklist.newValue)
        ? changes.mobBlocklist.newValue
        : [];
      rerender = true;
    }
    if (changes.danceMode) {
      danceMode = !!changes.danceMode.newValue;
      danceOnly = true;
    }
    if (rerender) render();
    else if (danceOnly) applyDance();
  });

  window.addEventListener("resize", () => {
    if (danceMode) {
      stopDance();
      startDance();
    }
  });

  load();
})();
