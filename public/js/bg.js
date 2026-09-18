(() => {
  const sky = document.getElementById("ambient-sky");
  const stars = document.getElementById("star-field");
  if (!sky || !stars) return;
  // A rich, static star field with depth tiers; moving objects are short-lived and never interactive.
  for (let i = 0; i < 680; i++) {
    const star = document.createElement("i");
    star.className = "sky-star";
    const size = i % 8 === 0 ? 2.2 : (i % 3 === 0 ? 1.4 : 0.9);
    const opacity = (size === 2.2 ? 0.45 : 0.25) + Math.random() * 0.55;
    star.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;opacity:${opacity.toFixed(2)};width:${size}px;height:${size}px`;
    stars.append(star);
  }
  const enabled = () => !document.hidden && document.documentElement.dataset.motion === "on";
  // Level 3 remains the baseline. Level 5 is twice the former maximum frequency.
  const frequencyFactor = [0, 2.2, 1.5, 1, 0.68, 0.21];
  const settings = { debris: 3, stars: 3 };
  const timers = {};
  const ranges = { meteor: [5000, 10000, "stars"], twinkle: [1200, 3000, "stars"], traveler: [30000, 48000, "debris"] };
  const travelers = [
    { min: 44, max: 66, svg: '<svg viewBox="0 0 80 40"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="29" y="14" width="22" height="14" rx="3" fill="currentColor" fill-opacity=".25"/><path d="M7 9h18v24H7zM55 9h18v24H55zM25 21h4m22 0h4M40 14V5m-5 0h10M16 9v24m48-24v24M7 17h18m-18 8h18m30-8h18m-18 8h18"/></g></svg>' },
    { min: 34, max: 65, svg: '<svg viewBox="0 0 64 56"><path d="M20 5C25 1 33 5 38 4c6-1 7 8 13 11 7 4 6 10 4 15 0 8-5 8-9 14-4 7-11 5-16 7-7 2-11-4-16-7C7 40 10 34 6 28 3 23 10 18 11 12c1-5 5-4 9-7Z" fill="currentColor" fill-opacity=".55" stroke="currentColor" stroke-width="1.3"/><g fill="var(--surface)" fill-opacity=".55" stroke="currentColor" stroke-opacity=".5"><ellipse cx="23" cy="19" rx="7" ry="5" transform="rotate(-25 23 19)"/><ellipse cx="40" cy="33" rx="8" ry="6"/><circle cx="21" cy="38" r="3"/><circle cx="41" cy="15" r="2"/></g></svg>' },
    { min: 48, max: 72, svg: '<svg viewBox="0 0 92 48"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M35 18h25v13H35zM47 18V8m-7 0h14M26 24h9m25 0h8"/><path d="M5 15h21v19H5zm63 2h19v15H68z" fill="currentColor" fill-opacity=".18"/><circle cx="47" cy="24" r="4"/><path d="M9 19h13M9 24h13M9 29h13m63-8h11m-11 6h11"/></g></svg>' },
    { min: 46, max: 70, svg: '<svg viewBox="0 0 94 52"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M39 20h22v15H39zM61 23l18-10v29L61 32M39 23 18 12v31l21-11"/><path d="M44 20 50 7l6 13M46 35v10h8V35"/><path d="M22 17v21m53-20v19" stroke-opacity=".65"/></g></svg>' },
    { min: 48, max: 76, svg: '<svg viewBox="0 0 100 50"><g fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 31 43 19 76 4l13 3-20 18-18 8-29 8Z" fill="currentColor" fill-opacity=".16"/><path d="m43 19 4-13 8-3 2 13M28 27 14 15l-6 2 8 18m50-8 12 14-8 4-18-12"/><circle cx="73" cy="14" r="2"/></g></svg>' },
    { min: 38, max: 62, svg: '<svg viewBox="0 0 54 90"><g fill="none" stroke="currentColor" stroke-width="1.7"><path d="M19 12Q27 1 35 12v54H19Z" fill="currentColor" fill-opacity=".16"/><path d="M19 27h16M16 66h22l5 14H11l5-14Zm3 0-7 10m23-10 7 10M27 4v8"/><path d="M22 35h10m-10 8h10m-10 8h10" stroke-opacity=".6"/></g></svg>' },
    { min: 32, max: 48, svg: '<svg viewBox="0 0 58 66"><g fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="29" cy="15" r="10" fill="currentColor" fill-opacity=".13"/><path d="M20 25h18l4 23-9 5H24l-9-5 5-23Zm-2 7L7 43m33-11 11 11M24 53l-4 10m13-10 5 10"/><path d="M23 14c4-3 8-3 12 0" stroke-opacity=".7"/></g></svg>' },
    { min: 32, max: 50, svg: '<svg viewBox="0 0 62 66"><g fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 21Q31 3 44 21l5 26H13l5-26Z" fill="currentColor" fill-opacity=".15"/><ellipse cx="31" cy="23" rx="9" ry="7"/><path d="M23 23c4-5 12-5 16 0M18 47l-8 12m34-12 8 12M23 47v10m16-10v10"/><circle cx="31" cy="19" r="2" fill="currentColor"/></g></svg>' },
  ];
  function schedule(kind) {
    clearTimeout(timers[kind]);
    const [min, max, setting] = ranges[kind];
    const factor = frequencyFactor[settings[setting]];
    timers[kind] = setTimeout(() => { if (enabled()) create(kind); schedule(kind); }, (min + Math.random() * (max-min)) * factor);
  }
  function create(kind) {
    if (kind === "traveler" && sky.querySelector(".sky-traveler")) return;
    const node = document.createElement("div");
    node.className = `sky-object sky-${kind}`;
    node.style.top = `${8+Math.random()*32}%`;
    if (kind === "meteor") {
      const angles = [-38, -27, -16, 18, 29, 41, 142, 158, 202, 218];
      node.style.left = `${8 + Math.random() * 84}%`;
      node.style.setProperty("--meteor-angle", `${angles[Math.floor(Math.random() * angles.length)]}deg`);
      node.style.setProperty("--meteor-distance", `${280 + Math.random() * 260}px`);
      node.style.setProperty("--meteor-width", `${70 + Math.random() * 75}px`);
    }
    if (kind === "traveler") {
      const duration = 24000 + Math.random() * 8000;
      const reverse = Math.random() > .5;
      const startY = 30 + Math.random() * innerHeight * .24;
      const endY = Math.max(20, Math.min(innerHeight * .55, startY + (Math.random()-.5)*innerHeight*.55));
      node.style.top = "0";
      node.style.setProperty("--start-x", reverse ? `${innerWidth+80}px` : "-80px");
      node.style.setProperty("--end-x", reverse ? "-80px" : `${innerWidth+80}px`);
      node.style.setProperty("--start-y", `${startY}px`);
      node.style.setProperty("--end-y", `${endY}px`);
      node.style.setProperty("--start-rotation", `${Math.random()*40-20}deg`);
      node.style.setProperty("--end-rotation", `${Math.random()*100-50}deg`);
      node.style.setProperty("--travel-time", `${duration}ms`);
      const traveler = travelers[Math.floor(Math.random() * travelers.length)];
      node.style.width = `${traveler.min + Math.random() * (traveler.max - traveler.min)}px`;
      node.innerHTML = traveler.svg;
    }
    if (kind === "twinkle") node.style.left = `${Math.random()*95}%`;
    sky.append(node);
    node.addEventListener("animationend", () => node.remove(), { once: true });
    setTimeout(() => node.remove(), kind === "traveler" ? 34000 : 5000);
  }
  schedule("meteor");
  schedule("twinkle");
  schedule("traveler");
  document.addEventListener("blake:motion-settings", event => {
    settings.debris = Math.min(5, Math.max(1, Number(event.detail?.debris) || 3));
    settings.stars = Math.min(5, Math.max(1, Number(event.detail?.stars) || 3));
    schedule("meteor"); schedule("twinkle"); schedule("traveler");
  });
  const clear = () => sky.querySelectorAll(".sky-object").forEach(node => node.remove());
  document.addEventListener("visibilitychange", () => { if (document.hidden) clear(); });
  new MutationObserver(() => { if (!enabled()) clear(); }).observe(document.documentElement, { attributes:true, attributeFilter:["data-motion"] });
})();
