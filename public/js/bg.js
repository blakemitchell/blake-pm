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
  const travelers = window.blakeDebris || [];
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
      if (!travelers.length) return;
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
