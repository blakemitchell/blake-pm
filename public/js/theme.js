// Set the palette before the page paints; storage may be unavailable in private contexts.
(() => {
  const root = document.documentElement;
  const palettes = ["sol", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "space", "pluto"];
  const legacyThemes = { mono: "space", eclipse: "mars", aurora: "earth", lunar: "venus", system: "earth" };
  let choice = "earth";
  try { choice = localStorage.getItem("blake-atmosphere") || "earth"; } catch {}
  choice = legacyThemes[choice] || choice;
  if (!palettes.includes(choice)) choice = "earth";
  const palette = choice;
  root.dataset.atmosphere = palette;
  root.classList.toggle("dark", true);
})();
