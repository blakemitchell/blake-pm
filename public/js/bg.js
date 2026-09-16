(() => {
  const sky = document.getElementById("ambient-sky");
  const stars = document.getElementById("star-field");
  if (!sky || !stars) return;
  // A small, static star field; moving objects are short-lived and never interactive.
  for (let i = 0; i < 220; i++) {
    const star = document.createElement("i");
    star.className = "sky-star";
    star.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;opacity:${.32+Math.random()*.58};width:${i%5===0?2.2:1.3}px;height:${i%5===0?2.2:1.3}px`;
    stars.append(star);
  }
  const enabled = () => !document.hidden && document.documentElement.dataset.motion === "on";
  function schedule(kind, min, max) {
    setTimeout(() => { if (enabled()) create(kind); schedule(kind, min, max); }, min + Math.random() * (max-min));
  }
  function create(kind) {
    const node = document.createElement("div");
    node.className = `sky-object sky-${kind}`;
    node.style.top = `${8+Math.random()*32}%`;
    if (kind === "traveler") {
      const duration = 42000 + Math.random() * 18000;
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
      node.style.width = `${42+Math.random()*22}px`;
      node.innerHTML = Math.random() > .5
        ? '<svg viewBox="0 0 80 40"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="29" y="14" width="22" height="14" rx="3" fill="currentColor" fill-opacity=".25"/><path d="M7 9h18v24H7zM55 9h18v24H55zM25 21h4m22 0h4M40 14V5m-5 0h10M16 9v24m48-24v24M7 17h18m-18 8h18m30-8h18m-18 8h18"/></g></svg>'
        : '<svg viewBox="0 0 64 56"><path d="M20 5C25 1 33 5 38 4c6-1 7 8 13 11 7 4 6 10 4 15 0 8-5 8-9 14-4 7-11 5-16 7-7 2-11-4-16-7C7 40 10 34 6 28 3 23 10 18 11 12c1-5 5-4 9-7Z" fill="currentColor" fill-opacity=".55" stroke="currentColor" stroke-width="1.3"/><g fill="var(--surface)" fill-opacity=".55" stroke="currentColor" stroke-opacity=".5"><ellipse cx="23" cy="19" rx="7" ry="5" transform="rotate(-25 23 19)"/><ellipse cx="40" cy="33" rx="8" ry="6"/><circle cx="21" cy="38" r="3"/><circle cx="41" cy="15" r="2"/></g><path d="m10 28 6 2m14-23 4 5m-2 33 3 3" stroke="currentColor" stroke-opacity=".8" fill="none"/></svg>';

    }
    if (kind === "twinkle") node.style.left = `${Math.random()*95}%`;
    sky.append(node);
    node.addEventListener("animationend", () => node.remove(), { once: true });
    setTimeout(() => node.remove(), kind === "traveler" ? 62000 : 5000);
  }
  schedule("meteor", 17000, 32000);
  schedule("twinkle", 6000, 12000);
  schedule("traveler", 45000, 85000);
  const clear = () => sky.querySelectorAll(".sky-object").forEach(node => node.remove());
  document.addEventListener("visibilitychange", () => { if (document.hidden) clear(); });
  new MutationObserver(() => { if (!enabled()) clear(); }).observe(document.documentElement, { attributes:true, attributeFilter:["data-motion"] });
})();
