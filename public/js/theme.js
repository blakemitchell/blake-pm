// Set the palette before the page paints; storage may be unavailable in private contexts.
(() => {
  const root = document.documentElement;
  const palettes = ["space", "mono", "eclipse", "aurora", "lunar"];
  let choice = "space";
  try { choice = localStorage.getItem("blake-atmosphere") || "space"; } catch {}
  if (!palettes.includes(choice) && choice !== "system") choice = "space";
  const palette = choice === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "space" : "lunar") : choice;
  root.dataset.atmosphere = palette;
  root.classList.toggle("dark", palette !== "lunar");
})();
