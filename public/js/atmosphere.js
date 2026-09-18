(() => {
  const root = document.documentElement;
  const panel = document.getElementById("atmosphere-panel");
  const trigger = document.getElementById("header-theme-button");
  const ship = document.getElementById("saucer");
  const ray = document.getElementById("saucer-ray");
  const notice = document.getElementById("surprise-notice");
  // Previous themes: Midnight (space), Deep Space (mono), Eclipse, Aurora, and Lunar Day.
  const names = { sol: "Sol", mercury: "Mercury", venus: "Venus", earth: "Earth", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", space: "Sagittarius A*", pluto: "Pluto" };
  const visibleThemes = ["sol", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "space"];
  const legacyThemes = { mono: "space", eclipse: "mars", aurora: "earth", lunar: "venus", system: "earth" };
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const system = matchMedia("(prefers-color-scheme: dark)");
  let choice = read("blake-atmosphere", "earth");
  if (choice in legacyThemes) choice = legacyThemes[choice];
  if (!(choice in names)) choice = "earth";
  let seen = read("blake-surprise-seen", "false") === "true";
  let allowed = read("blake-surprises", "true") !== "false";
  let motion = read("blake-motion", "true") !== "false";
  const clampFrequency = value => Math.min(5, Math.max(1, Number.parseInt(value, 10) || 3));
  let debrisFrequency = clampFrequency(read("blake-debris-frequency", "3"));
  let starFrequency = clampFrequency(read("blake-star-frequency", "3"));
  let auroraFrequency = clampFrequency(read("blake-aurora-frequency", "3"));
  let previous = null;
  let busy = false;
  let flight = null;
  let generation = 0;
  const current = () => choice;
  const frequencyLabels = ["", "Very low", "Low", "Balanced", "High", "Very high"];
  const auroraSpeeds = {
    1: ["20s", "17s", "22s"], 2: ["15s", "12s", "17s"], 3: ["11s", "9s", "12s"],
    4: ["8s", "6.5s", "9s"], 5: ["3.67s", "3s", "4.33s"],
  };
  function updateMotionSettings() {
    const settings = { debris: debrisFrequency, stars: starFrequency, aurora: auroraFrequency };
    root.dataset.debrisFrequency = String(debrisFrequency);
    root.dataset.starFrequency = String(starFrequency);
    root.dataset.auroraFrequency = String(auroraFrequency);
    const speeds = auroraSpeeds[auroraFrequency];
    root.style.setProperty?.("--aurora-curtain-speed", speeds[0]);
    root.style.setProperty?.("--aurora-primary-speed", speeds[1]);
    root.style.setProperty?.("--aurora-secondary-speed", speeds[2]);
    for (const [id, value] of [["debris", debrisFrequency], ["star", starFrequency], ["aurora", auroraFrequency]]) {
      document.getElementById(`${id}-frequency`).value = String(value);
      document.getElementById(`${id}-frequency-value`).textContent = frequencyLabels[value];
    }
    if (typeof CustomEvent === "function") document.dispatchEvent(new CustomEvent("blake:motion-settings", { detail: settings }));
  }
  const update = () => {
    document.getElementById("preference-status").textContent = "";
    const palette = current();
    root.dataset.atmosphere = palette;
    root.classList.toggle("dark", true);
    root.dataset.motion = motion && !reduced.matches ? "on" : "off";
    trigger.setAttribute("aria-label", `Choose atmosphere: ${names[palette]}`);
    panel.querySelectorAll("[data-theme-choice]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.themeChoice === palette)));
    document.getElementById("follow-system").checked = false;
    document.getElementById("ambient-motion").checked = motion && !reduced.matches;
    document.getElementById("ambient-motion").disabled = reduced.matches;
    document.getElementById("motion-frequencies").hidden = !motion || reduced.matches;
    document.getElementById("surprise-setting").hidden = !seen;
    document.getElementById("pluto-theme-choice").hidden = !seen;
    document.getElementById("allow-surprises").checked = allowed;
    document.getElementById("motion-help").textContent = reduced.matches ? "Off to respect your device’s reduced-motion setting" : "Stars, debris, aurora, and saucer flight";
    updateMotionSettings();
  };
  function apply(value) { choice = value; save("blake-atmosphere", value); update(); }
  function closePanel(focus = false) { panel.hidden = true; trigger.setAttribute("aria-expanded", "false"); if (focus) trigger.focus(); }
  function cancelFlight() {
    generation++; flight?.cancel(); flight = null; busy = false;
    ship.hidden = true; ray.hidden = true; ship.classList.remove("beaming"); trigger.classList.remove("alien-target");
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
  function positionPanel() {
    if (panel.hidden) return;
    const box = trigger.getBoundingClientRect();
    panel.style.top = `${box.bottom + 8}px`;
    panel.style.right = `${Math.max(12, innerWidth - box.right)}px`;
    panel.style.maxHeight = `calc(100svh - ${box.bottom + 20}px)`;
  }
  window.addEventListener("scroll", () => { positionPanel(); if (busy) cancelFlight(); }, { passive: true });
  window.addEventListener("resize", () => { positionPanel(); cancelFlight(); });
  function openPanel(tab = "themes") {
    panel.hidden = false; trigger.setAttribute("aria-expanded", "true"); selectTab(tab, true); positionPanel();
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
  document.getElementById("follow-system").addEventListener("change", () => apply("earth"));
  document.getElementById("ambient-motion").addEventListener("change", event => { motion = event.target.checked; save("blake-motion", motion); cancelFlight(); update(); });
  for (const id of ["debris", "star", "aurora"]) {
    document.getElementById(`${id}-frequency`).addEventListener("input", event => {
      const value = clampFrequency(event.target.value);
      if (id === "debris") debrisFrequency = value;
      if (id === "star") starFrequency = value;
      if (id === "aurora") auroraFrequency = value;
      save(`blake-${id}-frequency`, value);
      updateMotionSettings();
    });
  }
  function setAllowed(value) { allowed = value; save("blake-surprises", allowed); update(); }
  document.getElementById("allow-surprises").addEventListener("change", event => setAllowed(event.target.checked));
  document.getElementById("reset-atmosphere").addEventListener("click", () => {
    cancelFlight(); dismissNotice(); previous = null;
    motion = true; allowed = true; debrisFrequency = starFrequency = auroraFrequency = 3;
    save("blake-motion", true); save("blake-surprises", true); save("blake-debris-frequency", 3); save("blake-star-frequency", 3); save("blake-aurora-frequency", 3); apply("earth");
    document.getElementById("preference-status").textContent = "Defaults restored: Earth, motion on, balanced frequencies, surprises allowed.";
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
    try {
      if (motion && !reduced.matches) {
        ship.hidden = false;
        flight = ship.animate([{ transform: `translate(${-innerWidth}px, 55px) rotate(-10deg)` }, { transform: "translate(0, 0) rotate(0deg)" }], { duration: 4200, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
        await flight.finished;
        if (ticket !== generation) return;
        const box = trigger.getBoundingClientRect();
        const center = (box.left + box.right) / 2;
        const targetY = box.top + box.height / 2;
        const saucerY = y + 20;
        const topY = -10;
        const dy = targetY - saucerY;
        const leftX = x + 55;
        const rightX = x + 65;
        const targetHalfWidth = Math.max(20, box.width / 2 + 3);
        const leftSlope = ((center - targetHalfWidth) - leftX) / dy;
        const rightSlope = ((center + targetHalfWidth) - rightX) / dy;
        const topLeftX = leftX + (topY - saucerY) * leftSlope;
        const topRightX = rightX + (topY - saucerY) * rightSlope;
        document.getElementById("saucer-ray-path").setAttribute("d", `M ${leftX} ${saucerY} L ${topLeftX.toFixed(1)} ${topY} L ${topRightX.toFixed(1)} ${topY} L ${rightX} ${saucerY} Z`);
        ray.hidden = false;
        await delay(450);
        if (ticket !== generation) return;
        trigger.classList.add("alien-target");
        await delay(1150);
      }
      if (ticket !== generation || document.hidden) return;
      previous = choice;
      const alternatives = visibleThemes.filter(value => value !== current());
      apply(alternatives[Math.floor(Math.random() * alternatives.length)]);
      seen = true; save("blake-surprise-seen", true); update();
      document.getElementById("surprise-message").textContent = `A visitor selected ${names[current()]} for you.`;
      undo.disabled = false;
      notice.hidden = false; scheduleDismiss();
      if (motion && !reduced.matches) {
        await delay(1200);
        if (ticket !== generation) return;
        ray.hidden = true; trigger.classList.remove("alien-target");
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
