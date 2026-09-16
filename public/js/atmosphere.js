(() => {
  const root = document.documentElement;
  const panel = document.getElementById("atmosphere-panel");
  const trigger = document.getElementById("header-theme-button");
  const ship = document.getElementById("saucer");
  const notice = document.getElementById("surprise-notice");
  const names = { space: "Midnight", mono: "Deep Space", eclipse: "Eclipse", aurora: "Aurora", lunar: "Lunar Day" };
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const system = matchMedia("(prefers-color-scheme: dark)");
  let choice = read("blake-atmosphere", "space");
  if (!(choice in names) && choice !== "system") choice = "space";
  let seen = read("blake-surprise-seen", "false") === "true";
  let allowed = read("blake-surprises", "true") !== "false";
  let motion = read("blake-motion", "true") !== "false";
  let previous = null;
  let busy = false;
  let flight = null;
  let generation = 0;
  const current = () => choice === "system" ? (system.matches ? "space" : "lunar") : choice;
  const update = () => {
    document.getElementById("preference-status").textContent = "";
    const palette = current();
    root.dataset.atmosphere = palette;
    root.classList.toggle("dark", palette !== "lunar");
    root.dataset.motion = motion && !reduced.matches ? "on" : "off";
    trigger.setAttribute("aria-label", `Choose atmosphere: ${names[palette]}`);
    panel.querySelectorAll("[data-theme-choice]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.themeChoice === palette)));
    document.getElementById("follow-system").checked = choice === "system";
    document.getElementById("ambient-motion").checked = motion && !reduced.matches;
    document.getElementById("ambient-motion").disabled = reduced.matches;
    document.getElementById("surprise-setting").hidden = !seen;
    document.getElementById("allow-surprises").checked = allowed;
    document.getElementById("motion-help").textContent = reduced.matches ? "Off to respect your device’s reduced-motion setting" : "Stars, passing objects, and saucer flight";
  };
  function apply(value) { choice = value; save("blake-atmosphere", value); update(); }
  function closePanel(focus = false) { panel.hidden = true; trigger.setAttribute("aria-expanded", "false"); if (focus) trigger.focus(); }
  function cancelFlight() {
    generation++; flight?.cancel(); flight = null; busy = false;
    ship.hidden = true; ship.classList.remove("beaming"); trigger.classList.remove("alien-target");
    document.getElementById("summon-saucer").disabled = false;
  }
  function selectTab(tab, focus = false) {
    for (const name of ["themes", "options"]) {
      const button = document.getElementById(`${name}-tab`);
      const active = name === tab;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      document.getElementById(`${name}-panel`).hidden = !active;
      if (active && focus) button.focus();
    }
  }
  function openPanel(tab = "themes") {
    panel.hidden = false; trigger.setAttribute("aria-expanded", "true"); selectTab(tab, true);
  }
  for (const name of ["themes", "options"]) {
    const tab = document.getElementById(`${name}-tab`);
    tab.addEventListener("click", () => selectTab(name));
    tab.addEventListener("keydown", event => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        selectTab(event.key === "Home" ? "themes" : event.key === "End" ? "options" : name === "themes" ? "options" : "themes", true);
      }
    });
  }
  trigger.addEventListener("click", () => { if (panel.hidden) openPanel(); else closePanel(); });
  document.addEventListener("pointerdown", event => { if (!panel.contains(event.target) && !trigger.contains(event.target)) closePanel(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") { if (!panel.hidden) closePanel(true); else if (!notice.hidden) notice.hidden = true; } });
  panel.addEventListener("focusout", () => { setTimeout(() => { if (!panel.contains(document.activeElement) && document.activeElement !== trigger) closePanel(); }, 0); });
  panel.querySelectorAll("[data-theme-choice]").forEach(button => button.addEventListener("click", () => {
    cancelFlight(); notice.hidden = true; previous = null; apply(button.dataset.themeChoice); closePanel(true);
  }));
  document.getElementById("follow-system").addEventListener("change", event => { cancelFlight(); notice.hidden = true; previous = null; apply(event.target.checked ? "system" : current()); });
  document.getElementById("ambient-motion").addEventListener("change", event => { motion = event.target.checked; save("blake-motion", motion); cancelFlight(); update(); });
  function setAllowed(value) { allowed = value; save("blake-surprises", allowed); update(); }
  document.getElementById("allow-surprises").addEventListener("change", event => setAllowed(event.target.checked));
  document.getElementById("reset-atmosphere").addEventListener("click", () => {
    cancelFlight(); dismissNotice(); previous = null;
    motion = true; allowed = true; save("blake-motion", true); save("blake-surprises", true); apply("space");
    document.getElementById("preference-status").textContent = "Defaults restored: Midnight, motion on, surprises allowed.";
  });
  let noticeTimer;
  function pauseNotice() { clearTimeout(noticeTimer); }
  function dismissNotice() { pauseNotice(); notice.hidden = true; }
  function scheduleDismiss(ms = 12000) {
    pauseNotice();
    if (!notice.hidden && !notice.matches(":hover") && !notice.contains(document.activeElement) && !document.hidden) {
      noticeTimer = setTimeout(dismissNotice, ms);
    }
  }
  notice.addEventListener("pointerenter", pauseNotice);
  notice.addEventListener("pointerleave", () => scheduleDismiss());
  notice.addEventListener("focusin", pauseNotice);
  notice.addEventListener("focusout", () => setTimeout(() => scheduleDismiss(), 0));
  const undo = document.getElementById("undo-theme");
  undo.addEventListener("click", () => {
    if (previous === null) return;
    cancelFlight(); apply(previous); previous = null; undo.disabled = true;
    document.getElementById("surprise-message").textContent = "Your previous atmosphere is restored.";
    trigger.focus({ preventScroll: true }); scheduleDismiss(5000);
  });
  document.getElementById("surprise-options").addEventListener("click", () => { dismissNotice(); openPanel("options"); });
  document.getElementById("dismiss-surprise").addEventListener("click", () => { dismissNotice(); trigger.focus(); });
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function summon(automatic = false) {
    if (busy || document.hidden || (automatic && (!allowed || reduced.matches || !motion))) return;
    closePanel(); if (!automatic) trigger.focus({ preventScroll: true }); busy = true;
    const ticket = ++generation;
    document.getElementById("summon-saucer").disabled = true;
    notice.hidden = true;
    const target = trigger.getBoundingClientRect();
    const x = Math.min(innerWidth - 126, Math.max(6, target.left - 43));
    const y = Math.max(76, target.bottom + 55);
    ship.style.left = `${x}px`; ship.style.top = `${y}px`;
    trigger.classList.add("alien-target");
    try {
      if (motion && !reduced.matches) {
        ship.hidden = false;
        flight = ship.animate([{ transform: `translate(${-innerWidth}px, 55px) rotate(-10deg)` }, { transform: "translate(0, 0) rotate(0deg)" }], { duration: 4200, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
        await flight.finished;
        ship.classList.add("beaming");
        await delay(1600);
      }
      if (ticket !== generation || document.hidden) return;
      previous = choice;
      const alternatives = Object.keys(names).filter(value => value !== current());
      apply(alternatives[Math.floor(Math.random() * alternatives.length)]);
      seen = true; save("blake-surprise-seen", true); update();
      document.getElementById("surprise-message").textContent = `A visitor selected ${names[current()]} for you.`;
      undo.disabled = false;
      notice.hidden = false; scheduleDismiss();
      if (motion && !reduced.matches) {
        await delay(1200);
        if (ticket !== generation) return;
        ship.classList.remove("beaming");
        flight = ship.animate([{ transform: "translate(0, 0) rotate(0deg)" }, { transform: `translate(${innerWidth}px, -160px) rotate(12deg)` }], { duration: 3200, easing: "ease-in", fill: "forwards" });
        await flight.finished;
      }
    } catch { /* A hidden tab or user preference change cancels the flight. */ }
    finally { if (ticket === generation) cancelFlight(); }
  }
  document.getElementById("summon-saucer").addEventListener("click", () => summon());
  system.addEventListener("change", update);
  reduced.addEventListener("change", () => { cancelFlight(); update(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { cancelFlight(); pauseNotice(); } else scheduleDismiss(); });
  // One automatic encounter per local calendar day, while this page is visible.
  setInterval(() => {
    const date = new Date();
    const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    if (date.getHours() === 11 && date.getMinutes() === 11 && date.getSeconds() === 11 && !document.hidden && allowed && motion && !reduced.matches && !busy && read("blake-surprise-day", "") !== day) {
      save("blake-surprise-day", day); summon(true);
    }
  }, 500);
  update();
})();
