(() => {
  const update = () => document.getElementById("header")?.classList.toggle("scrolled", window.scrollY > 24);
  document.addEventListener("scroll", update, { passive:true });
  document.addEventListener("DOMContentLoaded", update);
  document.addEventListener("astro:after-swap", update);
})();
