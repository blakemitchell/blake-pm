(() => {
  const field = document.getElementById("social-starfield");
  if (!field) return;

  const starCount = Math.max(150, Math.round(innerWidth * 0.14));
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("i");
    star.className = "social-star";
    const roll = Math.random();
    const size = roll > 0.94 ? 2.2 : roll > 0.72 ? 1.4 : 0.8;
    star.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;opacity:${(0.2 + Math.random() * 0.62).toFixed(2)}`;
    field.append(star);
  }

  const enabled = () => !document.hidden && document.documentElement.dataset.motion === "on";
  const create = kind => {
    const item = document.createElement("i");
    item.className = `social-${kind}`;
    item.style.left = `${4 + Math.random() * 90}%`;
    item.style.top = `${8 + Math.random() * 78}%`;
    if (kind === "meteor") {
      const angles = [-34, -20, 24, 38, 146, 164, 198, 216];
      item.style.setProperty("--meteor-angle", `${angles[Math.floor(Math.random() * angles.length)]}deg`);
      item.style.setProperty("--meteor-distance", `${240 + Math.random() * 220}px`);
      item.style.setProperty("--meteor-width", `${65 + Math.random() * 70}px`);
    }
    field.append(item);
    item.addEventListener("animationend", () => item.remove(), { once: true });
    setTimeout(() => item.remove(), 5000);
  };
  const schedule = (kind, min, max) => setTimeout(() => {
    if (enabled()) create(kind);
    schedule(kind, min, max);
  }, min + Math.random() * (max - min));

  schedule("meteor", 7000, 14000);
  schedule("twinkle", 1800, 4200);
})();
